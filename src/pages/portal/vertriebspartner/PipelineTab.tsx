import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Handshake, TrendingUp, Euro, Clock } from 'lucide-react';
import { 
  PropertyTable, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PipelineDeal {
  id: string;
  contact_name: string | null;
  notes: string | null;
  deal_value: number | null;
  commission_rate: number | null;
  expected_commission: number;
  stage: string;
  expected_close_date: string | null;
  next_step: string | null;
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
  const { data: deals = [], isLoading } = useQuery({
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
        contact_name: d.contacts ? `${(d.contacts as any).first_name} ${(d.contacts as any).last_name}` : null,
        notes: d.notes,
        deal_value: d.deal_value,
        commission_rate: d.commission_rate,
        expected_commission: (d.deal_value || 0) * ((d.commission_rate || 0) / 100),
        stage: d.stage || 'lead',
        expected_close_date: d.expected_close_date,
        next_step: null // Placeholder
      })) || [];
    }
  });

  // Calculate stats
  const totalValue = deals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'won');
  const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
  const totalCommission = wonDeals.reduce((sum, d) => sum + d.expected_commission, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const columns: PropertyTableColumn<PipelineDeal>[] = [
    {
      key: 'notes',
      header: 'Objekt',
      minWidth: '200px',
      render: (val, row) => <PropertyAddressCell address={row.contact_name || 'Kein Kontakt'} subtitle={val || ''} />
    },
    {
      key: 'contact_name',
      header: 'Kunde',
      minWidth: '150px',
      render: (val) => val || <span className="text-muted-foreground">—</span>
    },
    {
      key: 'stage',
      header: 'Status',
      minWidth: '120px',
      render: (val) => {
        const config = stageConfig[val as string] || { label: val, variant: 'secondary' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      }
    },
    {
      key: 'deal_value',
      header: 'Preis',
      align: 'right',
      minWidth: '120px',
      render: (val) => <PropertyCurrencyCell value={val} />
    },
    {
      key: 'expected_commission',
      header: 'Provision',
      align: 'right',
      minWidth: '120px',
      render: (val) => <PropertyCurrencyCell value={val} variant="bold" />
    },
    {
      key: 'expected_close_date',
      header: 'Nächster Schritt',
      minWidth: '140px',
      render: (val) => val ? (
        <span className="text-sm">
          Erwartet: {format(new Date(val), 'dd.MM.yyyy', { locale: de })}
        </span>
      ) : <span className="text-muted-foreground">—</span>
    }
  ];

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

      {/* Pipeline Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deal-Pipeline</CardTitle>
          <CardDescription>Alle Ihre Verkaufsvorgänge im Überblick</CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyTable
            data={deals}
            columns={columns}
            isLoading={isLoading}
            emptyState={{
              message: 'Keine aktiven Deals. Wenn Sie Reservierungen vornehmen oder Leads bearbeiten, erscheinen sie hier in der Pipeline.',
              actionLabel: '',
              actionRoute: ''
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineTab;
