/**
 * useCompletedTaskWidgets — Fetches completed/cancelled task widgets from DB
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

export function useCompletedTaskWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('task_widgets')
        .select('*')
        .in('status', ['completed', 'cancelled'])
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[useCompletedTaskWidgets] Fetch error:', error);
      } else {
        setWidgets((data as unknown as TaskWidgetRow[]).map(rowToWidget));
      }
      setIsLoading(false);
    };
    fetch();
  }, []);

  const handleDelete = useCallback(async (widgetId: string) => {
    const { error } = await supabase
      .from('task_widgets')
      .delete()
      .eq('id', widgetId);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      setWidgets(prev => prev.filter(w => w.id !== widgetId));
      toast.success('Widget gelöscht');
    }
  }, []);

  return { widgets, isLoading, handleDelete };
}
