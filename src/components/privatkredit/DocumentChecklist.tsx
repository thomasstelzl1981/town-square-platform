/**
 * DocumentChecklist — Required documents with status + upload zone
 * Upgraded: SmartDropZone + AIProcessingOverlay for ChatGPT-style feedback
 */
import { useState, useCallback } from 'react';
import { Check, Circle, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { SmartDropZone } from '@/components/shared/SmartDropZone';
import { AIProcessingOverlay } from '@/components/shared/AIProcessingOverlay';

interface DocItem {
  type: string;
  label: string;
  uploaded: boolean;
}

interface DocumentChecklistProps {
  disabled?: boolean;
}

const AI_STEPS = [
  { label: 'Dokument wird gelesen' },
  { label: 'Typ wird erkannt' },
  { label: 'Daten werden extrahiert' },
  { label: 'Prüfung abgeschlossen' },
];

export function DocumentChecklist({ disabled }: DocumentChecklistProps) {
  const [docs, setDocs] = useState<DocItem[]>([
    { type: 'payslip', label: 'Gehaltsabrechnungen (letzte 3 Monate)', uploaded: false },
    { type: 'bank_statement', label: 'Kontoauszüge (letzte 3 Monate)', uploaded: false },
    { type: 'id_document', label: 'Ausweisdokument', uploaded: false },
  ]);
  const [aiActive, setAiActive] = useState(false);
  const [aiStep, setAiStep] = useState(0);

  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;

    // Simulate AI processing
    setAiActive(true);
    setAiStep(0);

    const stepInterval = setInterval(() => {
      setAiStep(prev => {
        if (prev >= AI_STEPS.length - 1) {
          clearInterval(stepInterval);
          setAiActive(false);
          // Mark next unuploaded doc as uploaded
          setDocs(prevDocs => {
            const next = [...prevDocs];
            const idx = next.findIndex(d => !d.uploaded);
            if (idx !== -1) next[idx] = { ...next[idx], uploaded: true };
            return next;
          });
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
  }, []);

  const uploadedCount = docs.filter(d => d.uploaded).length;

  return (
    <Card className={cn(DESIGN.CARD.BASE, disabled && 'opacity-50 pointer-events-none')}>
      <div className={DESIGN.CARD.SECTION_HEADER}>
        <h2 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Erforderliche Unterlagen</h2>
      </div>
      <CardContent className="p-4 space-y-4">
        <p className={DESIGN.TYPOGRAPHY.MUTED}>
          Typischerweise werden 2–3 Gehaltsabrechnungen und Kontoauszüge der letzten 3 Monate benötigt.
          Je nach Bank können Anforderungen variieren.
        </p>

        <div className={DESIGN.LIST.GAP}>
          {docs.map(doc => (
            <div
              key={doc.type}
              className={cn(
                DESIGN.LIST.ROW,
                doc.uploaded && 'border-emerald-500/30 bg-emerald-500/5'
              )}
            >
              <div className="flex items-center gap-3">
                {doc.uploaded ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{doc.label}</span>
              </div>
            </div>
          ))}
        </div>

        <p className={DESIGN.TYPOGRAPHY.HINT}>
          {uploadedCount} von {docs.length} Dokumenten hochgeladen
        </p>

        {/* AI Processing Overlay */}
        <AIProcessingOverlay
          active={aiActive}
          steps={AI_STEPS}
          currentStep={aiStep}
          headline="Dokument wird analysiert…"
          variant="primary"
        />

        {/* Smart Drop Zone */}
        {!aiActive && (
          <SmartDropZone
            onFiles={handleFiles}
            disabled={disabled}
            accept={{
              'application/pdf': ['.pdf'],
              'image/*': ['.png', '.jpg', '.jpeg'],
            }}
            formatsLabel="PDF, JPG, PNG"
            variant="primary"
          />
        )}
      </CardContent>
    </Card>
  );
}