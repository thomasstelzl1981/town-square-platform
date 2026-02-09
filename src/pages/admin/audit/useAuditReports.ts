import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditReport {
  id: string;
  created_at: string;
  created_by: string | null;
  title: string;
  scope: any;
  status: string;
  counts: any;
  tags: string[];
  repo_ref: string | null;
  pr_url: string | null;
  content_md: string;
  content_html: string | null;
  artifacts: any;
  module_coverage: any;
  is_pinned: boolean;
}

export function useAuditReports() {
  return useQuery({
    queryKey: ['audit-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AuditReport[];
    },
  });
}

export function useAuditReport(id: string | undefined) {
  return useQuery({
    queryKey: ['audit-reports', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as AuditReport;
    },
  });
}

export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('audit_reports')
        .update({ is_pinned: pinned } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-reports'] }),
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: Partial<AuditReport> & { title: string; content_md: string }) => {
      const { data, error } = await supabase
        .from('audit_reports')
        .insert(report as any)
        .select()
        .single();
      if (error) throw error;
      return data as AuditReport;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-reports'] }),
  });
}
