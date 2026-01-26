import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Camera, 
  Building2, 
  MapPin, 
  FileText, 
  Edit, 
  Home, 
  Megaphone, 
  Download,
  Loader2
} from 'lucide-react';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';

export default function RentalExposeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contentRef = usePdfContentRef();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['rental-listing-detail', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('rental_listings')
        .select(`
          *,
          properties!rental_listings_property_id_fkey (
            id,
            address,
            city,
            postal_code,
            country,
            code,
            property_type,
            year_built,
            description
          ),
          units (
            id,
            unit_number,
            area_sqm,
            rooms
          ),
          rental_publications (
            channel,
            status,
            published_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate('/portal/msv/vermietung')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Vermietungsinserat nicht gefunden
        </div>
      </div>
    );
  }

  const property = listing.properties;
  const unit = listing.units;
  const publications = listing.rental_publications || [];
  const isPublishedScout = publications.some((p: { channel: string; status: string }) => p.channel === 'scout24' && p.status === 'published');
  const isPublishedKleinanzeigen = publications.some((p: { channel: string; status: string }) => p.channel === 'kleinanzeigen' && p.status === 'published');

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header mit Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/portal/msv/vermietung')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
            {listing.status === 'active' ? 'Aktiv' : 
             listing.status === 'draft' ? 'Entwurf' : 
             listing.status === 'paused' ? 'Pausiert' : 
             listing.status === 'rented' ? 'Vermietet' : listing.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
        </div>
      </div>

      <div ref={contentRef}>
        {/* Bildbereich (Placeholder) */}
        <Card className="overflow-hidden">
          <div className="aspect-video bg-muted flex flex-col items-center justify-center border-b">
            <div className="p-4 rounded-full bg-muted-foreground/10 mb-4">
              <Camera className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">Objektfotos</p>
            <p className="text-sm text-muted-foreground/70">analog ImmobilienScout24</p>
          </div>
        </Card>

        {/* Header Section - Scout-Style */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {property?.property_type || 'Wohnung'}
                </p>
                <CardTitle className="text-xl">
                  {property?.address || '—'}
                </CardTitle>
                <p className="text-muted-foreground">
                  {property?.postal_code} {property?.city}, {property?.country || 'Deutschland'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Objekt-Code</p>
                <p className="font-mono font-medium">{property?.code || listing.public_id}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Kennzahlen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">
                {listing.cold_rent ? `${listing.cold_rent.toLocaleString('de-DE')} €` : '—'}
              </p>
              <p className="text-sm text-muted-foreground">Kaltmiete</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {listing.warm_rent ? `${listing.warm_rent.toLocaleString('de-DE')} €` : '—'}
              </p>
              <p className="text-sm text-muted-foreground">Warmmiete</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{unit?.area_sqm || '—'} m²</p>
              <p className="text-sm text-muted-foreground">Wohnfläche</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{unit?.rooms || '—'}</p>
              <p className="text-sm text-muted-foreground">Zimmer</p>
            </CardContent>
          </Card>
        </div>

        {/* Daten-Grid */}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* Lage & Adresse */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lage & Adresse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Straße" value={property?.address || '—'} />
              <InfoRow label="PLZ" value={property?.postal_code || '—'} />
              <InfoRow label="Ort" value={property?.city || '—'} />
              <InfoRow label="Land" value={property?.country || 'Deutschland'} />
            </CardContent>
          </Card>

          {/* Objekt & Einheit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Objekt & Einheit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Objekttyp" value={property?.property_type || 'Wohnung'} />
              <InfoRow label="Baujahr" value={property?.year_built?.toString() || '—'} />
              <InfoRow label="Einheit" value={unit?.unit_number || '—'} />
              <InfoRow label="Wohnfläche" value={unit?.area_sqm ? `${unit.area_sqm} m²` : '—'} />
            </CardContent>
          </Card>

          {/* Mietkosten */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mietkosten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Kaltmiete" value={listing.cold_rent ? `${listing.cold_rent.toLocaleString('de-DE')} €` : '—'} />
              <InfoRow label="Nebenkosten (ca.)" value={listing.utilities_estimate ? `${listing.utilities_estimate.toLocaleString('de-DE')} €` : '—'} />
              <Separator className="my-2" />
              <InfoRow label="Warmmiete" value={listing.warm_rent ? `${listing.warm_rent.toLocaleString('de-DE')} €` : '—'} highlight />
              <InfoRow label="Kaution" value={listing.deposit_months ? `${listing.deposit_months} Monatsmieten` : '—'} />
              <InfoRow label="Verfügbar ab" value={listing.available_from ? new Date(listing.available_from).toLocaleDateString('de-DE') : 'Sofort'} />
            </CardContent>
          </Card>

          {/* Veröffentlichung */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Veröffentlichung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span className="text-sm">ImmobilienScout24</span>
                </div>
                <Badge variant={isPublishedScout ? 'default' : 'outline'}>
                  {isPublishedScout ? 'Veröffentlicht' : 'Nicht veröffentlicht'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  <span className="text-sm">Kleinanzeigen</span>
                </div>
                <Badge variant={isPublishedKleinanzeigen ? 'default' : 'outline'}>
                  {isPublishedKleinanzeigen ? 'Veröffentlicht' : 'Nicht veröffentlicht'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Beschreibung */}
        {(listing.description || property?.description) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Beschreibung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {listing.description || property?.description || '—'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Aktionen */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Bei Scout24 veröffentlichen
            </Button>
            <Button variant="outline">
              <Megaphone className="h-4 w-4 mr-2" />
              Zu Kleinanzeigen exportieren
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Als PDF exportieren
            </Button>
          </div>
        </CardContent>
      </Card>

      <PdfExportFooter 
        contentRef={contentRef} 
        documentTitle="Vermietungsexposé" 
        moduleName="MOD-05 MSV" 
      />
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-semibold text-primary' : 'font-medium text-right'}>{value}</span>
    </div>
  );
}