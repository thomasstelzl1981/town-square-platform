/**
 * useExposeUpload — Reusable hook for uploading exposés to a specific mandate
 * Extracts upload logic from ExposeDragDropUploader for use in widget context
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildStoragePath, UPLOAD_BUCKET } from '@/config/storageManifest';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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

    try {
      setPhase('uploading');
      setProgress(10);

      // 1. Upload to storage (using central buildStoragePath + sanitizeFileName)
      const filePath = buildStoragePath(activeTenantId!, 'MOD_12', mandateId || undefined, file.name);
      setProgress(20);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setProgress(40);

      // 2. Create acq_offer with optional mandate_id
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
      setProgress(50);

      // 3. Link document
      await supabase.from('acq_offer_documents').insert({
        offer_id: offer.id,
        storage_path: uploadData.path,
        file_name: file.name,
        document_type: 'expose',
        mime_type: file.type,
        file_size: file.size,
        tenant_id: activeTenantId!,
      });
      setProgress(60);

      // 4. Trigger AI extraction
      setPhase('extracting');
      setProgress(70);

      const { error: extractError } = await supabase.functions.invoke(
        'sot-acq-offer-extract',
        { body: { offerId: offer.id, documentPath: uploadData.path } }
      );

      if (extractError) {
        console.warn('Extraction warning:', extractError);
      }

      setProgress(100);
      setPhase('success');

      // Refresh offers list
      queryClient.invalidateQueries({ queryKey: ['acq-offers-inbox'] });
      toast.success('Exposé hochgeladen und dem Mandat zugeordnet');

      // Reset after short delay
      setTimeout(() => {
        setPhase('idle');
        setProgress(0);
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setPhase('error');
      toast.error('Upload fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
      setTimeout(() => {
        setPhase('idle');
        setProgress(0);
      }, 3000);
    }
  }, [activeTenantId, queryClient]);

  return { upload, phase, progress, isUploading: phase === 'uploading' || phase === 'extracting' };
}
