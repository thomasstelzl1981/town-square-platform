/**
 * KaufyHome — Phase 3 Update
 * Hero-Texte optimiert: "Finden Sie Ihre Rendite-Immobilie" + "Steueroptimiert kaufen. Digital verwalten."
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, Users, Briefcase } from 'lucide-react';
import HeroBackground from '@/assets/kaufy/Hero_Background.png';
import { InvestmentSearchCard } from '@/components/zone3/kaufy/InvestmentSearchCard';
import { KaufyPropertyCard } from '@/components/zone3/kaufy/KaufyPropertyCard';
import { PerspektivenAccordion } from '@/components/zone3/kaufy/PerspektivenAccordion';
import { ZahlenSektion } from '@/components/zone3/kaufy/ZahlenSektion';
import { supabase } from '@/integrations/supabase/client';

interface PropertyData {
  public_id: string;
  title: string;
  asking_price: number;
  monthly_rent: number;
  property_type: string;
  city: string;
  postal_code: string;
  total_area_sqm: number;
  year_built: number;
  gross_yield: number;
  cashFlowBeforeTax?: number;
  taxSavings?: number;
  netBurden?: number;
}

export default function KaufyHome() {
  const [calculatedProperties, setCalculatedProperties] = useState<PropertyData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchParams, setSearchParams] = useState<{ zvE: number; equity: number } | null>(null);

  // Fetch real listings from database
  const { data: dbListings = [], isLoading: isLoadingListings } = useQuery({
    queryKey: ['kaufy-public-listings'],
    queryFn: async () => {
      // 1. Get Kaufy-published listings
      const { data: publications, error: pubError } = await supabase
        .from('listing_publications')
        .select('listing_id')
        .eq('channel', 'kaufy')
        .eq('status', 'active');

      if (pubError) {
        console.error('Publications query error:', pubError);
        return [];
      }

      if (!publications?.length) {
        console.log('No Kaufy publications found');
        return [];
      }

      // 2. Fetch listing details with property data
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id, public_id, title, asking_price,
          properties!inner (
            property_type, address, city, postal_code, 
            total_area_sqm, construction_year, annual_income
          )
        `)
        .in('id', publications.map(p => p.listing_id))
        .eq('status', 'active');

      if (listingsError) {
        console.error('Listings query error:', listingsError);
        return [];
      }

      // 3. Transform to PropertyData format
      return (listingsData || []).map((l: any) => ({
        public_id: l.public_id,
        title: l.title || `${l.properties.property_type} ${l.properties.city}`,
        asking_price: l.asking_price || 0,
        monthly_rent: l.properties.annual_income ? l.properties.annual_income / 12 : 0,
        property_type: l.properties.property_type,
        city: l.properties.city || '',
        postal_code: l.properties.postal_code || '',
        total_area_sqm: l.properties.total_area_sqm || 0,
        year_built: l.properties.construction_year || 0,
        gross_yield: l.asking_price > 0 
          ? ((l.properties.annual_income || 0) / l.asking_price) * 100 
          : 0,
      })) as PropertyData[];
    },
  });

  // Properties to display: calculated results if search was done, otherwise raw DB listings
  const properties = useMemo(() => {
    if (searchParams && calculatedProperties.length > 0) {
      return calculatedProperties;
    }
    return dbListings;
  }, [searchParams, calculatedProperties, dbListings]);

  const isLoading = isLoadingListings || isCalculating;

  const handleSearch = async (params: { zvE: number; equity: number }) => {
    setIsCalculating(true);
    setSearchParams(params);

    // Calculate investment metrics for each property from DB
    const updatedProperties = await Promise.all(
      dbListings.map(async (prop) => {
        try {
          const { data } = await supabase.functions.invoke('sot-investment-engine', {
            body: {
              purchasePrice: prop.asking_price,
              monthlyRent: prop.monthly_rent,
              equity: params.equity,
              termYears: 15,
              repaymentRate: 2,
              taxableIncome: params.zvE,
              maritalStatus: 'single',
              hasChurchTax: false,
              afaModel: 'linear',
              buildingShare: 0.8,
              managementCostMonthly: 25,
              valueGrowthRate: 2,
              rentGrowthRate: 1.5,
            },
          });

          if (data?.summary) {
            return {
              ...prop,
              cashFlowBeforeTax: Math.round((data.projection[0]?.cashFlowBeforeTax || 0) / 12),
              taxSavings: Math.round((data.summary.yearlyTaxSavings || 0) / 12),
              netBurden: data.summary.monthlyBurden,
            };
          }
        } catch (err) {
          console.error('Calculation error for', prop.public_id, err);
        }
        return prop;
      })
    );

    setCalculatedProperties(updatedProperties);
    setIsCalculating(false);
  };

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${HeroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark Overlay */}
        <div 
          className="absolute inset-0"
          style={{ backgroundColor: 'hsl(var(--z3-foreground) / 0.6)' }}
        />

        {/* Content */}
        <div className="relative z-10 zone3-container w-full py-16">
          <div className="max-w-3xl">
            <Link 
              to="/auth?mode=register&source=kaufy" 
              className="zone3-btn-primary inline-flex items-center gap-2 mb-8"
            >
              Kostenlos registrieren
            </Link>
            
            {/* Phase 3: Optimierte Hero-Texte */}
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ color: 'white' }}
            >
              Finden Sie Ihre Rendite-Immobilie.
            </h1>
            <p 
              className="text-xl md:text-2xl mb-12 max-w-2xl"
              style={{ color: 'hsl(var(--z3-background) / 0.9)' }}
            >
              Steueroptimiert kaufen. Digital verwalten.
            </p>

            {/* Search Card */}
            <InvestmentSearchCard onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="zone3-heading-2 mb-2">
                {searchParams ? 'Passende Kapitalanlage-Objekte' : 'Aktuelle Angebote'}
              </h2>
              {searchParams && (
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {properties.length} Objekte · berechnet für {searchParams.zvE.toLocaleString('de-DE')} € zvE · {searchParams.equity.toLocaleString('de-DE')} € EK
                </p>
              )}
            </div>
            <Link 
              to="/kaufy/immobilien" 
              className="zone3-btn-secondary text-sm"
            >
              Alle anzeigen →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.map((prop) => (
              <KaufyPropertyCard 
                key={prop.public_id} 
                property={prop}
                showInvestmentMetrics={!!searchParams}
              />
            ))}
          </div>

          {searchParams && (
            <div 
              className="mt-6 p-4 rounded-lg text-sm"
              style={{ 
                backgroundColor: 'hsl(var(--z3-secondary))',
                color: 'hsl(var(--z3-muted-foreground))',
              }}
            >
              <strong>Hinweis:</strong> Die Netto-Belastung wird individuell basierend auf Ihren Angaben berechnet. 
              Klicken Sie auf ein Objekt für die detaillierte Analyse.
            </div>
          )}
        </div>
      </section>

      {/* Role Cards */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vermieter */}
            <Link 
              to="/kaufy/vermieter"
              className="zone3-card p-8 group hover:shadow-xl transition-all"
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors group-hover:scale-110"
                style={{ backgroundColor: 'hsl(var(--z3-primary) / 0.1)' }}
              >
                <Building2 className="w-7 h-7" style={{ color: 'hsl(var(--z3-primary))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-2">Vermieter</h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-accent))' }}>
                Digitale Mietsonderverwaltung
              </p>
              <p className="zone3-text-small">
                Mieteingang, Dokumente, Korrespondenz – alles in einer Plattform. Mit KI-Unterstützung.
              </p>
            </Link>

            {/* Verkäufer */}
            <Link 
              to="/kaufy/verkaeufer"
              className="zone3-card p-8 group hover:shadow-xl transition-all"
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors group-hover:scale-110"
                style={{ backgroundColor: 'hsl(var(--z3-primary) / 0.1)' }}
              >
                <Users className="w-7 h-7" style={{ color: 'hsl(var(--z3-primary))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-2">Verkäufer</h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-accent))' }}>
                Reichweite & Qualität
              </p>
              <p className="zone3-text-small">
                Erreichen Sie qualifizierte Käufer über unseren Marktplatz und unser Partner-Netzwerk.
              </p>
            </Link>

            {/* Partner */}
            <Link 
              to="/kaufy/vertrieb"
              className="zone3-card p-8 group hover:shadow-xl transition-all"
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors group-hover:scale-110"
                style={{ backgroundColor: 'hsl(var(--z3-primary) / 0.1)' }}
              >
                <Briefcase className="w-7 h-7" style={{ color: 'hsl(var(--z3-primary))' }} />
              </div>
              <h3 className="zone3-heading-3 mb-2">Partner</h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-accent))' }}>
                Exklusive Partner-Suite
              </p>
              <p className="zone3-text-small">
                Objektkatalog, Beratungstools und transparente Provisionsmodelle für Profis.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Perspektiven Accordion */}
      <PerspektivenAccordion />

      {/* Zahlen Sektion */}
      <ZahlenSektion />

      {/* CTA Section */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))' }}>
        <div className="zone3-container text-center">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            style={{ color: 'hsl(var(--z3-background))' }}
          >
            Bereit für Ihre erste Kapitalanlage?
          </h2>
          <p 
            className="text-lg mb-8 max-w-xl mx-auto"
            style={{ color: 'hsl(var(--z3-background) / 0.8)' }}
          >
            Registrieren Sie sich kostenlos und entdecken Sie Objekte mit transparenter Renditeberechnung.
          </p>
          <Link 
            to="/auth?mode=register&source=kaufy" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold transition-transform hover:scale-105"
            style={{ 
              backgroundColor: 'hsl(var(--z3-primary))',
              color: 'hsl(var(--z3-primary-foreground))',
            }}
          >
            Jetzt starten
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
