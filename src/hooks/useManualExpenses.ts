/**
 * useManualExpenses — CRUD hook for manual_expenses table (MOD-18)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ManualExpense {
  id: string;
  category: 'miete' | 'unterhalt' | 'sonstige';
  label: string;
  monthly_amount: number;
  notes?: string | null;
}

export function useManualExpenses() {
  const { activeTenantId, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['fb-manual-expenses', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await (supabase as any)
        .from('manual_expenses')
        .select('id, category, label, monthly_amount, notes')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ManualExpense[];
    },
    enabled: !!activeTenantId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['fb-manual-expenses'] });
  };

  const createExpense = useMutation({
    mutationFn: async (input: { category: string; label: string; monthly_amount: number; notes?: string }) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { error } = await (supabase as any).from('manual_expenses').insert({
        tenant_id: activeTenantId,
        user_id: user.id,
        ...input,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateExpense = useMutation({
    mutationFn: async (input: { id: string; label?: string; monthly_amount?: number; category?: string; notes?: string }) => {
      const { id, ...rest } = input;
      const { error } = await (supabase as any).from('manual_expenses').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('manual_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { expenses, isLoading, createExpense, updateExpense, deleteExpense };
}
