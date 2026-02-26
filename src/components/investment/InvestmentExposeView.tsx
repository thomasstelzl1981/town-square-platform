/**
 * InvestmentExposeView — SSOT Exposé-Komponente für alle Investment-Ansichten
 * 
 * Single Source of Truth für:
 * - MOD-08 (Investment-Suche)
 * - MOD-09 (Partner-Beratung)
 * - Zone 3 (KAUFY)
 * 
 * Alle drei Exposé-Seiten nutzen diese Komponente als Wrapper.
 * Unterschiede werden über Props gesteuert (backLink, stickyTop, extras).
 */
import { ReactNode } from 'react';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Maximize2,
  Calendar,
  Share2,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

import { ExposeImageGallery } from './ExposeImageGallery';
import { MasterGraph } from './MasterGraph';
import { Haushaltsrechnung } from './Haushaltsrechnung';
import { InvestmentSliderPanel } from './InvestmentSliderPanel';
import { DetailTable40Jahre } from './DetailTable40Jahre';
import { FinanzierungSummary } from './FinanzierungSummary';
import { ExposeDocuments } from './ExposeDocuments';
import { ExposeLocationMap } from '@/components/verkauf';
import type { CalculationResult, CalculationInput } from '@/hooks/useInvestmentEngine';

export interface ExposeListingData {
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

interface InvestmentExposeViewProps {
  /** The listing data to display */
  listing: ExposeListingData | null;
  /** Whether listing data is loading */
  isLoading: boolean;
  /** Calculation result from the investment engine */
  calcResult: CalculationResult | null;
  /** Whether calculation is in progress */
  isCalculating?: boolean;
  /** Current calculator params */
  params: CalculationInput;
  /** Callback when calculator params change */
  onParamsChange: (params: CalculationInput) => void;
  /** Gross yield percentage */
  grossYield: number;
  /** Back link configuration */
  backLink: {
    to: string;
    label: string;
    /** Use navigate(-1) instead of Link (for Zone 3) */
    useNavigateBack?: boolean;
    onNavigateBack?: () => void;
  };
  /** Sticky top offset for calculator panel ('top-20' for portal, 'top-24' for Kaufy) */
  stickyTopClass?: string;
  /** Whether to show documents section */
  showDocuments?: boolean;
  /** Whether to show the favorite button */
  showFavorite?: boolean;
  /** Favorite state */
  isFavorite?: boolean;
  /** Toggle favorite callback */
  onToggleFavorite?: () => void;
  /** Extra content below calculator (e.g., Kaufy "Finanzierung beantragen" button) */
  calculatorExtras?: ReactNode;
  /** Mobile bottom bar content (e.g., Kaufy CTA) */
  mobileBottomBar?: ReactNode;
  /** Extra content after main layout (e.g., Kaufy FinanceRequestSheet) */
  afterContent?: ReactNode;
  /** Not found fallback content */
  notFoundContent?: ReactNode;
  /** Custom header style class for Zone 3 (white bg, different text colors) */
  headerClassName?: string;
  /** Custom text colors for Zone 3 */
  textColors?: {
    title?: string;
    subtitle?: string;
    price?: string;
    factsBg?: string;
    factsLabel?: string;
  };
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  multi_family: 'Mehrfamilienhaus',
  single_family: 'Einfamilienhaus',
  apartment: 'Eigentumswohnung',
  commercial: 'Gewerbe',
  ETW: 'Eigentumswohnung',
  MFH: 'Mehrfamilienhaus',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

export function InvestmentExposeView({
  listing,
  isLoading,
  calcResult,
  isCalculating = false,
  params,
  onParamsChange,
  grossYield,
  backLink,
  stickyTopClass = 'top-20',
  showDocuments = true,
  showFavorite = true,
  isFavorite = false,
  onToggleFavorite,
  calculatorExtras,
  mobileBottomBar,
  afterContent,
  notFoundContent,
  headerClassName,
  textColors,
}: InvestmentExposeViewProps) {
  const isMobile = useIsMobile();

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // --- Not found state ---
  if (!listing) {
    if (notFoundContent) return <>{notFoundContent}</>;
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Objekt nicht gefunden</p>
        <Link to={backLink.to}>
          <Button className="mt-4">Zurück</Button>
        </Link>
      </div>
    );
  }

  const propertyTypeLabel = PROPERTY_TYPE_LABELS[listing.property_type] || 'Immobilie';
  const addressLine = `${listing.postal_code} ${listing.city}, ${listing.address}${listing.address_house_no ? ` ${listing.address_house_no}` : ''}`;

