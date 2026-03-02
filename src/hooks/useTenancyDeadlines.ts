/**
 * Hook: Tenancy Deadline Management
 * CRUD for tenancy_deadlines + deadline checking via ENG-TLC
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkDeadlines } from '@/engines/tenancyLifecycle/engine';
import { DEADLINE_TYPES, type DeadlineType } from '@/engines/tenancyLifecycle/spec';
import { toast } from 'sonner';

export function useTenancyDeadlines(leaseId?: string, propertyId?: string) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tenancy-deadlines', tenantId, leaseId, propertyId],
    queryFn: async () => {
      if (!tenantId) return [];
      let q = supabase
        .from('tenancy_deadlines')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('due_date', { ascending: true });
      if (leaseId) q = q.eq('lease_id', leaseId);
      if (propertyId) q = q.eq('property_id', propertyId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const createDeadline = useMutation({
    mutationFn: async (input: {
      leaseId?: string;
      unitId?: string;
      propertyId?: string;
      deadlineType: DeadlineType;
      title: string;
      description?: string;
      dueDate: string;
      remindDaysBefore?: number;
    }) => {
      if (!tenantId) throw new Error('No tenant');
      const { data, error } = await supabase
        .from('tenancy_deadlines')
        .insert({
          tenant_id: tenantId,
          lease_id: input.leaseId || null,
          unit_id: input.unitId || null,
          property_id: input.propertyId || null,
          deadline_type: input.deadlineType,
          title: input.title,
          description: input.description || null,
          due_date: input.dueDate,
          remind_days_before: input.remindDaysBefore ?? 14,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-deadlines'] });
      toast.success('Frist eingetragen');
    },
    onError: (e) => toast.error(`Fehler: ${e.message}`),
  });

  const completeDeadline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tenancy_deadlines')
        .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-deadlines'] });
      toast.success('Frist als erledigt markiert');
    },
  });

  const dismissDeadline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tenancy_deadlines')
        .update({ status: 'dismissed', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-deadlines'] });
    },
  });

  // Computed: deadline checks
  const today = new Date().toISOString().split('T')[0];
  const deadlineChecks = query.data
    ? checkDeadlines(query.data as any, today)
    : [];

  return {
    deadlines: query.data || [],
    deadlineChecks,
    isLoading: query.isLoading,
    createDeadline,
    completeDeadline,
    dismissDeadline,
    deadlineTypes: DEADLINE_TYPES,
  };
}
