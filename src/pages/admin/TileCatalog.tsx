import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LayoutGrid, 
  Loader2, 
  Building2, 
  ShoppingCart, 
  Users, 
  FolderOpen, 
  Mail, 
  Wrench, 
  Settings,
  Plus,
  Check,
  X,
  Upload,
  Trash2,
  FileSpreadsheet,
  Database,
  RefreshCw,
  Shield,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { TestDataManager } from '@/components/admin/TestDataManager';
import { ModuleFreezePanel } from '@/components/admin/ModuleFreezePanel';
import { 
  ROLES_CATALOG, 
  getTilesForRole, 
  MODULES_CATALOG,
  type RoleDefinition 
} from '@/constants/rolesMatrix';

type TileCatalog = Tables<'tile_catalog'>;
type TenantTileActivation = Tables<'tenant_tile_activation'>;
type Organization = Tables<'organizations'>;

interface SubTile {
  title: string;
  route: string;
  icon_key: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'building-2': Building2,
  'shopping-cart': ShoppingCart,
  'users': Users,
  'folder-open': FolderOpen,
  'mail': Mail,
  'wrench': Wrench,
  'settings': Settings,
  'layout-grid': LayoutGrid,
};

function getIcon(iconKey: string) {
  const Icon = ICON_MAP[iconKey] || LayoutGrid;
  return <Icon className="h-5 w-5" />;
}

