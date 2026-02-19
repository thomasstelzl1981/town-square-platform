import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────

export interface ResearchContact {
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  reviews_count: number | null;
  confidence: number;
  sources: string[];
  source_refs?: Record<string, unknown>;
}

export interface ResearchFilters {
  must_have_email?: boolean;
  min_rating?: number;
  industry?: string;
}

export interface PortalConfig {
  portal?: "immoscout24" | "immowelt" | "ebay_kleinanzeigen";
  search_type?: "listings" | "brokers";
  price_min?: number;
  price_max?: number;
  object_types?: string[];
}

export type ResearchIntent =
  | "find_contractors"
  | "find_brokers"
  | "find_companies"
  | "find_contacts"
  | "analyze_market"
  | "search_portals";

export interface ResearchRequest {
  intent: ResearchIntent;
  query: string;
  location?: string;
  radius_km?: number;
  filters?: ResearchFilters;
  providers?: ("google_places" | "firecrawl" | "apify")[];
  max_results?: number;
  context?: {
    module?: "sanierung" | "akquise" | "recherche" | "marketing" | "finanzierung";
    reference_id?: string;
  };
  portal_config?: PortalConfig;
}

export interface ResearchMeta {
  providers_used: string[];
  providers_available: string[];
  total_found: number;
  duration_ms: number;
  intent: string;
  query: string;
  location: string | null;
}

export interface ResearchResponse {
  success: boolean;
  results: ResearchContact[];
  meta: ResearchMeta;
  error?: string;
}

// ── Estimate helper ───────────────────────────────────────────────

function estimateDuration(maxResults?: number): number {
  if (!maxResults || maxResults <= 10) return 30;
  if (maxResults <= 20) return 45;
  return 55;
}

// ── Hook ───────────────────────────────────────────────────────────

export function useResearchEngine() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ResearchContact[]>([]);
  const [meta, setMeta] = useState<ResearchMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(55);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const search = useCallback(async (request: ResearchRequest): Promise<ResearchResponse | null> => {
    setIsSearching(true);
    setError(null);
    setElapsedSeconds(0);
    setEstimatedDuration(estimateDuration(request.max_results));

    // Start timer
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "sot-research-engine",
        { body: request }
      );

      if (fnError) {
        const msg = fnError.message || "Recherche fehlgeschlagen";
        setError(msg);
        toast.error("Recherche-Fehler", { description: msg });
        return null;
      }

      const response = data as ResearchResponse;

      if (!response.success) {
        const msg = response.error || "Unbekannter Fehler";
        setError(msg);
        toast.error("Recherche-Fehler", { description: msg });
        return null;
      }

      setResults(response.results);
      setMeta(response.meta);

      toast.success("Recherche abgeschlossen", {
        description: `${response.results.length} Ergebnisse in ${(response.meta.duration_ms / 1000).toFixed(1)}s (${response.meta.providers_used.join(", ")})`,
      });

      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Netzwerkfehler";
      setError(msg);
      toast.error("Recherche-Fehler", { description: msg });
      return null;
    } finally {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsSearching(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setMeta(null);
    setError(null);
    setElapsedSeconds(0);
  }, []);

  return {
    search,
    reset,
    isSearching,
    results,
    meta,
    error,
    elapsedSeconds,
    estimatedDuration,
  };
}
