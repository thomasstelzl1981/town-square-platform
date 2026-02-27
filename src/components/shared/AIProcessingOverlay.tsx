/**
 * AIProcessingOverlay — ChatGPT-style AI analysis feedback
 * Shared component: Step-timeline, thinking animation, real-time timer, progress bar.
 * Used across all modules that trigger AI processing after file upload.
 */
import { useState, useEffect, useRef } from 'react';
import { Sparkles, Brain, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface AIStep {
  label: string;
  /** Optional icon override — defaults to Circle/CheckCircle */
  icon?: React.ReactNode;
}

export interface AIProcessingOverlayProps {
  /** Whether the AI is currently processing */
  active: boolean;
  /** Ordered list of analysis steps */
  steps: AIStep[];
  /** Index of the step currently running (0-based). Steps before this are "done". */
  currentStep: number;
  /** Optional: override the thinking headline */
  headline?: string;
  /** Optional: show a determinate progress value 0-100 instead of indeterminate */
  progressValue?: number;
  /** Optional: accent color variant */
  variant?: 'primary' | 'amber' | 'cyan' | 'violet' | 'emerald' | 'teal';
  /** Called when user clicks cancel (optional) */
  onCancel?: () => void;
  className?: string;
}

const VARIANT_CLASSES: Record<string, { ring: string; text: string; bg: string; bar: string }> = {
  primary: { ring: 'border-primary/30', text: 'text-primary', bg: 'bg-primary/5', bar: 'bg-primary' },
  amber:   { ring: 'border-amber-400/30', text: 'text-amber-500', bg: 'bg-amber-500/5', bar: 'bg-amber-500' },
  cyan:    { ring: 'border-cyan-400/30', text: 'text-cyan-500', bg: 'bg-cyan-500/5', bar: 'bg-cyan-500' },
  violet:  { ring: 'border-violet-400/30', text: 'text-violet-500', bg: 'bg-violet-500/5', bar: 'bg-violet-500' },
  emerald: { ring: 'border-emerald-400/30', text: 'text-emerald-500', bg: 'bg-emerald-500/5', bar: 'bg-emerald-500' },
  teal:    { ring: 'border-teal-400/30', text: 'text-teal-500', bg: 'bg-teal-500/5', bar: 'bg-teal-500' },
};

export function AIProcessingOverlay({
  active,
  steps,
  currentStep,
  headline = 'KI analysiert…',
  progressValue,
  variant = 'primary',
  onCancel,
  className,
}: AIProcessingOverlayProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (active) {
      setElapsed(0);
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  if (!active) return null;

  const v = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const pct = progressValue ?? Math.min(95, ((currentStep) / steps.length) * 100);

  return (
    <div className={cn(
      'rounded-xl border p-5 space-y-4 animate-fade-in',
      v.ring, v.bg,
      className,
    )}>
      {/* Header: Thinking icon + headline + timer */}
      <div className="flex items-center gap-3">
        <div className={cn('relative flex items-center justify-center h-10 w-10 rounded-full', v.bg)}>
          <Brain className={cn('h-5 w-5 animate-pulse', v.text)} />
          <Sparkles className={cn('absolute -top-1 -right-1 h-3.5 w-3.5 animate-bounce', v.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold', v.text)}>{headline}</p>
          <p className="text-xs text-muted-foreground">
            Läuft seit {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Abbrechen
          </button>
        )}
      </div>

      {/* Progress bar */}
      <Progress value={pct} className="h-1.5" />

      {/* Step timeline */}
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const isDone = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={i} className="flex items-center gap-2.5">
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className={cn('h-4 w-4 animate-spin shrink-0', v.text)} />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span className={cn(
                'text-sm transition-colors',
                isDone && 'text-muted-foreground line-through',
                isCurrent && 'font-medium text-foreground',
                !isDone && !isCurrent && 'text-muted-foreground/50',
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
