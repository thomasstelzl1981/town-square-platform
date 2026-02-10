/**
 * BeratungTab — MOD-09 Vertriebspartner Investment-Beratung
 * 
 * REFAKTORISIERT: Nutzt jetzt InvestmentResultTile (wie MOD-08)
 * - Keine Provisions-Anzeige (showProvision=false)
 * - Metrics-Struktur wie MOD-08
 * - Navigation zu Full-Page Exposé
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

import { PartnerSearchForm, type PartnerSearchParams } from '@/components/vertriebspartner';
import { InvestmentResultTile } from '@/components/investment/InvestmentResultTile';
import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import { usePartnerSelections } from '@/hooks/usePartnerListingSelections';
import { fetchPropertyImages } from '@/lib/fetchPropertyImages';

// Interface for fetched listings
interface RawListing {
  id: string;
  public_id: string | null;
  title: string;
  asking_price: number;
  commission_rate: number | null;
  property_address: string;
  property_city: string;
  property_type: string | null;
  total_area_sqm: number | null;
  annual_rent: number;
  hero_image_path: string | null;
  property_id: string;
  unit_count: number;
}



// Interface matching InvestmentResultTile's PublicListing
interface PublicListing {
  listing_id: string;
  public_id: string;
  title: string;
  asking_price: number;
  property_type: string;
  address: string;
  city: string;
  postal_code: string | null;
  total_area_sqm: number | null;
  unit_count: number;
  monthly_rent_total: number;
  hero_image_path?: string | null;
  partner_commission_rate?: number | null;
}

// Metrics interface matching InvestmentResultTile
interface InvestmentMetrics {
  monthlyBurden: number;
  roiAfterTax: number;
  loanAmount: number;
  yearlyInterest?: number;
  yearlyRepayment?: number;
  yearlyTaxSavings?: number;
}

// Transform raw listing to PublicListing format
const transformToPublicListing = (listing: RawListing): PublicListing => ({
  listing_id: listing.id,
  public_id: listing.public_id || '',
  title: listing.title,
  asking_price: listing.asking_price,
  property_type: listing.property_type || 'apartment',
  address: listing.property_address,
  city: listing.property_city,
  postal_code: null,
  total_area_sqm: listing.total_area_sqm,
  unit_count: listing.unit_count,
  monthly_rent_total: listing.annual_rent / 12,
  hero_image_path: listing.hero_image_path,
});

const BeratungTab = () => {
  // Search parameters
  const [searchParams, setSearchParams] = useState<PartnerSearchParams>({
    zve: 60000,
    equity: 50000,
    maritalStatus: 'single',
    hasChurchTax: false,
  });
  
  const [hasSearched, setHasSearched] = useState(false);
  const [metricsCache, setMetricsCache] = useState<Record<string, InvestmentMetrics>>({});
  
  // Excluded listings (from catalog)
  const { data: selections = [] } = usePartnerSelections();
  // is_active=true bedeutet "ausgeblendet" laut Hook-Dokumentation
  const excludedIds = useMemo(() => new Set(
    selections.filter(s => s.is_active).map(s => s.listing_id)
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
            id, address, city, property_type, total_area_sqm, annual_income
          )
        `)
        .in('id', listingIds)
        .in('status', ['active', 'reserved']);

      if (listingsError) throw listingsError;
      if (!listingsData?.length) return [];

      // Fetch hero images using shared helper
      const propertyIds = listingsData.map((l: any) => l.properties.id).filter(Boolean);
      const imageMap = await fetchPropertyImages(propertyIds);

      // Query unit counts per property
      const unitCountMap = new Map<string, number>();
      if (propertyIds.length > 0) {
        const { data: unitRows } = await supabase
          .from('units')
          .select('property_id')
          .in('property_id', propertyIds);

        if (unitRows) {
          for (const row of unitRows) {
            unitCountMap.set(row.property_id, (unitCountMap.get(row.property_id) || 0) + 1);
          }
        }
      }

      return listingsData.map((l: any) => {
        const props = l.properties;
        const annualRent = props?.annual_income || 0;
        
        return {
          id: l.id,
          public_id: l.public_id,
          title: l.title || 'Objekt',
          asking_price: l.asking_price || 0,
          commission_rate: l.commission_rate,
          property_address: props?.address || '',
          property_city: props?.city || '',
          property_type: props?.property_type,
          total_area_sqm: props?.total_area_sqm,
          annual_rent: annualRent,
          hero_image_path: imageMap.get(props.id) || null,
          property_id: props?.id || '',
          unit_count: unitCountMap.get(props?.id) || 1,
        } as RawListing;
      });
    },
  });

  // Calculate metrics for all listings (like MOD-08)
  const handleSearch = useCallback(async () => {
    // First fetch fresh listings
    const { data: freshListings } = await refetch();
    const listingsToProcess = freshListings || [];
    
    if (listingsToProcess.length === 0) {
      setHasSearched(true);
      return;
    }

    const newCache: Record<string, InvestmentMetrics> = {};
    
    // Calculate metrics for ALL listings in parallel
    await Promise.all(listingsToProcess.map(async (listing: RawListing) => {
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
        // Metrics-Struktur wie MOD-08
        newCache[listing.id] = {
          monthlyBurden: result.summary.monthlyBurden,
          roiAfterTax: result.summary.roiAfterTax,
          loanAmount: result.summary.loanAmount,
          yearlyInterest: result.summary.yearlyInterest,
          yearlyRepayment: result.summary.yearlyRepayment,
          yearlyTaxSavings: result.summary.yearlyTaxSavings,
        };
      }
    }));

    // Update cache first, THEN set hasSearched
    setMetricsCache(newCache);
    setHasSearched(true);
  }, [searchParams, calculate, refetch]);

  // Filter out excluded listings for display
  const visibleListings = useMemo(() => {
    return rawListings.filter(l => !excludedIds.has(l.id));
  }, [rawListings, excludedIds]);

  const isLoading = isLoadingListings || isCalculating;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Kundenberatung
          </h1>
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

      {/* Compact Search Form (wie MOD-08) */}
      <PartnerSearchForm
        value={searchParams}
        onChange={setSearchParams}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* Property Grid - InvestmentResultTile (wie MOD-08) */}
      {hasSearched && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleListings.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Keine Objekte im Partner-Netzwerk verfügbar
              </p>
            </div>
          ) : (
            visibleListings.map((listing) => (
              <InvestmentResultTile
                key={listing.id}
                listing={transformToPublicListing(listing)}
                metrics={metricsCache[listing.id] || null}
                showProvision={false}
                linkPrefix="/portal/vertriebspartner/beratung/objekt"
              />
            ))
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Geben Sie die Kundendaten ein und klicken Sie auf "Ergebnisse anzeigen"
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Die Netto-Belastung wird für jedes Objekt individuell berechnet
          </p>
        </div>
      )}
    </div>
  );
};

export default BeratungTab;
