/**
 * ACQUISITION MANDATE HOOKS
 * 
 * React Query hooks for MOD-12 AkquiseManager + Zone-1 Acquiary
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  AcqMandate, 
  AcqMandateEvent, 
  CreateAcqMandateData, 
  AcqMandateStatus 
} from '@/types/acquisition';

// ============================================================================
// ZONE 1: Admin/Governance Hooks
// ============================================================================

/**
 * Fetch all mandates for Zone 1 Admin (Acquiary)
 */
export function useAcqMandates() {
  const { isPlatformAdmin } = useAuth();

  return useQuery({
    queryKey: ['acq-mandates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AcqMandate[];
    },
    enabled: isPlatformAdmin,
  });
}

/**
 * Fetch mandates in submitted_to_zone1 status (Inbox)
 */
export function useAcqMandatesInbox() {
  const { isPlatformAdmin } = useAuth();

  return useQuery({
    queryKey: ['acq-mandates', 'inbox'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .eq('status', 'submitted_to_zone1')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AcqMandate[];
    },
    enabled: isPlatformAdmin,
  });
}

/**
 * Fetch mandates in assigned status (pending acceptance)
 */
export function useAcqMandatesAssigned() {
  const { isPlatformAdmin } = useAuth();

  return useQuery({
    queryKey: ['acq-mandates', 'assigned'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .eq('status', 'assigned')
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as AcqMandate[];
    },
    enabled: isPlatformAdmin,
  });
}

// ============================================================================
// MOD-12: AkquiseManager Hooks
// ============================================================================

/**
 * Fetch mandates assigned to current user (AkquiseManager)
 */
