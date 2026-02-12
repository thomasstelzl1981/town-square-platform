/**
 * Hook for finance submission logs — CRUD + email sending
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SubmissionLog {
  id: string;
  finance_request_id: string;
  bank_contact_id: string | null;
  channel: 'email' | 'external';
  status: string;
  submitted_at: string | null;
  response_received_at: string | null;
  conditions_offered: Record<string, unknown> | null;
  is_selected: boolean;
  email_subject: string | null;
  email_body: string | null;
  external_software_name: string | null;
  created_by: string | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  finance_bank_contacts?: {
    bank_name: string;
    contact_name: string | null;
    contact_email: string | null;
  } | null;
}

export function useSubmissionLogs(financeRequestId: string | undefined) {
  return useQuery({
    queryKey: ['finance-submission-logs', financeRequestId],
    queryFn: async () => {
      if (!financeRequestId) return [];
      const { data, error } = await supabase
        .from('finance_submission_logs')
        .select('*, finance_bank_contacts(bank_name, contact_name, contact_email)')
        .eq('finance_request_id', financeRequestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as SubmissionLog[];
    },
    enabled: !!financeRequestId,
  });
}

export function useCreateSubmissionLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      finance_request_id: string;
      bank_contact_id?: string;
      channel: 'email' | 'external';
      status?: string;
      email_subject?: string;
      email_body?: string;
      external_software_name?: string;
      tenant_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('finance_submission_logs')
        .insert({
          ...input,
          submitted_at: new Date().toISOString(),
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['finance-submission-logs', data.finance_request_id] });
    },
  });
}

export function useUpdateSubmissionLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      status?: string;
      conditions_offered?: Record<string, string | number | boolean | null>;
      is_selected?: boolean;
      response_received_at?: string;
    }) => {
      const { data, error } = await supabase
        .from('finance_submission_logs')
        .update(updates)
        .eq('id', id)
        .select('finance_request_id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['finance-submission-logs', data.finance_request_id] });
    },
  });
}

export function useSendSubmissionEmail() {
  const createLog = useCreateSubmissionLog();

  return useMutation({
    mutationFn: async (input: {
      finance_request_id: string;
      bank_contact_id: string;
      to_email: string;
      subject: string;
      html_content: string;
      tenant_id?: string;
    }) => {
      // 1. Send via edge function
      const { data: mailResult, error: mailError } = await supabase.functions.invoke('sot-system-mail-send', {
        body: {
          to: input.to_email,
          subject: input.subject,
          html_content: input.html_content,
          context: 'finance_submission',
        },
      });
      if (mailError) throw mailError;

      // 2. Create log entry
      await createLog.mutateAsync({
        finance_request_id: input.finance_request_id,
        bank_contact_id: input.bank_contact_id,
        channel: 'email',
        status: 'sent',
        email_subject: input.subject,
        email_body: input.html_content,
        tenant_id: input.tenant_id,
      });

      return mailResult;
    },
    onSuccess: () => {
      toast.success('E-Mail erfolgreich versendet');
    },
    onError: (err: Error) => {
      toast.error(`Versand fehlgeschlagen: ${err.message}`);
    },
  });
}
