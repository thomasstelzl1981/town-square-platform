import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditJob {
  id: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  status: string;
  job_type: string;
  triggered_by: string | null;
  repo_ref: string | null;
  logs: any;
  audit_report_id: string | null;
}

export function useAuditJobs() {
  return useQuery({
    queryKey: ['audit-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AuditJob[];
    },
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (job: Partial<AuditJob>) => {
      const { data, error } = await supabase
        .from('audit_jobs')
        .insert(job as any)
        .select()
        .single();
      if (error) throw error;
      return data as AuditJob;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-jobs'] }),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AuditJob> & { id: string }) => {
      const { error } = await supabase
        .from('audit_jobs')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-jobs'] }),
  });
}
