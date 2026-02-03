import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGoldenPathSeeds, SeedResult } from '@/hooks/useGoldenPathSeeds';
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
  ArrowRight,
  Home,
  FileText,
  Banknote,
  Globe,
  Database,
  CheckCircle,
  XCircle,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

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
  const { isPlatformAdmin, activeTenantId, activeOrganization, isDevelopmentMode } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats>({
    organizations: 0,
    profiles: 0,
    properties: 0,
    activeTiles: 0,
    financePackages: 0,
    publicListings: 0,
  });
  const [orgOverviews, setOrgOverviews] = useState<OrgOverview[]>([]);
  const [propertyOverviews, setPropertyOverviews] = useState<PropertyOverview[]>([]);
  const [tileActivations, setTileActivations] = useState<TileActivation[]>([]);
  const [financePackages, setFinancePackages] = useState<FinancePackageOverview[]>([]);

  // Golden Path Seeds with org context
  const { runSeeds, isSeeding, lastResult, isSeedAllowed } = useGoldenPathSeeds(
    activeTenantId,
    activeOrganization?.name,
    activeOrganization?.org_type,
    isDevelopmentMode
  );

  // Detail dialogs
  const [selectedOrg, setSelectedOrg] = useState<OrgOverview | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyOverview | null>(null);

  const handleRunSeeds = async () => {
    const result = await runSeeds();
    
    if (result.success) {
      toast.success('Golden Path Seeds erfolgreich erstellt', {
        description: `Contacts: ${result.after.contacts} | Properties: ${result.after.properties} | Docs: ${result.after.documents}`,
      });
      fetchData(); // Refresh stats
    } else {
      toast.error('Seed-Fehler: ' + result.error);
    }
  };

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

      // Build org overviews
      const overviews: OrgOverview[] = orgs.map(org => ({
        id: org.id,
        name: org.name,
        org_type: org.org_type,
        created_at: org.created_at,
        memberCount: memberships.filter(m => m.tenant_id === org.id).length,
        propertyCount: properties.filter(p => p.tenant_id === org.id).length,
        activeTileCount: activations.filter(a => a.tenant_id === org.id && a.status === 'active').length,
      }));
      setOrgOverviews(overviews);

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
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Oversight</h1>
          <p className="text-muted-foreground">
            Systemweite Übersicht über alle Tenants, Immobilien und Module (Read-only)
          </p>
        </div>
      </div>

      {/* Golden Path Seeds Card */}
      <Card className={`border-dashed ${isSeedAllowed ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {isSeedAllowed ? (
              <Sparkles className="h-4 w-4 text-amber-600" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-600" />
            )}
            Golden Path Demo Data
          </CardTitle>
          <CardDescription>
            {isSeedAllowed 
              ? 'Erstellt Beispieldaten für MOD-04 (Immobilien), MOD-07 (Finanzierung) und MOD-03 (DMS)'
              : 'Seeds nur im internal Org erlaubt. Bitte Org wechseln.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Context Info */}
          <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
            tenant_id: {activeTenantId?.slice(0, 8)}... | org: {activeOrganization?.name} | type: {activeOrganization?.org_type} | devMode: {isDevelopmentMode ? 'true' : 'false'}
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleRunSeeds} 
              disabled={isSeeding || !activeTenantId || !isSeedAllowed}
              className="gap-2"
              variant={isSeedAllowed ? 'default' : 'secondary'}
            >
              {isSeeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Seeds erstellen/aktualisieren
            </Button>
            
            {lastResult && lastResult.success && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" /> Seeds erstellt
              </Badge>
            )}
          </div>

          {/* Seed Result Tables */}
          {lastResult && lastResult.success && (
            <div className="space-y-4 mt-4">
              {/* Counts Table - simplified */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Table</TableHead>
                      <TableHead className="text-right">Before</TableHead>
                      <TableHead className="text-right">After</TableHead>
                      <TableHead className="text-center">Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(['properties', 'units', 'loans', 'leases', 'contacts', 'documents', 'landlord_contexts', 'context_members', 'tile_activations'] as const).map((key) => {
                      const before = lastResult.before[key] || 0;
                      const after = lastResult.after[key] || 0;
                      const delta = after - before;
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-mono text-xs">{key}</TableCell>
                          <TableCell className="text-right font-mono">{before}</TableCell>
                          <TableCell className="text-right font-mono">{after}</TableCell>
                          <TableCell className="text-center">
                            {delta > 0 ? (
                              <span className="text-green-600 font-mono">+{delta}</span>
                            ) : delta === 0 ? (
                              <span className="text-muted-foreground font-mono">—</span>
                            ) : (
                              <span className="text-red-600 font-mono">{delta}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="font-semibold text-sm">Zusammenfassung</div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Kontakte:</span>{' '}
                    <span className="font-mono font-bold">{lastResult.after.contacts}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Immobilien:</span>{' '}
                    <span className="font-mono font-bold">{lastResult.after.properties}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Module:</span>{' '}
                    <span className="font-mono font-bold">{lastResult.after.tile_activations}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dokumente:</span>{' '}
                    <span className="font-mono font-bold">{lastResult.after.documents}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {lastResult && !lastResult.success && (
            <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
              <XCircle className="h-4 w-4" />
              <span>{lastResult.error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Stats */}
      <div className="grid grid-cols-6 gap-4">
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
              Public Listings
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

      <Tabs defaultValue="tenants">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="properties">Immobilien</TabsTrigger>
          <TabsTrigger value="finance">Finance Pakete</TabsTrigger>
          <TabsTrigger value="modules">Module</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">Mitglieder</TableHead>
                  <TableHead className="text-right">Immobilien</TableHead>
                  <TableHead className="text-right">Module</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgOverviews.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{org.org_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{org.memberCount}</TableCell>
                    <TableCell className="text-right">{org.propertyCount}</TableCell>
                    <TableCell className="text-right">{org.activeTileCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(org.created_at), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrg(org)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/organizations/${org.id}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

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
                            <Badge variant="default" className="bg-green-600"><Globe className="h-3 w-3 mr-1" />Public</Badge>
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

      {/* Org Detail Dialog */}
      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Organisation: {selectedOrg?.name}</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Typ</p>
                  <Badge variant="outline" className="mt-1">{selectedOrg.org_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Erstellt</p>
                  <p className="mt-1">{format(new Date(selectedOrg.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Users className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-2xl font-bold mt-2">{selectedOrg.memberCount}</p>
                    <p className="text-xs text-muted-foreground">Mitglieder</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Building className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-2xl font-bold mt-2">{selectedOrg.propertyCount}</p>
                    <p className="text-xs text-muted-foreground">Immobilien</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <LayoutGrid className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-2xl font-bold mt-2">{selectedOrg.activeTileCount}</p>
                    <p className="text-xs text-muted-foreground">Module</p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedOrg(null);
                    navigate(`/admin/users?org=${selectedOrg.id}`);
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Mitglieder verwalten
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedOrg(null);
                    navigate(`/admin/organizations/${selectedOrg.id}`);
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Zur Organisation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
