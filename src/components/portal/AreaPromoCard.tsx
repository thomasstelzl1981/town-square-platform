/**
 * AREA PROMO CARD — Clickable promo tile, no buttons.
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaPromoContent } from '@/config/areaPromoContent';

interface AreaPromoCardProps {
  promo: AreaPromoContent;
}

export function AreaPromoCard({ promo }: AreaPromoCardProps) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (promo.ctaRoute) navigate(promo.ctaRoute);
    else if (promo.ctaUrl) window.open(promo.ctaUrl, '_blank');
  };
  const isClickable = !!(promo.ctaRoute || promo.ctaUrl);

  if (promo.imageUrl) {
    return (
      <Card 
        className={`glass-card overflow-hidden border-primary/20 hover:border-primary/30 transition-colors h-full flex flex-col min-h-[180px] ${isClickable ? 'cursor-pointer active:scale-[0.98]' : ''}`}
        onClick={isClickable ? handleClick : undefined}
      >
        <div className="relative h-40 overflow-hidden">
          <img src={promo.imageUrl} alt={promo.headline} className="w-full h-full object-cover" loading="lazy" />
          {promo.badge && (
            <Badge variant="secondary" className="absolute top-3 right-3 uppercase text-xs tracking-wider shadow-lg">
              {promo.badge}
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-col flex-1 p-4">
          <h3 className="text-lg font-semibold leading-tight mb-1">{promo.headline}</h3>
          <p className="text-sm text-muted-foreground flex-1">{promo.description}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`glass-card bg-gradient-to-br from-primary/5 via-transparent to-background border-primary/20 hover:border-primary/30 transition-colors h-full flex flex-col min-h-[180px] ${isClickable ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      onClick={isClickable ? handleClick : undefined}
    >
      <CardContent className="flex flex-col flex-1 p-6">
        {promo.badge && (
          <Badge variant="secondary" className="uppercase text-xs tracking-wider w-fit mb-3">
            {promo.badge}
          </Badge>
        )}
        <h3 className="text-lg font-semibold leading-tight mb-2">{promo.headline}</h3>
        <p className="text-sm text-muted-foreground flex-1">{promo.description}</p>
      </CardContent>
    </Card>
  );
}
