/**
 * SanierungStepper — Horizontal process bar for renovation workflow
 * Analog to CaseStepper in FM
 */
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SANIERUNG_STEPS = [
  { key: 'scope', label: 'Leistungsumfang' },
  { key: 'providers', label: 'Dienstleister' },
  { key: 'tender', label: 'Ausschreibung' },
  { key: 'offers', label: 'Angebote & Vergabe' },
];

const STATUS_TO_STEP: Record<string, number> = {
  draft: 0, scope_pending: 0, scope_draft: 0,
  scope_finalized: 1, ready_to_send: 1,
  sent: 2,
  offers_received: 3, under_review: 3, awarded: 3, in_progress: 3, completed: 3,
};

interface SanierungStepperProps {
  currentStatus: string;
  className?: string;
}

export function SanierungStepper({ currentStatus, className }: SanierungStepperProps) {
  const currentIdx = STATUS_TO_STEP[currentStatus] ?? 0;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {SANIERUNG_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                    isDone && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-primary/10 text-primary',
                    !isDone && !isCurrent && 'border-border bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium text-center max-w-[72px] leading-tight',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < SANIERUNG_STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1 mt-[-16px]',
                    idx < currentIdx ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
