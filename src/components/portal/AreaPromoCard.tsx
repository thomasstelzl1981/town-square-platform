/**
 * AREA PROMO CARD
 * 
 * Promotional/news tile displayed as the first card in area overview grids.
 * Supports optional promotional images with text overlay.
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { AreaPromoContent } from '@/config/areaPromoContent';

interface AreaPromoCardProps {
  promo: AreaPromoContent;
}

export function AreaPromoCard({ promo }: AreaPromoCardProps) {
  const ctaButton = promo.ctaRoute ? (
    <Button asChild variant="default" size="sm" className="gap-2">
      <Link to={promo.ctaRoute}>
        {promo.ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  ) : promo.ctaUrl ? (
    <Button asChild variant="default" size="sm" className="gap-2">
      <a href={promo.ctaUrl} target="_blank" rel="noopener noreferrer">
        {promo.ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </a>
    </Button>
  ) : null;

  if (promo.imageUrl) {
    return (
      <Card className="glass-card overflow-hidden border-primary/20 hover:border-primary/30 transition-colors h-full flex flex-col min-h-[280px]">
        {/* Image section */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={promo.imageUrl}
            alt={promo.headline}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {promo.badge && (
            <Badge variant="secondary" className="absolute top-3 right-3 uppercase text-xs tracking-wider shadow-lg">
              {promo.badge}
            </Badge>
          )}
        </div>
        {/* Content section */}
        <CardContent className="flex flex-col flex-1 p-4">
          <h3 className="text-base font-semibold leading-tight mb-1">{promo.headline}</h3>
          <p className="text-sm text-muted-foreground mb-3 flex-1">{promo.description}</p>
          {ctaButton}
        </CardContent>
      </Card>
    );
  }

  // Fallback: text-only layout
  return (
    <Card className="glass-card bg-gradient-to-br from-primary/5 via-transparent to-background border-primary/20 hover:border-primary/30 transition-colors h-full flex flex-col min-h-[280px]">
      <CardContent className="flex flex-col flex-1 p-6">
        <div className="flex items-center gap-2 mb-3">
          {promo.badge && (
            <Badge variant="secondary" className="uppercase text-xs tracking-wider">
              {promo.badge}
            </Badge>
          )}
        </div>
        <h3 className="text-lg font-semibold leading-tight mb-2">{promo.headline}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex-1">{promo.description}</p>
        {ctaButton}
      </CardContent>
    </Card>
  );
}
