/**
 * useServiceShopConfig — Loads shop config including metadata_schema for dynamic CRUD fields
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MetadataField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'select' | 'tags';
  options?: string[];
}

export interface ServiceShopConfig {
  id: string;
  shop_key: string;
  display_name: string;
  affiliate_network: string | null;
  is_connected: boolean;
  metadata_schema: MetadataField[];
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useServiceShopConfig(shopKey: string) {
  return useQuery({
    queryKey: ['service-shop-config', shopKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_shop_config' as any)
        .select('*')
        .eq('shop_key', shopKey)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const d = data as any;
      return {
        id: d.id,
        shop_key: d.shop_key,
        display_name: d.display_name,
        affiliate_network: d.affiliate_network,
        is_connected: d.is_connected,
        metadata_schema: Array.isArray(d.metadata_schema) ? d.metadata_schema : [],
        config: d.config,
        created_at: d.created_at,
        updated_at: d.updated_at,
      } as ServiceShopConfig;
    },
    enabled: !!shopKey,
  });
}
