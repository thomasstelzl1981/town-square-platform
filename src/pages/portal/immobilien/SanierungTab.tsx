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
import { Plus, HardHat, ClipboardList, Search, BarChart3, X } from 'lucide-react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { SectionCard } from '@/components/shared/SectionCard';
import { ServiceCaseCard } from '@/components/sanierung/ServiceCaseCard';
import { SanierungDetailInline } from '@/components/sanierung/SanierungDetail';
import { SanierungStepper } from '@/components/sanierung/SanierungStepper';
import { useServiceCases, useCreateServiceCase, useCancelServiceCase } from '@/hooks/useServiceCases';
import { PropertySelectDialog } from '@/components/portal/immobilien/sanierung/PropertySelectDialog';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';
import { Button } from '@/components/ui/button';

const GP_SANIERUNG = GOLDEN_PATH_PROCESSES.find(p => p.id === 'GP-SANIERUNG')!;

// ── Demo scope items for Kernsanierung BER-01 ──
const DEMO_SCOPE_ITEMS = [
  { pos: 1, title: 'Bodenbelag Wohnräume (Eiche Landhausdiele, 65 m²)', cost: 5850 },
  { pos: 2, title: 'Bodenbelag Nassräume (Feinsteinzeug 60×60, 20 m²)', cost: 2400 },
  { pos: 3, title: 'Badsanierung komplett (Dusche, WC, Waschtisch, Armaturen)', cost: 8500 },
  { pos: 4, title: 'Gäste-WC Sanierung (WC, Handwaschbecken, Spiegel)', cost: 3200 },
  { pos: 5, title: 'Malerarbeiten Wände und Decken (85 m² Wohnfläche)', cost: 2550 },
];
const DEMO_TOTAL = DEMO_SCOPE_ITEMS.reduce((s, i) => s + i.cost, 0);

const DEMO_PROVIDERS = [
  { name: 'Berliner Badsanierung GmbH', status: 'Angebot erhalten' as const, amount: 21800, sent: true, best: true },
  { name: 'Boden- und Fliesenwerk Mitte', status: 'Angebot erhalten' as const, amount: 23900, sent: true, best: false },
  { name: 'Sanierung Plus Berlin', status: 'Ausstehend' as const, amount: null, sent: true, best: false },
];

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
                    Budget: {fmt(DEMO_TOTAL)} · {DEMO_SCOPE_ITEMS.length} Positionen
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

      {/* ══ Demo Inline-Detail — Vollständige Sanierungsakte (vertikaler Flow) ══ */}
      {selectedCaseId === '__demo__' && (
        <div className="pt-6">
          <div className={DESIGN.SPACING.SECTION}>
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold tracking-tight">Kernsanierung WE-B01 — Schadowstr., Berlin</h2>
                  <Badge className="bg-primary/10 text-primary border-0">Demo</Badge>
                  <Badge variant="secondary">in_progress</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">SAN-DEMO-001</Badge>
                  <span>•</span>
                  <Badge variant="secondary" className="text-xs">
                    <HardHat className="h-3 w-3 mr-1" />
                    Kernsanierung
                  </Badge>
                  <span>•</span>
                  <span>Schadowstr., 10117 Berlin</span>
                  <span>•</span>
                  <span>ETW, 85 m²</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCaseId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* ── Stepper ── */}
            <SanierungStepper currentStatus="offers_received" />

            {/* ── Section 1: Leistungsumfang ── */}
            <SectionCard title="Leistungsumfang" description="KI-generiertes Leistungsverzeichnis — Kernsanierung, mittlerer Standard" icon={ClipboardList}>
              <div className="space-y-2">
                {DEMO_SCOPE_ITEMS.map(item => (
                  <div key={item.pos} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 text-sm">
                    <span className="text-muted-foreground w-8 shrink-0">{item.pos}.</span>
                    <span className="flex-1">{item.title}</span>
                    <span className="font-medium tabular-nums">{fmt(item.cost)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-border/40 px-3">
                  <span className="text-sm text-muted-foreground">{DEMO_SCOPE_ITEMS.length} Positionen</span>
                  <span className="font-bold text-sm">Gesamt: {fmt(DEMO_TOTAL)}</span>
                </div>
              </div>
            </SectionCard>

            {/* ── Section 2: Dienstleister & Ausschreibung ── */}
            <SectionCard title="Dienstleister & Ausschreibung" description="3 Handwerksbetriebe angefragt — 2 Angebote eingegangen" icon={Search}>
              <div className={DESIGN.FORM_GRID.FULL}>
                {/* Links: Dienstleisterliste */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Angeschriebene Dienstleister</p>
                  {DEMO_PROVIDERS.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30 text-sm">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.status}</p>
                      </div>
                      <span className={cn('font-semibold tabular-nums', p.best ? 'text-primary' : 'text-muted-foreground')}>
                        {p.amount ? fmt(p.amount) : '–'}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Rechts: Ausschreibungsvorschau */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ausschreibungsvorschau</p>
                  <div className="rounded-lg bg-muted/20 border border-border/30 p-4 text-sm space-y-2">
                    <p className="font-medium">Betreff: Ausschreibung Kernsanierung — Schadowstr., Berlin</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Sehr geehrte Damen und Herren, wir bitten um ein Angebot für die Kernsanierung einer
                      85 m² ETW in der Schadowstr., 10117 Berlin. Umfang: Neue Böden (Eiche Landhausdiele +
                      Feinsteinzeug), komplette Badsanierung, Gäste-WC sowie Malerarbeiten. Mittlerer Standard.
                      Bitte beziehen Sie sich bei Rückantwort auf die Kennung <span className="font-mono text-primary">SAN-DEMO-001</span>.
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline" className="text-[10px]">PDF-Anlage: Leistungsverzeichnis</Badge>
                      <Badge variant="outline" className="text-[10px]">Grundriss</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── Section 3: Angebote & Vergabe ── */}
            <SectionCard title="Angebote & Vergabe" description="Eingehende Angebote vergleichen und Auftrag vergeben" icon={BarChart3}>
              <div className="space-y-4">
                {/* Vergleichstabelle */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Position</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Budget</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-primary">Berliner Badsanierung</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Boden- & Fliesenwerk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { title: 'Böden Wohnräume', budget: 5850, a: 5600, b: 6200 },
                        { title: 'Böden Nassräume', budget: 2400, a: 2300, b: 2500 },
                        { title: 'Badsanierung', budget: 8500, a: 8200, b: 9100 },
                        { title: 'Gäste-WC', budget: 3200, a: 3100, b: 3400 },
                        { title: 'Malerarbeiten', budget: 2550, a: 2600, b: 2700 },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-border/20">
                          <td className="py-2 px-3">{row.title}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">{fmt(row.budget)}</td>
                          <td className="py-2 px-3 text-right tabular-nums font-medium text-primary">{fmt(row.a)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{fmt(row.b)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td className="py-2 px-3">Gesamt</td>
                        <td className="py-2 px-3 text-right tabular-nums">{fmt(DEMO_TOTAL)}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-primary">{fmt(21800)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{fmt(23900)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div>
                    <p className="text-sm font-semibold">Empfehlung: Berliner Badsanierung GmbH</p>
                    <p className="text-xs text-muted-foreground">Günstigstes Angebot — 3 % unter Budget ({fmt(21800)})</p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">Bestes Angebot</Badge>
                </div>
              </div>
            </SectionCard>
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
