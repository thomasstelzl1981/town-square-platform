/**
 * useDocumentIntake — Manifest-driven document intake orchestrator.
 * 
 * Wraps useUniversalUpload and adds manifest-aware parsing:
 *   1. Upload     → File to Storage (Phase 1 via useUniversalUpload)
 *   2. Parse      → sot-document-parser with manifest-driven parseMode
 *   3. Preview    → Returns structured records for user confirmation
 *   4. File       → Move/copy file to correct DMS folder
 *   5. Write      → Insert extracted data into target DB table
 * 
 * @see src/config/parserManifest.ts — SSOT for field definitions
 * @see src/types/parser-engine.ts — TypeScript types
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { PARSER_PROFILES, getParserProfile, resolveLegacyMode } from '@/config/parserManifest';
import type { ParserMode, ParserEngineResponse, IntakeStep, IntakeProgress, IntakeResult, ExtractedRecord } from '@/types/parser-engine';

export interface DocumentIntakeOptions {
  /** Parser mode — determines fields, prompts, target table */
  parseMode: ParserMode | string;
  /** Module code for DMS path (auto-resolved from manifest if omitted) */
  moduleCode?: string;
  /** Entity ID for DMS sub-path and DB linking */
  entityId?: string;
  /** DMS parent folder node ID (overrides auto-detection) */
  parentNodeId?: string;
  /** Skip AI parsing, just upload */
  skipParsing?: boolean;
  /** Auto-write to DB without user confirmation */
  autoWrite?: boolean;
}

