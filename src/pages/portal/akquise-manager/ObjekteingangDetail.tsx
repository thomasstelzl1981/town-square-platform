/**
 * ObjekteingangDetail — Continuous vertical Akte (no tabs) with Stepper
 * Redesigned to match FM pattern: Bank-table metadata, sections, stepper
 */
import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Loader2, Building2, MapPin, Euro, X, ThumbsUp, MessageSquare, 
  FileText, Upload, Check
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

const STATUS_OPTIONS: { value: AcqOfferStatus; label: string }[] = [
  { value: 'new', label: 'Eingegangen' },
  { value: 'analyzing', label: 'In Analyse' },
  { value: 'analyzed', label: 'Analysiert' },
  { value: 'presented', label: 'Präsentiert' },
  { value: 'accepted', label: 'Akzeptiert' },
  { value: 'rejected', label: 'Abgelehnt' },
  { value: 'archived', label: 'Archiviert' },
];

// Stepper
const OFFER_STEPS = [
  { key: 'erfassung', label: 'Erfassung' },
  { key: 'analyse', label: 'Analyse' },
  { key: 'bewertung', label: 'Bewertung' },
  { key: 'delivery', label: 'Delivery' },
];

const STATUS_TO_STEP: Record<string, number> = {
  new: 0, analyzing: 1, analyzed: 2, presented: 3, accepted: 3, rejected: 2, archived: 3,
};

