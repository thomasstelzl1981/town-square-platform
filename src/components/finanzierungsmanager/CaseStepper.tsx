/**
 * CaseStepper — Visual process bar for FM pipeline
 * Shows: delegated → accepted → editing → ready → submitted → in_processing → completed
 */
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FM_PIPELINE_STEPS } from '@/types/finance';

interface CaseStepperProps {
  currentStatus: string;
  className?: string;
}

const STEP_ORDER = FM_PIPELINE_STEPS.filter(s => s.key !== 'rejected').map(s => s.key as string);

function getStepIndex(status: string): number {
  const mapped = status === 'active' ? 'accepted' : status === 'in_processing' ? 'editing' : status;
  const idx = STEP_ORDER.indexOf(mapped);
  return idx >= 0 ? idx : 0;
}

export function CaseStepper({ currentStatus, className }: CaseStepperProps) {
  const currentIdx = getStepIndex(currentStatus);
  const isRejected = currentStatus === 'rejected';

  const steps = FM_PIPELINE_STEPS.filter(s => s.key !== 'rejected');

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isDone = !isRejected && idx < currentIdx;
          const isCurrent = !isRejected && idx === currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 transition-colors',
                    isDone && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-primary/10 text-primary',
                    !isDone && !isCurrent && 'border-border bg-muted text-muted-foreground',
                    isRejected && 'border-destructive bg-destructive/10 text-destructive'
                  )}
                >
                  {isDone ? <Check className="h-3 w-3 md:h-4 md:w-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'text-[9px] md:text-[10px] font-medium text-center max-w-[52px] md:max-w-[72px] leading-tight hidden md:block',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
                {/* Mobile: only show current step label */}
                {isCurrent && (
                  <span className="text-[9px] font-medium text-primary text-center max-w-[52px] leading-tight md:hidden">
                    {step.label}
                  </span>
                )}
              </div>
              {idx < steps.length - 1 && (
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
      {isRejected && (
        <div className="text-center mt-2">
          <span className="text-xs font-medium text-destructive">Antrag abgelehnt</span>
        </div>
      )}
    </div>
  );
}
