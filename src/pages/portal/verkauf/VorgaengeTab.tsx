import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText,
  Euro,
  Building2,
  User
} from 'lucide-react';
import { EmptyState } from '@/components/shared';

interface ReservationWithDetails {
  id: string;
  listing_id: string;
  status: string;
  reserved_price: number | null;
  notary_date: string | null;
  owner_confirmed_at: string | null;
  buyer_confirmed_at: string | null;
  created_at: string;
  listing_title?: string;
  buyer_name?: string;
}

interface TransactionWithDetails {
  id: string;
  listing_id: string;
  status: string;
  final_price: number;
  notary_date: string | null;
  bnl_date: string | null;
  handover_date: string | null;
  commission_amount: number | null;
  system_fee_amount: number | null;
  created_at: string;
  listing_title?: string;
  buyer_name?: string;
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
  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['verkauf-reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch listing and buyer details
      const listingIds = [...new Set(data?.map(r => r.listing_id) || [])];
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title')
        .in('id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const buyerIds = [...new Set(data?.map(r => r.buyer_contact_id).filter(Boolean) || [])];
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', buyerIds.length > 0 ? buyerIds : ['00000000-0000-0000-0000-000000000000']);

      const listingMap = new Map(listings?.map(l => [l.id, l.title]) || []);
      const contactMap = new Map(contacts?.map(c => [c.id, `${c.first_name} ${c.last_name}`]) || []);

      return data?.map(res => ({
        ...res,
        listing_title: listingMap.get(res.listing_id) || 'Unbekannt',
        buyer_name: res.buyer_contact_id ? contactMap.get(res.buyer_contact_id) || 'Unbekannt' : undefined
      })) || [];
    }
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['verkauf-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch listing and buyer details
      const listingIds = [...new Set(data?.map(t => t.listing_id) || [])];
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title')
        .in('id', listingIds.length > 0 ? listingIds : ['00000000-0000-0000-0000-000000000000']);

      const buyerIds = [...new Set(data?.map(t => t.buyer_contact_id).filter(Boolean) || [])];
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', buyerIds.length > 0 ? buyerIds : ['00000000-0000-0000-0000-000000000000']);

      const listingMap = new Map(listings?.map(l => [l.id, l.title]) || []);
      const contactMap = new Map(contacts?.map(c => [c.id, `${c.first_name} ${c.last_name}`]) || []);

      return data?.map(trans => ({
        ...trans,
        listing_title: listingMap.get(trans.listing_id) || 'Unbekannt',
        buyer_name: trans.buyer_contact_id ? contactMap.get(trans.buyer_contact_id) || 'Unbekannt' : undefined
      })) || [];
    }
  });

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const renderReservationCard = (res: ReservationWithDetails) => {
    const config = reservationStatusConfig[res.status] || { label: res.status, variant: 'secondary' as const };
    return (
      <Card key={res.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-medium">{res.listing_title}</p>
              {res.buyer_name && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {res.buyer_name}
                </p>
              )}
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Reservierungspreis</p>
              <p className="font-medium">{formatCurrency(res.reserved_price)}</p>
            </div>
            {res.notary_date && (
              <div>
                <p className="text-muted-foreground">Notartermin</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(res.notary_date), 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t">
            <div className="flex items-center gap-1 text-xs">
              {res.owner_confirmed_at ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <Clock className="h-3 w-3 text-amber-500" />
              )}
              <span>Eigentümer</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {res.buyer_confirmed_at ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <Clock className="h-3 w-3 text-amber-500" />
              )}
              <span>Käufer</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTransactionCard = (trans: TransactionWithDetails) => {
    const config = transactionStatusConfig[trans.status] || { label: trans.status, variant: 'secondary' as const };
    return (
      <Card key={trans.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-medium">{trans.listing_title}</p>
              {trans.buyer_name && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {trans.buyer_name}
                </p>
              )}
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <p className="text-muted-foreground">Kaufpreis</p>
              <p className="font-medium text-lg">{formatCurrency(trans.final_price)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Provision</p>
              <p className="font-medium text-green-600">{formatCurrency(trans.commission_amount)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {trans.notary_date && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Notar: {format(new Date(trans.notary_date), 'dd.MM.yy')}
              </div>
            )}
            {trans.bnl_date && (
              <div className="flex items-center gap-1">
                <Euro className="h-3 w-3" />
                BNL: {format(new Date(trans.bnl_date), 'dd.MM.yy')}
              </div>
            )}
            {trans.handover_date && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Übergabe: {format(new Date(trans.handover_date), 'dd.MM.yy')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="reservations">
            Reservierungen ({reservations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            Transaktionen ({transactions?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservations" className="mt-4">
          {reservationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : reservations?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservations.map(renderReservationCard)}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Keine Reservierungen"
              description="Wenn ein Kaufinteressent reserviert, erscheint die Reservierung hier."
            />
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          {transactionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : transactions?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transactions.map(renderTransactionCard)}
            </div>
          ) : (
            <EmptyState
              icon={Euro}
              title="Keine Transaktionen"
              description="Nach dem Notartermin werden Transaktionen hier verwaltet."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VorgaengeTab;
