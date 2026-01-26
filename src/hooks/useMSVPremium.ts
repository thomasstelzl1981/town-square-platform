import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check MSV Premium status for the current tenant.
 * Returns isPremium, activeUnits count, and loading state.
 */
export const useMSVPremium = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['msv-premium-status'],
    queryFn: async () => {
      // Fetch active premium enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('msv_enrollments')
        .select('id, property_id, tier, status, credits_per_unit')
        .eq('status', 'active')
        .eq('tier', 'premium');

      if (enrollError) throw enrollError;

      // Count active units across enrolled properties
      let activeUnits = 0;
      if (enrollments && enrollments.length > 0) {
        const propertyIds = enrollments.map(e => e.property_id);
        
        const { count } = await supabase
          .from('units')
          .select('id', { count: 'exact', head: true })
          .in('property_id', propertyIds);
        
        activeUnits = count || 0;
      }

      return {
        isPremium: (enrollments?.length || 0) > 0,
        activeUnits,
        enrollments: enrollments || []
      };
    }
  });

  return {
    isPremium: data?.isPremium ?? false,
    activeUnits: data?.activeUnits ?? 0,
    enrollments: data?.enrollments ?? [],
    isLoading
  };
};

/**
 * Hook to fetch and update MSV communication preferences.
 */
export const useMSVCommunicationPrefs = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['msv-communication-prefs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('msv_communication_prefs')
        .select('*')
        .eq('scope_type', 'tenant')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  return {
    prefs: data,
    isLoading,
    refetch
  };
};
