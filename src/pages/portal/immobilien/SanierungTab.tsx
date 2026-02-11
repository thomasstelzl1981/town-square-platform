import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, Wrench, Zap, Paintbrush, Home, Square, Flame, Package, Building2, ClipboardList,
  ChevronDown, ChevronRight, HardHat, CheckCircle2, Circle, Search, FileText, BarChart3
} from 'lucide-react';
import { useServiceCases, useServiceCaseStats, ServiceCaseCategory } from '@/hooks/useServiceCases';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { ServiceCaseStatusBadge } from '@/components/portal/immobilien/sanierung/ServiceCaseStatusBadge';
import { ServiceCaseCreateDialog } from '@/components/portal/immobilien/sanierung/ServiceCaseCreateDialog';
import { ScopeDefinitionPanel } from '@/components/portal/immobilien/sanierung/scope/ScopeDefinitionPanel';
import { formatCurrency } from '@/lib/formatters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ============================================================================
// Workflow Steps
// ============================================================================
const WORKFLOW_STEPS = [
  { id: 'draft', label: 'Entwurf', statuses: ['draft', 'scope_pending', 'scope_draft'] },
  { id: 'ready', label: 'Bereit', statuses: ['scope_finalized', 'ready_to_send'] },
  { id: 'sent', label: 'Versendet', statuses: ['sent'] },
  { id: 'offers', label: 'Angebote', statuses: ['offers_received', 'under_review'] },
  { id: 'awarded', label: 'Vergeben', statuses: ['awarded', 'in_progress'] },
  { id: 'completed', label: 'Fertig', statuses: ['completed'] },
];

const INLINE_WORKFLOW_STEPS = [
  { id: 'scope', label: 'Leistungsumfang', icon: FileText, description: 'KI-Analyse, Positionen bearbeiten, Kostenschätzung' },
  { id: 'providers', label: 'Dienstleister finden', icon: Search, description: 'Handwerker in der Nähe suchen und auswählen' },
  { id: 'tender', label: 'Ausschreibung versenden', icon: HardHat, description: 'Anfragen an ausgewählte Dienstleister senden' },
  { id: 'compare', label: 'Angebote vergleichen', icon: BarChart3, description: 'Eingehende Angebote bewerten und vergeben' },
];

const CATEGORY_ICONS: Record<ServiceCaseCategory, React.ComponentType<{ className?: string }>> = {
  sanitaer: Wrench,
  elektro: Zap,
  maler: Paintbrush,
  dach: Home,
  fenster: Square,
  heizung: Flame,
  gutachter: ClipboardList,
  hausverwaltung: Building2,
  sonstige: Package,
};

const CATEGORY_LABELS: Record<ServiceCaseCategory, string> = {
  sanitaer: 'Sanitär', elektro: 'Elektro', maler: 'Maler', dach: 'Dach',
  fenster: 'Fenster', heizung: 'Heizung', gutachter: 'Gutachter',
  hausverwaltung: 'HV', sonstige: 'Sonstige',
};

// Determine which workflow step a case is on
function getActiveStep(status: string): number {
  if (['draft', 'scope_pending', 'scope_draft'].includes(status)) return 0;
  if (['scope_finalized', 'ready_to_send'].includes(status)) return 1;
  if (['sent'].includes(status)) return 2;
  if (['offers_received', 'under_review', 'awarded', 'in_progress', 'completed'].includes(status)) return 3;
  return 0;
}

