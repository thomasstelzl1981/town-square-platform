/**
 * useArmstrongDocUpload — Upload + Parse documents for Armstrong chat context
 * 
 * Architecture (v2 — Storage-First):
 *   File → Storage upload → sot-document-parser (storagePath) → extracted_text → Armstrong advisor
 * 
 * This avoids the Edge Function body-size limit by uploading to Storage first,
 * then passing only the storagePath to the parser. Supports files up to 20MB.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DocumentContext {
  extracted_text: string;
  filename: string;
  content_type: string;
  confidence: number;
  /** Auto-detected Magic Intake suggestion (if any) */
  suggestedIntake?: {
    action_code: string;
    label: string;
    module: string;
  } | null;
}

interface UseArmstrongDocUploadReturn {
  /** Upload and parse a file, returns extracted document context */
  uploadAndParse: (file: File) => Promise<DocumentContext | null>;
  /** Currently attached document context (ready to send with next message) */
  documentContext: DocumentContext | null;
  /** Clear the attached document */
  clearDocument: () => void;
  /** Is currently uploading/parsing */
  isParsing: boolean;
  /** Error message if parsing failed */
  parseError: string | null;
  /** Attached file info for UI display */
  attachedFile: { name: string; size: number; type: string } | null;
}

const SUPPORTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// =============================================================================
// DOCUMENT INTENT DETECTION — proactive Magic Intake suggestion
// =============================================================================

interface IntakeRule {
  action_code: string;
  label: string;
  module: string;
  filenamePatterns: RegExp[];
  textPatterns: RegExp[];
}

const INTAKE_RULES: IntakeRule[] = [
  {
    action_code: 'ARM.MOD04.MAGIC_INTAKE_PROPERTY',
    label: 'Immobilie aus Dokument anlegen',
    module: 'MOD-04',
    filenamePatterns: [/kaufvertrag/i, /exposé/i, /expose/i, /grundbuch/i, /immobilie/i],
    textPatterns: [/grundbuch/i, /kaufvertrag/i, /flurstück/i, /wohnfläche/i, /mieteinnahmen/i, /exposé/i],
  },
  {
    action_code: 'ARM.MOD07.MAGIC_INTAKE_SELBSTAUSKUNFT',
    label: 'Selbstauskunft befüllen',
    module: 'MOD-07',
    filenamePatterns: [/selbstauskunft/i, /gehalt/i, /lohn/i, /einkommens/i, /steuerbescheid/i],
    textPatterns: [/nettoeinkommen/i, /bruttoeinkommen/i, /gehalt/i, /arbeitgeber/i, /steuerbescheid/i, /einkommensteuer/i],
  },
  {
    action_code: 'ARM.MOD11.MAGIC_INTAKE_CASE',
    label: 'Finanzierungsfall anlegen',
    module: 'MOD-11',
    filenamePatterns: [/finanzierung/i, /darlehen/i, /kredit/i],
    textPatterns: [/darlehensbetrag/i, /finanzierungsanfrage/i, /kreditvertrag/i, /tilgung/i, /sollzins/i],
  },
  {
    action_code: 'ARM.MOD18.MAGIC_INTAKE_FINANCE',
    label: 'Finanzdaten erfassen',
    module: 'MOD-18',
    filenamePatterns: [/versicherung/i, /police/i, /kontoauszug/i],
    textPatterns: [/versicherungsschein/i, /polizzennummer/i, /versicherungsnehmer/i, /kontoauszug/i, /abonnement/i],
  },
  {
    action_code: 'ARM.MOD20.MAGIC_INTAKE_CONTRACT',
    label: 'Vertrag aus Dokument anlegen',
    module: 'MOD-20',
    filenamePatterns: [/mietvertrag/i, /miet/i, /nebenkosten/i],
    textPatterns: [/mietvertrag/i, /mieter/i, /vermieter/i, /kaltmiete/i, /nebenkostenabrechnung/i],
  },
  {
    action_code: 'ARM.MOD17.MAGIC_INTAKE_VEHICLE',
    label: 'Fahrzeug aus Dokument anlegen',
    module: 'MOD-17',
    filenamePatterns: [/fahrzeug/i, /kfz/i, /zulassung/i, /fahrzeugschein/i, /fahrzeugbrief/i],
    textPatterns: [/fahrzeugidentnummer/i, /zulassungsbescheinigung/i, /fahrzeugschein/i, /fahrgestellnummer/i],
  },
  {
    action_code: 'ARM.MOD19.MAGIC_INTAKE_PLANT',
    label: 'PV-Anlage aus Dokument anlegen',
    module: 'MOD-19',
    filenamePatterns: [/photovoltaik/i, /solar/i, /pv/i, /einspeise/i],
    textPatterns: [/photovoltaik/i, /einspeisevergütung/i, /solarmodul/i, /wechselrichter/i, /kwp/i],
  },
];

