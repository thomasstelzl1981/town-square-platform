/**
 * Hook for Partner Listing Exclusions
 * 
 * LOGIK-ÄNDERUNG: 
 * - Alle Objekte sind standardmäßig SICHTBAR
 * - ♥ klicken = Objekt AUSBLENDEN (Abwahl statt Auswahl)
 * - is_active=true bedeutet jetzt "ausgeblendet"
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PartnerSelection {
  id: string;
  partner_user_id: string;
  listing_id: string;
  is_active: boolean;
  selected_at: string;
  created_at: string;
}

/**
 * Holt alle Exclusions (ausgeblendete Objekte) des Partners
 * is_active=true bedeutet "ausgeblendet"
 */
export function usePartnerSelections() {
  return useQuery({
    queryKey: ['partner-selections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('partner_listing_selections')
        .select('*')
        .eq('partner_user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as PartnerSelection[];
    }
  });
}

/**
 * Holt nur die IDs der ausgeblendeten Objekte
 */
export function useExcludedListingIds() {
  const { data: selections = [] } = usePartnerSelections();
  return new Set(
    selections.filter(s => s.is_active).map(s => s.listing_id)
  );
}

/**
 * Toggle-Mutation für Ausblenden/Einblenden
 * isExcluded=true → Objekt wird wieder eingeblendet (is_active=false)
 * isExcluded=false → Objekt wird ausgeblendet (is_active=true)
 */
export function useToggleExclusion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ listingId, isCurrentlyExcluded }: { listingId: string; isCurrentlyExcluded: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');
      
      if (isCurrentlyExcluded) {
        // Wieder einblenden → is_active = false
        const { error } = await supabase
          .from('partner_listing_selections')
          .update({ is_active: false })
          .eq('partner_user_id', user.id)
          .eq('listing_id', listingId);
          
        if (error) throw error;
        return { action: 'shown' };
      } else {
        // Ausblenden → is_active = true
        const { data: existing } = await supabase
          .from('partner_listing_selections')
          .select('id')
          .eq('partner_user_id', user.id)
          .eq('listing_id', listingId)
          .maybeSingle();
          
        if (existing) {
          const { error } = await supabase
            .from('partner_listing_selections')
            .update({ is_active: true, selected_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('active_tenant_id')
            .eq('id', user.id)
            .single();
            
          const { error } = await supabase
            .from('partner_listing_selections')
            .insert({
              partner_user_id: user.id,
              listing_id: listingId,
              tenant_id: profile?.active_tenant_id,
              is_active: true
            });
            
          if (error) throw error;
        }
        return { action: 'hidden' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['partner-selections'] });
      queryClient.invalidateQueries({ queryKey: ['partner-katalog'] });
      queryClient.invalidateQueries({ queryKey: ['partner-beratung-listings'] });
      toast.success(result.action === 'hidden' ? 'Objekt ausgeblendet' : 'Objekt wieder sichtbar');
    },
    onError: () => {
      toast.error('Fehler beim Speichern');
    }
  });
}

// Legacy exports for backwards compatibility
export function useToggleSelection() {
  return useToggleExclusion();
}

export function useSelectedListings() {
  return useQuery({
    queryKey: ['partner-selected-listings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      
      // Note: This now returns EXCLUDED listings (is_active=true means hidden)
      const { data, error } = await supabase
        .from('partner_listing_selections')
        .select(`
          id,
          listing_id,
          is_active,
          selected_at,
          created_at,
          listing:listings (
            id,
            title,
            asking_price,
            commission_rate,
            status,
            properties (
              address,
              city,
              property_type,
              total_area_sqm
            )
          )
        `)
        .eq('partner_user_id', user.id)
        .order('selected_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });
}
