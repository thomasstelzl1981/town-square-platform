/**
 * BeratungTab — MOD-09 Vertriebspartner Investment-Beratung
 * 
 * REFAKTORISIERT: Nutzt jetzt InvestmentResultTile (wie MOD-08)
 * - Keine Provisions-Anzeige (showProvision=false)
 * - Metrics-Struktur wie MOD-08
 * - Navigation zu Full-Page Exposé
 * - Zwei Modi: Investment-Suche und Klassische Suche (wie MOD-08)
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Calculator, Search, Loader2 } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { formatCurrency } from '@/lib/formatters';

import { PartnerSearchForm, type PartnerSearchParams } from '@/components/vertriebspartner';
import { InvestmentResultTile } from '@/components/investment/InvestmentResultTile';
import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import { usePartnerSelections } from '@/hooks/usePartnerListingSelections';
import { fetchPropertyImages } from '@/lib/fetchPropertyImages';
import { useDemoListings, deduplicateByField } from '@/hooks/useDemoListings';
import { MediaWidgetGrid } from '@/components/shared/MediaWidgetGrid';

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

type SearchMode = 'investment' | 'classic';

const BeratungTab = () => {
  // Demo listings for immediate visibility (filter out project demos)
  const { kaufyListings: allDemoListings } = useDemoListings();
  const demoListings = useMemo(() => 
    allDemoListings.filter(d => d.property_type !== 'new_construction'),
    [allDemoListings]
  );

  // Search mode
  const [searchMode, setSearchMode] = useState<SearchMode>('investment');

  // Investment search parameters
  const [searchParams, setSearchParams] = useState<PartnerSearchParams>({
    zve: 60000,
    equity: 50000,
    maritalStatus: 'single',
    hasChurchTax: false,
  });

  // Classic search parameters
  const [cityFilter, setCityFilter] = useState('');
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [areaMin, setAreaMin] = useState<number | null>(null);
  const [yieldMin, setYieldMin] = useState<number | null>(null);
  
  const [hasSearched, setHasSearched] = useState(false);
  const [metricsCache, setMetricsCache] = useState<Record<string, InvestmentMetrics>>({});
  
  // Excluded listings (from catalog)
  const { data: selections = [] } = usePartnerSelections();
  const excludedIds = useMemo(() => new Set(
    selections.filter(s => s.is_active).map(s => s.listing_id)
  ), [selections]);

  const { calculate, isLoading: isCalculating } = useInvestmentEngine();

  // Fetch partner-released listings with property data
  const { data: rawListings = [], isLoading: isLoadingListings, refetch } = useQuery({
    queryKey: ['partner-beratung-listings'],
    queryFn: async () => {
      const { data: publications, error: pubError } = await supabase
        .from('listing_publications')
        .select('listing_id')
        .eq('channel', 'partner_network')
        .eq('status', 'active');

      if (pubError) throw pubError;
      
      const listingIds = publications?.map(p => p.listing_id) || [];
      if (listingIds.length === 0) return [];

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

      const propertyIds = listingsData.map((l: any) => l.properties.id).filter(Boolean);
      const imageMap = await fetchPropertyImages(propertyIds);

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

  // Helper: merge DB + demo listings
  const getMergedListings = useCallback((freshListings?: RawListing[]) => {
    const demoAsRaw: RawListing[] = demoListings.map(d => ({
      id: d.listing_id,
      public_id: d.public_id,
      title: d.title,
      asking_price: d.asking_price,
      commission_rate: null,
      property_address: d.address,
      property_city: d.city,
      property_type: d.property_type,
      total_area_sqm: d.total_area_sqm,
      annual_rent: d.monthly_rent_total * 12,
      hero_image_path: d.hero_image_path || null,
      property_id: d.listing_id,
      unit_count: d.unit_count,
    }));
    const merged = deduplicateByField(demoAsRaw, freshListings || rawListings, (item) => `${item.title}|${item.property_city}`);
    return merged.filter(l => !excludedIds.has(l.id));
  }, [demoListings, rawListings, excludedIds]);

  // Investment search handler
  const handleInvestmentSearch = useCallback(async () => {
    const { data: freshListings } = await refetch();
    const listingsToProcess = getMergedListings(freshListings || undefined);
    
    if (listingsToProcess.length === 0) {
      setHasSearched(true);
      return;
    }

    const newCache: Record<string, InvestmentMetrics> = {};
    
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

    setMetricsCache(newCache);
    setHasSearched(true);
  }, [searchParams, calculate, refetch, getMergedListings]);

  // Classic search handler
  const handleClassicSearch = useCallback(async () => {
    await refetch();
    setHasSearched(true);
  }, [refetch]);

  // Visible listings with classic filters applied
  const visibleListings = useMemo(() => {
    const merged = getMergedListings();

    if (searchMode === 'classic' && hasSearched) {
      return merged.filter(l => {
        if (cityFilter && !l.property_city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
        if (priceMax && l.asking_price > priceMax) return false;
        if (areaMin && (l.total_area_sqm || 0) < areaMin) return false;
        if (yieldMin) {
          const grossYield = l.asking_price > 0 ? (l.annual_rent / l.asking_price) * 100 : 0;
          if (grossYield < yieldMin) return false;
        }
        return true;
      });
    }

    return merged;
  }, [getMergedListings, searchMode, hasSearched, cityFilter, priceMax, areaMin, yieldMin]);

  const isLoading = isLoadingListings || isCalculating;

  return (
    <PageShell>
      <ModulePageHeader
        title="KUNDENBERATUNG"
        description="Finden Sie das perfekte Investment für Ihren Kunden"
        actions={hasSearched ? <Badge variant="secondary">{visibleListings.length} Objekt{visibleListings.length !== 1 ? 'e' : ''}</Badge> : undefined}
      />

      {/* Media Widgets */}
      <MediaWidgetGrid />

      {/* Search Mode Toggle + Form */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={searchMode} onValueChange={(v) => { setSearchMode(v as SearchMode); setHasSearched(false); }}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="investment" className="gap-2">
                <Calculator className="w-4 h-4" />
                Investment-Suche
              </TabsTrigger>
              <TabsTrigger value="classic" className="gap-2">
                <Search className="w-4 h-4" />
                Klassische Suche
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-4">
          {searchMode === 'investment' ? (
            <PartnerSearchForm
              value={searchParams}
              onChange={setSearchParams}
              onSearch={handleInvestmentSearch}
              isLoading={isLoading}
            />
          ) : (
            <>
              {/* Classic Search Form */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Stadt</Label>
                  <Input
                    placeholder="z.B. Berlin, München..."
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max. Kaufpreis</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Unbegrenzt"
                      value={priceMax || ''}
                      onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : null)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Min. Fläche</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Keine"
                      value={areaMin || ''}
                      onChange={(e) => setAreaMin(e.target.value ? Number(e.target.value) : null)}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m²</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Min. Rendite</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Keine"
                      value={yieldMin || ''}
                      onChange={(e) => setYieldMin(e.target.value ? Number(e.target.value) : null)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center w-full">
                <Button onClick={handleClassicSearch} disabled={isLoadingListings}>
                  {isLoadingListings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Ergebnisse anzeigen
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {!hasSearched ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-primary opacity-70" />
            <h3 className="text-lg font-semibold mb-2">Kundenberatung starten</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchMode === 'investment'
                ? 'Geben Sie das zu versteuernde Einkommen und Eigenkapital Ihres Kunden ein, um passende Objekte mit individueller Belastungsberechnung zu finden.'
                : 'Filtern Sie nach Stadt, Kaufpreis, Fläche oder Rendite, um passende Objekte für Ihren Kunden zu finden.'}
            </p>
          </CardContent>
        </Card>
      ) : (
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
                metrics={searchMode === 'investment' ? (metricsCache[listing.id] || null) : null}
                showProvision={false}
                linkPrefix="/portal/vertriebspartner/beratung/objekt"
              />
            ))
          )}
        </div>
      )}
    </PageShell>
  );
};

export default BeratungTab;