export function useDocumentIntake() {
  const { activeTenantId } = useAuth();
  const universalUpload = useUniversalUpload();
  
  const [intakeProgress, setIntakeProgress] = useState<IntakeProgress>({
    step: 'idle',
    progress: 0,
  });
  const [parserResponse, setParserResponse] = useState<ParserEngineResponse | null>(null);
  const [pendingRecords, setPendingRecords] = useState<ExtractedRecord[]>([]);

  const resetIntake = useCallback(() => {
    setIntakeProgress({ step: 'idle', progress: 0 });
    setParserResponse(null);
    setPendingRecords([]);
    universalUpload.reset();
  }, [universalUpload]);

  /**
   * Full intake pipeline: Upload → Parse → return records for preview.
   * Call confirmImport() after user reviews the data.
   */
  const intake = useCallback(async (
    file: File,
    options: DocumentIntakeOptions,
  ): Promise<IntakeResult | null> => {
    if (!activeTenantId) {
      toast.error('Kein aktiver Tenant');
      return null;
    }

    const resolvedMode = resolveLegacyMode(options.parseMode);
    const profile = getParserProfile(resolvedMode);
    const moduleCode = options.moduleCode || profile.moduleCode;

    try {
      // ── Step 1: Upload (Phase 1 via useUniversalUpload) ────────────
      setIntakeProgress({ step: 'uploading', progress: 10, message: 'Datei wird hochgeladen…' });

      const uploadResult = await universalUpload.upload(file, {
        moduleCode,
        entityId: options.entityId,
        parentNodeId: options.parentNodeId,
        triggerAI: false, // We handle parsing ourselves
        source: 'intake',
      });

      if (uploadResult.error || !uploadResult.documentId) {
        setIntakeProgress({ step: 'error', progress: 0, error: uploadResult.error });
        return null;
      }

      const result: IntakeResult = {
        documentId: uploadResult.documentId,
        storagePath: uploadResult.storagePath!,
        storageNodeId: uploadResult.storageNodeId,
        dataWritten: false,
      };

      if (options.skipParsing) {
        setIntakeProgress({ step: 'done', progress: 100, message: 'Datei hochgeladen' });
        return result;
      }

      // ── Step 2: Parse via sot-document-parser ──────────────────────
      setIntakeProgress({ step: 'parsing', progress: 40, message: `KI analysiert als "${profile.label}"…` });

      const { data: parseData, error: parseError } = await supabase.functions.invoke(
        'sot-document-parser',
        {
          body: {
            storagePath: uploadResult.storagePath,
            filename: file.name,
            contentType: file.type,
            tenantId: activeTenantId,
            documentId: uploadResult.documentId,
            parseMode: resolvedMode,
          },
        },
      );

      if (parseError || !parseData?.success) {
        console.error('[intake] Parse error:', parseError);
        toast.warning('KI-Analyse fehlgeschlagen, Dokument wurde trotzdem gespeichert');
        setIntakeProgress({ step: 'done', progress: 100, message: 'Upload ohne Analyse abgeschlossen' });
        return result;
      }

      const parsed = parseData.parsed as ParserEngineResponse;
      setParserResponse(parsed);

      const records = parsed?.records || [];
      setPendingRecords(records);
      result.parserResponse = parsed;

      // ── Step 3: Preview — return for user confirmation ─────────────
      setIntakeProgress({
        step: 'preview',
        progress: 70,
        message: `${records.length} Datensatz/-sätze erkannt (Konfidenz: ${Math.round((parsed.confidence || 0) * 100)}%)`,
      });

      // Auto-write if requested
      if (options.autoWrite && records.length > 0) {
        const written = await writeRecords(resolvedMode, records, options.entityId);
        result.dataWritten = written;
        setIntakeProgress({ step: 'done', progress: 100, message: 'Import abgeschlossen' });
      }

      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setIntakeProgress({ step: 'error', progress: 0, error: msg });
      toast.error(`Intake fehlgeschlagen: ${msg}`);
      return null;
    }
  }, [activeTenantId, universalUpload]);

  /**
   * Write extracted records to the target DB table.
   * Called after user confirms the preview.
   */
  const writeRecords = useCallback(async (
    mode: ParserMode,
    records: ExtractedRecord[],
    entityId?: string,
  ): Promise<boolean> => {
    if (!activeTenantId || !records.length) return false;

    const profile = PARSER_PROFILES[mode];
    if (!profile || !profile.targetTable) {
      console.warn('[intake] No target table for mode:', mode);
      return false;
    }

    setIntakeProgress({ step: 'writing', progress: 85, message: 'Daten werden gespeichert…' });

    try {
      for (const record of records) {
        // Map extracted keys to DB columns
        const dbRow: Record<string, unknown> = { tenant_id: activeTenantId };
        
        for (const field of profile.fields) {
          if (record[field.key] !== undefined) {
            dbRow[field.dbColumn] = record[field.key];
          }
        }

        // If entityId provided, try to update; otherwise insert
        if (entityId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase as any)
            .from(profile.targetTable)
            .update(dbRow)
            .eq('id', entityId)
            .eq('tenant_id', activeTenantId);

          if (error) {
            console.error(`[intake] Update error on ${profile.targetTable}:`, error);
            toast.error(`Aktualisierung fehlgeschlagen: ${error.message}`);
            return false;
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase as any)
            .from(profile.targetTable)
            .insert(dbRow);

          if (error) {
            console.error(`[intake] Insert error on ${profile.targetTable}:`, error);
            toast.error(`Eintrag fehlgeschlagen: ${error.message}`);
            return false;
          }
        }
      }

      toast.success(`${records.length} Datensatz/-sätze importiert`);
      return true;
    } catch (err) {
      console.error('[intake] Write error:', err);
      return false;
    }
  }, [activeTenantId]);

  /**
   * Confirm and write the pending records from the preview step.
   */
  const confirmImport = useCallback(async (
    mode: ParserMode | string,
    editedRecords?: ExtractedRecord[],
    entityId?: string,
  ): Promise<boolean> => {
    const resolvedMode = resolveLegacyMode(mode);
    const records = editedRecords || pendingRecords;
    
    const success = await writeRecords(resolvedMode, records, entityId);
    if (success) {
      setIntakeProgress({ step: 'done', progress: 100, message: 'Import abgeschlossen' });
    }
    return success;
  }, [pendingRecords, writeRecords]);

  return {
    /** Run full intake pipeline */
    intake,
    /** Confirm and write pending records */
    confirmImport,
    /** Reset all state */
    resetIntake,
    /** Current pipeline progress */
    intakeProgress,
    /** Parser response (after parsing step) */
    parserResponse,
    /** Records pending user confirmation */
    pendingRecords,
    /** Update pending records (e.g. user edits in preview) */
    setPendingRecords,
    /** Access to underlying upload state */
    uploadState: universalUpload,
    /** Quick checks */
    isParsing: intakeProgress.step === 'parsing',
    isPreview: intakeProgress.step === 'preview',
    isDone: intakeProgress.step === 'done',
  };
}

export default useDocumentIntake;
