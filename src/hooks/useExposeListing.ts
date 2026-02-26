/**
 * useExposeListing — Shared data-fetching hook for all Investment Exposé pages
 * 
 * SSOT for listing resolution:
 * 1. Demo listings (client-side, toggle-independent via DEMO_PROPERTY_IMAGE_MAP)
 * 2. DB listings (public_id or UUID lookup)
 * 3. AfA accounting overrides from property_accounting
 * 
 * Used by: MOD-08, MOD-09, Zone 3 (Kaufy)
 */
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoListings, DEMO_PROPERTY_IMAGE_MAP } from '@/hooks/useDemoListings';
import { useInvestmentEngine, defaultInput, type CalculationInput } from '@/hooks/useInvestmentEngine';
import { mapAfaModelToEngine } from '@/lib/mapAfaModel';
import type { ExposeListingData } from '@/components/investment/InvestmentExposeView';

interface UseExposeListingOptions {
  publicId: string | undefined;
  /** Read zvE/equity/status from URL params and auto-calc */
  useUrlParams?: boolean;
  /** Query key prefix for react-query cache isolation */
  queryKeyPrefix?: string;
  /** Whether to use sale_price_fixed over asking_price (Kaufy) */
  useSalePriceFixed?: boolean;
}

export function useExposeListing({
  publicId,
  useUrlParams = false,
  queryKeyPrefix = 'expose',
  useSalePriceFixed = false,
}: UseExposeListingOptions) {
  const [urlParams] = useSearchParams();
  const { kaufyListings: demoListings } = useDemoListings();
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  // Read URL params if enabled
  const initialParams = useMemo(() => {
    if (!useUrlParams) return { ...defaultInput, purchasePrice: 250000, monthlyRent: 800 };
    
    const zvE = parseInt(urlParams.get('zvE') || '60000', 10);
    const equity = parseInt(urlParams.get('equity') || '50000', 10);
    const maritalStatus = (urlParams.get('status') as 'single' | 'married') || 'single';
    const hasChurchTax = urlParams.get('kirchensteuer') === '1';

    return {
      ...defaultInput,
      taxableIncome: zvE,
      equity,
      maritalStatus,
      hasChurchTax,
      purchasePrice: 250000,
      monthlyRent: 800,
    };
  }, [urlParams, useUrlParams]);

  const [params, setParams] = useState<CalculationInput>(initialParams);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch listing data
  const { data: listing, isLoading } = useQuery({
    queryKey: [queryKeyPrefix, publicId, demoListings.length],
    queryFn: async (): Promise<ExposeListingData | null> => {
      if (!publicId) return null;

      // Check demo listings first (case-insensitive)
      const pubIdUpper = publicId.toUpperCase();
      const demoListing = demoListings.find(d => d.public_id.toUpperCase() === pubIdUpper);
      if (demoListing) {
        // Enrich demo data with DB property facts if available
        let yearBuilt = 0;
        let heatingType: string | null = null;
        let energySource: string | null = null;
        
        // Try to get real property facts from DB for demo properties
        const { data: dbProp } = await supabase
          .from('properties')
          .select('year_built, heating_type, energy_source')
          .eq('id', demoListing.property_id)
          .maybeSingle();
        
        if (dbProp) {
          yearBuilt = dbProp.year_built || 0;
          heatingType = dbProp.heating_type || null;
          energySource = dbProp.energy_source || null;
        }

        return {
          id: demoListing.listing_id,
          public_id: demoListing.public_id,
          property_id: demoListing.property_id, // ← FIX 1: Correct property_id (not listing_id!)
          title: demoListing.title,
          description: '',
          asking_price: demoListing.asking_price,
          property_type: demoListing.property_type,
          address: demoListing.address,
          address_house_no: null,
          city: demoListing.city,
          postal_code: demoListing.postal_code || '',
          total_area_sqm: demoListing.total_area_sqm || 0,
          year_built: yearBuilt, // ← FIX 4: Enriched from DB
          renovation_year: null,
          energy_source: energySource,
          heating_type: heatingType,
          monthly_rent: demoListing.monthly_rent_total,
          units_count: demoListing.unit_count,
          hero_image_url: demoListing.hero_image_path
            || DEMO_PROPERTY_IMAGE_MAP[demoListing.property_id] // ← FIX 2: Image fallback
            || null,
        };
      }

      // DB lookup: try public_id first, then UUID
      const baseSelect = 'id, public_id, title, description, asking_price, sale_price_fixed, property_id, properties!inner ( id, property_type, address, address_house_no, city, postal_code, total_area_sqm, year_built, renovation_year, energy_source, heating_type, annual_income )';

      let { data, error } = await supabase
        .from('listings')
        .select(baseSelect)
        .eq('public_id', publicId)
        .maybeSingle();

      if (!data && !error) {
        const uuidResult = await supabase
          .from('listings')
          .select(baseSelect)
          .eq('id', publicId)
          .maybeSingle();
        data = uuidResult.data;
        error = uuidResult.error;
      }

      if (error || !data) return null;

      const row = data as any;
      const props = row.properties;
      const annualIncome = props?.annual_income || 0;
      const propertyId = row.property_id || props?.id;

      const effectivePrice = useSalePriceFixed
        ? (row.sale_price_fixed || row.asking_price || 0)
        : (row.asking_price || 0);

      const { count: unitsCount } = await supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId);

      return {
        id: row.id,
        public_id: row.public_id,
        property_id: propertyId,
        title: row.title || 'Immobilie',
        description: row.description || '',
        asking_price: effectivePrice,
        property_type: props?.property_type || 'apartment',
        address: props?.address || '',
        address_house_no: props?.address_house_no || null,
        city: props?.city || '',
        postal_code: props?.postal_code || '',
        total_area_sqm: props?.total_area_sqm || 0,
        year_built: props?.year_built || 0,
        renovation_year: props?.renovation_year ?? null,
        energy_source: props?.energy_source ?? null,
        heating_type: props?.heating_type ?? null,
        monthly_rent: annualIncome > 0 ? annualIncome / 12 : 0,
        units_count: (unitsCount && unitsCount > 0) ? unitsCount : 1,
        hero_image_url: DEMO_PROPERTY_IMAGE_MAP[propertyId] || null,
      };
    },
    enabled: !!publicId,
  });

  // Fetch AfA overrides
  const { data: accountingData } = useQuery({
    queryKey: [`${queryKeyPrefix}-accounting`, listing?.property_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_accounting')
        .select('afa_rate_percent, afa_model, land_share_percent, building_share_percent')
        .eq('property_id', listing!.property_id)
        .maybeSingle();
      return data;
    },
    enabled: !!listing?.property_id,
  });

  // Update params when listing/accounting data arrives
  useEffect(() => {
    if (listing) {
      setParams(prev => ({
        ...prev,
        purchasePrice: listing.asking_price || 250000,
        monthlyRent: listing.monthly_rent || Math.round((listing.asking_price || 250000) * 0.004),
        afaRateOverride: accountingData?.afa_rate_percent ?? undefined,
        buildingShare: accountingData?.building_share_percent
          ? accountingData.building_share_percent / 100
          : 0.8,
        afaModel: mapAfaModelToEngine(accountingData?.afa_model),
      }));
    }
  }, [listing, accountingData]);

  // Auto-calculate when params change (if URL params enabled = auto-calc mode)
  useEffect(() => {
    if (useUrlParams && params.purchasePrice > 0) {
      calculate(params);
    }
  }, [params, calculate, useUrlParams]);

  const grossYield = listing && listing.asking_price > 0
    ? ((params.monthlyRent * 12) / listing.asking_price) * 100
    : 0;

  return {
    listing,
    isLoading,
    calcResult,
    isCalculating,
    params,
    setParams,
    grossYield,
    isFavorite,
    setIsFavorite,
    calculate,
  };
}
