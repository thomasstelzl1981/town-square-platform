import { useState } from 'react';
import { Heart, MapPin, Maximize2, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface PropertyCardData {
  public_id: string;
  title: string;
  image_url?: string;
  property_type?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  total_area_sqm?: number;
  year_built?: number;
  asking_price: number;
  monthly_rent?: number;
  gross_yield?: number;
  // Calculated values
  cashFlowBeforeTax?: number;
  taxSavings?: number;
  netBurden?: number;
}

interface KaufyPropertyCardProps {
  property: PropertyCardData;
  showInvestmentMetrics?: boolean;
}

export function KaufyPropertyCard({ property, showInvestmentMetrics = true }: KaufyPropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(() => {
    const favorites = JSON.parse(localStorage.getItem('kaufy_favorites') || '[]');
    return favorites.includes(property.public_id);
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem('kaufy_favorites') || '[]');
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== property.public_id);
    } else {
      newFavorites = [...favorites, property.public_id];
    }
    
    localStorage.setItem('kaufy_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}k €`;
    }
    return `${value.toFixed(0)} €`;
  };

  const propertyTypeLabels: Record<string, string> = {
    'apartment': 'ETW',
    'house': 'EFH',
    'multi_family': 'MFH',
    'commercial': 'Gewerbe',
    'land': 'Grundstück',
  };

  return (
    <Link 
      to={`/kaufy/immobilien/${property.public_id}`}
      className="block group"
    >
      <div 
        className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl border"
        style={{ 
          backgroundColor: 'hsl(var(--z3-card))',
          borderColor: 'hsl(var(--z3-border))',
        }}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.image_url || '/placeholder.svg'}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {property.property_type && (
              <Badge 
                className="font-semibold"
                style={{ 
                  backgroundColor: 'hsl(var(--z3-background))',
                  color: 'hsl(var(--z3-foreground))',
                }}
              >
                {propertyTypeLabels[property.property_type] || property.property_type}
              </Badge>
            )}
            {property.gross_yield && (
              <Badge 
                className="font-semibold"
                style={{ 
                  backgroundColor: 'hsl(142 71% 45%)',
                  color: 'white',
                }}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {property.gross_yield.toFixed(1)}%
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ 
              backgroundColor: isFavorite ? 'hsl(0 84% 60%)' : 'hsl(var(--z3-background) / 0.9)',
            }}
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-white text-white' : ''}`}
              style={{ color: isFavorite ? 'white' : 'hsl(var(--z3-foreground))' }}
            />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--z3-muted-foreground))' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                {property.postal_code} {property.city}
              </p>
              <p className="text-sm truncate" style={{ color: 'hsl(var(--z3-foreground))' }}>
                {property.address || property.title}
              </p>
            </div>
          </div>

          {/* Details Row */}
          <div className="flex gap-4 text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
            {property.total_area_sqm && (
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5" />
                {property.total_area_sqm} m²
              </span>
            )}
            {property.year_built && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {property.year_built}
              </span>
            )}
          </div>

          {/* Price */}
          <p className="text-xl font-bold" style={{ color: 'hsl(var(--z3-foreground))' }}>
            {formatCurrency(property.asking_price)}
          </p>

          {/* Investment Metrics */}
          {showInvestmentMetrics && (
            <div 
              className="pt-3 border-t space-y-2"
              style={{ borderColor: 'hsl(var(--z3-border))' }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Cashflow vor Steuer</span>
                <span 
                  className="font-medium"
                  style={{ 
                    color: (property.cashFlowBeforeTax || 0) >= 0 
                      ? 'hsl(142 71% 45%)' 
                      : 'hsl(0 84% 60%)' 
                  }}
                >
                  {property.cashFlowBeforeTax !== undefined 
                    ? `${property.cashFlowBeforeTax >= 0 ? '+' : ''}${formatCurrencyShort(property.cashFlowBeforeTax)}/Mo`
                    : '—'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Steuervorteil</span>
                <span className="font-medium" style={{ color: 'hsl(142 71% 45%)' }}>
                  {property.taxSavings !== undefined 
                    ? `+${formatCurrencyShort(property.taxSavings)}/Mo`
                    : '—'
                  }
                </span>
              </div>

              {/* Net Burden Highlight */}
              <div 
                className="rounded-lg p-3 mt-2"
                style={{ 
                  backgroundColor: (property.netBurden || 0) <= 0 
                    ? 'hsl(142 71% 45% / 0.1)' 
                    : 'hsl(var(--z3-secondary))',
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: 'hsl(var(--z3-foreground))' }}>
                    Netto-Belastung
                  </span>
                  <span 
                    className="text-lg font-bold"
                    style={{ 
                      color: (property.netBurden || 0) <= 0 
                        ? 'hsl(142 71% 45%)' 
                        : 'hsl(var(--z3-foreground))' 
                    }}
                  >
                    {property.netBurden !== undefined 
                      ? `${property.netBurden > 0 ? '' : '+'}${formatCurrencyShort(-property.netBurden)}/Mo`
                      : '—'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
