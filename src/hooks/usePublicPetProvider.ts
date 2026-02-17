/**
 * usePublicPetProvider — Cross-tenant hooks for viewing provider data
 * These do NOT filter by tenant_id, allowing clients to see provider-tenant data.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PetService, ProviderAvailability } from './usePetBookings';

export function usePublicProviderServices(providerId?: string) {
  return useQuery({
    queryKey: ['public_pet_services', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await supabase
        .from('pet_services')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('category');
      if (error) throw error;
      return (data || []) as PetService[];
    },
    enabled: !!providerId,
  });
}

export function usePublicProviderAvailability(providerId?: string) {
  return useQuery({
    queryKey: ['public_pet_availability', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await supabase
        .from('pet_provider_availability')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('day_of_week');
      if (error) throw error;
      return (data || []) as ProviderAvailability[];
    },
    enabled: !!providerId,
  });
}

/** Blocked dates for a provider (single dates they've marked as unavailable) */
export function usePublicProviderBlockedDates(providerId?: string) {
  return useQuery({
    queryKey: ['public_pet_blocked_dates', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('pet_provider_blocked_dates')
        .select('blocked_date, reason')
        .eq('provider_id', providerId)
        .gte('blocked_date', today)
        .order('blocked_date');
      if (error) throw error;
      return (data || []) as { blocked_date: string; reason: string | null }[];
    },
    enabled: !!providerId,
  });
}

/** Count of confirmed/in_progress bookings per date for a provider */
export function usePublicProviderBookingCounts(providerId?: string) {
  return useQuery({
    queryKey: ['public_pet_booking_counts', providerId],
    queryFn: async () => {
      if (!providerId) return new Map<string, number>();
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('pet_bookings')
        .select('scheduled_date')
        .eq('provider_id', providerId)
        .gte('scheduled_date', today)
        .in('status', ['confirmed', 'in_progress', 'requested']);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data || []) {
        const d = (row as any).scheduled_date;
        counts.set(d, (counts.get(d) || 0) + 1);
      }
      return counts;
    },
    enabled: !!providerId,
  });
}
