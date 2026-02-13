import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ExposeImageGallery from '@/components/verkauf/ExposeImageGallery';
import ExposeHeadlineCard from '@/components/verkauf/ExposeHeadlineCard';
import ExposeDescriptionDisplay from '@/components/verkauf/ExposeDescriptionDisplay';
import { MapPin, ImageOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UnitDossierData } from '@/types/immobilienakte';

interface Property {
  id: string;
  code: string | null;
  property_type: string;
  city: string;
  address: string;
  postal_code: string | null;
  country: string;
  total_area_sqm: number | null;
  year_built: number | null;
  renovation_year: number | null;
  land_register_court: string | null;
  land_register_sheet: string | null;
  land_register_volume: string | null;
  parcel_number: string | null;
  unit_ownership_nr: string | null;
  notary_date: string | null;
  bnl_date: string | null;
  purchase_price: number | null;
  energy_source: string | null;
  heating_type: string | null;
  description: string | null;
  location_notes: string | null;
}

interface PropertyFinancing {
  id: string;
  loan_number: string | null;
  bank_name: string | null;
  original_amount: number | null;
  current_balance: number | null;
  interest_rate: number | null;
  fixed_until: string | null;
  monthly_rate: number | null;
  annual_interest: number | null;
  is_active: boolean;
}

interface Unit {
  id: string;
  current_monthly_rent: number | null;
  ancillary_costs: number | null;
  expose_headline: string | null;
  expose_subline: string | null;
}

interface ExposeTabProps {
  property: Property & { id: string };
  financing: PropertyFinancing[];
  unit: Unit | null;
  dossierData?: UnitDossierData | null;
}

