/**
 * useHostingContract — Hook for hosting contract management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useHostingContract(websiteId: string | undefined) {
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['hosting_contract', websiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosting_contracts' as any)
        .select('*')
        .eq('website_id', websiteId!)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    },
    enabled: !!websiteId,
  });

  const createContract = useMutation({
    mutationFn: async (input: { accepted_terms: boolean; content_responsibility: boolean }) => {
      if (!input.accepted_terms || !input.content_responsibility) {
        throw new Error('Bitte akzeptieren Sie alle Bedingungen');
      }
      const { data, error } = await supabase
        .from('hosting_contracts' as any)
        .insert({
          tenant_id: activeTenantId!,
          website_id: websiteId!,
          accepted_terms_at: new Date().toISOString(),
          content_responsibility_confirmed: true,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosting_contract', websiteId] });
      toast.success('Hosting-Vertrag erstellt');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, createContract, isActive: query.data?.status === 'active' };
}
