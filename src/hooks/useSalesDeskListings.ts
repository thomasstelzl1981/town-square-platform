 /**
  * useSalesDeskListings - Hook for Zone 1 Sales Desk to fetch and manage listings
  */
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 export interface SalesDeskListing {
   id: string;
   title: string;
   status: string;
   asking_price: number | null;
   commission_rate: number | null;
   partner_visibility: string | null;
   is_blocked: boolean;
   created_at: string;
   property: {
     id: string;
     code: string | null;
     address: string | null;
     city: string | null;
   } | null;
   unit: {
     id: string;
     unit_number: string | null;
   } | null;
   publications: {
     channel: string;
     status: string;
   }[];
   tenant: {
     id: string;
     name: string | null;
   } | null;
 }
 
 export function useSalesDeskListings() {
   return useQuery({
     queryKey: ['sales-desk-listings'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('listings')
         .select(`
           id, title, status, asking_price, commission_rate, partner_visibility, is_blocked, created_at,
           property:properties(id, code, address, city),
           unit:units(id, unit_number),
           publications:listing_publications(channel, status),
           tenant:organizations(id, name)
         `)
         .in('status', ['active', 'reserved'])
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       return (data || []) as SalesDeskListing[];
     },
   });
 }
 
 export function useToggleListingBlock() {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async ({ listingId, blocked }: { listingId: string; blocked: boolean }) => {
       const { error } = await supabase
         .from('listings')
         .update({ is_blocked: blocked })
         .eq('id', listingId);
       if (error) throw error;
     },
     onSuccess: (_, { blocked }) => {
       queryClient.invalidateQueries({ queryKey: ['sales-desk-listings'] });
       toast.success(blocked ? 'Listing blockiert' : 'Listing freigegeben');
     },
     onError: (err: Error) => toast.error(err.message),
   });
 }
 
 export function useUpdateListingDistribution() {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async ({ 
       listingId, 
       tenantId,
       channel, 
       enabled 
     }: { 
       listingId: string; 
       tenantId: string;
       channel: 'partner_network' | 'kaufy'; 
       enabled: boolean;
     }) => {
       if (enabled) {
         const { error } = await supabase
           .from('listing_publications')
           .upsert({
             listing_id: listingId,
             tenant_id: tenantId,
             channel,
             status: 'active',
             published_at: new Date().toISOString(),
           }, { onConflict: 'listing_id,channel' });
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('listing_publications')
           .update({ status: 'paused', removed_at: new Date().toISOString() })
           .eq('listing_id', listingId)
           .eq('channel', channel);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['sales-desk-listings'] });
       toast.success('Distribution aktualisiert');
     },
     onError: (err: Error) => toast.error(err.message),
   });
 }