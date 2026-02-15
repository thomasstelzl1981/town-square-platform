/**
 * InvestmentExposePage — Vollbild-Exposé für MOD-08 (Investment-Suche)
 * 
 * REFAKTORISIERT: Nutzt jetzt gemeinsame Komponenten aus src/components/investment/
 * - MasterGraph
 * - Haushaltsrechnung  
 * - InvestmentSliderPanel
 * - DetailTable40Jahre
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDemoListings } from '@/hooks/useDemoListings';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Maximize2,
  Calendar,
  Share2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useInvestmentEngine, defaultInput, CalculationInput } from '@/hooks/useInvestmentEngine';
import {
  MasterGraph,
  Haushaltsrechnung,
  InvestmentSliderPanel,
  DetailTable40Jahre,
  ExposeImageGallery,
  ExposeDocuments,
  FinanzierungSummary,
} from '@/components/investment';
import { ExposeLocationMap } from '@/components/verkauf';

interface ListingData {
  id: string;
  public_id: string;
  property_id: string;
  title: string;
  description: string;
  asking_price: number;
  property_type: string;
  address: string;
  address_house_no?: string | null;
  city: string;
  postal_code: string;
  total_area_sqm: number;
  year_built: number;
  renovation_year?: number | null;
  energy_source?: string | null;
  heating_type?: string | null;
  monthly_rent: number;
  units_count: number;
  hero_image_url?: string | null;
}

export default function InvestmentExposePage() {
  const { publicId } = useParams<{ publicId: string }>();
  const isMobile = useIsMobile();
  const [isFavorite, setIsFavorite] = useState(false);
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();
  const { kaufyListings: demoListings, demoProperties } = useDemoListings();

  // Interactive parameters state
  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: 250000,
    monthlyRent: 800,
  });

  // Fetch listing data - support demo, public_id, and direct listing_id (UUID)
  const { data: listing, isLoading } = useQuery({
    queryKey: ['investment-listing', publicId, demoListings.length],
    queryFn: async () => {
      if (!publicId) return null;

      // Check if this is a demo listing (case-insensitive due to PathNormalizer)
      const pubIdUpper = publicId.toUpperCase();
      const demoListing = demoListings.find(d => d.public_id.toUpperCase() === pubIdUpper);
      if (demoListing) {
        return {
          id: demoListing.listing_id,
          public_id: demoListing.public_id,
          property_id: demoListing.listing_id,
          title: demoListing.title,
          description: '',
          asking_price: demoListing.asking_price,
          property_type: demoListing.property_type,
          address: demoListing.address,
          address_house_no: null,
          city: demoListing.city,
          postal_code: demoListing.postal_code || '',
          total_area_sqm: demoListing.total_area_sqm || 0,
          year_built: 0,
          renovation_year: null,
          energy_source: null,
          heating_type: null,
          monthly_rent: demoListing.monthly_rent_total,
          units_count: demoListing.unit_count,
          hero_image_url: demoListing.hero_image_path || null,
        } satisfies ListingData;
      }

      // Try public_id first
      let { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          public_id,
          title,
          description,
          asking_price,
          property_id,
          properties!inner (
            id,
            property_type,
            address,
            address_house_no,
            city,
            postal_code,
            total_area_sqm,
            year_built,
            renovation_year,
            energy_source,
            heating_type,
            annual_income
          )
        `)
        .eq('public_id', publicId)
        .maybeSingle();

      // If not found by public_id, try by UUID (listing id)
      if (!data && !error) {
        const uuidResult = await supabase
          .from('listings')
          .select(`
            id,
            public_id,
            title,
            description,
            asking_price,
            property_id,
            properties!inner (
              id,
              property_type,
              address,
              address_house_no,
              city,
              postal_code,
              total_area_sqm,
              year_built,
              renovation_year,
              energy_source,
              heating_type,
              annual_income
            )
        `)
        .eq('id', publicId)
        .maybeSingle();
        
        data = uuidResult.data;
        error = uuidResult.error;
      }

      if (error || !data) {
        return null;
      }

      const props = data.properties as any;
      const annualIncome = props?.annual_income || 0;

      // Query units_count from DB
      const propertyId = (data as any).property_id || props?.id;
      const { count: unitsCount } = await supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId);

      return {
        id: data.id,
        public_id: data.public_id,
        property_id: propertyId,
        title: data.title || 'Immobilie',
        description: data.description || '',
        asking_price: data.asking_price || 0,
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
      } satisfies ListingData;
    },
    enabled: !!publicId,
  });

  // Initialize params with listing data
  useEffect(() => {
    if (listing) {
      setParams(prev => ({
        ...prev,
        purchasePrice: listing.asking_price || 250000,
        monthlyRent: listing.monthly_rent || Math.round((listing.asking_price || 250000) * 0.004),
      }));
    }
  }, [listing]);

  // Calculate when params change
  useEffect(() => {
    if (params.purchasePrice > 0) {
      calculate(params);
    }
  }, [params, calculate]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    // STUB: Favoriten-Persistenz erfordert DB-Tabelle investment_favorites (DATA-001)
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Objekt nicht gefunden</p>
        <Link to="/portal/investments/suche">
          <Button className="mt-4">Zurück zur Suche</Button>
        </Link>
      </div>
    );
  }

  const propertyTypeLabel = {
    multi_family: 'Mehrfamilienhaus',
    single_family: 'Einfamilienhaus',
    apartment: 'Eigentumswohnung',
    commercial: 'Gewerbe',
  }[listing.property_type] || 'Immobilie';

  const addressLine = `${listing.postal_code} ${listing.city}, ${listing.address}${listing.address_house_no ? ` ${listing.address_house_no}` : ''}`;
  const grossYield = listing.asking_price > 0 ? ((params.monthlyRent * 12) / listing.asking_price) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className={cn("border-b bg-card sticky top-0 z-10", isMobile && "px-3")}>
        <div className={cn("flex items-center justify-between", isMobile ? "py-3" : "px-6 py-4")}>
          <Link 
            to="/portal/investments/suche" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isMobile ? 'Zurück' : 'Zurück zur Suche'}
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleFavorite}>
              <Heart className={`w-4 h-4 ${isMobile ? '' : 'mr-2'} ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {!isMobile && (isFavorite ? 'Gespeichert' : 'Merken')}
            </Button>
            {!isMobile && (
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Teilen
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("relative", isMobile ? "p-3" : "p-6")}>
        <div className={cn(isMobile ? "space-y-6" : "grid lg:grid-cols-3 gap-8")}>
          {/* Left Column - Property Info & Calculations */}
          <div className={cn(!isMobile && "lg:col-span-2", "space-y-6")}>
            {/* Image Gallery */}
            <ExposeImageGallery 
              propertyId={listing.property_id}
              heroImageUrl={listing.hero_image_url}
              aspectRatio="video"
            />

            {/* Property Details */}
            <div>
              <div className={cn("mb-4", isMobile ? "space-y-2" : "flex items-start justify-between")}>
                <div>
                  <Badge className="mb-2">{propertyTypeLabel}</Badge>
                  <h1 className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>{listing.title}</h1>
                  <p className="flex items-center gap-1 mt-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {addressLine}
                  </p>
                </div>
                <p className={cn("font-bold text-primary", isMobile ? "text-2xl" : "text-3xl")}>
                  {formatCurrency(listing.asking_price)}
                </p>
              </div>

              {/* Key Facts — 3-col grid on mobile */}
              <div className={cn("gap-4 p-4 rounded-xl bg-muted/50 grid", isMobile ? "grid-cols-3" : "grid-cols-2 md:grid-cols-6")}>
                <div>
                  <p className="text-sm text-muted-foreground">Wohnfläche</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Maximize2 className="w-4 h-4" /> {listing.total_area_sqm} m²
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Baujahr</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {listing.year_built || '–'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Einheiten</p>
                  <p className="font-semibold">{listing.units_count} WE</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Miete (kalt)</p>
                  <p className="font-semibold">{formatCurrency(params.monthlyRent)}/Mo</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rendite (brutto)</p>
                  <p className="font-semibold">{grossYield > 0 ? `${grossYield.toFixed(1)}%` : '–'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Heizung</p>
                  <p className="font-semibold">{listing.heating_type || '–'}</p>
                </div>
              </div>

              {listing.description && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Beschreibung</h3>
                  <p className="text-muted-foreground">{listing.description}</p>
                </div>
              )}

            </div>

            {/* MasterGraph - Gemeinsame Komponente */}
            {isCalculating ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : calcResult ? (
              <MasterGraph 
                projection={calcResult.projection} 
                title="Wertentwicklung (40 Jahre)"
                variant="full"
              />
            ) : null}

            {/* Haushaltsrechnung - T-Konto-Stil */}
            {calcResult && (
              <Haushaltsrechnung 
                result={calcResult} 
                variant="ledger"
                showMonthly={true}
              />
            )}

            {/* FinanzierungSummary */}
            {calcResult && (
              <FinanzierungSummary
                purchasePrice={listing.asking_price}
                equity={params.equity}
                result={calcResult}
              />
            )}

            {/* Detail Table - Gemeinsame Komponente */}
            {calcResult && (
              <DetailTable40Jahre 
                projection={calcResult.projection}
                defaultOpen={false}
              />
            )}

            {/* Dokumente */}
            <ExposeDocuments propertyId={listing.property_id} viewerType="internal" />

            {/* Standortkarte - GANZ UNTEN */}
            <div className="mt-6">
              <ExposeLocationMap
                address={listing.address}
                city={listing.city}
                postalCode={listing.postal_code}
                showExactLocation={false}
              />
            </div>
          </div>

          {/* Right Column - Interactive Calculator (STICKY on desktop, inline on mobile) */}
          {isMobile ? (
            <div className="space-y-6">
              <InvestmentSliderPanel
                value={params}
                onChange={setParams}
                layout="vertical"
                showAdvanced={false}
                purchasePrice={listing.asking_price}
              />
            </div>
          ) : (
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
                  <InvestmentSliderPanel
                    value={params}
                    onChange={setParams}
                    layout="vertical"
                    showAdvanced={true}
                    purchasePrice={listing.asking_price}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
