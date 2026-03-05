/**
 * LeadManagerKampagnen — Campaign cockpit (MOD-10)
 * Orchestrator: delegates to KampagnenKPIs, KampagnenCampaignList, KampagnenCreator, KampagnenLeadInbox
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { KampagnenKPIs, KampagnenLeadInbox, KampagnenCampaignList, KampagnenCreator } from '@/components/leads/kampagnen';
import { toast } from 'sonner';

interface LeadManagerKampagnenProps {
  contextMode?: 'brand' | 'project' | 'all';
  projectFilter?: string;
}

export default function LeadManagerKampagnen({ contextMode = 'all', projectFilter }: LeadManagerKampagnenProps) {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  const [brandFilter, setBrandFilter] = useState('all');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  // ── Data queries ──
  const { data: campaignData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['lead-manager-campaigns', activeTenantId, user?.id, brandFilter, projectFilter],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return { mandates: [], totalSpend: 0, leadCount: 0, activeCampaigns: 0 };
      let q = supabase.from('social_mandates').select('*').eq('tenant_id', activeTenantId).eq('partner_user_id', user.id).order('created_at', { ascending: false });
      if (brandFilter !== 'all') q = q.eq('brand_context', brandFilter);
      if (projectFilter) q = q.eq('project_id', projectFilter);
      const { data: mandates } = await q;
      const list = mandates || [];
      const totalSpend = list.reduce((s, m) => s + (m.budget_total_cents || 0), 0);
      const activeCampaigns = list.filter(m => m.status === 'live' || m.status === 'submitted').length;
      let lq = supabase.from('social_leads').select('id', { count: 'exact', head: true }).eq('tenant_id', activeTenantId).eq('partner_user_id', user.id);
      if (brandFilter !== 'all') lq = lq.eq('brand_context', brandFilter);
      const { count } = await lq;
      return { mandates: list, totalSpend, leadCount: count || 0, activeCampaigns };
    },
    enabled: !!activeTenantId && !!user?.id,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['lead-manager-leads', activeTenantId, user?.id, leadStatusFilter, projectFilter],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return [];
      let q = supabase.from('social_leads').select('*').eq('tenant_id', activeTenantId).eq('partner_user_id', user.id).order('created_at', { ascending: false });
      if (leadStatusFilter !== 'all') q = q.eq('lead_status', leadStatusFilter);
      const { data } = await q;
      return data || [];
    },
    enabled: !!activeTenantId && !!user?.id,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('social_leads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lead-manager-leads'] }); toast.success('Lead aktualisiert'); },
  });

  return (
    <PageShell>
      <ModulePageHeader title="KAMPAGNEN" description="Kampagnen erstellen, buchen und Leads verwalten." actions={undefined} />
      <div className="space-y-8">
        <KampagnenKPIs
          totalSpend={campaignData?.totalSpend || 0}
          totalLeads={campaignData?.leadCount || 0}
          activeCampaigns={campaignData?.activeCampaigns || 0}
          isLoading={campaignsLoading}
          brandFilter={brandFilter}
          onBrandFilterChange={setBrandFilter}
          showBrandFilter={contextMode !== 'project'}
        />
        <KampagnenCampaignList
          mandates={campaignData?.mandates}
          isLoading={campaignsLoading}
          expandedId={expandedCampaignId}
          onToggleExpand={(id) => setExpandedCampaignId(expandedCampaignId === id ? null : id)}
        />
        <KampagnenCreator />
        <KampagnenLeadInbox
          leads={leads}
          isLoading={leadsLoading}
          statusFilter={leadStatusFilter}
          onStatusFilterChange={setLeadStatusFilter}
        />
      </div>
    </PageShell>
  );
}
