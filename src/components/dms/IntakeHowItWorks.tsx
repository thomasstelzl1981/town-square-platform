/**
 * IntakeHowItWorks — Compact horizontal process stepper for Magic Intake.
 * Shows 4 steps with arrow connectors. No hero block, no value props.
 */

import { ArrowRight } from 'lucide-react';

const PROCESS_STEPS = [
  { step: '1', label: 'Kategorie wählen', sublabel: 'Was möchten Sie einlesen?' },
  { step: '2', label: 'Dokument hochladen', sublabel: 'PDF, Bild, Word oder Excel' },
  { step: '3', label: 'KI analysiert', sublabel: 'Armstrong extrahiert alle Daten' },
  { step: '4', label: 'Felder befüllt', sublabel: 'Prüfen, bestätigen, fertig' },
];

export function IntakeHowItWorks() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        So funktioniert's
      </p>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-0">
        {PROCESS_STEPS.map((ps, idx) => (
          <div key={ps.step} className="flex items-center gap-3 md:flex-1">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                {ps.step}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{ps.label}</p>
                <p className="text-[11px] text-muted-foreground">{ps.sublabel}</p>
              </div>
            </div>
            {idx < PROCESS_STEPS.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 hidden md:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
