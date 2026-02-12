/**
 * useSubmitFinanceRequest
 * 
 * Hook for submitting a finance request to Zone 1.
 * Creates finance_mandate and updates request status.
 * 
 * Flow:
 * 1. Validate completion (self-disclosure >= 80%)
 * 2. Set finance_requests.status = 'submitted_to_zone1'
 * 3. Set finance_requests.submitted_at = now()
 * 4. Create finance_mandate with status = 'new'
 * 5. Create audit_event (FIN_SUBMIT)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SubmitOptions {
  requestId: string;
  onSuccess?: () => void;
}

export function useSubmitFinanceRequest() {
  const { user, activeOrganization } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }: SubmitOptions) => {
      if (!activeOrganization?.id || !user?.id) {
        throw new Error('Keine aktive Organisation oder Benutzer');
      }

      // 1. Get current request status
      const { data: request, error: reqError } = await supabase
        .from('finance_requests')
        .select('id, status, tenant_id')
        .eq('id', requestId)
        .single();

      if (reqError || !request) {
        throw new Error('Anfrage nicht gefunden');
      }

      if (request.status !== 'draft' && request.status !== 'collecting') {
        throw new Error('Anfrage kann in diesem Status nicht eingereicht werden');
      }

      // 2. Check self-disclosure completion score
      const { data: profile, error: profileError } = await supabase
        .from('applicant_profiles')
        .select('completion_score')
        .eq('tenant_id', activeOrganization.id)
        .eq('party_role', 'primary')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const completionScore = profile?.completion_score ?? 0;
      
      if (completionScore < 80) {
        throw new Error(`Selbstauskunft ist erst zu ${completionScore}% vollständig. Mindestens 80% erforderlich.`);
      }

      // 2b. Create applicant snapshot for handoff
      const { data: fullProfile } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .eq('party_role', 'primary')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const applicantSnapshot = fullProfile ? { ...fullProfile, snapshot_at: new Date().toISOString() } : null;

      // 3. Update finance_request status to submitted_to_zone1
      const { error: updateError } = await supabase
        .from('finance_requests')
        .update({
          status: 'submitted_to_zone1',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          applicant_snapshot: applicantSnapshot,
        } as any)
        .eq('id', requestId);

      if (updateError) {
        throw new Error('Fehler beim Aktualisieren des Status: ' + updateError.message);
      }

      // 4. Create finance_mandate for Zone 1
      const { data: mandate, error: mandateError } = await supabase
        .from('finance_mandates')
        .insert({
          tenant_id: activeOrganization.id,
          finance_request_id: requestId,
          status: 'new',
          priority: 5, // default priority
        })
        .select()
        .single();

      if (mandateError) {
        // Rollback request status if mandate creation fails
        await supabase
          .from('finance_requests')
          .update({ status: 'draft', submitted_at: null })
          .eq('id', requestId);
        throw new Error('Fehler beim Erstellen des Mandats: ' + mandateError.message);
      }

      // 5. Create audit event
      await supabase
        .from('audit_events')
        .insert({
          event_type: 'FIN_SUBMIT',
          actor_user_id: user.id,
          target_org_id: activeOrganization.id,
          payload: {
            finance_request_id: requestId,
            finance_mandate_id: mandate.id,
            completion_score: completionScore,
          },
        });

      return { requestId, mandateId: mandate.id };
    },
    onSuccess: (_, variables) => {
      toast.success('Anfrage erfolgreich eingereicht', {
        description: 'Ihre Finanzierungsanfrage wurde zur Bearbeitung weitergeleitet.',
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['finance-request'] });
      queryClient.invalidateQueries({ queryKey: ['draft-finance-request'] });
      queryClient.invalidateQueries({ queryKey: ['finance-requests-with-mandates'] });
      
      variables.onSuccess?.();
    },
    onError: (error) => {
      toast.error('Fehler beim Einreichen', {
        description: (error as Error).message,
      });
    },
  });
}
