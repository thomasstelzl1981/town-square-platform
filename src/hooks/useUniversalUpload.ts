/**
 * useUniversalUpload — Single entry-point for ALL file uploads across modules.
 *
 * Flow:
 *  1. Upload file to Supabase Storage (tenant-documents bucket, direct upload)
 *  2. Create `documents` record
 *  3. Create `document_links` record (if objectType + objectId provided)
 *  4. Create `storage_nodes` file-node under the correct parent folder
 *  5. Optionally trigger AI extraction (passes storage path, never file content)
 *  6. Return { documentId, storagePath, storageNodeId }
 *
 * Uses `buildStoragePath` from storageManifest for consistent paths.
 */

import { useState, useCallback } from 'react';
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
  /** Trigger AI extraction after upload? */
  triggerAI?: boolean;
  /** Parse mode for AI extraction */
  parseMode?: 'properties' | 'contacts' | 'financing' | 'general';
}

export interface UniversalUploadResult {
  documentId?: string;
  documentLinkId?: string;
  storageNodeId?: string;
  storagePath?: string;
  error?: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'linking' | 'analyzing' | 'done' | 'error';

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

  const reset = useCallback(() => {
    setProgress({ status: 'idle', progress: 0 });
  }, []);

  /**
   * Upload a single file.
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
    } = options;

    try {
      // ── Phase 1: Upload to Storage ─────────────────────────────────────
      setProgress({ status: 'uploading', progress: 10, message: 'Datei wird hochgeladen…' });

      const storagePath = buildStoragePath(activeTenantId, moduleCode, entityId, file.name);

      const { error: uploadError } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);

      setProgress({ status: 'uploading', progress: 40, message: 'Datei hochgeladen' });

      // ── Phase 2: Create documents record ───────────────────────────────
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
          extraction_status: triggerAI ? 'processing' : 'none',
          doc_type: docTypeHint || null,
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Document insert error:', docError);
        throw new Error(`Dokument-Eintrag fehlgeschlagen: ${docError.message}`);
      }

      const documentId: string = docData?.id;

      // ── Phase 3: Create document_links ─────────────────────────────────
      let documentLinkId: string | undefined;

      if (documentId && objectType && objectId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: linkData, error: linkError } = await (supabase as any)
            .from('document_links')
            .insert({
              tenant_id: activeTenantId,
              document_id: documentId,
              object_type: objectType,
              object_id: objectId,
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

      // ── Phase 4: Create storage_nodes file-node ────────────────────────
      let storageNodeId: string | undefined;

      // Determine parent node: explicit > auto-detect via module root
      let effectiveParentId = parentNodeId || null;

      if (!effectiveParentId && moduleCode) {
        // Find the module root for this tenant
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
          // Non-fatal: file is uploaded, just no tree entry
        } else {
          storageNodeId = nodeData?.id;
        }
      } else {
        // Fallback: try INBOX
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

      setProgress({ status: 'linking', progress: 70, message: 'Verknüpfung erstellt' });

      // ── Phase 5: Optional AI extraction ────────────────────────────────
      if (triggerAI && documentId) {
        setProgress({ status: 'analyzing', progress: 75, message: 'KI analysiert Dokument…' });

        try {
          const { data: parseResponse, error: parseError } = await supabase.functions.invoke(
            'sot-document-parser',
            {
              body: {
                storagePath,
                filename: file.name,
                contentType: file.type,
                tenantId: activeTenantId,
                documentId,
                parseMode,
              },
            },
          );

          if (parseError) {
            console.error('AI parse error:', parseError);
            toast.warning('KI-Analyse fehlgeschlagen, Dokument wurde trotzdem gespeichert');
          } else if (parseResponse?.success) {
            // Update documents record
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('documents')
              .update({
                extraction_status: 'done',
                ai_summary: parseResponse.parsed?.data?.detected_type || null,
                detected_type: parseResponse.parsed?.data?.detected_type || null,
              })
              .eq('id', documentId);

            // Create extraction record
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('extractions')
              .insert({
                tenant_id: activeTenantId,
                document_id: documentId,
                engine: 'lovable_ai',
                source,
                status: 'done',
                result_json: parseResponse.parsed || null,
                actual_pages: 1,
                finished_at: new Date().toISOString(),
              });
          }
        } catch (aiErr) {
          console.error('AI extraction failed:', aiErr);
        }

        setProgress({ status: 'analyzing', progress: 90, message: 'Analyse abgeschlossen' });
      }

      // ── Done ───────────────────────────────────────────────────────────
      setProgress({ status: 'done', progress: 100, message: 'Fertig!' });

      return { documentId, documentLinkId, storageNodeId, storagePath };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setProgress({ status: 'error', progress: 0, error: msg });
      toast.error(`Upload fehlgeschlagen: ${msg}`);
      return { error: msg };
    }
  }, [activeTenantId, profile]);

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
    progress,
    reset,
    isUploading: progress.status === 'uploading' || progress.status === 'linking',
    isAnalyzing: progress.status === 'analyzing',
  };
}

export default useUniversalUpload;
