/**
 * useTaskWidgets — CRUD + Realtime hook for task_widgets table
 * 
 * Provides:
 * - Live list of task widgets for the current tenant
 * - Confirm (complete) and cancel mutations
 * - Realtime subscription for instant updates (Armstrong → Dashboard)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Widget, WidgetStatus } from '@/types/widget';

interface TaskWidgetRow {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  risk_level: string;
  cost_model: string;
  action_code: string | null;
  parameters: Record<string, unknown> | null;
  source: string;
  source_ref: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToWidget(row: TaskWidgetRow): Widget {
  return {
    id: row.id,
    type: row.type as Widget['type'],
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as WidgetStatus,
    risk_level: row.risk_level as Widget['risk_level'],
    cost_model: row.cost_model as Widget['cost_model'],
    action_code: row.action_code ?? undefined,
    parameters: row.parameters ?? undefined,
    created_at: row.created_at,
    completed_at: row.completed_at ?? undefined,
  };
}

export function useTaskWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Initial fetch
  useEffect(() => {
    const fetchWidgets = async () => {
      const { data, error } = await supabase
        .from('task_widgets')
        .select('*')
        .in('status', ['pending', 'executing'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useTaskWidgets] Fetch error:', error);
      } else {
        setWidgets((data as unknown as TaskWidgetRow[]).map(rowToWidget));
      }
      setIsLoading(false);
    };

    fetchWidgets();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('task_widgets_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_widgets' },
        (payload) => {
          const newWidget = rowToWidget(payload.new as unknown as TaskWidgetRow);
          setWidgets(prev => [newWidget, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'task_widgets' },
        (payload) => {
          const updated = rowToWidget(payload.new as unknown as TaskWidgetRow);
          setWidgets(prev =>
            prev.map(w => (w.id === updated.id ? updated : w))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Confirm (complete) a widget
  const handleConfirm = useCallback(async (widgetId: string) => {
    setExecutingId(widgetId);

    const { error } = await supabase
      .from('task_widgets')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', widgetId);

    setExecutingId(null);

    if (error) {
      toast.error('Fehler bei der Ausführung');
      console.error('[useTaskWidgets] Confirm error:', error);
    } else {
      setWidgets(prev => prev.filter(w => w.id !== widgetId));
      toast.success('Aktion erfolgreich ausgeführt', {
        description: 'Der Auftrag wurde zur Sendung freigegeben.',
      });
    }
  }, []);

  // Cancel a widget
  const handleCancel = useCallback(async (widgetId: string) => {
    const { error } = await supabase
      .from('task_widgets')
      .update({ status: 'cancelled' })
      .eq('id', widgetId);

    if (error) {
      toast.error('Fehler beim Abbrechen');
      console.error('[useTaskWidgets] Cancel error:', error);
    } else {
      setWidgets(prev => prev.filter(w => w.id !== widgetId));
      toast.info('Aktion abgebrochen', {
        description: 'Die Aktion wurde nicht ausgeführt.',
      });
    }
  }, []);

  // Only pending widgets for display
  const pendingWidgets = widgets.filter(w => w.status === 'pending');

  return {
    widgets: pendingWidgets,
    isLoading,
    executingId,
    handleConfirm,
    handleCancel,
  };
}
