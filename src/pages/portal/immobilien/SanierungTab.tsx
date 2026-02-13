/**
 * SanierungTab — Dashboard with widget cards + inline detail below
 * Pattern: Widgets always visible at top, selected Akte opens below
 * 
 * GOLDEN PATH KONFORM: Demo-Widget an Position 0, useDemoToggles
 */
import { useState } from 'react';
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

const GP_SANIERUNG = GOLDEN_PATH_PROCESSES.find(p => p.id === 'GP-SANIERUNG')!;

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
    const result = await createMutation.mutateAsync({
      property_id: propertyId,
      unit_id: unitId,
      category: 'sonstige',
      title: 'Neue Sanierung',
      description: '',
    });
    if (result?.id) {
      setSelectedCaseId(result.id);
    }
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Sanierung"
        description={`${activeCases.length} aktive Vorgänge — Ausschreibungen, Angebote und Dokumentation.`}
      />

      {isLoading ? (
        <WidgetGrid>
          {[1, 2, 3].map(i => <WidgetCell key={i}><Skeleton className="h-full w-full rounded-lg" /></WidgetCell>)}
        </WidgetGrid>
      ) : (
        <WidgetGrid>
          {/* Demo-Widget an Position 0 */}
          {showDemo && (
            <WidgetCell>
              <Card
                className={`h-full cursor-pointer transition-all hover:shadow-lg group flex flex-col ${
                  selectedCaseId === '__demo__' ? 'ring-2 ring-primary shadow-glow' : ''
                }`}
                onClick={() => setSelectedCaseId('__demo__')}
              >
                <CardContent className="flex flex-col h-full justify-between p-4">
                  <div className="flex items-start justify-between">
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-medium">
                      {GP_SANIERUNG.demoWidget.badgeLabel}
                    </Badge>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                      <HardHat className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-semibold text-sm leading-tight">{GP_SANIERUNG.demoWidget.title}</p>
                    <p className="text-[11px] text-muted-foreground">{GP_SANIERUNG.demoWidget.subtitle}</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center">
                    Budget: 45.000 € · 5 Positionen
                  </div>
                </CardContent>
              </Card>
            </WidgetCell>
          )}

          {/* CTA-Widget */}
          <WidgetCell>
            <Card
              className="h-full cursor-pointer border-dashed hover:border-primary/50 transition-colors flex flex-col"
              onClick={() => setShowPropertySelect(true)}
            >
              <CardContent className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-center">Neue Sanierung</p>
                <p className="text-xs text-muted-foreground text-center">
                  Objekt wählen — KI erstellt Leistungsverzeichnis
                </p>
              </CardContent>
            </Card>
          </WidgetCell>

          {/* Echte Cases */}
          {activeCases.map(sc => (
            <ServiceCaseCard
              key={sc.id}
              serviceCase={sc}
              isSelected={selectedCaseId === sc.id}
              onClick={() => setSelectedCaseId(sc.id)}
              onDelete={(id) => cancelMutation.mutate(id)}
              isDeleting={cancelMutation.isPending}
            />
          ))}
        </WidgetGrid>
      )}

      <PropertySelectDialog
        open={showPropertySelect}
        onOpenChange={setShowPropertySelect}
        onSelect={handleCreateDraft}
        isCreating={createMutation.isPending}
      />

      {/* Demo Inline-Detail */}
      {selectedCaseId === '__demo__' && (
        <div className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold tracking-tight">Demo: Sanierung EFH Berlin</h2>
                <Badge className="bg-primary/10 text-primary border-0">Demo</Badge>
                <Badge variant="secondary">in_progress</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Prenzlauer Allee 88, 10405 Berlin · Kategorie: Sonstige · Budget: 45.000 €
              </p>
            </div>
            <button
              onClick={() => setSelectedCaseId(null)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              ✕
            </button>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Leistungsverzeichnis (5 Positionen)</h3>
            <div className="space-y-2 text-sm">
              {[
                { pos: 1, title: 'Fassadendämmung WDVS 14cm', cost: '12.500 €' },
                { pos: 2, title: 'Fensteraustausch 3-fach Verglasung (8 Stk)', cost: '9.600 €' },
                { pos: 3, title: 'Dachneueindeckung inkl. Dämmung', cost: '14.200 €' },
                { pos: 4, title: 'Heizungserneuerung Wärmepumpe', cost: '6.800 €' },
                { pos: 5, title: 'Elektroinstallation Modernisierung', cost: '1.900 €' },
              ].map(p => (
                <div key={p.pos} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground w-6">{p.pos}.</span>
                  <span className="flex-1">{p.title}</span>
                  <span className="font-medium">{p.cost}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-border/30">
              <span className="font-bold">Gesamt: 45.000 €</span>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold">Angebote (2 eingegangen)</h3>
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between py-1.5">
                <span>Meister Bau GmbH</span>
                <span className="font-medium text-foreground">42.300 €</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Renovierungsprofi Berlin</span>
                <span className="font-medium text-foreground">47.800 €</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Echte Cases Inline-Detail */}
      {selectedCaseId && selectedCaseId !== '__demo__' && (
        <SanierungDetailInline
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
        />
      )}
    </PageShell>
  );
}
