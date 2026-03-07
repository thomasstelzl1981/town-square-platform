/**
 * useExposeUpload — SSOT-compliant hook for uploading exposés to Objekteingang
 * 
 * Uses UPLOAD_BUCKET ('tenant-documents') with buildStoragePath.
 * Storage path: {tenant_id}/MOD_12/{offer_id}/expose/{fileName}
 * Registers in: acq_offer_documents + documents + storage_nodes (via DMS)
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { buildStoragePath, UPLOAD_BUCKET, sanitizeFileName } from '@/config/storageManifest';

type UploadPhase = 'idle' | 'uploading' | 'extracting' | 'success' | 'error';

export function useExposeUpload() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (file: File, mandateId: string) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Bitte laden Sie ein PDF, DOCX, JPG oder PNG hoch');
      return;
    }

    if (!activeTenantId) {
      toast.error('Keine aktive Organisation');
      return;
    }

    let storagePath = '';
    try {
      setPhase('uploading');
      setProgress(10);

      // 1. Create acq_offer FIRST to get offer_id for the storage path
      const insertData: Record<string, unknown> = {
        source_type: 'manual_upload',
        status: 'new',
        title: file.name.replace(/\.[^/.]+$/, ''),
        received_at: new Date().toISOString(),
        tenant_id: activeTenantId,
      };
      if (mandateId) insertData.mandate_id = mandateId;

      const { data: offer, error: offerError } = await supabase
        .from('acq_offers')
        .insert(insertData as any)
        .select('id')
        .single();

      if (offerError) throw offerError;
      setProgress(30);

      // 2. Build SSOT storage path: {tenant_id}/MOD_12/{offer_id}/{fileName}
      const safeName = sanitizeFileName(file.name);
      storagePath = `${activeTenantId}/MOD_12/${offer.id}/${safeName}`;

      setProgress(40);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(storagePath, file);

      if (uploadError) throw uploadError;
      setProgress(55);

      // 3. Link document in acq_offer_documents
      const { data: doc, error: docError } = await supabase.from('acq_offer_documents').insert({
        offer_id: offer.id,
        storage_path: uploadData.path,
        file_name: file.name,
        document_type: 'expose',
        mime_type: file.type,
        file_size: file.size,
        tenant_id: activeTenantId!,
      }).select('id').single();

      if (docError) throw docError;
      setProgress(60);

      // 4. Register in DMS (documents table)
      const publicId = crypto.randomUUID().substring(0, 8).toUpperCase();
      await (supabase as any).from('documents').insert({
        tenant_id: activeTenantId,
        name: file.name,
        file_path: uploadData.path,
        mime_type: file.type,
        size_bytes: file.size,
        public_id: publicId,
        source: 'acq_upload',
        extraction_status: 'pending',
        doc_type: 'expose',
      });

      // 5. Register in storage_nodes
      const { data: rootNode } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', activeTenantId)
        .eq('template_id', 'MOD_12_ROOT')
        .maybeSingle();

      if (rootNode?.id) {
        await supabase.from('storage_nodes').insert({
          tenant_id: activeTenantId,
          parent_id: rootNode.id,
          name: file.name,
          node_type: 'file',
          module_code: 'MOD_12',
          storage_path: uploadData.path,
          mime_type: file.type,
        });
      }

      setProgress(65);

      // 6. Trigger AI extraction
      setPhase('extracting');
      setProgress(75);

      const { error: extractError } = await supabase.functions.invoke(
        'sot-acq-offer-extract',
        { body: { offerId: offer.id, documentId: doc.id } }
      );

      if (extractError) {
        console.warn('Extraction warning:', extractError);
      }

      setProgress(100);
      setPhase('success');

      // Refresh offers list
      queryClient.invalidateQueries({ queryKey: ['acq-offers-inbox'] });
      toast.success(mandateId ? 'Exposé hochgeladen und dem Mandat zugeordnet' : 'Exposé hochgeladen — Mandatszuordnung über Dropdown möglich');

      // Reset after short delay
      setTimeout(() => {
        setPhase('idle');
        setProgress(0);
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setPhase('error');

      // Rollback: delete orphaned storage file if upload succeeded but DB failed
      if (storagePath) {
        try {
          await supabase.storage.from(UPLOAD_BUCKET).remove([storagePath]);
          console.log('Rollback: orphaned file removed from storage');
        } catch (rollbackErr) {
          console.warn('Rollback failed:', rollbackErr);
        }
      }

      toast.error('Upload fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
      setTimeout(() => {
        setPhase('idle');
        setProgress(0);
      }, 3000);
    }
  }, [activeTenantId, queryClient]);

  return { upload, phase, progress, isUploading: phase === 'uploading' || phase === 'extracting' };
}