function detectDocumentIntent(
  filename: string,
  extractedText: string
): DocumentContext['suggestedIntake'] | null {
  const textSample = extractedText.slice(0, 3000); // check first 3000 chars

  for (const rule of INTAKE_RULES) {
    const fnMatch = rule.filenamePatterns.some(p => p.test(filename));
    const txtMatch = rule.textPatterns.filter(p => p.test(textSample)).length;

    // filename match alone or 2+ text pattern matches
    if (fnMatch || txtMatch >= 2) {
      return {
        action_code: rule.action_code,
        label: rule.label,
        module: rule.module,
      };
    }
  }

  return null;
}

export function useArmstrongDocUpload(): UseArmstrongDocUploadReturn {
  const { activeTenantId } = useAuth();
  const [documentContext, setDocumentContext] = useState<DocumentContext | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; type: string } | null>(null);

  const uploadAndParse = useCallback(async (file: File): Promise<DocumentContext | null> => {
    // Validate file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setParseError(`Dateityp "${file.type}" wird nicht unterstützt. Erlaubt: PDF, Bilder, DOCX, Excel, CSV.`);
      return null;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setParseError('Datei ist zu groß (max. 20 MB).');
      return null;
    }

    if (!activeTenantId) {
      setParseError('Kein aktiver Tenant.');
      return null;
    }

    setIsParsing(true);
    setParseError(null);
    setAttachedFile({ name: file.name, size: file.size, type: file.type });

    try {
      // ── Step 1: Upload to Storage ──────────────────────────────────────
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${activeTenantId}/armstrong/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-documents')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);
      }

      if (import.meta.env.DEV) { console.log(`[ArmstrongDocUpload] Uploaded to storage: ${storagePath} (${(file.size / 1024).toFixed(0)}KB)`); }

      // ── Step 2: Call parser with storagePath ───────────────────────────
      const { data, error } = await supabase.functions.invoke('sot-document-parser', {
        body: {
          storagePath,
          bucket: 'tenant-documents',
          contentType: file.type,
          filename: file.name,
          tenantId: activeTenantId,
          parseMode: 'general',
        },
      });

      if (error) throw new Error(error.message || 'Parser-Fehler');
      if (!data?.success) throw new Error(data?.error || 'Parsing fehlgeschlagen');

      const parsed = data.parsed;
      
      // Build extracted text from parsed data
      let extractedText = '';
      
      if (parsed.data?.raw_text) {
        extractedText = parsed.data.raw_text;
      } else {
        const parts: string[] = [];
        
        if (parsed.data?.detected_type) {
          parts.push(`Dokumenttyp: ${parsed.data.detected_type}`);
        }
        
        if (parsed.data?.properties?.length) {
          parts.push(`\nImmobilien:\n${JSON.stringify(parsed.data.properties, null, 2)}`);
        }
        
        if (parsed.data?.contacts?.length) {
          parts.push(`\nKontakte:\n${JSON.stringify(parsed.data.contacts, null, 2)}`);
        }
        
        if (parsed.data?.financing?.length) {
          parts.push(`\nFinanzierung:\n${JSON.stringify(parsed.data.financing, null, 2)}`);
        }
        
        extractedText = parts.join('\n') || JSON.stringify(parsed.data, null, 2);
      }

      // ── Detect document intent for proactive Magic Intake suggestion ──
      const suggestedIntake = detectDocumentIntent(file.name, extractedText);

      const ctx: DocumentContext = {
        extracted_text: extractedText,
        filename: file.name,
        content_type: file.type,
        confidence: parsed.confidence || 0.5,
        suggestedIntake,
      };

      if (suggestedIntake) {
        if (import.meta.env.DEV) { console.log(`[ArmstrongDocUpload] Detected intake: ${suggestedIntake.action_code} (${suggestedIntake.label})`); }
      }

      setDocumentContext(ctx);

      // ── Step 3: Cleanup temp file from storage (fire-and-forget) ───────
      supabase.storage.from('tenant-documents').remove([storagePath]).catch(() => {});

      return ctx;
    } catch (err) {
      console.error('[useArmstrongDocUpload] Error:', err);
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setParseError(`Dokument konnte nicht analysiert werden: ${msg}`);
      setAttachedFile(null);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, [activeTenantId]);

  const clearDocument = useCallback(() => {
    setDocumentContext(null);
    setAttachedFile(null);
    setParseError(null);
  }, []);

  return {
    uploadAndParse,
    documentContext,
    clearDocument,
    isParsing,
    parseError,
    attachedFile,
  };
}
