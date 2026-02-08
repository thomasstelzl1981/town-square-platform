/**
 * BeratungTab — MOD-09 Vertriebspartner Investment-Beratung
 * 
 * "Geldmaschinen-Flow" — Das Kerngeschäft:
 * 1. Eingabe: zVE, Eigenkapital, Güterstand, Kirche
 * 2. Grid: Property-Kacheln mit berechneten Metrics
 * 3. Detail: Interaktives Exposé mit Slidern (Modal)
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

import {
  PartnerSearchForm,
  PartnerPropertyGrid,
  PartnerExposeModal,
  type PartnerSearchParams,
  type ListingWithMetrics,
} from '@/components/vertriebspartner';

import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import { usePartnerSelections } from '@/hooks/usePartnerListingSelections';

const BeratungTab = () => {
  // Search parameters
  const [searchParams, setSearchParams] = useState<PartnerSearchParams>({
    zve: 60000,
    equity: 50000,
    maritalStatus: 'single',
    hasChurchTax: false,
  });
  
  const [hasSearched, setHasSearched] = useState(false);
  const [metricsCache, setMetricsCache] = useState<Record<string, {
    cashFlowBeforeTax: number;
    taxSavings: number;
    netBurden: number;
  }>>({});
  
  // Selected listing for modal
  const [selectedListing, setSelectedListing] = useState<ListingWithMetrics | null>(null);
  
  // Excluded listings (from catalog)
  const { data: selections = [] } = usePartnerSelections();
  const excludedIds = useMemo(() => new Set(
    selections.filter(s => !s.is_active).map(s => s.listing_id)
  ), [selections]);

  const { calculate, isLoading: isCalculating } = useInvestmentEngine();

  // Fetch partner-released listings with property data
  const { data: rawListings = [], isLoading: isLoadingListings, refetch } = useQuery({
    queryKey: ['partner-beratung-listings'],
    queryFn: async () => {
      // Get listings with active partner_network publication
      const { data: publications, error: pubError } = await supabase
        .from('listing_publications')
        .select('listing_id')
        .eq('channel', 'partner_network')
        .eq('status', 'active');

      if (pubError) throw pubError;
      
      const listingIds = publications?.map(p => p.listing_id) || [];
      if (listingIds.length === 0) return [];

      // Fetch listing details with property info
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id, public_id, title, asking_price, commission_rate, status,
          properties!inner (
            address, city, property_type, total_area_sqm, annual_income
          )
        `)
        .in('id', listingIds)
        .in('status', ['active', 'reserved']);

      if (listingsError) throw listingsError;

      return (listingsData || []).map((l: any) => {
        const props = l.properties;
        const annualRent = props?.annual_income || 0;
        const price = l.asking_price || 0;
        const grossYield = price > 0 ? (annualRent / price) * 100 : null;
        
        return {
          id: l.id,
          public_id: l.public_id,
          title: l.title || 'Objekt',
          asking_price: price,
          commission_rate: l.commission_rate,
          property_address: props?.address || '',
          property_city: props?.city || '',
          property_type: props?.property_type,
          total_area_sqm: props?.total_area_sqm,
          annual_rent: annualRent,
          hero_image_path: null,
          grossYield,
          cashFlowBeforeTax: null,
          taxSavings: null,
          netBurden: null,
        } as ListingWithMetrics;
      });
    },
  });

  // Calculate metrics for all listings - FIX: use fresh data from refetch
  const handleSearch = useCallback(async () => {
    // First fetch fresh listings
    const { data: freshListings } = await refetch();
    const listingsToProcess = freshListings || [];
    
    if (listingsToProcess.length === 0) {
      setHasSearched(true);
      return;
    }

    const newCache: Record<string, any> = {};
    
    // Calculate metrics for ALL listings in parallel
    await Promise.all(listingsToProcess.map(async (listing: any) => {
      const monthlyRent = listing.annual_rent / 12;
      if (monthlyRent <= 0 || listing.asking_price <= 0) return;
      
      const input: CalculationInput = {
        ...defaultInput,
        purchasePrice: listing.asking_price,
        monthlyRent,
        equity: searchParams.equity,
        taxableIncome: searchParams.zve,
        maritalStatus: searchParams.maritalStatus,
        hasChurchTax: searchParams.hasChurchTax,
      };

      const result = await calculate(input);
      if (result) {
        const yearlyRent = listing.annual_rent;
        const yearlyRate = result.summary.yearlyInterest + result.summary.yearlyRepayment;
        const cashFlowBeforeTax = (yearlyRent - yearlyRate) / 12;
        const taxSavings = result.summary.yearlyTaxSavings / 12;
        const netBurden = result.summary.monthlyBurden;
        
        newCache[listing.id] = { cashFlowBeforeTax, taxSavings, netBurden };
      }
    }));

    // Update cache first, THEN set hasSearched
    setMetricsCache(newCache);
    setHasSearched(true);
  }, [searchParams, calculate, refetch]);

  // Merge cached metrics into listings
  const listingsWithMetrics = useMemo(() => {
    return rawListings.map(listing => ({
      ...listing,
      ...metricsCache[listing.id],
    }));
  }, [rawListings, metricsCache]);

  // Filter out excluded listings for display
  const visibleListings = useMemo(() => {
    return listingsWithMetrics.filter(l => !excludedIds.has(l.id));
  }, [listingsWithMetrics, excludedIds]);

  const isLoading = isLoadingListings || isCalculating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Kundenberatung
          </h2>
          <p className="text-sm text-muted-foreground">
            Finden Sie das perfekte Investment für Ihren Kunden
          </p>
        </div>
        {hasSearched && (
          <Badge variant="secondary">
            {visibleListings.length} Objekt{visibleListings.length !== 1 ? 'e' : ''}
          </Badge>
        )}
      </div>

      {/* Compact Search Form */}
      <PartnerSearchForm
        value={searchParams}
        onChange={setSearchParams}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* Property Grid */}
      {hasSearched && (
        <PartnerPropertyGrid
          listings={visibleListings}
          onSelect={(listing) => setSelectedListing(listing)}
          isLoading={isLoading}
          emptyMessage="Keine Objekte im Partner-Netzwerk verfügbar"
        />
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Geben Sie die Kundendaten ein und klicken Sie auf "Berechnen"
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Die Netto-Belastung wird für jedes Objekt individuell berechnet
          </p>
        </div>
      )}

      {/* Expose Modal */}
      <PartnerExposeModal
        listing={selectedListing}
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        initialParams={searchParams}
      />
    </div>
  );
};

export default BeratungTab;