export function ExposeTab({ property, financing, unit, dossierData }: ExposeTabProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '–';
    return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value == null) return '–';
    return `${value.toFixed(2)} %`;
  };

  const activeFinancing = financing.find(f => f.is_active);

  return (
    <div className="space-y-6">
      {/* Exposé Überschrift - editierbar, ganz oben */}
      {unit && (
        <ExposeHeadlineCard
          unitId={unit.id}
          headline={unit.expose_headline}
          subline={unit.expose_subline}
          propertyAddress={property.address}
          propertyCity={property.city}
        />
      )}

      {/* Header Section - Scout-Style */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{property.property_type}</p>
              <CardTitle className="text-xl">{property.address}</CardTitle>
              <p className="text-muted-foreground">
                {property.postal_code} {property.city}, {property.country}
              </p>
            </div>
            {property.code && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Objekt-Code</p>
                <p className="font-mono font-medium">{property.code}</p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Bildergalerie */}
      <ExposeImageGallery propertyId={property.id} />

      {/* Beschreibung + Google Maps Embed */}
      <div className="grid gap-6 md:grid-cols-2">
        <ExposeDescriptionDisplay description={property.description} />
        <SatelliteMapCard address={property.address} city={property.city} postalCode={property.postal_code} />
      </div>

      {/* Street View + Lage & Mikrolage (NEU) */}
      <div className="grid gap-6 md:grid-cols-2">
        <StreetViewCard address={property.address} city={property.city} postalCode={property.postal_code} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lage & Mikrolage</CardTitle>
          </CardHeader>
          <CardContent>
            {property.location_notes ? (
              <p className="text-sm whitespace-pre-wrap">{property.location_notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Lagedetails hinterlegt</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Baujahr & Zustand + Miete */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Baujahr & Zustand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Baujahr (BJ)" value={property.year_built?.toString()} />
            <InfoRow label="Sanierungsjahr" value={property.renovation_year?.toString()} />
            <InfoRow label="BNL" value={formatDate(property.bnl_date)} />
            <InfoRow label="Wohnfläche" value={property.total_area_sqm ? `${property.total_area_sqm} qm` : null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Miete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dossierData ? (
              <>
                <InfoRow label="Kaltmiete" value={formatCurrency(dossierData.rentColdEur)} />
                <InfoRow label="NK-Vorauszahlung" value={formatCurrency(dossierData.nkAdvanceEur)} />
                {dossierData.heatingAdvanceEur && dossierData.heatingAdvanceEur > 0 && (
                  <InfoRow label="Heizkosten-VZ" value={formatCurrency(dossierData.heatingAdvanceEur)} />
                )}
                <Separator className="my-2" />
                <InfoRow label="Warmmiete" value={formatCurrency(dossierData.rentWarmEur)} />
              </>
            ) : unit ? (
              <>
                <InfoRow label="Kaltmiete" value={formatCurrency(unit.current_monthly_rent)} />
                <InfoRow label="NK-Vorauszahlung" value={formatCurrency(unit.ancillary_costs)} />
                <Separator className="my-2" />
                <InfoRow label="Warmmiete" value={formatCurrency((unit.current_monthly_rent || 0) + (unit.ancillary_costs || 0))} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Mietdaten verfügbar</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Finanzierung + Grundbuch (nach unten gerutscht) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Finanzierung (Bestand)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Kaufpreis" value={formatCurrency(property.purchase_price)} />
            {activeFinancing ? (
              <>
                <Separator className="my-2" />
                <InfoRow label="Darlehensnr." value={activeFinancing.loan_number} />
                <InfoRow label="Bank" value={activeFinancing.bank_name} />
                <InfoRow label="Urspr. Darlehen" value={formatCurrency(activeFinancing.original_amount)} />
                <InfoRow label="Restschuld" value={formatCurrency(activeFinancing.current_balance)} />
                <InfoRow label="Zins" value={formatPercent(activeFinancing.interest_rate)} />
                <InfoRow label="Zinsbindung bis" value={formatDate(activeFinancing.fixed_until)} />
                <InfoRow label="Zinsbelastung ca." value={formatCurrency(activeFinancing.annual_interest)} />
                <InfoRow label="Rate" value={formatCurrency(activeFinancing.monthly_rate)} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Keine aktive Finanzierung hinterlegt</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grundbuch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Grundbuch von" value={property.land_register_court} />
            <InfoRow label="Grundbuchblatt" value={property.land_register_sheet} />
            <InfoRow label="Band" value={property.land_register_volume} />
            <InfoRow label="Flurstück" value={property.parcel_number} />
            <InfoRow label="TE-Nummer" value={property.unit_ownership_nr} />
            <InfoRow label="Notartermin" value={formatDate(property.notary_date)} />
          </CardContent>
        </Card>
      </div>

      {/* Energie & Heizung (nach unten gerutscht) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Energie & Heizung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Energieträger" value={property.energy_source} />
          <InfoRow label="Heizart" value={property.heating_type} />
        </CardContent>
      </Card>
    </div>
  );
}

/** Satellite Map Card — Google Maps Embed API with satellite view */
function SatelliteMapCard({ address, city, postalCode }: { address: string; city: string; postalCode: string | null }) {
  const { data: mapsApiKey } = useQuery({
    queryKey: ['google-maps-api-key'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-google-maps-key');
      if (error) throw error;
      return data?.key as string || '';
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const fullAddress = `${address}, ${postalCode ?? ''} ${city}`.trim();
  const encodedAddress = encodeURIComponent(fullAddress);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  // Use Embed API with satellite maptype when API key is available, otherwise fall back to simple embed
  const embedUrl = mapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${encodedAddress}&maptype=satellite&zoom=18`
    : `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Standort
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <a href={mapsLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              In Maps öffnen
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full rounded-lg overflow-hidden border" style={{ height: '280px' }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Karte: ${address}`}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">{fullAddress}</p>
      </CardContent>
    </Card>
  );
}

/** Street View Card — Google Street View Static API via edge function */
function StreetViewCard({ address, city, postalCode }: { address: string; city: string; postalCode: string | null }) {
  const [imgError, setImgError] = useState(false);

  const { data: mapsApiKey } = useQuery({
    queryKey: ['google-maps-api-key'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-google-maps-key');
      if (error) throw error;
      return data?.key as string || '';
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const fullAddress = `${address}, ${postalCode ?? ''} ${city}`.trim();
  const streetViewUrl = mapsApiKey
    ? `https://maps.googleapis.com/maps/api/streetview?size=600x280&location=${encodeURIComponent(fullAddress)}&key=${mapsApiKey}`
    : null;
  const streetViewLink = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=&query=${encodeURIComponent(fullAddress)}`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Street View
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <a href={streetViewLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Street View öffnen
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {streetViewUrl && !imgError ? (
          <img
            src={streetViewUrl}
            alt={`Street View: ${fullAddress}`}
            className="w-full h-[220px] object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[220px] bg-muted/30 text-muted-foreground gap-2">
            <ImageOff className="h-8 w-8" />
            <p className="text-xs">Street View nicht verfügbar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || '–'}</span>
    </div>
  );
}
