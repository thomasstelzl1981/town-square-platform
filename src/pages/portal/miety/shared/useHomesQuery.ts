import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';

export function useHomesQuery() {
  const { activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-ZUHAUSE');

  return useQuery({
    queryKey: ['miety-homes', activeTenantId, demoEnabled],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('miety_homes')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const all = data || [];
      return demoEnabled ? all : all.filter((h: any) => !isDemoId(h.id));
    },
    enabled: !!activeTenantId,
  });
}
