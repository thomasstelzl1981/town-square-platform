import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Handshake, TrendingUp, Euro, Clock } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PipelineDeal {
  id: string;
  stage: string;
  deal_value: number | null;
  commission_rate: number | null;
  expected_close_date: string | null;
  contact_name: string | null;
  notes: string | null;
  created_at: string;
}

const stageConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  lead: { label: 'Lead', variant: 'outline' },
  qualified: { label: 'Qualifiziert', variant: 'secondary' },
  proposal: { label: 'Angebot', variant: 'default' },
  negotiation: { label: 'Verhandlung', variant: 'default' },
  won: { label: 'Gewonnen', variant: 'default' },
  lost: { label: 'Verloren', variant: 'destructive' }
};

const PipelineTab = () => {
  const { data: deals, isLoading } = useQuery({
    queryKey: ['partner-pipeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_deals')
        .select(`
          id, stage, deal_value, commission_rate, expected_close_date, notes, created_at,
          contacts (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(d => ({
        id: d.id,
        stage: d.stage || 'lead',
        deal_value: d.deal_value,
        commission_rate: d.commission_rate,
        expected_close_date: d.expected_close_date,
        contact_name: d.contacts ? `${(d.contacts as any).first_name} ${(d.contacts as any).last_name}` : null,
        notes: d.notes,
        created_at: d.created_at
      })) || [];
    }
  });

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!deals?.length) {
    return (
      <EmptyState
        icon={Handshake}
        title="Keine aktiven Deals"
        description="Wenn Sie Reservierungen vornehmen oder Leads bearbeiten, erscheinen sie hier in der Pipeline."
      />
    );
  }

  // Calculate stats
  const totalValue = deals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'won');
  const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
  const totalCommission = wonDeals.reduce((sum, d) => {
    const value = d.deal_value || 0;
    const rate = d.commission_rate || 0;
    return sum + (value * rate / 100);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary/70" />
              <div>
                <p className="text-2xl font-bold">{deals.length}</p>
                <p className="text-xs text-muted-foreground">Deals gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500/70" />
              <div>
                <p className="text-2xl font-bold">{activeDeals.length}</p>
                <p className="text-xs text-muted-foreground">Aktiv</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Handshake className="h-8 w-8 text-green-500/70" />
              <div>
                <p className="text-2xl font-bold">{wonDeals.length}</p>
                <p className="text-xs text-muted-foreground">Gewonnen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Euro className="h-8 w-8 text-green-600/70" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p>
                <p className="text-xs text-muted-foreground">Provision (gewonnen)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal List */}
      <Card>
        <CardHeader>
          <CardTitle>Deal-Übersicht</CardTitle>
          <CardDescription>Alle Ihre Verkaufsvorgänge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deals.map((deal) => {
              const config = stageConfig[deal.stage] || { label: deal.stage, variant: 'secondary' as const };
              return (
                <div 
                  key={deal.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{deal.contact_name || 'Kein Kontakt'}</p>
                    <p className="text-xs text-muted-foreground truncate">{deal.notes || '—'}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(deal.deal_value)}</p>
                      {deal.expected_close_date && (
                        <p className="text-xs text-muted-foreground">
                          Erwartet: {format(new Date(deal.expected_close_date), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      )}
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineTab;
