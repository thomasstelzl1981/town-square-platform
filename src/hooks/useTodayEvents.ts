/**
 * useTodayEvents Hook — Fetches today's calendar events for the current user
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  location: string | null;
  description: string | null;
}

export function useTodayEvents() {
  const { activeOrganization, user } = useAuth();

  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events-today', activeOrganization?.id, user?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, start_at, end_at, location, description')
        .eq('tenant_id', activeOrganization.id)
        .gte('start_at', startOfDay.toISOString())
        .lte('start_at', endOfDay.toISOString())
        .order('start_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch today events:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!activeOrganization?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
