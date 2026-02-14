/**
 * Zone 1 — Website Hosting Dashboard (Admin)
 * Tab 1: Hosting-Verträge (hosting_contracts)
 * Tab 2: Projekt-Websites (landing_pages)
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { TYPOGRAPHY, CARD, SPACING } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Ban, CheckCircle, AlertTriangle, Search, ExternalLink, Lock, Unlock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLandingPages, useToggleLandingPageLock, type LandingPage } from '@/hooks/useLandingPage';
import { Skeleton } from '@/components/ui/skeleton';

export default function WebHostingDashboard() {
  return (
    <PageShell>
      <h2 className={TYPOGRAPHY.PAGE_TITLE}>Website Hosting</h2>
      <Tabs defaultValue="hosting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hosting">Hosting-Verträge</TabsTrigger>
          <TabsTrigger value="landing-pages">Projekt-Websites</TabsTrigger>
        </TabsList>
        <TabsContent value="hosting"><HostingContractsTab /></TabsContent>
        <TabsContent value="landing-pages"><LandingPagesTab /></TabsContent>
      </Tabs>
    </PageShell>
  );
}

// ─── Tab 1: Hosting Contracts ─────────────────────────────────────────────────

function HostingContractsTab() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['admin_hosting_contracts', filter],
    queryFn: async () => {
      let q = supabase
        .from('hosting_contracts' as any)
        .select('*, tenant_websites:website_id(name, slug, status), organizations:tenant_id(name)')
        .order('created_at', { ascending: false });
      if (filter !== 'all') q = q.eq('status', filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

  const suspend = useMutation({
    mutationFn: async ({ contractId, websiteId }: { contractId: string; websiteId: string }) => {
      const { error: cErr } = await supabase.from('hosting_contracts' as any).update({ status: 'suspended' }).eq('id', contractId);
      if (cErr) throw cErr;
      const { error: wErr } = await supabase.from('tenant_websites' as any).update({ status: 'suspended' }).eq('id', websiteId);
      if (wErr) throw wErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin_hosting_contracts'] }); toast.success('Website suspendiert'); },
    onError: (e: any) => toast.error(e.message),
  });

  const reactivate = useMutation({
    mutationFn: async ({ contractId, websiteId }: { contractId: string; websiteId: string }) => {
      const { error: cErr } = await supabase.from('hosting_contracts' as any).update({ status: 'active' }).eq('id', contractId);
      if (cErr) throw cErr;
      const { error: wErr } = await supabase.from('tenant_websites' as any).update({ status: 'published' }).eq('id', websiteId);
      if (wErr) throw wErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin_hosting_contracts'] }); toast.success('Website reaktiviert'); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = contracts?.filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.tenant_websites?.name?.toLowerCase().includes(s) || c.organizations?.name?.toLowerCase().includes(s);
  });

  const stats = {
    total: contracts?.length || 0,
    active: contracts?.filter((c: any) => c.status === 'active').length || 0,
    suspended: contracts?.filter((c: any) => c.status === 'suspended').length || 0,
    totalCredits: contracts?.reduce((sum: number, c: any) => sum + (c.credits_charged || 0), 0) || 0,
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Globe} label="Gesamt" value={stats.total} />
        <KpiCard icon={CheckCircle} label="Aktiv" value={stats.active} color="text-emerald-600" />
        <KpiCard icon={Ban} label="Suspendiert" value={stats.suspended} color="text-destructive" />
        <KpiCard icon={AlertTriangle} label="Credits verbraucht" value={stats.totalCredits} />
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Suche..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {['all', 'active', 'suspended', 'pending'].map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
              {f === 'all' ? 'Alle' : f === 'active' ? 'Aktiv' : f === 'suspended' ? 'Gesperrt' : 'Ausstehend'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={cn(CARD.CONTENT, 'overflow-x-auto')}>
        {isLoading ? (
          <p className={TYPOGRAPHY.MUTED}>Laden...</p>
        ) : !filtered?.length ? (
          <p className={TYPOGRAPHY.MUTED}>Keine Hosting-Verträge gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Website</th>
                <th className="pb-2 font-medium">Organisation</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Credits</th>
                <th className="pb-2 font-medium">Erstellt</th>
                <th className="pb-2 font-medium text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2.5">{c.tenant_websites?.name || '—'}</td>
                  <td className="py-2.5 text-muted-foreground">{c.organizations?.name || '—'}</td>
                  <td className="py-2.5"><StatusBadge status={c.status} /></td>
                  <td className="py-2.5 text-right tabular-nums">{c.credits_charged || 0}</td>
                  <td className="py-2.5 text-muted-foreground">{new Date(c.created_at).toLocaleDateString('de-DE')}</td>
                  <td className="py-2.5 text-right">
                    {c.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => suspend.mutate({ contractId: c.id, websiteId: c.website_id })} disabled={suspend.isPending}>
                        <Ban className="h-3.5 w-3.5 mr-1" />Sperren
                      </Button>
                    )}
                    {c.status === 'suspended' && (
                      <Button variant="outline" size="sm" onClick={() => reactivate.mutate({ contractId: c.id, websiteId: c.website_id })} disabled={reactivate.isPending}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />Freigeben
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab 2: Landing Pages (Projekt-Websites) ─────────────────────────────────

const LP_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Entwurf', variant: 'outline' },
  preview: { label: 'Vorschau', variant: 'secondary' },
  active: { label: 'Aktiv', variant: 'default' },
  locked: { label: 'Gesperrt', variant: 'destructive' },
};

function getTimeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return '–';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Abgelaufen';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}min`;
}

function LandingPagesTab() {
  const { data: pages, isLoading } = useLandingPages();
  const toggleLock = useToggleLandingPageLock();

  const handleToggleLock = (page: LandingPage) => {
    toggleLock.mutate({ id: page.id, lock: page.status !== 'locked' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Alle Projekt-Websites ({pages?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !pages?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Noch keine Projekt-Websites erstellt.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Slug</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Läuft ab in</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Erstellt</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pages.map((page) => {
                  const statusConfig = LP_STATUS_MAP[page.status] || LP_STATUS_MAP.draft;
                  const isLocked = page.status === 'locked';
                  return (
                    <tr key={page.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{page.slug}.kaufy.app</td>
                      <td className="px-4 py-3"><Badge variant={statusConfig.variant}>{statusConfig.label}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{page.status === 'preview' ? getTimeRemaining(page.preview_expires_at) : '–'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(page.created_at).toLocaleDateString('de-DE')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/projekt/${page.slug}`, '_blank')} className="gap-1">
                            <ExternalLink className="h-3 w-3" />Öffnen
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleLock(page)} disabled={toggleLock.isPending} className="gap-1">
                            {toggleLock.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            {isLocked ? 'Entsperren' : 'Sperren'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <div className={cn(CARD.CONTENT, 'flex items-center gap-3')}>
      <Icon className={cn('h-5 w-5', color || 'text-muted-foreground')} />
      <div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className={TYPOGRAPHY.HINT}>{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Aktiv', cls: 'bg-emerald-100 text-emerald-700' },
    suspended: { label: 'Gesperrt', cls: 'bg-red-100 text-red-700' },
    pending: { label: 'Ausstehend', cls: 'bg-amber-100 text-amber-700' },
    cancelled: { label: 'Gekündigt', cls: 'bg-muted text-muted-foreground' },
  };
  const m = map[status] || { label: status, cls: 'bg-muted text-muted-foreground' };
  return <span className={cn('text-xs px-2 py-0.5 rounded font-medium', m.cls)}>{m.label}</span>;
}
