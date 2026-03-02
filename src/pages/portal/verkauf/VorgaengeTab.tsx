/**
 * VorgaengeTab (MOD-06) — Connected to SLC for unified status model
 */
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Euro,
  User,
  Activity
} from 'lucide-react';
import { 
  PropertyTable, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { SLC_PHASE_LABELS } from '@/engines/slc/spec';
import type { SLCPhase } from '@/engines/slc/spec';

interface ReservationRow {
  id: string;
  listing_title: string;
  property_address: string;
  buyer_name: string | null;
  reserved_price: number | null;
  status: string;
  notary_date: string | null;
  owner_confirmed: boolean;
  buyer_confirmed: boolean;
  slc_phase: string | null;
}

const reservationStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Ausstehend', variant: 'outline' },
  confirmed: { label: 'Bestätigt', variant: 'default' },
  notary_scheduled: { label: 'Notar geplant', variant: 'default' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
  cancelled: { label: 'Storniert', variant: 'destructive' },
  expired: { label: 'Abgelaufen', variant: 'destructive' },
};

const SLC_PHASE_BADGE_COLORS: Partial<Record<SLCPhase, string>> = {
  mandate_active: 'bg-muted text-muted-foreground',
  published: 'bg-primary/15 text-primary',
  inquiry: 'bg-accent text-accent-foreground',
  reserved: 'bg-orange-500/15 text-orange-600',
  contract_draft: 'bg-blue-500/15 text-blue-600',
  notary_scheduled: 'bg-violet-500/15 text-violet-600',
  notary_completed: 'bg-emerald-500/15 text-emerald-600',
  handover: 'bg-emerald-500/15 text-emerald-600',
  settlement: 'bg-amber-500/15 text-amber-700',
  closed_won: 'bg-primary/15 text-primary',
  closed_lost: 'bg-destructive/15 text-destructive',
};

const VorgaengeTab = () => {
  const [activeTab, setActiveTab] = useState('reservations');

  // Fetch reservations with SLC phase
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['verkauf-reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_reservations')
        .select('*')
        .is('project_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listingIds = [...new Set(data?.map(r => r.listing_id).filter(Boolean) || [])];
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, properties (address, city)')
        .in('id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const buyerIds = [...new Set(data?.map(r => r.buyer_contact_id).filter(Boolean) || [])];
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', buyerIds.length > 0 ? buyerIds : ['00000000-0000-0000-0000-000000000000']);

      // Fetch SLC cases for these reservations
      const caseIds = [...new Set(data?.map(r => r.case_id).filter(Boolean) || [])];
      const { data: slcCases } = caseIds.length > 0
        ? await supabase.from('sales_cases').select('id, current_phase').in('id', caseIds)
        : { data: [] };

      const listingMap = new Map(listings?.map(l => [l.id, { title: l.title, address: l.properties ? `${(l.properties as any).address}, ${(l.properties as any).city}` : '' }]) || []);
      const contactMap = new Map(contacts?.map(c => [c.id, `${c.first_name} ${c.last_name}`]) || []);
      const caseMap = new Map((slcCases || []).map((c: any) => [c.id, c.current_phase]));

      return data?.map(res => ({
        id: res.id,
        listing_title: listingMap.get(res.listing_id)?.title || 'Unbekannt',
        property_address: listingMap.get(res.listing_id)?.address || '',
        buyer_name: res.buyer_contact_id ? contactMap.get(res.buyer_contact_id) || null : null,
        reserved_price: res.reserved_price,
        status: res.status,
        notary_date: res.notary_date,
        owner_confirmed: !!res.owner_confirmed_at,
        buyer_confirmed: !!res.buyer_confirmed_at,
        slc_phase: res.case_id ? caseMap.get(res.case_id) || null : null,
      })) || [];
    }
  });

  // Fetch settlements instead of sale_transactions
  const { data: settlements = [], isLoading: settlementsLoading } = useQuery({
    queryKey: ['verkauf-settlements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_settlements')
        .select(`
          *,
          case:sales_cases!sales_settlements_case_id_fkey(
            id, current_phase,
            property:properties(address, city),
            tenant:organizations!sales_cases_tenant_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Reservations columns
  const reservationColumns: PropertyTableColumn<ReservationRow>[] = [
    {
      key: 'property_address',
      header: 'Objekt',
      minWidth: '200px',
      render: (_, row) => <PropertyAddressCell address={row.listing_title} subtitle={row.property_address} />
    },
    {
      key: 'buyer_name',
      header: 'Käufer',
      minWidth: '150px',
      render: (val) => val ? (
        <span className="flex items-center gap-1">
          <User className="h-3 w-3 text-muted-foreground" />
          {val}
        </span>
      ) : <span className="text-muted-foreground">—</span>
    },
    {
      key: 'reserved_price',
      header: 'Preis',
      align: 'right',
      minWidth: '120px',
      render: (val) => <PropertyCurrencyCell value={val} />
    },
    {
      key: 'status',
      header: 'Status',
      minWidth: '140px',
      render: (val) => {
        const config = reservationStatusConfig[val as string] || { label: val, variant: 'secondary' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      }
    },
    {
      key: 'slc_phase',
      header: 'SLC Phase',
      minWidth: '140px',
      render: (val) => {
        if (!val) return <span className="text-muted-foreground text-xs">—</span>;
        const phase = val as SLCPhase;
        return (
          <Badge className={`text-xs ${SLC_PHASE_BADGE_COLORS[phase] || ''}`}>
            <Activity className="h-3 w-3 mr-1" />
            {SLC_PHASE_LABELS[phase] || phase}
          </Badge>
        );
      }
    },
    {
      key: 'notary_date',
      header: 'Notartermin',
      minWidth: '120px',
      render: (val) => val ? (
        <span className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          {format(new Date(val), 'dd.MM.yyyy', { locale: de })}
        </span>
      ) : <span className="text-muted-foreground">—</span>
    },
    {
      key: 'owner_confirmed',
      header: 'Bestätigung',
      minWidth: '120px',
      render: (_, row) => (
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-xs">
            {row.owner_confirmed ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <Clock className="h-3 w-3 text-amber-500" />
            )}
            EV
          </span>
          <span className="flex items-center gap-1 text-xs">
            {row.buyer_confirmed ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <Clock className="h-3 w-3 text-amber-500" />
            )}
            KV
          </span>
        </div>
      )
    }
  ];

  // Settlement columns
  const settlementColumns: PropertyTableColumn<any>[] = [
    {
      key: 'case',
      header: 'Objekt',
      minWidth: '200px',
      render: (val) => <PropertyAddressCell address={val?.property?.address || '–'} subtitle={val?.property?.city || ''} />
    },
    {
      key: 'deal_value',
      header: 'Deal-Wert',
      align: 'right',
      minWidth: '120px',
      render: (val) => <PropertyCurrencyCell value={val} variant="bold" />
    },
    {
      key: 'total_commission_brutto',
      header: 'Provision',
      align: 'right',
      minWidth: '120px',
      render: (val) => <PropertyCurrencyCell value={val} />
    },
    {
      key: 'platform_share_amount',
      header: 'Plattformanteil',
      align: 'right',
      minWidth: '120px',
      render: (val) => <PropertyCurrencyCell value={val} variant="bold" />
    },
    {
      key: 'status',
      header: 'Status',
      minWidth: '130px',
      render: (val) => {
        const labels: Record<string, string> = { calculated: 'Berechnet', approved: 'Freigegeben', invoiced: 'Fakturiert', paid: 'Bezahlt', cancelled: 'Storniert' };
        return <Badge variant={val === 'approved' ? 'default' : 'secondary'}>{labels[val as string] || val}</Badge>;
      }
    },
    {
      key: 'case',
      header: 'SLC Phase',
      minWidth: '140px',
      render: (val) => {
        const phase = val?.current_phase as SLCPhase;
        if (!phase) return <span className="text-muted-foreground">—</span>;
        return (
          <Badge className={`text-xs ${SLC_PHASE_BADGE_COLORS[phase] || ''}`}>
            {SLC_PHASE_LABELS[phase] || phase}
          </Badge>
        );
      }
    },
    {
      key: 'calculated_at',
      header: 'Erstellt',
      minWidth: '100px',
      render: (val) => val ? (
        <span className="text-sm text-muted-foreground">
          {format(new Date(val), 'dd.MM.yy')}
        </span>
      ) : '—'
    },
  ];

  return (
    <PageShell>
      <ModulePageHeader title="Vorgänge" description="Reservierungen und Abrechnungen — verbunden mit dem Sales Lifecycle" />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="reservations">
            Reservierungen ({reservations.length})
          </TabsTrigger>
          <TabsTrigger value="settlements">
            Abrechnungen ({settlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reservierungen</CardTitle>
              <CardDescription>
                Kaufreservierungen mit SLC-Phasenstatus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyTable
                data={reservations}
                columns={reservationColumns}
                isLoading={reservationsLoading}
                emptyState={{
                  message: 'Keine Reservierungen vorhanden',
                  actionLabel: '',
                  actionRoute: ''
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Abrechnungen</CardTitle>
              <CardDescription>
                Provisionsabrechnungen (ENG-PROVISION) mit Plattformanteil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyTable
                data={settlements}
                columns={settlementColumns}
                isLoading={settlementsLoading}
                emptyState={{
                  message: 'Keine Abrechnungen vorhanden',
                  actionLabel: '',
                  actionRoute: ''
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
};

export default VorgaengeTab;
