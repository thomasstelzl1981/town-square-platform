/**
 * useZone3Settings — Read/write zone3_website_settings (Key-Value Store)
 * Used by Zone 1 Admin to toggle settings, and Zone 3 Layouts to read them.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const QUERY_KEY = 'zone3-website-settings';

export function useZone3Setting(key: string) {
  return useQuery({
    queryKey: [QUERY_KEY, key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zone3_website_settings' as any)
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return (data as any)?.value as string | null;
    },
    staleTime: 30_000, // 30s cache
  });
}

export function useUpdateZone3Setting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('zone3_website_settings' as any)
        .update({ value, updated_at: new Date().toISOString() } as any)
        .eq('key', key);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.key] });
    },
  });
}
