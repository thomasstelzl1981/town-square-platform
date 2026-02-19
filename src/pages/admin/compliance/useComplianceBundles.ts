/**
 * Hook: CRUD for compliance_bundles + compliance_bundle_items
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataEventLedger } from '@/hooks/useDataEventLedger';
import { toast } from 'sonner';

export interface ComplianceBundle {
  id: string;
  bundle_key: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  document_id: string;
  required_version: number | null;
  required: boolean;
  sort_order: number;
}

export function useComplianceBundles() {
  const qc = useQueryClient();
  const { logEvent } = useDataEventLedger();

  const bundles = useQuery({
    queryKey: ['compliance-bundles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('compliance_bundles' as any).select('*').order('bundle_key');
      if (error) throw error;
      return (data || []) as unknown as ComplianceBundle[];
    },
  });

  const bundleItems = useQuery({
    queryKey: ['compliance-bundle-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('compliance_bundle_items' as any).select('*').order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as BundleItem[];
    },
  });

  const activateBundle = useMutation({
    mutationFn: async (bundleId: string) => {
      const { error } = await supabase.from('compliance_bundles' as any).update({ status: 'active', updated_at: new Date().toISOString() } as any).eq('id', bundleId);
      if (error) throw error;
      const bundle = bundles.data?.find(b => b.id === bundleId);
      const items = bundleItems.data?.filter(i => i.bundle_id === bundleId) || [];
      logEvent({ zone: 'Z1', eventType: 'legal.bundle.activated', direction: 'mutate', source: 'admin',
        payload: { bundle_key: bundle?.bundle_key, item_count: items.length } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-bundles'] });
      toast.success('Bundle aktiviert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return {
    bundles: bundles.data || [],
    bundleItems: bundleItems.data || [],
    isLoading: bundles.isLoading,
    activateBundle,
  };
}
