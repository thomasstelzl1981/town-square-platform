/**
 * useServiceShopProducts — SSOT Hook for service_shop_products (Z1 CRUD, Z2 Read)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ServiceShopProduct {
  id: string;
  shop_key: string;
  category: string | null;
  name: string;
  description: string | null;
  price_label: string | null;
  price_cents: number | null;
  image_url: string | null;
  external_url: string | null;
  affiliate_tag: string | null;
  affiliate_network: string | null;
  badge: string | null;
  sub_category: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

type NewProduct = Omit<ServiceShopProduct, 'id' | 'created_at' | 'updated_at'>;
type UpdateProduct = Partial<NewProduct> & { id: string };

const QUERY_KEY = 'service-shop-products';

/** Zone 1: All products for a shop_key (including inactive) */
export function useServiceShopProducts(shopKey: string) {
  return useQuery({
    queryKey: [QUERY_KEY, shopKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_shop_products' as any)
        .select('*')
        .eq('shop_key', shopKey)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ServiceShopProduct[];
    },
  });
}

/** Zone 2: Only active products for a shop_key */
export function useActiveServiceProducts(shopKey: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'active', shopKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_shop_products' as any)
        .select('*')
        .eq('shop_key', shopKey)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ServiceShopProduct[];
    },
  });
}

export function useCreateServiceProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: NewProduct) => {
      const { data, error } = await supabase
        .from('service_shop_products' as any)
        .insert(product as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ServiceShopProduct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: 'Produkt angelegt' });
    },
    onError: (e: Error) => toast({ title: 'Fehler', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateServiceProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: UpdateProduct) => {
      const { data, error } = await supabase
        .from('service_shop_products' as any)
        .update(fields as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ServiceShopProduct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: 'Produkt aktualisiert' });
    },
    onError: (e: Error) => toast({ title: 'Fehler', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteServiceProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_shop_products' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: 'Produkt gelöscht' });
    },
    onError: (e: Error) => toast({ title: 'Fehler', description: e.message, variant: 'destructive' }),
  });
}
