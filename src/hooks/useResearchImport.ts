/**
 * useResearchImport — Kontaktbuch-Import mit Dedupe
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useResearchImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      resultIds,
      duplicatePolicy = 'skip',
    }: {
      orderId: string;
      resultIds: string[];
      duplicatePolicy?: 'skip' | 'update';
    }) => {
      const { data, error } = await supabase.functions.invoke('sot-research-import-contacts', {
        body: {
          order_id: orderId,
          result_ids: resultIds,
          duplicate_policy: duplicatePolicy,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research_results'] });
      queryClient.invalidateQueries({ queryKey: ['research_orders'] });
    },
  });
}
