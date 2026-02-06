import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, Wrench, Zap, Paintbrush, Home, Square, Flame, Package, Building2, ClipboardList,
  ArrowRight, Mail, AlertCircle, ChevronRight
} from 'lucide-react';
import { useServiceCases, useServiceCaseStats, ServiceCaseCategory } from '@/hooks/useServiceCases';
import { ServiceCaseStatusBadge } from '@/components/portal/immobilien/sanierung/ServiceCaseStatusBadge';
import { ServiceCaseCreateDialog } from '@/components/portal/immobilien/sanierung/ServiceCaseCreateDialog';
import { formatCurrency } from '@/lib/formatters';

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

// ============================================================================
// Category Config
// ============================================================================
const CATEGORIES: { id: ServiceCaseCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'sanitaer', label: 'Sanitär', icon: Wrench },
  { id: 'elektro', label: 'Elektro', icon: Zap },
  { id: 'maler', label: 'Maler', icon: Paintbrush },
  { id: 'dach', label: 'Dach', icon: Home },
  { id: 'fenster', label: 'Fenster', icon: Square },
  { id: 'heizung', label: 'Heizung', icon: Flame },
  { id: 'gutachter', label: 'Gutachter', icon: ClipboardList },
  { id: 'hausverwaltung', label: 'HV', icon: Building2 },
  { id: 'sonstige', label: 'Sonstige', icon: Package },
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

// ============================================================================
// Component
// ============================================================================
export function SanierungTab() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: cases, isLoading } = useServiceCases();
  const { data: stats } = useServiceCaseStats();
  
  // Filter active cases (not completed/cancelled)
  const activeCases = cases?.filter(c => !['completed', 'cancelled'].includes(c.status)) || [];
  
  // Get workflow step counts
  const getStepCount = (stepId: string) => {
    const step = WORKFLOW_STEPS.find(s => s.id === stepId);
    if (!step || !stats) return 0;
    return step.statuses.reduce((sum, status) => sum + (stats.byStatus[status] || 0), 0);
  };
  
  // Get category counts
  const getCategoryCount = (categoryId: ServiceCaseCategory) => {
    return stats?.byCategory[categoryId] || 0;
  };

  return (
    <div className="space-y-6">
      {/* Workflow Visualisierung */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Workflow: Ausschreibung → Angebot → Vergabe → Dokumentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {WORKFLOW_STEPS.map((step, index) => {
              const count = getStepCount(step.id);
              const isActive = count > 0;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`
                    flex-1 py-2 px-3 text-center text-sm rounded-md border relative
                    ${isActive 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-muted/50 text-muted-foreground border-muted'
                    }
                  `}>
                    {step.label}
                    {count > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-5 min-w-5 text-xs px-1.5"
                      >
                        {count}
                      </Badge>
                    )}
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Header mit Aktion */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Aktive Vorgänge
          {activeCases.length > 0 && (
            <Badge variant="outline" className="ml-2">{activeCases.length}</Badge>
          )}
        </h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Vorgang
        </Button>
      </div>

      {/* Aktive Vorgänge Tabelle */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Tender-ID</TableHead>
                <TableHead className="w-[100px]">Kategorie</TableHead>
                <TableHead>Objekt</TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Schätzung</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : activeCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Wrench className="h-10 w-10 text-muted-foreground/40" />
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Keine aktiven Sanierungsvorgänge</p>
                        <p className="text-sm text-muted-foreground/70">
                          Starten Sie eine Ausschreibung für Sanitär, Elektro, Maler oder andere Gewerke.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setCreateDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ersten Vorgang anlegen
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                activeCases.map((serviceCase) => {
                  const CategoryIcon = CATEGORY_ICONS[serviceCase.category] || Package;
                  return (
                    <TableRow key={serviceCase.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">
                        {serviceCase.tender_id || serviceCase.public_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {CATEGORIES.find(c => c.id === serviceCase.category)?.label || serviceCase.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {serviceCase.property?.code && (
                            <span className="text-muted-foreground">{serviceCase.property.code} — </span>
                          )}
                          {serviceCase.property?.address}
                          {serviceCase.unit && (
                            <span className="text-muted-foreground ml-1">
                              ({serviceCase.unit.code || serviceCase.unit.unit_number})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{serviceCase.title}</TableCell>
                      <TableCell>
                        <ServiceCaseStatusBadge status={serviceCase.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {serviceCase.cost_estimate_min && serviceCase.cost_estimate_max ? (
                          <span className="text-sm">
                            {formatCurrency(serviceCase.cost_estimate_min / 100)} — {formatCurrency(serviceCase.cost_estimate_max / 100)}
                          </span>
                        ) : serviceCase.budget_estimate ? (
                          <span className="text-sm">{formatCurrency(Number(serviceCase.budget_estimate))}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unzugeordnete Angebote */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Unzugeordnete Angebote
          </CardTitle>
          <CardDescription>
            Eingehende E-Mails mit Angeboten, die keiner Tender-ID zugeordnet werden können
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center border border-dashed rounded-lg">
            <Mail className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Keine unzugeordneten Angebote vorhanden</p>
          </div>
        </CardContent>
      </Card>

      {/* Kategorien Übersicht */}
      <div className="space-y-4">
        <h3 className="font-medium">Kategorien</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = getCategoryCount(cat.id);
            return (
              <Card key={cat.id} className={`text-center ${count > 0 ? 'border-primary/30' : ''}`}>
                <CardContent className="py-3 px-2">
                  <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs font-medium truncate">{cat.label}</p>
                  <p className={`text-lg font-bold ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {count}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info-Hinweis */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Wohnungs- und Haussanierungen</p>
            <p className="text-sm text-muted-foreground">
              Dieses Modul unterstützt Innensanierungen von Wohnungen und Häusern. 
              Für komplette Gebäudesanierungen (Fassade, Dachstuhl MFH) ist das System nicht ausgelegt.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Create Dialog */}
      <ServiceCaseCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={(caseId) => {
          console.log('Created case:', caseId);
          // TODO: Navigate to scope definition
        }}
      />
    </div>
  );
}
