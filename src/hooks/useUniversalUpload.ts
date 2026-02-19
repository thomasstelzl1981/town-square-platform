/**
 * useUniversalUpload — Single entry-point for ALL file uploads across modules.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * UPLOAD CONTRACT (2-Phase Architecture)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ALL uploads in this system MUST follow this 2-phase pattern:
 *
 * Phase 1 — UPLOAD + REGISTER (synchronous, always runs):
 *   Step 1: Upload file to Supabase Storage → status: 'uploading'
 *   Step 2: Create `documents` record       → status: 'linking'
 *   Step 3: Create `document_links` record  → status: 'linking'
 *   Step 4: Create `storage_nodes` file-node → status: 'uploaded' ← PAUSE
 *           → Returns UploadedFileInfo with previewUrl
 *           → Fires onFileUploaded callback
 *           → User sees the file immediately (name, size, preview link)
 *
 * Phase 2 — AI ANALYSIS (optional, only if triggerAI=true):
 *   Step 5: Call sot-document-parser         → status: 'analyzing'
 *   Step 6: Store extraction results         → status: 'done'
 *
 * RULES:
 * - The user MUST see the file BEFORE any analysis starts.
 * - Phase 2 is always optional and can be triggered separately via analyzeDocument().
 * - Never send file content (base64) to Edge Functions. Always pass storagePath.
 * - All paths use buildStoragePath() from storageManifest.
 * - All uploads go to the UPLOAD_BUCKET ('tenant-documents').
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { buildStoragePath, UPLOAD_BUCKET } from '@/config/storageManifest';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UniversalUploadOptions {
  /** Module code (MOD_04, MOD_07, MOD_13, …) — used for path + storage_nodes */
  moduleCode?: string;
  /** Entity id (property, project, pv-plant, …) — used for sub-path */
  entityId?: string;
  /** Object type for document_links (property, unit, lease, loan, project, pv_plant …) */
  objectType?: string;
  /** Object id for document_links */
  objectId?: string;
  /** Optional unit_id for document_links */
  unitId?: string;
  /** Optional storage_nodes parent folder id (overrides auto-detection) */
  parentNodeId?: string;
  /** Optional doc_type hint (e.g. 'expose', 'gehaltsnachweis') */
  docTypeHint?: string;
  /** Upload source label */
  source?: string;
  /** Trigger AI extraction after upload? (Phase 2 runs automatically after Phase 1) */
  triggerAI?: boolean;
  /** Parse mode for AI extraction */
  parseMode?: 'properties' | 'contacts' | 'financing' | 'general'
    | 'immobilie' | 'finanzierung' | 'versicherung' | 'fahrzeugschein'
    | 'pv_anlage' | 'vorsorge' | 'person' | 'haustier' | 'kontakt' | 'allgemein';
  /** Called when file is uploaded and registered (end of Phase 1), before AI analysis */
  onFileUploaded?: (file: UploadedFileInfo) => void;
}

export interface UniversalUploadResult {
  documentId?: string;
  documentLinkId?: string;
  storageNodeId?: string;
  storagePath?: string;
  previewUrl?: string | null;
  error?: string;
}

/** Info about a successfully uploaded file (returned at end of Phase 1) */
export interface UploadedFileInfo {
  documentId: string;
  storagePath: string;
  storageNodeId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl: string | null;
}

export type UploadStatus = 'idle' | 'uploading' | 'linking' | 'uploaded' | 'analyzing' | 'done' | 'error';

export interface UploadProgress {
  status: UploadStatus;
  progress: number;
  message?: string;
  error?: string;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useUniversalUpload() {
  const { activeTenantId, profile } = useAuth();
  const [progress, setProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const uploadedFilesRef = useRef<UploadedFileInfo[]>([]);

  const reset = useCallback(() => {
    setProgress({ status: 'idle', progress: 0 });
    setUploadedFiles([]);
    uploadedFilesRef.current = [];
  }, []);

  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
    uploadedFilesRef.current = [];
  }, []);

