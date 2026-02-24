import { useLocation, Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  label: string;
  path: string;
  description?: string;
}

interface WorkflowSubbarProps {
  steps: WorkflowStep[];
  moduleBase: string;
  className?: string;
}

export function WorkflowSubbar({ steps, moduleBase, className }: WorkflowSubbarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const getCurrentStepIndex = () => {
    const index = steps.findIndex((step) => 
      currentPath === `/portal/${moduleBase}/${step.path}` ||
      currentPath.startsWith(`/portal/${moduleBase}/${step.path}/`)
    );
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <nav className={cn('w-full', className)}>
      <div className="border-b bg-muted/30">
        <div className="flex items-center overflow-x-auto px-4 py-2 scrollbar-hide">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isClickable = index <= currentStepIndex || isCompleted;

            return (
              <div key={step.id} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground flex-shrink-0" />
                )}
                <Link
                  to={`/portal/${moduleBase}/${step.path}`}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                    isActive && 'bg-primary text-primary-foreground',
                    !isActive && isCompleted && 'text-primary hover:bg-muted',
                    !isActive && !isCompleted && 'text-muted-foreground',
                    isClickable && !isActive && 'hover:bg-muted cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-50'
                  )}
                  onClick={(e) => !isClickable && e.preventDefault()}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                      isActive && 'bg-primary-foreground text-primary',
                      isCompleted && 'bg-primary text-primary-foreground',
                      !isActive && !isCompleted && 'border border-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Pre-configured workflow steps for specific modules
export const FINANCE_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'selbstauskunft', label: 'Selbstauskunft', path: 'selbstauskunft' },
  { id: 'dokumente', label: 'Dokumente', path: 'dokumente' },
  { id: 'anfrage', label: 'Anfrage', path: 'anfrage' },
  { id: 'status', label: 'Status', path: 'status' },
];

export const FINANCE_MANAGER_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'intro', label: 'Eingang', path: '' },
  { id: 'selbstauskunft', label: 'Prüfung', path: 'selbstauskunft' },
  { id: 'einreichen', label: 'Bank', path: 'einreichen' },
  { id: 'status', label: 'Ergebnis', path: 'status' },
];

export const AKQUISE_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'dashboard', label: 'Intake', path: 'dashboard' },
  { id: 'kunden', label: 'Analyse', path: 'kunden' },
  { id: 'mandate', label: 'Präsentation', path: 'mandate' },
  { id: 'tools', label: 'Abschluss', path: 'tools' },
];

export const SERVICES_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'amazon', label: 'Amazon', path: 'amazon' },
  { id: 'bueroshop24', label: 'Büroshop24', path: 'bueroshop24' },
  { id: 'miete24', label: 'Miete24', path: 'miete24' },
  { id: 'bestellungen', label: 'Bestellungen', path: 'bestellungen' },
];

export const PV_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'angebot', label: 'Angebot', path: 'angebot' },
  { id: 'checkliste', label: 'Checkliste', path: 'checkliste' },
  { id: 'projekt', label: 'Projekt', path: 'projekt' },
  { id: 'settings', label: 'Abschluss', path: 'settings' },
];
