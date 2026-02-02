import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  ParseResult,
  UploadStatus,
  UploadProgress,
} from '@/types/document-schemas';

/**
 * useSmartUpload
 * 
 * Universal upload hook that:
 * 1. Uploads file to Supabase Storage
 * 2. Calls sot-document-parser for AI analysis
 * 3. Stores parsed JSON alongside the document
 * 4. Creates document_links for SSOT referencing
 * 5. Returns structured data for preview/import
 * 
 * Supports: Excel, CSV, PDF, Images
 */

// Extended options interface with SSOT context
export interface SmartUploadOptions {
  parseMode?: 'properties' | 'contacts' | 'financing' | 'general';
  autoImport?: boolean;
  source?: string;
  // SSOT Context Parameters (required for proper linking)
  objectType?: 'property' | 'unit' | 'lease' | 'loan' | 'contact';
  objectId?: string;
  unitId?: string; // redundant for convenience
  nodeId?: string; // optional storage node reference
  docTypeHint?: string; // optional doc_type hint
}

// Local result type (different from document-schemas)
export interface SmartUploadResult {
  documentId?: string;
  documentLinkId?: string; // NEW: returns the created link ID
  parsed?: ParseResult;
  storagePath?: string;
  jsonPath?: string;
  error?: string;
}

interface UseSmartUploadReturn {
  upload: (file: File, options?: SmartUploadOptions) => Promise<SmartUploadResult>;
  uploadMultiple: (files: File[], options?: SmartUploadOptions) => Promise<SmartUploadResult[]>;
  progress: UploadProgress;
  reset: () => void;
  isAnalyzing: boolean;
}

