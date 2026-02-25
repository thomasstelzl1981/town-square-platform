/**
 * VeroeffentlichungenTab — SalesDesk Sub-Page: Listing Publications
 */
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Ban, CheckCircle2, Globe, Users, Building2 } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { useSalesDeskListings, useToggleListingBlock, useUpdateListingDistribution } from '@/hooks/useSalesDeskListings';
import { useDemoListings, isDemoListingId, deduplicateByField } from '@/hooks/useDemoListings';

const DEMO_BADGE = (
  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs px-1.5 py-0">
    DEMO
  </Badge>
);

export function VeroeffentlichungenTab() {
  const { data: dbListings, isLoading } = useSalesDeskListings();
  const { salesDeskListings: demoListings } = useDemoListings();
  const toggleBlock = useToggleListingBlock();
  const updateDistribution = useUpdateListingDistribution();

  const listings = useMemo(() => deduplicateByField(
    demoListings,
    dbListings || [],
    (item: any) => item.property?.id || item.id
  ), [demoListings, dbListings]);

  const formatCurrency = (val: number | null) =>
    val ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val) : '—';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold uppercase">Veröffentlichungen</h2>
        <EmptyState
          icon={ShoppingBag}
          title="Keine aktiven Listings"
          description="Neue Verkaufslistings aus MOD-06 werden hier angezeigt"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold uppercase">Veröffentlichungen</h2>
        <Badge variant="secondary">{listings.length} Listings</Badge>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Objekt</TableHead>
              <TableHead>Titel</TableHead>
              <TableHead className="text-right">Preis</TableHead>
              <TableHead className="text-center">Partner</TableHead>
              <TableHead className="text-center">Kaufy</TableHead>
              <TableHead className="text-center">Scout24</TableHead>
              <TableHead className="text-center">Blockiert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => {
              const hasPartner = listing.publications.some(p => p.channel === 'partner_network' && p.status === 'active');
              const hasKaufy = listing.publications.some(p => p.channel === 'kaufy' && p.status === 'active');

              return (
                <TableRow key={listing.id} className={listing.is_blocked ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{listing.property?.code || '—'}</span>
                          {isDemoListingId(listing.id) && DEMO_BADGE}
                        </div>
                        <div className="text-xs text-muted-foreground">{listing.property?.city}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">{listing.title}</div>
                    <div className="text-xs text-muted-foreground">{listing.tenant?.name}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(listing.asking_price)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={hasPartner && !listing.is_blocked}
                        disabled={listing.is_blocked || updateDistribution.isPending || isDemoListingId(listing.id)}
                        onCheckedChange={(checked) => {
                          if (isDemoListingId(listing.id)) return;
                          updateDistribution.mutate({ listingId: listing.id, tenantId: listing.tenant?.id || '', channel: 'partner_network', enabled: checked });
                        }}
                      />
                      {hasPartner && <Users className="h-4 w-4 text-primary" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={hasKaufy && !listing.is_blocked}
                        disabled={listing.is_blocked || !hasPartner || updateDistribution.isPending || isDemoListingId(listing.id)}
                        onCheckedChange={(checked) => {
                          if (isDemoListingId(listing.id)) return;
                          updateDistribution.mutate({ listingId: listing.id, tenantId: listing.tenant?.id || '', channel: 'kaufy', enabled: checked });
                        }}
                      />
                      {hasKaufy && <Globe className="h-4 w-4 text-primary" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch checked={false} disabled={true} />
                      <Badge variant="outline" className="text-xs">Soon</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant={listing.is_blocked ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        if (isDemoListingId(listing.id)) return;
                        toggleBlock.mutate({ listingId: listing.id, blocked: !listing.is_blocked });
                      }}
                      disabled={toggleBlock.isPending || isDemoListingId(listing.id)}
                    >
                      {listing.is_blocked ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
