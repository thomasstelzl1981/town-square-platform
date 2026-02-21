/**
 * IntakeHowItWorks — 3-step explanation of the Magic Intake pipeline.
 */

import { FolderSearch, Upload, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const STEPS = [
  {
    icon: FolderSearch,
    title: '1. Kategorie wählen',
    description: 'Wählen Sie, um welchen Bereich es geht — Immobilie, Fahrzeug, PV-Anlage oder andere.',
  },
  {
    icon: Upload,
    title: '2. Dokument hochladen',
    description: 'Laden Sie Ihre Unterlagen hoch — per Drag & Drop oder Klick. Bis zu 20 MB pro Datei.',
  },
  {
    icon: Sparkles,
    title: '3. KI analysiert & befüllt',
    description: 'Armstrong liest Ihre Dokumente aus und befüllt automatisch die passenden Felder.',
  },
];

export function IntakeHowItWorks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STEPS.map((step) => (
        <Card key={step.title} className="border-dashed">
          <CardContent className="p-5 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
