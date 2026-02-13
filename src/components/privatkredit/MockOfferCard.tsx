/**
 * MockOfferCard — Single loan offer comparison card
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import type { MockOffer } from '@/hooks/useConsumerLoan';
import { cn } from '@/lib/utils';

interface MockOfferCardProps {
  offer: MockOffer;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function MockOfferCard({ offer, selected, onSelect }: MockOfferCardProps) {
  return (
    <div className={cn(
      "rounded-lg border p-4 space-y-3 transition-all",
      selected && "border-primary ring-2 ring-primary/20 bg-primary/5",
      offer.recommended && !selected && "border-emerald-500/50 bg-emerald-500/5",
      !selected && !offer.recommended && "border-border hover:border-primary/30"
    )}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{offer.bank_name}</span>
        <div className="flex gap-1.5">
          {offer.recommended && (
            <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-100 text-emerald-700">
              <Star className="h-3 w-3" /> Empfohlen
            </Badge>
          )}
          {selected && (
            <Badge className="text-[10px] gap-1">
              <Check className="h-3 w-3" /> Gewählt
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Effektivzins</p>
          <p className="font-bold text-lg">{offer.apr.toFixed(2)} %</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Monatliche Rate</p>
          <p className="font-bold text-lg">{offer.monthly_rate.toFixed(2)} €</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Laufzeit</p>
          <p className="font-medium">{offer.term_months} Monate</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Gesamtbetrag</p>
          <p className="font-medium">{offer.total_amount.toFixed(2)} €</p>
        </div>
      </div>

      <Button
        variant={selected ? "default" : "outline"}
        size="sm"
        className="w-full"
        onClick={() => onSelect(offer.id)}
      >
        {selected ? 'Ausgewählt' : 'Dieses Angebot wählen'}
      </Button>
    </div>
  );
}
