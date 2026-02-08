/**
 * KaufyExpose — Vollbild-Exposé für Zone 3 (KAUFY Marketplace)
 * 
 * REFAKTORISIERT: Nutzt jetzt SSOT-Komponenten aus src/components/investment/
 * - MasterGraph (40-Jahres-Chart)
 * - Haushaltsrechnung (variant="ledger" für T-Konto)
 * - InvestmentSliderPanel
 * - DetailTable40Jahre
 * - ExposeImageGallery (statt eigene Galerie)
 * - ExposeDocuments
 * 
 * Plus: ExposeLocationMap für Google Maps
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MapPin, Maximize2, Calendar, Building2, 
  Share2, Loader2, MessageSquare, TrendingUp, Flame
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
  ExposeDocuments 
} from '@/components/investment';
import ExposeLocationMap from '@/components/verkauf/ExposeLocationMap';

interface ListingData {
  id: string;
  public_id: string;
  title: string;
  description: string;
  asking_price: number;
  property_type: string;
  address: string;
  city: string;
  postal_code: string;
  total_area_sqm: number;
  year_built: number;
  monthly_rent: number;
  units_count: number;
  property_id: string;
  heating_type: string | null;
}

export default function KaufyExpose() {
  const { publicId } = useParams<{ publicId: string }>();
  const [searchParams] = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  // Read URL params for consistent calculation from search
  const urlZve = searchParams.get('zve');
  const urlEk = searchParams.get('ek');

  // Interactive parameters state
  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: 250000,
    monthlyRent: 800,
  });

  // Fetch listing data with property_id and heating_type
  const { data: listing, isLoading } = useQuery({
    queryKey: ['public-listing', publicId],
    queryFn: async () => {
      if (!publicId) return null;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          public_id,
          title,
          description,
          asking_price,
          properties!inner (
            id,
            property_type,
            address,
            city,
            postal_code,
            total_area_sqm,
            year_built,
            annual_income,
            heating_type,
            unit_count
          )
        `)
        .eq('public_id', publicId)
        .single();

      if (error || !data) {
        console.error('Listing query error:', error);
        return null;
      }

      const props = data.properties as any;
      const annualIncome = props?.annual_income || 0;

      return {
        id: data.id,
        public_id: data.public_id,
        title: data.title || 'Immobilie',
        description: data.description || '',
        asking_price: data.asking_price || 0,
        property_type: props?.property_type || 'multi_family',
        address: props?.address || '',
        city: props?.city || '',
        postal_code: props?.postal_code || '',
        total_area_sqm: props?.total_area_sqm || 0,
        year_built: props?.year_built || 0,
        monthly_rent: Math.round(annualIncome / 12),
        units_count: props?.unit_count || 0,
        property_id: props?.id || '',
        heating_type: props?.heating_type || null,
      };
    },
    enabled: !!publicId,
  });

  useEffect(() => {
    if (listing) {
      setParams(prev => ({
        ...prev,
        purchasePrice: listing.asking_price || 250000,
        monthlyRent: listing.monthly_rent || Math.round((listing.asking_price || 250000) * 0.004),
        // Apply URL params if present (from search page)
        taxableIncome: urlZve ? Number(urlZve) : prev.taxableIncome,
        equity: urlEk ? Number(urlEk) : prev.equity,
      }));

      const favorites = JSON.parse(localStorage.getItem('kaufy_favorites') || '[]');
      setIsFavorite(favorites.includes(publicId));
    }
  }, [listing, publicId, urlZve, urlEk]);

  // Calculate when params change
  useEffect(() => {
    if (params.purchasePrice > 0) {
      calculate(params);
    }
  }, [params, calculate]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('kaufy_favorites') || '[]');
    const newFavorites = isFavorite 
      ? favorites.filter((id: string) => id !== publicId)
      : [...favorites, publicId];
    localStorage.setItem('kaufy_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="zone3-container py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="zone3-container py-8 text-center">
        <p>Objekt nicht gefunden</p>
        <Link to="/kaufy/immobilien" className="zone3-btn-primary mt-4 inline-block">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const propertyTypeLabel = {
    'multi_family': 'Mehrfamilienhaus',
    'single_family': 'Einfamilienhaus',
    'apartment': 'Eigentumswohnung',
    'commercial': 'Gewerbe',
  }[listing.property_type] || 'Immobilie';

  // Calculate gross yield
  const grossYield = listing.asking_price > 0 
    ? ((params.monthlyRent * 12) / listing.asking_price * 100).toFixed(1)
    : '0.0';

  // Heating type label
  const heatingTypeLabel = {
    'gas': 'Gas',
    'oil': 'Öl',
    'heat_pump': 'Wärmepumpe',
    'district': 'Fernwärme',
    'electric': 'Elektro',
    'pellet': 'Pellet',
    'other': 'Sonstige',
  }[listing.heating_type || ''] || listing.heating_type || '–';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--z3-background))' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'hsl(var(--z3-border))' }}>
        <div className="zone3-container py-4 flex items-center justify-between">
          <Link 
            to="/kaufy/immobilien" 
            className="flex items-center gap-2 text-sm hover:underline"
            style={{ color: 'hsl(var(--z3-muted-foreground))' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Suche
          </Link>
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
      <div className="zone3-container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Property Info & Calculations */}
          <div className="lg:col-span-2 space-y-8">
            {/* SSOT Image Gallery */}
            <ExposeImageGallery 
              propertyId={listing.property_id} 
              aspectRatio="video"
            />

            {/* Property Details */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2">{propertyTypeLabel}</Badge>
                  <h1 className="text-2xl font-bold">{listing.title}</h1>
                  <p className="flex items-center gap-1 mt-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {listing.postal_code} {listing.city}, {listing.address}
                  </p>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(listing.asking_price)}
                </p>
              </div>

              {/* Key Facts - 6 columns */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 rounded-xl bg-muted/50">
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
                  <p className="font-semibold flex items-center gap-1">
                    <Building2 className="w-4 h-4" /> {listing.units_count || '–'} WE
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mieteinnahmen</p>
                  <p className="font-semibold">{formatCurrency(params.monthlyRent)}/Mo</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rendite (brutto)</p>
                  <p className="font-semibold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> {grossYield}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Heizung</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Flame className="w-4 h-4" /> {heatingTypeLabel}
                  </p>
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

            {/* Haushaltsrechnung - T-Konto Layout (ledger) */}
            {calcResult && (
              <Haushaltsrechnung 
                result={calcResult} 
                variant="ledger"
                showMonthly={true}
              />
            )}

            {/* Detail Table - Gemeinsame Komponente */}
            {calcResult && (
              <DetailTable40Jahre 
                projection={calcResult.projection}
                defaultOpen={false}
              />
            )}

            {/* SSOT Dokumente */}
            {listing.property_id && (
              <ExposeDocuments 
                propertyId={listing.property_id} 
                viewerType="public"
              />
            )}

            {/* Google Maps am Ende */}
            <ExposeLocationMap
              address={listing.address}
              city={listing.city}
              postalCode={listing.postal_code}
              showExactLocation={false}
            />
          </div>

          {/* Right Column - Interactive Calculator */}
          <div className="space-y-6">
            <div className="sticky top-24">
              {/* InvestmentSliderPanel - Gemeinsame Komponente */}
              <InvestmentSliderPanel
                value={params}
                onChange={setParams}
                layout="vertical"
                showAdvanced={true}
                purchasePrice={listing.asking_price}
              />

              {/* Armstrong CTA */}
              <div className="mt-6 p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span className="font-medium">Fragen zum Objekt?</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Armstrong beantwortet Ihre Fragen zur Finanzierung und Rendite.
                </p>
                <Button className="w-full" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Mit Armstrong sprechen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
