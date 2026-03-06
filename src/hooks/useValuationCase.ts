/**
 * useValuationCase — Orchestrates calls to sot-valuation-engine Edge Function
 * Handles preflight, run (with SSE stage progress), and result fetching.
 * V6.0: Supports SSOT-Final Mode via propertyId auto-detection
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  ValuationStageId,
  ValuationStageStatus,
  PreflightOutput,
  ValuationCaseStatus,
  ValuationSourceMode,
} from '@/engines/valuation/spec';

export interface StageProgress {
  stageId: ValuationStageId;
  status: ValuationStageStatus;
  message?: string;
  durationMs?: number;
}

export interface ValuationCaseState {
  caseId: string | null;
  status: ValuationCaseStatus | 'idle' | 'preflight';
  preflight: PreflightOutput | null;
  stages: StageProgress[];
  currentStage: ValuationStageId;
  error: string | null;
  resultData: any | null;
  sourceMode: ValuationSourceMode;
}

const INITIAL_STATE: ValuationCaseState = {
  caseId: null,
  status: 'idle',
  preflight: null,
  stages: [],
  currentStage: 0,
  error: null,
  resultData: null,
  sourceMode: 'DRAFT_INTAKE',
};

export interface ValuationRunParams {
  propertyId?: string;
  offerId?: string;
  sourceUrls?: string[];
  sourceContext: 'MOD_04' | 'ACQUIARY_TOOLS' | 'MOD_13_INBOX';
}

export function useValuationCase() {
  const { activeOrganization, user } = useAuth();
  const [state, setState] = useState<ValuationCaseState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /** Derive source mode from params */
  const deriveSourceMode = (params: ValuationRunParams): ValuationSourceMode => {
    if (params.propertyId && params.sourceContext === 'MOD_04') {
      return 'SSOT_FINAL';
    }
    return 'DRAFT_INTAKE';
  };

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
    setIsLoading(false);
  }, []);

  /** Step 1: Preflight — check credits & sources */
  const runPreflight = useCallback(async (params: ValuationRunParams) => {
    if (!activeOrganization || !user) {
      toast.error('Nicht angemeldet');
      return null;
    }
    const sourceMode = deriveSourceMode(params);
    setIsLoading(true);
    setState(s => ({ ...s, status: 'preflight', error: null, sourceMode }));

    try {
      const { data, error } = await supabase.functions.invoke('sot-valuation-engine', {
        body: {
          action: 'preflight',
          tenantId: activeOrganization.id,
          userId: user.id,
          sourceMode,
          property_id: params.propertyId || undefined,
          offer_id: params.offerId || undefined,
          source_urls: params.sourceUrls,
          source_context: params.sourceContext,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Preflight fehlgeschlagen');

      const preflight = data.preflight as PreflightOutput;
      setState(s => ({ ...s, preflight, status: 'idle' }));
      setIsLoading(false);
      return preflight;
    } catch (e: any) {
      const msg = e?.message || 'Preflight-Fehler';
      setState(s => ({ ...s, error: msg, status: 'idle' }));
      toast.error(msg);
      setIsLoading(false);
      return null;
    }
  }, [activeOrganization, user]);

  /** Step 2: Run full pipeline */
  const runValuation = useCallback(async (params: ValuationRunParams) => {
    if (!activeOrganization || !user) {
      toast.error('Nicht angemeldet');
      return null;
    }
    const sourceMode = deriveSourceMode(params);
    setIsLoading(true);
    setState(s => ({
      ...s,
      status: 'running',
      error: null,
      stages: [],
      currentStage: 0,
      resultData: null,
      sourceMode,
    }));

    abortRef.current = new AbortController();

    try {
      const { data, error } = await supabase.functions.invoke('sot-valuation-engine', {
        body: {
          action: 'run',
          tenantId: activeOrganization.id,
          userId: user.id,
          sourceMode,
          property_id: params.propertyId || undefined,
          offer_id: params.offerId || undefined,
          source_urls: params.sourceUrls,
          source_context: params.sourceContext,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Bewertung fehlgeschlagen');

      // Defensive: backend returns snake_case
      const caseId = (data.case_id ?? data.caseId) as string;
      if (!caseId) throw new Error('case_id not found in run response');

      // Update stages from response (snake_case from backend)
      const stageTimings = data.stage_timings ?? data.stageTimings ?? {};
      const stages: StageProgress[] = Object.entries(stageTimings).map(([k, v]) => {
        const num = k.replace('stage_', '');
        return {
          stageId: parseInt(num) as ValuationStageId,
          status: 'done' as ValuationStageStatus,
          durationMs: (v as any)?.durationMs ?? (v as number),
        };
      });

      // Capture summary from run response (executive_summary, diffs, etc.)
      const runSummary = data.summary || {};

      setState(s => ({
        ...s,
        caseId,
        status: data.status || 'final',
        stages,
        currentStage: 5,
      }));

      // Auto-fetch results and map to UI format
      await fetchResult(caseId, runSummary);
      setIsLoading(false);
      return caseId;
    } catch (e: any) {
      const msg = e?.message || 'Bewertung fehlgeschlagen';
      setState(s => ({ ...s, error: msg, status: 'failed' }));
      toast.error(msg);
      setIsLoading(false);
      return null;
    }
  }, [activeOrganization, user]);

  // =========================================================================
  // DEEP MAPPER: DB snake_case → UI spec.ts camelCase
  // =========================================================================

  /** Derive ConfidenceLevel from numeric score (0–1 or 0–100) */
  const toConfidenceLevel = (v: number | string | null | undefined): 'high' | 'medium' | 'low' => {
    if (typeof v === 'string') return (['high', 'medium', 'low'].includes(v) ? v : 'medium') as any;
    if (v == null) return 'medium';
    const n = v > 1 ? v / 100 : v; // normalize 0-100 → 0-1
    if (n >= 0.7) return 'high';
    if (n >= 0.4) return 'medium';
    return 'low';
  };

  /** Normalize confidence score to 0-1 */
  const toScore01 = (v: number | null | undefined): number => {
    if (v == null) return 0;
    return v > 1 ? v / 100 : v;
  };

  /** Derive TrafficLight from DSCR */
  const dscrToTrafficLight = (dscr: number | null | undefined): 'green' | 'yellow' | 'red' => {
    if (dscr == null) return 'yellow';
    if (dscr >= 1.2) return 'green';
    if (dscr >= 1.0) return 'yellow';
    return 'red';
  };

  /** Map raw valueBand from DB to spec.ts ValueBand */
  const mapValueBand = (raw: any): any => {
    if (!raw) return null;
    return {
      p25: raw.p25 ?? 0,
      p50: raw.p50 ?? 0,
      p75: raw.p75 ?? 0,
      confidence: toConfidenceLevel(raw.confidence),
      confidenceScore: toScore01(raw.confidence),
      weightingTable: (raw.weightingTable ?? raw.weighting_table ?? raw.weighting ?? []).map((w: any) => ({
        method: w.method ?? w.key ?? 'ertrag',
        weight: w.weight ?? 0,
        value: w.value ?? 0,
        confidence: toConfidenceLevel(w.confidence),
      })),
      reasoning: raw.reasoning ?? raw.narrative ?? 'Gewichtung basiert auf Datenlage und Methodeneignung.',
    };
  };

  /** Map raw methods array to spec.ts ValuationMethodResult[] */
  const mapMethods = (raw: any[]): any[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map(m => ({
      method: m.method ?? m.key ?? 'ertrag',
      value: m.value ?? 0,
      confidence: toConfidenceLevel(m.confidence ?? m.confidence_score),
      confidenceScore: toScore01(m.confidence ?? m.confidence_score),
      params: m.params ?? {},
      notes: m.notes ?? [],
    }));
  };

  /** Map financing scenarios from snake_case to camelCase */
  const mapFinancing = (raw: any[]): any[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map(f => ({
      name: f.name ?? '',
      ltv: f.ltv ?? 0,
      loanAmount: f.loan_amount ?? f.loanAmount ?? 0,
      equity: f.equity ?? 0,
      interestRate: f.interest_rate ?? f.interestRate ?? 0,
      repaymentRate: f.repayment_rate ?? f.repaymentRate ?? 0,
      monthlyRate: f.monthly_rate ?? f.monthlyRate ?? 0,
      annualDebtService: f.annual_debt_service ?? f.annualDebtService ?? 0,
      cashflowAfterDebt: f.cashflow_after_debt ?? f.cashflowAfterDebt ?? null,
      trafficLight: f.traffic_light ?? f.trafficLight ?? dscrToTrafficLight(f.dscr),
    }));
  };

  /** Map stress tests from DB to spec.ts StressTestResult[] */
  const mapStressTests = (raw: any[]): any[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map(s => ({
      label: s.label ?? s.scenario ?? '',
      monthlyRate: s.monthly_rate ?? s.monthlyRate ?? 0,
      annualDebtService: s.annual_debt_service ?? s.annualDebtService ?? 0,
      cashflowAfterDebt: s.cashflow_after_debt ?? s.cashflowAfterDebt ?? s.cashflow ?? null,
      dscr: s.dscr ?? null,
      trafficLight: s.traffic_light ?? s.trafficLight ?? dscrToTrafficLight(s.dscr),
    }));
  };

  /** Map lienProxy from DB to spec.ts LienProxy */
  const mapLienProxy = (raw: any): any => {
    if (!raw) return null;
    const lienValue = raw.lien_value ?? raw.lienValue ?? 0;
    return {
      marketValueP50: raw.market_value_p50 ?? raw.marketValueP50 ?? raw.market_value_band?.p50 ?? raw.p50 ?? 0,
      totalDiscount: raw.total_discount ?? raw.totalDiscount ?? raw.risk_discount ?? 0,
      lienValueLow: raw.lien_value_low ?? raw.lienValueLow ?? Math.round(lienValue * 0.95),
      lienValueHigh: raw.lien_value_high ?? raw.lienValueHigh ?? Math.round(lienValue * 1.05),
      safeLtvWindow: raw.safe_ltv_window ?? raw.safeLtvWindow ??
        (raw.ltv_window ? [raw.ltv_window.safe ?? 0.55, raw.ltv_window.max ?? 0.70] : [0.55, 0.70]),
      riskDrivers: (raw.risk_drivers ?? raw.riskDrivers ?? []).map((rd: any) =>
        typeof rd === 'string'
          ? { factor: rd, discountPercent: 0, reasoning: '' }
          : {
              factor: rd.factor ?? rd.name ?? '',
              discountPercent: rd.discount_percent ?? rd.discountPercent ?? 0,
              reasoning: rd.reasoning ?? '',
            }
      ),
    };
  };

  /** Map debtService from DB to spec.ts DebtServiceResult */
  const mapDebtService = (raw: any): any => {
    if (!raw) return null;
    return {
      dscr: raw.dscr ?? null,
      breakEvenRentMonthly: raw.break_even_rent ?? raw.break_even_rent_monthly ?? raw.breakEvenRentMonthly ?? null,
      isViable: raw.is_viable ?? raw.isViable ?? null,
      cashflowAfterDebt: raw.cashflow_after_debt ?? raw.cashflowAfterDebt ?? null,
      notes: raw.notes ?? [],
    };
  };

  /** Map dataQuality from DB to spec.ts DataQuality */
  const mapDataQuality = (raw: any): any => {
    if (!raw) return null;
    const criticalGaps = raw.critical_gaps ?? raw.criticalGaps;
    return {
      completenessPercent: raw.completeness_percent ?? raw.completenessPercent ?? raw.completeness ?? 0,
      criticalGaps: typeof criticalGaps === 'number' ? criticalGaps : (Array.isArray(criticalGaps) ? criticalGaps.length : 0),
      fieldsVerified: raw.fields_verified ?? raw.fieldsVerified ?? raw.belegt ?? 0,
      fieldsDerived: raw.fields_derived ?? raw.fieldsDerived ?? 0,
      fieldsMissing: raw.fields_missing ?? raw.fieldsMissing ?? raw.missing ?? 0,
      globalConfidence: toConfidenceLevel(raw.global_confidence ?? raw.globalConfidence ?? raw.globalConfidenceScore),
      globalConfidenceScore: toScore01(raw.global_confidence_score ?? raw.globalConfidenceScore ?? raw.global_confidence),
    };
  };

  /** Map compStats from DB to spec.ts CompStats */
  const mapCompStats = (raw: any): any => {
    if (!raw) return null;
    return {
      count: raw.count ?? 0,
      dedupedCount: raw.deduped_count ?? raw.dedupedCount ?? 0,
      medianPriceSqm: raw.median_price_sqm ?? raw.medianPriceSqm ?? 0,
      p25PriceSqm: raw.p25_price_sqm ?? raw.p25PriceSqm ?? raw.p25 ?? 0,
      p50PriceSqm: raw.p50_price_sqm ?? raw.p50PriceSqm ?? raw.p50 ?? 0,
      p75PriceSqm: raw.p75_price_sqm ?? raw.p75PriceSqm ?? raw.p75 ?? 0,
      iqr: raw.iqr ?? 0,
      meanPriceSqm: raw.mean_price_sqm ?? raw.meanPriceSqm ?? 0,
      stdDevPriceSqm: raw.std_dev_price_sqm ?? raw.stdDevPriceSqm ?? 0,
    };
  };

  /** Step 3: Fetch results for existing case and map to UI format */
  const fetchResult = useCallback(async (caseId: string, runSummary?: Record<string, any>) => {
    try {
      const { data, error } = await supabase.functions.invoke('sot-valuation-engine', {
        body: { action: 'get', case_id: caseId },
      });
      if (error) throw new Error(error.message);

      const results = data?.results || {};
      const caseData = data?.case || {};
      const inputs = data?.inputs || {};
      const rawDq = inputs.snapshot?.data_quality ?? runSummary?.data_quality ?? null;

      const mappedResult = {
        valueBand: mapValueBand(results.value_band),
        methods: mapMethods(results.valuation_methods ?? []),
        financing: mapFinancing(results.financing ?? []),
        stressTests: mapStressTests(results.stress_tests ?? []),
        lienProxy: mapLienProxy(results.lien_proxy),
        debtService: mapDebtService(results.debt_service),
        dataQuality: mapDataQuality(rawDq),
        compStats: mapCompStats(results.comp_stats),
        executiveSummary: runSummary?.executive_summary ?? null,
        legalTitle: runSummary?.legal_title ?? inputs.snapshot?.legal_title ?? null,
        diffs: inputs.diffs ?? [],
        sourceMode: caseData.source_mode ?? 'DRAFT_INTAKE',
        // V9.0: Beleihungswert
        beleihungswert: (() => {
          const bw = results.beleihungswert ?? runSummary?.beleihungswert;
          if (!bw) return null;
          return {
            ertragswertBelwertv: bw.ertragswert_belwertv ?? bw.ertragswertBelwertv ?? 0,
            sachwertBelwertv: bw.sachwert_belwertv ?? bw.sachwertBelwertv ?? 0,
            beleihungswert: bw.beleihungswert ?? 0,
            beleihungswertQuote: bw.beleihungswert_quote ?? bw.beleihungswertQuote ?? 0,
            sicherheitsabschlag: bw.sicherheitsabschlag ?? 0.10,
            bwkBelwertv: bw.bwk_belwertv ?? bw.bwkBelwertv ?? 0,
            reinertagBelwertv: bw.reinertrag_belwertv ?? bw.reinertagBelwertv ?? 0,
            barwertfaktorBelwertv: bw.barwertfaktor_belwertv ?? bw.barwertfaktorBelwertv ?? 0,
          };
        })(),
        // V9.0: Gemini Research
        geminiResearch: (() => {
          const gr = results.gemini_research ?? runSummary?.gemini_research;
          if (!gr) return null;
          // Map snake_case sub-objects to camelCase for UI consumption
          const mapLZ = (raw: any) => {
            if (!raw) return null;
            return {
              marktwertZins: raw.marktwert_zins ?? raw.marktwertZins ?? null,
              beleihungswertZins: raw.beleihungswert_zins ?? raw.beleihungswertZins ?? 0.05,
              min: raw.min ?? null,
              max: raw.max ?? null,
              quelle: raw.quelle ?? '',
              stichtag: raw.stichtag ?? null,
              begruendung: raw.begruendung ?? null,
            };
          };
          const mapBRW = (raw: any) => {
            if (!raw) return null;
            return {
              bodenrichtwertEurSqm: raw.bodenrichtwert_eur_sqm ?? raw.bodenrichtwertEurSqm ?? 0,
              artDerNutzung: raw.art_der_nutzung ?? raw.artDerNutzung ?? null,
              quelle: raw.quelle ?? '',
              stichtag: raw.stichtag ?? null,
              begruendung: raw.begruendung ?? null,
            };
          };
          const mapVM = (raw: any) => {
            if (!raw) return null;
            return {
              mieteMin: raw.miete_min ?? raw.mieteMin ?? 0,
              mieteMedian: raw.miete_median ?? raw.mieteMedian ?? 0,
              mieteMax: raw.miete_max ?? raw.mieteMax ?? 0,
              quelle: raw.quelle ?? '',
              begruendung: raw.begruendung ?? null,
            };
          };
          return {
            liegenschaftszins: mapLZ(gr.liegenschaftszins),
            bodenrichtwert: mapBRW(gr.bodenrichtwert),
            vergleichsmieten: mapVM(gr.vergleichsmieten),
            researchedAt: gr.researched_at ?? gr.researchedAt ?? null,
          };
        })(),
        // Location analysis mapping
        location: (() => {
          const loc = results.location_analysis;
          if (!loc || !loc.available) return null;
          return {
            overallScore: loc.global_score ?? 0,
            dimensions: (loc.scores ?? []).map((s: any) => ({
              key: s.dimension?.toLowerCase().replace(/[^a-z]/g, '_') ?? s.type ?? '',
              label: s.dimension ?? s.category ?? '',
              score: Math.min(10, Math.round((s.score ?? 0) / 10)),
              topPois: (s.topPois ?? s.pois ?? []).slice(0, 3).map((p: any) => ({
                name: p.name ?? '',
                type: p.type ?? '',
                distanceMeters: p.distance_m ?? p.distanceMeters ?? 0,
                rating: p.rating ?? undefined,
              })),
            })),
            reachability: loc.reachability ?? [],
            microMapUrl: loc.maps?.micro ?? null,
            macroMapUrl: loc.maps?.macro ?? null,
            streetViewUrl: loc.maps?.street_view ?? null,
            narrative: loc.narrative ?? '',
            narrativeConfidence: 'medium' as const,
          };
        })(),
        // Comp postings mapping
        comps: (results.comp_postings ?? []).map((c: any) => ({
          id: c.id ?? c.url ?? String(Math.random()),
          title: c.title ?? '',
          price: c.price ?? 0,
          priceSqm: c.price_per_sqm ?? c.price_sqm ?? c.priceSqm ?? 0,
          area: c.area ?? c.living_area_sqm ?? 0,
          rooms: c.rooms ?? null,
          yearBuilt: c.year_built ?? c.yearBuilt ?? null,
          portal: c.portal ?? c.source ?? 'unknown',
          url: c.url ?? '',
          distanceKm: c.distance_km ?? c.distanceKm ?? null,
        })),
      };

      setState(s => ({ ...s, resultData: mappedResult, caseId }));
      return mappedResult;
    } catch (e: any) {
      console.error('fetchResult error:', e);
      setState(s => ({ ...s, error: `Ergebnis konnte nicht geladen werden: ${e.message}`, status: 'failed' }));
      toast.error('Ergebnis konnte nicht geladen werden');
      return null;
    }
  }, []);

  return {
    state,
    isLoading,
    runPreflight,
    runValuation,
    fetchResult,
    reset,
  };
}
