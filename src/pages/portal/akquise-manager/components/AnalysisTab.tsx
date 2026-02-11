/**
 * Analysis Tab — KI Research, GeoMap, Bestand/Aufteiler Kalkulatoren
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, MapPin, Calculator, TrendingUp, Building2, Loader2, 
  CheckCircle2, AlertCircle, Play, FileText, Upload, BarChart3,
  Home, Euro, Percent, Clock, Target, ChevronRight
} from 'lucide-react';
import { 
  useAcqOffers, 
  useAcqOffer,
  useCreateOffer,
  useUploadOfferDocument,
  useRunAIResearch,
  useRunGeoMap,
  useRunCalcBestand,
  useRunCalcAufteiler,
  useExtractFromDocument,
  type AcqOffer 
} from '@/hooks/useAcqOffers';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface AnalysisTabProps {
  mandateId: string;
  mandateCode: string;
}

const STATUS_CONFIG = {
  new: { label: 'Neu', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-700' },
  analyzing: { label: 'Analysiert...', variant: 'default' as const, color: 'bg-blue-100 text-blue-700' },
  analyzed: { label: 'Analysiert', variant: 'default' as const, color: 'bg-green-100 text-green-700' },
  presented: { label: 'Präsentiert', variant: 'outline' as const, color: 'bg-purple-100 text-purple-700' },
  accepted: { label: 'Akzeptiert', variant: 'default' as const, color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' as const, color: 'bg-red-100 text-red-700' },
  archived: { label: 'Archiviert', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-600' },
};

export function AnalysisTab({ mandateId, mandateCode }: AnalysisTabProps) {
  const { data: offers = [], isLoading } = useAcqOffers(mandateId);
  const createOffer = useCreateOffer();
  
  const [selectedOfferId, setSelectedOfferId] = React.useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newOfferForm, setNewOfferForm] = React.useState({
    title: '',
    address: '',
    postal_code: '',
    city: '',
    price_asking: '',
    units_count: '',
    area_sqm: '',
    year_built: '',
  });

  const handleCreateOffer = async () => {
    await createOffer.mutateAsync({
      mandate_id: mandateId,
      source_type: 'manual',
      title: newOfferForm.title || 'Neues Objekt',
      address: newOfferForm.address,
      postal_code: newOfferForm.postal_code,
      city: newOfferForm.city,
      price_asking: newOfferForm.price_asking ? Number(newOfferForm.price_asking) : undefined,
      units_count: newOfferForm.units_count ? Number(newOfferForm.units_count) : undefined,
      area_sqm: newOfferForm.area_sqm ? Number(newOfferForm.area_sqm) : undefined,
      year_built: newOfferForm.year_built ? Number(newOfferForm.year_built) : undefined,
    });
    setNewOfferForm({ title: '', address: '', postal_code: '', city: '', price_asking: '', units_count: '', area_sqm: '', year_built: '' });
    setShowCreateDialog(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  // If an offer is selected, show detail view
  if (selectedOfferId) {
    return (
      <OfferAnalysisDetail 
        offerId={selectedOfferId} 
        mandateId={mandateId}
        onBack={() => setSelectedOfferId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Analyse</h2>
          <p className="text-sm text-muted-foreground">
            Objekte für {mandateCode} analysieren und bewerten
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Objekt hinzufügen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{offers.length}</div>
            <div className="text-sm text-muted-foreground">Objekte</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {offers.filter(o => o.status === 'new' || o.status === 'analyzing').length}
            </div>
            <div className="text-sm text-muted-foreground">In Bearbeitung</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {offers.filter(o => o.status === 'analyzed').length}
            </div>
            <div className="text-sm text-muted-foreground">Analysiert</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {offers.filter(o => o.status === 'presented').length}
            </div>
            <div className="text-sm text-muted-foreground">Präsentiert</div>
          </CardContent>
        </Card>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Keine Objekte</h3>
            <p className="text-muted-foreground mt-2">
              Fügen Sie Objekte manuell hinzu oder konvertieren Sie Inbound-E-Mails.
            </p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Erstes Objekt hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map(offer => (
            <OfferCard 
              key={offer.id} 
              offer={offer} 
              onClick={() => setSelectedOfferId(offer.id)}
            />
          ))}
        </div>
      )}

      {/* Create Offer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Objekt hinzufügen</DialogTitle>
            <DialogDescription>Fügen Sie ein neues Objekt zur Analyse hinzu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Bezeichnung</Label>
              <Input 
                value={newOfferForm.title} 
                onChange={e => setNewOfferForm(f => ({ ...f, title: e.target.value }))}
                placeholder="z.B. MFH Berliner Straße"
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input 
                value={newOfferForm.address} 
                onChange={e => setNewOfferForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Straße und Hausnummer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PLZ</Label>
                <Input 
                  value={newOfferForm.postal_code} 
                  onChange={e => setNewOfferForm(f => ({ ...f, postal_code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Stadt</Label>
                <Input 
                  value={newOfferForm.city} 
                  onChange={e => setNewOfferForm(f => ({ ...f, city: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kaufpreis (€)</Label>
                <Input 
                  type="number"
                  value={newOfferForm.price_asking} 
                  onChange={e => setNewOfferForm(f => ({ ...f, price_asking: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Einheiten</Label>
                <Input 
                  type="number"
                  value={newOfferForm.units_count} 
                  onChange={e => setNewOfferForm(f => ({ ...f, units_count: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fläche (m²)</Label>
                <Input 
                  type="number"
                  value={newOfferForm.area_sqm} 
                  onChange={e => setNewOfferForm(f => ({ ...f, area_sqm: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Baujahr</Label>
                <Input 
                  type="number"
                  value={newOfferForm.year_built} 
                  onChange={e => setNewOfferForm(f => ({ ...f, year_built: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Abbrechen</Button>
            <Button onClick={handleCreateOffer} disabled={createOffer.isPending}>
              {createOffer.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Offer Card Component
function OfferCard({ offer, onClick }: { offer: AcqOffer; onClick: () => void }) {
  const statusConfig = STATUS_CONFIG[offer.status] || STATUS_CONFIG.new;
  const hasCalc = offer.calc_bestand || offer.calc_aufteiler;
  const hasGeomap = offer.geomap_data;
  const hasAI = offer.analysis_summary;
  
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="font-semibold truncate">{offer.title || 'Ohne Titel'}</span>
            </div>
            {(offer.address || offer.city) && (
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[offer.address, offer.postal_code, offer.city].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {offer.price_asking && (
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-sm font-semibold">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(offer.price_asking)}
              </div>
              <div className="text-xs text-muted-foreground">Kaufpreis</div>
            </div>
          )}
          {offer.units_count && (
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-sm font-semibold">{offer.units_count}</div>
              <div className="text-xs text-muted-foreground">Einheiten</div>
            </div>
          )}
          {offer.yield_indicated && (
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-sm font-semibold">{offer.yield_indicated.toFixed(2)}%</div>
              <div className="text-xs text-muted-foreground">Rendite</div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {hasAI && <Badge variant="outline" className="text-xs"><Brain className="h-3 w-3 mr-1" />KI</Badge>}
          {hasGeomap && <Badge variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />Geo</Badge>}
          {hasCalc && <Badge variant="outline" className="text-xs"><Calculator className="h-3 w-3 mr-1" />Calc</Badge>}
          <div className="flex-1" />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// Offer Detail View with Analysis Tools
function OfferAnalysisDetail({ offerId, mandateId, onBack }: { offerId: string; mandateId: string; onBack: () => void }) {
  const { data: offer, isLoading } = useAcqOffer(offerId);
  const uploadDoc = useUploadOfferDocument();
  const runAI = useRunAIResearch();
  const runGeoMap = useRunGeoMap();
  const runBestand = useRunCalcBestand();
  const runAufteiler = useRunCalcAufteiler();
  const extractDoc = useExtractFromDocument();

  // Calculator form states
  const [bestandParams, setBestandParams] = React.useState({
    purchasePrice: '',
    monthlyRent: '',
    equity: '',
    interestRate: '3.5',
    repaymentRate: '2',
    managementCostPercent: '25',
    ancillaryCostPercent: '10',
  });

  const [aufteilerParams, setAufteilerParams] = React.useState({
    purchasePrice: '',
    unitsCount: '',
    avgUnitSalePrice: '',
    renovationCostPerUnit: '',
    salesCommissionPercent: '3',
    holdingPeriodMonths: '24',
    ancillaryCostPercent: '10',
  });

  React.useEffect(() => {
    if (offer) {
      setBestandParams(p => ({
        ...p,
        purchasePrice: offer.price_asking?.toString() || '',
      }));
      setAufteilerParams(p => ({
        ...p,
        purchasePrice: offer.price_asking?.toString() || '',
        unitsCount: offer.units_count?.toString() || '',
      }));
    }
  }, [offer]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !offer) return;
    
    await uploadDoc.mutateAsync({
      offerId: offer.id,
      mandateId,
      file,
      documentType: 'expose',
    });
  };

  const handleRunBestand = async () => {
    if (!offer) return;
    await runBestand.mutateAsync({
      offerId: offer.id,
      params: {
        purchasePrice: Number(bestandParams.purchasePrice) || 0,
        monthlyRent: Number(bestandParams.monthlyRent) || 0,
        equity: Number(bestandParams.equity) || 0,
        interestRate: Number(bestandParams.interestRate) || 3.5,
        repaymentRate: Number(bestandParams.repaymentRate) || 2,
        managementCostPercent: Number(bestandParams.managementCostPercent) || 25,
        ancillaryCostPercent: Number(bestandParams.ancillaryCostPercent) || 10,
      },
    });
  };

  const handleRunAufteiler = async () => {
    if (!offer) return;
    await runAufteiler.mutateAsync({
      offerId: offer.id,
      params: {
        purchasePrice: Number(aufteilerParams.purchasePrice) || 0,
        unitsCount: Number(aufteilerParams.unitsCount) || 1,
        avgUnitSalePrice: Number(aufteilerParams.avgUnitSalePrice) || 0,
        renovationCostPerUnit: Number(aufteilerParams.renovationCostPerUnit) || 0,
        salesCommissionPercent: Number(aufteilerParams.salesCommissionPercent) || 3,
        holdingPeriodMonths: Number(aufteilerParams.holdingPeriodMonths) || 24,
        ancillaryCostPercent: Number(aufteilerParams.ancillaryCostPercent) || 10,
      },
    });
  };

  if (isLoading || !offer) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const bestandResult = offer.calc_bestand as Record<string, number> | null;
  const aufteilerResult = offer.calc_aufteiler as Record<string, number> | null;
  const geomapData = offer.geomap_data as Record<string, unknown> | null;
  const aiSummary = offer.analysis_summary as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>←</Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{offer.title || 'Objekt-Analyse'}</h2>
            <Badge variant={STATUS_CONFIG[offer.status].variant}>
              {STATUS_CONFIG[offer.status].label}
            </Badge>
          </div>
          {offer.address && (
            <p className="text-sm text-muted-foreground mt-1">
              {[offer.address, offer.postal_code, offer.city].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" onClick={() => offer.address && runGeoMap.mutate({ offerId: offer.id, address: `${offer.address}, ${offer.postal_code} ${offer.city}` })} disabled={!offer.address || runGeoMap.isPending}>
          {runGeoMap.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
          GeoMap
        </Button>
        <Button variant="outline" onClick={() => runAI.mutate({ offerId: offer.id, mandateId })} disabled={runAI.isPending}>
          {runAI.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
          KI-Recherche
        </Button>
        <div className="relative">
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          <Button variant="outline" disabled={uploadDoc.isPending}>
            {uploadDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Exposé hochladen
          </Button>
        </div>
      </div>

      {/* Analysis Tabs */}
      <Tabs defaultValue="bestand" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bestand" className="gap-2">
            <Home className="h-4 w-4" />
            Bestandsrechner
          </TabsTrigger>
          <TabsTrigger value="aufteiler" className="gap-2">
            <Building2 className="h-4 w-4" />
            Aufteiler
          </TabsTrigger>
          <TabsTrigger value="geomap" className="gap-2">
            <MapPin className="h-4 w-4" />
            GeoMap
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            KI-Analyse
          </TabsTrigger>
        </TabsList>

        {/* Bestandsrechner */}
        <TabsContent value="bestand">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Bestandskalkulation
                </CardTitle>
                <CardDescription>Renditebewertung für Buy & Hold</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kaufpreis (€)</Label>
                    <Input type="number" value={bestandParams.purchasePrice} onChange={e => setBestandParams(p => ({ ...p, purchasePrice: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Monatsmiete (€)</Label>
                    <Input type="number" value={bestandParams.monthlyRent} onChange={e => setBestandParams(p => ({ ...p, monthlyRent: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Eigenkapital (€)</Label>
                    <Input type="number" value={bestandParams.equity} onChange={e => setBestandParams(p => ({ ...p, equity: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>NK-Quote (%)</Label>
                    <Input type="number" value={bestandParams.ancillaryCostPercent} onChange={e => setBestandParams(p => ({ ...p, ancillaryCostPercent: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Zinssatz (%)</Label>
                    <Input type="number" step="0.1" value={bestandParams.interestRate} onChange={e => setBestandParams(p => ({ ...p, interestRate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tilgung (%)</Label>
                    <Input type="number" step="0.1" value={bestandParams.repaymentRate} onChange={e => setBestandParams(p => ({ ...p, repaymentRate: e.target.value }))} />
                  </div>
                </div>
                <Button className="w-full" onClick={handleRunBestand} disabled={runBestand.isPending}>
                  {runBestand.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Play className="h-4 w-4 mr-2" />
                  Berechnen
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Ergebnis</CardTitle>
              </CardHeader>
              <CardContent>
                {bestandResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <KPIBox label="Brutto-Rendite" value={`${bestandResult.grossYield ?? 0}%`} icon={Percent} color="blue" />
                      <KPIBox label="Netto-Rendite" value={`${bestandResult.netYield ?? 0}%`} icon={Percent} color="green" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <KPIBox label="Monatl. Cashflow" value={`${(bestandResult.monthlyCashflow ?? 0).toLocaleString('de-DE')} €`} icon={Euro} color={(bestandResult.monthlyCashflow ?? 0) >= 0 ? 'green' : 'red'} />
                      <KPIBox label="Cash-on-Cash" value={`${bestandResult.cashOnCash ?? 0}%`} icon={TrendingUp} color="purple" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
                      <div><div className="text-lg font-semibold">{bestandResult.ltv ?? 0}%</div><div className="text-xs text-muted-foreground">LTV</div></div>
                      <div><div className="text-lg font-semibold">{bestandResult.dscr ?? 0}</div><div className="text-xs text-muted-foreground">DSCR</div></div>
                      <div><div className="text-lg font-semibold">{bestandResult.multiplier ?? 0}x</div><div className="text-xs text-muted-foreground">Faktor</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Berechnung durchgeführt.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aufteiler */}
        <TabsContent value="aufteiler">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Aufteilerkalkulation
                </CardTitle>
                <CardDescription>Gewinnberechnung für Wohnungsverkauf</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kaufpreis gesamt (€)</Label>
                    <Input type="number" value={aufteilerParams.purchasePrice} onChange={e => setAufteilerParams(p => ({ ...p, purchasePrice: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Anzahl Einheiten</Label>
                    <Input type="number" value={aufteilerParams.unitsCount} onChange={e => setAufteilerParams(p => ({ ...p, unitsCount: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ø Verkaufspreis/Einheit (€)</Label>
                    <Input type="number" value={aufteilerParams.avgUnitSalePrice} onChange={e => setAufteilerParams(p => ({ ...p, avgUnitSalePrice: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Sanierung/Einheit (€)</Label>
                    <Input type="number" value={aufteilerParams.renovationCostPerUnit} onChange={e => setAufteilerParams(p => ({ ...p, renovationCostPerUnit: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Haltedauer (Monate)</Label>
                    <Input type="number" value={aufteilerParams.holdingPeriodMonths} onChange={e => setAufteilerParams(p => ({ ...p, holdingPeriodMonths: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Vertriebsprovision (%)</Label>
                    <Input type="number" step="0.1" value={aufteilerParams.salesCommissionPercent} onChange={e => setAufteilerParams(p => ({ ...p, salesCommissionPercent: e.target.value }))} />
                  </div>
                </div>
                <Button className="w-full" onClick={handleRunAufteiler} disabled={runAufteiler.isPending}>
                  {runAufteiler.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Play className="h-4 w-4 mr-2" />
                  Berechnen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ergebnis</CardTitle>
              </CardHeader>
              <CardContent>
                {aufteilerResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <KPIBox label="Bruttogewinn" value={`${(aufteilerResult.grossProfit ?? 0).toLocaleString('de-DE')} €`} icon={Euro} color={(aufteilerResult.grossProfit ?? 0) >= 0 ? 'green' : 'red'} />
                      <KPIBox label="Marge" value={`${aufteilerResult.profitMarginPercent ?? 0}%`} icon={Percent} color="blue" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <KPIBox label="Annualisiert" value={`${aufteilerResult.annualizedReturn ?? 0}%`} icon={TrendingUp} color="purple" />
                      <KPIBox label="Gewinn/Einheit" value={`${(aufteilerResult.profitPerUnit ?? 0).toLocaleString('de-DE')} €`} icon={Home} color="green" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
                      <div><div className="text-lg font-semibold">{(aufteilerResult.totalSaleProceeds ?? 0).toLocaleString('de-DE')} €</div><div className="text-xs text-muted-foreground">Verkaufserlös</div></div>
                      <div><div className="text-lg font-semibold">{(aufteilerResult.totalCosts ?? 0).toLocaleString('de-DE')} €</div><div className="text-xs text-muted-foreground">Gesamtkosten</div></div>
                      <div><div className="text-lg font-semibold">{(aufteilerResult.pricePerUnit ?? 0).toLocaleString('de-DE')} €</div><div className="text-xs text-muted-foreground">EK/Einheit</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Berechnung durchgeführt.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GeoMap */}
        <TabsContent value="geomap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                GeoMap Standortanalyse
              </CardTitle>
            </CardHeader>
            <CardContent>
              {geomapData ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <KPIBox label="Mietniveau" value={`${(geomapData as any).avgRentPerSqm || 'N/A'} €/m²`} icon={Home} color="blue" />
                    <KPIBox label="Kaufpreisniveau" value={`${(geomapData as any).avgPricePerSqm || 'N/A'} €/m²`} icon={Euro} color="green" />
                    <KPIBox label="Leerstandsquote" value={`${(geomapData as any).vacancyRate || 'N/A'}%`} icon={AlertCircle} color="orange" />
                    <KPIBox label="Bevölkerungstrend" value={(geomapData as any).populationTrend || 'N/A'} icon={TrendingUp} color="purple" />
                  </div>
                  {(geomapData as any).summary && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm">{(geomapData as any).summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine GeoMap-Daten vorhanden.</p>
                  <Button className="mt-4" variant="outline" onClick={() => offer.address && runGeoMap.mutate({ offerId: offer.id, address: `${offer.address}, ${offer.postal_code} ${offer.city}` })} disabled={!offer.address}>
                    GeoMap-Analyse starten
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analysis */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                KI-Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiSummary ? (
                <div className="space-y-4">
                  {(aiSummary as any).summary && (
                    <div className="prose prose-sm max-w-none">
                      <p>{(aiSummary as any).summary}</p>
                    </div>
                  )}
                  {(aiSummary as any).risks && (
                    <div>
                      <h4 className="font-semibold mb-2">Risiken</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {((aiSummary as any).risks as string[]).map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {(aiSummary as any).opportunities && (
                    <div>
                      <h4 className="font-semibold mb-2">Chancen</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {((aiSummary as any).opportunities as string[]).map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine KI-Analyse vorhanden.</p>
                  <Button className="mt-4" variant="outline" onClick={() => runAI.mutate({ offerId: offer.id, mandateId })} disabled={runAI.isPending}>
                    KI-Recherche starten
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// KPI Box Component
function KPIBox({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  
  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