export function useSmartUpload(): UseSmartUploadReturn {
  const { activeTenantId } = useAuth();
  const [progress, setProgress] = useState<UploadProgress>({
    status: 'idle' as UploadStatus,
    progress: 0,
  });

  const reset = useCallback(() => {
    setProgress({ status: 'idle' as UploadStatus, progress: 0 });
  }, []);

  const upload = useCallback(async (
    file: File,
    options: SmartUploadOptions = {}
  ): Promise<SmartUploadResult> => {
    if (!activeTenantId) {
      toast.error('Kein aktiver Tenant');
      return { error: 'No active tenant' };
    }

    try {
      // Phase 1: Upload to Storage
      setProgress({ status: 'uploading', progress: 10, message: 'Datei wird hochgeladen...' });

      const documentId = crypto.randomUUID();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const storagePath = `${activeTenantId}/raw/${year}/${month}/${documentId}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress({ status: 'uploading', progress: 40, message: 'Datei hochgeladen' });

      // Phase 2: Create document record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: docData, error: docError } = await (supabase as any)
        .from('documents')
        .insert({
          tenant_id: activeTenantId,
          name: file.name,
          file_path: storagePath,
          mime_type: file.type,
          size_bytes: file.size,
          public_id: documentId.substring(0, 8).toUpperCase(),
          source: options.source || 'upload',
          extraction_status: 'processing',
          doc_type: options.docTypeHint || null,
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Document insert error:', docError);
        throw new Error(`Document record failed: ${docError.message}`);
      }

      const dbDocumentId = docData?.id;

      // Phase 2.5: Create document_links entry for SSOT referencing (CRITICAL)
      let documentLinkId: string | undefined;
      
      if (dbDocumentId && options.objectType && options.objectId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: linkData, error: linkError } = await (supabase as any)
            .from('document_links')
            .insert({
              tenant_id: activeTenantId,
              document_id: dbDocumentId,
              object_type: options.objectType,
              object_id: options.objectId,
              unit_id: options.unitId || null,
              node_id: options.nodeId || null,
              link_status: 'pending',
            })
            .select('id')
            .single();

          if (linkError) {
            console.error('Document link insert error:', linkError);
            // Don't fail the upload, but log the error
            toast.warning('Dokument gespeichert, aber Verknüpfung fehlgeschlagen');
          } else {
            documentLinkId = linkData?.id;
            console.log(`Document linked: ${dbDocumentId} → ${options.objectType}:${options.objectId}`);
          }
        } catch (linkErr) {
          console.error('Document link creation failed:', linkErr);
        }
      } else if (dbDocumentId && options.unitId) {
        // Fallback: If only unitId is provided without explicit objectType
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: linkData, error: linkError } = await (supabase as any)
            .from('document_links')
            .insert({
              tenant_id: activeTenantId,
              document_id: dbDocumentId,
              object_type: 'unit',
              object_id: options.unitId,
              unit_id: options.unitId,
              node_id: options.nodeId || null,
              link_status: 'pending',
            })
            .select('id')
            .single();

          if (!linkError) {
            documentLinkId = linkData?.id;
          }
        } catch (linkErr) {
          console.error('Fallback document link creation failed:', linkErr);
        }
      }

      setProgress({ status: 'analyzing', progress: 50, message: 'KI analysiert Dokument...' });

      // Phase 3: Call AI Parser
      let parsed: ParseResult | undefined;
      
      // Read file content
      const content = await fileToBase64(file);
      
      const { data: parseResponse, error: parseError } = await supabase.functions.invoke(
        'sot-document-parser',
        {
          body: {
            content,
            contentType: file.type,
            filename: file.name,
            tenantId: activeTenantId,
            parseMode: options.parseMode || 'general',
          },
        }
      );

      if (parseError) {
        console.error('Parse error:', parseError);
        // Don't fail completely, just note the parsing failed
        toast.warning('KI-Analyse fehlgeschlagen, Dokument wurde trotzdem gespeichert');
      } else if (parseResponse?.success) {
        parsed = parseResponse.parsed;
        setProgress({ status: 'analyzing', progress: 80, message: 'Daten extrahiert' });
      }

      // Phase 4: Store JSON metadata
      let jsonPath: string | undefined;
      if (parsed) {
        const jsonStoragePath = `${activeTenantId}/derived/${documentId}/metadata.json`;
        const jsonBlob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
        
        const { error: jsonUploadError } = await supabase.storage
          .from('tenant-documents')
          .upload(jsonStoragePath, jsonBlob, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!jsonUploadError) {
          jsonPath = jsonStoragePath;
        }
      }

      // Phase 5: Update document record with extraction results
      if (dbDocumentId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('documents')
          .update({
            extraction_status: parsed ? 'done' : 'failed',
            extracted_json_path: jsonPath,
            ai_summary: parsed?.data?.detected_type || null,
            detected_type: parsed?.data?.detected_type || null,
          })
          .eq('id', dbDocumentId);
      }

      // Create extraction record
      if (dbDocumentId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('extractions')
          .insert({
            tenant_id: activeTenantId,
            document_id: dbDocumentId,
            engine: 'lovable_ai',
            source: options.source || 'upload',
            status: parsed ? 'done' : 'failed',
            result_json: parsed || null,
            actual_pages: 1, // For AI parsing we count as 1 "call"
            finished_at: new Date().toISOString(),
          });
      }

      // Phase 6: Update document_link status if parsing succeeded
      if (documentLinkId && parsed) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('document_links')
            .update({ link_status: 'needs_review' })
            .eq('id', documentLinkId);
        } catch (updateErr) {
          console.error('Failed to update link status:', updateErr);
        }
      }

      setProgress({ status: 'done', progress: 100, message: 'Fertig!' });

      return {
        documentId: dbDocumentId,
        documentLinkId,
        parsed,
        storagePath,
        jsonPath,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setProgress({ status: 'error', progress: 0, error: errorMessage });
      toast.error(`Upload fehlgeschlagen: ${errorMessage}`);
      return { error: errorMessage };
    }
  }, [activeTenantId]);

  const uploadMultiple = useCallback(async (
    files: File[],
    options: SmartUploadOptions = {}
  ): Promise<SmartUploadResult[]> => {
    const results: SmartUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({
        status: 'uploading',
        progress: Math.round((i / files.length) * 100),
        message: `Verarbeite ${i + 1}/${files.length}: ${file.name}`,
      });
      
      const result = await upload(file, options);
      results.push(result);
    }
    
    setProgress({ status: 'done', progress: 100, message: `${files.length} Dateien verarbeitet` });
    return results;
  }, [upload]);

  return {
    upload,
    uploadMultiple,
    progress,
    reset,
    isAnalyzing: progress.status === 'analyzing',
  };
}

// Helper: Convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix for non-images
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        resolve(result); // Keep data URL for vision models
      } else {
        // For text-based files, decode and send as text
        const base64 = result.split(',')[1];
        try {
          const text = atob(base64);
          resolve(text);
        } catch {
          resolve(base64);
        }
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default useSmartUpload;