  const titleColor = textColors?.title || '';
  const subtitleColor = textColors?.subtitle || 'text-muted-foreground';
  const priceColor = textColors?.price || 'text-primary';
  const factsBg = textColors?.factsBg || 'bg-muted/50';
  const factsLabel = textColors?.factsLabel || 'text-muted-foreground';

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className={cn("border-b sticky top-0 z-10", headerClassName || "bg-card")}>
        <div className={cn("flex items-center justify-between", isMobile ? "px-3 py-3" : "px-6 py-4")}>
          {backLink.useNavigateBack ? (
            <button
              onClick={backLink.onNavigateBack}
              className={cn("flex items-center gap-2 text-sm transition-colors", subtitleColor, "hover:text-foreground")}
            >
              <ArrowLeft className="w-4 h-4" />
              {isMobile ? 'Zurück' : backLink.label}
            </button>
          ) : (
            <Link
              to={backLink.to}
              className={cn("flex items-center gap-2 text-sm transition-colors", subtitleColor, "hover:text-foreground")}
            >
              <ArrowLeft className="w-4 h-4" />
              {isMobile ? 'Zurück' : backLink.label}
            </Link>
          )}
          <div className="flex items-center gap-2">
            {showFavorite && (
              <Button variant="outline" size="sm" onClick={onToggleFavorite}>
                <Heart className={`w-4 h-4 ${isMobile ? '' : 'mr-2'} ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {!isMobile && (isFavorite ? 'Gespeichert' : 'Merken')}
              </Button>
            )}
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
                  <h1 className={cn("font-bold", isMobile ? "text-xl" : "text-2xl", titleColor)}>
                    {listing.title}
                  </h1>
                  <p className={cn("flex items-center gap-1 mt-2", subtitleColor)}>
                    <MapPin className="w-4 h-4" />
                    {addressLine}
                  </p>
                </div>
                <p className={cn("font-bold", isMobile ? "text-2xl" : "text-3xl", priceColor)}>
                  {formatCurrency(listing.asking_price)}
                </p>
              </div>

              {/* Key Facts — 6-col grid */}
              <div className={cn("gap-4 p-4 rounded-xl grid", factsBg, isMobile ? "grid-cols-3" : "grid-cols-2 md:grid-cols-6")}>
                <div>
                  <p className={cn("text-sm", factsLabel)}>Wohnfläche</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Maximize2 className="w-4 h-4" /> {listing.total_area_sqm} m²
                  </p>
                </div>
                <div>
                  <p className={cn("text-sm", factsLabel)}>Baujahr</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {listing.year_built || '–'}
                  </p>
                </div>
                <div>
                  <p className={cn("text-sm", factsLabel)}>Einheiten</p>
                  <p className="font-semibold">{listing.units_count} WE</p>
                </div>
                <div>
                  <p className={cn("text-sm", factsLabel)}>Miete (kalt)</p>
                  <p className="font-semibold">{formatCurrency(params.monthlyRent)}/Mo</p>
                </div>
                <div>
                  <p className={cn("text-sm", factsLabel)}>Rendite (brutto)</p>
                  <p className="font-semibold">{grossYield > 0 ? `${grossYield.toFixed(1)}%` : '–'}</p>
                </div>
                <div>
                  <p className={cn("text-sm", factsLabel)}>Heizung</p>
                  <p className="font-semibold">{listing.heating_type || '–'}</p>
                </div>
              </div>

              {listing.description && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Beschreibung</h3>
                  <p className={subtitleColor}>{listing.description}</p>
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

            {/* FinanzierungSummary */}
            {calcResult && (
              <FinanzierungSummary
                purchasePrice={listing.asking_price}
                equity={params.equity}
                result={calcResult}
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
            {showDocuments && (
              <ExposeDocuments propertyId={listing.property_id} viewerType="internal" />
            )}

            {/* Standortkarte */}
            <div className="mt-6">
              <ExposeLocationMap
                address={listing.address}
                city={listing.city}
                postalCode={listing.postal_code}
                showExactLocation={false}
              />
            </div>
          </div>

          {/* Right Column - Interactive Calculator */}
          {isMobile ? (
            <div className="space-y-6">
              <InvestmentSliderPanel
                value={params}
                onChange={onParamsChange}
                layout="vertical"
                showAdvanced={false}
                purchasePrice={listing.asking_price}
              />
              {calculatorExtras}
            </div>
          ) : (
            <div className="hidden lg:block lg:col-span-1">
              <div className={cn("sticky space-y-6", stickyTopClass)}>
                <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 space-y-4">
                  <InvestmentSliderPanel
                    value={params}
                    onChange={onParamsChange}
                    layout="vertical"
                    showAdvanced={true}
                    purchasePrice={listing.asking_price}
                  />
                  {calculatorExtras}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom bar (e.g. Kaufy CTA) */}
      {mobileBottomBar}

      {/* After content (e.g. Kaufy FinanceRequestSheet) */}
      {afterContent}
    </div>
  );
}
