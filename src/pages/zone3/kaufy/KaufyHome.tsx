import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Users, Briefcase, Home } from 'lucide-react';
import HeroBackground from '@/assets/kaufy/Hero_Background.png';
import { InvestmentSearchCard } from '@/components/zone3/kaufy/InvestmentSearchCard';
import { KaufyPropertyCard } from '@/components/zone3/kaufy/KaufyPropertyCard';
import { PerspektivenAccordion } from '@/components/zone3/kaufy/PerspektivenAccordion';
import { ZahlenSektion } from '@/components/zone3/kaufy/ZahlenSektion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  const [searchParams, setSearchParams] = useState<{ zvE: number; equity: number } | null>(null);
  const [calculatedProperties, setCalculatedProperties] = useState<PropertyData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch real listings from v_public_listings (nur Kaufy-publizierte Objekte)
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['kaufy-home-listings'],
    queryFn: async () => {
      // Versuche zuerst v_public_listings View
      const { data: publicListings, error: viewError } = await supabase
        .from('v_public_listings')
        .select('*')
        .limit(8);

      if (!viewError && publicListings && publicListings.length > 0) {
        return publicListings.map((l: any) => ({
          public_id: l.public_id || l.id,
          title: l.title || `Objekt ${l.city || ''}`,
          asking_price: l.asking_price || 0,
          monthly_rent: l.monthly_rent || 0,
          property_type: l.property_type || 'multi_family',
          city: l.city || '',
          postal_code: l.postal_code || '',
          total_area_sqm: l.total_area_sqm || 0,
          year_built: l.year_built || 0,
          gross_yield: l.asking_price && l.monthly_rent 
            ? Math.round((l.monthly_rent * 12 / l.asking_price) * 1000) / 10 
            : 0,
        }));
      }

      // Fallback: Hole Listings mit aktiver Kaufy-Publikation
      const { data: kaufyPubs } = await supabase
        .from('listing_publications')
        .select('listing_id')
        .eq('channel', 'kaufy')
        .eq('status', 'active');

      if (!kaufyPubs || kaufyPubs.length === 0) {
        return [];
      }

      const listingIds = kaufyPubs.map(p => p.listing_id);

      const { data: listingsData } = await supabase
        .from('listings')
        .select(`
          id,
          public_id,
          title,
          asking_price,
          status,
          properties!inner (
            property_type,
            city,
            postal_code,
            total_area_sqm,
            year_built,
            annual_income
          )
        `)
        .in('id', listingIds)
        .in('status', ['active', 'reserved'])
        .limit(8);

      if (!listingsData) return [];

      return listingsData.map((l: any) => {
        const monthlyRent = l.properties?.annual_income ? l.properties.annual_income / 12 : 0;
        return {
          public_id: l.public_id || l.id,
          title: l.title || `Objekt ${l.properties?.city || ''}`,
          asking_price: l.asking_price || 0,
          monthly_rent: monthlyRent,
          property_type: l.properties?.property_type || 'multi_family',
          city: l.properties?.city || '',
          postal_code: l.properties?.postal_code || '',
          total_area_sqm: l.properties?.total_area_sqm || 0,
          year_built: l.properties?.year_built || 0,
          gross_yield: l.asking_price && monthlyRent 
            ? Math.round((monthlyRent * 12 / l.asking_price) * 1000) / 10 
            : 0,
        };
      });
    },
  });

  const displayProperties = calculatedProperties.length > 0 ? calculatedProperties : properties;

  const handleSearch = async (params: { zvE: number; equity: number }) => {
    if (properties.length === 0) return;
    
    setIsCalculating(true);
    setSearchParams(params);

    // Calculate investment metrics for each property
    const updatedProperties = await Promise.all(
      properties.map(async (prop) => {
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
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ color: 'white' }}
            >
              Finden Sie Ihre Rendite-Immobilie
            </h1>
            <p 
              className="text-xl md:text-2xl mb-8 max-w-2xl"
              style={{ color: 'hsl(var(--z3-background) / 0.9)' }}
            >
              Der Marktplatz für Kapitalanleger, Verkäufer und Vertriebspartner.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-12">
              <Link 
                to="/kaufy/immobilien" 
                className="zone3-btn-primary inline-flex items-center gap-2"
              >
                Immobilien entdecken
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/auth?mode=register&source=kaufy" 
                className="zone3-btn-secondary inline-flex items-center gap-2"
              >
                Kostenlos registrieren
              </Link>
            </div>

            {/* Search Card - nur zeigen wenn Objekte vorhanden */}
            {properties.length > 0 && (
              <InvestmentSearchCard onSearch={handleSearch} isLoading={isCalculating} />
            )}
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
              {searchParams && displayProperties.length > 0 && (
                <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {displayProperties.length} Objekte · berechnet für {searchParams.zvE.toLocaleString('de-DE')} € zvE · {searchParams.equity.toLocaleString('de-DE')} € EK
                </p>
              )}
            </div>
            {displayProperties.length > 0 && (
              <Link 
                to="/kaufy/immobilien" 
                className="zone3-btn-secondary text-sm"
              >
                Alle anzeigen →
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayProperties.length === 0 ? (
            /* Empty State - keine Mock-Daten! */
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-black/5 flex items-center justify-center">
                <Home className="w-12 h-12 text-black/30" />
              </div>
              <h3 className="zone3-heading-3 mb-3">Noch keine Objekte verfügbar</h3>
              <p className="zone3-text-small max-w-md mx-auto mb-8">
                Aktuell sind keine Immobilien zur Kapitalanlage veröffentlicht. 
                Registrieren Sie sich, um benachrichtigt zu werden, sobald neue Objekte verfügbar sind.
              </p>
              <Link to="/auth?source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
                Für Updates registrieren
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProperties.map((prop) => (
                <KaufyPropertyCard 
                  key={prop.public_id} 
                  property={prop}
                  showInvestmentMetrics={!!searchParams}
                />
              ))}
            </div>
          )}

          {searchParams && displayProperties.length > 0 && (
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
          <h2 className="zone3-heading-2 text-center mb-4">Für wen ist KAUFY?</h2>
          <p className="zone3-text-large text-center max-w-2xl mx-auto mb-12">
            Die Plattform für alle Beteiligten am Immobilienmarkt.
          </p>
          
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
              <h3 className="zone3-heading-3 mb-2">Für Vermieter</h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-primary))' }}>
                Ihr Bestandsobjekt. Unsere Expertise.
              </p>
              <p className="zone3-text-small">
                Portfolio-Überblick, Mieterservice und nahtloser Übergang zum Verkauf.
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
              <h3 className="zone3-heading-3 mb-2">Für Verkäufer</h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-primary))' }}>
                Projektplatzierung mit System
              </p>
              <p className="zone3-text-small">
                Erreichen Sie qualifizierte Käufer über unser Partnernetzwerk.
              </p>
            </Link>

            {/* Vertriebe */}
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
              <h3 className="zone3-heading-3 mb-2">Für Vertriebspartner</h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-primary))' }}>
                Ihr Partnernetzwerk für Rendite-Immobilien
              </p>
              <p className="zone3-text-small">
                Objektkatalog, Lead-Management und transparente Provisionen.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-8">Warum KAUFY?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="font-medium">Geprüfte Immobilien</p>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="font-medium">Transparente Prozesse</p>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="font-medium">Persönliche Beratung</p>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="font-medium">Digitale Abwicklung</p>
            </div>
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
            Bereit für Ihre erste Investition?
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
