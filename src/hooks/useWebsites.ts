/**
 * useWebsites — CRUD hook for tenant_websites
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useWebsites() {
  const { activeTenantId, user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['tenant_websites', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_websites' as any)
        .select('*')
        .eq('tenant_id', activeTenantId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!activeTenantId,
  });

  const createWebsite = useMutation({
    mutationFn: async (input: { name: string; slug: string; industry?: string; target_audience?: string; goal?: string; branding_json?: any }) => {
      const { data, error } = await supabase
        .from('tenant_websites' as any)
        .insert({
          tenant_id: activeTenantId!,
          created_by: user!.id,
          ...input,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant_websites'] });
      toast.success('Website erstellt');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, createWebsite };
}

export function useWebsite(websiteId: string | undefined) {
  return useQuery({
    queryKey: ['tenant_website', websiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_websites' as any)
        .select('*')
        .eq('id', websiteId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!websiteId,
  });
}
