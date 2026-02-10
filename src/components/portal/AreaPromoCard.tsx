/**
 * AREA PROMO CARD
 * 
 * Promotional/news tile displayed as the first card in area overview grids.
 * Links to internal routes or external URLs.
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, ArrowRight } from 'lucide-react';
import { AreaPromoContent } from '@/config/areaPromoContent';

interface AreaPromoCardProps {
  promo: AreaPromoContent;
}

export function AreaPromoCard({ promo }: AreaPromoCardProps) {
  return (
    <Card className="glass-card bg-gradient-to-br from-primary/5 via-transparent to-background border-primary/20 hover:border-primary/30 transition-colors h-full flex flex-col min-h-[280px]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          {promo.badge && (
            <Badge variant="secondary" className="uppercase text-xs tracking-wider">
              {promo.badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg leading-tight">{promo.headline}</CardTitle>
        <CardDescription className="text-sm">{promo.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        {promo.ctaRoute ? (
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
        ) : null}
      </CardContent>
    </Card>
  );
}
