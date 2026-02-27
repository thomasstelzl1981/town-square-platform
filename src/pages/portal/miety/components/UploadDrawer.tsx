/**
 * UploadDrawer — Drawer for document upload in MOD-20 (Miety/Zuhause)
 * Upgraded: SmartDropZone + AIProcessingOverlay for ChatGPT-style feedback
 */
import { useCallback } from 'react';
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { useLegalConsent } from '@/hooks/useLegalConsent';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeFileName, UPLOAD_BUCKET } from '@/config/storageManifest';
import { toast } from 'sonner';
import { SmartDropZone } from '@/components/shared/SmartDropZone';
import { AIProcessingOverlay } from '@/components/shared/AIProcessingOverlay';

interface UploadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: string;
}

const AI_STEPS = [
  { label: 'Datei wird hochgeladen' },
  { label: 'Dokumenttyp wird erkannt' },
  { label: 'In Akte eingeordnet' },
];

export function UploadDrawer({ open, onOpenChange, homeId }: UploadDrawerProps) {
  const { requireConsent, isLoading } = useLegalConsent();
  const { activeTenantId } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [aiStep, setAiStep] = useState(0);

  // Block opening if consent not given
  useEffect(() => {
    if (open && !isLoading && !requireConsent()) {
      onOpenChange(false);
    }
  }, [open, isLoading]);

  // Reset count when drawer opens
  useEffect(() => {
    if (open) setUploadedCount(0);
  }, [open]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (!activeTenantId || !homeId) {
      toast.error('Upload nicht möglich', { description: 'Daten noch nicht geladen.' });
      return;
    }

    setUploading(true);
    setAiStep(0);
    let successCount = 0;

    // Animate steps
    const stepTimer = setInterval(() => {
      setAiStep(prev => Math.min(prev + 1, AI_STEPS.length - 1));
    }, 1000);

    for (const file of files) {
      try {
        const safeName = sanitizeFileName(file.name);
        const storagePath = `${activeTenantId}/MOD_20/${homeId}/documents/${Date.now()}_${safeName}`;

        const { error } = await supabase.storage
          .from(UPLOAD_BUCKET)
          .upload(storagePath, file, { upsert: true });

        if (error) throw error;
        successCount++;
      } catch (err: any) {
        console.error('Upload failed for', file.name, err);
        toast.error(`Fehler: ${file.name}`, { description: err.message });
      }
    }

    clearInterval(stepTimer);
    setAiStep(AI_STEPS.length - 1);

    if (successCount > 0) {
      setUploadedCount(prev => prev + successCount);
      toast.success(`${successCount} Datei(en) hochgeladen`);
    }

    // Brief delay to show completed state
    setTimeout(() => setUploading(false), 800);
  }, [activeTenantId, homeId]);

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Dokument hochladen"
      description="Dokument in deine Zuhause-Akte hochladen"
    >
      <div className="px-4 space-y-4">
        {/* AI Processing Overlay */}
        <AIProcessingOverlay
          active={uploading}
          steps={AI_STEPS}
          currentStep={aiStep}
          headline="Dokument wird verarbeitet…"
          variant="teal"
        />

        {/* Smart Drop Zone */}
        {!uploading && (
          <SmartDropZone
            onFiles={handleUpload}
            disabled={uploading}
            accept={{
              'application/pdf': ['.pdf'],
              'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            }}
            formatsLabel="PDF, JPG, PNG, DOCX"
            variant="teal"
          />
        )}

        {uploadedCount > 0 && !uploading && (
          <p className="text-xs text-primary font-medium text-center">
            {uploadedCount} Datei(en) erfolgreich hochgeladen
          </p>
        )}
      </div>
    </DetailDrawer>
  );
}
