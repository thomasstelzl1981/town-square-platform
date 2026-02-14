/**
 * SanierungTab — Dashboard with widget cards + inline detail below
 * Pattern: Widgets always visible at top, selected Akte opens below
 * 
 * GOLDEN PATH KONFORM: Demo-Widget an Position 0, useDemoToggles
 */
import { useState } from 'react';
import { DESIGN } from '@/config/designManifest';
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
                className={cn(
                  `h-full cursor-pointer transition-all group flex flex-col`,
                  DESIGN.DEMO_WIDGET.CARD,
                  DESIGN.DEMO_WIDGET.HOVER,
                  selectedCaseId === '__demo__' ? 'ring-2 ring-emerald-500 shadow-glow' : ''
                )}
                onClick={() => setSelectedCaseId('__demo__')}
              >
                <CardContent className="flex flex-col h-full justify-between p-4">
                  <div className="flex items-start justify-between">
                    <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px] font-medium")}>
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
                    Budget: 22.500 € · 5 Positionen
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

      {/* Demo Inline-Detail — Vollständige Sanierungsakte */}
      {selectedCaseId === '__demo__' && (
        <div className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold tracking-tight">Kernsanierung WE-B01 — Schadowstr., Berlin</h2>
                <Badge className="bg-primary/10 text-primary border-0">Demo</Badge>
                <Badge variant="secondary">in_progress</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Schadowstr., 10117 Berlin · ETW, 85 m² · Kategorie: Kernsanierung · Budget: 22.500 €
              </p>
            </div>
            <button onClick={() => setSelectedCaseId(null)} className="text-muted-foreground hover:text-foreground p-1">✕</button>
          </div>

          {/* Stepper-Badges */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Leistungsumfang', active: true, done: true },
              { label: 'Dienstleistersuche', active: true, done: true },
              { label: 'Ausschreibung', active: true, done: true },
              { label: 'Angebote', active: true, done: false },
              { label: 'Vergabe', active: false, done: false },
            ].map((s, i) => (
              <Badge key={i} variant={s.done ? 'default' : s.active ? 'secondary' : 'outline'} className="text-xs">
                {i + 1}. {s.label} {s.done && '✓'}
              </Badge>
            ))}
          </div>

          {/* 2-Spalten FORM_GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Links: Leistungsumfang */}
            <Card className="glass-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <h3 className="text-sm font-semibold">Leistungsverzeichnis (KI-generiert)</h3>
              </div>
              <CardContent className="p-4 space-y-2">
                {[
                  { pos: 1, title: 'Bodenbelag Wohnräume (Eiche Landhausdiele, 65 m²)', cost: '5.850 €' },
                  { pos: 2, title: 'Bodenbelag Nassräume (Feinsteinzeug 60×60, 20 m²)', cost: '2.400 €' },
                  { pos: 3, title: 'Badsanierung komplett (Dusche, WC, Waschtisch, Armaturen)', cost: '8.500 €' },
                  { pos: 4, title: 'Gäste-WC Sanierung (WC, Handwaschbecken, Spiegel)', cost: '3.200 €' },
                  { pos: 5, title: 'Malerarbeiten Wände und Decken (85 m² Wohnfläche)', cost: '2.550 €' },
                ].map(p => (
                  <div key={p.pos} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30 text-sm">
                    <span className="text-muted-foreground w-6">{p.pos}.</span>
                    <span className="flex-1">{p.title}</span>
                    <span className="font-medium">{p.cost}</span>
                  </div>
                ))}
                <div className="flex justify-end pt-2 border-t border-border/30">
                  <span className="font-bold text-sm">Gesamt: 22.500 €</span>
                </div>
              </CardContent>
            </Card>

            {/* Rechts: Dienstleister + Angebote */}
            <Card className="glass-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <h3 className="text-sm font-semibold">Dienstleister & Angebote</h3>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ausschreibung versendet an</p>
                  {[
                    { name: 'Berliner Badsanierung GmbH', status: 'Angebot erhalten', amount: '21.800 €', color: 'text-primary' },
                    { name: 'Boden- und Fliesenwerk Mitte', status: 'Angebot erhalten', amount: '23.900 €', color: 'text-muted-foreground' },
                    { name: 'Sanierung Plus Berlin', status: 'Ausstehend', amount: '–', color: 'text-muted-foreground' },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 text-sm">
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.status}</p>
                      </div>
                      <span className={`font-semibold ${d.color}`}>{d.amount}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    Bestes Angebot: <span className="font-semibold text-primary">Berliner Badsanierung GmbH — 21.800 €</span> (3 % unter Budget)
                  </p>
                </div>
              </CardContent>
            </Card>
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
