import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Building2, Maximize2, TrendingUp, ArrowRight } from 'lucide-react';
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
}

interface InvestmentSearchCardProps {
  listing: PublicListing;
  metrics?: InvestmentMetrics | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  showProvision?: boolean;
  variant?: 'grid' | 'list';
  linkPrefix?: string;
}

export function InvestmentSearchCard({
  listing,
  metrics,
  isFavorite = false,
  onToggleFavorite,
  showProvision = false,
  variant = 'grid',
  linkPrefix = '/portal/investments/objekt'  // Default: Portal-Route statt Zone 3
}: InvestmentSearchCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const grossYield = listing.asking_price > 0 
    ? ((listing.monthly_rent_total * 12) / listing.asking_price * 100).toFixed(1)
    : '0.0';

  const isPositiveCashflow = metrics && metrics.monthlyBurden <= 0;

  if (variant === 'list') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex">
          {/* Image */}
          <div className="w-48 h-40 bg-muted flex items-center justify-center flex-shrink-0 relative">
            {listing.hero_image_path ? (
              <img 
                src={listing.hero_image_path} 
                alt={listing.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-12 h-12 text-muted-foreground" />
            )}
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:scale-110 transition-transform"
                aria-label={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
              >
                <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
              </button>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-4 flex justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{listing.property_type}</Badge>
                {showProvision && listing.partner_commission_rate && (
                  <Badge variant="secondary" className="text-xs">
                    {listing.partner_commission_rate}% Provision
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.postal_code} {listing.city}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span>{listing.total_area_sqm} m²</span>
                <span>{listing.unit_count} Einheiten</span>
                <span className="text-green-600 font-medium">{grossYield}% Rendite</span>
              </div>
            </div>

            <div className="text-right space-y-2">
              <p className="text-xl font-bold">{formatCurrency(listing.asking_price)}</p>
              {metrics && (
                <div className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium",
                  isPositiveCashflow ? 'bg-green-100 text-green-700' : 'bg-muted'
                )}>
                  {isPositiveCashflow ? '+' : ''}{formatCurrency(metrics.monthlyBurden)}/Mo
                </div>
              )}
              <Link to={`${linkPrefix}/${listing.public_id || listing.listing_id}`}>
                <Button size="sm" className="mt-2">
                  Details <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image */}
      <div className="h-48 bg-muted flex items-center justify-center relative">
        {listing.hero_image_path ? (
          <img 
            src={listing.hero_image_path} 
            alt={listing.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <Building2 className="w-16 h-16 text-muted-foreground" />
        )}
        
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
          </button>
        )}

        {showProvision && listing.partner_commission_rate && (
          <Badge className="absolute top-3 left-3 bg-primary">
            {listing.partner_commission_rate}% Provision
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title & Location */}
        <div className="mb-3">
          <h3 className="font-semibold line-clamp-1 mb-1">{listing.title}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.city}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Maximize2 className="w-3 h-3" />
            {listing.total_area_sqm} m²
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Building2 className="w-3 h-3" />
            {listing.unit_count} WE
          </div>
        </div>

        {/* Haushaltsrechnung Mini */}
        {metrics && (
          <div className="p-3 rounded-lg bg-muted/50 mb-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">+ Miete</span>
              <span className="text-green-600">+{formatCurrency(listing.monthly_rent_total)}/Mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">− Rate</span>
              <span className="text-red-600">−{formatCurrency((metrics.loanAmount * 0.04) / 12)}/Mo</span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="font-medium">Belastung</span>
              <span className={cn(
                "font-bold",
                isPositiveCashflow ? 'text-green-600' : 'text-foreground'
              )}>
                {isPositiveCashflow ? '+' : ''}{formatCurrency(metrics.monthlyBurden)}/Mo
              </span>
            </div>
          </div>
        )}

        {/* Price & Yield */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-bold">{formatCurrency(listing.asking_price)}</p>
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">{grossYield}%</span>
          </div>
        </div>

        {/* CTA */}
        <Link to={`${linkPrefix}/${listing.public_id || listing.listing_id}`}>
          <Button className="w-full" size="sm">
            Details ansehen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
