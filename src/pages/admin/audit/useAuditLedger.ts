/**
 * Query hook for data_event_ledger with filters + cursor-based pagination.
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LedgerEntry {
  id: string;
  created_at: string;
  tenant_id: string | null;
  zone: string;
  actor_user_id: string | null;
  actor_role: string | null;
  event_type: string;
  direction: string;
  source: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  ip_hash: string | null;
  user_agent_hash: string | null;
}

export interface LedgerFilters {
  tenantId?: string;
  eventType?: string;
  direction?: string;
  zone?: string;
  dateFrom?: string;
  dateTo?: string;
}

const PAGE_SIZE = 50;

export function useAuditLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEntries = useCallback(async (cursor?: string) => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('data_event_ledger')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (filters.tenantId) query = query.eq('tenant_id', filters.tenantId);
      if (filters.eventType) query = query.eq('event_type', filters.eventType);
      if (filters.direction) query = query.eq('direction', filters.direction);
      if (filters.zone) query = query.eq('zone', filters.zone);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo + 'T23:59:59.999Z');
      if (cursor) query = query.lt('created_at', cursor);

      const { data, error, count } = await query;

      if (error) {
        console.error('[AuditLedger] Query error:', error);
        return;
      }

      if (cursor) {
        setEntries(prev => [...prev, ...(data || [])]);
      } else {
        setEntries(data || []);
        setTotalCount(count || 0);
      }

      setHasMore((data?.length || 0) === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const loadMore = useCallback(() => {
    if (entries.length > 0 && hasMore) {
      const lastEntry = entries[entries.length - 1];
      fetchEntries(lastEntry.created_at);
    }
  }, [entries, hasMore, fetchEntries]);

  return {
    entries,
    loading,
    filters,
    setFilters,
    hasMore,
    loadMore,
    totalCount,
    refresh: () => fetchEntries(),
  };
}
