/**
 * ObjekteingangList — Central inbox for all incoming offers
 * Shows all offers across all mandates for the manager
 */
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Inbox, Loader2, Search, Building2, Euro, Calendar, 
  ArrowRight, MapPin, FileText, Filter, Plus
} from 'lucide-react';
import { useAcqMandatesActive } from '@/hooks/useAcqMandate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
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

export function ObjekteingangList() {
  const navigate = useNavigate();
  const { data: mandatesForManager = [], isLoading: loadingMandates } = useAcqMandatesActive();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [mandateFilter, setMandateFilter] = React.useState<string>('all');

  // Also fetch mandates from the demo tenant for testing
  const { data: demoMandates = [] } = useQuery({
    queryKey: ['acq-mandates-demo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .eq('tenant_id', 'a0000000-0000-4000-a000-000000000001')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Combine manager mandates with demo mandates (deduplicated)
  const mandates = React.useMemo(() => {
    const seen = new Set<string>();
    const combined = [];
    for (const m of [...mandatesForManager, ...demoMandates]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        combined.push(m);
      }
    }
    return combined;
  }, [mandatesForManager, demoMandates]);

  // Fetch all offers for active mandates
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

  // Filter offers
  const filteredOffers = React.useMemo(() => {
    return allOffers.filter(offer => {
      // Status filter
      if (statusFilter !== 'all' && offer.status !== statusFilter) return false;
      
      // Mandate filter
      if (mandateFilter !== 'all' && offer.mandate_id !== mandateFilter) return false;
      
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = offer.title?.toLowerCase().includes(term);
        const matchesAddress = offer.address?.toLowerCase().includes(term);
        const matchesCity = offer.city?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesAddress && !matchesCity) return false;
      }
      
      return true;
    });
  }, [allOffers, statusFilter, mandateFilter, searchTerm]);

  // Stats
  const stats = {
    total: allOffers.length,
    new: allOffers.filter(o => o.status === 'new').length,
    analyzing: allOffers.filter(o => o.status === 'analyzing').length,
    analyzed: allOffers.filter(o => o.status === 'analyzed').length,
  };

  const isLoading = loadingMandates || loadingOffers;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Objekteingang</h1>
          <p className="text-muted-foreground">Alle eingegangenen Angebote und Exposés</p>
        </div>
        <Button onClick={() => navigate('/portal/akquise-manager/tools')}>
          <Plus className="h-4 w-4 mr-2" />
          Exposé hochladen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Gesamt</div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.new}</div>
            <div className="text-sm text-muted-foreground">Neu eingegangen</div>
          </CardContent>
        </Card>
        <Card className="border-secondary/40 bg-secondary/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary-foreground">{stats.analyzing}</div>
            <div className="text-sm text-muted-foreground">In Analyse</div>
          </CardContent>
        </Card>
        <Card className="border-accent/40 bg-accent/10">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent-foreground">{stats.analyzed}</div>
            <div className="text-sm text-muted-foreground">Analysiert</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Titel, Adresse, Stadt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="new">Eingegangen</SelectItem>
            <SelectItem value="analyzing">In Analyse</SelectItem>
            <SelectItem value="analyzed">Analysiert</SelectItem>
            <SelectItem value="presented">Präsentiert</SelectItem>
            <SelectItem value="rejected">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
        <Select value={mandateFilter} onValueChange={setMandateFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Mandat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Mandate</SelectItem>
            {mandates.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Keine Objekteingänge</h3>
            <p className="text-muted-foreground mt-2">
              Eingegangene Exposés per E-Mail oder Upload erscheinen hier.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/portal/akquise-manager/tools')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Exposé manuell hochladen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map(offer => (
            <OfferCard 
              key={offer.id} 
              offer={offer}
              mandateCode={mandates.find(m => m.id === offer.mandate_id)?.code}
              onClick={() => navigate(`/portal/akquise-manager/objekteingang/${offer.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({ 
  offer, 
  mandateCode,
  onClick 
}: { 
  offer: AcqOffer; 
  mandateCode?: string;
  onClick: () => void;
}) {
  const statusConfig = STATUS_CONFIG[offer.status];
  
  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">
                  {offer.title || offer.address || 'Ohne Titel'}
                </span>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                {mandateCode && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {mandateCode}
                  </Badge>
                )}
              </div>
              
              {/* Location */}
              {(offer.address || offer.city) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{[offer.address, offer.postal_code, offer.city].filter(Boolean).join(', ')}</span>
                </div>
              )}
              
              {/* Key metrics */}
              <div className="flex items-center gap-4 mt-2 text-sm">
                {offer.price_asking && (
                  <div className="flex items-center gap-1">
                    <Euro className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{formatPrice(offer.price_asking)}</span>
                  </div>
                )}
                {offer.units_count && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>{offer.units_count} Einheiten</span>
                  </div>
                )}
                {offer.area_sqm && (
                  <div className="text-muted-foreground">
                    {offer.area_sqm.toLocaleString('de-DE')} m²
                  </div>
                )}
                {offer.yield_indicated && (
                  <div className="text-muted-foreground">
                    Faktor {(100 / offer.yield_indicated).toFixed(1)}
                  </div>
                )}
              </div>
              
              {/* Time */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                <span>Eingang {formatDistanceToNow(new Date(offer.created_at), { locale: de, addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default ObjekteingangList;
