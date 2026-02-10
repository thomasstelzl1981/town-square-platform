/**
 * MietyOverviewSection — Next Steps checklist + progress
 */
import { CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MietyOverviewSectionProps {
  contractsCount: number;
  meterReadingsCount: number;
  documentsCount: number;
}

const STEPS = [
  { key: 'contract', label: 'Vertrag hinterlegen', check: (p: MietyOverviewSectionProps) => p.contractsCount > 0 },
  { key: 'meter', label: 'Zählerstand erfassen', check: (p: MietyOverviewSectionProps) => p.meterReadingsCount > 0 },
  { key: 'insurance', label: 'Versicherung prüfen', check: () => false },
  { key: 'provider', label: 'Versorger eintragen', check: () => false },
  { key: 'document', label: 'Dokument hochladen', check: (p: MietyOverviewSectionProps) => p.documentsCount > 0 },
  { key: 'profile', label: 'Profil vervollständigen', check: () => false },
];

export function MietyOverviewSection(props: MietyOverviewSectionProps) {
  const completed = STEPS.filter(s => s.check(props)).length;
  const progress = Math.round((completed / STEPS.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Fortschritt</span>
        <span className="text-sm text-muted-foreground">{completed}/{STEPS.length} erledigt</span>
      </div>
      <Progress value={progress} className="h-2" />

      <div className="space-y-2 mt-3">
        {STEPS.map(step => {
          const done = step.check(props);
          return (
            <div key={step.key} className="flex items-center gap-2.5 text-sm">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              )}
              <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
