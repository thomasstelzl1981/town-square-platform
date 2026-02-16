/**
 * PartnerPropertyGrid — Grid aus Property-Kacheln mit Investment-Metrics
 * Zeigt alle aktiven partner_network Listings mit berechneten Werten
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Maximize2, TrendingUp, ArrowRight, Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingWithMetrics {
  id: string;
  public_id: string | null;
  title: string;
  asking_price: number;
  commission_rate: number | null;
  property_address: string;
  property_city: string;
  property_type: string | null;
  total_area_sqm: number | null;
  annual_rent: number;
  hero_image_path?: string | null;
  // Calculated metrics
  grossYield: number | null;
  cashFlowBeforeTax: number | null;
  taxSavings: number | null;
  netBurden: number | null;
}

interface PartnerPropertyGridProps {
  listings: ListingWithMetrics[];
  excludedIds?: Set<string>;
  onSelect: (listing: ListingWithMetrics) => void;
  onToggleExclude?: (listingId: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function PartnerPropertyGrid({
  listings,
  excludedIds = new Set(),
  onSelect,
  onToggleExclude,
  isLoading = false,
  emptyMessage = 'Keine Objekte verfügbar',
}: PartnerPropertyGridProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const formatCurrencyShort = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}k €`;
    }
    return `${value.toFixed(0)} €`;
  };

  // Filter out excluded listings
  const visibleListings = listings.filter(l => !excludedIds.has(l.id));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted" />
            <CardContent className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (visibleListings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Aktivieren Sie Objekte unter Verkauf → Partner-Freigabe
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleListings.map((listing) => {
        const isPositiveCashflow = listing.netBurden !== null && listing.netBurden <= 0;

        return (
          <Card 
            key={listing.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => onSelect(listing)}
          >
            {/* Image */}
            <div className="h-40 bg-muted flex items-center justify-center relative">
              {listing.hero_image_path ? (
                <img 
                  src={listing.hero_image_path} 
                  alt={listing.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <Building2 className="w-12 h-12 text-muted-foreground" />
              )}
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {listing.property_type && (
                  <Badge variant="secondary" className="text-xs">
                    {listing.property_type.replace('_', ' ')}
                  </Badge>
                )}
                {listing.grossYield && (
                  <Badge className="text-xs bg-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {listing.grossYield.toFixed(1)}%
                  </Badge>
                )}
              </div>

              {/* Commission Badge */}
              {listing.commission_rate && (
                <Badge className="absolute top-2 right-2 bg-primary">
                  <Users className="w-3 h-3 mr-1" />
                  {listing.commission_rate}%
                </Badge>
              )}

              {/* Exclude Button */}
              {onToggleExclude && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onToggleExclude(listing.id); 
                  }}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:scale-110 transition-transform"
                  title="Objekt ausblenden"
                  aria-label="Objekt ausblenden"
                >
                  <Heart className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Title & Location */}
              <div>
                <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {listing.property_city}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {listing.total_area_sqm && (
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />
                    {listing.total_area_sqm} m²
                  </span>
                )}
                <span className="font-semibold text-foreground">
                  {formatCurrency(listing.asking_price)}
                </span>
              </div>

              {/* Mini Haushaltsrechnung */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">+ Cashflow</span>
                  <span className={cn(
                    "font-medium",
                    (listing.cashFlowBeforeTax || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {listing.cashFlowBeforeTax !== null 
                      ? `${listing.cashFlowBeforeTax >= 0 ? '+' : ''}${formatCurrencyShort(listing.cashFlowBeforeTax)}/Mo`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">+ Steuervorteil</span>
                  <span className="font-medium text-green-600">
                    {listing.taxSavings !== null 
                      ? `+${formatCurrencyShort(listing.taxSavings)}/Mo`
                      : '—'}
                  </span>
                </div>
                <div className={cn(
                  "flex justify-between pt-1.5 border-t",
                  isPositiveCashflow ? 'text-green-600' : ''
                )}>
                  <span className="font-semibold">Netto-Belastung</span>
                  <span className="font-bold">
                    {listing.netBurden !== null 
                      ? `${listing.netBurden > 0 ? '' : '+'}${formatCurrencyShort(-listing.netBurden)}/Mo`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <Button className="w-full" size="sm">
                Details ansehen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export type { ListingWithMetrics };
