/**
 * Kaufy2026Expose — Investment Exposé Page for Zone 3
 * 
 * Reuses MOD-08 components for consistency:
 * - MasterGraph
 * - Haushaltsrechnung
 * - InvestmentSliderPanel
 * - DetailTable40Jahre
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { useInvestmentEngine, defaultInput, CalculationInput } from '@/hooks/useInvestmentEngine';
import {
  MasterGraph,
  Haushaltsrechnung,
  InvestmentSliderPanel,
  DetailTable40Jahre,
  ExposeImageGallery,
  ExposeDocuments,
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
}

export default function Kaufy2026Expose() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: 250000,
    monthlyRent: 800,
  });

  // Fetch listing data
  const { data: listing, isLoading } = useQuery({
    queryKey: ['kaufy2026-listing', publicId],
    queryFn: async () => {
      if (!publicId) return null;

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

      if (error || !data) return null;

      const props = data.properties as any;
      const annualIncome = props?.annual_income || 0;

      return {
        id: data.id,
        public_id: data.public_id,
        property_id: (data as any).property_id || props?.id,
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
        units_count: 1,
      } satisfies ListingData;
    },
    enabled: !!publicId,
  });

  useEffect(() => {
    if (listing) {
      setParams(prev => ({
        ...prev,
        purchasePrice: listing.asking_price || 250000,
        monthlyRent: listing.monthly_rent || Math.round((listing.asking_price || 250000) * 0.004),
      }));
    }
  }, [listing]);

  useEffect(() => {
    if (params.purchasePrice > 0) {
      calculate(params);
    }
  }, [params, calculate]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
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
        <p className="text-[hsl(215,16%,47%)]">Objekt nicht gefunden</p>
        <Link to="/kaufy2026">
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
    <div className="min-h-screen">
      {/* Header Navigation */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-[hsl(215,16%,47%)] hover:text-[hsl(220,20%,10%)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Suche
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleFavorite}>
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {isFavorite ? 'Gespeichert' : 'Merken'}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Teilen
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <ExposeImageGallery propertyId={listing.property_id} aspectRatio="video" />

            {/* Property Details */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2">{propertyTypeLabel}</Badge>
                  <h1 className="text-2xl font-bold text-[hsl(220,20%,10%)]">{listing.title}</h1>
                  <p className="flex items-center gap-1 mt-2 text-[hsl(215,16%,47%)]">
                    <MapPin className="w-4 h-4" />
                    {addressLine}
                  </p>
                </div>
                <p className="text-3xl font-bold text-[hsl(210,80%,55%)]">
                  {formatCurrency(listing.asking_price)}
                </p>
              </div>

              {/* Key Facts */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 rounded-xl bg-[hsl(210,30%,97%)]">
                <div>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Wohnfläche</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Maximize2 className="w-4 h-4" /> {listing.total_area_sqm} m²
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Baujahr</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {listing.year_built || '–'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Einheiten</p>
                  <p className="font-semibold">{listing.units_count} WE</p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Miete (kalt)</p>
                  <p className="font-semibold">{formatCurrency(params.monthlyRent)}/Mo</p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Rendite (brutto)</p>
                  <p className="font-semibold">{grossYield > 0 ? `${grossYield.toFixed(1)}%` : '–'}</p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(215,16%,47%)]">Heizung</p>
                  <p className="font-semibold">{listing.heating_type || '–'}</p>
                </div>
              </div>

              {listing.description && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Beschreibung</h3>
                  <p className="text-[hsl(215,16%,47%)]">{listing.description}</p>
                </div>
              )}
            </div>

            {/* MasterGraph */}
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

            {/* Haushaltsrechnung */}
            {calcResult && (
              <Haushaltsrechnung
                result={calcResult}
                variant="ledger"
                showMonthly={true}
              />
            )}

            {/* Detail Table */}
            {calcResult && (
              <DetailTable40Jahre
                projection={calcResult.projection}
                defaultOpen={false}
              />
            )}

            {/* Dokumente */}
            <ExposeDocuments propertyId={listing.property_id} viewerType="internal" />

            {/* Location Map */}
            <div className="mt-6">
              <ExposeLocationMap
                address={listing.address}
                city={listing.city}
                postalCode={listing.postal_code}
                showExactLocation={false}
              />
            </div>
          </div>

          {/* Right Column - Sticky Calculator */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-6">
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
        </div>
      </div>
    </div>
  );
}
