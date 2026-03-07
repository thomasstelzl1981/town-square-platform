/**
 * useArmstrongDocUpload — Upload + Parse documents for Armstrong chat context
 * 
 * Architecture (v4 — SSOT-Compliant):
 *   File → Storage upload (tenant-documents, MOD_00 path) → Register in documents + storage_nodes
 *   → sot-document-parser (storagePath) → extracted_text → Armstrong advisor
 * 
 * Files are now PERSISTED in the DMS (not deleted after parsing).
 * Path: {tenant_id}/MOD_00/{project_id|general}/{timestamp}_{filename}
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { buildStoragePath, UPLOAD_BUCKET } from '@/config/storageManifest';

export interface DocumentContext {
  extracted_text: string;
  filename: string;
  content_type: string;
  confidence: number;
  /** Storage path where the file is persisted */
  storagePath?: string;
  /** Document ID in the documents table */
  documentId?: string;
  /** Auto-detected Magic Intake suggestion (if any) */
  suggestedIntake?: {
    action_code: string;
    label: string;
    module: string;
  } | null;
}

interface UseArmstrongDocUploadReturn {
  /** Upload and parse a file, returns extracted document context */
  uploadAndParse: (file: File, projectId?: string | null) => Promise<DocumentContext | null>;
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

// Expanded supported MIME types — maximum coverage
const SUPPORTED_TYPES = [
  // Documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  // Spreadsheets
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  // Images
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml',
  // Text
  'text/plain', 'text/markdown', 'text/html', 'text/xml',
  'application/json', 'application/xml', 'text/yaml',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg', 'audio/webm',
  // Archives
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
];

const SUPPORTED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.rtf', '.odt', '.ods', '.odp',
  '.csv', '.xlsx', '.xls',
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg',
  '.txt', '.md', '.json', '.xml', '.yaml', '.yml', '.html', '.htm',
  '.mp3', '.wav', '.m4a', '.ogg',
  '.zip', '.rar', '.7z',
  '.mp4', '.mov', '.avi', '.mkv',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
  const textSample = extractedText.slice(0, 3000);
  for (const rule of INTAKE_RULES) {
    const fnMatch = rule.filenamePatterns.some(p => p.test(filename));
    const txtMatch = rule.textPatterns.filter(p => p.test(textSample)).length;
    if (fnMatch || txtMatch >= 2) {
      return { action_code: rule.action_code, label: rule.label, module: rule.module };
    }
  }
  return null;
}

function isFileSupported(file: File): boolean {
  if (SUPPORTED_TYPES.includes(file.type)) return true;
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function useArmstrongDocUpload(): UseArmstrongDocUploadReturn {
  const { activeTenantId } = useAuth();
  const [documentContext, setDocumentContext] = useState<DocumentContext | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; type: string } | null>(null);

  const uploadAndParse = useCallback(async (file: File, projectId?: string | null): Promise<DocumentContext | null> => {
    if (!isFileSupported(file)) {
      setParseError(`Dateityp "${file.type || file.name.split('.').pop()}" wird nicht unterstützt.`);
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      setParseError(`Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 50 MB.`);
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
      // ── Step 1: Upload to Storage via SSOT path ──────────────────────
      const entityId = projectId || 'general';
      const storagePath = buildStoragePath(activeTenantId, 'MOD_00', entityId, file.name);

      const { error: uploadError } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);

      if (import.meta.env.DEV) {
        console.log(`[ArmstrongDocUpload] SSOT upload: ${storagePath} (${(file.size / 1024).toFixed(0)}KB)`);
      }

      // ── Step 2: Register in documents table ──────────────────────────
      const publicId = crypto.randomUUID().substring(0, 8).toUpperCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: docData, error: docError } = await (supabase as any)
        .from('documents')
        .insert({
          tenant_id: activeTenantId,
          name: file.name,
          file_path: storagePath,
          mime_type: file.type,
          size_bytes: file.size,
          public_id: publicId,
          source: 'armstrong_workspace',
          extraction_status: 'pending',
          doc_type: null,
        })
        .select('id')
        .single();

      const documentId = docData?.id as string | undefined;
      if (docError) {
        console.error('[ArmstrongDocUpload] Document insert error:', docError);
      }

      // ── Step 3: Register in storage_nodes ─────────────────────────────
      if (documentId) {
        const { data: rootNode } = await supabase
          .from('storage_nodes')
          .select('id')
          .eq('tenant_id', activeTenantId)
          .eq('template_id', 'MOD_00_ROOT')
          .maybeSingle();

        const parentId = rootNode?.id || null;
        if (parentId) {
          await supabase.from('storage_nodes').insert({
            tenant_id: activeTenantId,
            parent_id: parentId,
            name: file.name,
            node_type: 'file',
            module_code: 'MOD_00',
            storage_path: storagePath,
            mime_type: file.type,
          });
        }
      }

      // ── Step 4: Call parser with storagePath ──────────────────────────
      const { data, error } = await supabase.functions.invoke('sot-document-parser', {
        body: {
          storagePath,
          bucket: UPLOAD_BUCKET,
          contentType: file.type,
          filename: file.name,
          tenantId: activeTenantId,
          documentId,
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
        if (parsed.data?.detected_type) parts.push(`Dokumenttyp: ${parsed.data.detected_type}`);
        if (parsed.data?.properties?.length) parts.push(`\nImmobilien:\n${JSON.stringify(parsed.data.properties, null, 2)}`);
        if (parsed.data?.contacts?.length) parts.push(`\nKontakte:\n${JSON.stringify(parsed.data.contacts, null, 2)}`);
        if (parsed.data?.financing?.length) parts.push(`\nFinanzierung:\n${JSON.stringify(parsed.data.financing, null, 2)}`);
        extractedText = parts.join('\n') || JSON.stringify(parsed.data, null, 2);
      }

      // ── Step 5: Update document extraction status ─────────────────────
      if (documentId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('documents')
          .update({
            extraction_status: 'done',
            ai_summary: parsed.data?.detected_type || null,
            detected_type: parsed.data?.detected_type || null,
          })
          .eq('id', documentId);
      }

      // ── Detect document intent for proactive Magic Intake suggestion ──
      const suggestedIntake = detectDocumentIntent(file.name, extractedText);

      const ctx: DocumentContext = {
        extracted_text: extractedText,
        filename: file.name,
        content_type: file.type,
        confidence: parsed.confidence || 0.5,
        storagePath,
        documentId,
        suggestedIntake,
      };

      if (suggestedIntake && import.meta.env.DEV) {
        console.log(`[ArmstrongDocUpload] Detected intake: ${suggestedIntake.action_code} (${suggestedIntake.label})`);
      }

      setDocumentContext(ctx);
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
