/**
 * InvestmentExposeView — Gemeinsame Exposé-Komponente für alle Investment-Ansichten
 * 
 * Single Source of Truth für:
 * - Zone 3 (KAUFY)
 * - MOD-08 (Investment-Suche)
 * - MOD-09 (Partner-Beratung)
 * 
 * Layout:
 * ┌────────────────────────────────────────┬──────────────────┐
 * │  [Bildergalerie mit Prev/Next/Dots]    │                  │
 * ├────────────────────────────────────────┤  INVESTMENT      │
 * │  Titel · Adresse · Badges              │  SLIDER          │
 * ├────────────────────────────────────────┤  PANEL           │
 * │  Key Facts (Preis, Fläche, Rendite)    │  (sticky)        │
 * ├────────────────────────────────────────┤                  │
 * │  MasterGraph (40-Jahres-Projektion)    │                  │
 * ├────────────────────────────────────────┤                  │
 * │  Haushaltsrechnung (T-Konto)           │                  │
 * ├────────────────────────────────────────┤                  │
 * │  DetailTable40Jahre (Collapsible)      │                  │
 * ├────────────────────────────────────────┴──────────────────┤
 * │  Google Maps (ganz unten, volle Breite)                   │
 * └───────────────────────────────────────────────────────────┘
 */
import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Maximize2, Calendar, Building2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ExposeImageGallery } from './ExposeImageGallery';
import { MasterGraph } from './MasterGraph';
import { Haushaltsrechnung } from './Haushaltsrechnung';
import { InvestmentSliderPanel } from './InvestmentSliderPanel';
import { DetailTable40Jahre } from './DetailTable40Jahre';
import { ExposeLocationMap } from '@/components/verkauf';
import type { CalculationResult, CalculationInput } from '@/hooks/useInvestmentEngine';

interface ListingData {
  id: string;
  public_id?: string;
  title: string;
  description?: string;
  asking_price: number;
  property_type: string;
  address: string;
  city: string;
  postal_code: string;
  total_area_sqm: number;
  year_built?: number;
  monthly_rent: number;
  units_count?: number;
  property_id?: string;
}

interface InvestmentExposeViewProps {
  listing: ListingData;
  propertyId: string;
  calcResult: CalculationResult | null;
  isCalculating?: boolean;
  params: CalculationInput;
  onParamsChange: (params: CalculationInput) => void;
  showMap?: boolean;
  showArmstrong?: boolean;
  variant?: 'page' | 'modal';
  headerActions?: ReactNode;
  className?: string;
}

export function InvestmentExposeView({
  listing,
  propertyId,
  calcResult,
  isCalculating = false,
  params,
  onParamsChange,
  showMap = true,
  showArmstrong = true,
  variant = 'page',
  headerActions,
  className
}: InvestmentExposeViewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const propertyTypeLabel = {
    'multi_family': 'Mehrfamilienhaus',
    'single_family': 'Einfamilienhaus',
    'apartment': 'Eigentumswohnung',
    'commercial': 'Gewerbe',
  }[listing.property_type] || 'Immobilie';

  const isModal = variant === 'modal';

  return (
    <div className={cn("grid lg:grid-cols-3 gap-8", className)}>
      {/* Left Column - Property Info & Calculations (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Image Gallery */}
        <ExposeImageGallery 
          propertyId={propertyId} 
          aspectRatio="video"
        />

        {/* Property Details Header */}
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
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(listing.asking_price)}
              </p>
              {headerActions}
            </div>
          </div>

          {/* Key Facts Bar */}
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

          {/* Description */}
          {listing.description && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Beschreibung</h3>
              <p className="text-muted-foreground whitespace-pre-line">{listing.description}</p>
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

        {/* Haushaltsrechnung - T-Konto-Stil */}
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

        {/* Google Maps - GANZ UNTEN */}
        {showMap && (
          <ExposeLocationMap
            address={listing.address}
            city={listing.city}
            postalCode={listing.postal_code}
            showExactLocation={false}
          />
        )}
      </div>

      {/* Right Column - Interactive Calculator (1/3) */}
      <div className="space-y-6">
        <div className={isModal ? '' : 'sticky top-24'}>
          {/* Investment Slider Panel */}
          <InvestmentSliderPanel
            value={params}
            onChange={onParamsChange}
            layout="vertical"
            showAdvanced={true}
            purchasePrice={listing.asking_price}
          />

          {/* Armstrong CTA */}
          {showArmstrong && (
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
          )}
        </div>
      </div>
    </div>
  );
}
