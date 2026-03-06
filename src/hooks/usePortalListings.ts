/**
 * Portal Listings Hook — Phase 2 (Unified)
 * 
 * Persists portal search results directly into acq_offers.
 * portal_search_runs kept for diagnostics/logging only.
 * portal_listings table no longer used as user-facing inbox.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PortalSearchResult, PortalRunDiagnostics } from '@/hooks/useAcqTools';

// ============================================================================
// PERSIST SEARCH RESULTS → acq_offers (unified inbox)
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
      // 1. Log the search run for diagnostics
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

      // 2. Dedupe: check existing source_urls in acq_offers
      const sourceUrls = results.map(r => r.url).filter(Boolean) as string[];
      const existingUrls = new Set<string>();

      if (sourceUrls.length > 0) {
        const { data: existing } = await supabase
          .from('acq_offers')
          .select('source_url')
          .eq('tenant_id', tenantId)
          .in('source_url', sourceUrls);
        (existing || []).forEach(e => {
          if (e.source_url) existingUrls.add(e.source_url);
        });
      }

      // 3. Insert only new offers
      const newResults = results.filter(r => !r.url || !existingUrls.has(r.url));

      if (newResults.length > 0) {
        const offersToInsert = newResults.map(r => ({
          tenant_id: tenantId,
          title: r.title || 'Portal-Treffer',
          price_asking: r.price || null,
          address: r.address || null,
          city: r.city || null,
          postal_code: r.zip_code || null,
          area_sqm: r.area_sqm || null,
          units_count: r.units || null,
          year_built: r.year_built || null,
          yield_indicated: r.yield_percent || null,
          source_url: r.url || null,
          source_type: 'portal' as const,
          provider_name: r.broker_name || r.portal || null,
          status: 'new' as const,
          notes: `Portal: ${r.portal}`,
        }));

        const { error: insertError } = await supabase
          .from('acq_offers')
          .insert(offersToInsert);
        if (insertError) throw insertError;
      }

      // 4. Update run with new count
      const dedupeCount = results.length - newResults.length;
      await supabase
        .from('portal_search_runs')
        .update({ total_new: newResults.length })
        .eq('id', run.id);

      return {
        runId: run.id,
        totalFound: results.length,
        newCount: newResults.length,
        dedupeCount,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['acq-offers-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['portal-search-runs'] });
      toast.success(`${data.newCount} neue Objekte im Objekteingang (${data.dedupeCount} bereits vorhanden)`);
    },
    onError: (error) => {
      toast.error('Speichern fehlgeschlagen: ' + (error as Error).message);
    },
  });
}
