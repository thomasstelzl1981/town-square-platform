/**
 * Zone 1 — Website Hosting Dashboard (Admin)
 * Manages all hosting contracts, suspension, and credit monitoring
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { TYPOGRAPHY, CARD, SPACING } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Ban, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function WebHostingDashboard() {
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

      if (filter !== 'all') {
        q = q.eq('status', filter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

  const suspend = useMutation({
    mutationFn: async ({ contractId, websiteId, reason }: { contractId: string; websiteId: string; reason: string }) => {
      const { error: cErr } = await supabase
        .from('hosting_contracts' as any)
        .update({ status: 'suspended' })
        .eq('id', contractId);
      if (cErr) throw cErr;

      const { error: wErr } = await supabase
        .from('tenant_websites' as any)
        .update({ status: 'suspended' })
        .eq('id', websiteId);
      if (wErr) throw wErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_hosting_contracts'] });
      toast.success('Website suspendiert');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reactivate = useMutation({
    mutationFn: async ({ contractId, websiteId }: { contractId: string; websiteId: string }) => {
      const { error: cErr } = await supabase
        .from('hosting_contracts' as any)
        .update({ status: 'active' })
        .eq('id', contractId);
      if (cErr) throw cErr;

      const { error: wErr } = await supabase
        .from('tenant_websites' as any)
        .update({ status: 'published' })
        .eq('id', websiteId);
      if (wErr) throw wErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_hosting_contracts'] });
      toast.success('Website reaktiviert');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = contracts?.filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.tenant_websites?.name?.toLowerCase().includes(s) ||
      c.organizations?.name?.toLowerCase().includes(s)
    );
  });

  const stats = {
    total: contracts?.length || 0,
    active: contracts?.filter((c: any) => c.status === 'active').length || 0,
    suspended: contracts?.filter((c: any) => c.status === 'suspended').length || 0,
    totalCredits: contracts?.reduce((sum: number, c: any) => sum + (c.credits_charged || 0), 0) || 0,
  };

  return (
    <PageShell>
      <h2 className={TYPOGRAPHY.PAGE_TITLE}>Website Hosting</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={Globe} label="Gesamt" value={stats.total} />
        <KpiCard icon={CheckCircle} label="Aktiv" value={stats.active} color="text-emerald-600" />
        <KpiCard icon={Ban} label="Suspendiert" value={stats.suspended} color="text-destructive" />
        <KpiCard icon={AlertTriangle} label="Credits verbraucht" value={stats.totalCredits} />
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'active', 'suspended', 'pending'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
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
                  <td className="py-2.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{c.credits_charged || 0}</td>
                  <td className="py-2.5 text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="py-2.5 text-right">
                    {c.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => suspend.mutate({
                          contractId: c.id,
                          websiteId: c.website_id,
                          reason: 'Admin suspension',
                        })}
                        disabled={suspend.isPending}
                      >
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        Sperren
                      </Button>
                    )}
                    {c.status === 'suspended' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reactivate.mutate({
                          contractId: c.id,
                          websiteId: c.website_id,
                        })}
                        disabled={reactivate.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Freigeben
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}

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
