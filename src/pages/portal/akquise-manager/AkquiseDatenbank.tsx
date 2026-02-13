/**
 * AkquiseDatenbank — Zone 2 MOD-12 Database View
 * Shows offers within the user's tenant with intelligent search
 */
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Inbox, Loader2, Building2, Euro, Calendar, MapPin,
  Mail, Upload, FileText, Globe
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ObjectSearchPanel, DEFAULT_FILTERS, type ObjectFilters } from '@/components/akquise/ObjectSearchPanel';
import type { AcqOfferStatus } from '@/hooks/useAcqOffers';

const STATUS_CONFIG: Record<AcqOfferStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'Eingegangen', variant: 'default' },
  analyzing: { label: 'Analyse läuft', variant: 'secondary' },
  analyzed: { label: 'Analysiert', variant: 'outline' },
  presented: { label: 'Präsentiert', variant: 'outline' },
  accepted: { label: 'Akzeptiert', variant: 'default' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' },
  archived: { label: 'Archiviert', variant: 'secondary' },
};

const SOURCE_ICONS: Record<string, typeof Mail> = {
  inbound_email: Mail, upload: Upload, manual: FileText, portal_scrape: Globe,
};

export default function AkquiseDatenbank() {
  const [filters, setFilters] = React.useState<ObjectFilters>(DEFAULT_FILTERS);

  const { data: mandates = [] } = useQuery({
    queryKey: ['acq-mandates-mine'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_mandates')
        .select('id, code, client_display_name')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allOffers = [], isLoading } = useQuery({
    queryKey: ['acq-offers-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_offers')
        .select(`*, mandate:acq_mandates(id, code, client_display_name)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = React.useMemo(() => {
    return allOffers.filter(offer => {
      if (filters.status !== 'all' && offer.status !== filters.status) return false;
      if (filters.sourceType !== 'all' && offer.source_type !== filters.sourceType) return false;
      if (filters.mandateId !== 'all' && offer.mandate_id !== filters.mandateId) return false;
      if (filters.priceMin && (offer.price_asking ?? 0) < Number(filters.priceMin)) return false;
      if (filters.priceMax && (offer.price_asking ?? Infinity) > Number(filters.priceMax)) return false;
      if (filters.areaMin && (offer.area_sqm ?? 0) < Number(filters.areaMin)) return false;
      if (filters.yieldMin && (offer.yield_indicated ?? 0) < Number(filters.yieldMin)) return false;
      if (filters.city) {
        const term = filters.city.toLowerCase();
        if (!(offer.city?.toLowerCase().includes(term) || offer.postal_code?.includes(term))) return false;
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (!(
          offer.title?.toLowerCase().includes(term) ||
          offer.address?.toLowerCase().includes(term) ||
          offer.city?.toLowerCase().includes(term) ||
          (offer.mandate as any)?.code?.toLowerCase().includes(term)
        )) return false;
      }
      return true;
    }).sort((a, b) => {
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      const key = filters.sortBy as keyof typeof a;
      const av = a[key], bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return av > bv ? dir : av < bv ? -dir : 0;
    });
  }, [allOffers, filters]);

  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Objekt-Datenbank</h1>
        <p className="text-muted-foreground">Alle eingegangenen Immobilienangebote durchsuchen</p>
      </div>

      <ObjectSearchPanel
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filtered.length}
        showMandateFilter
        mandates={mandates}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Keine Objekte gefunden</h3>
            <p className="text-muted-foreground mt-2">Passen Sie Ihre Filter an oder laden Sie neue Exposés hoch.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(offer => {
            const statusConfig = STATUS_CONFIG[offer.status as AcqOfferStatus] || STATUS_CONFIG.new;
            const SourceIcon = SOURCE_ICONS[offer.source_type] || FileText;
            return (
              <Card key={offer.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <SourceIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{offer.title || offer.address || 'Ohne Titel'}</span>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        {(offer.mandate as any)?.code && (
                          <Badge variant="outline" className="text-xs font-mono">{(offer.mandate as any).code}</Badge>
                        )}
                      </div>
                      {(offer.address || offer.city) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{[offer.address, offer.postal_code, offer.city].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {offer.price_asking && (
                          <span className="flex items-center gap-1"><Euro className="h-3 w-3 text-muted-foreground" /><span className="font-medium">{formatPrice(offer.price_asking)}</span></span>
                        )}
                        {offer.units_count && (
                          <span className="flex items-center gap-1 text-muted-foreground"><Building2 className="h-3 w-3" />{offer.units_count} WE</span>
                        )}
                        {offer.yield_indicated && (
                          <span className="text-muted-foreground">Faktor {(100 / offer.yield_indicated).toFixed(1)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(offer.created_at), { locale: de, addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
