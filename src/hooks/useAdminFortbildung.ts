import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FortbildungTab, FortbildungTopic } from '@/services/fortbildung/types';

const QUERY_KEY = 'admin-fortbildung-items';

export function useAdminFortbildungItems(tab: FortbildungTab, topic?: FortbildungTopic) {
  return useQuery({
    queryKey: [QUERY_KEY, tab, topic],
    queryFn: async () => {
      let q = supabase
        .from('fortbildung_curated_items')
        .select('*')
        .eq('tab', tab)
        .order('sort_order', { ascending: true });
      if (topic) q = q.eq('topic', topic);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFortbildungItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('fortbildung_curated_items')
        .insert(item as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateFortbildungItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('fortbildung_curated_items')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteFortbildungItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fortbildung_curated_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useReorderFortbildungItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const promises = items.map(({ id, sort_order }) =>
        supabase
          .from('fortbildung_curated_items')
          .update({ sort_order } as any)
          .eq('id', id)
      );
      const results = await Promise.all(promises);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
