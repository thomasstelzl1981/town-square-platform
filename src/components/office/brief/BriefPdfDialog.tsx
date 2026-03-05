/**
 * R-9: PDF preview dialog
 */
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download } from 'lucide-react';

interface BriefPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfPreviewUrl: string | null;
  onDownload: () => void;
}

export function BriefPdfDialog({ open, onOpenChange, pdfPreviewUrl, onDownload }: BriefPdfDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>PDF-Vorschau</DialogTitle>
          <DialogDescription>DIN A4 Brief im PDF-Format</DialogDescription>
        </DialogHeader>
        {pdfPreviewUrl && (
          <iframe src={pdfPreviewUrl} className="w-full flex-1 rounded-md border" style={{ minHeight: '70vh' }} title="Brief PDF Vorschau" />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Schließen</Button>
          <Button onClick={onDownload} className="gap-1.5">
            <Download className="h-4 w-4" />PDF herunterladen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
