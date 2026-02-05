import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DEV_TENANT_UUID } from '@/hooks/useGoldenPathSeeds';
import type { 
  FinanceRequest, 
  ApplicantProfile, 
  ApplicantFormData,
  FinanceRequestStatus,
  calculateCompletionScore 
} from '@/types/finance';

// Correct status for Zone 1 handoff
const SUBMITTED_STATUS = 'submitted_to_zone1';

export function useFinanceRequests() {
  const { activeOrganization, isDevelopmentMode } = useAuth();

  return useQuery({
    queryKey: ['finance-requests', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id && !isDevelopmentMode) return [];
      
      // P0-1 FIX: Use correct DEV_TENANT_UUID fallback instead of invalid 'dev-tenant' string
      const tenantId = activeOrganization?.id || (isDevelopmentMode ? DEV_TENANT_UUID : null);
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('finance_requests')
        .select(`
          *,
          applicant_profiles (
            id,
            first_name,
            last_name,
            profile_type,
            party_role,
            completion_score
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (FinanceRequest & { applicant_profiles: Partial<ApplicantProfile>[] })[];
    },
    enabled: !!activeOrganization?.id || isDevelopmentMode,
  });
}

export function useFinanceRequest(requestId: string | undefined) {
  const { activeOrganization, isDevelopmentMode } = useAuth();

  return useQuery({
    queryKey: ['finance-request', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      
      const { data, error } = await supabase
        .from('finance_requests')
        .select(`
          *,
          applicant_profiles (*),
          properties (
            id,
            code,
            address,
            city,
            postal_code,
            purchase_price
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });
}

export function useCreateFinanceRequest() {
  const queryClient = useQueryClient();
  const { activeOrganization, user, isDevelopmentMode } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      object_source?: string;
      property_id?: string;
      custom_object_data?: Record<string, unknown>;
    }) => {
      // P0-1 FIX: Use correct DEV_TENANT_UUID fallback
      const tenantId = activeOrganization?.id || (isDevelopmentMode ? DEV_TENANT_UUID : null);
      if (!tenantId) throw new Error('No tenant ID available');
      
      const userId = user?.id || 'dev-user';

      // Generate public_id
      const publicId = `FIN-${Date.now().toString(36).toUpperCase()}`;

      const { data: request, error } = await supabase
        .from('finance_requests')
        .insert([{
          tenant_id: tenantId,
          public_id: publicId,
          status: 'draft',
          object_source: data.object_source || null,
          property_id: data.property_id || null,
          custom_object_data: (data.custom_object_data as any) || null,
          created_by: userId,
        }])
        .select()
        .single();

      if (error) throw error;

      // Create primary applicant profile
      const { error: profileError } = await supabase
        .from('applicant_profiles')
        .insert([{
          tenant_id: tenantId,
          finance_request_id: request.id,
          profile_type: 'private',
          party_role: 'primary',
        }]);

      if (profileError) throw profileError;

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-requests'] });
      toast.success('Finanzierungsantrag erstellt');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

export function useUpdateApplicantProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profileId, 
      data 
    }: { 
      profileId: string; 
      data: Partial<ApplicantFormData>;
    }) => {
      // Calculate completion score
      const completionScore = typeof data.completion_score === 'number' 
        ? data.completion_score 
        : 0;

      const { error } = await supabase
        .from('applicant_profiles')
        .update({
          ...data,
          completion_score: completionScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-request'] });
      toast.success('Selbstauskunft gespeichert');
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + (error as Error).message);
    },
  });
}

export function useSubmitFinanceRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      // Get current user for audit
      const currentUserId = user?.id;
      
      // Update request status to submitted_to_zone1 (not just 'submitted')
      const { error: requestError } = await supabase
        .from('finance_requests')
        .update({
          status: SUBMITTED_STATUS as FinanceRequestStatus,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Get request data for mandate creation
      const { data: requestData, error: fetchError } = await supabase
        .from('finance_requests')
        .select('tenant_id, public_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Create mandate in Zone 1 and get the ID for audit
      const { data: mandateData, error: mandateError } = await supabase
        .from('finance_mandates')
        .insert([{
          tenant_id: requestData.tenant_id,
          finance_request_id: requestId,
          public_id: requestData.public_id,
          status: 'new',
          priority: 0,
        }])
        .select('id')
        .single();

      if (mandateError) throw mandateError;

      // D5: Insert audit_event for FIN_SUBMIT contract
      const { error: auditError } = await supabase
        .from('audit_events')
        .insert({
          actor_user_id: currentUserId || requestData.tenant_id,
          event_type: 'FIN_SUBMIT',
          target_org_id: requestData.tenant_id,
          payload: {
            finance_request_id: requestId,
            finance_mandate_id: mandateData?.id,
            public_id: requestData.public_id,
            submitted_at: new Date().toISOString()
          }
        });

      // Log audit error but don't fail the transaction
      if (auditError) {
        console.warn('Audit event insert failed:', auditError);
      }

      return { requestId, mandateId: mandateData?.id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['finance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['finance-request'] });
      queryClient.invalidateQueries({ queryKey: ['future-room-cases'] });
      queryClient.invalidateQueries({ queryKey: ['finance-mandates'] });
      toast.success('Antrag erfolgreich eingereicht');
    },
    onError: (error) => {
      toast.error('Einreichung fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

// Update finance request status (for MOD-11)
export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      status, 
      notes 
    }: { 
      requestId: string; 
      status: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('finance_requests')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Optionally create audit event
      if (notes) {
        // TODO: Create audit event in case_events table
        console.log('Status change note:', notes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-request'] });
      queryClient.invalidateQueries({ queryKey: ['future-room-cases'] });
      toast.success('Status aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}
