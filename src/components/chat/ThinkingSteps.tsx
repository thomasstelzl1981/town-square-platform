/**
 * ThinkingSteps — Live work visualization for Armstrong
 * Shows progressive steps during AI processing
 */

import { cn } from '@/lib/utils';
import { Check, Circle, Loader2, AlertCircle } from 'lucide-react';

export interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface ThinkingStepsProps {
  steps: ThinkingStep[];
  className?: string;
  compact?: boolean;
}

export function ThinkingSteps({ steps, className, compact = false }: ThinkingStepsProps) {
  if (steps.length === 0) return null;

  return (
    <div className={cn('space-y-1', className)}>
      {steps.map((step) => (
        <div
          key={step.id}
          className={cn(
            'flex items-center gap-2 transition-all duration-300',
            compact ? 'text-[11px]' : 'text-xs',
            step.status === 'pending' && 'text-muted-foreground/40',
            step.status === 'active' && 'text-foreground',
            step.status === 'completed' && 'text-muted-foreground/60',
            step.status === 'error' && 'text-destructive/70',
          )}
        >
          <div className="shrink-0 w-4 h-4 flex items-center justify-center">
            {step.status === 'completed' && (
              <Check className="h-3 w-3 text-status-success" />
            )}
            {step.status === 'active' && (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            )}
            {step.status === 'pending' && (
              <Circle className="h-2.5 w-2.5 text-muted-foreground/30" />
            )}
            {step.status === 'error' && (
              <AlertCircle className="h-3 w-3 text-destructive" />
            )}
          </div>
          <span className={cn(
            'truncate',
            step.status === 'active' && 'font-medium',
          )}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Pre-defined step templates for different action types
export function getStepsForAction(actionType: string): ThinkingStep[] {
  const base = (labels: string[]): ThinkingStep[] =>
    labels.map((label, i) => ({
      id: `step-${i}`,
      label,
      status: 'pending' as const,
    }));

  if (actionType.includes('MAGIC_INTAKE')) {
    return base([
      'Dokument empfangen',
      'Wird analysiert...',
      'Daten extrahieren',
      'Datensatz anlegen',
      'Ergebnis zusammenfassen',
    ]);
  }

  if (actionType.includes('RESEARCH') || actionType.includes('EXPLAIN')) {
    return base([
      'Frage verstanden',
      'Kontext laden',
      'Antwort formulieren',
    ]);
  }

  if (actionType.includes('DRAFT')) {
    return base([
      'Vorlage laden',
      'Entwurf erstellen',
      'Fertigstellen',
    ]);
  }

  // Default
  return base([
    'Anfrage verarbeiten',
    'Ergebnis berechnen',
  ]);
}
