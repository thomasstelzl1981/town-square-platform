/**
 * useResearchOrders — CRUD + Realtime for research_orders
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface ResearchOrder {
  id: string;
  tenant_id: string;
  created_by: string;
  title: string | null;
  intent_text: string;
  icp_json: any;
  output_type: string;
  provider_plan_json: any;
  max_results: number;
  cost_estimate: number;
  cost_cap: number;
  cost_spent: number;
  status: string;
  results_count: number;
  consent_confirmed: boolean;
  ai_summary_md: string | null;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = ['research_orders'];

export function useResearchOrders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ResearchOrder[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('research_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'research_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useCreateResearchOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { tenant_id: string; created_by: string; title?: string }) => {
      const { data: order, error } = await supabase
        .from('research_orders')
        .insert({
          tenant_id: data.tenant_id,
          created_by: data.created_by,
          title: data.title || 'Neuer Rechercheauftrag',
          intent_text: '',
          status: 'draft',
        } as any)
        .select()
        .single();
      if (error) throw error;
      return order as unknown as ResearchOrder;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateResearchOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ResearchOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from('research_orders')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ResearchOrder;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useStartResearchOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // First set to queued
      const { error: updateError } = await supabase
        .from('research_orders')
        .update({ status: 'queued' } as any)
        .eq('id', orderId);
      if (updateError) throw updateError;

      // Trigger the research engine as orchestrator
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('sot-research-engine', {
        body: { 
          intent: 'find_contacts',
          query: 'Recherche',
          context: { module: 'recherche', reference_id: orderId },
        },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
