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

export interface BestandCalcParams {
  purchasePrice: number;
  monthlyRent: number;
  equity?: number;
  interestRate?: number;
  repaymentRate?: number;
  managementCostPercent?: number;
  ancillaryCostPercent?: number;
}

export interface BestandCalcResult {
  purchasePrice: number;
  totalInvestment: number;
  equity: number;
  loanAmount: number;
  yearlyRent: number;
  noi: number;
  grossYield: number;
  netYield: number;
  monthlyCashflow: number;
  ltv: number;
  dscr: number;
  cashOnCash: number;
  multiplier: number;
}

export interface AufteilerCalcParams {
  purchasePrice: number;
  unitsCount: number;
  avgUnitSalePrice: number;
  renovationCostPerUnit?: number;
  salesCommissionPercent?: number;
  holdingPeriodMonths?: number;
  ancillaryCostPercent?: number;
}

export interface AufteilerCalcResult {
  purchasePrice: number;
  unitsCount: number;
  totalSaleProceeds: number;
  totalCosts: number;
  grossProfit: number;
  profitMarginPercent: number;
  annualizedReturn: number;
  pricePerUnit: number;
  profitPerUnit: number;
  holdingPeriodMonths: number;
}

// ============================================================================
// PORTAL SEARCH HOOK
// ============================================================================

/**
 * Search real estate portals via Apify
 */
export function usePortalSearch() {
  return useMutation({
    mutationFn: async (params: PortalSearchParams) => {
      const { data, error } = await supabase.functions.invoke('sot-apify-portal-job', {
        body: {
          portal: params.portal,
          searchType: params.searchType,
          query: params.query,
          region: params.region,
          priceMin: params.priceMin,
          priceMax: params.priceMax,
          objectTypes: params.objectTypes,
        },
      });

      if (error) throw error;
      return data as { results: PortalSearchResult[]; count: number };
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
// QUICK CALCULATORS (LOCAL)
// ============================================================================

/**
 * Calculate Bestand (Hold) KPIs - runs locally
 */
export function calculateBestandKPIs(params: BestandCalcParams): BestandCalcResult {
  const purchasePrice = params.purchasePrice || 0;
  const monthlyRent = params.monthlyRent || 0;
  const equity = params.equity ?? purchasePrice * 0.2;
  const interestRate = params.interestRate ?? 3.5;
  const repaymentRate = params.repaymentRate ?? 2;
  const managementCostPercent = params.managementCostPercent ?? 25;
  const ancillaryCostPercent = params.ancillaryCostPercent ?? 10;

  const yearlyRent = monthlyRent * 12;
  const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);
  const totalInvestment = purchasePrice + ancillaryCosts;
  const loanAmount = totalInvestment - equity;
  
  const grossYield = purchasePrice > 0 ? (yearlyRent / purchasePrice) * 100 : 0;
  const managementCosts = yearlyRent * (managementCostPercent / 100);
  const noi = yearlyRent - managementCosts;
  const netYield = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
  
  const yearlyInterest = loanAmount * (interestRate / 100);
  const yearlyRepayment = loanAmount * (repaymentRate / 100);
  const yearlyDebtService = yearlyInterest + yearlyRepayment;
  const monthlyCashflow = (noi - yearlyDebtService) / 12;
  
  const ltv = totalInvestment > 0 ? (loanAmount / totalInvestment) * 100 : 0;
  const dscr = yearlyDebtService > 0 ? noi / yearlyDebtService : 0;
  const cashOnCash = equity > 0 ? ((noi - yearlyDebtService) / equity) * 100 : 0;
  const multiplier = yearlyRent > 0 ? purchasePrice / yearlyRent : 0;

  return {
    purchasePrice,
    totalInvestment,
    equity,
    loanAmount,
    yearlyRent,
    noi,
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    monthlyCashflow: Math.round(monthlyCashflow),
    ltv: Math.round(ltv * 10) / 10,
    dscr: Math.round(dscr * 100) / 100,
    cashOnCash: Math.round(cashOnCash * 100) / 100,
    multiplier: Math.round(multiplier * 10) / 10,
  };
}

/**
 * Calculate Aufteiler (Partition) KPIs - runs locally
 */
export function calculateAufteilerKPIs(params: AufteilerCalcParams): AufteilerCalcResult {
  const purchasePrice = params.purchasePrice || 0;
  const unitsCount = params.unitsCount || 1;
  const avgUnitSalePrice = params.avgUnitSalePrice || 0;
  const renovationCostPerUnit = params.renovationCostPerUnit ?? 0;
  const salesCommissionPercent = params.salesCommissionPercent ?? 3;
  const holdingPeriodMonths = params.holdingPeriodMonths ?? 24;
  const ancillaryCostPercent = params.ancillaryCostPercent ?? 10;

  const totalSaleProceeds = avgUnitSalePrice * unitsCount;
  const salesCommission = totalSaleProceeds * (salesCommissionPercent / 100);
  const totalRenovationCosts = renovationCostPerUnit * unitsCount;
  const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);
  
  const totalCosts = purchasePrice + ancillaryCosts + totalRenovationCosts + salesCommission;
  const grossProfit = totalSaleProceeds - totalCosts;
  const profitMarginPercent = totalCosts > 0 ? (grossProfit / totalCosts) * 100 : 0;
  
  const annualizedReturn = holdingPeriodMonths > 0 
    ? (profitMarginPercent / holdingPeriodMonths) * 12 
    : 0;

  const pricePerUnit = purchasePrice / unitsCount;
  const profitPerUnit = grossProfit / unitsCount;

  return {
    purchasePrice,
    unitsCount,
    totalSaleProceeds,
    totalCosts,
    grossProfit: Math.round(grossProfit),
    profitMarginPercent: Math.round(profitMarginPercent * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    pricePerUnit: Math.round(pricePerUnit),
    profitPerUnit: Math.round(profitPerUnit),
    holdingPeriodMonths,
  };
}
