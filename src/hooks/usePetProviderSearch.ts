/**
 * usePetProviderSearch — Hook für die Anbieter-Suche in Caring
 * 
 * HINWEIS: PLZ-basierte Filterung ist Engine-Sache (Zone 1).
 * Aktuell lädt der Hook alle aktiven Provider und filtert optional clientseitig.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchProvider {
  id: string;
  company_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  rating_avg: number | null;
  cover_image_url: string | null;
  service_area_postal_codes: string[] | null;
  services: string[];
}

export function useSearchProviders(location?: string, category?: string) {
  return useQuery({
    queryKey: ['pet_provider_search', location, category],
    queryFn: async () => {
      // Load all active providers with their services
      const { data: providers, error: pErr } = await supabase
        .from('pet_providers')
        .select('id, company_name, address, phone, email, bio, rating_avg, cover_image_url, service_area_postal_codes')
        .eq('status', 'active')
        .eq('is_published', true);
      if (pErr) throw pErr;

      const { data: services, error: sErr } = await supabase
        .from('pet_services')
        .select('provider_id, category')
        .eq('is_active', true);
      if (sErr) throw sErr;

      // Group services by provider
      const serviceMap = new Map<string, string[]>();
      for (const s of services || []) {
        const existing = serviceMap.get(s.provider_id) || [];
        if (!existing.includes(s.category)) existing.push(s.category);
        serviceMap.set(s.provider_id, existing);
      }

      let results: SearchProvider[] = (providers || []).map(p => ({
        ...p,
        services: serviceMap.get(p.id) || [],
      }));

      // Filter by category if set
      if (category) {
        results = results.filter(p => p.services.includes(category));
      }

      // Filter by postal code (basic client-side, engine will replace later)
      if (location && location.trim()) {
        const loc = location.trim().toLowerCase();
        results = results.filter(p => {
          // Match against service_area_postal_codes or address
          if (p.service_area_postal_codes?.some(code => code.toLowerCase().startsWith(loc))) return true;
          if (p.address?.toLowerCase().includes(loc)) return true;
          return false;
        });
      }

      return results;
    },
    enabled: true, // Always enabled when search triggered
  });
}

export function useProviderDetail(providerId?: string) {
  return useQuery({
    queryKey: ['pet_provider_detail', providerId],
    queryFn: async () => {
      if (!providerId) return null;
      const { data, error } = await supabase
        .from('pet_providers')
        .select('*')
        .eq('id', providerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });
}
