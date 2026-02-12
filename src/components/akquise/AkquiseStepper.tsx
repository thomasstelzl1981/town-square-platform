/**
 * AkquiseStepper — Horizontal process bar for acquisition mandate workflow
 * Analog to CaseStepper in FM
 */
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const AKQUISE_STEPS = [
  { key: 'gate', label: 'Gate / Annahme' },
  { key: 'sourcing', label: 'Sourcing & Outreach' },
  { key: 'analysis', label: 'Eingang & Analyse' },
  { key: 'delivery', label: 'Delivery' },
];

const STATUS_TO_STEP: Record<string, number> = {
  assigned: 0,
  active: 1,
  sourcing: 1,
  analyzing: 2,
  presenting: 3,
  completed: 3,
  closed: 3,
};

interface AkquiseStepperProps {
  currentStatus: string;
  hasTermsGate?: boolean;
  className?: string;
}

export function AkquiseStepper({ currentStatus, hasTermsGate, className }: AkquiseStepperProps) {
  let currentIdx = STATUS_TO_STEP[currentStatus] ?? 1;
  // If terms gate is confirmed, skip gate step
  if (!hasTermsGate && currentIdx === 0) currentIdx = 1;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {AKQUISE_STEPS.map((step, idx) => {
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
                    'text-[10px] font-medium text-center max-w-[80px] leading-tight',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < AKQUISE_STEPS.length - 1 && (
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
