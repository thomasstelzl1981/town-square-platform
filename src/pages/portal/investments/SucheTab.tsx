/**
 * MOD-08 Investment Search Tab
 * Two modes: Investment-Suche (zVE + EK) and Klassische Suche
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoListings } from '@/hooks/useDemoListings';
import { getCachedSignedUrl } from '@/lib/imageCache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InvestmentResultTile } from '@/components/investment/InvestmentResultTile';
import { 
  Search, Calculator, Loader2, Building2, 
  TrendingUp, LayoutGrid, List 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaWidgetGrid } from '@/components/shared/MediaWidgetGrid';
import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import { mapAfaModelToEngine } from '@/lib/mapAfaModel';
import { useInvestmentFavorites, useToggleInvestmentFavorite, type SearchParams } from '@/hooks/useInvestmentFavorites';
import { useIsMobile } from '@/hooks/use-mobile';

interface PublicListing {
  listing_id: string;
  public_id: string;
  property_id: string | null;
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

type SearchMode = 'investment' | 'classic';
type ViewMode = 'grid' | 'list';

export default function SucheTab() {
  const isMobile = useIsMobile();
  // Search mode
  const [searchMode, setSearchMode] = useState<SearchMode>('investment');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Investment search params
  const [zve, setZve] = useState(60000);
  const [equity, setEquity] = useState(50000);
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');
  const [hasChurchTax, setHasChurchTax] = useState(false);

  // Classic search params
  const [cityFilter, setCityFilter] = useState('');
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [areaMin, setAreaMin] = useState<number | null>(null);
  const [yieldMin, setYieldMin] = useState<number | null>(null);

  // Metrics cache for investment search
  const [metricsCache, setMetricsCache] = useState<Record<string, { monthlyBurden: number; roiAfterTax: number; loanAmount: number }>>({});

  const { calculate, isLoading: isCalculating } = useInvestmentEngine();
  const { data: favorites = [] } = useInvestmentFavorites();
  const toggleFavorite = useToggleInvestmentFavorite();
  const { kaufyListings: allDemoListings } = useDemoListings();
  // Filter out project demo listings (new_construction) — only real portfolio demos
  const demoListings = useMemo(() => 
    allDemoListings.filter(d => d.property_type !== 'new_construction'), 
    [allDemoListings]
  );

  // Fetch public listings with title images
  const { data: listings = [], isLoading: isLoadingListings, refetch } = useQuery({
    queryKey: ['public-listings-search', cityFilter, priceMax, areaMin],
    queryFn: async () => {
      // Fetch listings
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
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply classic filters
      if (cityFilter) {
        query = query.ilike('properties.city', `%${cityFilter}%`);
      }
      if (priceMax) {
        query = query.lte('asking_price', priceMax);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Listings query error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get property IDs for image lookup
      const propertyIds = data
        .map((item: any) => item.properties?.id)
        .filter(Boolean) as string[];

      // Pick best image per property:
      // 1) is_title_image=true
      // 2) lowest display_order
      const imageMap = new Map<string, string>();

      if (propertyIds.length > 0) {
        const { data: imageLinks, error: linksError } = await supabase
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
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });

        if (linksError) {
          console.warn('Title image lookup error:', linksError);
        } else {
          const bestByProperty = new Map<
            string,
            { file_path: string; is_title_image: boolean; display_order: number }
          >();

          for (const link of (imageLinks || []) as any[]) {
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

            // Prefer explicit title image
            if (candidate.is_title_image && !current.is_title_image) {
              bestByProperty.set(link.object_id, candidate);
              continue;
            }

            // Otherwise, prefer lower display_order
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

      // Transform to PublicListing format with hero images
      return (data || []).map((item: any) => ({
        listing_id: item.id,
        public_id: item.public_id,
        property_id: item.properties?.id || null,
        title: item.title || `${item.properties?.property_type} ${item.properties?.city}`,
        asking_price: item.asking_price || 0,
        property_type: item.properties?.property_type || 'Unbekannt',
        address: item.properties?.address || '',
        city: item.properties?.city || '',
        postal_code: item.properties?.postal_code,
        total_area_sqm: item.properties?.total_area_sqm,
        unit_count: unitCountMap.get(item.properties?.id) || 1,
        monthly_rent_total: item.properties?.annual_income 
          ? item.properties.annual_income / 12 
          : 0,
        hero_image_path: imageMap.get(item.properties?.id) || null,
      })) as PublicListing[];
    },
    enabled: true,
  });

  // Merge demo listings with DB listings (deduplicated by property_id)
  // When DB listing has no image but demo has one, transfer the demo image
  const mergedListings = useMemo(() => {
    const demoByPropId = new Map(demoListings.map(d => [d.property_id, d]));
    const dbPropertyIds = new Set<string>();
    const enrichedDb = listings.map(l => {
      if (l.property_id) dbPropertyIds.add(l.property_id);
      const demoMatch = l.property_id ? demoByPropId.get(l.property_id) : undefined;
      if (demoMatch && !l.hero_image_path && demoMatch.hero_image_path) {
        return { ...l, hero_image_path: demoMatch.hero_image_path };
      }
      return l;
    });
    const demos = demoListings.filter(d => !dbPropertyIds.has(d.property_id));
    return [...demos, ...enrichedDb];
  }, [listings, demoListings]);

  // Filter by yield (client-side)
  const filteredListings = useMemo(() => {
    if (!yieldMin) return mergedListings;
    return mergedListings.filter(l => {
      const grossYield = l.asking_price > 0 
        ? (l.monthly_rent_total * 12) / l.asking_price * 100
        : 0;
      return grossYield >= yieldMin;
    });
  }, [mergedListings, yieldMin]);

  // Calculate metrics for investment search - FIX: use fresh data from refetch
  const handleInvestmentSearch = useCallback(async () => {
    // First fetch listings from DB
    const { data: freshListings } = await refetch();
    
    // Merge demo listings with DB listings for calculation (deduplicated by property_id)
    const dbPropertyIds = new Set((freshListings || []).map((l: PublicListing) => l.property_id).filter(Boolean));
    const demosToInclude = demoListings.filter(d => !dbPropertyIds.has(d.property_id));
    const allListingsToProcess = [...demosToInclude, ...(freshListings || [])].slice(0, 30);
    
    if (allListingsToProcess.length === 0) {
      setHasSearched(true);
      return;
    }

    // Batch-fetch property_accounting for all property_ids (SSOT for AfA)
    const propertyIds = allListingsToProcess.map(l => l.property_id).filter(Boolean) as string[];
    const accountingMap = new Map<string, { afa_rate_percent: number | null; afa_model: string | null; building_share_percent: number | null }>();
    if (propertyIds.length > 0) {
      const { data: accountingRows } = await supabase
        .from('property_accounting')
        .select('property_id, afa_rate_percent, afa_model, building_share_percent')
        .in('property_id', propertyIds);
      for (const row of (accountingRows || [])) {
        accountingMap.set(row.property_id, row);
      }
    }

    // Calculate metrics for ALL listings (DB + demo) in parallel
    const newCache: Record<string, any> = {};
    
    await Promise.all(allListingsToProcess.map(async (listing: PublicListing) => {
      const monthlyRent = listing.monthly_rent_total || (listing.asking_price * 0.04 / 12);
      const acct = listing.property_id ? accountingMap.get(listing.property_id) : undefined;
      
      const input: CalculationInput = {
        ...defaultInput,
        purchasePrice: listing.asking_price,
        monthlyRent,
        equity,
        taxableIncome: zve,
        maritalStatus,
        hasChurchTax,
        afaRateOverride: acct?.afa_rate_percent ?? undefined,
        buildingShare: acct?.building_share_percent ? acct.building_share_percent / 100 : 0.8,
        afaModel: mapAfaModelToEngine(acct?.afa_model),
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
    setHasSearched(true);
  }, [equity, zve, maritalStatus, hasChurchTax, calculate, refetch, demoListings]);

  const handleClassicSearch = useCallback(() => {
    setHasSearched(true);
    refetch();
  }, [refetch]);

  const isFavorite = useCallback((listingId: string) => {
    return favorites.some(f => f.listing_id === listingId);
  }, [favorites]);

  const handleToggleFavorite = useCallback((listing: PublicListing) => {
    const searchParams: SearchParams = {
      zve,
      equity,
      maritalStatus,
      hasChurchTax,
    };

    toggleFavorite.mutate({
      listingId: listing.listing_id,
      title: listing.title,
      price: listing.asking_price,
      location: listing.city,
      propertyData: {
        property_type: listing.property_type,
        total_area_sqm: listing.total_area_sqm,
        monthly_rent: listing.monthly_rent_total,
      },
      searchParams,
      calculatedBurden: metricsCache[listing.listing_id]?.monthlyBurden,
      isCurrentlyFavorite: isFavorite(listing.listing_id),
    });
  }, [toggleFavorite, zve, equity, maritalStatus, hasChurchTax, metricsCache, isFavorite]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <PageShell>
      <ModulePageHeader title="SUCHE" description={isMobile ? "Kapitalanlage finden" : "Finden Sie passende Kapitalanlage-Objekte für Ihre Situation"} />

      {/* Media Widgets — hidden on mobile */}
      {!isMobile && <MediaWidgetGrid />}

      {/* Search Mode Toggle */}
      <Card>
        <CardHeader className={isMobile ? "pb-2 px-3 pt-3" : "pb-3"}>
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="investment" className="gap-2">
                <Calculator className="w-4 h-4" />
                {isMobile ? 'Investment' : 'Investment-Suche'}
              </TabsTrigger>
              <TabsTrigger value="classic" className="gap-2">
                <Search className="w-4 h-4" />
                {isMobile ? 'Klassisch' : 'Klassische Suche'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className={isMobile ? "space-y-3 px-3 pb-3" : "space-y-4"}>
          {searchMode === 'investment' ? (
            <>
              {/* Investment Search Form — stacked on mobile, 4-col on desktop */}
              <div className={cn(
                "grid gap-4",
                isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4"
              )}>
                <div className="space-y-2">
                  <Label>zu versteuerndes Einkommen (zVE)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={zve}
                      onChange={(e) => setZve(Number(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Eigenkapital</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={equity}
                      onChange={(e) => setEquity(Number(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  </div>
                </div>

                {/* On mobile: Familienstand & Kirchensteuer side by side */}
                {isMobile ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Familienstand</Label>
                      <Select value={maritalStatus} onValueChange={(v) => setMaritalStatus(v as 'single' | 'married')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Ledig</SelectItem>
                          <SelectItem value="married">Verheiratet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kirchensteuer</Label>
                      <Select value={hasChurchTax ? 'yes' : 'no'} onValueChange={(v) => setHasChurchTax(v === 'yes')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">Nein</SelectItem>
                          <SelectItem value="yes">Ja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Familienstand</Label>
                      <Select value={maritalStatus} onValueChange={(v) => setMaritalStatus(v as 'single' | 'married')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Ledig</SelectItem>
                          <SelectItem value="married">Verheiratet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kirchensteuer</Label>
                      <Select value={hasChurchTax ? 'yes' : 'no'} onValueChange={(v) => setHasChurchTax(v === 'yes')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">Nein</SelectItem>
                          <SelectItem value="yes">Ja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              {/* Prominent search button — full-width on mobile */}
              <Button 
                onClick={handleInvestmentSearch} 
                disabled={isLoadingListings || isCalculating}
                className={isMobile ? "w-full h-12 text-base" : ""}
                size={isMobile ? "lg" : "default"}
              >
                {(isLoadingListings || isCalculating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ergebnisse anzeigen
              </Button>
            </>
          ) : (
            <>
              {/* Classic Search Form — stacked on mobile */}
              <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4")}>
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

                {/* On mobile: Fläche & Rendite side by side */}
                {isMobile ? (
                  <div className="grid grid-cols-2 gap-3">
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
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Prominent search button — full-width on mobile */}
              <Button 
                onClick={handleClassicSearch} 
                disabled={isLoadingListings}
                className={isMobile ? "w-full h-12 text-base" : ""}
                size={isMobile ? "lg" : "default"}
              >
                {isLoadingListings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Suchen
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {/* Results - always visible (demo listings show immediately) */}
      <div className="space-y-4">
        {/* Results Header */}
        {hasSearched && (
          <div className={cn("flex items-center justify-between", isMobile && "flex-col gap-2 items-start")}>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className={isMobile ? "text-base px-3 py-1" : "text-sm"}>
                {filteredListings.length} Objekte
              </Badge>
              {searchMode === 'investment' && !isMobile && (
                <span className="text-sm text-muted-foreground">
                  berechnet für {formatCurrency(zve)} zVE · {formatCurrency(equity)} EK
                </span>
              )}
            </div>

            {/* View mode toggle — hidden on mobile (always single column) */}
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Listings Grid/List — only after search */}
        {!hasSearched ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary opacity-70" />
              <h3 className="text-lg font-semibold mb-2">Finden Sie Ihre nächste Kapitalanlage</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Geben Sie Ihr zu versteuerndes Einkommen und Eigenkapital ein, um passende Objekte mit 
                individueller Belastungsberechnung zu finden.
              </p>
            </CardContent>
          </Card>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Keine Ergebnisse</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Für Ihre Suchkriterien wurden keine passenden Objekte gefunden.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            isMobile 
              ? 'flex flex-col gap-4'
              : viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'flex flex-col gap-4'
          )}>
            {filteredListings.map((listing) => (
              <InvestmentResultTile
                key={listing.listing_id}
                listing={listing}
                metrics={searchMode === 'investment' ? metricsCache[listing.listing_id] : null}
                isFavorite={isFavorite(listing.listing_id)}
                onToggleFavorite={() => handleToggleFavorite(listing)}
                linkPrefix="/portal/investments/objekt"
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
