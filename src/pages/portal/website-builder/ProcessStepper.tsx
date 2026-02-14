/**
 * ProcessStepper — Horizontal 3-step progress indicator
 */
import { Check, Palette, FileText, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepId = 'design' | 'content' | 'publish';

interface Step {
  id: StepId;
  label: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { id: 'design', label: 'Design & Grunddaten', icon: Palette },
  { id: 'content', label: 'Inhalte bearbeiten', icon: FileText },
  { id: 'publish', label: 'Veröffentlichen', icon: Globe },
];

interface Props {
  currentStep: StepId;
  onStepClick: (step: StepId) => void;
  completedSteps?: StepId[];
}

export function ProcessStepper({ currentStep, onStepClick, completedSteps = [] }: Props) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center gap-2 w-full">
      {STEPS.map((step, i) => {
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.includes(step.id);
        const isPast = i < currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => onStepClick(step.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all w-full text-left',
                isActive && 'bg-primary/10 text-primary border border-primary/30',
                !isActive && (isCompleted || isPast)
                  ? 'text-muted-foreground hover:bg-muted/50'
                  : !isActive && 'text-muted-foreground/60 hover:bg-muted/30',
              )}
            >
              <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                isActive && 'bg-primary text-primary-foreground',
                isCompleted && !isActive && 'bg-emerald-500 text-white',
                !isActive && !isCompleted && 'bg-muted text-muted-foreground',
              )}>
                {isCompleted && !isActive ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-px w-6 shrink-0 mx-1',
                isPast || isCompleted ? 'bg-primary/40' : 'bg-border/50',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
