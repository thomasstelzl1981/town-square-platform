/**
 * useDeskContacts — Desk-scoped CRUD + Realtime for contact_staging & soat_search_orders/results
 * Generalizes useSoatSearchEngine with a mandatory `desk` filter.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import type { SoatSearchOrder, SoatSearchResult } from './useSoatSearchEngine';

/* ─── Re-export types ─── */
export type { SoatSearchOrder, SoatSearchResult };

export interface StagedContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  source: string;
  status: string;
  mandate_id: string | null;
  desk: string | null;
  created_at: string;
}

/* ─── Desk-scoped contacts ─── */

const contactsKey = (desk: string) => ['desk-contacts', desk];

export function useDeskContacts(desk: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: contactsKey(desk),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_staging')
        .select('id, first_name, last_name, email, company_name, source, status, mandate_id, desk, created_at')
        .eq('desk', desk)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as StagedContact[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`desk_contacts_${desk}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_staging' }, () => {
        queryClient.invalidateQueries({ queryKey: contactsKey(desk) });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [desk, queryClient]);

  return query;
}

/* ─── Desk-scoped SOAT orders ─── */

const ordersKey = (desk: string) => ['desk-soat-orders', desk];
const resultsKey = (orderId: string) => ['soat-search-results', orderId];

export function useDeskSoatOrders(desk: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ordersKey(desk),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soat_search_orders')
        .select('*')
        .eq('desk', desk)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SoatSearchOrder[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`desk_orders_${desk}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'soat_search_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ordersKey(desk) });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [desk, queryClient]);

  return query;
}

export function useDeskSoatResults(orderId: string | null) {
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

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`desk_results_${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'soat_search_results',
        filter: `order_id=eq.${orderId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: resultsKey(orderId) });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, queryClient]);

  return query;
}

export function useCreateDeskSoatOrder(desk: string) {
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
          desk,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return order as unknown as SoatSearchOrder;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersKey(desk) }),
  });
}

export function useStartDeskSoatOrder(desk: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('soat_search_orders')
        .update({ status: 'queued', phase: 'strategy', progress_percent: 0 } as any)
        .eq('id', orderId);
      if (error) throw error;

      const { error: fnError } = await supabase.functions.invoke('sot-research-engine', {
        body: {
          intent: 'find_contacts',
          query: 'SOAT Recherche',
          max_results: 25,
          context: { module: 'soat_search', reference_id: orderId },
        },
      });
      if (fnError) throw new Error(fnError.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersKey(desk) }),
  });
}

export function useAdoptSoatResult(desk: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (result: SoatSearchResult) => {
  const firstName = result.first_name || result.contact_person_name?.split(' ')[0] || null;
      const lastName = result.last_name || result.contact_person_name?.split(' ').slice(1).join(' ') || null;
      const { error } = await supabase.from('contact_staging').insert({
        salutation: (result as any).salutation || null,
        first_name: firstName,
        last_name: lastName,
        email: result.email,
        company_name: result.company_name,
        category: (result as any).category || null,
        source: 'soat',
        status: 'pending',
        desk,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKey(desk) });
    },
  });
}
