/**
 * ValuationDocumentGrid — Upload grid for floor plans, site plans, and other documents
 * Used in the valuation report to attach supporting documents.
 */
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, X, FileImage, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CachedImage } from '@/components/ui/cached-image';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export interface DocumentSlot {
  path: string;
  label: string;
  mimeType?: string;
}

interface ValuationDocumentGridProps {
  propertyId: string;
  tenantId: string;
  documents: DocumentSlot[];
  onDocumentsChange: (docs: DocumentSlot[]) => void;
  maxDocuments?: number;
  bucket?: string;
  className?: string;
  /** Category labels for each slot */
  slotLabels?: string[];
}

const DEFAULT_SLOT_LABELS = [
  'Grundriss EG', 'Grundriss OG', 'Grundriss DG', 'Lageplan',
  'Schnittzeichnung', 'Flurkarte', 'Bebauungsplan', 'Sonstiges',
];

export function ValuationDocumentGrid({
  propertyId,
  tenantId,
  documents,
  onDocumentsChange,
  maxDocuments = 8,
  bucket = 'tenant-documents',
  className,
  slotLabels = DEFAULT_SLOT_LABELS,
}: ValuationDocumentGridProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remaining = maxDocuments - documents.length;
    if (remaining <= 0) {
      toast.error(`Maximal ${maxDocuments} Dokumente erlaubt`);
      return;
    }

    const filesToUpload = acceptedFiles.slice(0, remaining);
    setUploading(true);

    try {
      const newDocs: DocumentSlot[] = [];

      for (const file of filesToUpload) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        const storagePath = `${tenantId}/properties/${propertyId}/plans/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(storagePath, file, { contentType: file.type, upsert: false });

        if (error) {
          console.error('Document upload error:', error);
          toast.error(`Upload fehlgeschlagen: ${file.name}`);
          continue;
        }

        const label = slotLabels[documents.length + newDocs.length] || file.name;
        newDocs.push({ path: storagePath, label, mimeType: file.type });
      }

      if (newDocs.length > 0) {
        onDocumentsChange([...documents, ...newDocs]);
        toast.success(`${newDocs.length} Dokument${newDocs.length > 1 ? 'e' : ''} hochgeladen`);
      }
    } catch (e) {
      console.error('Document upload error:', e);
      toast.error('Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  }, [documents, maxDocuments, propertyId, tenantId, bucket, onDocumentsChange, slotLabels]);

  const handleRemove = useCallback(async (index: number) => {
    const doc = documents[index];
    if (!doc) return;

    const { error } = await supabase.storage.from(bucket).remove([doc.path]);
    if (error) {
      console.error('Document delete error:', error);
      toast.error('Dokument konnte nicht gelöscht werden');
      return;
    }

    const updated = documents.filter((_, i) => i !== index);
    onDocumentsChange(updated);
  }, [documents, bucket, onDocumentsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
    disabled: uploading || documents.length >= maxDocuments,
    noClick: false,
  });

  const isImage = (mime?: string) => mime?.startsWith('image/');

  const slots = Array.from({ length: maxDocuments }, (_, i) => i);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-4 gap-3">
        {slots.map((idx) => {
          const doc = documents[idx];

          if (doc) {
            return (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border bg-muted/20 group">
                {isImage(doc.mimeType) ? (
                  <CachedImage
                    filePath={doc.path}
                    alt={doc.label}
                    className="w-full h-full object-cover"
                    bucket={bucket}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 p-2">
                    <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-[9px] text-muted-foreground text-center truncate w-full">{doc.label}</span>
                  </div>
                )}
                <Badge variant="secondary" className="absolute bottom-1 left-1 text-[8px] px-1 py-0 max-w-[calc(100%-24px)] truncate">
                  {doc.label}
                </Badge>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          }

          // First empty slot = upload trigger
          if (idx === documents.length) {
            return (
              <div
                key={idx}
                {...getRootProps()}
                className={cn(
                  'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border/40 hover:border-primary/40 hover:bg-muted/10'
                )}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground mt-1 text-center px-1">{slotLabels[idx] || 'Dokument'}</span>
                  </>
                )}
              </div>
            );
          }

          // Remaining empty slots
          return (
            <div key={idx} className="aspect-square rounded-xl border border-border/20 bg-muted/10 flex flex-col items-center justify-center">
              <FileImage className="h-4 w-4 text-muted-foreground/30" />
              <span className="text-[8px] text-muted-foreground/30 mt-0.5 text-center px-1">{slotLabels[idx] || ''}</span>
            </div>
          );
        })}
      </div>

      {documents.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          {documents.length} / {maxDocuments} Dokumente · Bilder & PDF-Dateien per Drag-and-Drop hinzufügen
        </p>
      )}
    </div>
  );
}
