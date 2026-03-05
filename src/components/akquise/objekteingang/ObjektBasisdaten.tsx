/**
 * ObjektBasisdaten — Base data + location cards for ObjekteingangDetail
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';

function DataRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[140px_1fr] px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '–'}</span>
    </div>
  );
}

interface ObjektBasisdatenProps {
  offer: {
    title?: string | null;
    year_built?: number | null;
    units_count?: number | null;
    area_sqm?: number | null;
    price_asking?: number | null;
    address?: string | null;
    postal_code?: string | null;
    city?: string | null;
  };
  yearlyRent: number;
  formatPrice: (price: number | null) => string;
}

export function ObjektBasisdaten({ offer, yearlyRent, formatPrice }: ObjektBasisdatenProps) {
  return (
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
          <CardTitle className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'flex items-center gap-2')}><MapPin className="h-3 w-3" /> Lage</CardTitle>
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
  );
}
