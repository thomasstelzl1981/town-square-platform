/**
 * AcquiaryObjekteingang — Global Offer Inbox for Zone 1
 * 
 * Shows ALL offers across ALL mandates for platform admin oversight
 * This is the Zone 1 equivalent of MOD-12's ObjekteingangList
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
  ArrowRight, MapPin, FileText, Filter, Mail, Upload, Globe
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { AcqOffer, AcqOfferStatus } from '@/hooks/useAcqOffers';
import type { AcqMandate } from '@/types/acquisition';

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
  inbound_email: Mail,
  upload: Upload,
  manual: FileText,
  portal_scrape: Globe,
};

export default function AcquiaryObjekteingang() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [mandateFilter, setMandateFilter] = React.useState<string>('all');

  // Fetch ALL mandates (for dropdown)
  const { data: mandates = [] } = useQuery({
    queryKey: ['acq-mandates-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_mandates')
        .select('id, code, client_display_name')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Pick<AcqMandate, 'id' | 'code' | 'client_display_name'>[];
    },
  });

  // Fetch ALL offers globally
  const { data: allOffers = [], isLoading } = useQuery({
    queryKey: ['acq-offers-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_offers')
        .select(`
          *,
          mandate:acq_mandates(id, code, client_display_name, assigned_manager_user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (AcqOffer & { mandate: Pick<AcqMandate, 'id' | 'code' | 'client_display_name' | 'assigned_manager_user_id'> | null })[];
    },
  });

  // Filter offers
  const filteredOffers = React.useMemo(() => {
    return allOffers.filter(offer => {
      if (statusFilter !== 'all' && offer.status !== statusFilter) return false;
      if (mandateFilter !== 'all' && offer.mandate_id !== mandateFilter) return false;
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = offer.title?.toLowerCase().includes(term);
        const matchesAddress = offer.address?.toLowerCase().includes(term);
        const matchesCity = offer.city?.toLowerCase().includes(term);
        const matchesMandateCode = offer.mandate?.code?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesAddress && !matchesCity && !matchesMandateCode) return false;
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

  const formatPrice = (price: number | null) => {
    if (!price) return '–';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
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
            placeholder="Suchen nach Titel, Adresse, Mandat..."
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
              Es gibt aktuell keine Exposé-Eingänge im System.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map(offer => {
            const statusConfig = STATUS_CONFIG[offer.status];
            const SourceIcon = SOURCE_ICONS[offer.source_type] || FileText;
            
            return (
              <Card 
                key={offer.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <SourceIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">
                            {offer.title || offer.address || 'Ohne Titel'}
                          </span>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          {offer.mandate && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {offer.mandate.code}
                            </Badge>
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
                            <div className="flex items-center gap-1">
                              <Euro className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{formatPrice(offer.price_asking)}</span>
                            </div>
                          )}
                          {offer.units_count && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span>{offer.units_count} WE</span>
                            </div>
                          )}
                          {offer.yield_indicated && (
                            <div className="text-muted-foreground">
                              Faktor {(100 / offer.yield_indicated).toFixed(1)}
                            </div>
                          )}
                          {offer.mandate?.client_display_name && (
                            <div className="text-muted-foreground">
                              → {offer.mandate.client_display_name}
                            </div>
                          )}
                        </div>
                        
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
          })}
        </div>
      )}
    </div>
  );
}
