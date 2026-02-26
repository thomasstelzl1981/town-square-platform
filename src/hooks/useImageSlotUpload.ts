/**
 * useImageSlotUpload — Slot-based image upload with full DB pipeline.
 *
 * Phase 1: Storage upload to tenant-documents bucket
 * Phase 2: DB records in documents + document_links + storage_nodes
 *
 * This ensures images are visible in DMS, linked to entity files,
 * and indexed in the data room with a full audit trail.
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
  /** Entity type for document_links, e.g. 'projekt', 'profil', 'pet' */
  entityType?: string;
  /** Sub-path within entity, default 'images' */
  subPath?: string;
}

export interface ImageSlotUploadResult {
  storagePath: string;
  documentId: string;
  slotKey: string;
}

export interface UseImageSlotUploadReturn {
  /** Upload a file to a named slot. Returns storage path + documentId on success. */
  uploadToSlot: (slotKey: string, file: File) => Promise<string | null>;
  /** Get a signed URL for a storage path (cached, 1h expiry) */
  getSignedUrl: (storagePath: string) => Promise<string | null>;
  /** Currently uploading slot key, or null */
  uploadingSlot: string | null;
  /** Load existing images for all slots from document_links */
  loadSlotImages: (entityId: string, entityType: string) => Promise<Record<string, { url: string; documentId: string }>>;
  /** Soft-delete a slot image (sets link_status = 'archived') */
  deleteSlotImage: (documentId: string) => Promise<boolean>;
}

export function useImageSlotUpload(config: UseImageSlotUploadConfig): UseImageSlotUploadReturn {
  const { moduleCode, entityId, tenantId, entityType = 'unknown', subPath = 'images' } = config;
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Use underscore version for storage paths (MOD-13 → MOD_13)
  const modulePathSegment = moduleCode.replace(/-/g, '_');

  const uploadToSlot = useCallback(async (slotKey: string, file: File): Promise<string | null> => {
    if (import.meta.env.DEV) console.log('[ImageSlotUpload] uploadToSlot called:', { slotKey, fileName: file.name, tenantId, entityId, modulePathSegment, subPath });
    if (!tenantId || !entityId) {
      console.error('[ImageSlotUpload] Missing tenantId or entityId:', { tenantId, entityId });
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
      if (import.meta.env.DEV) console.log('[ImageSlotUpload] Uploading to path:', storagePath, 'bucket:', UPLOAD_BUCKET);

      // ── Phase 1: Storage Upload ──
      const { error: uploadErr } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(storagePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      // ── Phase 2: DB Records ──

      // 2a. Soft-delete any existing document_link for this slot
      await supabase
        .from('document_links')
        .update({ link_status: 'archived' })
        .eq('tenant_id', tenantId)
        .eq('object_id', entityId)
        .eq('object_type', entityType)
        .eq('slot_key', slotKey)
        .eq('link_status', 'linked');

      // 2b. documents record
      const { data: docRecord, error: docError } = await supabase
        .from('documents')
        .insert({
          tenant_id: tenantId,
          name: safeName,
          file_path: storagePath,
          mime_type: file.type,
          size_bytes: file.size,
          source: 'upload',
          extraction_status: 'skipped',
          doc_type: 'image',
          public_id: crypto.randomUUID(),
        })
        .select('id')
        .single();

      if (docError) throw docError;

      // 2c. document_links record (connects image to entity + slot)
      const { error: linkError } = await supabase
        .from('document_links')
        .insert({
          tenant_id: tenantId,
          document_id: docRecord.id,
          object_type: entityType,
          object_id: entityId,
          slot_key: slotKey,
          link_status: 'linked',
        });

      if (linkError) throw linkError;

      // 2d. storage_nodes record (non-blocking — DMS index is optional)
      // Find root folder for this module
      const { data: parentNode } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('module_code', moduleCode)
        .is('parent_id', null)
        .maybeSingle();

      const { error: nodeError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          parent_id: parentNode?.id ?? null,
          name: safeName,
          node_type: 'file',
          module_code: moduleCode,
          storage_path: storagePath,
          mime_type: file.type,
          entity_type: entityType,
          entity_id: entityId,
        });

      if (nodeError) {
        // storage_nodes error is non-blocking — DMS index optional
        console.error('[useImageSlotUpload] storage_nodes insert failed (non-blocking):', nodeError);
      }

      toast.success('Bild hochgeladen');
      return storagePath;
    } catch (err: any) {
      console.error('Image slot upload failed:', err);
      toast.error('Upload fehlgeschlagen', { description: err.message });
      return null;
    } finally {
      setUploadingSlot(null);
    }
  }, [tenantId, entityId, entityType, moduleCode, modulePathSegment, subPath]);

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

  /** Load all active slot images for an entity from document_links */
  const loadSlotImages = useCallback(async (
    loadEntityId: string,
    loadEntityType: string,
  ): Promise<Record<string, { url: string; documentId: string }>> => {
    if (!tenantId || !loadEntityId) return {};

    const { data: links, error } = await supabase
      .from('document_links')
      .select(`
        slot_key,
        documents!document_links_document_id_fkey (id, file_path, name, mime_type)
      `)
      .eq('tenant_id', tenantId)
      .eq('object_id', loadEntityId)
      .eq('object_type', loadEntityType)
      .eq('link_status', 'linked')
      .not('slot_key', 'is', null);

    if (error || !links) {
      console.error('[useImageSlotUpload] loadSlotImages failed:', error);
      return {};
    }

    const imageMap: Record<string, { url: string; documentId: string }> = {};
    for (const link of links) {
      const doc = link.documents as any;
      if (!doc?.file_path || !link.slot_key) continue;
      const url = await getSignedUrl(doc.file_path);
      if (url) {
        imageMap[link.slot_key] = { url, documentId: doc.id };
      }
    }
    return imageMap;
  }, [tenantId, getSignedUrl]);

  /** Soft-delete a slot image by setting link_status to 'archived' */
  const deleteSlotImage = useCallback(async (documentId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('document_links')
      .update({ link_status: 'archived' })
      .eq('document_id', documentId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('[useImageSlotUpload] deleteSlotImage failed:', error);
      toast.error('Bild löschen fehlgeschlagen');
      return false;
    }
    toast.success('Bild entfernt');
    return true;
  }, [tenantId]);

  return { uploadToSlot, getSignedUrl, uploadingSlot, loadSlotImages, deleteSlotImage };
}
