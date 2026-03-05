/**
 * TileCatalogPage — Orchestrator for tile catalog management
 * R-13 Refactoring: 646 → ~150 lines
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Loader2, Database, Shield, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { TestDataManager } from '@/components/admin/TestDataManager';
import { ModuleFreezePanel } from '@/components/admin/ModuleFreezePanel';
import { getTilesForRole } from '@/constants/rolesMatrix';
import { TileCatalogGrid } from '@/components/admin/tilecatalog/TileCatalogGrid';
import { TileRoleActivation } from '@/components/admin/tilecatalog/TileRoleActivation';

type TileCatalog = Tables<'tile_catalog'>;
type TenantTileActivation = Tables<'tenant_tile_activation'>;
type Organization = Tables<'organizations'>;

export default function TileCatalogPage() {
  const { isPlatformAdmin, user } = useAuth();
  const [tiles, setTiles] = useState<TileCatalog[]>([]);
  const [activations, setActivations] = useState<TenantTileActivation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [tenantRoles, setTenantRoles] = useState<Record<string, { membershipRole: string; appRole?: string; effectiveRole: string; orgName: string }>>({});

  useEffect(() => { fetchData(); }, []);

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
      await fetchTenantRoles(orgsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Fehler beim Laden');
    } finally { setLoading(false); }
  }

  async function fetchTenantRoles(orgs: Organization[]) {
    const rolesMap: Record<string, { membershipRole: string; appRole?: string; effectiveRole: string; orgName: string }> = {};
    for (const org of orgs) {
      const { data: membership } = await supabase.from('memberships').select('user_id, role').eq('tenant_id', org.id).limit(1).single();
      if (membership) {
        const { data: userRole } = await supabase.from('user_roles').select('role').eq('user_id', membership.user_id).limit(1).single();
        const membershipRole = String(membership.role);
        const appRole = userRole?.role ? String(userRole.role) : undefined;
        const effectiveRole = appRole && ['super_user', 'platform_admin'].includes(appRole) ? appRole : (appRole || membershipRole);
        rolesMap[org.id] = { membershipRole, appRole, effectiveRole, orgName: org.name || org.id };
      } else {
        rolesMap[org.id] = { membershipRole: 'org_admin', effectiveRole: 'client_user', orgName: org.name || org.id };
      }
    }
    setTenantRoles(rolesMap);
  }

  async function syncTenantsForRole(roleCode: string) {
    setSyncing(true);
    try {
      const tenantsWithRole = Object.entries(tenantRoles).filter(([_, info]) => info.effectiveRole === roleCode).map(([id]) => id);
      if (tenantsWithRole.length === 0) { toast.info('Keine Tenants mit dieser Rolle gefunden'); setSyncing(false); return; }
      const targetTiles = getTilesForRole(roleCode);
      for (const tenantId of tenantsWithRole) {
        for (const tileCode of targetTiles) {
          const existing = activations.find(a => a.tenant_id === tenantId && a.tile_code === tileCode);
          if (!existing) await supabase.from('tenant_tile_activation').insert({ tenant_id: tenantId, tile_code: tileCode, status: 'active', activated_by: user?.id });
          else if (existing.status === 'inactive') await supabase.from('tenant_tile_activation').update({ status: 'active', activated_at: new Date().toISOString() }).eq('id', existing.id);
        }
        const extraTiles = activations.filter(a => a.tenant_id === tenantId && a.status === 'active' && !targetTiles.includes(a.tile_code));
        for (const extra of extraTiles) await supabase.from('tenant_tile_activation').update({ status: 'inactive', deactivated_at: new Date().toISOString() }).eq('id', extra.id);
      }
      toast.success(`${tenantsWithRole.length} Tenant(s) für Rolle "${roleCode}" synchronisiert`);
      fetchData();
    } catch (error: any) { toast.error(error.message || 'Fehler beim Sync'); }
    finally { setSyncing(false); }
  }

  async function toggleTileForTenant(tileCode: string, tenantId: string, currentlyActive: boolean) {
    try {
      if (currentlyActive) {
        await supabase.from('tenant_tile_activation').update({ status: 'inactive', deactivated_at: new Date().toISOString(), deactivated_by: user?.id }).eq('tenant_id', tenantId).eq('tile_code', tileCode);
      } else {
        const existing = activations.find(a => a.tenant_id === tenantId && a.tile_code === tileCode);
        if (existing) await supabase.from('tenant_tile_activation').update({ status: 'active', activated_at: new Date().toISOString(), activated_by: user?.id, deactivated_at: null, deactivated_by: null }).eq('id', existing.id);
        else await supabase.from('tenant_tile_activation').insert({ tenant_id: tenantId, tile_code: tileCode, status: 'active', activated_by: user?.id });
      }
      toast.success(currentlyActive ? 'Modul deaktiviert' : 'Modul aktiviert');
      fetchData();
    } catch (error: any) { toast.error(error.message || 'Fehler beim Umschalten'); }
  }

  async function activateAllForTenant(tenantId: string) {
    try {
      for (const tile of tiles) {
        const existing = activations.find(a => a.tenant_id === tenantId && a.tile_code === tile.tile_code);
        if (!existing) await supabase.from('tenant_tile_activation').insert({ tenant_id: tenantId, tile_code: tile.tile_code, status: 'active', activated_by: user?.id });
        else if (existing.status === 'inactive') await supabase.from('tenant_tile_activation').update({ status: 'active', activated_at: new Date().toISOString() }).eq('id', existing.id);
      }
      toast.success('Alle Module aktiviert');
      fetchData();
    } catch (error: any) { toast.error(error.message || 'Fehler'); }
  }

  const isActivatedForTenant = (tileCode: string, tenantId: string) => activations.some(a => a.tenant_id === tenantId && a.tile_code === tileCode && a.status === 'active');
  const getActivationCount = (tileCode: string) => activations.filter(a => a.tile_code === tileCode && a.status === 'active').length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold uppercase">Tile Catalog & Testdaten</h1><p className="text-muted-foreground">Zone 2 Module verwalten und Testdaten importieren</p></div>
      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog" className="gap-2"><LayoutGrid className="h-4 w-4" />Modul-Katalog</TabsTrigger>
          <TabsTrigger value="activation" className="gap-2"><UserCheck className="h-4 w-4" />Rollen-Aktivierung</TabsTrigger>
          <TabsTrigger value="testdata" className="gap-2"><Database className="h-4 w-4" />Testdaten</TabsTrigger>
          <TabsTrigger value="freeze" className="gap-2"><Shield className="h-4 w-4" />Module Freeze</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog" className="space-y-4"><TileCatalogGrid tiles={tiles} getActivationCount={getActivationCount} /></TabsContent>
        <TabsContent value="activation" className="space-y-6">
          <TileRoleActivation
            tiles={tiles} activations={activations} organizations={organizations} tenantRoles={tenantRoles}
            selectedRole={selectedRole} onSelectRole={setSelectedRole}
            selectedTenant={selectedTenant} onSelectTenant={setSelectedTenant}
            syncing={syncing} onSyncRole={syncTenantsForRole}
            onToggleTile={toggleTileForTenant} onActivateAll={activateAllForTenant}
            isActivatedForTenant={isActivatedForTenant}
          />
        </TabsContent>
        <TabsContent value="testdata"><TestDataManager /></TabsContent>
        <TabsContent value="freeze"><ModuleFreezePanel /></TabsContent>
      </Tabs>
    </div>
  );
}
