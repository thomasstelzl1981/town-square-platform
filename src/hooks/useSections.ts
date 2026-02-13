/**
 * useSections — CRUD hook for website_sections
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { SectionType } from '@/shared/website-renderer/types';

export function useWebsitePage(websiteId: string | undefined) {
  return useQuery({
    queryKey: ['website_page', websiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_pages' as any)
        .select('*')
        .eq('website_id', websiteId!)
        .eq('slug', 'home')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as any | null;
    },
    enabled: !!websiteId,
  });
}

export function useSections(pageId: string | undefined) {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();

  const query = useQuery({
    queryKey: ['website_sections', pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_sections' as any)
        .select('*')
        .eq('page_id', pageId!)
        .order('sort_order');
      if (error) throw error;
      return data as any[];
    },
    enabled: !!pageId,
  });

  const addSection = useMutation({
    mutationFn: async (input: { section_type: SectionType; sort_order: number; content_json?: any }) => {
      const { error } = await supabase
        .from('website_sections' as any)
        .insert({
          page_id: pageId!,
          tenant_id: activeTenantId!,
          section_type: input.section_type,
          sort_order: input.sort_order,
          content_json: input.content_json || {},
          design_json: {},
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website_sections', pageId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const updateSection = useMutation({
    mutationFn: async (input: { id: string; content_json?: any; design_json?: any; sort_order?: number; is_visible?: boolean }) => {
      const { id, ...update } = input;
      const { error } = await supabase
        .from('website_sections' as any)
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website_sections', pageId] }),
  });

  const deleteSection = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase
        .from('website_sections' as any)
        .delete()
        .eq('id', sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website_sections', pageId] });
      toast.success('Section entfernt');
    },
  });

  return { ...query, addSection, updateSection, deleteSection };
}
