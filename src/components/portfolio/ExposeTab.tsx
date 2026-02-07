import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { PropertyMap } from './PropertyMap';
import ExposeImageGallery from '@/components/verkauf/ExposeImageGallery';
import ExposeHeadlineCard from '@/components/verkauf/ExposeHeadlineCard';

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
}

export function ExposeTab({ property, financing, unit }: ExposeTabProps) {
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

      {/* Bildergalerie - immer sichtbar */}
      <ExposeImageGallery propertyId={property.id} />

      {/* Objektbeschreibung - prominent nach Header */}
      {property.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Objektbeschreibung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{property.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lage & Mikrolage - nur wenn vorhanden (ersetzt "Lage & Adresse" Duplikat) */}
        {property.location_notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lage & Mikrolage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{property.location_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Baujahr & Zustand */}
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

        {/* Grundbuch */}
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

        {/* Finanzierung (Bestand) */}
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

        {/* Energie & Heizung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Energie & Heizung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Energieträger" value={property.energy_source} />
            <InfoRow label="Heizart" value={property.heating_type} />
          </CardContent>
        </Card>

        {/* Miete */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Miete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unit ? (
              <>
                <InfoRow label="Warmmiete" value={formatCurrency(unit.current_monthly_rent)} />
                <InfoRow label="NK-Vorauszahlung" value={formatCurrency(unit.ancillary_costs)} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Mietdaten verfügbar</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google Maps Kartenansicht */}
      <PropertyMap
        address={property.address}
        city={property.city}
        postalCode={property.postal_code}
        country={property.country}
      />
    </div>
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
