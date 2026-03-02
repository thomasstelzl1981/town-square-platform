 /**
  * useSalesDeskListings - Hook for Zone 1 Sales Desk to fetch and manage listings
  * Records SLC events on distribution changes.
  * Computes listing hashes for channel drift detection.
  */
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { findOrCreateCase } from './useSLCEventRecorder';
 import type { SLCEventType, SLCPhase } from '@/engines/slc/spec';
 import { SLC_EVENT_PHASE_MAP } from '@/engines/slc/spec';
 import { isValidTransition } from '@/engines/slc/engine';
 import { computeListingHash } from '@/lib/listingHash';
 
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
          // Compute listing hash for drift detection
          const { data: listingData } = await supabase
            .from('listings')
            .select('title, asking_price, commission_rate, status')
            .eq('id', listingId)
            .single();
          const expectedHash = listingData ? computeListingHash(listingData) : null;

          const { error } = await supabase
            .from('listing_publications')
            .upsert({
              listing_id: listingId,
              tenant_id: tenantId,
              channel,
              status: 'active',
              published_at: new Date().toISOString(),
              expected_hash: expectedHash,
              last_synced_hash: expectedHash, // Initially in sync
              last_synced_at: new Date().toISOString(),
            }, { onConflict: 'listing_id,channel' });
          if (error) throw error;

          // Record SLC channel.published event
          try {
            const slcCase = await findOrCreateCase({
              listingId,
              assetType: 'property_unit',
              assetId: listingId,
              tenantId,
              userId: '',
            });
            const targetPhase = SLC_EVENT_PHASE_MAP['channel.published'];
            const phaseAfter = targetPhase && isValidTransition(slcCase.current_phase as SLCPhase, targetPhase) ? targetPhase : null;
            await supabase.from('sales_lifecycle_events').insert({
              case_id: slcCase.id,
              event_type: 'channel.published',
              severity: 'info',
              phase_before: slcCase.current_phase as any,
              phase_after: (phaseAfter || slcCase.current_phase) as any,
              payload: { channel } as any,
              tenant_id: tenantId,
            });
            if (phaseAfter) {
              await supabase.from('sales_cases')
                .update({ current_phase: phaseAfter as any, updated_at: new Date().toISOString() })
                .eq('id', slcCase.id);
            }
          } catch (e) {
            console.warn('[SLC] Event recording failed:', e);
          }
        } else {
          const { error } = await supabase
            .from('listing_publications')
            .update({ status: 'paused', removed_at: new Date().toISOString() })
            .eq('listing_id', listingId)
            .eq('channel', channel);
          if (error) throw error;

          // Record SLC channel.removed event
          try {
            const { data: slcCase } = await supabase
              .from('sales_cases')
              .select('id, current_phase')
              .eq('listing_id', listingId)
              .is('closed_at', null)
              .maybeSingle();
            if (slcCase) {
              await supabase.from('sales_lifecycle_events').insert({
                case_id: slcCase.id,
                event_type: 'channel.removed',
                severity: 'warning',
                phase_before: slcCase.current_phase as any,
                phase_after: slcCase.current_phase as any,
                payload: { channel } as any,
                tenant_id: tenantId,
              });
            }
          } catch (e) {
            console.warn('[SLC] Event recording failed:', e);
          }
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sales-desk-listings'] });
        queryClient.invalidateQueries({ queryKey: ['sales-desk-cases'] });
        queryClient.invalidateQueries({ queryKey: ['sales-desk-recent-events'] });
        toast.success('Distribution aktualisiert');
      },
      onError: (err: Error) => toast.error(err.message),
    });
  }