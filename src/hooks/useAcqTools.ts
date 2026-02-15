/**
 * ACQUISITION TOOLS HOOKS
 * 
 * Standalone tools for MOD-12 AkquiseManager Tools page:
 * - Portal Search (Apify/Firecrawl)
 * - Property Research (AI + GeoMap)
 * - Quick Calculators
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type PortalType = 'immoscout24' | 'immowelt' | 'ebay_kleinanzeigen';
export type SearchType = 'listings' | 'brokers';

export interface PortalSearchParams {
  portal: PortalType;
  searchType: SearchType;
  query?: string;
  region?: string;
  priceMin?: number;
  priceMax?: number;
  objectTypes?: string[];
}

export interface PortalSearchResult {
  id: string;
  title: string;
  price?: number;
  address?: string;
  city?: string;
  units?: number;
  area_sqm?: number;
  yield_percent?: number;
  url: string;
  portal: PortalType;
  scraped_at: string;
  // Broker-specific fields
  broker_name?: string;
  broker_company?: string;
  broker_phone?: string;
  broker_email?: string;
}

export interface StandaloneResearchParams {
  query: string; // Freetext: address, property description
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

export interface GeoMapResult {
  location_score: number;
  avg_rent_sqm: number;
  avg_price_sqm: number;
  vacancy_rate: number;
  population_density: number;
  infrastructure_score: number;
  flood_zone: boolean;
  noise_level: string;
  poi_summary: string[];
}

// Types moved to src/engines/akquiseCalc/spec.ts — re-exported below

// ============================================================================
// PORTAL SEARCH HOOK
// ============================================================================

/**
 * Search real estate portals via Apify
 */
export function usePortalSearch() {
  return useMutation({
    mutationFn: async (params: PortalSearchParams) => {
      const { data, error } = await supabase.functions.invoke('sot-research-engine', {
        body: {
          intent: 'search_portals',
          query: params.query || 'Immobilien',
          location: params.region,
          max_results: 50,
          portal_config: {
            portal: params.portal,
            search_type: params.searchType,
            price_min: params.priceMin,
            price_max: params.priceMax,
            object_types: params.objectTypes,
          },
          context: { module: 'akquise' },
        },
      });

      if (error) throw error;
      
      // Map engine results to PortalSearchResult format
      const results: PortalSearchResult[] = (data?.results || []).map((r: any, idx: number) => ({
        id: `engine_${idx}_${Date.now()}`,
        title: r.name,
        price: r.source_refs?.price_raw ? parseInt(r.source_refs.price_raw) : undefined,
        address: r.address || undefined,
        city: undefined,
        url: r.website || '',
        portal: params.portal,
        scraped_at: new Date().toISOString(),
        broker_name: r.source_refs?.broker_name || undefined,
        broker_company: r.name,
        broker_phone: r.phone || undefined,
        broker_email: r.email || undefined,
      }));

      return { results, count: results.length };
    },
    onSuccess: (data) => {
      toast.success(`${data.count} Ergebnisse gefunden`);
    },
    onError: (error) => {
      toast.error('Portal-Suche fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// STANDALONE AI RESEARCH HOOK
// ============================================================================

/**
 * Run AI-powered property research without an existing offer
 */
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
// STANDALONE GEOMAP HOOK
// ============================================================================

/**
 * Run GeoMap analysis without an existing offer
 */
export function useStandaloneGeoMap() {
  return useMutation({
    mutationFn: async (address: string) => {
      const { data, error } = await supabase.functions.invoke('sot-geomap-snapshot', {
        body: {
          address,
          standalone: true,
        },
      });

      if (error) throw error;
      return data as GeoMapResult;
    },
    onSuccess: () => {
      toast.success('GeoMap-Analyse abgeschlossen');
    },
    onError: (error) => {
      toast.error('GeoMap-Fehler: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// QUICK CALCULATORS — Delegated to Engine (SSOT)
// ============================================================================

// Re-export from central engine for backward compatibility
export { calcBestandQuick as calculateBestandKPIs, calcAufteilerQuick as calculateAufteilerKPIs } from '@/engines/akquiseCalc/engine';
export type { BestandQuickResult as BestandCalcResult, AufteilerQuickResult as AufteilerCalcResult } from '@/engines/akquiseCalc/spec';
export type { BestandQuickParams as BestandCalcParams, AufteilerQuickParams as AufteilerCalcParams } from '@/engines/akquiseCalc/spec';
