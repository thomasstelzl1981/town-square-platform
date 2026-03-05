/**
 * Oversight — System overview orchestrator
 * R-24 Refactoring: 531 → ~140 lines
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ExternalLink } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import {
  OversightStats, OversightPropertiesTab, OversightFinanceTab,
  OversightModulesTab, OversightPropertyDialog,
} from '@/components/admin/oversight';

export default function Oversight() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ organizations: 0, profiles: 0, properties: 0, activeTiles: 0, financePackages: 0, publicListings: 0 });
  const [propertyOverviews, setPropertyOverviews] = useState<any[]>([]);
  const [tileActivations, setTileActivations] = useState<any[]>([]);
  const [financePackages, setFinancePackages] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  useEffect(() => { if (isPlatformAdmin) fetchData(); }, [isPlatformAdmin]);

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
      const orgs = orgsRes.data || []; const properties = propertiesRes.data || [];
      const activations = activationsRes.data || []; const units = unitsRes.data || [];
      const catalog = catalogRes.data || []; const financeData = financeRes.data || [];
      const contacts = contactsRes.data || [];

      setStats({ organizations: orgs.length, profiles: profilesRes.count || 0, properties: properties.length, activeTiles: tilesRes.data?.length || 0, financePackages: financeData.length, publicListings: properties.filter(p => p.is_public_listing).length });

      setPropertyOverviews(properties.map(p => ({ id: p.id, name: p.address || p.code || 'Unnamed', street: p.address || '', city: p.city || '', tenant_id: p.tenant_id, tenant_name: orgs.find(o => o.id === p.tenant_id)?.name || 'Unknown', unit_count: units.filter(u => u.property_id === p.id).length, created_at: p.created_at, is_public_listing: p.is_public_listing || false })));

      setFinancePackages(financeData.map(fp => {
        const prop = properties.find(p => p.id === fp.property_id);
        const contact = contacts.find(c => c.id === fp.contact_id);
        return { id: fp.id, tenant_id: fp.tenant_id, tenant_name: orgs.find(o => o.id === fp.tenant_id)?.name || 'Unknown', property_name: prop?.address || prop?.code || 'Unknown', contact_name: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown', status: fp.status, requested_amount: fp.requested_amount, created_at: fp.created_at, exported_at: fp.exported_at };
      }));

      setTileActivations(activations.map(a => ({ id: a.id, tenant_id: a.tenant_id, tenant_name: orgs.find(o => o.id === a.tenant_id)?.name || 'Unknown', tile_code: a.tile_code, tile_name: catalog.find(c => c.tile_code === a.tile_code)?.title || a.tile_code, status: a.status, activated_at: a.activated_at || a.created_at })));
    } catch (e) { console.error('Error fetching oversight data:', e); }
    finally { setLoading(false); }
  }

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className={DESIGN.SPACING.SECTION}>
      <div className="flex items-start justify-between">
        <div><h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>System-Übersicht</h1><p className={DESIGN.TYPOGRAPHY.MUTED}>Systemweite Übersicht über alle Tenants, Immobilien und Module (Read-only)</p></div>
        <Link to="/admin/tiles?tab=testdaten"><Button variant="outline" size="sm" className="gap-2"><ExternalLink className="h-4 w-4" />Testdaten verwalten</Button></Link>
      </div>

      <OversightStats stats={stats} />

      <Tabs defaultValue="properties">
        <TabsList><TabsTrigger value="properties">Immobilien</TabsTrigger><TabsTrigger value="finance">Finance Pakete</TabsTrigger><TabsTrigger value="modules">Module</TabsTrigger></TabsList>
        <TabsContent value="properties" className="space-y-4"><OversightPropertiesTab properties={propertyOverviews} onSelect={setSelectedProperty} /></TabsContent>
        <TabsContent value="finance" className="space-y-4"><OversightFinanceTab packages={financePackages} /></TabsContent>
        <TabsContent value="modules" className="space-y-4"><OversightModulesTab activations={tileActivations} /></TabsContent>
      </Tabs>

      <OversightPropertyDialog property={selectedProperty} onClose={() => setSelectedProperty(null)} />
    </div>
  );
}
