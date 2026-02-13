/**
 * useResearchResults — Results for a specific research order + Realtime
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface ResearchResult {
  id: string;
  order_id: string;
  tenant_id: string;
  entity_type: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  seniority: string | null;
  company_name: string | null;
  domain: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  source_provider: string;
  source_refs_json: any;
  confidence_score: number;
  raw_json: any;
  status: string;
  imported_contact_id: string | null;
  created_at: string;
}

export function useResearchResults(orderId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['research_results', orderId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from('research_order_results')
        .select('*')
        .eq('order_id', orderId)
        .order('confidence_score', { ascending: false });
      if (error) throw error;
      return data as unknown as ResearchResult[];
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`research_results_${orderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'research_order_results',
        filter: `order_id=eq.${orderId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, queryClient]);

  return query;
}
