/**
 * UploadDrawer — Drawer for document upload (placeholder)
 */
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { Upload } from 'lucide-react';

interface UploadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: string;
}

export function UploadDrawer({ open, onOpenChange }: UploadDrawerProps) {
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
          Drag & Drop oder Datei auswählen
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Unterstützt: PDF, JPG, PNG, DOCX
        </p>
      </div>
    </DetailDrawer>
  );
}
