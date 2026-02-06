/**
 * ACQUISITION OFFERS HOOKS
 * 
 * Hooks for Offers, Documents, and Analysis Runs
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type AcqOfferSource = 'inbound_email' | 'upload' | 'manual' | 'portal_scrape' | 'firecrawl';
export type AcqOfferStatus = 'new' | 'analyzing' | 'analyzed' | 'presented' | 'accepted' | 'rejected' | 'archived';
export type AcqAnalysisType = 'ai_research' | 'geomap' | 'calc_bestand' | 'calc_aufteiler' | 'enrichment' | 'extraction';
export type AcqAnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AcqOffer {
  id: string;
  mandate_id: string;
  source_type: AcqOfferSource;
  source_contact_id: string | null;
  source_inbound_id: string | null;
  source_url: string | null;
  title: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  price_asking: number | null;
  yield_indicated: number | null;
  noi_indicated: number | null;
  units_count: number | null;
  area_sqm: number | null;
  year_built: number | null;
  status: AcqOfferStatus;
  notes: string | null;
  extracted_data: unknown;
  extraction_confidence: number | null;
  analysis_summary: unknown;
  geomap_data: unknown;
  calc_bestand: unknown;
  calc_aufteiler: unknown;
  created_at: string;
  updated_at: string;
}

export interface AcqOfferDocument {
  id: string;
  offer_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  extracted_text: string | null;
  created_at: string;
}

export interface AcqAnalysisRun {
  id: string;
  offer_id: string | null;
  contact_staging_id: string | null;
  mandate_id: string | null;
  run_type: AcqAnalysisType;
  status: AcqAnalysisStatus;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message: string | null;
  engine_version: string | null;
  model_used: string | null;
  tokens_used: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CreateOfferData {
  mandate_id: string;
  source_type?: AcqOfferSource;
  source_contact_id?: string;
  source_url?: string;
  title?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  price_asking?: number;
  yield_indicated?: number;
  units_count?: number;
  area_sqm?: number;
  year_built?: number;
  notes?: string;
}

// ============================================================================
// OFFER HOOKS
// ============================================================================

/**
 * Fetch offers for a mandate
 */
export function useAcqOffers(mandateId: string | undefined) {
  return useQuery({
    queryKey: ['acq-offers', mandateId],
    queryFn: async () => {
      if (!mandateId) return [];

      const { data, error } = await supabase
        .from('acq_offers')
        .select('*')
        .eq('mandate_id', mandateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AcqOffer[];
    },
    enabled: !!mandateId,
  });
}

/**
 * Fetch single offer with documents
 */
export function useAcqOffer(offerId: string | undefined) {
  return useQuery({
    queryKey: ['acq-offer', offerId],
    queryFn: async () => {
      if (!offerId) return null;

      const { data, error } = await supabase
        .from('acq_offers')
        .select(`
          *,
          documents:acq_offer_documents(*)
        `)
        .eq('id', offerId)
        .single();

      if (error) throw error;
      return data as AcqOffer & { documents: AcqOfferDocument[] };
    },
    enabled: !!offerId,
  });
}

/**
 * Create new offer
 */
export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOfferData) => {
      const { data: offer, error } = await supabase
        .from('acq_offers')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return offer;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['acq-offers', variables.mandate_id] });
      toast.success('Angebot erstellt');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

/**
 * Update offer
 */
export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, data }: { offerId: string; data: Partial<Omit<AcqOffer, 'extracted_data' | 'analysis_summary' | 'geomap_data' | 'calc_bestand' | 'calc_aufteiler'>> }) => {
      const { error } = await supabase
        .from('acq_offers')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', offerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-offers'] });
      queryClient.invalidateQueries({ queryKey: ['acq-offer'] });
      toast.success('Angebot aktualisiert');
    },
  });
}

/**
 * Update offer status
 */
export function useUpdateOfferStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: AcqOfferStatus }) => {
      const { error } = await supabase
        .from('acq_offers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', offerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-offers'] });
      toast.success('Status aktualisiert');
    },
  });
}

// ============================================================================
// DOCUMENT HOOKS
// ============================================================================

/**
 * Upload document to offer
 */