export function ObjekteingangDetail() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { data: offer, isLoading } = useAcqOffer(offerId);
  const { data: mandate } = useAcqMandate(offer?.mandate_id);
  const updateStatus = useUpdateOfferStatus();
  
  const [calcTab, setCalcTab] = React.useState<'bestand' | 'aufteiler'>('bestand');
  const [absageOpen, setAbsageOpen] = React.useState(false);
  const [preisOpen, setPreisOpen] = React.useState(false);
  const [interesseOpen, setInteresseOpen] = React.useState(false);

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!offer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
        <Card><CardContent className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Objekt nicht gefunden</h3>
          <Button className="mt-4" onClick={() => navigate('/portal/akquise-manager/objekteingang')}>Zurück zur Übersicht</Button>
        </CardContent></Card>
      </div>
    );
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const currentStepIdx = STATUS_TO_STEP[offer.status] ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/objekteingang')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{offer.title || offer.address || 'Objekteingang'}</h1>
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
          </div>
          {mandate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Badge variant="outline" className="font-mono">{mandate.code}</Badge>
              <span>•</span>
              <span>Eingang {format(new Date(offer.created_at), 'dd.MM.yyyy', { locale: de })}</span>
            </div>
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

      {/* Section 1: KPIs — Bank table instead of 5 cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <DataRow label="Kaufpreis" value={formatPrice(offer.price_asking)} />
            <DataRow label="Einheiten" value={offer.units_count?.toString() || '–'} />
            <DataRow label="Fläche" value={offer.area_sqm ? `${offer.area_sqm.toLocaleString('de-DE')} m²` : '–'} />
            <DataRow label="Rendite" value={offer.yield_indicated ? `${offer.yield_indicated.toFixed(1)}%` : '–'} />
            <DataRow label="Faktor" value={offer.yield_indicated ? (100 / offer.yield_indicated).toFixed(1) : '–'} />
            <DataRow label="Quelle" value={offer.source_type === 'inbound_email' ? 'E-Mail' : offer.source_type} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section 2: Objektdaten */}
      <SectionHeader number={1} title="Objektdaten" description="Basisdaten, Lage und Investment-Kennzahlen" />
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Basisdaten</CardTitle></CardHeader>
          <CardContent className="p-0"><div className="divide-y">
            <DataRow label="Titel" value={offer.title || '–'} />
            <DataRow label="Baujahr" value={offer.year_built?.toString() || '–'} />
            <DataRow label="Einheiten" value={offer.units_count?.toString() || '–'} />
            <DataRow label="Fläche" value={offer.area_sqm ? `${offer.area_sqm.toLocaleString('de-DE')} m²` : '–'} />
          </div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-3 w-3" />Lage</CardTitle></CardHeader>
          <CardContent className="p-0"><div className="divide-y">
            <DataRow label="Straße" value={offer.address || '–'} />
            <DataRow label="PLZ" value={offer.postal_code || '–'} />
            <DataRow label="Stadt" value={offer.city || '–'} />
          </div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Euro className="h-3 w-3" />Investment</CardTitle></CardHeader>
          <CardContent className="p-0"><div className="divide-y">
            <DataRow label="Kaufpreis" value={formatPrice(offer.price_asking)} />
            <DataRow label="Jahresmiete (IST)" value={offer.noi_indicated ? formatPrice(offer.noi_indicated) : '–'} />
            <DataRow label="Rendite" value={offer.yield_indicated ? `${offer.yield_indicated.toFixed(2)}%` : '–'} />
            <DataRow label="Faktor" value={offer.yield_indicated ? (100 / offer.yield_indicated).toFixed(1) : '–'} />
          </div></CardContent>
        </Card>
      </div>

      {offer.extracted_data && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Extrahierte Daten</CardTitle>
            <CardDescription>Automatisch aus dem Exposé extrahiert{offer.extraction_confidence && ` (Konfidenz: ${offer.extraction_confidence}%)`}</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">{JSON.stringify(offer.extracted_data, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Section 3: Kalkulation */}
      <SectionHeader number={2} title="Kalkulation" description="Bestand- und Aufteiler-Kalkulationen" />
      <div className="mb-4">
        <Tabs value={calcTab} onValueChange={(v) => setCalcTab(v as 'bestand' | 'aufteiler')}>
          <TabsList>
            <TabsTrigger value="bestand">🏠 Bestand (Hold)</TabsTrigger>
            <TabsTrigger value="aufteiler">📊 Aufteiler (Flip)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {calcTab === 'bestand' ? (
        <BestandCalculation offerId={offer.id} initialData={{ purchasePrice: offer.price_asking || 0, monthlyRent: offer.noi_indicated ? offer.noi_indicated / 12 : 0, units: offer.units_count || 1, areaSqm: offer.area_sqm || 0 }} />
      ) : (
        <AufteilerCalculation offerId={offer.id} initialData={{ purchasePrice: offer.price_asking || 0, yearlyRent: offer.noi_indicated || 0, units: offer.units_count || 1, areaSqm: offer.area_sqm || 0 }} />
      )}

      <Separator />

      {/* Section 4: Quelle */}
      <SectionHeader number={3} title="E-Mail / Quelle" description="Ursprüngliche Kommunikation und Exposé-Quelle" />
      <SourceEmailViewer sourceInboundId={offer.source_inbound_id} sourceType={offer.source_type} sourceUrl={offer.source_url} />

      <Separator />

      {/* Section 5: Dokumente */}
      <SectionHeader number={4} title="Dokumente" description="Exposés und zugehörige Unterlagen" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="text-sm">Dokumente</CardTitle></div>
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Hochladen</Button>
        </CardHeader>
        <CardContent>
          {offer.documents && offer.documents.length > 0 ? (
            <div className="space-y-2">
              {offer.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{doc.file_name}</div>
                      <div className="text-xs text-muted-foreground">{doc.document_type}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Öffnen</Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>Keine Dokumente vorhanden</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Section 6: Aktivitäten */}
      <SectionHeader number={5} title="Aktivitäten" description="Chronologischer Verlauf aller Aktionen" />
      <ActivityLogPanel offerId={offer.id} />
    </div>
  );
}

function SectionHeader({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 pt-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
        {number}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[180px_1fr] px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '–'}</span>
    </div>
  );
}

export default ObjekteingangDetail;
