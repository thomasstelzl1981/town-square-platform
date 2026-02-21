/**
 * InvestmentResultTile — Suchergebnis-Kachel mit T-Konto Layout
 * 
 * NEW: isTopRecommendation prop for golden border + badge
 */
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Building2, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface InvestmentResultTileProps {
  listing: PublicListing;
  metrics?: InvestmentMetrics | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  showProvision?: boolean;
  linkPrefix?: string;
  isTopRecommendation?: boolean;
}

export function InvestmentResultTile({
  listing,
  metrics,
  isFavorite = false,
  onToggleFavorite,
  showProvision = false,
  linkPrefix = '/portal/investments/objekt',
  isTopRecommendation = false,
}: InvestmentResultTileProps) {
  const isMobile = useIsMobile();
  const [urlParams] = useSearchParams();
  const linkUrl = `${linkPrefix}/${listing.public_id || listing.listing_id}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const formatCurrencyShort = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.abs(value));

  const grossYield = listing.asking_price > 0 
    ? ((listing.monthly_rent_total * 12) / listing.asking_price * 100).toFixed(1)
    : '0.0';

  const isPositiveCashflow = metrics && metrics.monthlyBurden <= 0;
  
  const monthlyRent = listing.monthly_rent_total || 0;
  const monthlyInterest = metrics?.yearlyInterest ? metrics.yearlyInterest / 12 : (metrics?.loanAmount ? (metrics.loanAmount * 0.035) / 12 : 0);
  const monthlyRepayment = metrics?.yearlyRepayment ? metrics.yearlyRepayment / 12 : (metrics?.loanAmount ? (metrics.loanAmount * 0.02) / 12 : 0);
  const monthlyTaxSavings = metrics?.yearlyTaxSavings ? metrics.yearlyTaxSavings / 12 : 0;

  const totalRevenue = monthlyRent + monthlyTaxSavings;
  const totalExpenses = monthlyInterest + monthlyRepayment;

  const propertyTypeLabel = {
    'multi_family': 'MFH',
    'single_family': 'EFH',
    'apartment': 'ETW',
    'commercial': 'Gewerbe',
  }[listing.property_type] || listing.property_type;

  return (
    <Link to={linkUrl}>
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-all group cursor-pointer",
        isTopRecommendation && "ring-2 ring-amber-400/60 shadow-amber-100 dark:shadow-amber-900/20 shadow-lg"
      )}>
        {/* Image */}
        <div className={cn("bg-muted flex items-center justify-center relative overflow-hidden", isMobile ? "aspect-[4/3]" : "aspect-[16/9]")}>
          {listing.hero_image_path ? (
            <img 
              src={listing.hero_image_path} 
              alt={listing.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <Building2 className="w-12 h-12 text-muted-foreground" />
          )}
          
          {/* Top Recommendation Badge */}
          {isTopRecommendation && (
            <Badge className="absolute top-2 left-2 bg-amber-500 text-white shadow-lg gap-1 text-xs">
              <Award className="w-3 h-3" />
              Top-Empfehlung
            </Badge>
          )}

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
            </button>
          )}

          {/* Provision Badge */}
          {showProvision && listing.partner_commission_rate && !isTopRecommendation && (
            <Badge className="absolute top-2 left-2 text-xs bg-primary">
              {listing.partner_commission_rate}%
            </Badge>
          )}

          {/* Rendite Badge */}
          <Badge className="absolute bottom-2 right-2 bg-green-600 text-white">
            <TrendingUp className="w-3 h-3 mr-1" />
            {grossYield}%
          </Badge>
        </div>

        {/* Data Bar */}
        <div className="px-4 py-3 border-b bg-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-primary truncate">
                {formatCurrency(listing.asking_price)}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {listing.city}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-medium">{listing.total_area_sqm} m²</p>
              <p className="text-sm text-muted-foreground">{propertyTypeLabel}</p>
            </div>
          </div>
        </div>

        {/* T-Konto */}
        <div className="grid grid-cols-2 divide-x">
          <div className="p-3 bg-green-50/50 dark:bg-green-950/20">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">
              Einnahmen
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Miete</span>
                <span className="font-medium text-green-600">{formatCurrencyShort(monthlyRent)}</span>
              </div>
              {monthlyTaxSavings > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">+ Steuer</span>
                  <span className="font-medium text-green-600">{formatCurrencyShort(monthlyTaxSavings)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-green-200 dark:border-green-800">
                <span className="font-medium text-green-700 dark:text-green-400">Σ</span>
                <span className="font-bold text-green-700 dark:text-green-400">{formatCurrencyShort(totalRevenue)}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-red-50/50 dark:bg-red-950/20">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-2">
              Ausgaben
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">− Zinsen</span>
                <span className="font-medium text-red-600">{formatCurrencyShort(monthlyInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">− Tilgung</span>
                <span className="font-medium text-red-600">{formatCurrencyShort(monthlyRepayment)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-red-200 dark:border-red-800">
                <span className="font-medium text-red-700 dark:text-red-400">Σ</span>
                <span className="font-bold text-red-700 dark:text-red-400">{formatCurrencyShort(totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Monatsbelastung */}
        <div className={cn(
          "px-4 py-3 border-t flex items-center justify-between",
          isPositiveCashflow 
            ? "bg-green-100 dark:bg-green-900/30" 
            : "bg-muted/50"
        )}>
          <span className={cn("text-sm font-semibold", isMobile && "text-base")}>Monatsbelastung</span>
          <span className={cn(
            "font-bold",
            isMobile ? "text-lg" : "text-base",
            isPositiveCashflow ? "text-green-600" : "text-foreground"
          )}>
            {metrics ? (
              <>
                {isPositiveCashflow ? '+' : '-'}{formatCurrencyShort(Math.abs(metrics.monthlyBurden))}/Mo
                {isPositiveCashflow && <span className="ml-1">✓</span>}
              </>
            ) : (
              '—'
            )}
          </span>
        </div>
      </Card>
    </Link>
  );
}
