/**
 * usePetCapacity — Kapazitäts- und Belegungsprüfung für Pet Manager
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CapacityResult {
  totalCapacity: number;
  bookedToday: number;
  availableSlots: number;
  isFullyBooked: boolean;
  slotCapacity: number; // sum of max_bookings for today's weekday
}

export function usePetCapacity(providerId?: string, date?: string) {
  const { activeTenantId } = useAuth();
  const targetDate = date || new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date(targetDate).getDay(); // 0=Sun, 1=Mon...

  return useQuery({
    queryKey: ['pet_capacity', providerId, targetDate],
    queryFn: async (): Promise<CapacityResult> => {
      if (!providerId || !activeTenantId) {
        return { totalCapacity: 0, bookedToday: 0, availableSlots: 0, isFullyBooked: true, slotCapacity: 0 };
      }

      // Parallel: provider capacity, availability slots, booked count
      const [providerRes, availRes, bookingsRes] = await Promise.all([
        supabase
          .from('pet_providers')
          .select('max_daily_capacity')
          .eq('id', providerId)
          .single(),
        supabase
          .from('pet_provider_availability')
          .select('max_bookings')
          .eq('provider_id', providerId)
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true),
        supabase
          .from('pet_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', providerId)
          .eq('scheduled_date', targetDate)
          .in('status', ['confirmed', 'in_progress']),
      ]);

      const maxDaily = (providerRes.data as any)?.max_daily_capacity ?? 12;
      const slotCapacity = (availRes.data || []).reduce((sum: number, s: any) => sum + (s.max_bookings || 0), 0);
      const totalCapacity = Math.min(maxDaily, slotCapacity > 0 ? slotCapacity : maxDaily);
      const bookedToday = bookingsRes.count ?? 0;

      return {
        totalCapacity,
        bookedToday,
        availableSlots: Math.max(0, totalCapacity - bookedToday),
        isFullyBooked: bookedToday >= totalCapacity,
        slotCapacity,
      };
    },
    enabled: !!providerId && !!activeTenantId,
  });
}

/** Weekly booking count for KPI */
export function useWeeklyBookingCount(providerId?: string) {
  const { activeTenantId } = useAuth();
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return useQuery({
    queryKey: ['pet_weekly_bookings', providerId, monday.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!providerId || !activeTenantId) return 0;
      const { count } = await supabase
        .from('pet_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .gte('scheduled_date', monday.toISOString().split('T')[0])
        .lte('scheduled_date', sunday.toISOString().split('T')[0])
        .in('status', ['confirmed', 'in_progress', 'completed']);
      return count ?? 0;
    },
    enabled: !!providerId && !!activeTenantId,
  });
}

/** Monthly revenue for KPI */
export function useMonthlyRevenue(providerId?: string) {
  const { activeTenantId } = useAuth();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  return useQuery({
    queryKey: ['pet_monthly_revenue', providerId, monthStart],
    queryFn: async () => {
      if (!providerId || !activeTenantId) return 0;
      const { data } = await supabase
        .from('pet_bookings')
        .select('price_cents')
        .eq('provider_id', providerId)
        .gte('scheduled_date', monthStart)
        .in('status', ['confirmed', 'in_progress', 'completed']);
      return (data || []).reduce((sum, b: any) => sum + (b.price_cents || 0), 0);
    },
    enabled: !!providerId && !!activeTenantId,
  });
}
