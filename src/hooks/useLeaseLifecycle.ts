/**
 * useLeaseLifecycle — Client hook for TLC consumption
 * 
 * Provides lifecycle events, tasks, and analysis results for a lease or all leases.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TLCPhase, TLCSeverity, TenancyTaskStatus } from '@/engines/tenancyLifecycle/spec';

export interface LifecycleEvent {
  id: string;
  lease_id: string;
  event_type: string;
  phase: string;
  severity: string;
  title: string;
  description: string | null;
  payload: Record<string, unknown>;
  triggered_by: string;
  resolved_at: string | null;
  created_at: string;
}

export interface TenancyTask {
  id: string;
  lease_id: string | null;
  property_id: string | null;
  task_type: string;
  category: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function useLeaseLifecycle(leaseId?: string) {
  const { session } = useAuth();
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [tasks, setTasks] = useState<TenancyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);

    try {
      // Fetch events
      let eventsQuery = supabase
        .from('tenancy_lifecycle_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (leaseId) {
        eventsQuery = eventsQuery.eq('lease_id', leaseId);
      }

      const { data: eventsData } = await eventsQuery;
      setEvents((eventsData as LifecycleEvent[]) || []);

      // Fetch tasks
      let tasksQuery = supabase
        .from('tenancy_tasks')
        .select('*')
        .not('status', 'in', '("closed","cancelled")')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (leaseId) {
        tasksQuery = tasksQuery.eq('lease_id', leaseId);
      }

      const { data: tasksData } = await tasksQuery;
      setTasks((tasksData as TenancyTask[]) || []);
    } catch (err) {
      console.error('[TLC] Error fetching lifecycle data:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user, leaseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived state
  const unresolvedEvents = events.filter(e => !e.resolved_at);
  const criticalEventsArr = unresolvedEvents.filter(e => e.severity === 'critical' || e.severity === 'action_required');

  // Dispatch Armstrong proactive hints for critical TLC events
  useEffect(() => {
    if (criticalEventsArr.length === 0) return;
    const latest = criticalEventsArr[0];
    window.dispatchEvent(new CustomEvent('armstrong:proactive', {
      detail: {
        module: 'MOD-04',
        hint: `⚠️ TLC-Alert: ${latest.title}. ${latest.description || ''} — Soll ich helfen?`,
      },
    }));
  }, [criticalEventsArr.length]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('tlc-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenancy_lifecycle_events' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenancy_tasks' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user, fetchData]);

  // Derived state
  const unresolvedEvents = events.filter(e => !e.resolved_at);
  const criticalEvents = unresolvedEvents.filter(e => e.severity === 'critical' || e.severity === 'action_required');
  const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'in_progress');
  const urgentTasks = openTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

  const resolveEvent = useCallback(async (eventId: string) => {
    await supabase
      .from('tenancy_lifecycle_events')
      .update({ resolved_at: new Date().toISOString(), resolved_by: session?.user?.id })
      .eq('id', eventId);
  }, [session?.user?.id]);

  const updateTaskStatus = useCallback(async (taskId: string, status: TenancyTaskStatus) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'resolved' || status === 'closed') {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = session?.user?.id;
    }
    await supabase.from('tenancy_tasks').update(updates).eq('id', taskId);
  }, [session?.user?.id]);

  return {
    events,
    tasks,
    loading,
    unresolvedEvents,
    criticalEvents,
    openTasks,
    urgentTasks,
    resolveEvent,
    updateTaskStatus,
    refetch: fetchData,
  };
}
