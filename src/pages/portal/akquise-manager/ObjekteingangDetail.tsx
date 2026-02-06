/**
 * ObjekteingangDetail — Full detail view with all tabs
 * Objektdaten, Kalkulation, Anbieter, E-Mail/Quelle, Dokumente, Aktivitäten
 */
import * as React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Loader2, Building2, Calculator, User, Mail, 
  FileText, Activity, MapPin, Euro, X, ThumbsUp, MessageSquare, 
  Plus, Upload, Calendar
} from 'lucide-react';
import { useAcqOffer, useUpdateOfferStatus, type AcqOfferStatus } from '@/hooks/useAcqOffers';
import { useAcqMandate } from '@/hooks/useAcqMandate';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { BestandCalculation } from './components/BestandCalculation';
import { AufteilerCalculation } from './components/AufteilerCalculation';

const STATUS_OPTIONS: { value: AcqOfferStatus; label: string }[] = [
  { value: 'new', label: 'Eingegangen' },
  { value: 'analyzing', label: 'In Analyse' },
  { value: 'analyzed', label: 'Analysiert' },
  { value: 'presented', label: 'Präsentiert' },
  { value: 'accepted', label: 'Akzeptiert' },
  { value: 'rejected', label: 'Abgelehnt' },
  { value: 'archived', label: 'Archiviert' },
];

