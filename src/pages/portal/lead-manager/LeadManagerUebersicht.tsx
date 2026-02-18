/**
 * Lead Manager — Übersicht Tab (MOD-10)
 * KPIs, Brand-Filter, letzte Leads, CTA Neue Kampagne
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, Users, TrendingUp, CreditCard, Plus, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { DESIGN } from '@/config/designManifest';
import { useState } from 'react';

const BRANDS = [
  { key: 'all', label: 'Alle' },
  { key: 'futureroom', label: 'FutureRoom' },
  { key: 'kaufy', label: 'Kaufy' },
  { key: 'lennox_friends', label: 'Lennox & Friends' },
  { key: 'acquiary', label: 'Acquiary' },
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
}

export default function LeadManagerUebersicht() {
  const { user, activeTenantId } = useAuth();
  const navigate = useNavigate();
  const [brandFilter, setBrandFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['lead-manager-overview', activeTenantId, user?.id, brandFilter],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return null;

      // Mandates (campaigns)
      let mandateQuery = supabase
        .from('social_mandates')
        .select('id, status, budget_total_cents, brand_context, created_at')
        .eq('tenant_id', activeTenantId)
        .eq('partner_user_id', user.id);
      if (brandFilter !== 'all') mandateQuery = mandateQuery.eq('brand_context', brandFilter);
      const { data: mandates } = await mandateQuery;

      // Leads
      let leadsQuery = supabase
        .from('social_leads')
        .select('id, lead_status, brand_context, created_at, lead_data')
        .eq('tenant_id', activeTenantId)
        .eq('partner_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (brandFilter !== 'all') leadsQuery = leadsQuery.eq('brand_context', brandFilter);
      const { data: leads } = await leadsQuery;

      const totalSpend = (mandates || []).reduce((s, m) => s + (m.budget_total_cents || 0), 0);
      const leadCount = leads?.length || 0;
      const activeCampaigns = (mandates || []).filter(m => m.status === 'live' || m.status === 'submitted').length;

      return {
        totalSpend,
        leadCount,
        cpl: leadCount > 0 ? Math.round(totalSpend / leadCount) : 0,
        activeCampaigns,
        recentLeads: leads || [],
      };
    },
    enabled: !!activeTenantId && !!user?.id,
  });

  const kpis = [
    { label: 'Gesamtausgaben', value: data ? formatCurrency(data.totalSpend) : '–', icon: CreditCard, color: 'text-primary' },
    { label: 'Leads generiert', value: data ? `${data.leadCount}` : '–', icon: Users, color: 'text-green-500' },
    { label: 'CPL', value: data ? formatCurrency(data.cpl) : '–', icon: TrendingUp, color: 'text-amber-500' },
    { label: 'Aktive Kampagnen', value: data ? `${data.activeCampaigns}` : '–', icon: Megaphone, color: 'text-primary' },
  ];

  return (
    <PageShell>
      <ModulePageHeader
        title="LEAD MANAGER"
        description="Self-Serve Werbeschaltung — Kampagnen, Leads & Performance"
        actions={
          <Button onClick={() => navigate('/portal/lead-manager/studio/planen')} className="gap-2">
            <Plus className="h-4 w-4" /> Neue Kampagne
          </Button>
        }
      />

      {/* Brand Filter */}
      <div className="flex flex-wrap gap-2">
        {BRANDS.map(b => (
          <Badge
            key={b.key}
            variant={brandFilter === b.key ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setBrandFilter(b.key)}
          >
            {b.label}
          </Badge>
        ))}
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className={DESIGN.KPI_GRID.FULL}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className={DESIGN.KPI_GRID.FULL}>
          {kpis.map(kpi => (
            <Card key={kpi.label} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Leads */}
      {data && data.recentLeads.length > 0 ? (
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-medium">Letzte Leads</p>
            {data.recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{(lead.lead_data as any)?.name || 'Unbekannt'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString('de-DE')}</p>
                </div>
                <Badge variant="outline">{lead.lead_status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <EmptyState
              icon={Inbox}
              title="Noch keine Leads"
              description="Starte deine erste Kampagne, um automatisch Leads zu generieren."
              action={{
                label: 'Erste Kampagne planen',
                onClick: () => navigate('/portal/lead-manager/studio/planen'),
              }}
            />
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}