// ============================================================================
// Component
// ============================================================================
export function SanierungTab() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [viewStep, setViewStep] = useState<number | null>(null);
  const { data: cases, isLoading } = useServiceCases();
  const { data: stats } = useServiceCaseStats();
  
  const activeCases = cases?.filter(c => !['completed', 'cancelled'].includes(c.status)) || [];
  
  const getStepCount = (stepId: string) => {
    const step = WORKFLOW_STEPS.find(s => s.id === stepId);
    if (!step || !stats) return 0;
    return step.statuses.reduce((sum, status) => sum + (stats.byStatus[status] || 0), 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <ModulePageHeader title="Sanierung" description="Ausschreibungen, Angebote und Dokumentation Ihrer Sanierungsprojekte" />
      
      {/* Compact Workflow Progress */}
      <div className="flex items-center gap-1">
        {WORKFLOW_STEPS.map((step, index) => {
          const count = getStepCount(step.id);
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: count > 0 ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.5)',
                  color: count > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}>
                <span>{step.label}</span>
                {count > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full h-4 min-w-4 text-[10px] flex items-center justify-center px-1">
                    {count}
                  </span>
                )}
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="w-4 h-px bg-border mx-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Header + Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Aktive Vorgänge
          {activeCases.length > 0 && (
            <Badge variant="outline" className="ml-2">{activeCases.length}</Badge>
          )}
        </h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Sanierung starten
        </Button>
      </div>

      {/* Cases List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : activeCases.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <HardHat className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Erste Sanierung starten</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Beschreiben Sie Ihr Vorhaben in wenigen Worten — die KI erstellt daraus ein 
              strukturiertes Leistungsverzeichnis und Sie finden passende Dienstleister.
            </p>
            <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Sanierung starten
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Case Cards with Inline Workflow */
        <div className="space-y-3">
          {activeCases.map((serviceCase) => {
            const CategoryIcon = CATEGORY_ICONS[serviceCase.category] || Package;
            const isExpanded = expandedCaseId === serviceCase.id;
            const activeStep = getActiveStep(serviceCase.status);
            
            return (
              <Collapsible 
                key={serviceCase.id} 
                open={isExpanded} 
                onOpenChange={(open) => { setExpandedCaseId(open ? serviceCase.id : null); setViewStep(null); }}
              >
                <Card className={isExpanded ? 'border-primary/30' : ''}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="h-9 w-9 rounded-lg bg-muted/80 flex items-center justify-center flex-shrink-0">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{serviceCase.title}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {serviceCase.tender_id || serviceCase.public_id}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {serviceCase.property?.address}
                            {serviceCase.unit && ` · ${serviceCase.unit.code || serviceCase.unit.unit_number}`}
                          </p>
                        </div>
                        
                        {/* Status */}
                        <ServiceCaseStatusBadge status={serviceCase.status} />
                        
                        {/* Cost */}
                        <div className="text-sm text-right hidden md:block min-w-[100px]">
                          {serviceCase.cost_estimate_min && serviceCase.cost_estimate_max ? (
                            <span>{formatCurrency(serviceCase.cost_estimate_min / 100)} – {formatCurrency(serviceCase.cost_estimate_max / 100)}</span>
                          ) : serviceCase.budget_estimate ? (
                            <span>{formatCurrency(Number(serviceCase.budget_estimate))}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        
                        {/* Chevron */}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  
                <CollapsibleContent>
                    <div className="border-t px-4 py-5">
                      {/* Vertical Stepper */}
                      <div className="flex gap-6">
                        {/* Steps sidebar — clickable */}
                        <div className="w-56 flex-shrink-0 space-y-1">
                          {INLINE_WORKFLOW_STEPS.map((step, idx) => {
                            const StepIcon = step.icon;
                            const currentViewStep = viewStep ?? activeStep;
                            const isViewing = idx === currentViewStep;
                            const isDone = idx < activeStep;
                            const isReachable = idx <= activeStep;
                            return (
                              <button
                                key={step.id}
                                type="button"
                                disabled={!isReachable}
                                onClick={() => isReachable && setViewStep(idx)}
                                className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-sm text-left transition-colors ${
                                  isViewing ? 'bg-primary/10 text-primary' : isDone ? 'text-muted-foreground hover:bg-muted/50' : 'text-muted-foreground/50'
                                } ${isReachable ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                <div className="mt-0.5 flex-shrink-0">
                                  {isDone ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : isViewing ? (
                                    <StepIcon className="h-4 w-4" />
                                  ) : (
                                    <Circle className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{step.label}</p>
                                  <p className="text-xs mt-0.5 opacity-70">{step.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Viewed step content */}
                        <div className="flex-1 min-w-0">
                          {(viewStep ?? activeStep) === 0 && (
                            <ScopeDefinitionPanel
                              serviceCase={serviceCase}
                              onBack={() => setExpandedCaseId(null)}
                              onNext={() => {}}
                            />
                          )}
                          {(viewStep ?? activeStep) === 1 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
                              <p className="font-medium">Dienstleister finden</p>
                              <p className="text-sm text-muted-foreground mt-1">Suchen Sie passende Handwerker in der Nähe.</p>
                              <Button className="mt-4" variant="outline">
                                <Search className="mr-2 h-4 w-4" />
                                Suche starten
                              </Button>
                            </div>
                          )}
                          {(viewStep ?? activeStep) >= 2 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <HardHat className="h-10 w-10 text-muted-foreground/40 mb-3" />
                              <p className="font-medium">{INLINE_WORKFLOW_STEPS[(viewStep ?? activeStep)]?.label}</p>
                              <p className="text-sm text-muted-foreground mt-1">{INLINE_WORKFLOW_STEPS[(viewStep ?? activeStep)]?.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
      
      {/* Create Dialog */}
      <ServiceCaseCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={(caseId) => {
          setExpandedCaseId(caseId);
        }}
      />
    </div>
  );
}