  /**
   * Generate a signed preview URL for a storage path.
   */
  const getPreviewUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    try {
      const { getCachedSignedUrl } = await import('@/lib/imageCache');
      return await getCachedSignedUrl(storagePath, UPLOAD_BUCKET);
    } catch {
      return null;
    }
  }, []);

  /**
   * Trigger AI analysis on an already-uploaded document (Phase 2 standalone).
   */
  const analyzeDocument = useCallback(async (
    documentId: string,
    storagePath: string,
    options: {
      fileName?: string;
      contentType?: string;
      parseMode?: 'properties' | 'contacts' | 'financing' | 'general'
        | 'immobilie' | 'finanzierung' | 'versicherung' | 'fahrzeugschein'
        | 'pv_anlage' | 'vorsorge' | 'person' | 'haustier' | 'kontakt' | 'allgemein';
      source?: string;
    } = {},
  ): Promise<boolean> => {
    if (!activeTenantId) return false;

    setProgress({ status: 'analyzing', progress: 75, message: 'KI analysiert Dokument…' });

    try {
      const { data: parseResponse, error: parseError } = await supabase.functions.invoke(
        'sot-document-parser',
        {
          body: {
            storagePath,
            filename: options.fileName || 'document',
            contentType: options.contentType || 'application/pdf',
            tenantId: activeTenantId,
            documentId,
            parseMode: options.parseMode || 'general',
          },
        },
      );

      if (parseError) {
        console.error('AI parse error:', parseError);
        toast.warning('KI-Analyse fehlgeschlagen, Dokument wurde trotzdem gespeichert');
        setProgress({ status: 'uploaded', progress: 70, message: 'Analyse fehlgeschlagen' });
        return false;
      }

      if (parseResponse?.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('documents')
          .update({
            extraction_status: 'done',
            ai_summary: parseResponse.parsed?.data?.detected_type || null,
            detected_type: parseResponse.parsed?.data?.detected_type || null,
          })
          .eq('id', documentId);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('extractions')
          .insert({
            tenant_id: activeTenantId,
            document_id: documentId,
            engine: 'lovable_ai',
            source: options.source || 'upload',
            status: 'done',
            result_json: parseResponse.parsed || null,
            actual_pages: 1,
            finished_at: new Date().toISOString(),
          });
      }

      setProgress({ status: 'done', progress: 100, message: 'Analyse abgeschlossen' });
      return true;
    } catch (aiErr) {
      console.error('AI extraction failed:', aiErr);
      setProgress({ status: 'uploaded', progress: 70, message: 'Analyse fehlgeschlagen' });
      return false;
    }
  }, [activeTenantId]);

  /**
   * Upload a single file (Phase 1 + optional Phase 2).
   */
  const upload = useCallback(async (
    file: File,
    options: UniversalUploadOptions = {},
  ): Promise<UniversalUploadResult> => {
    if (!activeTenantId) {
      toast.error('Kein aktiver Tenant');
      return { error: 'No active tenant' };
    }

    const {
      moduleCode,
      entityId,
      objectType,
      objectId,
      unitId,
      parentNodeId,
      docTypeHint,
      source = 'upload',
      triggerAI = false,
      parseMode = 'general',
      onFileUploaded,
    } = options;

    try {
      // ══════════════════════════════════════════════════════════════════
      // PHASE 1: Upload + Register (Steps 1-4)
      // ══════════════════════════════════════════════════════════════════

      // Step 1: Upload to Storage
      setProgress({ status: 'uploading', progress: 10, message: 'Datei wird hochgeladen…' });

      const storagePath = buildStoragePath(activeTenantId, moduleCode, entityId, file.name);

      const { error: uploadError } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);

      setProgress({ status: 'uploading', progress: 40, message: 'Datei hochgeladen' });

      // Step 2: Create documents record
      setProgress({ status: 'linking', progress: 50, message: 'Dokument wird registriert…' });

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
          source,
          extraction_status: triggerAI ? 'pending' : 'none',
          doc_type: docTypeHint || null,
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Document insert error:', docError);
        throw new Error(`Dokument-Eintrag fehlgeschlagen: ${docError.message}`);
      }

      const documentId: string = docData?.id;

      // Step 3: Create document_links
      let documentLinkId: string | undefined;

      if (documentId && ((objectType && objectId) || parentNodeId)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: linkData, error: linkError } = await (supabase as any)
            .from('document_links')
            .insert({
              tenant_id: activeTenantId,
              document_id: documentId,
              object_type: objectType || null,
              object_id: objectId || null,
              unit_id: unitId || null,
              node_id: parentNodeId || null,
              link_status: 'pending',
            })
            .select('id')
            .single();

          if (linkError) {
            console.error('Document link error:', linkError);
            toast.warning('Dokument gespeichert, Verknüpfung fehlgeschlagen');
          } else {
            documentLinkId = linkData?.id;
          }
        } catch (err) {
          console.error('Link creation failed:', err);
        }
      }

      // Step 4: Create storage_nodes file-node
      let storageNodeId: string | undefined;

      let effectiveParentId = parentNodeId || null;

      if (!effectiveParentId && moduleCode) {
        const { data: rootNode } = await supabase
          .from('storage_nodes')
          .select('id')
          .eq('tenant_id', activeTenantId)
          .eq('template_id', `${moduleCode}_ROOT`)
          .maybeSingle();

        effectiveParentId = rootNode?.id || null;
      }

      if (effectiveParentId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodeInsert: any = {
          tenant_id: activeTenantId,
          parent_id: effectiveParentId,
          name: file.name,
          node_type: 'file',
          module_code: moduleCode || null,
          file_path: storagePath,
          mime_type: file.type,
          size_bytes: file.size,
        };

        const { data: nodeData, error: nodeError } = await supabase
          .from('storage_nodes')
          .insert(nodeInsert)
          .select('id')
          .single();

        if (nodeError) {
          console.error('Storage node creation failed:', nodeError);
        } else {
          storageNodeId = nodeData?.id;
        }
      } else {
        // Fallback: INBOX
        const { data: inboxNode } = await supabase
          .from('storage_nodes')
          .select('id')
          .eq('tenant_id', activeTenantId)
          .eq('template_id', 'inbox')
          .maybeSingle();

        if (inboxNode?.id) {
          const { data: nodeData } = await supabase
            .from('storage_nodes')
            .insert({
              tenant_id: activeTenantId,
              parent_id: inboxNode.id,
              name: file.name,
              node_type: 'file',
              module_code: 'SYSTEM',
              file_path: storagePath,
              mime_type: file.type,
              size_bytes: file.size,
            })
            .select('id')
            .single();

          storageNodeId = nodeData?.id;
        }
      }

      // ── Phase 1 Complete: File is uploaded and registered ─────────────
      const previewUrl = await getPreviewUrl(storagePath);

      const fileInfo: UploadedFileInfo = {
        documentId,
        storagePath,
        storageNodeId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        previewUrl,
      };

      // Add to uploaded files list
      uploadedFilesRef.current = [...uploadedFilesRef.current, fileInfo];
      setUploadedFiles([...uploadedFilesRef.current]);

      setProgress({ status: 'uploaded', progress: 70, message: '✓ Datei hochgeladen und registriert' });

      // Notify consumer
      onFileUploaded?.(fileInfo);

      // ══════════════════════════════════════════════════════════════════
      // PHASE 2: Optional AI Analysis (Steps 5-6)
      // ══════════════════════════════════════════════════════════════════

      if (triggerAI && documentId) {
        await analyzeDocument(documentId, storagePath, {
          fileName: file.name,
          contentType: file.type,
          parseMode,
          source,
        });
      } else {
        // No AI → mark as done
        setProgress({ status: 'done', progress: 100, message: 'Fertig!' });
      }

      return { documentId, documentLinkId, storageNodeId, storagePath, previewUrl };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setProgress({ status: 'error', progress: 0, error: msg });
      toast.error(`Upload fehlgeschlagen: ${msg}`);
      return { error: msg };
    }
  }, [activeTenantId, profile, getPreviewUrl, analyzeDocument]);

  /**
   * Upload multiple files sequentially.
   */
  const uploadMultiple = useCallback(async (
    files: File[],
    options: UniversalUploadOptions = {},
  ): Promise<UniversalUploadResult[]> => {
    const results: UniversalUploadResult[] = [];
    for (let i = 0; i < files.length; i++) {
      setProgress({
        status: 'uploading',
        progress: Math.round((i / files.length) * 100),
        message: `Verarbeite ${i + 1}/${files.length}: ${files[i].name}`,
      });
      results.push(await upload(files[i], options));
    }
    setProgress({ status: 'done', progress: 100, message: `${files.length} Dateien verarbeitet` });
    return results;
  }, [upload]);

  return {
    upload,
    uploadMultiple,
    analyzeDocument,
    progress,
    reset,
    uploadedFiles,
    clearUploadedFiles,
    getPreviewUrl,
    isUploading: progress.status === 'uploading' || progress.status === 'linking',
    isUploaded: progress.status === 'uploaded',
    isAnalyzing: progress.status === 'analyzing',
  };
}

export default useUniversalUpload;
