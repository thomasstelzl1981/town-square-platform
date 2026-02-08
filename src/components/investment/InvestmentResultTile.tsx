/**
 * InvestmentResultTile — Quadratische Suchergebnis-Kachel im 4-Quadranten-Layout
 * 
 * Layout:
 * ┌─────────────────┬─────────────────┐
 * │                 │ € 320.000       │
 * │    [BILD]       │ 87 m² · Hamburg │
 * │   Titelbild     │ MFH · 4,2%      │
 * │                 │                 │
 * ├─────────────────┼─────────────────┤
 * │   EINNAHMEN     │   AUSGABEN      │
 * │ + Miete €1.100  │ − Zins    €450  │
 * │                 │ − Tilgung €300  │
 * ├─────────────────┴─────────────────┤
 * │  MONATSBELASTUNG: +€350/Mo  ✓     │
 * └───────────────────────────────────┘
 */
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Building2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function InvestmentResultTile({
  listing,
  metrics,
  isFavorite = false,
  onToggleFavorite,
  showProvision = false,
  linkPrefix = '/portal/investments/objekt'
}: InvestmentResultTileProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const formatCurrencyShort = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.abs(value));

  const grossYield = listing.asking_price > 0 
    ? ((listing.monthly_rent_total * 12) / listing.asking_price * 100).toFixed(1)
    : '0.0';

  const isPositiveCashflow = metrics && metrics.monthlyBurden <= 0;
  
  // Calculate monthly values from metrics
  const monthlyRent = listing.monthly_rent_total || 0;
  const monthlyInterest = metrics?.yearlyInterest ? metrics.yearlyInterest / 12 : (metrics?.loanAmount ? (metrics.loanAmount * 0.035) / 12 : 0);
  const monthlyRepayment = metrics?.yearlyRepayment ? metrics.yearlyRepayment / 12 : (metrics?.loanAmount ? (metrics.loanAmount * 0.02) / 12 : 0);
  const monthlyTaxSavings = metrics?.yearlyTaxSavings ? metrics.yearlyTaxSavings / 12 : 0;

  const propertyTypeLabel = {
    'multi_family': 'MFH',
    'single_family': 'EFH',
    'apartment': 'ETW',
    'commercial': 'Gewerbe',
  }[listing.property_type] || listing.property_type;

  return (
    <Link to={`${linkPrefix}/${listing.public_id || listing.listing_id}`}>
      <Card className="aspect-square overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
        {/* 4-Quadrant Grid: 2 rows (equal), 2 columns (equal) + footer */}
        <div className="h-full flex flex-col">
          {/* Top Row: Image + Property Data */}
          <div className="flex-1 grid grid-cols-2 min-h-0">
            {/* Quadrant 1: Image */}
            <div className="bg-muted flex items-center justify-center relative overflow-hidden">
              {listing.hero_image_path ? (
                <img 
                  src={listing.hero_image_path} 
                  alt={listing.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <Building2 className="w-10 h-10 text-muted-foreground" />
              )}
              
              {/* Favorite Button */}
              {onToggleFavorite && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
                </button>
              )}

              {/* Provision Badge */}
              {showProvision && listing.partner_commission_rate && (
                <Badge className="absolute top-2 left-2 text-xs bg-primary">
                  {listing.partner_commission_rate}%
                </Badge>
              )}
            </div>

            {/* Quadrant 2: Property Data */}
            <div className="p-3 flex flex-col justify-between border-l bg-card">
              <div className="space-y-1">
                <p className="text-lg font-bold text-primary leading-tight">
                  {formatCurrency(listing.asking_price)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{listing.city}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {listing.total_area_sqm} m² · {propertyTypeLabel}
                </p>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-sm font-semibold">{grossYield}%</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: T-Konto (Einnahmen | Ausgaben) */}
          <div className="flex-1 grid grid-cols-2 min-h-0 border-t">
            {/* Quadrant 3: Einnahmen (grün) */}
            <div className="p-3 bg-green-50/50 dark:bg-green-950/20 flex flex-col">
              <p className="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                Einnahmen
              </p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">+ Miete</span>
                  <span className="font-medium text-green-600">
                    {formatCurrencyShort(monthlyRent)}/Mo
                  </span>
                </div>
                {monthlyTaxSavings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">+ Steuervorteil</span>
                    <span className="font-medium text-green-600">
                      {formatCurrencyShort(monthlyTaxSavings)}/Mo
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quadrant 4: Ausgaben (rot) */}
            <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border-l flex flex-col">
              <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
                Ausgaben
              </p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">− Zinsen</span>
                  <span className="font-medium text-red-600">
                    {formatCurrencyShort(monthlyInterest)}/Mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">− Tilgung</span>
                  <span className="font-medium text-red-600">
                    {formatCurrencyShort(monthlyRepayment)}/Mo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Monatsbelastung */}
          <div className={cn(
            "px-3 py-2 border-t flex items-center justify-between",
            isPositiveCashflow 
              ? "bg-green-100 dark:bg-green-900/30" 
              : "bg-muted/50"
          )}>
            <span className="text-xs font-medium">Monatsbelastung</span>
            <span className={cn(
              "text-sm font-bold",
              isPositiveCashflow ? "text-green-600" : "text-foreground"
            )}>
              {metrics ? (
                <>
                  {isPositiveCashflow ? '+' : ''}{formatCurrencyShort(Math.abs(metrics.monthlyBurden))}/Mo
                  {isPositiveCashflow && <span className="ml-1">✓</span>}
                </>
              ) : (
                '—'
              )}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
