/**
 * KaufyExpose — Vollbild-Exposé für Zone 3 (KAUFY Marketplace)
 * 
 * REFAKTORISIERT: Nutzt jetzt gemeinsame Komponenten aus src/components/investment/
 * - MasterGraph
 * - Haushaltsrechnung  
 * - InvestmentSliderPanel
 * - DetailTable40Jahre
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MapPin, Maximize2, Calendar, Building2, 
  Share2, Loader2, MessageSquare
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
  DetailTable40Jahre 
} from '@/components/investment';

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
}

export default function KaufyExpose() {
  const { publicId } = useParams<{ publicId: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  // Interactive parameters state
  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: 250000,
    monthlyRent: 800,
  });

  // Fetch listing data
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
            annual_income
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
        units_count: 0,
      };
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

      const favorites = JSON.parse(localStorage.getItem('kaufy_favorites') || '[]');
      setIsFavorite(favorites.includes(publicId));
    }
  }, [listing, publicId]);

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
            {/* Image Placeholder */}
            <div className="aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <Building2 className="w-16 h-16 text-muted-foreground" />
            </div>

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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/50">
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
                  <p className="font-semibold">{listing.units_count || '–'} WE</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mieteinnahmen</p>
                  <p className="font-semibold">{formatCurrency(params.monthlyRent)}/Mo</p>
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

            {/* Haushaltsrechnung - Gemeinsame Komponente */}
            {calcResult && (
              <Haushaltsrechnung 
                result={calcResult} 
                variant="detailed"
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
