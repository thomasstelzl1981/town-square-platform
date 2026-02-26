/**
 * useImageSlotUpload — Thin wrapper for slot-based image uploads.
 *
 * Uses Supabase Storage directly (tenant-documents bucket) with:
 * - Tenant-scoped paths: ${tenantId}/${moduleCode}/${entityId}/images/${slotKey}_${safeName}
 * - On-demand signed URLs via getCachedSignedUrl
 * - Toast feedback for success/error
 * - Loading state per slot
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeFileName, UPLOAD_BUCKET } from '@/config/storageManifest';

export interface UseImageSlotUploadConfig {
  /** Module code, e.g. 'MOD-13' */
  moduleCode: string;
  /** Entity id, e.g. project id */
  entityId: string;
  /** Tenant id for path scoping */
  tenantId: string;
  /** Sub-path within entity, default 'images' */
  subPath?: string;
}

export interface UseImageSlotUploadReturn {
  /** Upload a file to a named slot. Returns the storage path on success. */
  uploadToSlot: (slotKey: string, file: File) => Promise<string | null>;
  /** Get a signed URL for a storage path (cached, 1h expiry) */
  getSignedUrl: (storagePath: string) => Promise<string | null>;
  /** Currently uploading slot key, or null */
  uploadingSlot: string | null;
}

export function useImageSlotUpload(config: UseImageSlotUploadConfig): UseImageSlotUploadReturn {
  const { moduleCode, entityId, tenantId, subPath = 'images' } = config;
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Use underscore version for storage paths (MOD-13 → MOD_13)
  const modulePathSegment = moduleCode.replace(/-/g, '_');

  const uploadToSlot = useCallback(async (slotKey: string, file: File): Promise<string | null> => {
    if (!tenantId || !entityId) {
      toast.error('Upload nicht möglich', { description: 'Daten noch nicht vollständig geladen.' });
      return null;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Nur Bilddateien erlaubt', { description: `${file.name} ist kein unterstütztes Bildformat.` });
      return null;
    }

    // Validate file size (max 10MB for images)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Datei zu groß', { description: 'Maximale Dateigröße: 10 MB.' });
      return null;
    }

    setUploadingSlot(slotKey);
    try {
      const safeName = sanitizeFileName(file.name);
      const storagePath = `${tenantId}/${modulePathSegment}/${entityId}/${subPath}/${slotKey}_${safeName}`;

      const { error: uploadErr } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(storagePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      toast.success('Bild hochgeladen');
      return storagePath;
    } catch (err: any) {
      console.error('Image slot upload failed:', err);
      toast.error('Upload fehlgeschlagen', { description: err.message });
      return null;
    } finally {
      setUploadingSlot(null);
    }
  }, [tenantId, entityId, modulePathSegment, subPath]);

  const getSignedUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    if (!storagePath) return null;
    try {
      const { getCachedSignedUrl } = await import('@/lib/imageCache');
      return await getCachedSignedUrl(storagePath, UPLOAD_BUCKET);
    } catch {
      // Fallback to direct signed URL
      const { data } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .createSignedUrl(storagePath, 3600);
      return data?.signedUrl ?? null;
    }
  }, []);

  return { uploadToSlot, getSignedUrl, uploadingSlot };
}
