/**
 * useIsModuleActive — Check if a specific module tile is active for the current tenant
 * Shared hook, not module-specific.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsModuleActive(tileCode: string) {
  const { activeTenantId } = useAuth();

  return useQuery({
    queryKey: ['tile-active', activeTenantId, tileCode],
    queryFn: async () => {
      if (!activeTenantId) return false;
      const { count } = await supabase
        .from('tenant_tile_activation')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', activeTenantId)
        .eq('tile_code', tileCode)
        .eq('status', 'active');
      return (count ?? 0) > 0;
    },
    enabled: !!activeTenantId && !!tileCode,
    staleTime: 5 * 60 * 1000,
  });
}
