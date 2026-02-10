/**
 * MOD-15 — Curated items provider (Fallback for all tabs)
 * Reads from fortbildung_curated_items table.
 */

import { supabase } from '@/integrations/supabase/client';
import type { FortbildungTab, FortbildungTopic, FortbildungItem, SearchResult } from './types';

export async function fetchCuratedItems(
  tab: FortbildungTab,
  topic?: FortbildungTopic
): Promise<FortbildungItem[]> {
  let query = (supabase as any)
    .from('fortbildung_curated_items')
    .select('*')
    .eq('tab', tab)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (topic) {
    query = query.eq('topic', topic);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching curated items:', error);
    return [];
  }
  return (data || []) as FortbildungItem[];
}

export async function searchCuratedItems(
  tab: FortbildungTab,
  searchQuery: string
): Promise<SearchResult> {
  const q = searchQuery.toLowerCase();
  const { data, error } = await (supabase as any)
    .from('fortbildung_curated_items')
    .select('*')
    .eq('tab', tab)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error searching curated items:', error);
    return { items: [], apiAvailable: false };
  }

  const items = ((data || []) as FortbildungItem[]).filter(item =>
    item.title.toLowerCase().includes(q) ||
    (item.author_or_channel?.toLowerCase().includes(q)) ||
    (item.description?.toLowerCase().includes(q))
  );

  // Log the search (fire-and-forget)
  (supabase as any)
    .from('fortbildung_search_logs')
    .insert({ tab, query: searchQuery, results_count: items.length })
    .then(() => {});

  return { items, apiAvailable: false };
}
