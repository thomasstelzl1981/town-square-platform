/**
 * MandateCaseCard — Square widget card for acquisition mandates (analog to FinanceCaseCard)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MANDATE_STATUS_CONFIG } from '@/types/acquisition';

interface MandateCaseCardProps {
  mandate: {
    id: string;
    code: string;
    status: string;
    client_display_name?: string | null;
    asset_focus?: string[] | null;
    price_min?: number | null;
    price_max?: number | null;
    split_terms_confirmed_at?: string | null;
  };
  offerCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function MandateCaseCard({ mandate, offerCount, isSelected, onClick }: MandateCaseCardProps) {
  const statusConfig = MANDATE_STATUS_CONFIG[mandate.status] || { label: mandate.status, variant: 'secondary' };
  const priceRange = mandate.price_min || mandate.price_max
    ? [
        mandate.price_min ? `ab ${(mandate.price_min / 1000000).toFixed(1)}M` : '',
        mandate.price_max ? `bis ${(mandate.price_max / 1000000).toFixed(1)}M` : '',
      ].filter(Boolean).join(' – ')
    : null;

  return (
    <Card
      className={cn(
        'glass-card shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02] group',
        'flex flex-row items-center gap-3 p-3 md:flex-col md:aspect-square md:p-0',
        isSelected && 'ring-2 ring-primary shadow-glow'
      )}
      onClick={onClick}
    >
      {/* Mobile: horizontal row */}
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 md:hidden">
        <Briefcase className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0 md:hidden">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-sm leading-tight truncate">
            {mandate.split_terms_confirmed_at && mandate.client_display_name ? mandate.client_display_name : mandate.code}
          </p>
          <Badge variant={statusConfig.variant as 'default' | 'secondary' | 'outline'} className="text-[10px] font-medium flex-shrink-0">
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono">{mandate.code}</span>
          {offerCount !== undefined && offerCount > 0 && <span>· {offerCount} Objekte</span>}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 md:hidden" />

      {/* Desktop: square layout */}
      <CardContent className="hidden md:flex p-4 flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <Badge variant={statusConfig.variant as 'default' | 'secondary' | 'outline'} className="text-[10px] font-medium">
            {statusConfig.label}
          </Badge>
          <span className="text-[10px] font-mono text-muted-foreground">{mandate.code}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          {mandate.split_terms_confirmed_at && mandate.client_display_name ? (
            <p className="font-semibold text-sm leading-tight line-clamp-2">{mandate.client_display_name}</p>
          ) : (
            <p className="font-semibold text-sm leading-tight">{mandate.code}</p>
          )}
          {mandate.asset_focus && mandate.asset_focus.length > 0 && (
            <p className="text-[11px] text-muted-foreground line-clamp-1">{mandate.asset_focus.join(', ')}</p>
          )}
          {priceRange && (
            <p className="text-[10px] text-muted-foreground">{priceRange}</p>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          {offerCount !== undefined && offerCount > 0 ? (
            <span>{offerCount} Objekte</span>
          ) : (
            <span />
          )}
          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MandateCaseCardPlaceholder() {
  return (
    <Card className="glass-card border-dashed border-2 md:aspect-square flex flex-col items-center justify-center opacity-50">
      <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Keine Mandate</p>
        <p className="text-[10px] text-muted-foreground">Mandate werden über Zone 1 zugewiesen</p>
      </CardContent>
    </Card>
  );
}
