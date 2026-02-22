/**
 * ObjekteingangDetail — CI-konformes Objektakte-Layout
 * Redesign: KPI-Zeile, Tab-basierte Kalkulation, Collapsible Extrahierte Daten
 * Feature: Preisvorschlag-Rechner mit price_counter Persistenz
 */
import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Loader2, Building2, MapPin, Euro, X, ThumbsUp, MessageSquare, 
  FileText, Upload, Check, ChevronDown, TrendingUp, Ruler, Home, Save, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAcqOffer, useUpdateOfferStatus, type AcqOfferStatus } from '@/hooks/useAcqOffers';
import { useAcqMandate } from '@/hooks/useAcqMandate';
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

const STATUS_OPTIONS: { value: AcqOfferStatus; label: string }[] = [
  { value: 'new', label: 'Eingegangen' },
  { value: 'analyzing', label: 'In Analyse' },
  { value: 'analyzed', label: 'Analysiert' },
  { value: 'presented', label: 'Präsentiert' },
  { value: 'accepted', label: 'Akzeptiert' },
  { value: 'rejected', label: 'Abgelehnt' },
  { value: 'archived', label: 'Archiviert' },
];

const OFFER_STEPS = [
  { key: 'erfassung', label: 'Erfassung' },
  { key: 'analyse', label: 'Analyse' },
  { key: 'bewertung', label: 'Bewertung' },
  { key: 'delivery', label: 'Delivery' },
];

const STATUS_TO_STEP: Record<string, number> = {
  new: 0, analyzing: 1, analyzed: 2, presented: 3, accepted: 3, rejected: 2, archived: 3,
};

/** Derive yearly rent with fallback: noi_indicated > price * yield > 0 */
function deriveYearlyRent(offer: { noi_indicated?: number | null; price_asking?: number | null; yield_indicated?: number | null }, overridePrice?: number): number {
  if (offer.noi_indicated) return offer.noi_indicated;
  const price = overridePrice ?? offer.price_asking;
  if (price && offer.yield_indicated) {
    return price * offer.yield_indicated / 100;
  }
  return 0;
}

