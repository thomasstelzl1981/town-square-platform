/**
 * AkquiseDatenbank — Zone 2 MOD-12 Global Property Database
 * Excel-style table view of all incoming property offers
 */
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Inbox, Loader2, Download, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ObjectSearchPanel, DEFAULT_FILTERS, type ObjectFilters } from '@/components/akquise/ObjectSearchPanel';
import type { AcqOfferStatus } from '@/hooks/useAcqOffers';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { AcqOfferDetailSheet } from './components/AcqOfferDetailSheet';
import * as XLSX from 'xlsx';

const STATUS_CONFIG: Record<AcqOfferStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'Neu', variant: 'default' },
  analyzing: { label: 'Analyse', variant: 'secondary' },
  analyzed: { label: 'Analysiert', variant: 'outline' },
  presented: { label: 'Präsentiert', variant: 'outline' },
  accepted: { label: 'Akzeptiert', variant: 'default' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' },
  archived: { label: 'Archiv', variant: 'secondary' },
};

const SOURCE_LABELS: Record<string, string> = {
  inbound_email: 'E-Mail',
  upload: 'Upload',
  manual: 'Manuell',
  manual_upload: 'Upload',
  portal_scrape: 'Portal',
  firecrawl: 'Crawl',
};

type SortKey = 'received_at' | 'postal_code' | 'city' | 'provider_name' | 'price_asking' | 'units_count' | 'area_sqm' | 'status';

export default function AkquiseDatenbank() {
  const [filters, setFilters] = React.useState<ObjectFilters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = React.useState<SortKey>('received_at');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [selectedOfferId, setSelectedOfferId] = React.useState<string | null>(null);

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
          (offer.provider_name as string | null)?.toLowerCase().includes(term) ||
          (offer.mandate as any)?.code?.toLowerCase().includes(term)
        )) return false;
      }
      return true;
    }).sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const key = sortKey as string;
      const av = (a as any)[key], bv = (b as any)[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return av > bv ? dir : av < bv ? -dir : 0;
    });
  }, [allOffers, filters, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const formatFaktor = (yieldPct: number | null) => {
    if (!yieldPct || yieldPct <= 0) return '–';
    return (100 / yieldPct).toFixed(1) + 'x';
  };

  const handleExport = () => {
    const rows = filtered.map((o, i) => ({
      '#': i + 1,
      Eingang: o.received_at ? format(new Date(o.received_at as string), 'dd.MM.yyyy') : format(new Date(o.created_at), 'dd.MM.yyyy'),
      PLZ: o.postal_code || '',
      Stadt: o.city || '',
      Straße: o.address || '',
      Anbieter: (o.provider_name as string) || '',
      Quelle: SOURCE_LABELS[o.source_type] || o.source_type,
      'Preis (€)': o.price_asking || '',
      WE: o.units_count || '',
      'Fläche (m²)': o.area_sqm || '',
      Faktor: o.yield_indicated && o.yield_indicated > 0 ? (100 / o.yield_indicated).toFixed(1) : '',
      Status: STATUS_CONFIG[o.status as AcqOfferStatus]?.label || o.status,
      Mandat: (o.mandate as any)?.code || '–',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Objekte');
    XLSX.writeFile(wb, `Objektdatenbank_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <ModulePageHeader
          title="DATENBANK"
          description="Alle eingegangenen Immobilienangebote"
        />
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Excel-Export
        </Button>
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
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort('received_at')}>
                    <span className="flex items-center">Eingang<SortIcon col="received_at" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('postal_code')}>
                    <span className="flex items-center">PLZ<SortIcon col="postal_code" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('city')}>
                    <span className="flex items-center">Stadt<SortIcon col="city" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort('provider_name')}>
                    <span className="flex items-center">Anbieter<SortIcon col="provider_name" /></span>
                  </TableHead>
                  <TableHead>Quelle</TableHead>
                  <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('price_asking')}>
                    <span className="flex items-center justify-end">Preis<SortIcon col="price_asking" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('units_count')}>
                    <span className="flex items-center justify-end">WE<SortIcon col="units_count" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('area_sqm')}>
                    <span className="flex items-center justify-end">m²<SortIcon col="area_sqm" /></span>
                  </TableHead>
                  <TableHead className="text-right">Faktor</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
                    <span className="flex items-center">Status<SortIcon col="status" /></span>
                  </TableHead>
                  <TableHead>Mandat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((offer, idx) => {
                  const statusCfg = STATUS_CONFIG[offer.status as AcqOfferStatus] || STATUS_CONFIG.new;
                  const dateStr = (offer.received_at as string) || offer.created_at;
                  return (
                    <TableRow
                      key={offer.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedOfferId(offer.id)}
                    >
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(dateStr), 'dd.MM.yy', { locale: de })}
                      </TableCell>
                      <TableCell className="text-sm font-mono">{offer.postal_code || '–'}</TableCell>
                      <TableCell className="text-sm">{offer.city || '–'}</TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">{(offer.provider_name as string) || '–'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_LABELS[offer.source_type] || offer.source_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatPrice(offer.price_asking)}</TableCell>
                      <TableCell className="text-right text-sm">{offer.units_count ?? '–'}</TableCell>
                      <TableCell className="text-right text-sm">{offer.area_sqm ? `${Math.round(offer.area_sqm)}` : '–'}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatFaktor(offer.yield_indicated)}</TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant} className="text-xs">{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {(offer.mandate as any)?.code || '–'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <AcqOfferDetailSheet
        offerId={selectedOfferId}
        onClose={() => setSelectedOfferId(null)}
        mandates={mandates}
      />
    </PageShell>
  );
}
