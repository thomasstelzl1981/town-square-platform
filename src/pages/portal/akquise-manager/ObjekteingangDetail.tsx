/**
 * ObjekteingangDetail — Orchestrator (MOD-12)
 * V8.0: 3-Section Layout (Kopf → Kalkulation → Bewertung/Aktivitäten)
 *       ExposePdfViewer entfernt (Dokumente im Datenraum), Layout gestrafft
 */
import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EntityStorageTree } from '@/components/shared/EntityStorageTree';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Building2, X, ThumbsUp, MessageSquare, FileText, Check, ChevronDown, Play, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAcqOffer, useUpdateOfferStatus, type AcqOfferStatus, type AcqOffer } from '@/hooks/useAcqOffers';
import { useAcqMandate } from '@/hooks/useAcqMandate';
import { useValuationCase } from '@/hooks/useValuationCase';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { BestandCalculation } from './components/BestandCalculation';
import { AufteilerCalculation } from './components/AufteilerCalculation';
import { AbsageDialog } from './components/AbsageDialog';
import { PreisvorschlagDialog } from './components/PreisvorschlagDialog';
import { InteresseDialog } from './components/InteresseDialog';
import { SourceEmailViewer } from './components/SourceEmailViewer';
import { ActivityLogPanel } from './components/ActivityLogPanel';
import { PageShell } from '@/components/shared/PageShell';
import { DESIGN } from '@/config/designManifest';
import { calcBestandQuick, calcAufteilerFull } from '@/engines/akquiseCalc/engine';
import { AUFTEILER_DEFAULTS } from '@/engines/akquiseCalc/spec';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ObjektKPIRow, ObjektBasisdaten, ObjektAnkaufskosten } from '@/components/akquise/objekteingang';
import { ValuationPipeline, ValuationReportReader } from '@/components/shared/valuation';

import { Save, RotateCcw } from 'lucide-react';
import { calcAncillaryCosts } from '@/engines/akquiseCalc/engine';

const STATUS_OPTIONS: { value: AcqOfferStatus; label: string }[] = [
  { value: 'new', label: 'Eingegangen' }, { value: 'analyzing', label: 'In Analyse' },
  { value: 'analyzed', label: 'Analysiert' }, { value: 'presented', label: 'Präsentiert' },
  { value: 'accepted', label: 'Akzeptiert' }, { value: 'rejected', label: 'Abgelehnt' },
  { value: 'archived', label: 'Archiviert' },
];

const OFFER_STEPS = [{ key: 'erfassung', label: 'Erfassung' }, { key: 'analyse', label: 'Analyse' }, { key: 'bewertung', label: 'Bewertung' }, { key: 'delivery', label: 'Delivery' }];
const STATUS_TO_STEP: Record<string, number> = { new: 0, analyzing: 1, analyzed: 2, presented: 3, accepted: 3, rejected: 2, archived: 3 };

function deriveYearlyRent(offer: { noi_indicated?: number | null; price_asking?: number | null; yield_indicated?: number | null }, overridePrice?: number): number {
  if (offer.noi_indicated) return offer.noi_indicated;
  const price = overridePrice ?? offer.price_asking;
  if (price && offer.yield_indicated) return price * offer.yield_indicated / 100;
  return 0;
}

function getCompletenessIssues(offer: { price_asking?: number | null; noi_indicated?: number | null; yield_indicated?: number | null; area_sqm?: number | null }) {
  const issues: string[] = [];
  if (!offer.price_asking) issues.push('Kaufpreis');
  if (!offer.noi_indicated && !offer.yield_indicated) issues.push('Miete oder Rendite');
  if (!offer.area_sqm) issues.push('Fläche (m²)');
  return issues;
}

