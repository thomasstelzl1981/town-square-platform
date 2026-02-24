/**
 * useSoatSearchEngine — CRUD + Realtime for soat_search_orders & soat_search_results
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { normalizeContact, calcConfidence, applyQualityGate } from '@/engines/marketDirectory/engine';

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
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
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
    mutationFn: async (data: { title: string; intent: string; target_count: number; desk?: string }) => {
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
          ...(data.desk ? { desk: data.desk } : {}),
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
      // 1. Load order to get real params
      const { data: order, error: orderErr } = await supabase
        .from('soat_search_orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (orderErr || !order) throw new Error('Auftrag nicht gefunden');

      const typedOrder = order as unknown as SoatSearchOrder;

      // 2. Parse intent: "Suchbegriff, Region, Kategorie"
      const intentParts = (typedOrder.intent || '').split(',').map(s => s.trim());
      const query = intentParts[0] || typedOrder.title || 'Recherche';
      const location = intentParts[1] || 'Deutschland';
      const maxResults = typedOrder.target_count || 25;

      // 3. Set to queued + strategy phase
      const updatePhase = async (phase: string, progress: number, status = 'running') => {
        await supabase
          .from('soat_search_orders')
          .update({ status, phase, progress_percent: progress } as any)
          .eq('id', orderId);
      };

      await updatePhase('strategy', 5, 'queued');

      try {
        // 4. Call orchestrator with real params
        await updatePhase('discovery', 15);

        const { data, error: fnError } = await supabase.functions.invoke('sot-research-engine', {
          body: {
            intent: 'find_contacts',
            query,
            location,
            max_results: maxResults,
            context: { module: 'soat_search', reference_id: orderId },
          },
        });
        if (fnError) throw new Error(fnError.message);

        await updatePhase('extract', 50);

        // 5. Process & persist results
        const rawResults: any[] = data?.results || data?.data?.results || [];

        if (rawResults.length > 0) {
          const rows = rawResults.map((r: any) => {
            // Apply engine normalization
            const normResult = normalizeContact({
              salutation: r.salutation,
              first_name: r.first_name || r.firstName,
              last_name: r.last_name || r.lastName,
              company_name: r.name || r.company_name || r.company,
              contact_person_name: r.contact_person || r.full_name,
              phone: r.phone || r.telephone,
              email: r.email,
              website_url: r.website || r.website_url,
              address_line: r.address || r.address_line,
              postal_code: r.postal_code,
              city: r.city,
            });
            const n = normResult.normalized;

            // Calc confidence
            const conf = calcConfidence(n, Array.isArray(r.sources) ? r.sources.length : 1);

            return {
              order_id: orderId,
              entity_type: r.entity_type || 'company',
              company_name: n.company || r.name || null,
              category: r.category || null,
              address_line: n.street || r.address || null,
              postal_code: n.postalCode || null,
              city: n.city || null,
              country: r.country || 'DE',
              phone: n.phoneE164 || null,
              email: n.email || null,
              website_url: r.website || r.website_url || null,
              salutation: n.salutation || null,
              first_name: n.firstName || null,
              last_name: n.lastName || null,
              contact_person_name: r.contact_person || r.full_name || null,
              contact_person_role: r.role || null,
              source_refs_json: r.sources || r.source_refs_json || null,
              confidence_score: Math.round(conf.score * 100),
              validation_state: applyQualityGate(conf.score),
            };
          });

          // Insert in batches of 50
          for (let i = 0; i < rows.length; i += 50) {
            const batch = rows.slice(i, i + 50);
            const { error: insertErr } = await supabase
              .from('soat_search_results')
              .insert(batch as any);
            if (insertErr) console.error('Batch insert error:', insertErr.message);
          }
        }

        // 6. Done
        await updatePhase('finalize', 100, 'done');
        await supabase
          .from('soat_search_orders')
          .update({
            finished_at: new Date().toISOString(),
            counters_json: { total: rawResults.length },
          } as any)
          .eq('id', orderId);

      } catch (err) {
        // Mark order as failed
        const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
        await supabase
          .from('soat_search_orders')
          .update({ status: 'failed', error_message: msg } as any)
          .eq('id', orderId);
        throw err;
      }
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

export function useDeleteSoatOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error: resErr } = await supabase
        .from('soat_search_results')
        .delete()
        .eq('order_id', orderId);
      if (resErr) throw resErr;
      const { error: ordErr } = await supabase
        .from('soat_search_orders')
        .delete()
        .eq('id', orderId);
      if (ordErr) throw ordErr;
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
