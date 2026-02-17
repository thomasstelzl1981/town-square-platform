/**
 * usePetShopProducts — SSOT Hook for pet_shop_products (Z1 CRUD, Z2/Z3 Read)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PetShopProduct {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price_label: string | null;
  price_cents: number | null;
  image_url: string | null;
  external_url: string | null;
  badge: string | null;
  sub_category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type NewProduct = Omit<PetShopProduct, 'id' | 'created_at' | 'updated_at'>;
type UpdateProduct = Partial<NewProduct> & { id: string };

const QUERY_KEY = 'pet-shop-products';

export function usePetShopProducts(category?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, category],
    queryFn: async () => {
      let q = supabase
        .from('pet_shop_products' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (category) q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PetShopProduct[];
    },
  });
}

export function useActiveShopProducts(category?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'active', category],
    queryFn: async () => {
      let q = supabase
        .from('pet_shop_products' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (category) q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PetShopProduct[];
    },
  });
}

export function useCreateShopProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: NewProduct) => {
      const { data, error } = await supabase
        .from('pet_shop_products' as any)
        .insert(product as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PetShopProduct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: 'Produkt angelegt' });
    },
    onError: (e: Error) => toast({ title: 'Fehler', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateShopProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: UpdateProduct) => {
      const { data, error } = await supabase
        .from('pet_shop_products' as any)
        .update(fields as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PetShopProduct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: 'Produkt aktualisiert' });
    },
    onError: (e: Error) => toast({ title: 'Fehler', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteShopProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pet_shop_products' as any)
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
