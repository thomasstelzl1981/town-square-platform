/**
 * Projekt Desk — Zone 1 Operative Desk for MOD-13 (Projektmanager)
 * 
 * Governance: Projekt-Intake · Listing-Aktivierung · Landing-Page-Governance · Einheiten-Monitoring
 * Zone-Flow: Z2 (MOD-13 Projektmanager) → Z1 (Projekt Desk) → Z3 (Landing Pages + Marketplace)
 * 
 * Tab Structure:
 *   1. Dashboard — KPIs + aktive Projekte
 *   2. Projekte — Alle Projekte mit Status-Governance
 *   3. Listings — Projekt-Einheiten im Vertrieb
 *   4. Landing Pages — Website-Governance
 */
import { lazy, Suspense, useMemo } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Building2, FileCheck, Globe, BarChart3, Layers } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import type { DeskKPI } from '@/components/admin/desks/OperativeDeskShell';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TABS = [
  { value: 'dashboard', label: 'Dashboard', path: '' },
  { value: 'projekte', label: 'Projekte', path: 'projekte' },
  { value: 'listings', label: 'Listings', path: 'listings' },
  { value: 'landing-pages', label: 'Landing Pages', path: 'landing-pages' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

// ─── Dashboard Tab ───────────────────────────────────────────────────────────
function ProjektDashboard() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projekt-desk-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_projects')
        .select('id, name, city, status, total_units_count, kaufy_listed, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: salesRequests } = useQuery({
    queryKey: ['projekt-desk-sales-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_desk_requests')
        .select('id, status, project_id')
        .in('status', ['pending', 'approved']);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: landingPages } = useQuery({
    queryKey: ['projekt-desk-landing-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages' as any)
        .select('id, status')
        .eq('entity_type', 'dev_project');
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const p = projects ?? [];
    const active = p.filter(pr => pr.status === 'active' || pr.status === 'in_progress');
    const totalUnits = p.reduce((sum, pr) => sum + (pr.total_units_count || 0), 0);
    return {
      activeProjects: active.length,
      totalProjects: p.length,
      listedProjects: p.filter(pr => pr.kaufy_listed).length,
      totalUnits,
      landingPages: landingPages?.length ?? 0,
      pendingRequests: salesRequests?.filter(r => r.status === 'pending').length ?? 0,
    };
  }, [projects, salesRequests, landingPages]);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5" />
            Aktuelle Projekte
          </CardTitle>
          <CardDescription>
            {stats.totalProjects} Projekte · {stats.listedProjects} im Vertrieb
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!projects?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Keine Projekte vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Stadt</TableHead>
                  <TableHead className="text-center">Einheiten</TableHead>
                  <TableHead className="text-center">Marketplace</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.slice(0, 10).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.city || '–'}</TableCell>
                    <TableCell className="text-center">{p.total_units_count ?? '–'}</TableCell>
                    <TableCell className="text-center">
                      {p.kaufy_listed ? (
                        <Badge variant="default" className="text-xs">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Offline</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {p.status || 'draft'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Sales Requests */}
      {(stats.pendingRequests > 0) && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-amber-500" />
              Ausstehende Vertriebsanträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.pendingRequests} Antrag/Anträge warten auf Freigabe im Sales Desk.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Projekte Tab ────────────────────────────────────────────────────────────
function ProjekteTab() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projekt-desk-all-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_projects')
        .select('id, name, city, status, total_units_count, kaufy_listed, created_at, tenant:organizations!dev_projects_tenant_id_fkey(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Loading />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alle Projekte</CardTitle>
        <CardDescription>{projects?.length ?? 0} Projekte im System</CardDescription>
      </CardHeader>
      <CardContent>
        {!projects?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Keine Projekte vorhanden</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projekt</TableHead>
                <TableHead>Eigentümer</TableHead>
                <TableHead>Stadt</TableHead>
                <TableHead className="text-center">Einheiten</TableHead>
                <TableHead className="text-center">Marketplace</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{(p.tenant as any)?.name || '–'}</TableCell>
                  <TableCell>{p.city || '–'}</TableCell>
                  <TableCell className="text-center">{p.total_units_count ?? '–'}</TableCell>
                  <TableCell className="text-center">
                    {p.kaufy_listed ? (
                      <Badge variant="default" className="text-xs">Live</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Offline</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {p.status || 'draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(p.created_at).toLocaleDateString('de-DE')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Listings Tab ────────────────────────────────────────────────────────────
function ListingsTab() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['projekt-desk-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_desk_requests')
        .select('*, dev_projects(name, city, total_units_count, sold_units_count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Loading />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Vertriebsaufträge
        </CardTitle>
        <CardDescription>Projekt-basierte Vertriebsanträge und deren Status</CardDescription>
      </CardHeader>
      <CardContent>
        {!requests?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Keine Vertriebsaufträge vorhanden</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projekt</TableHead>
                <TableHead>Stadt</TableHead>
                <TableHead className="text-center">Einheiten</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Beantragt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.dev_projects?.name || '–'}</TableCell>
                  <TableCell className="text-muted-foreground">{r.dev_projects?.city || '–'}</TableCell>
                  <TableCell className="text-center">{r.dev_projects?.total_units_count ?? '–'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      r.status === 'approved' ? 'default' : 
                      r.status === 'pending' ? 'secondary' : 
                      'destructive'
                    } className="text-xs">
                      {r.status === 'approved' ? 'Genehmigt' : r.status === 'pending' ? 'Ausstehend' : r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(r.requested_at || r.created_at).toLocaleDateString('de-DE')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Landing Pages Tab ───────────────────────────────────────────────────────
function LandingPagesTab() {
  const { data: pages, isLoading } = useQuery({
    queryKey: ['projekt-desk-landing-pages-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_pages' as any)
        .select('*')
        .eq('entity_type', 'dev_project')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Loading />;

  const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    published: { label: 'Live', variant: 'default' },
    draft: { label: 'Entwurf', variant: 'secondary' },
    archived: { label: 'Archiviert', variant: 'outline' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Projekt-Landing-Pages
        </CardTitle>
        <CardDescription>Alle Landing Pages für Neubauprojekte</CardDescription>
      </CardHeader>
      <CardContent>
        {!pages?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Keine Landing Pages vorhanden</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page: any) => {
                const sm = STATUS_MAP[page.status] || { label: page.status, variant: 'outline' as const };
                return (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.name || page.title || '–'}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{page.slug || '–'}</TableCell>
                    <TableCell>
                      <Badge variant={sm.variant} className="text-xs">{sm.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(page.created_at).toLocaleDateString('de-DE')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Desk Component ─────────────────────────────────────────────────────
export default function ProjektDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/projekt-desk\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'dashboard';

  // Fetch summary data for KPIs
  const { data: projects } = useQuery({
    queryKey: ['projekt-desk-kpi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dev_projects')
        .select('id, status, total_units_count, kaufy_listed');
      if (error) throw error;
      return data ?? [];
    },
  });

  const kpis: DeskKPI[] = useMemo(() => {
    const p = projects ?? [];
    const active = p.filter(pr => pr.status === 'active' || pr.status === 'in_progress');
    const listed = p.filter(pr => pr.kaufy_listed);
    const totalUnits = p.reduce((sum, pr) => sum + (pr.total_units_count || 0), 0);
    return [
      { label: 'Aktive Projekte', value: active.length, icon: Building2, color: 'text-primary', subtitle: `${p.length} gesamt` },
      { label: 'Im Vertrieb', value: listed.length, icon: FileCheck, color: 'text-emerald-500', subtitle: 'Marketplace aktiv' },
      { label: 'Landing Pages', value: '—', icon: Globe, color: 'text-violet-500' },
      { label: 'Einheiten gesamt', value: totalUnits, icon: BarChart3, color: 'text-amber-500' },
    ];
  }, [projects]);

  const navigation = (
    <Tabs value={activeTab} className="w-full">
      <TabsList>
        {TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link to={`/admin/projekt-desk/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Projekt Desk"
      subtitle="Projekt-Intake · Listing-Aktivierung · Landing-Page-Governance · Einheiten-Monitoring"
      moduleCode="MOD-13"
      kpis={kpis}
      navigation={navigation}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<ProjektDashboard />} />
          <Route path="projekte" element={<ProjekteTab />} />
          <Route path="listings" element={<ListingsTab />} />
          <Route path="landing-pages" element={<LandingPagesTab />} />
          <Route path="*" element={<Navigate to="/admin/projekt-desk" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
