/**
 * MOD-08 Investment Search Tab
 * Two modes: Investment-Suche (zVE + EK) and Klassische Suche
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { InvestmentResultTile } from '@/components/investment/InvestmentResultTile';
import { 
  Search, Calculator, ChevronDown, Loader2, Building2, 
  TrendingUp, Filter, LayoutGrid, List 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import { useInvestmentFavorites, useToggleInvestmentFavorite, type SearchParams } from '@/hooks/useInvestmentFavorites';

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

type SearchMode = 'investment' | 'classic';
type ViewMode = 'grid' | 'list';

export default function SucheTab() {
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

  // Fetch public listings
  const { data: listings = [], isLoading: isLoadingListings, refetch } = useQuery({
    queryKey: ['public-listings-search', cityFilter, priceMax, areaMin],
    queryFn: async () => {
      // Try v_public_listings first, fallback to direct query
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

      // Transform to PublicListing format
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
        unit_count: 1,
        monthly_rent_total: item.properties?.annual_income 
          ? item.properties.annual_income / 12 
          : 0,
        hero_image_path: null,
      })) as PublicListing[];
    },
    enabled: hasSearched || searchMode === 'classic',
  });

  // Filter by yield (client-side)
  const filteredListings = useMemo(() => {
    if (!yieldMin) return listings;
    return listings.filter(l => {
      const grossYield = l.asking_price > 0 
        ? (l.monthly_rent_total * 12) / l.asking_price * 100
        : 0;
      return grossYield >= yieldMin;
    });
  }, [listings, yieldMin]);

  // Calculate metrics for investment search - FIX: use fresh data from refetch
  const handleInvestmentSearch = useCallback(async () => {
    // First fetch listings
    const { data: freshListings } = await refetch();
    const listingsToProcess = (freshListings || []).slice(0, 20);
    
    if (listingsToProcess.length === 0) {
      setHasSearched(true);
      return;
    }

    // Calculate metrics for ALL listings in parallel BEFORE setting hasSearched
    const newCache: Record<string, any> = {};
    
    await Promise.all(listingsToProcess.map(async (listing: PublicListing) => {
      const loanAmount = listing.asking_price - equity;
      const monthlyRent = listing.monthly_rent_total || (listing.asking_price * 0.04 / 12);
      
      const input: CalculationInput = {
        ...defaultInput,
        purchasePrice: listing.asking_price,
        monthlyRent,
        equity,
        taxableIncome: zve,
        maritalStatus,
        hasChurchTax,
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

    // Update cache first, THEN set hasSearched
    setMetricsCache(newCache);
    setHasSearched(true);
  }, [equity, zve, maritalStatus, hasChurchTax, calculate, refetch]);

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Objektsuche</h1>
        <p className="text-muted-foreground">
          Finden Sie passende Kapitalanlage-Objekte für Ihre Situation
        </p>
      </div>

      {/* Search Mode Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)}>
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
            <>
              {/* Investment Search Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="flex items-end">
                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="w-full">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <Filter className="w-4 h-4" />
                        Mehr Optionen
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                </div>
              </div>

              {/* Advanced Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleContent className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </CollapsibleContent>
              </Collapsible>

              <Button 
                onClick={handleInvestmentSearch} 
                disabled={isLoadingListings || isCalculating}
                className="w-full md:w-auto"
              >
                {(isLoadingListings || isCalculating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ergebnisse anzeigen
              </Button>
            </>
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

              <Button 
                onClick={handleClassicSearch} 
                disabled={isLoadingListings}
                className="w-full md:w-auto"
              >
                {isLoadingListings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Suchen
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {filteredListings.length} Objekte
              </Badge>
              {searchMode === 'investment' && (
                <span className="text-sm text-muted-foreground">
                  berechnet für {formatCurrency(zve)} zVE · {formatCurrency(equity)} EK
                </span>
              )}
            </div>

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
          </div>

          {/* Listings Grid/List */}
          {isLoadingListings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredListings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Keine Objekte gefunden</p>
                <p className="text-sm text-muted-foreground">Passen Sie Ihre Suchkriterien an</p>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
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
      )}

      {/* Initial State */}
      {!hasSearched && (
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
      )}
    </div>
  );
}