export function ObjekteingangDetail() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { data: offer, isLoading } = useAcqOffer(offerId);
  const { data: mandate } = useAcqMandate(offer?.mandate_id);
  const updateStatus = useUpdateOfferStatus();
  
  const [absageOpen, setAbsageOpen] = React.useState(false);
  const [preisOpen, setPreisOpen] = React.useState(false);
  const [interesseOpen, setInteresseOpen] = React.useState(false);
  const [extractedOpen, setExtractedOpen] = React.useState(false);

  // Price override state — initialized from price_counter or price_asking
  const [priceOverride, setPriceOverride] = React.useState<number | null>(null);

  // Sync price override when offer loads
  React.useEffect(() => {
    if (offer) {
      const savedCounter = (offer as any).price_counter as number | null;
      setPriceOverride(savedCounter ?? offer.price_asking ?? null);
    }
  }, [offer?.id]);

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!offer) {
    return (
      <PageShell>
        <Card><CardContent className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Objekt nicht gefunden</h3>
          <Button className="mt-4" onClick={() => navigate('/portal/akquise-manager/objekteingang')}>Zurück zur Übersicht</Button>
        </CardContent></Card>
      </PageShell>
    );
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const currentStepIdx = STATUS_TO_STEP[offer.status] ?? 0;

  // Use override price for calculations
  const effectivePrice = priceOverride ?? offer.price_asking ?? 0;
  const yearlyRent = deriveYearlyRent(offer);

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/objekteingang')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>OBJEKTDATEN</h1>
            <Select 
              value={offer.status} 
              onValueChange={(v) => updateStatus.mutate({ offerId: offer.id, status: v as AcqOfferStatus })}
            >
              <SelectTrigger className="w-36 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Badge when price_counter differs from price_asking */}
            {priceOverride !== null && offer.price_asking !== null && priceOverride !== offer.price_asking && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                Gegenvorschlag: {formatPrice(priceOverride)}
              </Badge>
            )}
          </div>
          {mandate && (
            <p className={DESIGN.TYPOGRAPHY.MUTED + ' mt-1 flex items-center gap-2'}>
              <Badge variant="outline" className="font-mono">{mandate.code}</Badge>
              <span>·</span>
              <span>Eingang {format(new Date(offer.created_at), 'dd.MM.yyyy', { locale: de })}</span>
            </p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => setAbsageOpen(true)}>
            <X className="h-4 w-4 mr-2" />Absage
          </Button>
          <Button variant="outline" onClick={() => setPreisOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />Preisvorschlag
          </Button>
          <Button onClick={() => setInteresseOpen(true)}>
            <ThumbsUp className="h-4 w-4 mr-2" />Interesse
          </Button>
        </div>

        <AbsageDialog open={absageOpen} onOpenChange={setAbsageOpen} offerId={offer.id} offerTitle={offer.title || offer.address} />
        <PreisvorschlagDialog open={preisOpen} onOpenChange={setPreisOpen} offerId={offer.id} offerTitle={offer.title || offer.address} currentPrice={offer.price_asking || undefined} />
        <InteresseDialog open={interesseOpen} onOpenChange={setInteresseOpen} offerId={offer.id} offerTitle={offer.title || offer.address} mandateId={offer.mandate_id || undefined} />
      </div>

      {/* Stepper */}
      <div className="w-full">
        <div className="flex items-center justify-between">
          {OFFER_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                    isDone && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-primary/10 text-primary',
                    !isDone && !isCurrent && 'border-border bg-muted text-muted-foreground'
                  )}>
                    {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className={cn('text-[10px] font-medium text-center max-w-[72px] leading-tight', isCurrent ? 'text-primary' : 'text-muted-foreground')}>
                    {step.label}
                  </span>
                </div>
                {idx < OFFER_STEPS.length - 1 && (
                  <div className={cn('h-0.5 flex-1 mx-1 mt-[-16px]', idx < currentStepIdx ? 'bg-primary' : 'bg-border')} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ROW 1: 4 kompakte KPI-Kacheln */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <KPICard icon={<Euro className="h-4 w-4" />} label="Kaufpreis" value={formatPrice(effectivePrice)} />
        <KPICard icon={<Home className="h-4 w-4" />} label="Einheiten" value={offer.units_count?.toString() || '–'} />
        <KPICard icon={<Ruler className="h-4 w-4" />} label="Fläche" value={offer.area_sqm ? `${offer.area_sqm.toLocaleString('de-DE')} m²` : '–'} />
        <KPICard icon={<TrendingUp className="h-4 w-4" />} label="Rendite / Faktor" value={offer.yield_indicated ? `${offer.yield_indicated.toFixed(1)}% · ${(100 / offer.yield_indicated).toFixed(1)}x` : '–'} />
      </div>

      {/* ROW 2: Basisdaten + Lage (2 Spalten) */}
      <div className={DESIGN.FORM_GRID.FULL}>
        <Card className={DESIGN.CARD.BASE}>
          <CardHeader className={DESIGN.CARD.SECTION_HEADER}>
            <CardTitle className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Basisdaten</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              <DataRow label="Titel" value={offer.title || '–'} />
              <DataRow label="Baujahr" value={offer.year_built?.toString() || '–'} />
              <DataRow label="Einheiten" value={offer.units_count?.toString() || '–'} />
              <DataRow label="Fläche" value={offer.area_sqm ? `${offer.area_sqm.toLocaleString('de-DE')} m²` : '–'} />
              <DataRow label="Kaufpreis" value={formatPrice(offer.price_asking)} />
              <DataRow label="Jahresmiete (IST)" value={yearlyRent > 0 ? formatPrice(yearlyRent) : '–'} />
            </div>
          </CardContent>
        </Card>
        <Card className={DESIGN.CARD.BASE}>
          <CardHeader className={DESIGN.CARD.SECTION_HEADER}>
            <CardTitle className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'flex items-center gap-2')}>
              <MapPin className="h-3 w-3" /> Lage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              <DataRow label="Straße" value={offer.address || '–'} />
              <DataRow label="PLZ" value={offer.postal_code || '–'} />
              <DataRow label="Stadt" value={offer.city || '–'} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: Quelle + Dokumente (2 Spalten) */}
      <div className={DESIGN.FORM_GRID.FULL}>
        <div className="space-y-2">
          <h2 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>E-Mail / Quelle</h2>
          <SourceEmailViewer sourceInboundId={offer.source_inbound_id} sourceType={offer.source_type} sourceUrl={offer.source_url} />
        </div>
        <div className="space-y-2">
          <h2 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Dokumente</h2>
          <Card className={DESIGN.CARD.BASE}>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Dateien</CardTitle>
              <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Hochladen</Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {offer.documents && offer.documents.length > 0 ? (
                <div className={DESIGN.LIST.GAP}>
                  {offer.documents.map(doc => (
                    <div key={doc.id} className={DESIGN.LIST.ROW}>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{doc.file_name}</div>
                          <div className={DESIGN.TYPOGRAPHY.HINT}>{doc.document_type}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Öffnen</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className={DESIGN.TYPOGRAPHY.MUTED}>Keine Dokumente vorhanden</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ROW 4: Schnellanalyse + Tab-basierte Kalkulation */}
      <div className="space-y-4">
        <h2 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'mb-1')}>Kalkulation</h2>
        
        {/* Schnellanalyse — volle Breite, Engine-basiert, editierbarer Preis */}
        <QuickAnalysisBanner 
          offer={offer} 
          yearlyRent={yearlyRent} 
          priceOverride={effectivePrice}
          originalPrice={offer.price_asking || 0}
          onPriceChange={setPriceOverride}
        />

        {/* Tab-Layout statt Side-by-Side */}
        <Tabs defaultValue="bestand" className="w-full">
          <TabsList>
            <TabsTrigger value="bestand">🏠 Bestand (Hold)</TabsTrigger>
            <TabsTrigger value="aufteiler">📊 Aufteiler (Flip)</TabsTrigger>
          </TabsList>
          <TabsContent value="bestand">
            <BestandCalculation offerId={offer.id} hideQuickAnalysis initialData={{ purchasePrice: effectivePrice, monthlyRent: yearlyRent / 12, units: offer.units_count || 1, areaSqm: offer.area_sqm || 0 }} />
          </TabsContent>
          <TabsContent value="aufteiler">
            <AufteilerCalculation offerId={offer.id} initialData={{ purchasePrice: effectivePrice, yearlyRent, units: offer.units_count || 1, areaSqm: offer.area_sqm || 0 }} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ROW 5: Aktivitäten */}
      <div>
        <h2 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'mb-3')}>Aktivitäten</h2>
        <ActivityLogPanel offerId={offer.id} />
      </div>

      {/* ROW 6: Extrahierte Daten — collapsible, ganz unten */}
      {offer.extracted_data && (
        <Collapsible open={extractedOpen} onOpenChange={setExtractedOpen}>
          <Card className={DESIGN.CARD.BASE}>
            <CollapsibleTrigger asChild>
              <CardHeader className={cn(DESIGN.CARD.SECTION_HEADER, 'cursor-pointer flex flex-row items-center justify-between')}>
                <div>
                  <CardTitle className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>KI-Extraktion</CardTitle>
                  <CardDescription className={DESIGN.TYPOGRAPHY.HINT}>
                    Automatisch aus dem Exposé extrahiert{offer.extraction_confidence && ` · Konfidenz: ${offer.extraction_confidence}%`}
                  </CardDescription>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', extractedOpen && 'rotate-180')} />
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-4">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">{JSON.stringify(offer.extracted_data, null, 2)}</pre>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </PageShell>
  );
}

