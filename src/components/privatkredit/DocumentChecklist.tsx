/**
 * DocumentChecklist — Required documents with status + upload zone
 */
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Check, Circle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocItem {
  type: string;
  label: string;
  uploaded: boolean;
}

interface DocumentChecklistProps {
  disabled?: boolean;
}

export function DocumentChecklist({ disabled }: DocumentChecklistProps) {
  const [docs, setDocs] = useState<DocItem[]>([
    { type: 'payslip', label: 'Gehaltsabrechnungen (letzte 3 Monate)', uploaded: false },
    { type: 'bank_statement', label: 'Kontoauszüge (letzte 3 Monate)', uploaded: false },
    { type: 'id_document', label: 'Ausweisdokument', uploaded: false },
  ]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      // Simulate marking first missing doc as uploaded
      setDocs(prev => {
        const next = [...prev];
        const idx = next.findIndex(d => !d.uploaded);
        if (idx !== -1) next[idx] = { ...next[idx], uploaded: true };
        return next;
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
  });

  const uploadedCount = docs.filter(d => d.uploaded).length;

  return (
    <section className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <h2 className="text-lg font-semibold mb-4">Erforderliche Unterlagen</h2>

      <p className="text-sm text-muted-foreground mb-4">
        Typischerweise werden 2–3 Gehaltsabrechnungen und Kontoauszüge der letzten 3 Monate benötigt.
        Je nach Bank können Anforderungen variieren.
      </p>

      <div className="space-y-2 mb-4">
        {docs.map(doc => (
          <div
            key={doc.type}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
              doc.uploaded ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"
            )}
          >
            {doc.uploaded ? (
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{doc.label}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        {uploadedCount} von {docs.length} Dokumenten hochgeladen
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? 'Dateien hier ablegen' : 'Klicken oder Dateien hierher ziehen'}
        </p>
      </div>
    </section>
  );
}
