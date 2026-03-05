/**
 * Portal Listings Hook — Phase 2
 * 
 * CRUD for portal_listings + portal_search_runs tables.
 * Handles: persistence, dedupe, status updates, suppression, convert-to-offer.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PortalSearchResult, PortalRunDiagnostics } from '@/hooks/useAcqTools';

// ============================================================================
// TYPES
// ============================================================================

export type ListingStatus = 'new' | 'seen' | 'saved' | 'rejected';

export interface PortalListing {
  id: string;
  tenant_id: string;
  run_id: string | null;
  source_portal: string;
  source_url: string | null;
  title: string;
  price: number | null;
  object_type: string | null;
  living_area_sqm: number | null;
  plot_area_sqm: number | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  rooms: number | null;
  units_count: number | null;
  year_built: number | null;
  gross_yield: number | null;
  broker_name: string | null;
  cluster_fingerprint: string | null;
  status: ListingStatus;
  score: number | null;
  match_reasons_json: any;
  suppressed: boolean;
  notes: string | null;
  tags: string[] | null;
  first_seen_at: string;
  last_seen_at: string;
  linked_offer_id: string | null;
  created_at: string;
}

export interface PortalSearchRun {
  id: string;
  tenant_id: string;
  created_by: string;
  search_params_json: any;
  status: string;
  metrics_json: any;
  total_found: number;
  total_new: number;
  created_at: string;
}

// ============================================================================
// FINGERPRINT HELPER
// ============================================================================

function buildFingerprint(listing: PortalSearchResult): string {
  const city = (listing.city || '').toLowerCase().trim();
  const priceBucket = listing.price ? Math.round(listing.price / 10000) * 10000 : 0;
  const areaBucket = listing.area_sqm ? Math.round(listing.area_sqm / 10) * 10 : 0;
  return `${city}|${priceBucket}|${areaBucket}|${(listing.title || '').slice(0, 30).toLowerCase()}`;
}

// ============================================================================
// QUERIES
// ============================================================================

export function usePortalListings(statusFilter?: ListingStatus) {
  return useQuery({
    queryKey: ['portal-listings', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('portal_listings')
        .select('*')
        .eq('suppressed', false)
        .order('created_at', { ascending: false })
        .limit(200);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PortalListing[];
    },
  });
}

export function usePortalSearchRuns() {
  return useQuery({
    queryKey: ['portal-search-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_search_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as PortalSearchRun[];
    },
  });
}

// ============================================================================
// PERSIST SEARCH RESULTS (called after portal search)
// ============================================================================

export function usePersistSearchResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tenantId,
      userId,
      searchParams,
      results,
      diagnostics,
    }: {
      tenantId: string;
      userId: string;
      searchParams: any;
      results: PortalSearchResult[];
      diagnostics?: PortalRunDiagnostics;
    }) => {
      // 1. Create search run record
      const { data: run, error: runError } = await supabase
        .from('portal_search_runs')
        .insert({
          tenant_id: tenantId,
          created_by: userId,
          search_params_json: searchParams,
          status: 'success',
          metrics_json: diagnostics || {},
          total_found: results.length,
          total_new: 0,
        })
        .select('id')
        .single();

      if (runError) throw runError;

      // 2. Check existing fingerprints for dedupe
      const fingerprints = results.map(r => buildFingerprint(r));
      const { data: existing } = await supabase
        .from('portal_listings')
        .select('cluster_fingerprint')
        .eq('tenant_id', tenantId)
        .in('cluster_fingerprint', fingerprints);

      const existingSet = new Set((existing || []).map(e => e.cluster_fingerprint));

      // 3. Update last_seen_at for existing
      if (existingSet.size > 0) {
        await supabase
          .from('portal_listings')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('tenant_id', tenantId)
          .in('cluster_fingerprint', Array.from(existingSet));
      }

      // 4. Insert only new listings
      const newListings = results
        .filter(r => !existingSet.has(buildFingerprint(r)))
        .map(r => ({
          tenant_id: tenantId,
          run_id: run.id,
          source_portal: r.portal,
          source_url: r.url || null,
          title: r.title,
          price: r.price || null,
          object_type: r.object_type || null,
          living_area_sqm: r.area_sqm || null,
          plot_area_sqm: r.plot_area_sqm || null,
          address: r.address || null,
          city: r.city || null,
          zip_code: r.zip_code || null,
          rooms: r.rooms || null,
          units_count: r.units || null,
          year_built: r.year_built || null,
          gross_yield: r.yield_percent || null,
          broker_name: r.broker_name || null,
          cluster_fingerprint: buildFingerprint(r),
          status: 'new' as const,
        }));

      if (newListings.length > 0) {
        const { error: insertError } = await supabase
          .from('portal_listings')
          .insert(newListings);
        if (insertError) throw insertError;
      }

      // 5. Update run with new count
      await supabase
        .from('portal_search_runs')
        .update({ total_new: newListings.length })
        .eq('id', run.id);

      return {
        runId: run.id,
        totalFound: results.length,
        newCount: newListings.length,
        dedupeCount: existingSet.size,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portal-listings'] });
      queryClient.invalidateQueries({ queryKey: ['portal-search-runs'] });
      toast.success(`${data.newCount} neue Objekte gespeichert (${data.dedupeCount} bereits bekannt)`);
    },
    onError: (error) => {
      toast.error('Speichern fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// STATUS UPDATES
// ============================================================================

export function useUpdateListingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, suppress }: { id: string; status: ListingStatus; suppress?: boolean }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (suppress) {
        update.suppressed = true;
        update.suppression_reason = 'user_rejected';
      }
      const { error } = await supabase
        .from('portal_listings')
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-listings'] });
    },
  });
}

// ============================================================================
// CONVERT TO OFFER (acq_offers)
// ============================================================================

export function useConvertToOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listing, tenantId }: { listing: PortalListing; tenantId: string }) => {
      // Create acq_offers record
      const { data: offer, error: offerError } = await supabase
        .from('acq_offers')
        .insert({
          tenant_id: tenantId,
          title: listing.title,
          price_asking: listing.price,
          address: listing.address,
          city: listing.city,
          postal_code: listing.zip_code,
          area_sqm: listing.living_area_sqm,
          units_count: listing.units_count,
          year_built: listing.year_built,
          yield_indicated: listing.gross_yield,
          source_url: listing.source_url,
          source_type: 'portal' as any,
          provider_name: listing.broker_name,
          status: 'new' as any,
        })
        .select('id')
        .single();

      if (offerError) throw offerError;

      // Link listing to offer
      await supabase
        .from('portal_listings')
        .update({
          linked_offer_id: offer.id,
          status: 'saved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', listing.id);

      return offer.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-listings'] });
      toast.success('Objekt in Objekteingang übernommen');
    },
    onError: (error) => {
      toast.error('Übernahme fehlgeschlagen: ' + (error as Error).message);
    },
  });
}