export function ObjekteingangDetail() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: offer, isLoading } = useAcqOffer(offerId);
  const { data: mandate } = useAcqMandate(offer?.mandate_id);
  const updateStatus = useUpdateOfferStatus();
  
  const [calcTab, setCalcTab] = React.useState<'bestand' | 'aufteiler'>('bestand');

  // Active tab from URL hash
  const getActiveTab = () => {
    const hash = location.hash.replace('#', '');
    if (['objektdaten', 'kalkulation', 'anbieter', 'quelle', 'dokumente', 'aktivitaeten'].includes(hash)) {
      return hash;
    }
    return 'objektdaten';
  };
  
  const activeTab = getActiveTab();
  const setActiveTab = (tab: string) => {
    navigate(`${location.pathname}#${tab}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Objekt nicht gefunden</h3>
            <Button className="mt-4" onClick={() => navigate('/portal/akquise-manager/objekteingang')}>
              Zurück zur Übersicht
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/objekteingang')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">
              {offer.title || offer.address || 'Objekteingang'}
            </h1>
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
          <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
            <X className="h-4 w-4 mr-2" />
            Absage
          </Button>
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Preisvorschlag
          </Button>
          <Button>
            <ThumbsUp className="h-4 w-4 mr-2" />
            Interesse
          </Button>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Kaufpreis</div>
            <div className="font-semibold text-lg">{formatPrice(offer.price_asking)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Einheiten</div>
            <div className="font-semibold text-lg">{offer.units_count || '–'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Fläche</div>
            <div className="font-semibold text-lg">{offer.area_sqm ? `${offer.area_sqm.toLocaleString('de-DE')} m²` : '–'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Rendite</div>
            <div className="font-semibold text-lg">{offer.yield_indicated ? `${offer.yield_indicated.toFixed(1)}%` : '–'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Faktor</div>
            <div className="font-semibold text-lg">
              {offer.yield_indicated ? (100 / offer.yield_indicated).toFixed(1) : '–'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="objektdaten" className="gap-2">
            <Building2 className="h-4 w-4" />
            Objektdaten
          </TabsTrigger>
          <TabsTrigger value="kalkulation" className="gap-2">
            <Calculator className="h-4 w-4" />
            Kalkulation
          </TabsTrigger>
          <TabsTrigger value="anbieter" className="gap-2">
            <User className="h-4 w-4" />
            Anbieter
          </TabsTrigger>
          <TabsTrigger value="quelle" className="gap-2">
            <Mail className="h-4 w-4" />
            E-Mail / Quelle
          </TabsTrigger>
          <TabsTrigger value="dokumente" className="gap-2">
            <FileText className="h-4 w-4" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="aktivitaeten" className="gap-2">
            <Activity className="h-4 w-4" />
            Aktivitäten
          </TabsTrigger>
        </TabsList>

        {/* Tab: Objektdaten */}
        <TabsContent value="objektdaten" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basis */}
            <Card>
              <CardHeader>
                <CardTitle>Basisdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DataRow label="Titel" value={offer.title} />
                <DataRow label="Objektart" value="Mehrfamilienhaus" />
                <DataRow label="Baujahr" value={offer.year_built?.toString()} />
                <DataRow label="Einheiten" value={offer.units_count?.toString()} />
                <DataRow label="Fläche" value={offer.area_sqm ? `${offer.area_sqm.toLocaleString('de-DE')} m²` : undefined} />
              </CardContent>
            </Card>

            {/* Lage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Lage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DataRow label="Straße" value={offer.address} />
                <DataRow label="PLZ" value={offer.postal_code} />
                <DataRow label="Stadt" value={offer.city} />
              </CardContent>
            </Card>

            {/* Investment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Investment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DataRow label="Kaufpreis" value={formatPrice(offer.price_asking)} />
                <DataRow label="Jahresmiete (IST)" value={offer.noi_indicated ? formatPrice(offer.noi_indicated) : undefined} />
                <DataRow label="Rendite" value={offer.yield_indicated ? `${offer.yield_indicated.toFixed(2)}%` : undefined} />
                <DataRow label="Faktor" value={offer.yield_indicated ? (100 / offer.yield_indicated).toFixed(1) : undefined} />
              </CardContent>
            </Card>

            {/* Quelle */}
            <Card>
              <CardHeader>
                <CardTitle>Herkunft</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DataRow label="Quelle" value={offer.source_type === 'inbound_email' ? 'E-Mail' : offer.source_type} />
                <DataRow label="Eingangsdatum" value={format(new Date(offer.created_at), 'dd.MM.yyyy HH:mm', { locale: de })} />
                {offer.source_url && (
                  <DataRow label="URL" value={offer.source_url} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Extracted Data (if available) */}
          {offer.extracted_data && (
            <Card>
              <CardHeader>
                <CardTitle>Extrahierte Daten</CardTitle>
                <CardDescription>
                  Automatisch aus dem Exposé extrahiert
                  {offer.extraction_confidence && ` (Konfidenz: ${offer.extraction_confidence}%)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                  {JSON.stringify(offer.extracted_data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Kalkulation */}
        <TabsContent value="kalkulation" className="mt-6">
          <div className="mb-4">
            <Tabs value={calcTab} onValueChange={(v) => setCalcTab(v as 'bestand' | 'aufteiler')}>
              <TabsList>
                <TabsTrigger value="bestand">🏠 Bestand (Hold)</TabsTrigger>
                <TabsTrigger value="aufteiler">📊 Aufteiler (Flip)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {calcTab === 'bestand' ? (
            <BestandCalculation 
              offerId={offer.id}
              initialData={{
                purchasePrice: offer.price_asking || 0,
                monthlyRent: offer.noi_indicated ? offer.noi_indicated / 12 : 0,
                units: offer.units_count || 1,
                areaSqm: offer.area_sqm || 0,
              }}
            />
          ) : (
            <AufteilerCalculation 
              offerId={offer.id}
              initialData={{
                purchasePrice: offer.price_asking || 0,
                yearlyRent: offer.noi_indicated || 0,
                units: offer.units_count || 1,
                areaSqm: offer.area_sqm || 0,
              }}
            />
          )}
        </TabsContent>

        {/* Tab: Anbieter */}
        <TabsContent value="anbieter" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Anbieter / Makler</CardTitle>
              <CardDescription>Kontaktdaten aus dem Exposé</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* TODO: Extract from source_contact or extracted_data */}
              <p className="text-muted-foreground">
                Anbieterdaten werden aus dem Exposé extrahiert.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: E-Mail / Quelle */}
        <TabsContent value="quelle" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Original-E-Mail</CardTitle>
              <CardDescription>
                Die eingegangene Nachricht mit dem Exposé
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offer.source_inbound_id ? (
                <p className="text-sm">
                  Verknüpft mit Inbound-Nachricht: <code className="bg-muted px-2 py-1 rounded">{offer.source_inbound_id}</code>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Dieses Angebot wurde manuell hochgeladen.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Dokumente */}
        <TabsContent value="dokumente" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dokumente</CardTitle>
                <CardDescription>Exposés und zugehörige Unterlagen</CardDescription>
              </div>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Dokument hochladen
              </Button>
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
        </TabsContent>

        {/* Tab: Aktivitäten */}
        <TabsContent value="aktivitaeten" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Aktivitäten</CardTitle>
                <CardDescription>Verlauf und Notizen</CardDescription>
              </div>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Aktivität hinzufügen
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Auto-generated activity */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Objekt eingegangen</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(offer.created_at), { locale: de, addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '–'}</span>
    </div>
  );
}

export default ObjekteingangDetail;
