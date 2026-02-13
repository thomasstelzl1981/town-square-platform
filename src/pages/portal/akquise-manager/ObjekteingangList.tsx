/**
 * ObjekteingangList — Table-based pipeline view with filter chips
 * CI-konform mit Mandate-Widgets und TABLE-Design-Tokens
 */
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Inbox, Loader2, Search, Plus, ArrowRight
} from 'lucide-react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { MandateUploadWidget } from '@/components/akquise/MandateUploadWidget';
import { useAcqMandatesForManager } from '@/hooks/useAcqMandate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TABLE } from '@/config/designManifest';
import type { AcqOffer, AcqOfferStatus } from '@/hooks/useAcqOffers';

const STATUS_CONFIG: Record<AcqOfferStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'Eingegangen', variant: 'default' },
  analyzing: { label: 'Analyse läuft', variant: 'secondary' },
  analyzed: { label: 'Analysiert', variant: 'outline' },
  presented: { label: 'Präsentiert', variant: 'outline' },
  accepted: { label: 'Akzeptiert', variant: 'default' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' },
  archived: { label: 'Archiviert', variant: 'secondary' },
};

const FILTER_CHIPS = [
  { value: 'all', label: 'Alle' },
  { value: 'new', label: 'Eingegangen' },
  { value: 'analyzing', label: 'In Analyse' },
  { value: 'analyzed', label: 'Analysiert' },
  { value: 'presented', label: 'Präsentiert' },
];

export function ObjekteingangList() {
  const navigate = useNavigate();
  const { data: mandates = [], isLoading: loadingMandates } = useAcqMandatesForManager();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedMandateId, setSelectedMandateId] = React.useState<string | null>(null);

  const mandateIds = mandates.map(m => m.id);
  
  const { data: allOffers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ['acq-offers-inbox', mandateIds],
    queryFn: async () => {
      if (mandateIds.length === 0) return [];
      const { data, error } = await supabase
        .from('acq_offers')
        .select('*')
        .in('mandate_id', mandateIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AcqOffer[];
    },
    enabled: mandateIds.length > 0,
  });

  const filteredOffers = React.useMemo(() => {
    return allOffers.filter(offer => {
      if (selectedMandateId && offer.mandate_id !== selectedMandateId) return false;
      if (statusFilter !== 'all' && offer.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!offer.title?.toLowerCase().includes(term) && !offer.address?.toLowerCase().includes(term) && !offer.city?.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [allOffers, statusFilter, searchTerm, selectedMandateId]);

  const isLoading = loadingMandates || loadingOffers;

  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  if (isLoading) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="OBJEKTEINGANG"
        description="Alle eingegangenen Angebote und Exposés"
        actions={
          <Button size="sm" onClick={() => navigate('/portal/akquise-manager/tools')}>
            <Plus className="h-4 w-4 mr-2" />
            Exposé hochladen
          </Button>
        }
      />

      {/* Mandate Widgets */}
      <WidgetGrid>
        {/* "Alle Eingänge" widget — always first */}
        <WidgetCell>
          <Card
            className={cn(
              'glass-card shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02]',
              'flex flex-row items-center gap-3 p-3 md:flex-col md:aspect-square md:p-0',
              !selectedMandateId && 'ring-2 ring-primary shadow-glow'
            )}
            onClick={() => setSelectedMandateId(null)}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 md:hidden">
              <Inbox className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 md:hidden">
              <p className="font-semibold text-sm">Alle Eingänge</p>
              <p className="text-[11px] text-muted-foreground">{allOffers.length} Objekte</p>
            </div>
            <CardContent className="hidden md:flex p-4 flex-col h-full justify-between">
              <div className="flex items-start justify-between">
                <Badge variant="default" className="text-[10px] font-medium">Gesamt</Badge>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                  <Inbox className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">Alle Eingänge</p>
                <p className="text-[11px] text-muted-foreground">{allOffers.length} Objekte</p>
              </div>
              <div />
            </CardContent>
          </Card>
        </WidgetCell>

        {/* Mandate widgets with upload drop zones */}
        {mandates.map(m => {
          const count = allOffers.filter(o => o.mandate_id === m.id).length;
          return (
            <WidgetCell key={m.id} className="group">
              <MandateUploadWidget
                mandate={m}
                offerCount={count}
                isSelected={selectedMandateId === m.id}
                onClick={() => setSelectedMandateId(prev => prev === m.id ? null : m.id)}
              />
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Filter Chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => setStatusFilter(chip.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
              statusFilter === chip.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {chip.label}
            {chip.value !== 'all' && (
              <span className="ml-1.5 opacity-70">
                {allOffers.filter(o => o.status === chip.value).length}
              </span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </div>

      {/* Table — always visible, CI-compliant */}
      {filteredOffers.length === 0 ? (
        <div className={TABLE.WRAPPER}>
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Keine Objekteingänge</h3>
            <p className="text-muted-foreground mt-2">Eingegangene Exposés per E-Mail oder Upload erscheinen hier.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/akquise-manager/tools')}>
              <Plus className="h-4 w-4 mr-2" />Exposé manuell hochladen
            </Button>
          </div>
        </div>
      ) : (
        <div className={TABLE.WRAPPER}>
          {/* Table Header */}
          <div className={cn(
            'grid grid-cols-[1fr_200px_100px_100px_120px_80px_40px] gap-2',
            TABLE.HEADER_BG,
            TABLE.HEADER_CELL
          )}>
            <span>Titel</span>
            <span>Adresse</span>
            <span className="text-right">Preis</span>
            <span>Status</span>
            <span>Mandat</span>
            <span>Alter</span>
            <span />
          </div>
          {/* Table Rows */}
          {filteredOffers.map(offer => {
            const statusConfig = STATUS_CONFIG[offer.status];
            const mandateCode = mandates.find(m => m.id === offer.mandate_id)?.code;
            return (
              <div
                key={offer.id}
                className={cn(
                  'grid grid-cols-[1fr_200px_100px_100px_120px_80px_40px] gap-2 items-center cursor-pointer',
                  TABLE.BODY_CELL,
                  TABLE.ROW_HOVER,
                  TABLE.ROW_BORDER
                )}
                onClick={() => navigate(`/portal/akquise-manager/objekteingang/${offer.id}`)}
              >
                <span className="font-medium truncate">{offer.title || 'Ohne Titel'}</span>
                <span className="text-muted-foreground truncate">{[offer.postal_code, offer.city].filter(Boolean).join(' ')}</span>
                <span className="text-right font-medium">{formatPrice(offer.price_asking)}</span>
                <Badge variant={statusConfig.variant} className="w-fit text-[10px]">{statusConfig.label}</Badge>
                {mandateCode ? (
                  <Badge variant="outline" className="w-fit font-mono text-[10px]">{mandateCode}</Badge>
                ) : <span />}
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(offer.created_at), { locale: de, addSuffix: false })}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

export default ObjekteingangList;
