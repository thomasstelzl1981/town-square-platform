/**
 * UploadDrawer — Drawer for document upload in MOD-20 (Miety/Zuhause)
 * Uses useUniversalUpload for standardized file handling.
 */
import { useCallback } from 'react';
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, FileCheck } from 'lucide-react';
import { useLegalConsent } from '@/hooks/useLegalConsent';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeFileName, UPLOAD_BUCKET } from '@/config/storageManifest';
import { toast } from 'sonner';

interface UploadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: string;
}

export function UploadDrawer({ open, onOpenChange, homeId }: UploadDrawerProps) {
  const { requireConsent, isLoading } = useLegalConsent();
  const { activeTenantId } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

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
    let successCount = 0;

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

    if (successCount > 0) {
      setUploadedCount(prev => prev + successCount);
      toast.success(`${successCount} Datei(en) hochgeladen`);
    }
    setUploading(false);
  }, [activeTenantId, homeId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    disabled: uploading,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Dokument hochladen"
      description="Dokument in deine Zuhause-Akte hochladen"
    >
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg cursor-pointer transition-all mx-4 ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        ) : uploadedCount > 0 ? (
          <FileCheck className="h-12 w-12 text-primary mb-4" />
        ) : (
          <Upload className="h-12 w-12 text-muted-foreground/30 mb-4" />
        )}
        <p className="text-sm text-muted-foreground">
          {isDragActive ? 'Dateien hier ablegen' : uploading ? 'Wird hochgeladen…' : 'Datei auswählen oder hierher ziehen'}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Unterstützt: PDF, JPG, PNG, DOCX
        </p>
        {uploadedCount > 0 && (
          <p className="text-xs text-primary mt-2 font-medium">
            {uploadedCount} Datei(en) erfolgreich hochgeladen
          </p>
        )}
      </div>
    </DetailDrawer>
  );
}
