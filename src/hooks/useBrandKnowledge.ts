import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface KnowledgeItem {
  id: string;
  item_code: string;
  title_de: string;
  category: string;
  content: string;
  content_type: string;
  scope: string;
  brand_key: string | null;
  phone_prompt_priority: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreateItemInput {
  title_de: string;
  category: string;
  content: string;
  phone_prompt_priority?: number;
}

interface UpdateItemInput {
  title_de?: string;
  category?: string;
  content?: string;
  phone_prompt_priority?: number;
  is_active?: boolean;
}

export function useBrandKnowledge(brandKey: string) {
  const qc = useQueryClient();
  const queryKey = ['brand-knowledge', brandKey];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('armstrong_knowledge_items')
        .select('*') as any)
        .eq('brand_key', brandKey)
        .order('phone_prompt_priority', { ascending: true });
      if (error) throw error;
      return (data ?? []) as KnowledgeItem[];
    },
    enabled: !!brandKey,
  });

  const createItem = useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const code = `KB.${brandKey.toUpperCase()}.${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase
        .from('armstrong_knowledge_items')
        .insert({
          item_code: code,
          title_de: input.title_de,
          category: input.category === 'brand_persona' ? 'brand_persona' : brandKey,
          content: input.content,
          content_type: 'instruction',
          scope: 'brand',
          brand_key: brandKey,
          phone_prompt_priority: input.phone_prompt_priority ?? 50,
          status: 'published',
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Wissensartikel erstellt' });
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateItemInput }) => {
      const { error } = await supabase
        .from('armstrong_knowledge_items')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Gespeichert' });
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('armstrong_knowledge_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Artikel gelöscht' });
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    },
  });

  return { items, isLoading, createItem, updateItem, deleteItem };
}
