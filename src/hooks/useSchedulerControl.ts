/**
 * useSchedulerControl — Hook for Discovery Scheduler status & toggle
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SchedulerConfig {
  active: boolean;
  cron_schedule: string;
  target_per_day: number;
  max_credits_per_day: number;
}

export interface SchedulerRunEntry {
  id: string;
  created_at: string;
  region_name?: string;
  category_code?: string;
  raw_found?: number;
  duplicates_skipped?: number;
  approved_count?: number;
  credits_used?: number;
  cost_eur?: number;
  error_message?: string;
}

export interface LedgerStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface SchedulerStatus {
  settings: SchedulerConfig;
  recentRuns: SchedulerRunEntry[];
  todayCost: number;
  todayCredits: number;
  ledger: LedgerStats;
}

export function useSchedulerStatus() {
  return useQuery<SchedulerStatus>({
    queryKey: ['scheduler-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-scheduler-control', {
        method: 'GET',
      });
      if (error) throw error;
      return data as SchedulerStatus;
    },
    refetchInterval: 30_000,
  });
}

export function useSchedulerToggle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, config }: { action: 'activate' | 'deactivate'; config?: Partial<SchedulerConfig> }) => {
      const { data, error } = await supabase.functions.invoke('sot-scheduler-control', {
        method: 'POST',
        body: { action, config },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduler-status'] }),
  });
}

export function useSchedulerConfigUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<SchedulerConfig>) => {
      const { data, error } = await supabase.functions.invoke('sot-scheduler-control', {
        method: 'POST',
        body: { action: 'update_config', config },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduler-status'] }),
  });
}
