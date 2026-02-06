/**
 * Hook for Partner Listing Selections
 * Manages favorite/selected listings for sales partners
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
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as PartnerSelection[];
    }
  });
}

export function useToggleSelection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ listingId, isSelected }: { listingId: string; isSelected: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');
      
      if (isSelected) {
        // Remove selection (soft delete)
        const { error } = await supabase
          .from('partner_listing_selections')
          .update({ is_active: false })
          .eq('partner_user_id', user.id)
          .eq('listing_id', listingId);
          
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Check if exists but inactive
        const { data: existing } = await supabase
          .from('partner_listing_selections')
          .select('id')
          .eq('partner_user_id', user.id)
          .eq('listing_id', listingId)
          .maybeSingle();
          
        if (existing) {
          // Reactivate
          const { error } = await supabase
            .from('partner_listing_selections')
            .update({ is_active: true, selected_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          // Get tenant_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('active_tenant_id')
            .eq('id', user.id)
            .single();
            
          // Add selection
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
        return { action: 'added' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['partner-selections'] });
      queryClient.invalidateQueries({ queryKey: ['partner-katalog'] });
      toast.success(result.action === 'added' ? 'Objekt vorgemerkt' : 'Vormerkung entfernt');
    },
    onError: () => {
      toast.error('Fehler beim Speichern der Auswahl');
    }
  });
}

export function useSelectedListings() {
  return useQuery({
    queryKey: ['partner-selected-listings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('partner_listing_selections')
        .select(`
          id,
          listing_id,
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
        .eq('is_active', true)
        .order('selected_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });
}
