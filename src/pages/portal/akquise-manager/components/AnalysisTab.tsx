/**
 * Analysis Tab — Bestand + Aufteiler nebeneinander, GeoMap + KI darunter
 * V2: Tabs aufgelöst, Side-by-Side-Layout gemäß Konsolidierungsplan
 */
import * as React from 'react';
import { DesktopOnly } from '@/components/shared/DesktopOnly';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Brain, MapPin, Calculator, TrendingUp, Building2, Loader2, 
  CheckCircle2, AlertCircle, Play, Upload, BarChart3,
  Home, Euro, Percent, ChevronRight
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
import { BestandCalculation } from './BestandCalculation';
import { AufteilerCalculation } from './AufteilerCalculation';

interface AnalysisTabProps {
  mandateId: string;
  mandateCode: string;
}

const STATUS_CONFIG = {
  new: { label: 'Neu', variant: 'secondary' as const },
  analyzing: { label: 'Analysiert...', variant: 'default' as const },
  analyzed: { label: 'Analysiert', variant: 'default' as const },
  presented: { label: 'Präsentiert', variant: 'outline' as const },
  accepted: { label: 'Akzeptiert', variant: 'default' as const },
  rejected: { label: 'Abgelehnt', variant: 'destructive' as const },
  archived: { label: 'Archiviert', variant: 'secondary' as const },
};

export function AnalysisTab({ mandateId, mandateCode }: AnalysisTabProps) {
  const { data: offers = [], isLoading } = useAcqOffers(mandateId);
  const createOffer = useCreateOffer();
  
  const [selectedOfferId, setSelectedOfferId] = React.useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newOfferForm, setNewOfferForm] = React.useState({
    title: '', address: '', postal_code: '', city: '',
    price_asking: '', units_count: '', area_sqm: '', year_built: '',
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
        <DesktopOnly>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Objekt hinzufügen
          </Button>
        </DesktopOnly>
      </div>

      {/* Stats */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{offers.length}</div><div className="text-sm text-muted-foreground">Objekte</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{offers.filter(o => o.status === 'new' || o.status === 'analyzing').length}</div><div className="text-sm text-muted-foreground">In Bearbeitung</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{offers.filter(o => o.status === 'analyzed').length}</div><div className="text-sm text-muted-foreground">Analysiert</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-purple-600">{offers.filter(o => o.status === 'presented').length}</div><div className="text-sm text-muted-foreground">Präsentiert</div></CardContent></Card>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Keine Objekte</h3>
            <p className="text-muted-foreground mt-2">Fügen Sie Objekte manuell hinzu oder konvertieren Sie Inbound-E-Mails.</p>
            <DesktopOnly>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />Erstes Objekt hinzufügen
              </Button>
            </DesktopOnly>
          </CardContent>
        </Card>
      ) : (
        <div className={DESIGN.FORM_GRID.FULL}>
          {offers.map(offer => (
            <OfferCard key={offer.id} offer={offer} onClick={() => setSelectedOfferId(offer.id)} />
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
            <div className="space-y-2"><Label>Bezeichnung</Label><Input value={newOfferForm.title} onChange={e => setNewOfferForm(f => ({ ...f, title: e.target.value }))} placeholder="z.B. MFH Berliner Straße" /></div>
            <div className="space-y-2"><Label>Adresse</Label><Input value={newOfferForm.address} onChange={e => setNewOfferForm(f => ({ ...f, address: e.target.value }))} placeholder="Straße und Hausnummer" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>PLZ</Label><Input value={newOfferForm.postal_code} onChange={e => setNewOfferForm(f => ({ ...f, postal_code: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Stadt</Label><Input value={newOfferForm.city} onChange={e => setNewOfferForm(f => ({ ...f, city: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Kaufpreis (€)</Label><Input type="number" value={newOfferForm.price_asking} onChange={e => setNewOfferForm(f => ({ ...f, price_asking: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Einheiten</Label><Input type="number" value={newOfferForm.units_count} onChange={e => setNewOfferForm(f => ({ ...f, units_count: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fläche (m²)</Label><Input type="number" value={newOfferForm.area_sqm} onChange={e => setNewOfferForm(f => ({ ...f, area_sqm: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Baujahr</Label><Input type="number" value={newOfferForm.year_built} onChange={e => setNewOfferForm(f => ({ ...f, year_built: e.target.value }))} /></div>
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

// ── Offer Card ──
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
              <div className="text-sm font-semibold">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(offer.price_asking)}</div>
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

// ── Offer Detail: Side-by-Side Bestand + Aufteiler ──
function OfferAnalysisDetail({ offerId, mandateId, onBack }: { offerId: string; mandateId: string; onBack: () => void }) {
  const { data: offer, isLoading } = useAcqOffer(offerId);
  const uploadDoc = useUploadOfferDocument();
  const runAI = useRunAIResearch();
  const runGeoMap = useRunGeoMap();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !offer) return;
    await uploadDoc.mutateAsync({ offerId: offer.id, mandateId, file, documentType: 'expose' });
  };

  if (isLoading || !offer) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

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
            <Badge variant={STATUS_CONFIG[offer.status]?.variant || 'secondary'}>
              {STATUS_CONFIG[offer.status]?.label || offer.status}
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

      {/* ── Bestand + Aufteiler Side-by-Side ── */}
      <div className={DESIGN.FORM_GRID.FULL}>
        <BestandCalculation
          offerId={offer.id}
          initialData={{
            purchasePrice: offer.price_asking || 0,
            monthlyRent: offer.noi_indicated ? offer.noi_indicated / 12 : 0,
            units: offer.units_count || 1,
            areaSqm: offer.area_sqm || 0,
          }}
        />
        <AufteilerCalculation
          offerId={offer.id}
          initialData={{
            purchasePrice: offer.price_asking || 0,
            yearlyRent: offer.noi_indicated || 0,
            units: offer.units_count || 1,
            areaSqm: offer.area_sqm || 0,
          }}
        />
      </div>

      {/* ── GeoMap Results (full-width) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            GeoMap Standortanalyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          {geomapData ? (
            <div className="space-y-4">
              <div className={DESIGN.KPI_GRID.FULL}>
                <KPIBox label="Mietniveau" value={`${(geomapData as any).avgRentPerSqm || 'N/A'} €/m²`} icon={Home} color="blue" />
                <KPIBox label="Kaufpreisniveau" value={`${(geomapData as any).avgPricePerSqm || 'N/A'} €/m²`} icon={Euro} color="green" />
                <KPIBox label="Leerstandsquote" value={`${(geomapData as any).vacancyRate || 'N/A'}%`} icon={AlertCircle} color="orange" />
                <KPIBox label="Bevölkerungstrend" value={(geomapData as any).populationTrend || 'N/A'} icon={TrendingUp} color="purple" />
              </div>
              {(geomapData as any).summary && (
                <div className="p-4 bg-muted/50 rounded-lg"><p className="text-sm">{(geomapData as any).summary}</p></div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Keine GeoMap-Daten — starten Sie die Analyse oben.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── KI-Analyse Results (full-width) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4" />
            KI-Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiSummary ? (
            <div className="space-y-4">
              {(aiSummary as any).summary && (
                <div className="prose prose-sm max-w-none"><p>{(aiSummary as any).summary}</p></div>
              )}
              {(aiSummary as any).risks && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Risiken</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {((aiSummary as any).risks as string[]).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {(aiSummary as any).opportunities && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Chancen</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {((aiSummary as any).opportunities as string[]).map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Keine KI-Analyse — starten Sie die Recherche oben.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── KPI Box ──
function KPIBox({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