export function useAcqMandatesForManager() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['acq-mandates', 'for-manager', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .eq('assigned_manager_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AcqMandate[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch pending mandates for manager (assigned but not yet accepted)
 */
export function useAcqMandatesPending() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['acq-mandates', 'pending', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .eq('assigned_manager_user_id', user.id)
        .eq('status', 'assigned')
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as AcqMandate[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch active mandates for manager (split confirmed)
 */
export function useAcqMandatesActive() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['acq-mandates', 'active', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .eq('assigned_manager_user_id', user.id)
        .eq('status', 'active')
        .order('split_terms_confirmed_at', { ascending: false });

      if (error) throw error;
      return data as AcqMandate[];
    },
    enabled: !!user?.id,
  });
}

// ============================================================================
// SINGLE MANDATE HOOKS
// ============================================================================

/**
 * Fetch single mandate by ID
 */
export function useAcqMandate(mandateId: string | undefined) {
  return useQuery({
    queryKey: ['acq-mandate', mandateId],
    queryFn: async () => {
      if (!mandateId) return null;

      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .eq('id', mandateId)
        .single();

      if (error) throw error;
      return data as AcqMandate;
    },
    enabled: !!mandateId,
  });
}

/**
 * Fetch mandate events (audit trail)
 */
export function useAcqMandateEvents(mandateId: string | undefined) {
  return useQuery({
    queryKey: ['acq-mandate-events', mandateId],
    queryFn: async () => {
      if (!mandateId) return [];

      const { data, error } = await supabase
        .from('acq_mandate_events')
        .select('*')
        .eq('mandate_id', mandateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AcqMandateEvent[];
    },
    enabled: !!mandateId,
  });
}

// ============================================================================
// MOD-08: User Mandate Creation
// ============================================================================

/**
 * Fetch user's own mandates (for MOD-08)
 */
export function useMyAcqMandates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['acq-mandates', 'my', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('acq_mandates')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AcqMandate[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Create new mandate (MOD-08)
 */
export function useCreateAcqMandate() {
  const queryClient = useQueryClient();
  const { user, activeTenantId } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateAcqMandateData) => {
      if (!user?.id) throw new Error('Nicht eingeloggt');
      if (!activeTenantId) throw new Error('Keine Organisation ausgewählt');

      // Code is auto-generated by trigger, but we need to provide a placeholder
      const tempCode = `ACQ-${new Date().getFullYear()}-TEMP`;

      const { data: mandate, error } = await supabase
        .from('acq_mandates')
        .insert([{
          code: tempCode,
          tenant_id: activeTenantId,
          created_by_user_id: user.id,
          client_display_name: data.client_display_name,
          search_area: data.search_area,
          asset_focus: data.asset_focus,
          price_min: data.price_min,
          price_max: data.price_max,
          yield_target: data.yield_target,
          exclusions: data.exclusions,
          notes: data.notes,
          status: 'draft' as AcqMandateStatus,
        }])
        .select()
        .single();

      if (error) throw error;
      return mandate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-mandates'] });
      toast.success('Mandat erstellt');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

/**
 * Submit mandate to Zone 1 (MOD-08)
 */
export function useSubmitAcqMandate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mandateId: string) => {
      const { error } = await supabase
        .from('acq_mandates')
        .update({
          status: 'submitted_to_zone1' as AcqMandateStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-mandates'] });
      toast.success('Mandat eingereicht');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// ZONE 1: Assignment
// ============================================================================

/**
 * Assign manager to mandate (Zone 1)
 */
export function useAssignAcqManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mandateId, managerId }: { mandateId: string; managerId: string }) => {
      const { error } = await supabase
        .from('acq_mandates')
        .update({
          status: 'assigned' as AcqMandateStatus,
          assigned_manager_user_id: managerId,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-mandates'] });
      toast.success('Manager zugewiesen');
    },
    onError: (error) => {
      toast.error('Zuweisung fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// MOD-12: Gate / Accept Mandate
// ============================================================================

/**
 * Confirm split terms and activate mandate (MOD-12)
 */
export function useAcceptAcqMandate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (mandateId: string) => {
      if (!user?.id) throw new Error('Nicht eingeloggt');

      const { error } = await supabase
        .from('acq_mandates')
        .update({
          status: 'active' as AcqMandateStatus,
          split_terms_confirmed_at: new Date().toISOString(),
          split_terms_confirmed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-mandates'] });
      toast.success('Mandat angenommen');
    },
    onError: (error) => {
      toast.error('Annahme fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// STATUS UPDATES
// ============================================================================

/**
 * Update mandate status
 */
export function useUpdateAcqMandateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mandateId, status }: { mandateId: string; status: AcqMandateStatus }) => {
      const { error } = await supabase
        .from('acq_mandates')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-mandates'] });
      toast.success('Status aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

/**
 * Pause mandate
 */
export function usePauseAcqMandate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mandateId: string) => {
      const { error } = await supabase
        .from('acq_mandates')
        .update({
          status: 'paused' as AcqMandateStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-mandates'] });
      toast.success('Mandat pausiert');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

/**
 * Resume mandate
 */
export function useResumeAcqMandate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mandateId: string) => {
      const { error } = await supabase
        .from('acq_mandates')
        .update({
          status: 'active' as AcqMandateStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-mandates'] });
      toast.success('Mandat fortgesetzt');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

/**
 * Close mandate
 */
export function useCloseAcqMandate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mandateId: string) => {
      const { error } = await supabase
        .from('acq_mandates')
        .update({
          status: 'closed' as AcqMandateStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-mandates'] });
      toast.success('Mandat abgeschlossen');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// FETCH AKQUISE MANAGERS
// ============================================================================

/**
 * Fetch available Akquise Managers (users with akquise_manager role)
 */
export function useAkquiseManagers() {
  return useQuery({
    queryKey: ['akquise-managers'],
    queryFn: async () => {
      // Check memberships for akquise_manager role (cast to text for comparison)
      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select('user_id')
        .filter('role', 'eq', 'akquise_manager');

      if (membershipError) {
        // Ignore membership error, try user_roles
        console.warn('Membership query failed, trying user_roles:', membershipError);
      }
      if (!membershipData || membershipData.length === 0) {
        // Fallback: check user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id');

        if (roleError) throw roleError;
        if (!roleData || roleData.length === 0) return [];

        const userIds = roleData.map(r => r.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', userIds);

        if (profileError) throw profileError;
        return profiles || [];
      }

      const userIds = membershipData.map(m => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);

      if (profileError) throw profileError;
      return profiles || [];
    },
  });
}
