/**
 * Hook: Rent Reduction (Mietminderung) Management
 * CRUD for tenancy_rent_reductions + calculation via ENG-TLC
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculateRentReduction, suggestRentReduction } from '@/engines/tenancyLifecycle/engine';
import { RENT_REDUCTION_GUIDELINES } from '@/engines/tenancyLifecycle/spec';
import { toast } from 'sonner';

export function useRentReductions(leaseId?: string) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tenancy-rent-reductions', tenantId, leaseId],
    queryFn: async () => {
      if (!tenantId) return [];
      let q = supabase
        .from('tenancy_rent_reductions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('effective_from', { ascending: false });
      if (leaseId) q = q.eq('lease_id', leaseId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const createReduction = useMutation({
    mutationFn: async (input: {
      leaseId: string;
      unitId?: string;
      taskId?: string;
      reason: string;
      reductionPercent: number;
      effectiveFrom: string;
      effectiveUntil?: string;
      legalBasis?: string;
      notes?: string;
    }) => {
      if (!tenantId) throw new Error('No tenant');
      const { data, error } = await supabase
        .from('tenancy_rent_reductions')
        .insert({
          tenant_id: tenantId,
          lease_id: input.leaseId,
          unit_id: input.unitId || null,
          task_id: input.taskId || null,
          reason: input.reason,
          reduction_percent: input.reductionPercent,
          effective_from: input.effectiveFrom,
          effective_until: input.effectiveUntil || null,
          legal_basis: input.legalBasis || null,
          notes: input.notes || null,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-rent-reductions'] });
      toast.success('Mietminderung eingetragen');
    },
    onError: (e) => toast.error(`Fehler: ${e.message}`),
  });

  const resolveReduction = useMutation({
    mutationFn: async ({ id, effectiveUntil }: { id: string; effectiveUntil: string }) => {
      const { error } = await supabase
        .from('tenancy_rent_reductions')
        .update({ status: 'resolved', effective_until: effectiveUntil, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-rent-reductions'] });
      toast.success('Mietminderung aufgehoben');
    },
  });

  return {
    reductions: query.data || [],
    isLoading: query.isLoading,
    createReduction,
    resolveReduction,
    calculateImpact: calculateRentReduction,
    suggestReduction: suggestRentReduction,
    guidelines: RENT_REDUCTION_GUIDELINES,
  };
}
