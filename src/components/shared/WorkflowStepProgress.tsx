/**
 * WorkflowStepProgress — Reusable step progress indicator
 * Shows numbered steps with status (pending/active/done) and descriptions
 */
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  label: string;
  description?: string;
  status: 'pending' | 'active' | 'done';
}

interface WorkflowStepProgressProps {
  steps: WorkflowStep[];
  className?: string;
}

export function WorkflowStepProgress({ steps, className }: WorkflowStepProgressProps) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto py-2", className)}>
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center">
          {/* Step indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg min-w-fit"
            style={{
              background: step.status === 'active' 
                ? 'hsl(var(--primary) / 0.1)' 
                : step.status === 'done' 
                  ? 'hsl(var(--primary) / 0.05)' 
                  : undefined,
            }}
          >
            {step.status === 'done' ? (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border-2",
                step.status === 'active'
                  ? "border-primary text-primary bg-primary/10"
                  : "border-muted-foreground/30 text-muted-foreground/50"
              )}>
                {idx + 1}
              </div>
            )}
            <div className="min-w-0">
              <span className={cn(
                "text-xs font-medium whitespace-nowrap",
                step.status === 'active' ? "text-primary" : 
                step.status === 'done' ? "text-foreground" : "text-muted-foreground/60"
              )}>
                {step.label}
              </span>
              {step.description && step.status === 'active' && (
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">{step.description}</p>
              )}
            </div>
          </div>
          {/* Connector */}
          {idx < steps.length - 1 && (
            <div className={cn(
              "w-6 h-px mx-0.5 shrink-0",
              step.status === 'done' ? "bg-primary/40" : "bg-border"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
