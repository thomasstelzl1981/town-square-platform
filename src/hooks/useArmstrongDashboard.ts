/**
 * useArmstrongDashboard — Hook for Armstrong Dashboard KPIs
 * 
 * Fetches aggregated metrics from views and tables.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardKPIs {
  actions_24h: number;
  costs_30d_cents: number;
  error_rate_7d: number;
  avg_response_ms_24h: number;
  knowledge_items_count: number;
  active_policies_count: number;
}

export interface TopAction {
  action_code: string;
  run_count: number;
  total_cost_cents: number;
  avg_duration_ms: number;
}

export interface RecentAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  action_code?: string;
  created_at: string;
}

/**
 * Fetch dashboard KPIs from the view
 */
async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  // Try to use the view first
  const { data, error } = await supabase
    .from('v_armstrong_dashboard_kpis')
    .select('*')
    .single();

  if (error) {
    console.warn('View not available, using fallback:', error.message);
    
    // Fallback: calculate manually
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Actions in last 24h
    const { count: actions24h } = await supabase
      .from('armstrong_action_runs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    // Costs in last 30 days
    const { data: costData } = await supabase
      .from('armstrong_action_runs')
      .select('cost_cents')
      .gte('created_at', lastMonth.toISOString());
    const costs30d = (costData || []).reduce((sum, r) => sum + (r.cost_cents || 0), 0);

    // Error rate in last 7 days
    const { count: total7d } = await supabase
      .from('armstrong_action_runs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastWeek.toISOString());

    const { count: failed7d } = await supabase
      .from('armstrong_action_runs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastWeek.toISOString())
      .eq('status', 'failed');

    const errorRate = total7d && total7d > 0 ? ((failed7d || 0) / total7d) * 100 : 0;

    // Average response time in last 24h
    const { data: durationData } = await supabase
      .from('armstrong_action_runs')
      .select('duration_ms')
      .gte('created_at', yesterday.toISOString());
    const avgDuration = durationData && durationData.length > 0
      ? Math.round(durationData.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / durationData.length)
      : 0;

    // Knowledge items count
    const { count: knowledgeCount } = await supabase
      .from('armstrong_knowledge_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Active policies count
    const { count: policiesCount } = await supabase
      .from('armstrong_policies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return {
      actions_24h: actions24h || 0,
      costs_30d_cents: costs30d,
      error_rate_7d: Math.round(errorRate * 100) / 100,
      avg_response_ms_24h: avgDuration,
      knowledge_items_count: knowledgeCount || 0,
      active_policies_count: policiesCount || 0,
    };
  }

  return {
    actions_24h: data.actions_24h || 0,
    costs_30d_cents: data.costs_30d_cents || 0,
    error_rate_7d: parseFloat(String(data.error_rate_7d)) || 0,
    avg_response_ms_24h: data.avg_response_ms_24h || 0,
    knowledge_items_count: data.knowledge_items_count || 0,
    active_policies_count: data.active_policies_count || 0,
  };
}

/**
 * Fetch top actions (last 24h)
 */
async function fetchTopActions(limit: number = 5): Promise<TopAction[]> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('armstrong_action_runs')
    .select('action_code, cost_cents, duration_ms')
    .gte('created_at', yesterday.toISOString());

  if (error) {
    console.error('Error fetching top actions:', error);
    return [];
  }

  // Aggregate by action_code
  const actionMap = new Map<string, { count: number; totalCost: number; totalDuration: number }>();
  
  (data || []).forEach(run => {
    const existing = actionMap.get(run.action_code) || { count: 0, totalCost: 0, totalDuration: 0 };
    actionMap.set(run.action_code, {
      count: existing.count + 1,
      totalCost: existing.totalCost + (run.cost_cents || 0),
      totalDuration: existing.totalDuration + (run.duration_ms || 0),
    });
  });

  // Convert to array and sort by count
  return Array.from(actionMap.entries())
    .map(([action_code, stats]) => ({
      action_code,
      run_count: stats.count,
      total_cost_cents: stats.totalCost,
      avg_duration_ms: Math.round(stats.totalDuration / stats.count),
    }))
    .sort((a, b) => b.run_count - a.run_count)
    .slice(0, limit);
}

/**
 * Fetch recent alerts (derived from failed runs and other signals)
 */
async function fetchRecentAlerts(limit: number = 5): Promise<RecentAlert[]> {
  const alerts: RecentAlert[] = [];

  // Get recent failed runs
  const { data: failedRuns } = await supabase
    .from('armstrong_action_runs')
    .select('id, action_code, error_message, created_at')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(3);

  (failedRuns || []).forEach(run => {
    alerts.push({
      id: run.id,
      type: 'error',
      message: `Action ${run.action_code} fehlgeschlagen${run.error_message ? `: ${run.error_message.substring(0, 100)}` : ''}`,
      action_code: run.action_code,
      created_at: run.created_at,
    });
  });

  // Get items pending review
  const { count: reviewCount } = await supabase
    .from('armstrong_knowledge_items')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'review');

  if (reviewCount && reviewCount > 0) {
    alerts.push({
      id: 'review-queue',
      type: 'info',
      message: `${reviewCount} Knowledge-Item${reviewCount > 1 ? 's' : ''} warten auf Review`,
      created_at: new Date().toISOString(),
    });
  }

  return alerts.slice(0, limit);
}

/**
 * Hook to get dashboard data
 */
export function useArmstrongDashboard() {
  const { data: kpis, isLoading: kpisLoading, error: kpisError, refetch: refetchKpis } = useQuery({
    queryKey: ['armstrong-dashboard-kpis'],
    queryFn: fetchDashboardKPIs,
    staleTime: 30000,
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: topActions, isLoading: topActionsLoading } = useQuery({
    queryKey: ['armstrong-top-actions'],
    queryFn: () => fetchTopActions(5),
    staleTime: 30000,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['armstrong-alerts'],
    queryFn: () => fetchRecentAlerts(5),
    staleTime: 30000,
  });

  return {
    kpis: kpis || {
      actions_24h: 0,
      costs_30d_cents: 0,
      error_rate_7d: 0,
      avg_response_ms_24h: 0,
      knowledge_items_count: 0,
      active_policies_count: 0,
    },
    topActions: topActions || [],
    alerts: alerts || [],
    isLoading: kpisLoading || topActionsLoading || alertsLoading,
    error: kpisError,
    refetch: refetchKpis,
  };
}
