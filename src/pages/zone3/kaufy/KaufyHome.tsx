import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

// Mock data for demo (würde von v_public_listings kommen)
const MOCK_PROPERTIES: PropertyData[] = [
  {
    public_id: 'LST-001',
    title: 'Gepflegtes MFH in Toplage',
    asking_price: 890000,
    monthly_rent: 4200,
    property_type: 'multi_family',
    city: 'München',
    postal_code: '80331',
    total_area_sqm: 620,
    year_built: 1925,
    gross_yield: 5.7,
  },
  {
    public_id: 'LST-002',
    title: 'Sanierte Altbauwohnung',
    asking_price: 385000,
    monthly_rent: 1450,
    property_type: 'apartment',
    city: 'Berlin',
    postal_code: '10115',
    total_area_sqm: 95,
    year_built: 1910,
    gross_yield: 4.5,
  },
  {
    public_id: 'LST-003',
    title: 'Neubau-ETW mit Balkon',
    asking_price: 295000,
    monthly_rent: 980,
    property_type: 'apartment',
    city: 'Leipzig',
    postal_code: '04109',
    total_area_sqm: 68,
    year_built: 2022,
    gross_yield: 4.0,
  },
  {
    public_id: 'LST-004',
    title: 'Doppelhaushälfte vermietet',
    asking_price: 520000,
    monthly_rent: 2100,
    property_type: 'house',
    city: 'Hamburg',
    postal_code: '22087',
    total_area_sqm: 145,
    year_built: 1985,
    gross_yield: 4.8,
  },
];

export default function KaufyHome() {
  const [properties, setProperties] = useState<PropertyData[]>(MOCK_PROPERTIES);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<{ zvE: number; equity: number } | null>(null);

  const handleSearch = async (params: { zvE: number; equity: number }) => {
    setIsLoading(true);
    setSearchParams(params);

    // Calculate investment metrics for each property
    const updatedProperties = await Promise.all(
      MOCK_PROPERTIES.map(async (prop) => {
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

    setProperties(updatedProperties);
    setIsLoading(false);
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
            
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ color: 'white' }}
            >
              Die KI-Plattform für Kapitalanlage-Immobilien.
            </h1>
            <p 
              className="text-xl md:text-2xl mb-12 max-w-2xl"
              style={{ color: 'hsl(var(--z3-background) / 0.9)' }}
            >
              Marktplatz & digitale Mietsonderverwaltung
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
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-primary))' }}>
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
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-primary))' }}>
                Reichweite & Qualität
              </p>
              <p className="zone3-text-small">
                Erreichen Sie qualifizierte Käufer über unseren Marktplatz und unser Partner-Netzwerk.
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
              <h3 className="zone3-heading-3 mb-2">Vertriebe</h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-primary))' }}>
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
            Bereit für deine erste Kapitalanlage?
          </h2>
          <p 
            className="text-lg mb-8 max-w-xl mx-auto"
            style={{ color: 'hsl(var(--z3-background) / 0.8)' }}
          >
            Registriere dich kostenlos und entdecke Objekte mit transparenter Renditeberechnung.
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
