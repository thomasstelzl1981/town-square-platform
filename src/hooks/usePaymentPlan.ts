/**
 * Hook: Payment Plan (Ratenplan) Management
 * CRUD for tenancy_payment_plans + schedule generation via ENG-TLC
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generatePaymentPlanSchedule, checkPaymentPlanCompliance } from '@/engines/tenancyLifecycle/engine';
import type { PaymentPlanSchedule } from '@/engines/tenancyLifecycle/spec';
import { toast } from 'sonner';

export function usePaymentPlans(leaseId?: string) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tenancy-payment-plans', tenantId, leaseId],
    queryFn: async () => {
      if (!tenantId) return [];
      let q = supabase
        .from('tenancy_payment_plans')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (leaseId) q = q.eq('lease_id', leaseId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const createPlan = useMutation({
    mutationFn: async (plan: {
      leaseId: string;
      unitId?: string;
      totalArrears: number;
      monthlyInstallment: number;
      installmentsCount: number;
      startDate: string;
      notes?: string;
    }) => {
      if (!tenantId) throw new Error('No tenant');
      const { data, error } = await supabase
        .from('tenancy_payment_plans')
        .insert({
          tenant_id: tenantId,
          lease_id: plan.leaseId,
          unit_id: plan.unitId || null,
          total_arrears_eur: plan.totalArrears,
          monthly_installment_eur: plan.monthlyInstallment,
          installments_count: plan.installmentsCount,
          start_date: plan.startDate,
          notes: plan.notes || null,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-payment-plans'] });
      toast.success('Ratenplan erstellt');
    },
    onError: (e) => toast.error(`Fehler: ${e.message}`),
  });

  const updatePlanStatus = useMutation({
    mutationFn: async ({ planId, status, installmentsPaid }: { planId: string; status?: string; installmentsPaid?: number }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (installmentsPaid !== undefined) updates.installments_paid = installmentsPaid;
      const { error } = await supabase
        .from('tenancy_payment_plans')
        .update(updates)
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-payment-plans'] });
      toast.success('Ratenplan aktualisiert');
    },
  });

  return {
    plans: query.data || [],
    isLoading: query.isLoading,
    createPlan,
    updatePlanStatus,
    generateSchedule: generatePaymentPlanSchedule,
    checkCompliance: checkPaymentPlanCompliance,
  };
}
