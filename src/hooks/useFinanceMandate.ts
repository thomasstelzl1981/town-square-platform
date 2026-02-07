import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FinanceMandate, MandateStatus, FutureRoomCase } from '@/types/finance';

// Fetch all mandates for Zone 1 Admin
export function useFinanceMandates() {
  const { isPlatformAdmin } = useAuth();

  return useQuery({
    queryKey: ['finance-mandates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_mandates')
        .select(`
          *,
          finance_requests (
            id,
            public_id,
            status,
            created_at,
            object_address,
            property_id,
            applicant_profiles (
              id,
              first_name,
              last_name,
              profile_type,
              completion_score,
              purchase_price,
              loan_amount_requested
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isPlatformAdmin,
  });
}

// Fetch single mandate with full details
export function useFinanceMandate(mandateId: string | undefined) {
  return useQuery({
    queryKey: ['finance-mandate', mandateId],
    queryFn: async () => {
      if (!mandateId) return null;

      const { data, error } = await supabase
        .from('finance_mandates')
        .select(`
          *,
          finance_requests (
            *,
            applicant_profiles (*),
            properties (*)
          )
        `)
        .eq('id', mandateId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!mandateId,
  });
}

// Update mandate status
export function useUpdateMandateStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      mandateId, 
      status, 
      notes 
    }: { 
      mandateId: string; 
      status: MandateStatus;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('finance_mandates')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-mandates'] });
      queryClient.invalidateQueries({ queryKey: ['finance-mandate'] });
      toast.success('Status aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

// Delegate mandate to finance manager
export function useDelegateMandate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      mandateId, 
      managerId 
    }: { 
      mandateId: string; 
      managerId: string;
    }) => {
      // Update mandate
      const { error: mandateError } = await supabase
        .from('finance_mandates')
        .update({
          status: 'delegated' as MandateStatus,
          assigned_manager_id: managerId,
          delegated_at: new Date().toISOString(),
          delegated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (mandateError) throw mandateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-mandates'] });
      queryClient.invalidateQueries({ queryKey: ['finance-mandate'] });
      toast.success('Mandat zugewiesen');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

// Accept mandate (creates FutureRoom case + triggers notification)
export function useAcceptMandate() {
  const queryClient = useQueryClient();
  const { activeOrganization, user } = useAuth();

  return useMutation({
    mutationFn: async (mandateId: string) => {
      const managerId = user?.id;
      if (!managerId) throw new Error('User not authenticated');

      // Update mandate status
      const { error: mandateError } = await supabase
        .from('finance_mandates')
        .update({
          status: 'accepted' as MandateStatus,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (mandateError) throw mandateError;

      // Create FutureRoom case
      const tenantId = activeOrganization?.id || 'dev-tenant';
      const { error: caseError } = await supabase
        .from('future_room_cases')
        .insert([{
          manager_tenant_id: tenantId,
          finance_mandate_id: mandateId,
          status: 'active',
        }]);

      if (caseError) throw caseError;

      // Trigger customer notification email
      try {
        await supabase.functions.invoke('sot-finance-manager-notify', {
          body: { mandateId, managerId },
        });
      } catch (notifyError) {
        // Log but don't fail the acceptance
        console.error('Failed to send notification:', notifyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-mandates'] });
      queryClient.invalidateQueries({ queryKey: ['future-room-cases'] });
      toast.success('Mandat angenommen');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

// Fetch FutureRoom cases for MOD-11
export function useFutureRoomCases() {
  const { activeOrganization } = useAuth();

  return useQuery({
    queryKey: ['future-room-cases', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];

      const { data, error } = await supabase
        .from('future_room_cases')
        .select(`
          *,
          finance_mandates (
            *,
            finance_requests (
              *,
              applicant_profiles (*)
            )
          )
        `)
        .eq('manager_tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!activeOrganization?.id,
  });
}

// Fetch bank contacts
export function useFinanceBankContacts() {
  return useQuery({
    queryKey: ['finance-bank-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_bank_contacts')
        .select('*')
        .eq('is_active', true)
        .order('bank_name');

      if (error) throw error;
      return data;
    },
  });
}

// Fetch available finance managers (users with finance_manager role)
export function useFinanceManagers() {
  return useQuery({
    queryKey: ['available-finance-managers'],
    queryFn: async () => {
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('user_id')
        .eq('role', 'finance_manager');

      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) return [];

      const userIds = memberships.map(m => m.user_id);

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);

      if (profileError) throw profileError;
      return profiles || [];
    },
  });
}

// Assign finance manager to mandate (Zone 1 → assigns manager)
export function useAssignFinanceManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      mandateId, 
      managerId 
    }: { 
      mandateId: string; 
      managerId: string;
    }) => {
      const { error } = await supabase
        .from('finance_mandates')
        .update({
          status: 'assigned',
          assigned_manager_id: managerId,
          delegated_at: new Date().toISOString(),
          delegated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-mandates'] });
      queryClient.invalidateQueries({ queryKey: ['finance-mandate'] });
      toast.success('Manager erfolgreich zugewiesen');
    },
    onError: (error) => {
      toast.error('Zuweisung fehlgeschlagen: ' + (error as Error).message);
    },
  });
}
