/**
 * Kaufy2026Home — Homepage with Investment Search
 * 
 * Uses MOD-08 InvestmentResultTile for displaying results
 * Golden Path: Fetches active listings from partner_network channel
 */
import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCachedSignedUrl } from '@/lib/imageCache';
import { Loader2, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InvestmentResultTile } from '@/components/investment/InvestmentResultTile';
import { useDemoListings, isDemoListingId } from '@/hooks/useDemoListings';
import { useInvestmentEngine, defaultInput, type CalculationInput } from '@/hooks/useInvestmentEngine';
import { 
  Kaufy2026Hero, 
  PerspektivenKarten, 
  PerspektivenAkkordeon,
  ZahlenSektion,
  type SearchParams,
  type ClassicSearchParams,
} from '@/components/zone3/kaufy2026';

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
}

interface InvestmentMetrics {
  monthlyBurden: number;
  roiAfterTax: number;
  loanAmount: number;
  yearlyInterest?: number;
  yearlyRepayment?: number;
  yearlyTaxSavings?: number;
}

export default function Kaufy2026Home() {
  // Demo listings
  const { kaufyListings: allDemoListings } = useDemoListings();
  const demoListings = useMemo(() =>
    allDemoListings.filter(d => d.property_type !== 'new_construction'),
    [allDemoListings]
  );
  
  // URL-based state for search parameters
  const [urlParams, setUrlParams] = useSearchParams();

  // Derive search params from URL
  const searchParams = useMemo<SearchParams>(() => ({
    zvE: parseInt(urlParams.get('zvE') || '60000', 10),
    equity: parseInt(urlParams.get('equity') || '50000', 10),
    maritalStatus: (urlParams.get('status') as 'single' | 'married') || 'single',
    hasChurchTax: urlParams.get('kirchensteuer') === '1',
  }), [urlParams]);

  // Has searched is derived from URL
  const hasSearched = urlParams.get('searched') === '1';

  const [classicParams, setClassicParams] = useState<ClassicSearchParams>({
    city: '',
    maxPrice: null,
    minArea: null,
  });
  const [metricsCache, setMetricsCache] = useState<Record<string, InvestmentMetrics>>({});
  const [isSearching, setIsSearching] = useState(false);

  const { calculate } = useInvestmentEngine();

  // Fetch listings query
  const { data: listings = [], isLoading: isLoadingListings, refetch } = useQuery({
    queryKey: ['kaufy2026-listings', classicParams.city, classicParams.maxPrice],
    queryFn: async () => {
      // First: get listing IDs with active kaufy publication
      const { data: kaufyPubs, error: pubError } = await supabase
        .from('listing_publications')
        .select('listing_id')
        .eq('channel', 'kaufy')
        .eq('status', 'active');

      if (pubError) {
        console.error('Kaufy publications query error:', pubError);
        return [];
      }

      const kaufyListingIds = (kaufyPubs || []).map(p => p.listing_id);
      if (kaufyListingIds.length === 0) return [];

      let query = supabase
        .from('listings')
        .select(`
          id,
          public_id,
          title,
          asking_price,
          properties!inner (
            id,
            address,
            city,
            postal_code,
            property_type,
            total_area_sqm,
            annual_income
          )
        `)
        .eq('status', 'active')
        .in('id', kaufyListingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filters
      if (classicParams.city) {
        query = query.ilike('properties.city', `%${classicParams.city}%`);
      }
      if (classicParams.maxPrice) {
        query = query.lte('asking_price', classicParams.maxPrice);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Listings query error:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Get property IDs for image lookup
      const propertyIds = data
        .map((item: any) => item.properties?.id)
        .filter(Boolean) as string[];

      const imageMap = new Map<string, string>();

      if (propertyIds.length > 0) {
        const { data: imageLinks } = await supabase
          .from('document_links')
          .select(`
            object_id,
            is_title_image,
            display_order,
            documents!inner (file_path, mime_type)
          `)
          .in('object_id', propertyIds)
          .eq('object_type', 'property')
          .order('is_title_image', { ascending: false })
          .order('display_order', { ascending: true });

        if (imageLinks) {
          const bestByProperty = new Map<string, { file_path: string; is_title_image: boolean; display_order: number }>();

          for (const link of imageLinks as any[]) {
            const doc = link.documents as any;
            if (!doc?.file_path) continue;
            if (!String(doc?.mime_type || '').startsWith('image/')) continue;

            const candidate = {
              file_path: doc.file_path as string,
              is_title_image: !!link.is_title_image,
              display_order: typeof link.display_order === 'number' ? link.display_order : 0,
            };

            const current = bestByProperty.get(link.object_id);
            if (!current) {
              bestByProperty.set(link.object_id, candidate);
              continue;
            }

            if (candidate.is_title_image && !current.is_title_image) {
              bestByProperty.set(link.object_id, candidate);
              continue;
            }

            if (candidate.is_title_image === current.is_title_image && candidate.display_order < current.display_order) {
              bestByProperty.set(link.object_id, candidate);
            }
          }

          await Promise.all(
            Array.from(bestByProperty.entries()).map(async ([objectId, best]) => {
              const url = await getCachedSignedUrl(best.file_path);
              if (url) {
                imageMap.set(objectId, url);
              }
            })
          );
        }
      }

      // Query unit counts per property (same pattern as SucheTab)
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

      return (data || []).map((item: any) => ({
        listing_id: item.id,
        public_id: item.public_id,
        title: item.title || `${item.properties?.property_type} ${item.properties?.city}`,
        asking_price: item.asking_price || 0,
        property_type: item.properties?.property_type || 'Unbekannt',
        address: item.properties?.address || '',
        city: item.properties?.city || '',
        postal_code: item.properties?.postal_code,
        total_area_sqm: item.properties?.total_area_sqm,
        unit_count: unitCountMap.get(item.properties?.id) || 1,
        monthly_rent_total: item.properties?.annual_income ? item.properties.annual_income / 12 : 0,
        hero_image_path: imageMap.get(item.properties?.id) || null,
        isDemo: false,
      })) as PublicListing[];
    },
    enabled: hasSearched,
  });

  // Merge demo listings with DB listings (deduplicated by title+city)
  const allListings = useMemo(() => {
    const dbListings = listings || [];
    const dbKeys = new Set(dbListings.map((l: any) => `${l.title}|${l.city}`));
    const uniqueDemos = demoListings.filter(d => !dbKeys.has(`${d.title}|${d.city}`));
    return [...uniqueDemos.map(d => ({ ...d, isDemo: true } as any)), ...dbListings];
  }, [demoListings, listings]);

  // Investment search handler
  const handleInvestmentSearch = useCallback(async (params: SearchParams) => {
    // Save parameters to URL
    setUrlParams({
      zvE: params.zvE.toString(),
      equity: params.equity.toString(),
      status: params.maritalStatus,
      kirchensteuer: params.hasChurchTax ? '1' : '0',
      searched: '1',
    });

    setIsSearching(true);

    const { data: freshListings } = await refetch();
    // Merge demo listings with DB listings (deduplicated)
    const dbKeys = new Set((freshListings || []).map((l: any) => `${l.title}|${l.city}`));
    const demosToInclude = demoListings
      .filter(d => !dbKeys.has(`${d.title}|${d.city}`));
    const listingsToProcess = [...demosToInclude.map(d => ({ ...d, isDemo: true })), ...(freshListings || [])].slice(0, 20);

    if (listingsToProcess.length === 0) {
      setIsSearching(false);
      return;
    }

    const newCache: Record<string, InvestmentMetrics> = {};

    await Promise.all(listingsToProcess.map(async (listing: PublicListing) => {
      const monthlyRent = listing.monthly_rent_total || (listing.asking_price * 0.04 / 12);

      const input: CalculationInput = {
        ...defaultInput,
        purchasePrice: listing.asking_price,
        monthlyRent,
        equity: params.equity,
        taxableIncome: params.zvE,
        maritalStatus: params.maritalStatus,
        hasChurchTax: params.hasChurchTax,
      };

      const result = await calculate(input);
      if (result) {
        newCache[listing.listing_id] = {
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
    setIsSearching(false);
  }, [calculate, refetch, setUrlParams]);

  // Classic search handler
  const handleClassicSearch = useCallback(async (params: ClassicSearchParams) => {
    setClassicParams(params);
    // Set URL searched flag for classic search too
    setUrlParams(prev => {
      prev.set('searched', '1');
      return prev;
    });
    await refetch();
  }, [refetch, setUrlParams]);

  return (
    <div>
      {/* Hero with Floating Search */}
      <Kaufy2026Hero
        onInvestmentSearch={handleInvestmentSearch}
        onClassicSearch={handleClassicSearch}
        isLoading={isSearching || isLoadingListings}
      />

      {/* Demo Listings — always visible when demo mode is on */}
      {!hasSearched && demoListings.length > 0 && (
        <section className="py-12 px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-[hsl(220,20%,10%)] mb-6 flex items-center gap-2">
            Aktuelle Kapitalanlagen
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">DEMO</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoListings.map((listing) => (
              <InvestmentResultTile
                key={listing.listing_id}
                listing={listing as any}
                metrics={null}
                linkPrefix="/website/kaufy/immobilien"
                showProvision={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Results Section */}
      {hasSearched && (
        <section className="py-12 px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-[hsl(220,20%,10%)] mb-6">
            Passende Kapitalanlage-Objekte
            {allListings.length > 0 && (
              <span className="text-base font-normal text-[hsl(215,16%,47%)] ml-2">
                ({allListings.length} Ergebnisse)
              </span>
            )}
          </h2>

          {isSearching || isLoadingListings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(210,80%,55%)]" />
            </div>
          ) : allListings.length === 0 ? (
            <div className="text-center py-12 bg-[hsl(210,30%,97%)] rounded-2xl">
              <Building2 className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-4" />
              <p className="text-[hsl(215,16%,47%)]">
                Keine Objekte gefunden. Passen Sie Ihre Suchkriterien an.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allListings.map((listing: any) => (
                <InvestmentResultTile
                  key={listing.listing_id}
                  listing={listing}
                  metrics={metricsCache[listing.listing_id] || null}
                  linkPrefix="/website/kaufy/immobilien"
                  showProvision={false}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Perspektiven Cards */}
      <PerspektivenKarten />

      {/* Perspektiven Akkordeon */}
      <PerspektivenAkkordeon />

      {/* Zahlen Section */}
      <ZahlenSektion />
    </div>
  );
}
