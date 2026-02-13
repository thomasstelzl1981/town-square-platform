/**
 * useVersionHistory — Hook for website version history & rollback
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useVersionHistory(websiteId: string | undefined) {
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['website_versions', websiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_versions' as any)
        .select('*')
        .eq('website_id', websiteId!)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!websiteId,
  });

  const rollback = useMutation({
    mutationFn: async (versionId: string) => {
      // 1. Load the target version's snapshot
      const { data: version, error: vErr } = await (supabase
        .from('website_versions' as any)
        .select('snapshot_json')
        .eq('id', versionId)
        .single() as any);
      if (vErr || !version) throw new Error('Version nicht gefunden');

      const snapshot = (version as any).snapshot_json as any;
      if (!snapshot?.sections?.length) throw new Error('Snapshot enthält keine Sections');

      // 2. Get the home page
      const { data: page } = await (supabase
        .from('website_pages' as any)
        .select('id')
        .eq('website_id', websiteId!)
        .eq('slug', 'home')
        .single() as any);
      if (!page) throw new Error('Startseite nicht gefunden');

      // 3. Delete current sections
      await supabase.from('website_sections' as any).delete().eq('page_id', (page as any).id);

      // 4. Re-insert from snapshot
      const inserts = snapshot.sections.map((s: any, i: number) => ({
        page_id: (page as any).id,
        tenant_id: activeTenantId!,
        section_type: s.section_type,
        sort_order: i,
        content_json: s.content_json || {},
        design_json: s.design_json || {},
        is_visible: s.is_visible ?? true,
      }));

      const { error: insertErr } = await supabase
        .from('website_sections' as any)
        .insert(inserts);
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website_sections'] });
      toast.success('Rollback erfolgreich — Sections wiederhergestellt');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, rollback };
}
