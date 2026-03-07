/**
 * ObjektBasisdaten — Base data, location, and provider cards for ObjekteingangDetail
 * V2: Added Anbieter/Quelle card with provider info, source type badge, received date
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Mail, Globe, FileText } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function DataRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[140px_1fr] px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '–'}</span>
    </div>
  );
}

const SOURCE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  inbound_email: { label: 'E-Mail', variant: 'default' },
  manual: { label: 'Manuell', variant: 'secondary' },
  portal_import: { label: 'Portal-Import', variant: 'outline' },
  web_scrape: { label: 'Web-Recherche', variant: 'outline' },
};

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
    provider_name?: string | null;
    provider_contact?: string | null;
    source_type?: string | null;
    source_url?: string | null;
    received_at?: string | null;
    created_at?: string;
  };
  yearlyRent: number;
  formatPrice: (price: number | null) => string;
}

export function ObjektBasisdaten({ offer, yearlyRent, formatPrice }: ObjektBasisdatenProps) {
  const sourceInfo = SOURCE_LABELS[offer.source_type || ''] || { label: offer.source_type || '–', variant: 'outline' as const };
  const receivedDate = offer.received_at || offer.created_at;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Basisdaten */}
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
            <DataRow label="Kaufpreis" value={formatPrice(offer.price_asking ?? null)} />
            <DataRow label="Jahresmiete (IST)" value={yearlyRent > 0 ? formatPrice(yearlyRent) : '–'} />
          </div>
        </CardContent>
      </Card>

      {/* Lage */}
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

      {/* Anbieter / Quelle */}
      <Card className={DESIGN.CARD.BASE}>
        <CardHeader className={DESIGN.CARD.SECTION_HEADER}>
          <CardTitle className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'flex items-center gap-2')}>
            <User className="h-3 w-3" /> Anbieter / Quelle
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            <DataRow label="Anbieter" value={offer.provider_name || '–'} />
            <DataRow label="Kontakt" value={offer.provider_contact || '–'} />
            <div className="grid grid-cols-[140px_1fr] px-4 py-2 text-sm">
              <span className="text-muted-foreground">Quelle</span>
              <span>
                <Badge variant={sourceInfo.variant} className="text-[10px]">
                  {sourceInfo.label}
                </Badge>
              </span>
            </div>
            <DataRow
              label="Eingang"
              value={receivedDate ? format(new Date(receivedDate), 'dd.MM.yyyy HH:mm', { locale: de }) : '–'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
