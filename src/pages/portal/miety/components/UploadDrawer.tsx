/**
 * UploadDrawer — Drawer for document upload (placeholder)
 */
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { Upload } from 'lucide-react';
import { useLegalConsent } from '@/hooks/useLegalConsent';
import { useEffect } from 'react';

interface UploadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: string;
}

export function UploadDrawer({ open, onOpenChange }: UploadDrawerProps) {
  const { requireConsent, isLoading } = useLegalConsent();

  // Block opening if consent not given
  useEffect(() => {
    if (open && !isLoading && !requireConsent()) {
      onOpenChange(false);
    }
  }, [open, isLoading]);

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Dokument hochladen"
      description="Dokument in deine Zuhause-Akte hochladen"
    >
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Upload className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">
          Datei auswählen
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Unterstützt: PDF, JPG, PNG, DOCX
        </p>
      </div>
    </DetailDrawer>
  );
}
