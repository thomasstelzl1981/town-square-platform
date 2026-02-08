/**
 * useArmstrongKnowledge — Hook for Armstrong Knowledge Base
 * 
 * Fetches and manages knowledge items from the database.
 * 7 Categories: system, real_estate, tax_legal, finance, sales, templates, research
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAllCategories } from "@/constants/armstrongKBTaxonomy";
import type { KBCategory } from "@/types/armstrong";

export type KnowledgeCategory = KBCategory;
export type KnowledgeContentType = 'article' | 'playbook' | 'checklist' | 'script' | 'faq' | 'research_memo';
export type KnowledgeConfidence = 'verified' | 'high' | 'medium' | 'low';
export type KnowledgeStatus = 'draft' | 'review' | 'published' | 'deprecated';
export type KnowledgeScope = 'global' | 'tenant';

export interface KnowledgeItem {
  id: string;
  item_code: string;
  category: KnowledgeCategory;
  subcategory: string | null;
  content_type: KnowledgeContentType;
  title_de: string;
  summary_de: string | null;
  content: string;
  sources: Array<{ url?: string; title?: string; date?: string }>;
  confidence: KnowledgeConfidence;
  valid_until: string | null;
  scope: KnowledgeScope;
  org_id: string | null;
  status: KnowledgeStatus;
  created_by: string | null;
  reviewed_by: string | null;
  published_at: string | null;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeStats {
  total: number;
  published: number;
  draft: number;
  review: number;
  deprecated: number;
  byCategory: Record<KnowledgeCategory, number>;
}

/**
 * Fetch knowledge items with optional filters
 */
async function fetchKnowledgeItems(filters?: {
  category?: KnowledgeCategory;
  status?: KnowledgeStatus;
  search?: string;
}): Promise<KnowledgeItem[]> {
  let query = supabase
    .from('armstrong_knowledge_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching knowledge items:', error);
    throw error;
  }

  // Client-side search filter
  let items = (data || []) as KnowledgeItem[];
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    items = items.filter(item =>
      item.title_de.toLowerCase().includes(searchLower) ||
      item.summary_de?.toLowerCase().includes(searchLower) ||
      item.content.toLowerCase().includes(searchLower) ||
      item.item_code.toLowerCase().includes(searchLower)
    );
  }

  return items;
}

/**
 * Fetch category counts for dashboard
 */
async function fetchCategoryCounts(): Promise<Record<KnowledgeCategory, number>> {
  const categories = getAllCategories();
  
  const { data, error } = await supabase
    .from('armstrong_knowledge_items')
    .select('category')
    .eq('status', 'published');

  if (error) {
    console.error('Error fetching category counts:', error);
    return categories.reduce((acc, cat) => ({ ...acc, [cat.code]: 0 }), {} as Record<KnowledgeCategory, number>);
  }

  const counts: Record<string, number> = {};
  (data || []).forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });

  return categories.reduce((acc, cat) => ({
    ...acc,
    [cat.code]: counts[cat.code] || 0
  }), {} as Record<KnowledgeCategory, number>);
}

/**
 * Hook to get knowledge items with filtering
 */
export function useArmstrongKnowledge(filters?: {
  category?: KnowledgeCategory;
  status?: KnowledgeStatus;
  search?: string;
}) {
  const { data: items, isLoading, error, refetch } = useQuery({
    queryKey: ['armstrong-knowledge', filters],
    queryFn: () => fetchKnowledgeItems(filters),
    staleTime: 30000,
  });

  const { data: categoryCounts } = useQuery({
    queryKey: ['armstrong-knowledge-counts'],
    queryFn: fetchCategoryCounts,
    staleTime: 60000,
  });

  const categories = getAllCategories();
  
  // Calculate stats
  const stats: KnowledgeStats = {
    total: (items || []).length,
    published: (items || []).filter(i => i.status === 'published').length,
    draft: (items || []).filter(i => i.status === 'draft').length,
    review: (items || []).filter(i => i.status === 'review').length,
    deprecated: (items || []).filter(i => i.status === 'deprecated').length,
    byCategory: categoryCounts || categories.reduce((acc, cat) => ({ ...acc, [cat.code]: 0 }), {} as Record<KnowledgeCategory, number>),
  };

  return {
    items: items || [],
    stats,
    categoryCounts: categoryCounts || {},
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get items pending review (platform_admin only)
 */
export function useKnowledgeReviewQueue() {
  return useQuery({
    queryKey: ['armstrong-knowledge-review'],
    queryFn: () => fetchKnowledgeItems({ status: 'review' }),
    staleTime: 30000,
  });
}

/**
 * Hook to create a knowledge item
 */
export function useCreateKnowledgeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      item_code: string;
      category: KnowledgeCategory;
      content_type: KnowledgeContentType;
      title_de: string;
      summary_de?: string;
      content: string;
      sources?: Array<{ url?: string; title?: string; date?: string }>;
      confidence?: KnowledgeConfidence;
      scope?: KnowledgeScope;
      org_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('armstrong_knowledge_items')
        .insert({
          item_code: item.item_code,
          category: item.category,
          content_type: item.content_type,
          title_de: item.title_de,
          summary_de: item.summary_de || null,
          content: item.content,
          sources: item.sources || [],
          confidence: item.confidence || 'medium',
          scope: item.scope || 'global',
          org_id: item.org_id || null,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-knowledge'] });
    },
  });
}

/**
 * Hook to update a knowledge item
 */
export function useUpdateKnowledgeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<Pick<KnowledgeItem, 'title_de' | 'summary_de' | 'content' | 'sources' | 'confidence' | 'status' | 'version'>>;
    }) => {
      const { data, error } = await supabase
        .from('armstrong_knowledge_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-knowledge'] });
    },
  });
}

/**
 * Hook to publish a knowledge item
 */
export function usePublishKnowledgeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('armstrong_knowledge_items')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-knowledge'] });
    },
  });
}

/**
 * Hook to submit item for review
 */
export function useSubmitForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('armstrong_knowledge_items')
        .update({ status: 'review' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-knowledge'] });
    },
  });
}

/**
 * Hook to delete a knowledge item
 */
export function useDeleteKnowledgeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('armstrong_knowledge_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-knowledge'] });
    },
  });
}
