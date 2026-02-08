/**
 * useArmstrongLogs — Hook for Armstrong Action Logs
 * 
 * Fetches action run logs from the database with filtering and pagination.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ActionRunStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type ActionRunZone = 'Z1' | 'Z2' | 'Z3';

export interface ActionRun {
  id: string;
  action_code: string;
  zone: ActionRunZone;
  org_id: string | null;
  user_id: string | null;
  session_id: string | null;
  correlation_id: string | null;
  status: ActionRunStatus;
  input_context: Record<string, unknown>;
  output_result: Record<string, unknown>;
  error_message: string | null;
  tokens_used: number;
  cost_cents: number;
  duration_ms: number;
  payload_hash: string | null;
  payload_size_bytes: number | null;
  pii_present: boolean;
  retention_days: number;
  created_at: string;
}

export interface LogFilters {
  status?: ActionRunStatus;
  zone?: ActionRunZone;
  action_code?: string;
  org_id?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LogStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  cancelled: number;
  totalTokens: number;
  totalCostCents: number;
  avgDurationMs: number;
}

/**
 * Fetch action runs with filters
 */
async function fetchActionRuns(
  filters?: LogFilters,
  limit: number = 100,
  offset: number = 0
): Promise<ActionRun[]> {
  let query = supabase
    .from('armstrong_action_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.zone) {
    query = query.eq('zone', filters.zone);
  }

  if (filters?.action_code) {
    query = query.ilike('action_code', `%${filters.action_code}%`);
  }

  if (filters?.org_id) {
    query = query.eq('org_id', filters.org_id);
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching action runs:', error);
    throw error;
  }

  let runs = (data || []) as ActionRun[];

  // Client-side search filter for broader matching
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    runs = runs.filter(run =>
      run.action_code.toLowerCase().includes(searchLower) ||
      run.error_message?.toLowerCase().includes(searchLower) ||
      run.session_id?.toLowerCase().includes(searchLower)
    );
  }

  return runs;
}

/**
 * Hook to get action logs with filtering
 */
export function useArmstrongLogs(
  filters?: LogFilters,
  limit: number = 100,
  offset: number = 0
) {
  const { data: runs, isLoading, error, refetch } = useQuery({
    queryKey: ['armstrong-logs', filters, limit, offset],
    queryFn: () => fetchActionRuns(filters, limit, offset),
    staleTime: 10000, // 10 seconds for logs
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Calculate stats
  const stats: LogStats = {
    total: (runs || []).length,
    completed: (runs || []).filter(r => r.status === 'completed').length,
    failed: (runs || []).filter(r => r.status === 'failed').length,
    pending: (runs || []).filter(r => r.status === 'pending').length,
    cancelled: (runs || []).filter(r => r.status === 'cancelled').length,
    totalTokens: (runs || []).reduce((sum, r) => sum + r.tokens_used, 0),
    totalCostCents: (runs || []).reduce((sum, r) => sum + r.cost_cents, 0),
    avgDurationMs: (runs || []).length > 0
      ? Math.round((runs || []).reduce((sum, r) => sum + r.duration_ms, 0) / (runs || []).length)
      : 0,
  };

  return {
    logs: runs || [],
    stats,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get a single log entry by ID
 */
export function useActionRunDetail(id: string | null) {
  return useQuery({
    queryKey: ['armstrong-log-detail', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('armstrong_action_runs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ActionRun;
    },
    enabled: !!id,
  });
}

/**
 * Hook to get recent error logs
 */
export function useRecentErrors(limit: number = 10) {
  return useQuery({
    queryKey: ['armstrong-recent-errors', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armstrong_action_runs')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as ActionRun[];
    },
    staleTime: 30000,
  });
}
