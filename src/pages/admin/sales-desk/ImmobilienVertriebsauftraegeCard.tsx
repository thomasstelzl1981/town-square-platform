/**
 * ImmobilienVertriebsauftraegeCard — Extracted from SalesDesk
 * Shows active individual property sales mandates.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Home } from 'lucide-react';
import { useDemoListings, deduplicateByField } from '@/hooks/useDemoListings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEMO_BADGE = (
  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs px-1.5 py-0">
    DEMO
  </Badge>
);

export function ImmobilienVertriebsauftraegeCard() {
  const { mandateListings: demoMandates } = useDemoListings();
  const { data: mandateListings, isLoading } = useQuery({
    queryKey: ['sales-desk-immobilien-mandate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, status, commission_rate, created_at, property_id, properties(address, city), tenant:organizations!listings_tenant_id_fkey(name)')
        .not('sales_mandate_consent_id', 'is', null)
        .in('status', ['active', 'reserved'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const allMandates = deduplicateByField(
    demoMandates as any[],
    mandateListings || [],
    (item: any) => item.property_id || item.id
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-DE');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" />Aktive Vertriebsaufträge (Immobilien)</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (allMandates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" />Aktive Vertriebsaufträge (Immobilien)</CardTitle>
          <CardDescription>Einzelimmobilien mit aktivem Verkaufsmandat</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">Keine aktiven Immobilien-Vertriebsaufträge</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" />Aktive Vertriebsaufträge (Immobilien)</CardTitle>
        <CardDescription>{allMandates.length} Einzelimmobilie{allMandates.length !== 1 ? 'n' : ''} mit aktivem Verkaufsmandat</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Objekt</TableHead>
              <TableHead>Eigentümer</TableHead>
              <TableHead className="text-right">Provision</TableHead>
              <TableHead>Aktiviert am</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMandates.map((listing: any) => (
              <TableRow key={listing.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{listing.properties?.address || '–'}</span>
                    {listing.isDemo && DEMO_BADGE}
                  </div>
                  <div className="text-xs text-muted-foreground">{listing.properties?.city || '–'}</div>
                </TableCell>
                <TableCell className="text-sm">{listing.tenant?.name || '–'}</TableCell>
                <TableCell className="text-right font-medium">{listing.commission_rate ? `${listing.commission_rate} %` : '–'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(listing.created_at)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                    {listing.status === 'active' ? 'Aktiv' : listing.status === 'reserved' ? 'Reserviert' : listing.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
