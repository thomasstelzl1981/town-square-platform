import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditTemplate {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  content_txt: string;
  version: number;
  is_default: boolean;
  tags: string[];
}

export function useAuditTemplates() {
  return useQuery({
    queryKey: ['audit-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_prompt_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as AuditTemplate[];
    },
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content_txt }: { id: string; content_txt: string }) => {
      const { error } = await supabase
        .from('audit_prompt_templates')
        .update({ content_txt, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-templates'] }),
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: AuditTemplate) => {
      const { error } = await supabase
        .from('audit_prompt_templates')
        .insert({
          title: `${template.title} (Kopie)`,
          description: template.description,
          content_txt: template.content_txt,
          version: template.version + 1,
          is_default: false,
          tags: template.tags,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-templates'] }),
  });
}

export function useSetDefaultTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Unset all defaults first
      await supabase
        .from('audit_prompt_templates')
        .update({ is_default: false } as any)
        .neq('id', id);
      const { error } = await supabase
        .from('audit_prompt_templates')
        .update({ is_default: true } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit-templates'] }),
  });
}