/* ─── KPI Card ─────────────────────────────────────────── */
function KPICard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className={DESIGN.CARD.BASE}>
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className={DESIGN.TYPOGRAPHY.LABEL}>{label}</span>
        </div>
        <span className="text-lg font-bold tracking-tight">{value}</span>
      </CardContent>
    </Card>
  );
}

/* ─── Data Row ─────────────────────────────────────────── */
function DataRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[140px_1fr] px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '–'}</span>
    </div>
  );
}

/* ─── Quick Analysis Banner (Engine-basiert, editierbarer Kaufpreis) ───────────── */
function QuickAnalysisBanner({ 
  offer, 
  yearlyRent, 
  priceOverride,
  originalPrice,
  onPriceChange,
}: { 
  offer: NonNullable<ReturnType<typeof useAcqOffer>['data']>; 
  yearlyRent: number;
  priceOverride: number;
  originalPrice: number;
  onPriceChange: (price: number) => void;
}) {
  const [inputValue, setInputValue] = React.useState(priceOverride.toString());
  const [isSaving, setIsSaving] = React.useState(false);
  const isModified = priceOverride !== originalPrice;

  // Sync input when priceOverride changes externally
  React.useEffect(() => {
    setInputValue(priceOverride.toString());
  }, [priceOverride]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const formatInputDisplay = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('de-DE');
  };

  const handlePriceInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setInputValue(digits);
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num > 0) {
      onPriceChange(num);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('acq_offers')
      .update({ price_counter: priceOverride } as any)
      .eq('id', offer.id);
    setIsSaving(false);
    if (error) {
      toast({ title: 'Fehler', description: 'Gegenvorschlag konnte nicht gespeichert werden.', variant: 'destructive' });
    } else {
      toast({ title: 'Gespeichert', description: `Gegenvorschlag ${formatCurrency(priceOverride)} wurde gespeichert.` });
    }
  };

  const handleReset = () => {
    onPriceChange(originalPrice);
    setInputValue(originalPrice.toString());
  };

  // Engine-basierte Berechnungen mit Override-Preis
  const bestand = calcBestandQuick({ purchasePrice: priceOverride, monthlyRent: yearlyRent / 12 });
  const aufteiler = calcAufteilerFull({
    purchasePrice: priceOverride,
    yearlyRent,
    targetYield: AUFTEILER_DEFAULTS.targetYield,
    salesCommission: AUFTEILER_DEFAULTS.salesCommission,
    holdingPeriodMonths: AUFTEILER_DEFAULTS.holdingPeriodMonths,
    ancillaryCostPercent: AUFTEILER_DEFAULTS.ancillaryCostPercent,
    interestRate: AUFTEILER_DEFAULTS.interestRate,
    equityPercent: AUFTEILER_DEFAULTS.equityPercent,
    projectCosts: 0,
  });

  return (
    <Card className={cn(DESIGN.CARD.BASE, DESIGN.INFO_BANNER.PREMIUM)}>
      <CardHeader className="pb-2 px-4 pt-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Schnellanalyse</CardTitle>
          {isModified && (
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
              Gegenvorschlag aktiv
            </Badge>
          )}
        </div>
        {isModified && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs text-muted-foreground">
              <RotateCcw className="h-3 w-3 mr-1" />Zurücksetzen
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs">
              <Save className="h-3 w-3 mr-1" />{isSaving ? 'Speichert…' : 'Speichern'}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-stretch">
          {/* Editable purchase price */}
          <div>
            <div className={DESIGN.TYPOGRAPHY.HINT}>Kaufpreis</div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={formatInputDisplay(inputValue)}
                onChange={(e) => handlePriceInput(e.target.value)}
                className={cn(
                  "w-full bg-transparent border-b-2 text-lg font-bold tracking-tight outline-none py-0.5 transition-colors",
                  isModified ? "border-amber-500 text-amber-600" : "border-transparent text-foreground"
                )}
              />
              <span className="text-xs text-muted-foreground">€</span>
            </div>
            {isModified && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                <span className="line-through">{formatCurrency(originalPrice)}</span>
                <span className="ml-1">(Angebot)</span>
              </div>
            )}
          </div>
          <div>
            <div className={DESIGN.TYPOGRAPHY.HINT}>Monatl. Cashflow</div>
            <div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-lg', bestand.monthlyCashflow >= 0 ? 'text-emerald-500' : 'text-destructive')}>{formatCurrency(bestand.monthlyCashflow)}</div>
          </div>
          <div>
            <div className={DESIGN.TYPOGRAPHY.HINT}>EK-Bedarf</div>
            <div className={DESIGN.TYPOGRAPHY.VALUE + ' text-lg'}>{formatCurrency(bestand.equity)}</div>
          </div>
          <div>
            <div className={DESIGN.TYPOGRAPHY.HINT}>Bruttorendite</div>
            <div className={DESIGN.TYPOGRAPHY.VALUE + ' text-lg'}>{bestand.grossYield.toFixed(2)}%</div>
          </div>
          <div>
            <div className={DESIGN.TYPOGRAPHY.HINT}>Gewinn (Flip)</div>
            <div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-lg', aufteiler.profit >= 0 ? 'text-emerald-500' : 'text-destructive')}>{formatCurrency(aufteiler.profit)}</div>
          </div>
          <div>
            <div className={DESIGN.TYPOGRAPHY.HINT}>Marge (Flip)</div>
            <div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-lg', aufteiler.profitMargin >= 0 ? 'text-emerald-500' : 'text-destructive')}>{aufteiler.profitMargin.toFixed(1)}%</div>
          </div>
          <div>
            <div className={DESIGN.TYPOGRAPHY.HINT}>Faktor (Flip)</div>
            <div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-lg text-primary')}>{aufteiler.factor > 0 ? aufteiler.factor.toFixed(1) + 'x' : '–'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ObjekteingangDetail;

