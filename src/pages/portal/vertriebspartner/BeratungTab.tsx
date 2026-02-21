/**
 * BeratungTab — MOD-09 Vertriebspartner Investment-Beratung
 * 
 * FIXES:
 * - enabled: false → no auto-search on page load
 * - Added onboarding hero, sorting, summary bar, top-recommendation badges
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Calculator, Search, Loader2, Newspaper, Users, Sparkles, TrendingUp, Shield, ArrowUpDown } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DESIGN } from '@/config/designManifest';
import { ManagerVisitenkarte } from '@/components/shared/ManagerVisitenkarte';
import { MarketReportWidget } from '@/components/shared/MarketReportWidget';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import { PartnerSearchForm, type PartnerSearchParams } from '@/components/vertriebspartner';
import { InvestmentResultTile } from '@/components/investment/InvestmentResultTile';
import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import { usePartnerSelections } from '@/hooks/usePartnerListingSelections';
import { fetchPropertyImages } from '@/lib/fetchPropertyImages';
import { useDemoListings, deduplicateByField } from '@/hooks/useDemoListings';
import { MediaWidgetGrid } from '@/components/shared/MediaWidgetGrid';
import { useIsMobile } from '@/hooks/use-mobile';

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
type SortMode = 'default' | 'price_asc' | 'price_desc' | 'yield_desc' | 'burden_asc' | 'area_desc';

const BeratungTab = () => {
  const isMobile = useIsMobile();
  const { kaufyListings: allDemoListings } = useDemoListings();
  const demoListings = useMemo(() => 
    allDemoListings.filter(d => d.property_type !== 'new_construction'),
    [allDemoListings]
  );

  const [searchMode, setSearchMode] = useState<SearchMode>('investment');
  const [sortMode, setSortMode] = useState<SortMode>('default');

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

  // FIXED: enabled: false — no auto-fetch on page load
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
          annual_rent: props?.annual_income || 0,
          hero_image_path: imageMap.get(props.id) || null,
          property_id: props?.id || '',
          unit_count: unitCountMap.get(props?.id) || 1,
        } as RawListing;
      });
    },
    enabled: false,
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

    if (!hasSearched) return [];
    return merged;
  }, [getMergedListings, searchMode, hasSearched, cityFilter, priceMax, areaMin, yieldMin]);

  // Sort listings
  const sortedListings = useMemo(() => {
    const list = [...visibleListings];
    switch (sortMode) {
      case 'price_asc':
        return list.sort((a, b) => a.asking_price - b.asking_price);
      case 'price_desc':
        return list.sort((a, b) => b.asking_price - a.asking_price);
      case 'yield_desc':
        return list.sort((a, b) => {
          const yA = a.asking_price > 0 ? a.annual_rent / a.asking_price : 0;
          const yB = b.asking_price > 0 ? b.annual_rent / b.asking_price : 0;
          return yB - yA;
        });
      case 'burden_asc':
        return list.sort((a, b) => {
          const bA = metricsCache[a.id]?.monthlyBurden ?? Infinity;
          const bB = metricsCache[b.id]?.monthlyBurden ?? Infinity;
          return bA - bB;
        });
      case 'area_desc':
        return list.sort((a, b) => (b.total_area_sqm || 0) - (a.total_area_sqm || 0));
      default:
        return list;
    }
  }, [visibleListings, sortMode, metricsCache]);

  // Top recommendations (lowest burden, max 3)
  const topListingIds = useMemo(() => {
    if (searchMode !== 'investment' || Object.keys(metricsCache).length === 0) return new Set<string>();
    const withMetrics = visibleListings
      .filter(l => metricsCache[l.id])
      .sort((a, b) => metricsCache[a.id].monthlyBurden - metricsCache[b.id].monthlyBurden)
      .slice(0, 3);
    return new Set(withMetrics.map(l => l.id));
  }, [visibleListings, metricsCache, searchMode]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!hasSearched || sortedListings.length === 0) return null;
    const yields = sortedListings.map(l => l.asking_price > 0 ? (l.annual_rent / l.asking_price) * 100 : 0);
    const bestYield = Math.max(...yields);
    const burdens = sortedListings
      .map(l => metricsCache[l.id]?.monthlyBurden)
      .filter((b): b is number => b !== undefined);
    const lowestBurden = burdens.length > 0 ? Math.min(...burdens) : null;
    const positiveCashflowCount = burdens.filter(b => b <= 0).length;
    return { bestYield, lowestBurden, positiveCashflowCount, total: sortedListings.length };
  }, [hasSearched, sortedListings, metricsCache]);

  const isLoading = isLoadingListings || isCalculating;

  return (
    <PageShell>
      <ModulePageHeader
        title="KUNDENBERATUNG"
        description="Finden Sie das perfekte Investment für Ihren Kunden"
        actions={hasSearched ? <Badge variant="secondary">{sortedListings.length} Objekt{sortedListings.length !== 1 ? 'e' : ''}</Badge> : undefined}
      />

      {/* ═══ DASHBOARD_HEADER: Visitenkarte + Marktlage ═══ */}
      <div className={DESIGN.DASHBOARD_HEADER.GRID}>
        <ManagerVisitenkarte
          role="Immomanager / Vertriebspartner"
          gradientFrom="hsl(160,60%,40%)"
          gradientTo="hsl(180,50%,45%)"
          badgeText="Kundenberatung"
        />
        <MarketReportWidget
          icon={Newspaper}
          title="Marktlage"
          subtitle="Wohnimmobilien — Preise & Trends"
          buttonLabel="Marktbericht anzeigen"
          gradientFrom="hsl(160,60%,40%)"
          gradientTo="hsl(180,50%,45%)"
          sheetTitle="Immobilienmarkt-Report"
          sheetDescription="KI-gestützter Bericht zur aktuellen Marktlage"
          functionName="sot-market-pulse-report"
        />
      </div>

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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="flex justify-center w-full">
                <Button onClick={handleClassicSearch} disabled={isLoadingListings} className="gap-2">
                  {isLoadingListings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Ergebnisse anzeigen
                </Button>
              </div>
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
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className={cn("font-bold mb-3", isMobile ? "text-xl" : "text-2xl")}>
                Kundenberatung starten
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                {searchMode === 'investment'
                  ? 'Geben Sie das zu versteuernde Einkommen und Eigenkapital Ihres Kunden ein. Wir berechnen für jedes Objekt die individuelle monatliche Belastung nach Steuern — ohne Provisionsanzeige.'
                  : 'Filtern Sie nach Stadt, Kaufpreis, Fläche oder Rendite, um passende Objekte für Ihren Kunden zu finden.'}
              </p>
              
              {!isMobile && (
                <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-muted-foreground font-medium">Steueroptimiert</span>
                    <span className="text-xs text-muted-foreground/70">Nach §35a EStG</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-muted-foreground font-medium">Kundenfreundlich</span>
                    <span className="text-xs text-muted-foreground/70">Keine Provisionsdaten</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
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
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {summaryStats.total} Objekte
                  </Badge>
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
              </div>
            )}

            {/* ═══ LISTINGS GRID ═══ */}
            {sortedListings.length === 0 ? (
              <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Keine Objekte im Partner-Netzwerk verfügbar
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedListings.map((listing) => (
                  <InvestmentResultTile
                    key={listing.id}
                    listing={transformToPublicListing(listing)}
                    metrics={searchMode === 'investment' ? (metricsCache[listing.id] || null) : null}
                    showProvision={false}
                    linkPrefix="/portal/vertriebspartner/beratung/objekt"
                    isTopRecommendation={topListingIds.has(listing.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
};

export default BeratungTab;