export function useUploadOfferDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      offerId, 
      mandateId,
      file, 
      documentType 
    }: { 
      offerId: string; 
      mandateId: string;
      file: File; 
      documentType: string;
    }) => {
      // Upload to storage
      const fileName = `${Date.now()}_${file.name}`;
      const storagePath = `${mandateId}/${offerId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('acq-documents')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: doc, error: dbError } = await supabase
        .from('acq_offer_documents')
        .insert([{
          offer_id: offerId,
          document_type: documentType,
          file_name: file.name,
          storage_path: storagePath,
          mime_type: file.type,
          file_size: file.size,
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-offer'] });
      toast.success('Dokument hochgeladen');
    },
    onError: (error) => {
      toast.error('Upload fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

// ============================================================================
// ANALYSIS HOOKS
// ============================================================================

/**
 * Fetch analysis runs for an offer
 */
export function useAcqAnalysisRuns(offerId: string | undefined) {
  return useQuery({
    queryKey: ['acq-analysis-runs', offerId],
    queryFn: async () => {
      if (!offerId) return [];

      const { data, error } = await supabase
        .from('acq_analysis_runs')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AcqAnalysisRun[];
    },
    enabled: !!offerId,
  });
}

/**
 * Start AI Research analysis
 */
export function useRunAIResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, mandateId }: { offerId: string; mandateId: string }) => {
      const { data, error } = await supabase.functions.invoke('sot-acq-ai-research', {
        body: { offerId, mandateId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-analysis-runs'] });
      queryClient.invalidateQueries({ queryKey: ['acq-offer'] });
      toast.success('KI-Recherche gestartet');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

/**
 * Run GeoMap analysis
 */
export function useRunGeoMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, address }: { offerId: string; address: string }) => {
      const { data, error } = await supabase.functions.invoke('sot-geomap-snapshot', {
        body: { offerId, address },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-analysis-runs'] });
      queryClient.invalidateQueries({ queryKey: ['acq-offer'] });
      toast.success('GeoMap-Analyse gestartet');
    },
    onError: (error) => {
      toast.error('GeoMap-Fehler: ' + (error as Error).message);
    },
  });
}

/**
 * Run Bestand (Hold) calculation
 */
export function useRunCalcBestand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, params }: { offerId: string; params: Record<string, unknown> }) => {
      // Create analysis run
      const { data: run, error: runError } = await supabase
        .from('acq_analysis_runs')
        .insert([{
          offer_id: offerId,
          run_type: 'calc_bestand' as const,
          status: 'running' as const,
          input_data: params as unknown as null,
          started_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (runError) throw runError;

      // Calculate locally (using existing investment engine logic)
      const result = calculateBestandKPIs(params);

      // Update run with results
      const { error: updateError } = await supabase
        .from('acq_analysis_runs')
        .update({
          status: 'completed',
          output_data: result as unknown as null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);

      if (updateError) throw updateError;

      // Update offer with calc results
      await supabase
        .from('acq_offers')
        .update({ calc_bestand: result as unknown as null })
        .eq('id', offerId);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-analysis-runs'] });
      queryClient.invalidateQueries({ queryKey: ['acq-offer'] });
      toast.success('Bestandskalkulation abgeschlossen');
    },
  });
}

/**
 * Run Aufteiler (Partition) calculation
 */
export function useRunCalcAufteiler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, params }: { offerId: string; params: Record<string, unknown> }) => {
      const { data: run, error: runError } = await supabase
        .from('acq_analysis_runs')
        .insert([{
          offer_id: offerId,
          run_type: 'calc_aufteiler' as const,
          status: 'running' as const,
          input_data: params as unknown as null,
          started_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (runError) throw runError;

      const result = calculateAufteilerKPIs(params);

      await supabase
        .from('acq_analysis_runs')
        .update({
          status: 'completed',
          output_data: result as unknown as null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);

      await supabase
        .from('acq_offers')
        .update({ calc_aufteiler: result as unknown as null })
        .eq('id', offerId);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-analysis-runs'] });
      queryClient.invalidateQueries({ queryKey: ['acq-offer'] });
      toast.success('Aufteilerkalkulation abgeschlossen');
    },
  });
}

/**
 * Extract data from PDF (via AI)
 */
export function useExtractFromDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, documentId }: { offerId: string; documentId: string }) => {
      const { data, error } = await supabase.functions.invoke('sot-acq-offer-extract', {
        body: { offerId, documentId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acq-offer'] });
      toast.success('Datenextraktion gestartet');
    },
  });
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

function calculateBestandKPIs(params: Record<string, unknown>) {
  const purchasePrice = Number(params.purchasePrice) || 0;
  const monthlyRent = Number(params.monthlyRent) || 0;
  const equity = Number(params.equity) || purchasePrice * 0.2;
  const interestRate = Number(params.interestRate) || 3.5;
  const repaymentRate = Number(params.repaymentRate) || 2;
  const managementCostPercent = Number(params.managementCostPercent) || 25;
  const ancillaryCostPercent = Number(params.ancillaryCostPercent) || 10;

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

function calculateAufteilerKPIs(params: Record<string, unknown>) {
  const purchasePrice = Number(params.purchasePrice) || 0;
  const unitsCount = Number(params.unitsCount) || 1;
  const avgUnitSalePrice = Number(params.avgUnitSalePrice) || 0;
  const renovationCostPerUnit = Number(params.renovationCostPerUnit) || 0;
  const salesCommissionPercent = Number(params.salesCommissionPercent) || 3;
  const holdingPeriodMonths = Number(params.holdingPeriodMonths) || 24;
  const ancillaryCostPercent = Number(params.ancillaryCostPercent) || 10;

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
