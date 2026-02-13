/**
 * useResearchAI — KI-Assist-Aktionen für Recherche
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useResearchAI() {
  const suggestFilters = useMutation({
    mutationFn: async (intentText: string) => {
      const { data, error } = await supabase.functions.invoke('sot-research-ai-assist', {
        body: { action: 'suggest_filters', intent_text: intentText },
      });
      if (error) throw error;
      return data;
    },
  });

  const optimizePlan = useMutation({
    mutationFn: async ({ intentText, icpJson }: { intentText: string; icpJson: any }) => {
      const { data, error } = await supabase.functions.invoke('sot-research-ai-assist', {
        body: { action: 'optimize_plan', intent_text: intentText, icp_json: icpJson },
      });
      if (error) throw error;
      return data;
    },
  });

  const scoreResults = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-research-ai-assist', {
        body: { action: 'score_results', order_id: orderId },
      });
      if (error) throw error;
      return data;
    },
  });

  const summarize = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-research-ai-assist', {
        body: { action: 'summarize', order_id: orderId },
      });
      if (error) throw error;
      return data;
    },
  });

  return { suggestFilters, optimizePlan, scoreResults, summarize };
}
