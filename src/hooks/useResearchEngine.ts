import { useState, useCallback } from "react";
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

export interface ResearchRequest {
  intent:
    | "find_contractors"
    | "find_brokers"
    | "find_companies"
    | "find_contacts"
    | "analyze_market";
  query: string;
  location?: string;
  radius_km?: number;
  filters?: ResearchFilters;
  providers?: ("google_places" | "firecrawl" | "apify")[];
  max_results?: number;
  context?: {
    module?: "sanierung" | "akquise" | "recherche" | "marketing";
    reference_id?: string;
  };
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

// ── Hook ───────────────────────────────────────────────────────────

export function useResearchEngine() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ResearchContact[]>([]);
  const [meta, setMeta] = useState<ResearchMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (request: ResearchRequest): Promise<ResearchResponse | null> => {
    setIsSearching(true);
    setError(null);

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
      setIsSearching(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setMeta(null);
    setError(null);
  }, []);

  return {
    search,
    reset,
    isSearching,
    results,
    meta,
    error,
  };
}
