/**
 * Sales Desk — Zone-1 Admin Desk for Sales Operations
 */
import { Routes, Route, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Inbox, Users2, FileText, ArrowRight, Ban, CheckCircle2, Globe, Users, Building2 } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { useSalesDeskListings, useToggleListingBlock, useUpdateListingDistribution } from '@/hooks/useSalesDeskListings';

// Dashboard view
function SalesDeskDashboard() {
  const { data: listings } = useSalesDeskListings();
  const pendingCount = listings?.filter(l => !l.publications.some(p => p.status === 'active')).length || 0;
  const activeCount = listings?.filter(l => l.publications.some(p => p.status === 'active')).length || 0;
  const blockedCount = listings?.filter(l => l.is_blocked).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold uppercase">Sales Desk</h1>
        <p className="text-muted-foreground">
          Zentrale Übersicht für Verkaufsoperationen und Partner-Freigaben
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Neue Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Ausstehende Freigaben</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Veröffentlicht</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blockiert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedCount}</div>
            <p className="text-xs text-muted-foreground">Durch Admin gesperrt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Alle Listings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Veröffentlichungen
            </CardTitle>
            <CardDescription>
              Neue und ausstehende Listing-Freigaben verwalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/sales-desk/veroeffentlichungen">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Inbox
            </CardTitle>
            <CardDescription>
              Eingehende Anfragen und Nachrichten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/sales-desk/inbox">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5" />
              Partner
            </CardTitle>
            <CardDescription>
              Vertriebspartner-Zuweisungen und -Berechtigungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/sales-desk/partner">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit
            </CardTitle>
            <CardDescription>
              Prüfpfad und Änderungsprotokolle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/sales-desk/audit">
                Öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sub-pages
function VeroeffentlichungenTab() {
  const { data: listings, isLoading } = useSalesDeskListings();
  const toggleBlock = useToggleListingBlock();
  const updateDistribution = useUpdateListingDistribution();

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

  if (!listings || listings.length === 0) {
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
                        <div className="font-medium">{listing.property?.code || '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          {listing.property?.city}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">{listing.title}</div>
                    <div className="text-xs text-muted-foreground">{listing.tenant?.name}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(listing.asking_price)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={hasPartner && !listing.is_blocked}
                        disabled={listing.is_blocked || updateDistribution.isPending}
                        onCheckedChange={(checked) => 
                          updateDistribution.mutate({ 
                            listingId: listing.id, 
                            tenantId: listing.tenant?.id || '',
                            channel: 'partner_network', 
                            enabled: checked 
                          })
                        }
                      />
                      {hasPartner && <Users className="h-4 w-4 text-primary" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={hasKaufy && !listing.is_blocked}
                        disabled={listing.is_blocked || !hasPartner || updateDistribution.isPending}
                        onCheckedChange={(checked) => 
                          updateDistribution.mutate({ 
                            listingId: listing.id, 
                            tenantId: listing.tenant?.id || '',
                            channel: 'kaufy', 
                            enabled: checked 
                          })
                        }
                      />
                      {hasKaufy && <Globe className="h-4 w-4 text-primary" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant={listing.is_blocked ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={() => toggleBlock.mutate({ listingId: listing.id, blocked: !listing.is_blocked })}
                      disabled={toggleBlock.isPending}
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

function InboxTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Sales Desk Inbox</h2>
      <EmptyState
        icon={Inbox}
        title="Posteingang leer"
        description="Eingehende Nachrichten und Anfragen werden hier angezeigt"
      />
    </div>
  );
}

function PartnerTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Partner-Verwaltung</h2>
      <EmptyState
        icon={Users2}
        title="Keine Partner-Anfragen"
        description="Partner-Zuweisungen und Berechtigungen verwalten"
      />
    </div>
  );
}

function AuditTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Audit Log</h2>
      <EmptyState
        icon={FileText}
        title="Keine Audit-Einträge"
        description="Prüfpfad-Einträge werden hier protokolliert"
      />
    </div>
  );
}

export default function SalesDesk() {
  return (
    <Routes>
      <Route index element={<SalesDeskDashboard />} />
      <Route path="veroeffentlichungen" element={<VeroeffentlichungenTab />} />
      <Route path="inbox" element={<InboxTab />} />
      <Route path="partner" element={<PartnerTab />} />
      <Route path="audit" element={<AuditTab />} />
    </Routes>
  );
}