export default function TileCatalogPage() {
  const { isPlatformAdmin, user } = useAuth();
  const [tiles, setTiles] = useState<TileCatalog[]>([]);
  const [activations, setActivations] = useState<TenantTileActivation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [tenantRoles, setTenantRoles] = useState<Record<string, { membershipRole: string; appRole?: string; effectiveRole: string; orgName: string }>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [tilesRes, activationsRes, orgsRes] = await Promise.all([
        supabase.from('tile_catalog').select('*').order('display_order'),
        supabase.from('tenant_tile_activation').select('*'),
        supabase.from('organizations').select('*').order('name'),
      ]);

      if (tilesRes.error) throw tilesRes.error;
      if (activationsRes.error) throw activationsRes.error;
      if (orgsRes.error) throw orgsRes.error;

      setTiles(tilesRes.data || []);
      setActivations(activationsRes.data || []);
      setOrganizations(orgsRes.data || []);

      // Fetch tenant roles mapping
      await fetchTenantRoles(orgsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTenantRoles(orgs: Organization[]) {
    const rolesMap: Record<string, { membershipRole: string; appRole?: string; effectiveRole: string; orgName: string }> = {};
    
    for (const org of orgs) {
      // Get membership role for this tenant
      const { data: membership } = await supabase
        .from('memberships')
        .select('user_id, role')
        .eq('tenant_id', org.id)
        .limit(1)
        .single();

      if (membership) {
        // Check for app_role override
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', membership.user_id)
          .limit(1)
          .single();

        const membershipRole = String(membership.role);
        const appRole = userRole?.role ? String(userRole.role) : undefined;
        const effectiveRole = appRole && ['super_user', 'platform_admin'].includes(appRole) 
          ? appRole 
          : (appRole || membershipRole);

        rolesMap[org.id] = {
          membershipRole,
          appRole,
          effectiveRole,
          orgName: org.name || org.id,
        };
      } else {
        rolesMap[org.id] = {
          membershipRole: 'org_admin',
          effectiveRole: 'client_user',
          orgName: org.name || org.id,
        };
      }
    }
    setTenantRoles(rolesMap);
  }

  async function syncTenantsForRole(roleCode: string) {
    setSyncing(true);
    try {
      // Find all tenants with this effective role
      const tenantsWithRole = Object.entries(tenantRoles)
        .filter(([_, info]) => info.effectiveRole === roleCode)
        .map(([tenantId]) => tenantId);

      if (tenantsWithRole.length === 0) {
        toast.info('Keine Tenants mit dieser Rolle gefunden');
        setSyncing(false);
        return;
      }

      const targetTiles = getTilesForRole(roleCode);

      for (const tenantId of tenantsWithRole) {
        // Insert missing tiles
        for (const tileCode of targetTiles) {
          const existing = activations.find(
            a => a.tenant_id === tenantId && a.tile_code === tileCode
          );
          if (!existing) {
            await supabase.from('tenant_tile_activation').insert({
              tenant_id: tenantId,
              tile_code: tileCode,
              status: 'active',
              activated_by: user?.id,
            });
          } else if (existing.status === 'inactive') {
            await supabase
              .from('tenant_tile_activation')
              .update({ status: 'active', activated_at: new Date().toISOString() })
              .eq('id', existing.id);
          }
        }

        // Deactivate tiles not in target set
        const extraTiles = activations.filter(
          a => a.tenant_id === tenantId && a.status === 'active' && !targetTiles.includes(a.tile_code)
        );
        for (const extra of extraTiles) {
          await supabase
            .from('tenant_tile_activation')
            .update({ status: 'inactive', deactivated_at: new Date().toISOString() })
            .eq('id', extra.id);
        }
      }

      toast.success(`${tenantsWithRole.length} Tenant(s) für Rolle "${roleCode}" synchronisiert`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Sync');
    } finally {
      setSyncing(false);
    }
  }


  async function toggleTileForTenant(tileCode: string, tenantId: string, currentlyActive: boolean) {
    try {
      if (currentlyActive) {
        const { error } = await supabase
          .from('tenant_tile_activation')
          .update({ 
            status: 'inactive',
            deactivated_at: new Date().toISOString(),
            deactivated_by: user?.id
          })
          .eq('tenant_id', tenantId)
          .eq('tile_code', tileCode);
        
        if (error) throw error;
      } else {
        const existing = activations.find(
          a => a.tenant_id === tenantId && a.tile_code === tileCode
        );

        if (existing) {
          const { error } = await supabase
            .from('tenant_tile_activation')
            .update({ 
              status: 'active',
              activated_at: new Date().toISOString(),
              activated_by: user?.id,
              deactivated_at: null,
              deactivated_by: null
            })
            .eq('id', existing.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('tenant_tile_activation')
            .insert({
              tenant_id: tenantId,
              tile_code: tileCode,
              status: 'active',
              activated_by: user?.id
            });
          
          if (error) throw error;
        }
      }

      toast.success(currentlyActive ? 'Modul deaktiviert' : 'Modul aktiviert');
      fetchData();
    } catch (error: any) {
      console.error('Toggle error:', error);
      toast.error(error.message || 'Fehler beim Umschalten');
    }
  }

  async function activateAllForTenant(tenantId: string) {
    try {
      for (const tile of tiles) {
        const existing = activations.find(
          a => a.tenant_id === tenantId && a.tile_code === tile.tile_code
        );
        
        if (!existing) {
          await supabase.from('tenant_tile_activation').insert({
            tenant_id: tenantId,
            tile_code: tile.tile_code,
            status: 'active',
            activated_by: user?.id
          });
        } else if (existing.status === 'inactive') {
          await supabase
            .from('tenant_tile_activation')
            .update({ status: 'active', activated_at: new Date().toISOString() })
            .eq('id', existing.id);
        }
      }
      
      toast.success('Alle Module aktiviert');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Fehler');
    }
  }

  function isActivatedForTenant(tileCode: string, tenantId: string): boolean {
    return activations.some(
      a => a.tenant_id === tenantId && a.tile_code === tileCode && a.status === 'active'
    );
  }

  function getActivationCount(tileCode: string): number {
    return activations.filter(a => a.tile_code === tileCode && a.status === 'active').length;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase">Tile Catalog & Testdaten</h1>
          <p className="text-muted-foreground">
            Zone 2 Module verwalten und Testdaten importieren
          </p>
        </div>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Modul-Katalog
          </TabsTrigger>
          <TabsTrigger value="activation" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Rollen-Aktivierung
          </TabsTrigger>
          <TabsTrigger value="testdata" className="gap-2">
            <Database className="h-4 w-4" />
            Testdaten
          </TabsTrigger>
          <TabsTrigger value="freeze" className="gap-2">
            <Shield className="h-4 w-4" />
            Module Freeze
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tiles.map(tile => {
              const subTiles = (tile.sub_tiles as unknown as SubTile[]) || [];
              return (
                <Card key={tile.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getIcon(tile.icon_key)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tile.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {tile.tile_code}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {tile.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Hauptroute:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {tile.main_tile_route}
                      </code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Sub-Tiles:</span>
                      <div className="grid grid-cols-2 gap-1">
                        {subTiles.map((st, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs justify-center">
                            {st.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge variant={tile.is_active ? 'default' : 'secondary'}>
                        {tile.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getActivationCount(tile.tile_code)} Tenants
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activation" className="space-y-6">
          {/* Rollen-basierte Steuerung */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Rollenbezogene Tile-Steuerung
              </CardTitle>
              <CardDescription>
                Tiles werden automatisch aus der Rolle abgeleitet. Wähle eine Rolle, um alle zugehörigen Tenants zu synchronisieren.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Rolle auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_CATALOG.filter(r => !r.isLegacy).map(role => (
                      <SelectItem key={role.code} value={role.code}>
                        {role.label} ({role.totalModules} Module)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRole && (
                  <Button
                    variant="default"
                    onClick={() => syncTenantsForRole(selectedRole)}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Alle Tenants synchronisieren
                  </Button>
                )}
              </div>

              {selectedRole && (
                <>
                  {/* Tile-Vorschau für gewählte Rolle */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Module für Rolle "{ROLES_CATALOG.find(r => r.code === selectedRole)?.label}":</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {getTilesForRole(selectedRole).sort().map(tileCode => {
                        const mod = MODULES_CATALOG.find(m => m.code === tileCode);
                        return (
                          <Badge key={tileCode} variant="secondary" className="text-xs">
                            {tileCode} {mod ? `— ${mod.name}` : ''}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tenants mit dieser Rolle */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Tenants mit dieser Rolle:</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tenant</TableHead>
                          <TableHead>membership_role</TableHead>
                          <TableHead>app_role</TableHead>
                          <TableHead>Effektiv</TableHead>
                          <TableHead className="text-center">Ist-Tiles</TableHead>
                          <TableHead className="text-center">Soll-Tiles</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(tenantRoles)
                          .filter(([_, info]) => info.effectiveRole === selectedRole)
                          .map(([tenantId, info]) => {
                            const currentCount = activations.filter(
                              a => a.tenant_id === tenantId && a.status === 'active'
                            ).length;
                            const targetCount = getTilesForRole(selectedRole).length;
                            const inSync = currentCount === targetCount;
                            return (
                              <TableRow key={tenantId}>
                                <TableCell className="font-medium">{info.orgName}</TableCell>
                                <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{info.membershipRole}</code></TableCell>
                                <TableCell>
                                  {info.appRole ? (
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{info.appRole}</code>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">{info.effectiveRole}</Badge>
                                </TableCell>
                                <TableCell className="text-center">{currentCount}</TableCell>
                                <TableCell className="text-center">{targetCount}</TableCell>
                                <TableCell className="text-center">
                                  {inSync ? (
                                    <Check className="h-4 w-4 text-primary mx-auto" />
                                  ) : (
                                    <X className="h-4 w-4 text-destructive mx-auto" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        {Object.entries(tenantRoles).filter(([_, info]) => info.effectiveRole === selectedRole).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                              Keine Tenants mit dieser Rolle gefunden
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tenant-Einzelansicht (Debugging) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tenant-Einzelansicht (Debug)
              </CardTitle>
              <CardDescription>
                Manuelle Tile-Steuerung für einzelne Tenants (nur für Ausnahmen/Debugging).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Tenant auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTenant && (
                  <Button
                    variant="outline"
                    onClick={() => activateAllForTenant(selectedTenant)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Alle aktivieren
                  </Button>
                )}
              </div>

              {selectedTenant ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modul</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="w-24 text-center">Status</TableHead>
                      <TableHead className="w-24 text-center">Aktiv</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiles.map(tile => {
                      const isActive = isActivatedForTenant(tile.tile_code, selectedTenant);
                      return (
                        <TableRow key={tile.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getIcon(tile.icon_key)}
                              <span className="font-medium">{tile.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {tile.main_tile_route}
                            </code>
                          </TableCell>
                          <TableCell className="text-center">
                            {isActive ? (
                              <Check className="h-4 w-4 text-primary mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => 
                                toggleTileForTenant(tile.tile_code, selectedTenant, isActive)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Wähle einen Tenant aus, um Module manuell zu steuern
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testdata">
          <TestDataManager />
        </TabsContent>

        <TabsContent value="freeze">
          <ModuleFreezePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
