import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Euro,
  Building2,
  User
} from 'lucide-react';
import { 
  PropertyTable, 
  PropertyAddressCell, 
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

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
}

interface TransactionRow {
  id: string;
  listing_title: string;
  property_address: string;
  buyer_name: string | null;
  final_price: number;
  commission_amount: number | null;
  status: string;
  notary_date: string | null;
  bnl_date: string | null;
  handover_date: string | null;
}

const reservationStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending_owner: { label: 'Warte auf Eigentümer', variant: 'outline' },
  pending_buyer: { label: 'Warte auf Käufer', variant: 'outline' },
  confirmed: { label: 'Bestätigt', variant: 'default' },
  cancelled: { label: 'Storniert', variant: 'destructive' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' }
};

const transactionStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Ausstehend', variant: 'outline' },
  notarized: { label: 'Beurkundet', variant: 'default' },
  bnl_received: { label: 'BNL erhalten', variant: 'default' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
  cancelled: { label: 'Storniert', variant: 'destructive' }
};

const VorgaengeTab = () => {
  const [activeTab, setActiveTab] = useState('reservations');

  // Fetch reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['verkauf-reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listingIds = [...new Set(data?.map(r => r.listing_id) || [])];
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, properties (address, city)')
        .in('id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const buyerIds = [...new Set(data?.map(r => r.buyer_contact_id).filter(Boolean) || [])];
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', buyerIds.length > 0 ? buyerIds : ['00000000-0000-0000-0000-000000000000']);

      const listingMap = new Map(listings?.map(l => [l.id, { title: l.title, address: l.properties ? `${(l.properties as any).address}, ${(l.properties as any).city}` : '' }]) || []);
      const contactMap = new Map(contacts?.map(c => [c.id, `${c.first_name} ${c.last_name}`]) || []);

      return data?.map(res => ({
        id: res.id,
        listing_title: listingMap.get(res.listing_id)?.title || 'Unbekannt',
        property_address: listingMap.get(res.listing_id)?.address || '',
        buyer_name: res.buyer_contact_id ? contactMap.get(res.buyer_contact_id) || null : null,
        reserved_price: res.reserved_price,
        status: res.status,
        notary_date: res.notary_date,
        owner_confirmed: !!res.owner_confirmed_at,
        buyer_confirmed: !!res.buyer_confirmed_at
      })) || [];
    }
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['verkauf-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listingIds = [...new Set(data?.map(t => t.listing_id) || [])];
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, properties (address, city)')
        .in('id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const buyerIds = [...new Set(data?.map(t => t.buyer_contact_id).filter(Boolean) || [])];
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', buyerIds.length > 0 ? buyerIds : ['00000000-0000-0000-0000-000000000000']);

      const listingMap = new Map(listings?.map(l => [l.id, { title: l.title, address: l.properties ? `${(l.properties as any).address}, ${(l.properties as any).city}` : '' }]) || []);
      const contactMap = new Map(contacts?.map(c => [c.id, `${c.first_name} ${c.last_name}`]) || []);

      return data?.map(trans => ({
        id: trans.id,
        listing_title: listingMap.get(trans.listing_id)?.title || 'Unbekannt',
        property_address: listingMap.get(trans.listing_id)?.address || '',
        buyer_name: trans.buyer_contact_id ? contactMap.get(trans.buyer_contact_id) || null : null,
        final_price: trans.final_price,
        commission_amount: trans.commission_amount,
        status: trans.status,
        notary_date: trans.notary_date,
        bnl_date: trans.bnl_date,
        handover_date: trans.handover_date
      })) || [];
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
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <Clock className="h-3 w-3 text-amber-500" />
            )}
            EV
          </span>
          <span className="flex items-center gap-1 text-xs">
            {row.buyer_confirmed ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <Clock className="h-3 w-3 text-amber-500" />
            )}
            KV
          </span>
        </div>
      )
    }
  ];

  // Transactions columns
  const transactionColumns: PropertyTableColumn<TransactionRow>[] = [
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
      key: 'final_price',
      header: 'Kaufpreis',
      align: 'right',
      minWidth: '120px',
      render: (val) => <PropertyCurrencyCell value={val} variant="bold" />
    },
    {
      key: 'commission_amount',
      header: 'Provision',
      align: 'right',
      minWidth: '120px',
      render: (val) => <PropertyCurrencyCell value={val} variant="bold" />
    },
    {
      key: 'status',
      header: 'Status',
      minWidth: '130px',
      render: (val) => {
        const config = transactionStatusConfig[val as string] || { label: val, variant: 'secondary' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      }
    },
    {
      key: 'notary_date',
      header: 'Termine',
      minWidth: '180px',
      render: (_, row) => (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {row.notary_date && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {format(new Date(row.notary_date), 'dd.MM.yy')}
            </span>
          )}
          {row.bnl_date && (
            <span className="flex items-center gap-1">
              <Euro className="h-3 w-3" />
              {format(new Date(row.bnl_date), 'dd.MM.yy')}
            </span>
          )}
          {!row.notary_date && !row.bnl_date && (
            <span>—</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">VORGÄNGE</h1>
        <p className="text-muted-foreground mt-1">Reservierungen und Transaktionen</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="reservations">
            Reservierungen ({reservations.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            Transaktionen ({transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reservierungen</CardTitle>
              <CardDescription>
                Aktive Kaufreservierungen und deren Bestätigungsstatus
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

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaktionen</CardTitle>
              <CardDescription>
                Abgeschlossene Verkäufe und deren Zahlungsstatus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyTable
                data={transactions}
                columns={transactionColumns}
                isLoading={transactionsLoading}
                emptyState={{
                  message: 'Keine Transaktionen vorhanden',
                  actionLabel: '',
                  actionRoute: ''
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VorgaengeTab;
