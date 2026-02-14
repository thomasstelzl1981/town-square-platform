/**
 * useSoatSearchEngine — CRUD + Realtime for soat_search_orders & soat_search_results
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface SoatSearchOrder {
  id: string;
  created_by: string | null;
  org_unit_id: string | null;
  title: string | null;
  intent: string | null;
  target_count: number;
  status: string;
  phase: string | null;
  progress_percent: number;
  counters_json: Record<string, number> | null;
  provider_plan_json: Record<string, any> | null;
  started_at: string | null;
  finished_at: string | null;
  last_heartbeat_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SoatSearchResult {
  id: string;
  order_id: string;
  entity_type: string;
  company_name: string | null;
  category: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  contact_person_name: string | null;
  contact_person_role: string | null;
  source_refs_json: any;
  confidence_score: number;
  validation_state: string;
  suppression_reason: string | null;
  created_at: string;
}

const ORDERS_KEY = ['soat-search-orders'];
const resultsKey = (orderId: string) => ['soat-search-results', orderId];

export function useSoatOrders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ORDERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soat_search_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SoatSearchOrder[];
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('soat_orders_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'soat_search_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useSoatResults(orderId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: resultsKey(orderId || ''),
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soat_search_results')
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SoatSearchResult[];
    },
  });

  // Realtime for live results
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`soat_results_${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'soat_search_results',
        filter: `order_id=eq.${orderId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: resultsKey(orderId) });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, queryClient]);

  return query;
}

export function useCreateSoatOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; intent: string; target_count: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: order, error } = await supabase
        .from('soat_search_orders')
        .insert({
          created_by: user?.id || null,
          title: data.title,
          intent: data.intent,
          target_count: data.target_count,
          status: 'draft',
          phase: null,
          progress_percent: 0,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return order as unknown as SoatSearchOrder;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useStartSoatOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Set to queued
      const { error } = await supabase
        .from('soat_search_orders')
        .update({ status: 'queued', phase: 'strategy', progress_percent: 0 } as any)
        .eq('id', orderId);
      if (error) throw error;

      // Trigger orchestrator
      const { error: fnError } = await supabase.functions.invoke('sot-research-engine', {
        body: {
          intent: 'find_contacts',
          query: 'SOAT Recherche',
          context: { module: 'soat_search', reference_id: orderId },
        },
      });
      if (fnError) throw new Error(fnError.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useCancelSoatOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('soat_search_orders')
        .update({ status: 'cancelled' } as any)
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useUpdateSoatResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orderId, ...updates }: { id: string; orderId: string; validation_state?: string; suppression_reason?: string }) => {
      const { error } = await supabase
        .from('soat_search_results')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
      return orderId;
    },
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: resultsKey(orderId) });
    },
  });
}
