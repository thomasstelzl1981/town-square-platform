/**
 * SanierungTab — Orchestrator
 * R-32: 451 → ~120 lines
 */
import { useState } from 'react';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, HardHat } from 'lucide-react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ServiceCaseCard } from '@/components/sanierung/ServiceCaseCard';
import { SanierungDetailInline } from '@/components/sanierung/SanierungDetail';
import { useServiceCases, useCreateServiceCase, useCancelServiceCase } from '@/hooks/useServiceCases';
import { PropertySelectDialog } from '@/components/portal/immobilien/sanierung/PropertySelectDialog';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';
import { AroundhomePartnerCard } from '@/components/sanierung/AroundhomePartnerCard';
import { SanierungDemoDetail } from '@/components/sanierung/SanierungDemoDetail';
import { DEMO_SANIERUNG_SCOPE_ITEMS, DEMO_SANIERUNG_TOTAL } from '@/engines/demoData/data';

const GP_SANIERUNG = GOLDEN_PATH_PROCESSES.find(p => p.id === 'GP-SANIERUNG')!;
const fmt = (v: number) => v.toLocaleString('de-DE') + ' €';

export function SanierungTab() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showPropertySelect, setShowPropertySelect] = useState(false);
  const { data: cases, isLoading } = useServiceCases();
  const createMutation = useCreateServiceCase();
  const cancelMutation = useCancelServiceCase();
  const { isEnabled } = useDemoToggles();

  const activeCases = cases?.filter(c => !['completed', 'cancelled'].includes(c.status)) || [];
  const showDemo = isEnabled('GP-SANIERUNG');

  const handleCreateDraft = async (propertyId: string, unitId: string | null) => {
    setShowPropertySelect(false);
    const result = await createMutation.mutateAsync({ property_id: propertyId, unit_id: unitId, category: 'sonstige', title: 'Neue Sanierung', description: '' });
    if (result?.id) setSelectedCaseId(result.id);
  };

  return (
    <PageShell>
      <ModulePageHeader title="Sanierung" description="Ausschreibungen, Angebote und Dokumentation für deine Sanierungsprojekte" />

      {isLoading ? (
        <WidgetGrid>{[1, 2, 3].map(i => <WidgetCell key={i}><Skeleton className="h-full w-full rounded-lg" /></WidgetCell>)}</WidgetGrid>
      ) : (
        <WidgetGrid>
          {showDemo && (
            <WidgetCell>
              <Card className={cn('h-full cursor-pointer transition-all group flex flex-col', DESIGN.DEMO_WIDGET.CARD, DESIGN.DEMO_WIDGET.HOVER, selectedCaseId === '__demo__' ? 'ring-2 ring-emerald-400 shadow-glow' : '')} onClick={() => setSelectedCaseId('__demo__')}>
                <CardContent className="flex flex-col h-full justify-between p-4">
                  <div className="flex items-start justify-between"><Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px] font-medium")}>{GP_SANIERUNG.demoWidget.badgeLabel}</Badge></div>
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1"><HardHat className="h-5 w-5 text-primary" /></div>
                    <p className="font-semibold text-sm leading-tight">{GP_SANIERUNG.demoWidget.title}</p>
                    <p className="text-[11px] text-muted-foreground">{GP_SANIERUNG.demoWidget.subtitle}</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center">Budget: {fmt(DEMO_SANIERUNG_TOTAL)} · {DEMO_SANIERUNG_SCOPE_ITEMS.length} Positionen</div>
                </CardContent>
              </Card>
            </WidgetCell>
          )}
          <WidgetCell>
            <Card className="h-full cursor-pointer border-dashed hover:border-primary/50 transition-colors flex flex-col" onClick={() => setShowPropertySelect(true)}>
              <CardContent className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Plus className="h-6 w-6 text-primary" /></div>
                <p className="text-sm font-semibold text-center">Neue Sanierung</p>
                <p className="text-xs text-muted-foreground text-center">Objekt wählen — KI erstellt Leistungsverzeichnis</p>
              </CardContent>
            </Card>
          </WidgetCell>
          {activeCases.map(sc => <ServiceCaseCard key={sc.id} serviceCase={sc} isSelected={selectedCaseId === sc.id} onClick={() => setSelectedCaseId(sc.id)} onDelete={id => cancelMutation.mutate(id)} isDeleting={cancelMutation.isPending} />)}
        </WidgetGrid>
      )}

      <AroundhomePartnerCard />
      <PropertySelectDialog open={showPropertySelect} onOpenChange={setShowPropertySelect} onSelect={handleCreateDraft} isCreating={createMutation.isPending} />

      {selectedCaseId === '__demo__' && <SanierungDemoDetail onClose={() => setSelectedCaseId(null)} />}
      {selectedCaseId && selectedCaseId !== '__demo__' && <SanierungDetailInline caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />}
    </PageShell>
  );
}
