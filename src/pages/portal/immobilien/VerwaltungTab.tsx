/**
 * VerwaltungTab — V + V Anlage V Steuererklärung + BWA
 * 
 * Anlage V: Inline-Accordion-Flow (alle Objekte auf einer Seite)
 * BWA: DATEV-konform mit SuSa
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building2, AlertCircle, CheckCircle2, ChevronDown, FileText, BarChart3, ChevronLeft } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useVVSteuerData } from '@/hooks/useVVSteuerData';
import { VVAnlageVForm } from '@/components/vv/VVAnlageVForm';
import { VVErklaerungView } from '@/components/vv/VVErklaerungView';
import { BWATab } from '@/components/portfolio/BWATab';
import { buildContextSummary, calculatePropertyResult } from '@/engines/vvSteuer/engine';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear - 2, currentYear - 3];

export function VerwaltungTab() {
  const [taxYear, setTaxYear] = useState(currentYear - 1);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [showErklaerung, setShowErklaerung] = useState(false);
  const [viewMode, setViewMode] = useState<'anlageV' | 'bwa'>('anlageV');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const { contexts, isLoading, buildPropertyTaxData, save, isSaving } = useVVSteuerData(taxYear);

  const selectedContext = contexts.find((c: any) => c.id === selectedContextId);

  // Build Erklaerung summary when needed
  const erklaerungSummary = useMemo(() => {
    if (!showErklaerung || !selectedContext) return null;
    const propertyDataList = selectedContext.properties
      .map((p: any) => buildPropertyTaxData(p.id))
      .filter(Boolean) as any[];
    if (propertyDataList.length === 0) return null;
    return buildContextSummary(
      selectedContext.id,
      selectedContext.name,
      selectedContext.context_type,
      selectedContext.tax_number || '',
      taxYear,
      propertyDataList,
    );
  }, [showErklaerung, selectedContext, taxYear, buildPropertyTaxData]);

  // Gesamtergebnis for the selected context (Anlage V mode)
  const gesamtErgebnis = useMemo(() => {
    if (!selectedContext) return null;
    let totalIncome = 0;
    let totalCosts = 0;
    let confirmed = 0;
    const total = selectedContext.properties.length;

    for (const prop of selectedContext.properties) {
      const td = buildPropertyTaxData(prop.id);
      if (td) {
        const r = calculatePropertyResult(td);
        totalIncome += r.totalIncome;
        totalCosts += r.totalCosts;
        if (td.manualData.confirmed) confirmed++;
      }
    }

    return { totalIncome, totalCosts, surplus: totalIncome - totalCosts, confirmed, total };
  }, [selectedContext, buildPropertyTaxData]);

  const handleContextClick = (ctxId: string) => {
    if (selectedContextId === ctxId) {
      setSelectedContextId(null);
      setShowErklaerung(false);
    } else {
      setSelectedContextId(ctxId);
      setShowErklaerung(false);
      // Open first accordion by default
      const ctx = contexts.find((c: any) => c.id === ctxId);
      if (ctx?.properties?.length > 0) {
        setOpenAccordions({ [ctx.properties[0].id]: true });
      }
    }
  };

  const toggleAccordion = (propId: string) => {
    setOpenAccordions(prev => ({ ...prev, [propId]: !prev[propId] }));
  };

  const handleBack = () => {
    if (showErklaerung) {
      setShowErklaerung(false);
    } else {
      setSelectedContextId(null);
    }
  };

  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <PageShell>
      <ModulePageHeader
        title="Tax"
        description={viewMode === 'anlageV' 
          ? "Anlage V — Vermietung & Verpachtung für deine Steuererklärung"
          : "BWA — Bewirtschaftungsanalyse auf Vermietereinheit-Ebene"
        }
        actions={
          <div className="flex items-center gap-3">
            {selectedContextId && viewMode === 'anlageV' && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
              </Button>
            )}

            {/* Anlage V / BWA Switch */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
              <FileText className={cn("h-3.5 w-3.5", viewMode === 'anlageV' ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn("text-xs font-medium", viewMode === 'anlageV' ? 'text-foreground' : 'text-muted-foreground')}>Anlage V</span>
              <Switch
                checked={viewMode === 'bwa'}
                onCheckedChange={(checked) => {
                  setViewMode(checked ? 'bwa' : 'anlageV');
                  setShowErklaerung(false);
                }}
              />
              <BarChart3 className={cn("h-3.5 w-3.5", viewMode === 'bwa' ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn("text-xs font-medium", viewMode === 'bwa' ? 'text-foreground' : 'text-muted-foreground')}>BWA</span>
            </div>

            {viewMode === 'anlageV' && (
              <Select value={String(taxYear)} onValueChange={v => { setTaxYear(Number(v)); setShowErklaerung(false); }}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        }
      />

      {/* ═══ BWA MODE ═══ */}
      {viewMode === 'bwa' && (
        <>
          {/* VE Selection for BWA */}
          <WidgetGrid variant="widget">
            {contexts.map((ctx: any) => (
              <WidgetCell key={ctx.id}>
                <button
                  onClick={() => setSelectedContextId(selectedContextId === ctx.id ? null : ctx.id)}
                  className={cn(
                    "w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all",
                    DESIGN.CARD.BASE,
                    selectedContextId === ctx.id
                      ? "ring-2 ring-primary border-primary shadow-sm"
                      : "border-border/50 hover:border-primary/40"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px]">{ctx.context_type}</Badge>
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{ctx.name}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Objekte</span>
                      <span className="font-semibold">{ctx.propertyCount}</span>
                    </div>
                  </div>
                </button>
              </WidgetCell>
            ))}
          </WidgetGrid>

          {/* BWA for selected VE — aggregate all properties */}
          {selectedContext && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold">BWA — {selectedContext.name}</h3>
              <BWATab
                propertyIds={selectedContext.properties.map((p: any) => p.id)}
                veName={selectedContext.name}
                tenantId={selectedContext.properties[0]?.tenant_id || ''}
              />
            </div>
          )}

          {contexts.length === 0 && !isLoading && (
            <Card className={DESIGN.CARD.SECTION}>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Keine Vermietereinheiten gefunden.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ═══ ANLAGE V MODE ═══ */}
      {viewMode === 'anlageV' && (
        <>
          {/* STUFE 1: Vermietereinheit-Widgets */}
          <WidgetGrid variant="widget">
            {contexts.map((ctx: any) => (
              <WidgetCell key={ctx.id}>
                <button
                  onClick={() => handleContextClick(ctx.id)}
                  className={cn(
                    "w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all",
                    DESIGN.CARD.BASE,
                    selectedContextId === ctx.id
                      ? "ring-2 ring-primary border-primary shadow-sm"
                      : "border-border/50 hover:border-primary/40"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-[10px]">{ctx.context_type}</Badge>
                      {ctx.allConfirmed ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{ctx.confirmedCount}/{ctx.propertyCount}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{ctx.name}</span>
                    </div>
                    {ctx.tax_number && (
                      <p className="text-xs text-muted-foreground mt-1">StNr: {ctx.tax_number}</p>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Objekte</span>
                      <span className="font-semibold">{ctx.propertyCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={cn(
                        "border-0 text-[10px]",
                        ctx.allConfirmed
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {ctx.allConfirmed ? 'Alle bestätigt' : 'In Bearbeitung'}
                      </Badge>
                    </div>
                    {ctx.allConfirmed && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Erklärung</span>
                        <FileText className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                  </div>
                </button>
              </WidgetCell>
            ))}
          </WidgetGrid>

          {/* Empty State */}
          {contexts.length === 0 && !isLoading && (
            <Card className={DESIGN.CARD.SECTION}>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Keine Vermietereinheiten mit Objekten gefunden. Legen Sie Objekte im Portfolio an und weisen Sie diese einer Vermietereinheit zu.
                </p>
                <Button variant="link" className="mt-2" onClick={() => window.location.href = '/portal/immobilien/portfolio'}>
                  Zum Portfolio →
                </Button>
              </CardContent>
            </Card>
          )}

          {/* STUFE 3: Erklaerung */}
          {showErklaerung && erklaerungSummary && (
            <VVErklaerungView summary={erklaerungSummary} />
          )}

          {/* INLINE-FLOW: All properties as Collapsible Accordions */}
          {selectedContext && !showErklaerung && (
            <>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{selectedContext.name} — Objekte ({taxYear})</h3>
              </div>

              <div className="space-y-3">
                {selectedContext.properties.map((prop: any) => {
                  const taxData = buildPropertyTaxData(prop.id);
                  const isConfirmed = taxData?.manualData?.confirmed ?? false;
                  const isOpen = openAccordions[prop.id] ?? false;
                  const result = taxData ? calculatePropertyResult(taxData) : null;

                  return (
                    <Collapsible key={prop.id} open={isOpen} onOpenChange={() => toggleAccordion(prop.id)}>
                      <CollapsibleTrigger asChild>
                        <button className={cn(
                          "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                          DESIGN.CARD.BASE,
                          isOpen ? "ring-2 ring-primary border-primary" : "border-border/50 hover:border-primary/40",
                          isConfirmed && !isOpen && "border-primary/30 bg-primary/5"
                        )}>
                          <div className="flex items-center gap-3">
                            {isConfirmed ? (
                              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{prop.code || prop.address}</span>
                                <Badge variant="outline" className="text-[10px]">{prop.property_type}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{prop.address} {prop.address_house_no}, {prop.postal_code} {prop.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {result && (
                              <span className={cn(
                                "text-sm font-semibold",
                                result.surplus >= 0 ? "text-primary" : "text-destructive"
                              )}>
                                {result.surplus >= 0 ? '+' : ''}{fmt(result.surplus)} €
                              </span>
                            )}
                            <ChevronDown className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isOpen && "rotate-180"
                            )} />
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {taxData && (
                          <div className="pt-2 pb-4 px-1">
                            <VVAnlageVForm
                              taxData={taxData}
                              contextTaxNumber={selectedContext.tax_number || ''}
                              onSave={(data, taxRef, ownershipPct) => save({ propertyId: taxData.propertyId, data, taxRefNumber: taxRef, ownershipPercent: ownershipPct })}
                              isSaving={isSaving}
                            />
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>

              {/* Gesamtergebnis — permanent visible */}
              {gesamtErgebnis && (
                <Card className={cn("border-2", gesamtErgebnis.confirmed === gesamtErgebnis.total ? "border-primary/30" : "border-border")}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-sm">Gesamtergebnis — {selectedContext.name}</h4>
                      <Badge className={cn(
                        "text-xs",
                        gesamtErgebnis.confirmed === gesamtErgebnis.total
                          ? "bg-primary/10 text-primary border-0"
                          : "bg-muted text-muted-foreground border-0"
                      )}>
                        {gesamtErgebnis.confirmed}/{gesamtErgebnis.total} bestätigt
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Einnahmen</p>
                        <p className="font-semibold">{fmt(gesamtErgebnis.totalIncome)} €</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Werbungskosten</p>
                        <p className="font-semibold">{fmt(gesamtErgebnis.totalCosts)} €</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Überschuss / Verlust</p>
                        <p className={cn(
                          "font-bold text-lg",
                          gesamtErgebnis.surplus >= 0 ? "text-primary" : "text-destructive"
                        )}>
                          {gesamtErgebnis.surplus >= 0 ? '+' : ''}{fmt(gesamtErgebnis.surplus)} €
                        </p>
                      </div>
                    </div>

                    {gesamtErgebnis.confirmed < gesamtErgebnis.total && (
                      <div className="mt-4 p-3 rounded-lg bg-accent/50 flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">
                          {gesamtErgebnis.total - gesamtErgebnis.confirmed} Objekt(e) noch nicht bestätigt. 
                          Erst nach Bestätigung aller Objekte kann die Steuererklärung generiert werden.
                        </p>
                      </div>
                    )}

                    {gesamtErgebnis.confirmed === gesamtErgebnis.total && (
                      <div className="mt-4 flex justify-end">
                        <Button size="sm" onClick={() => setShowErklaerung(true)}>
                          <FileText className="h-4 w-4 mr-1" />
                          Steuererklärung anzeigen
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </PageShell>
  );
}

export default VerwaltungTab;