function QuickAnalysisBanner({ offer, yearlyRent, priceOverride, originalPrice, onPriceChange, ancillaryCostPercent }: { offer: AcqOffer; yearlyRent: number; priceOverride: number; originalPrice: number; onPriceChange: (p: number) => void; ancillaryCostPercent: number }) {
  const [inputValue, setInputValue] = React.useState(priceOverride.toString());
  const [isSaving, setIsSaving] = React.useState(false);
  const isModified = priceOverride !== originalPrice;
  React.useEffect(() => { setInputValue(priceOverride.toString()); }, [priceOverride]);
  const fmtCur = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  const fmtInput = (v: string) => { const n = parseInt(v.replace(/\D/g, ''), 10); return isNaN(n) ? '' : n.toLocaleString('de-DE'); };
  const handleInput = (raw: string) => { const d = raw.replace(/\D/g, ''); setInputValue(d); const n = parseInt(d, 10); if (!isNaN(n) && n > 0) onPriceChange(n); };
  const handleSave = async () => { setIsSaving(true); const { error } = await supabase.from('acq_offers').update({ price_counter: priceOverride } as any).eq('id', offer.id); setIsSaving(false); error ? toast({ title: 'Fehler', variant: 'destructive' }) : toast({ title: 'Gespeichert', description: `Gegenvorschlag ${fmtCur(priceOverride)}` }); };
  const bestand = React.useMemo(() => calcBestandQuick({ purchasePrice: priceOverride, monthlyRent: yearlyRent / 12 }), [priceOverride, yearlyRent]);
  const aufteiler = React.useMemo(() => calcAufteilerFull({ purchasePrice: priceOverride, yearlyRent, targetYield: AUFTEILER_DEFAULTS.targetYield, salesCommission: AUFTEILER_DEFAULTS.salesCommission, holdingPeriodMonths: AUFTEILER_DEFAULTS.holdingPeriodMonths, ancillaryCostPercent: resolvedAncillary.totalRate, interestRate: AUFTEILER_DEFAULTS.interestRate, equityPercent: AUFTEILER_DEFAULTS.equityPercent, projectCosts: 0 }), [priceOverride, yearlyRent, resolvedAncillary.totalRate]);
  return (
    <Card className={cn(DESIGN.CARD.BASE, DESIGN.INFO_BANNER.PREMIUM)}>
      <CardHeader className="pb-2 px-4 pt-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3"><CardTitle className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Schnellanalyse</CardTitle>{isModified && <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">Gegenvorschlag aktiv</Badge>}</div>
        {isModified && <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => { onPriceChange(originalPrice); setInputValue(originalPrice.toString()); }} className="h-7 text-xs text-muted-foreground"><RotateCcw className="h-3 w-3 mr-1" />Zurücksetzen</Button><Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs"><Save className="h-3 w-3 mr-1" />{isSaving ? 'Speichert…' : 'Speichern'}</Button></div>}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-stretch">
          <div><div className={DESIGN.TYPOGRAPHY.HINT}>Kaufpreis</div><div className="flex items-center gap-1"><input type="text" value={fmtInput(inputValue)} onChange={e => handleInput(e.target.value)} className={cn("w-full bg-transparent border-b-2 text-xl font-bold tracking-tight outline-none py-1 transition-all", isModified ? "border-primary text-primary ring-1 ring-primary/20 rounded-sm px-1" : "border-muted-foreground/30 text-foreground hover:border-primary/50 focus:border-primary")} /><span className="text-sm font-medium text-muted-foreground">€</span></div><div className="text-[10px] text-muted-foreground mt-0.5">{isModified ? <><span className="line-through">{fmtCur(originalPrice)}</span><span className="ml-1">(Angebot)</span></> : 'Preis ändern für Echtzeit-Kalkulation'}</div></div>
          <div><div className={DESIGN.TYPOGRAPHY.HINT}>Monatl. Cashflow</div><div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-lg', bestand.monthlyCashflow >= 0 ? 'text-emerald-500' : 'text-destructive')}>{fmtCur(bestand.monthlyCashflow)}</div></div>
          <div><div className={DESIGN.TYPOGRAPHY.HINT}>EK-Bedarf</div><div className={DESIGN.TYPOGRAPHY.VALUE + ' text-lg'}>{fmtCur(bestand.equity)}</div></div>
          <div><div className={DESIGN.TYPOGRAPHY.HINT}>Bruttorendite</div><div className={DESIGN.TYPOGRAPHY.VALUE + ' text-lg'}>{bestand.grossYield.toFixed(2)}%</div></div>
          <div><div className={DESIGN.TYPOGRAPHY.HINT}>Gewinn (Flip)</div><div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-lg', aufteiler.profit >= 0 ? 'text-emerald-500' : 'text-destructive')}>{fmtCur(aufteiler.profit)}</div></div>
          <div><div className={DESIGN.TYPOGRAPHY.HINT}>Marge (Flip)</div><div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-lg', aufteiler.profitMargin >= 0 ? 'text-emerald-500' : 'text-destructive')}>{aufteiler.profitMargin.toFixed(1)}%</div></div>
          <div><div className={DESIGN.TYPOGRAPHY.HINT}>Faktor (Flip)</div><div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-lg text-primary')}>{aufteiler.factor > 0 ? aufteiler.factor.toFixed(1) + 'x' : '–'}</div></div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompletenessCheck({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="flex items-start gap-3 py-3 px-4">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-700">Fehlende Daten für Kalkulation</p>
          <p className="text-xs text-muted-foreground mt-1">
            Folgende Felder fehlen oder wurden nicht extrahiert: <strong>{issues.join(', ')}</strong>. 
            Bitte manuell nachtragen oder Exposé erneut verarbeiten.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ObjekteingangDetail() {
  const { activeTenantId } = useAuth();
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { data: offer, isLoading } = useAcqOffer(offerId);
  const { data: mandate } = useAcqMandate(offer?.mandate_id);
  const updateStatus = useUpdateOfferStatus();
  const valuation = useValuationCase();
  const [absageOpen, setAbsageOpen] = React.useState(false);
  const [preisOpen, setPreisOpen] = React.useState(false);
  const [interesseOpen, setInteresseOpen] = React.useState(false);
  const [extractedOpen, setExtractedOpen] = React.useState(false);
  const [priceOverride, setPriceOverride] = React.useState<number | null>(null);
  React.useEffect(() => { if (offer) setPriceOverride(offer.price_counter ?? offer.price_asking ?? null); }, [offer?.id]);

  // These useMemo hooks MUST be before early returns to preserve hook order
  const exposeBrokerRate = React.useMemo(() => {
    const ed = offer?.extracted_data as Record<string, any> | null;
    if (!ed) return undefined;
    const val = ed.broker_commission_percent ?? ed.maklercourtage ?? ed.broker_rate ?? ed.courtage;
    return typeof val === 'number' && val > 0 ? val : undefined;
  }, [offer?.extracted_data]);

  const effectivePrice = priceOverride ?? offer?.price_asking ?? 0;
  const resolvedAncillary = React.useMemo(() => calcAncillaryCosts(effectivePrice, offer?.postal_code, exposeBrokerRate), [effectivePrice, offer?.postal_code, exposeBrokerRate]);

  if (isLoading) return <div className="p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!offer) return <PageShell><Card><CardContent className="p-12 text-center"><Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold">Objekt nicht gefunden</h3><Button className="mt-4" onClick={() => navigate('/portal/akquise-manager/objekteingang')}>Zurück zur Übersicht</Button></CardContent></Card></PageShell>;

  const formatPrice = (p: number | null) => p ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p) : '–';
  const currentStepIdx = STATUS_TO_STEP[offer.status] ?? 0;
  const yearlyRent = deriveYearlyRent(offer, effectivePrice);
  const completenessIssues = getCompletenessIssues(offer);
  const hasCalcData = !!(offer.calc_bestand || offer.calc_aufteiler);
  // Minimal data for valuation: address + (price or rent)
  const hasMinimalValuationData = !!(
    (offer.address || offer.city) && 
    (effectivePrice > 0 || yearlyRent > 0)
  );

  return (
    <PageShell>
      {/* ═══════════════════ SEKTION 1: KOPF ═══════════════════ */}
      {/* Header Row */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/objekteingang')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>OBJEKTDATEN</h1>
            <Select value={offer.status} onValueChange={v => updateStatus.mutate({ offerId: offer.id, status: v as AcqOfferStatus })}><SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
            {priceOverride !== null && offer.price_asking !== null && priceOverride !== offer.price_asking && <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Gegenvorschlag: {formatPrice(priceOverride)}</Badge>}
          </div>
          {mandate && <p className={DESIGN.TYPOGRAPHY.MUTED + ' mt-1 flex items-center gap-2'}><Badge variant="outline" className="font-mono">{mandate.code}</Badge><span>·</span><span>Eingang {format(new Date(offer.created_at), 'dd.MM.yyyy', { locale: de })}</span></p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => setAbsageOpen(true)}><X className="h-4 w-4 mr-2" />Absage</Button>
          <Button variant="outline" onClick={() => setPreisOpen(true)}><MessageSquare className="h-4 w-4 mr-2" />Preisvorschlag</Button>
          <Button onClick={() => setInteresseOpen(true)}><ThumbsUp className="h-4 w-4 mr-2" />Interesse</Button>
        </div>
        <AbsageDialog open={absageOpen} onOpenChange={setAbsageOpen} offerId={offer.id} offerTitle={offer.title || offer.address} />
        <PreisvorschlagDialog open={preisOpen} onOpenChange={setPreisOpen} offerId={offer.id} offerTitle={offer.title || offer.address} currentPrice={offer.price_asking || undefined} priceCounter={priceOverride !== null && priceOverride !== offer.price_asking ? priceOverride : undefined} providerEmail={offer.provider_contact || undefined} mandateId={offer.mandate_id || undefined} />
        <InteresseDialog open={interesseOpen} onOpenChange={setInteresseOpen} offerId={offer.id} offerTitle={offer.title || offer.address} mandateId={offer.mandate_id || undefined} />
      </div>

      {/* Stepper */}
      <div className="w-full"><div className="flex items-center justify-between">{OFFER_STEPS.map((step, idx) => { const isDone = idx < currentStepIdx; const isCurrent = idx === currentStepIdx; return (<div key={step.key} className="flex items-center flex-1 last:flex-initial"><div className="flex flex-col items-center gap-1"><div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors', isDone && 'bg-primary border-primary text-primary-foreground', isCurrent && 'border-primary bg-primary/10 text-primary', !isDone && !isCurrent && 'border-border bg-muted text-muted-foreground')}>{isDone ? <Check className="h-4 w-4" /> : idx + 1}</div><span className={cn('text-[10px] font-medium text-center max-w-[72px] leading-tight', isCurrent ? 'text-primary' : 'text-muted-foreground')}>{step.label}</span></div>{idx < OFFER_STEPS.length - 1 && <div className={cn('h-0.5 flex-1 mx-1 mt-[-16px]', idx < currentStepIdx ? 'bg-primary' : 'bg-border')} />}</div>); })}</div></div>

      {/* KPIs + Basisdaten */}
      <ObjektKPIRow effectivePrice={formatPrice(effectivePrice)} unitsCount={offer.units_count?.toString() || '–'} areaSqm={offer.area_sqm ? `${offer.area_sqm.toLocaleString('de-DE')} m²` : '–'} yieldFactor={effectivePrice > 0 && yearlyRent > 0 ? `${((yearlyRent / effectivePrice) * 100).toFixed(1)}% · ${(effectivePrice / yearlyRent).toFixed(1)}x` : '–'} />
      <ObjektBasisdaten offer={offer} yearlyRent={yearlyRent} formatPrice={formatPrice} />
      <ObjektAnkaufskosten purchasePrice={effectivePrice} postalCode={offer.postal_code} brokerRate={exposeBrokerRate} />

      {/* Completeness Check */}
      <CompletenessCheck issues={completenessIssues} />

      {/* Quelle + Datenraum */}
      <div className={DESIGN.FORM_GRID.FULL}>
        <div className="space-y-2"><h2 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>E-Mail / Quelle</h2><SourceEmailViewer sourceInboundId={offer.source_inbound_id} sourceType={offer.source_type} sourceUrl={offer.source_url} /></div>
        <div className="space-y-2">
          <h2 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Datenraum</h2>
          {activeTenantId && (
            <EntityStorageTree
              tenantId={activeTenantId}
              entityType="acq_offer"
              entityId={offer.id}
              moduleCode="MOD_12"
            />
          )}
        </div>
      </div>

      {/* ═══════════════════ SEKTION 2: KALKULATION ═══════════════════ */}
      <div className="space-y-4">
        <h2 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'mb-1')}>Kalkulation</h2>
        <QuickAnalysisBanner offer={offer} yearlyRent={yearlyRent} priceOverride={effectivePrice} originalPrice={offer.price_asking || 0} onPriceChange={setPriceOverride} />
        <Tabs defaultValue="bestand" className="w-full">
          <TabsList>
            <TabsTrigger value="bestand">🏠 Bestand (Hold)</TabsTrigger>
            <TabsTrigger value="aufteiler">📊 Aufteiler (Flip)</TabsTrigger>
            <TabsTrigger value="bewertung">🏛️ Bewertung</TabsTrigger>
          </TabsList>
          <TabsContent value="bestand"><BestandCalculation offerId={offer.id} hideQuickAnalysis ancillaryCostPercent={resolvedAncillary.totalRate} initialData={{ purchasePrice: effectivePrice, monthlyRent: yearlyRent / 12, units: offer.units_count || 1, areaSqm: offer.area_sqm || 0 }} /></TabsContent>
          <TabsContent value="aufteiler"><AufteilerCalculation offerId={offer.id} ancillaryCostPercent={resolvedAncillary.totalRate} initialData={{ purchasePrice: effectivePrice, yearlyRent, units: offer.units_count || 1, areaSqm: offer.area_sqm || 0 }} /></TabsContent>
          <TabsContent value="bewertung">
            <div className="space-y-4 mt-4">
              {valuation.state.status !== 'running' && !valuation.state.resultData && (
                <Card className={cn("border-primary/20", hasMinimalValuationData ? "bg-primary/5" : "bg-muted/50")}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">KI-gestützte Objektbewertung</p>
                      <p className="text-xs text-muted-foreground">
                        {hasMinimalValuationData 
                          ? 'Exposé-basierte Bewertung mit Portal-Comps und KI-Research (20 Credits)' 
                          : 'Adresse und Preis/Miete erforderlich für die Bewertung'}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => valuation.runValuation({ offerId: offer.id, sourceContext: 'ACQUIARY_TOOLS' })} 
                      disabled={valuation.isLoading || !hasMinimalValuationData}
                    >
                      {valuation.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
                      Bewertung starten
                    </Button>
                  </CardContent>
                </Card>
              )}
              {valuation.state.status === 'running' && (
                <ValuationPipeline stages={valuation.state.stages} currentStage={valuation.state.currentStage} status={valuation.state.status} error={valuation.state.error} />
              )}
              {valuation.state.resultData && (
                <ValuationReportReader
                  valueBand={valuation.state.resultData.valueBand}
                  methods={valuation.state.resultData.methods || []}
                  financing={valuation.state.resultData.financing || []}
                  stressTests={valuation.state.resultData.stressTests || []}
                  lienProxy={valuation.state.resultData.lienProxy || null}
                  debtService={valuation.state.resultData.debtService || null}
                  dataQuality={valuation.state.resultData.dataQuality || null}
                  compStats={valuation.state.resultData.compStats || null}
                  executiveSummary={valuation.state.resultData.executiveSummary}
                  location={valuation.state.resultData.location || null}
                  comps={valuation.state.resultData.comps || []}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Aktivitäten */}
      <div><h2 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'mb-3')}>Aktivitäten</h2><ActivityLogPanel offerId={offer.id} /></div>

      {offer.extracted_data && (
        <Collapsible open={extractedOpen} onOpenChange={setExtractedOpen}>
          <Card className={DESIGN.CARD.BASE}>
            <CollapsibleTrigger asChild><CardHeader className={cn(DESIGN.CARD.SECTION_HEADER, 'cursor-pointer flex flex-row items-center justify-between')}><div><CardTitle className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>KI-Extraktion</CardTitle><CardDescription className={DESIGN.TYPOGRAPHY.HINT}>Automatisch aus dem Exposé extrahiert{offer.extraction_confidence && ` · Konfidenz: ${offer.extraction_confidence}%`}</CardDescription></div><ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', extractedOpen && 'rotate-180')} /></CardHeader></CollapsibleTrigger>
            <CollapsibleContent><CardContent className="p-4"><pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">{JSON.stringify(offer.extracted_data, null, 2)}</pre></CardContent></CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </PageShell>
  );
}

export default ObjekteingangDetail;
