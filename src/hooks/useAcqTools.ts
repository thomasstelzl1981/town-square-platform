/**
 * ACQUISITION TOOLS HOOKS
 * 
 * Standalone tools for MOD-12 AkquiseManager Tools page:
 * - Portal Search (Firecrawl + AI extraction, all portals parallel)
 * - Quick Calculators
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type PortalType = 'immoscout24' | 'immowelt' | 'ebay_kleinanzeigen';

export interface PortalSearchParams {
  region?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  objectTypes?: string[];
}

export interface PortalSearchResult {
  id: string;
  title: string;
  price?: number;
  address?: string;
  city?: string;
  zip_code?: string;
  object_type?: string;
  units?: number;
  area_sqm?: number;
  plot_area_sqm?: number;
  rooms?: number;
  year_built?: number;
  yield_percent?: number;
  url: string;
  portal: PortalType;
  broker_name?: string;
  scraped_at: string;
}

export interface PortalRunDiagnostics {
  [portal: string]: {
    status: string;
    result_count: number;
    url: string;
    error?: string;
  };
}

export interface StandaloneResearchParams {
  query: string;
}

export interface StandaloneResearchResult {
  query: string;
  timestamp: string;
  location?: {
    score: number;
    macroLocation: string;
    microLocation: string;
    infrastructure: string[];
    publicTransport: string[];
  };
  market?: {
    avgRentPerSqm: number;
    avgPricePerSqm: number;
    vacancyRate: number;
    trend: 'rising' | 'stable' | 'falling';
    trendDescription: string;
  };
  risks?: {
    score: number;
    floodZone: boolean;
    noiseLevel: 'low' | 'medium' | 'high';
    economicDependency: string;
    factors: string[];
  };
  recommendation?: {
    strategies: string[];
    strengths: string[];
    weaknesses: string[];
    summary: string;
  };
}

// ============================================================================
// PORTAL SEARCH HOOK — All 3 portals parallel, no broker search
// ============================================================================

export function usePortalSearch() {
  return useMutation({
    mutationFn: async (params: PortalSearchParams) => {
      const { data, error } = await supabase.functions.invoke('sot-research-engine', {
        body: {
          intent: 'search_portals',
          query: 'Immobilien kaufen',
          location: params.region,
          max_results: 20,
          portal_config: {
            price_min: params.priceMin,
            price_max: params.priceMax,
            area_min: params.areaMin,
            area_max: params.areaMax,
            object_types: params.objectTypes,
          },
          context: { module: 'akquise' },
        },
      });

      if (error) throw error;

      const results: PortalSearchResult[] = (data?.results || []).map((r: any, idx: number) => ({
        id: `portal_${idx}_${Date.now()}`,
        title: r.name || 'Unbenanntes Objekt',
        price: r.source_refs?.price_raw ? parseInt(r.source_refs.price_raw) : undefined,
        address: r.address || undefined,
        city: r.source_refs?.city || undefined,
        zip_code: r.source_refs?.zip_code || undefined,
        object_type: r.source_refs?.object_type || undefined,
        units: r.source_refs?.units_count || undefined,
        area_sqm: r.source_refs?.area_sqm ? parseFloat(r.source_refs.area_sqm) : undefined,
        rooms: r.source_refs?.rooms ? parseFloat(r.source_refs.rooms) : undefined,
        year_built: r.source_refs?.year_built || undefined,
        yield_percent: r.source_refs?.gross_yield || undefined,
        url: r.website || '',
        portal: r.source_refs?.portal || 'immoscout24',
        broker_name: r.source_refs?.broker_name || undefined,
        scraped_at: new Date().toISOString(),
      }));

      return { 
        results, 
        count: results.length,
        diagnostics: data?.run_diagnostics as PortalRunDiagnostics | undefined,
      };
    },
    onSuccess: (data) => {
      toast.success(`${data.count} Objekte gefunden`);
    },
    onError: (error) => {
      toast.error('Portal-Suche fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// STANDALONE AI RESEARCH HOOK
// ============================================================================

export function useStandaloneAIResearch() {
  return useMutation({
    mutationFn: async (params: StandaloneResearchParams) => {
      const { data, error } = await supabase.functions.invoke('sot-acq-standalone-research', {
        body: {
          query: params.query,
          mode: 'ai',
        },
      });

      if (error) throw error;
      return data as StandaloneResearchResult;
    },
    onSuccess: () => {
      toast.success('KI-Recherche abgeschlossen');
    },
    onError: (error) => {
      toast.error('KI-Recherche fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// QUICK CALCULATORS — Delegated to Engine (SSOT)
// ============================================================================

export { calcBestandQuick as calculateBestandKPIs, calcAufteilerQuick as calculateAufteilerKPIs } from '@/engines/akquiseCalc/engine';
export type { BestandQuickResult as BestandCalcResult, AufteilerQuickResult as AufteilerCalcResult } from '@/engines/akquiseCalc/spec';
export type { BestandQuickParams as BestandCalcParams, AufteilerQuickParams as AufteilerCalcParams } from '@/engines/akquiseCalc/spec';
