/**
 * useSalesCases — Hook for Zone 1 Sales Desk to fetch SLC data
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isStuck } from '@/engines/slc/engine';
import type { SLCPhase } from '@/engines/slc/spec';
import { SLC_STUCK_THRESHOLDS } from '@/engines/slc/spec';

export interface SalesCaseRow {
  id: string;
  asset_type: string;
  asset_id: string;
  property_id: string | null;
  project_id: string | null;
  listing_id: string | null;
  current_phase: SLCPhase;
  deal_contact_id: string | null;
  tenant_id: string;
  opened_at: string;
  closed_at: string | null;
  close_reason: string | null;
  updated_at: string;
  // joined
  property?: { code: string | null; address: string | null; city: string | null } | null;
  tenant?: { name: string | null } | null;
  contact?: { first_name: string | null; last_name: string | null } | null;
}

export function useSalesCases() {
  return useQuery({
    queryKey: ['sales-desk-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_cases')
        .select(`
          id, asset_type, asset_id, property_id, project_id, listing_id,
          current_phase, deal_contact_id, tenant_id,
          opened_at, closed_at, close_reason, updated_at,
          property:properties(code, address, city),
          tenant:organizations!sales_cases_tenant_id_fkey(name),
          contact:contacts!sales_cases_deal_contact_id_fkey(first_name, last_name)
        `)
        .is('closed_at', null)
        .order('opened_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SalesCaseRow[];
    },
  });
}

export function useSalesCaseEvents(caseId: string | null) {
  return useQuery({
    queryKey: ['sales-desk-case-events', caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_lifecycle_events')
        .select('*')
        .eq('case_id', caseId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRecentSLCEvents() {
  return useQuery({
    queryKey: ['sales-desk-recent-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_lifecycle_events')
        .select(`
          id, case_id, event_type, severity, phase_before, phase_after,
          actor_id, payload, tenant_id, created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });
}

/** Derive KPIs from cases */
export function useSLCKpis() {
  const { data: cases } = useSalesCases();

  const openCases = cases?.length || 0;
  const stuckCases = cases?.filter(c => {
    const threshold = SLC_STUCK_THRESHOLDS[c.current_phase];
    if (!threshold) return false;
    return isStuck(c.current_phase, c.updated_at, new Date());
  }).length || 0;

  const phaseDistribution = (cases || []).reduce<Record<string, number>>((acc, c) => {
    acc[c.current_phase] = (acc[c.current_phase] || 0) + 1;
    return acc;
  }, {});

  return { openCases, stuckCases, phaseDistribution, cases };
}
