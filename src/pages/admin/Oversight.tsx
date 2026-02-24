import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Building2, 
  Users, 
  LayoutGrid, 
  Building,
  Loader2,
  Eye,
  Home,
  Banknote,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { DESIGN } from '@/config/designManifest';

interface OverviewStats {
  organizations: number;
  profiles: number;
  properties: number;
  activeTiles: number;
  financePackages: number;
  publicListings: number;
}

interface OrgOverview {
  id: string;
  name: string;
  org_type: string;
  created_at: string;
  memberCount: number;
  propertyCount: number;
  activeTileCount: number;
}

interface PropertyOverview {
  id: string;
  name: string;
  street: string;
  city: string;
  tenant_id: string;
  tenant_name: string;
  unit_count: number;
  created_at: string;
  is_public_listing: boolean;
}

interface FinancePackageOverview {
  id: string;
  tenant_id: string;
  tenant_name: string;
  property_name: string;
  contact_name: string;
  status: string;
  requested_amount: number | null;
  created_at: string;
  exported_at: string | null;
}

interface TileActivation {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tile_code: string;
  tile_name: string;
  status: string;
  activated_at: string;
}

export default function Oversight() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats>({
    organizations: 0,
    profiles: 0,
    properties: 0,
    activeTiles: 0,
    financePackages: 0,
    publicListings: 0,
  });
  const [propertyOverviews, setPropertyOverviews] = useState<PropertyOverview[]>([]);
  const [tileActivations, setTileActivations] = useState<TileActivation[]>([]);
  const [financePackages, setFinancePackages] = useState<FinancePackageOverview[]>([]);

  // Detail dialogs
  const [selectedProperty, setSelectedProperty] = useState<PropertyOverview | null>(null);

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchData();
    }
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      const [orgsRes, profilesRes, propertiesRes, tilesRes, membershipsRes, activationsRes, unitsRes, catalogRes, financeRes, contactsRes] = await Promise.all([
        supabase.from('organizations').select('*'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('properties').select('*'),
        supabase.from('tenant_tile_activation').select('*').eq('status', 'active'),
        supabase.from('memberships').select('*'),
        supabase.from('tenant_tile_activation').select('*'),
        supabase.from('units').select('*'),
        supabase.from('tile_catalog').select('*'),
        supabase.from('finance_packages').select('*'),
        supabase.from('contacts').select('id, first_name, last_name, tenant_id'),
      ]);

      const orgs = orgsRes.data || [];
      const properties = propertiesRes.data || [];
      const memberships = membershipsRes.data || [];
      const activations = activationsRes.data || [];
      const units = unitsRes.data || [];
      const catalog = catalogRes.data || [];
      const financeData = financeRes.data || [];
      const contacts = contactsRes.data || [];

      const publicListingsCount = properties.filter(p => p.is_public_listing).length;

      setStats({
        organizations: orgs.length,
        profiles: profilesRes.count || 0,
        properties: properties.length,
        activeTiles: tilesRes.data?.length || 0,
        financePackages: financeData.length,
        publicListings: publicListingsCount,
      });

      // Build property overviews
      const propOverviews: PropertyOverview[] = properties.map(prop => ({
        id: prop.id,
        name: prop.address || prop.code || 'Unnamed',
        street: prop.address || '',
        city: prop.city || '',
        tenant_id: prop.tenant_id,
        tenant_name: orgs.find(o => o.id === prop.tenant_id)?.name || 'Unknown',
        unit_count: units.filter(u => u.property_id === prop.id).length,
        created_at: prop.created_at,
        is_public_listing: prop.is_public_listing || false,
      }));
      setPropertyOverviews(propOverviews);

      // Build finance package overviews
      const financeOverviews: FinancePackageOverview[] = financeData.map(fp => {
        const property = properties.find(p => p.id === fp.property_id);
        const contact = contacts.find(c => c.id === fp.contact_id);
        return {
          id: fp.id,
          tenant_id: fp.tenant_id,
          tenant_name: orgs.find(o => o.id === fp.tenant_id)?.name || 'Unknown',
          property_name: property?.address || property?.code || 'Unknown',
          contact_name: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown',
          status: fp.status,
          requested_amount: fp.requested_amount,
          created_at: fp.created_at,
          exported_at: fp.exported_at,
        };
      });
      setFinancePackages(financeOverviews);

      // Build tile activations
      const tileActs: TileActivation[] = activations.map(act => ({
        id: act.id,
        tenant_id: act.tenant_id,
        tenant_name: orgs.find(o => o.id === act.tenant_id)?.name || 'Unknown',
        tile_code: act.tile_code,
        tile_name: catalog.find(c => c.tile_code === act.tile_code)?.title || act.tile_code,
        status: act.status,
        activated_at: act.activated_at || act.created_at,
      }));
      setTileActivations(tileActs);

    } catch (error) {
      console.error('Error fetching oversight data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={DESIGN.SPACING.SECTION}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>System-Übersicht</h1>
          <p className={DESIGN.TYPOGRAPHY.MUTED}>
            Systemweite Übersicht über alle Tenants, Immobilien und Module (Read-only)
          </p>
        </div>
        <Link to="/admin/tiles?tab=testdaten">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Testdaten verwalten
          </Button>
        </Link>
      </div>

      {/* Global Stats */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organisationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.organizations}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Benutzer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.profiles}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Immobilien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.properties}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.activeTiles}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Finance Pakete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.financePackages}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Öffentliche Inserate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.publicListings}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="properties">
        <TabsList>
          <TabsTrigger value="properties">Immobilien</TabsTrigger>
          <TabsTrigger value="finance">Finance Pakete</TabsTrigger>
          <TabsTrigger value="modules">Module</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alle Immobilien</CardTitle>
              <CardDescription>Systemweite Übersicht aller {propertyOverviews.length} Immobilien</CardDescription>
            </CardHeader>
            <CardContent>
              {propertyOverviews.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Immobilien gefunden</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Eigentümer</TableHead>
                      <TableHead className="text-right">Einheiten</TableHead>
                      <TableHead>Public</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propertyOverviews.map(prop => (
                      <TableRow key={prop.id}>
                        <TableCell className="font-medium">{prop.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {prop.street ? `${prop.street}, ${prop.city}` : prop.city || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prop.tenant_name}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{prop.unit_count}</TableCell>
                        <TableCell>
                          {prop.is_public_listing ? (
                            <Badge variant="default" className="bg-green-600"><Globe className="h-3 w-3 mr-1" />Öffentlich</Badge>
                          ) : (
                            <Badge variant="secondary">Privat</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(prop.created_at), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProperty(prop)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Finance Pakete</CardTitle>
              <CardDescription>{financePackages.length} Pakete im System</CardDescription>
            </CardHeader>
            <CardContent>
              {financePackages.length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Finance-Pakete gefunden</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead>Exportiert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financePackages.map(fp => (
                      <TableRow key={fp.id}>
                        <TableCell className="font-medium">{fp.property_name}</TableCell>
                        <TableCell>{fp.contact_name}</TableCell>
                        <TableCell><Badge variant="outline">{fp.tenant_name}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={fp.status === 'ready_for_handoff' ? 'default' : 'secondary'}>
                            {fp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {fp.requested_amount ? `€${fp.requested_amount.toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(fp.created_at), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell>
                          {fp.exported_at ? (
                            <Badge variant="default" className="bg-green-600">Exportiert</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modul-Aktivierungen</CardTitle>
              <CardDescription>{tileActivations.length} Aktivierungen im System</CardDescription>
            </CardHeader>
            <CardContent>
              {tileActivations.length === 0 ? (
                <div className="text-center py-8">
                  <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Modul-Aktivierungen gefunden</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modul</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktiviert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tileActivations.map(act => (
                      <TableRow key={act.id}>
                        <TableCell className="font-medium">{act.tile_name}</TableCell>
                        <TableCell>{act.tenant_name}</TableCell>
                        <TableCell>
                          <Badge variant={act.status === 'active' ? 'default' : 'secondary'}>
                            {act.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(act.activated_at), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Property Detail Dialog */}
      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Immobilie: {selectedProperty?.name}</DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                  <p className="mt-1">
                    {selectedProperty.street || '—'}<br />
                    {selectedProperty.city || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eigentümer</p>
                  <Badge variant="outline" className="mt-1">{selectedProperty.tenant_name}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Einheiten</p>
                  <p className="text-2xl font-bold mt-1">{selectedProperty.unit_count}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Erstellt</p>
                  <p className="mt-1">{format(new Date(selectedProperty.created_at), 'dd.MM.yyyy', { locale: de })}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Property ID</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{selectedProperty.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
