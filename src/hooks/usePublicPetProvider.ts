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
