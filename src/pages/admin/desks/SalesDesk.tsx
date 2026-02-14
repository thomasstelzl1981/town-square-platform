/**
 * Sales Desk — Zone-1 Admin Desk for Sales Operations
 * Projects: Only deactivation (Kill-Switch), no approval gate.
 */
import { useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Inbox, Users2, FileText, ArrowRight, Ban, CheckCircle2, Globe, Users, Building2, ExternalLink, Power, Home } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { useSalesDeskListings, useToggleListingBlock, useUpdateListingDistribution } from '@/hooks/useSalesDeskListings';
import { useDemoListings, isDemoListingId } from '@/hooks/useDemoListings';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEMO_BADGE = (
  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs px-1.5 py-0">
    DEMO
  </Badge>
);

// Immobilien-Vertriebsaufträge Card (individual property sales mandates)
function ImmobilienVertriebsauftraegeCard() {
  const { mandateListings: demoMandates } = useDemoListings();
  const { data: mandateListings, isLoading } = useQuery({
    queryKey: ['sales-desk-immobilien-mandate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, status, commission_rate, created_at, properties(address, city), tenant:organizations!listings_tenant_id_fkey(name)')
        .not('sales_mandate_consent_id', 'is', null)
        .in('status', ['active', 'reserved'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Merge demo mandates
  const allMandates = [...(demoMandates as any[]), ...(mandateListings || [])];

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-DE');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Aktive Vertriebsaufträge (Immobilien)
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (allMandates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Aktive Vertriebsaufträge (Immobilien)
          </CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Aktive Vertriebsaufträge (Immobilien)
        </CardTitle>
        <CardDescription>
          {allMandates.length} Einzelimmobilie{allMandates.length !== 1 ? 'n' : ''} mit aktivem Verkaufsmandat
        </CardDescription>
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
                <TableCell className="text-right font-medium">
                  {listing.commission_rate ? `${listing.commission_rate} %` : '–'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(listing.created_at)}
                </TableCell>
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

// Dashboard view
function SalesDeskDashboard() {
  const { data: listings } = useSalesDeskListings();
  const pendingCount = listings?.filter(l => !l.publications.some(p => p.status === 'active')).length || 0;
  const activeCount = listings?.filter(l => l.publications.some(p => p.status === 'active')).length || 0;
  const blockedCount = listings?.filter(l => l.is_blocked).length || 0;

  // Fetch active project requests
  const { data: projectRequests } = useQuery({
    queryKey: ['sales-desk-project-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_desk_requests')
        .select('*, dev_projects(name, city, total_units_count)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const queryClient = useQueryClient();

  const handleDeactivateProject = async (requestId: string, projectId: string) => {
    try {
      // Set request to withdrawn
      await supabase
        .from('sales_desk_requests')
        .update({ status: 'withdrawn' })
        .eq('id', requestId);

      // Withdraw all listings for this project's units
      const { data: units } = await supabase
        .from('dev_project_units')
        .select('property_id')
        .eq('project_id', projectId)
        .not('property_id', 'is', null);

      if (units?.length) {
        const propertyIds = units.map(u => u.property_id!).filter(Boolean);
        const { data: projectListings } = await supabase
          .from('listings')
          .select('id')
          .in('property_id', propertyIds);

        if (projectListings?.length) {
          const listingIds = projectListings.map(l => l.id);
          // Delete publications first (FK), then listings (hard-delete)
          await supabase.from('listing_publications').delete().in('listing_id', listingIds);
          await supabase.from('listings').delete().in('id', listingIds);
        }
      }

      await supabase.from('dev_projects').update({ kaufy_listed: false }).eq('id', projectId);

      toast.success('Projekt deaktiviert', { description: 'Alle Listings und Publikationen wurden gestoppt.' });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-project-requests'] });
    } catch {
      toast.error('Fehler bei der Deaktivierung');
    }
  };

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
            <CardTitle className="text-sm font-medium">Aktive Projekte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectRequests?.length || 0}</div>
            <p className="text-xs text-muted-foreground">MOD-13 Vertriebsaufträge</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Immobilien-Vertriebsaufträge (individual property mandates) */}
      <ImmobilienVertriebsauftraegeCard />

      {/* Active Projects — Kill-Switch only */}
      {projectRequests && projectRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Aktive Projekt-Vertriebsaufträge
            </CardTitle>
            <CardDescription>
              Projekte mit aktivem Vertriebsauftrag. Nur Deaktivierung möglich.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Stadt</TableHead>
                  <TableHead className="text-center">Einheiten</TableHead>
                  <TableHead>Aktiviert am</TableHead>
                  <TableHead className="text-center">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectRequests.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {req.dev_projects?.name || '–'}
                    </TableCell>
                    <TableCell>{req.dev_projects?.city || '–'}</TableCell>
                    <TableCell className="text-center">{req.dev_projects?.total_units_count ?? '–'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(req.requested_at).toLocaleDateString('de-DE')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleDeactivateProject(req.id, req.project_id)}
                      >
                        <Power className="h-3.5 w-3.5" />
                        Deaktivieren
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
  const { data: dbListings, isLoading } = useSalesDeskListings();
  const { salesDeskListings: demoListings } = useDemoListings();
  const toggleBlock = useToggleListingBlock();
  const updateDistribution = useUpdateListingDistribution();

  // Merge demo listings at the top
  const listings = useMemo(() => [...demoListings, ...(dbListings || [])], [demoListings, dbListings]);

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
                        disabled={listing.is_blocked || updateDistribution.isPending || isDemoListingId(listing.id)}
                        onCheckedChange={(checked) => {
                          if (isDemoListingId(listing.id)) return;
                          updateDistribution.mutate({ 
                            listingId: listing.id, 
                            tenantId: listing.tenant?.id || '',
                            channel: 'partner_network', 
                            enabled: checked 
                          });
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
                          updateDistribution.mutate({ 
                            listingId: listing.id, 
                            tenantId: listing.tenant?.id || '',
                            channel: 'kaufy', 
                            enabled: checked 
                          });
                        }}
                      />
                      {hasKaufy && <Globe className="h-4 w-4 text-primary" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {/* Scout24 - Coming Soon */}
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={false}
                        disabled={true}
                      />
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
