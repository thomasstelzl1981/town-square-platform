/**
 * MOD-08 Investment Search Tab
 * Two modes: Investment-Suche (zVE + EK) and Klassische Suche
 * 
 * FIXES: 
 * - enabled: false → no auto-search on page load
 * - Added onboarding hero, sorting, summary bar, top-recommendation badges
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
  TrendingUp, LayoutGrid, List, Sparkles, Shield, BarChart3, ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaWidgetGrid } from '@/components/shared/MediaWidgetGrid';
import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import { useInvestmentFavorites, useToggleInvestmentFavorite, type SearchParams } from '@/hooks/useInvestmentFavorites';
import { useIsMobile } from '@/hooks/use-mobile';

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
type SortMode = 'default' | 'price_asc' | 'price_desc' | 'yield_desc' | 'burden_asc' | 'area_desc';

export default function SucheTab() {
  const isMobile = useIsMobile();
  // Search mode
  const [searchMode, setSearchMode] = useState<SearchMode>('investment');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');

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
  const [metricsCache, setMetricsCache] = useState<Record<string, { monthlyBurden: number; roiAfterTax: number; loanAmount: number; yearlyInterest?: number; yearlyRepayment?: number; yearlyTaxSavings?: number }>>({});

  const { calculate, isLoading: isCalculating } = useInvestmentEngine();
  const { data: favorites = [] } = useInvestmentFavorites();
  const toggleFavorite = useToggleInvestmentFavorite();
  const { kaufyListings: allDemoListings } = useDemoListings();
  const demoListings = useMemo(() => 
    allDemoListings.filter(d => d.property_type !== 'new_construction'), 
    [allDemoListings]
  );

  // Fetch public listings — FIXED: enabled: false (no auto-search)
  const { data: listings = [], isLoading: isLoadingListings, refetch } = useQuery({
    queryKey: ['public-listings-search', cityFilter, priceMax, areaMin],
    queryFn: async () => {
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

      if (!data || data.length === 0) return [];

      const propertyIds = data
        .map((item: any) => item.properties?.id)
        .filter(Boolean) as string[];

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

        if (!linksError) {
          const bestByProperty = new Map<string, { file_path: string; is_title_image: boolean; display_order: number }>();

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
              if (url) imageMap.set(objectId, url);
            })
          );
        }
      }

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
        monthly_rent_total: item.properties?.annual_income 
          ? item.properties.annual_income / 12 
          : 0,
        hero_image_path: imageMap.get(item.properties?.id) || null,
      })) as PublicListing[];
    },
    enabled: false,
  });

  // Merge demo listings with DB listings
  const mergedListings = useMemo(() => {
    const demoByKey = new Map(demoListings.map(d => [`${d.title}|${d.city}`, d]));
    const dbKeys = new Set<string>();
    const enrichedDb = listings.map(l => {
      const key = `${l.title}|${l.city}`;
      dbKeys.add(key);
      const demoMatch = demoByKey.get(key);
      if (demoMatch && !l.hero_image_path && demoMatch.hero_image_path) {
        return { ...l, hero_image_path: demoMatch.hero_image_path };
      }
      return l;
    });
    const demos = demoListings.filter(d => !dbKeys.has(`${d.title}|${d.city}`));
    return [...demos, ...enrichedDb];
  }, [listings, demoListings]);

  // Filter by yield (client-side)
  const filteredListings = useMemo(() => {
    let result = mergedListings;
    if (yieldMin) {
      result = result.filter(l => {
        const grossYield = l.asking_price > 0 
          ? (l.monthly_rent_total * 12) / l.asking_price * 100
          : 0;
        return grossYield >= yieldMin;
      });
    }
    return result;
  }, [mergedListings, yieldMin]);

  // Sort listings
  const sortedListings = useMemo(() => {
    const list = [...filteredListings];
    switch (sortMode) {
      case 'price_asc':
        return list.sort((a, b) => a.asking_price - b.asking_price);
      case 'price_desc':
        return list.sort((a, b) => b.asking_price - a.asking_price);
      case 'yield_desc':
        return list.sort((a, b) => {
          const yA = a.asking_price > 0 ? (a.monthly_rent_total * 12) / a.asking_price : 0;
          const yB = b.asking_price > 0 ? (b.monthly_rent_total * 12) / b.asking_price : 0;
          return yB - yA;
        });
      case 'burden_asc':
        return list.sort((a, b) => {
          const bA = metricsCache[a.listing_id]?.monthlyBurden ?? Infinity;
          const bB = metricsCache[b.listing_id]?.monthlyBurden ?? Infinity;
          return bA - bB;
        });
      case 'area_desc':
        return list.sort((a, b) => (b.total_area_sqm || 0) - (a.total_area_sqm || 0));
      default:
        return list;
    }
  }, [filteredListings, sortMode, metricsCache]);

  // Determine top recommendations (lowest burden, max 3)
  const topListingIds = useMemo(() => {
    if (searchMode !== 'investment' || Object.keys(metricsCache).length === 0) return new Set<string>();
    const withMetrics = filteredListings
      .filter(l => metricsCache[l.listing_id])
      .sort((a, b) => metricsCache[a.listing_id].monthlyBurden - metricsCache[b.listing_id].monthlyBurden)
      .slice(0, 3);
    return new Set(withMetrics.map(l => l.listing_id));
  }, [filteredListings, metricsCache, searchMode]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!hasSearched || sortedListings.length === 0) return null;
    const yields = sortedListings.map(l => l.asking_price > 0 ? (l.monthly_rent_total * 12) / l.asking_price * 100 : 0);
    const bestYield = Math.max(...yields);
    const burdens = sortedListings
      .map(l => metricsCache[l.listing_id]?.monthlyBurden)
      .filter((b): b is number => b !== undefined);
    const lowestBurden = burdens.length > 0 ? Math.min(...burdens) : null;
    const positiveCashflowCount = burdens.filter(b => b <= 0).length;
    return { bestYield, lowestBurden, positiveCashflowCount, total: sortedListings.length };
  }, [hasSearched, sortedListings, metricsCache]);

  // Calculate metrics for investment search
  const handleInvestmentSearch = useCallback(async () => {
    const { data: freshListings } = await refetch();
    
    const dbKeys = new Set((freshListings || []).map((l: PublicListing) => `${l.title}|${l.city}`));
    const demosToInclude = demoListings.filter(d => !dbKeys.has(`${d.title}|${d.city}`));
    const allListingsToProcess = [...demosToInclude, ...(freshListings || [])].slice(0, 30);
    
    if (allListingsToProcess.length === 0) {
      setHasSearched(true);
      return;
    }

    const newCache: Record<string, any> = {};
    
    await Promise.all(allListingsToProcess.map(async (listing: PublicListing) => {
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
    const searchParams: SearchParams = { zve, equity, maritalStatus, hasChurchTax };
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

      {!isMobile && <MediaWidgetGrid />}

      {/* Search Mode Toggle */}
      <Card>
        <CardHeader className={isMobile ? "pb-2 px-3 pt-3" : "pb-3"}>
          <Tabs value={searchMode} onValueChange={(v) => { setSearchMode(v as SearchMode); setHasSearched(false); }}>
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
              <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4")}>
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

                {isMobile ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Familienstand</Label>
                      <Select value={maritalStatus} onValueChange={(v) => setMaritalStatus(v as 'single' | 'married')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Ledig</SelectItem>
                          <SelectItem value="married">Verheiratet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kirchensteuer</Label>
                      <Select value={hasChurchTax ? 'yes' : 'no'} onValueChange={(v) => setHasChurchTax(v === 'yes')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Ledig</SelectItem>
                          <SelectItem value="married">Verheiratet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kirchensteuer</Label>
                      <Select value={hasChurchTax ? 'yes' : 'no'} onValueChange={(v) => setHasChurchTax(v === 'yes')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">Nein</SelectItem>
                          <SelectItem value="yes">Ja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <Button 
                onClick={handleInvestmentSearch} 
                disabled={isLoadingListings || isCalculating}
                className={cn("gap-2", isMobile ? "w-full h-12 text-base" : "")}
                size={isMobile ? "lg" : "default"}
              >
                {(isLoadingListings || isCalculating) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Ergebnisse berechnen
              </Button>
            </>
          ) : (
            <>
              <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-4")}>
                <div className="space-y-2">
                  <Label>Stadt</Label>
                  <Input placeholder="z.B. Berlin, München..." value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Max. Kaufpreis</Label>
                  <div className="relative">
                    <Input type="number" placeholder="Unbegrenzt" value={priceMax || ''} onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : null)} className="pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  </div>
                </div>
                {isMobile ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Min. Fläche</Label>
                      <div className="relative">
                        <Input type="number" placeholder="Keine" value={areaMin || ''} onChange={(e) => setAreaMin(e.target.value ? Number(e.target.value) : null)} className="pr-10" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m²</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Min. Rendite</Label>
                      <div className="relative">
                        <Input type="number" placeholder="Keine" value={yieldMin || ''} onChange={(e) => setYieldMin(e.target.value ? Number(e.target.value) : null)} className="pr-8" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Min. Fläche</Label>
                      <div className="relative">
                        <Input type="number" placeholder="Keine" value={areaMin || ''} onChange={(e) => setAreaMin(e.target.value ? Number(e.target.value) : null)} className="pr-10" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m²</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Min. Rendite</Label>
                      <div className="relative">
                        <Input type="number" placeholder="Keine" value={yieldMin || ''} onChange={(e) => setYieldMin(e.target.value ? Number(e.target.value) : null)} className="pr-8" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button 
                onClick={handleClassicSearch} 
                disabled={isLoadingListings}
                className={cn("gap-2", isMobile ? "w-full h-12 text-base" : "")}
                size={isMobile ? "lg" : "default"}
              >
                {isLoadingListings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Suchen
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {!hasSearched ? (
          /* ═══ ONBOARDING HERO ═══ */
          <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className={cn("text-center", isMobile ? "py-8 px-4" : "py-16")}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className={cn("font-bold mb-3", isMobile ? "text-xl" : "text-2xl")}>
                {searchMode === 'investment' ? 'Ihre persönliche Investment-Analyse' : 'Immobilien durchsuchen'}
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                {searchMode === 'investment'
                  ? 'Geben Sie Ihr zu versteuerndes Einkommen und Eigenkapital ein. Wir berechnen für jedes Objekt Ihre individuelle monatliche Belastung nach Steuern.'
                  : 'Filtern Sie nach Stadt, Kaufpreis, Fläche oder Rendite, um passende Objekte zu finden.'}
              </p>
              
              {!isMobile && (
                <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-muted-foreground font-medium">Steueroptimiert</span>
                    <span className="text-xs text-muted-foreground/70">Individuelle Berechnung</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-muted-foreground font-medium">Geprüfte Objekte</span>
                    <span className="text-xs text-muted-foreground/70">Qualitätsgesichert</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-muted-foreground font-medium">Sofort vergleichbar</span>
                    <span className="text-xs text-muted-foreground/70">T-Konto Übersicht</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ═══ SUMMARY BAR ═══ */}
            {summaryStats && (
              <div className={cn(
                "rounded-lg border bg-card p-4",
                isMobile ? "space-y-2" : "flex items-center justify-between"
              )}>
                <div className={cn("flex items-center gap-4 flex-wrap", isMobile && "gap-2")}>
                  <Badge variant="secondary" className={cn(isMobile ? "text-base px-3 py-1" : "text-sm px-3 py-1")}>
                    {summaryStats.total} Objekte
                  </Badge>
                  {searchMode === 'investment' && !isMobile && (
                    <span className="text-sm text-muted-foreground">
                      für {formatCurrency(zve)} zVE · {formatCurrency(equity)} EK
                    </span>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      Beste Rendite: <strong className="text-green-600">{summaryStats.bestYield.toFixed(1)}%</strong>
                    </span>
                    {summaryStats.lowestBurden !== null && (
                      <span className="text-muted-foreground">
                        Niedrigste Belastung: <strong className={summaryStats.lowestBurden <= 0 ? "text-green-600" : "text-foreground"}>
                          {formatCurrency(Math.abs(summaryStats.lowestBurden))}/Mo
                        </strong>
                      </span>
                    )}
                    {summaryStats.positiveCashflowCount > 0 && (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">
                        {summaryStats.positiveCashflowCount}× positiver Cashflow
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sorting */}
                  <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                    <SelectTrigger className="w-[180px] h-9">
                      <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Sortierung" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standard</SelectItem>
                      <SelectItem value="price_asc">Preis ↑</SelectItem>
                      <SelectItem value="price_desc">Preis ↓</SelectItem>
                      <SelectItem value="yield_desc">Rendite ↓</SelectItem>
                      <SelectItem value="burden_asc">Belastung ↑</SelectItem>
                      <SelectItem value="area_desc">Fläche ↓</SelectItem>
                    </SelectContent>
                  </Select>

                  {!isMobile && (
                    <div className="flex items-center gap-1">
                      <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')}>
                        <LayoutGrid className="w-4 h-4" />
                      </Button>
                      <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}>
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ LISTINGS GRID ═══ */}
            {sortedListings.length === 0 ? (
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
                {sortedListings.map((listing) => (
                  <InvestmentResultTile
                    key={listing.listing_id}
                    listing={listing}
                    metrics={searchMode === 'investment' ? metricsCache[listing.listing_id] : null}
                    isFavorite={isFavorite(listing.listing_id)}
                    onToggleFavorite={() => handleToggleFavorite(listing)}
                    linkPrefix="/portal/investments/objekt"
                    isTopRecommendation={topListingIds.has(listing.listing_id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
