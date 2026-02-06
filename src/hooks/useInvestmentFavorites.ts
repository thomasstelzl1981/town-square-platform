/**
 * Hook for Investment Favorites (MOD-08)
 * Manages favorite listings for investors with search params and burden calculation
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SearchParams {
  zve: number; // zu versteuerndes Einkommen
  equity: number; // Eigenkapital
  maritalStatus: 'single' | 'married';
  hasChurchTax: boolean;
  churchTaxState?: string;
}

export interface InvestmentFavorite {
  id: string;
  tenant_id: string;
  investment_profile_id: string;
  listing_id: string | null;
  external_listing_url: string | null;
  external_listing_id: string | null;
  source: string | null;
  title: string | null;
  price: number | null;
  location: string | null;
  property_data: Record<string, unknown> | null;
  notes: string | null;
  status: string;
  search_params: SearchParams | Record<string, unknown> | null;
  calculated_burden: number | null;
  created_at: string;
  updated_at: string;
}

export interface FavoriteWithListing extends InvestmentFavorite {
  listing?: {
    id: string;
    title: string;
    asking_price: number;
    properties: {
      address: string;
      city: string;
      property_type: string;
      total_area_sqm: number | null;
    } | null;
  } | null;
}

// Get or create investment profile for current user
async function getOrCreateInvestmentProfile(tenantId: string, userId: string): Promise<string> {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('investment_profiles')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('contact_id', userId)
    .maybeSingle();

  if (existing) return existing.id;

  // Create new profile
  const { data: newProfile, error } = await supabase
    .from('investment_profiles')
    .insert({
      tenant_id: tenantId,
      contact_id: userId,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) throw error;
  return newProfile.id;
}

/**
 * Fetch all active favorites for current user
 */
export function useInvestmentFavorites() {
  const { activeTenantId } = useAuth();

  return useQuery({
    queryKey: ['investment-favorites', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];

      const { data, error } = await supabase
        .from('investment_favorites')
        .select(`
          *,
          listing:listings (
            id,
            title,
            asking_price,
            properties (
              address,
              city,
              property_type,
              total_area_sqm
            )
          )
        `)
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map to our interface - the DB types are compatible
      return (data || []) as unknown as FavoriteWithListing[];
    },
    enabled: !!activeTenantId,
  });
}

/**
 * Check if a specific listing is favorited
 */
export function useIsFavorite(listingId: string | null) {
  const { data: favorites } = useInvestmentFavorites();
  
  if (!listingId || !favorites) return false;
  return favorites.some(f => f.listing_id === listingId);
}

/**
 * Toggle favorite status for a listing
 */
export function useToggleInvestmentFavorite() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();

  return useMutation({
    mutationFn: async ({
      listingId,
      title,
      price,
      location,
      propertyData,
      searchParams,
      calculatedBurden,
      isCurrentlyFavorite,
    }: {
      listingId: string;
      title: string;
      price: number;
      location: string;
      propertyData?: Record<string, unknown>;
      searchParams?: SearchParams;
      calculatedBurden?: number;
      isCurrentlyFavorite: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || !activeTenantId) throw new Error('Not authenticated');

      if (isCurrentlyFavorite) {
        // Remove favorite (soft delete)
        const { error } = await supabase
          .from('investment_favorites')
          .update({ status: 'removed', updated_at: new Date().toISOString() })
          .eq('listing_id', listingId)
          .eq('tenant_id', activeTenantId)
          .eq('status', 'active');

        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        // Add favorite
        const profileId = await getOrCreateInvestmentProfile(activeTenantId, user.id);

        // Check if exists but inactive
        const { data: existing } = await supabase
          .from('investment_favorites')
          .select('id')
          .eq('listing_id', listingId)
          .eq('tenant_id', activeTenantId)
          .maybeSingle();

        if (existing) {
          // Reactivate
          const { error } = await supabase
            .from('investment_favorites')
            .update({
              status: 'active',
              search_params: searchParams || {},
              calculated_burden: calculatedBurden,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          // Create new - cast to bypass generated types (new columns added via migration)
          const insertData = {
            tenant_id: activeTenantId,
            investment_profile_id: profileId,
            listing_id: listingId,
            source: 'platform',
            title,
            price,
            location,
            property_data: propertyData || {},
            search_params: searchParams || {},
            calculated_burden: calculatedBurden,
            status: 'active',
          };

          const { error } = await supabase
            .from('investment_favorites')
            .insert(insertData as any);

          if (error) throw error;
        }
        return { action: 'added' as const };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['investment-favorites'] });
      toast.success(result.action === 'added' ? 'Objekt zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt');
    },
    onError: (error) => {
      console.error('Toggle favorite error:', error);
      toast.error('Fehler beim Speichern des Favoriten');
    },
  });
}

/**
 * Update notes for a favorite
 */
export function useUpdateFavoriteNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ favoriteId, notes }: { favoriteId: string; notes: string }) => {
      const { error } = await supabase
        .from('investment_favorites')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', favoriteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-favorites'] });
      toast.success('Notiz gespeichert');
    },
    onError: () => {
      toast.error('Fehler beim Speichern der Notiz');
    },
  });
}

/**
 * Remove a favorite (soft delete)
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from('investment_favorites')
        .update({ status: 'removed', updated_at: new Date().toISOString() })
        .eq('id', favoriteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-favorites'] });
      toast.success('Aus Favoriten entfernt');
    },
    onError: () => {
      toast.error('Fehler beim Entfernen');
    },
  });
}
