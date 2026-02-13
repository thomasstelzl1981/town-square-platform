/**
 * LoanCalculator — Amount/Term inputs + mock offer grid
 */
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { calculateMockOffers, type MockOffer } from '@/hooks/useConsumerLoan';
import { MockOfferCard } from './MockOfferCard';

interface LoanCalculatorProps {
  disabled?: boolean;
  selectedOfferId: string | null;
  onSelectOffer: (offer: MockOffer) => void;
  onAmountChange: (amount: number) => void;
  onTermChange: (term: number) => void;
  amount: number;
  term: number;
}

export function LoanCalculator({
  disabled, selectedOfferId, onSelectOffer,
  onAmountChange, onTermChange, amount, term,
}: LoanCalculatorProps) {
  const [offers, setOffers] = useState<MockOffer[]>([]);
  const [calculated, setCalculated] = useState(false);

  const handleCalculate = () => {
    if (amount < 1000 || term < 6) return;
    const result = calculateMockOffers(amount, term);
    setOffers(result);
    setCalculated(true);
  };

  return (
    <section className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <h2 className="text-lg font-semibold mb-4">Kredit berechnen</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="loan-amount">Kreditbetrag (EUR)</Label>
          <Input
            id="loan-amount"
            type="number"
            min={1000}
            max={100000}
            step={500}
            placeholder="z.B. 15.000"
            value={amount || ''}
            onChange={e => onAmountChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loan-term">Laufzeit (Monate)</Label>
          <Input
            id="loan-term"
            type="number"
            min={6}
            max={120}
            step={6}
            placeholder="z.B. 48"
            value={term || ''}
            onChange={e => onTermChange(Number(e.target.value))}
          />
        </div>
        <Button
          onClick={handleCalculate}
          disabled={amount < 1000 || term < 6}
          className="gap-2"
        >
          <Calculator className="h-4 w-4" />
          Angebote berechnen
        </Button>
      </div>

      {calculated && offers.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {offers.length} Angebote gefunden — sortiert nach Effektivzins
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {offers.map(offer => (
              <MockOfferCard
                key={offer.id}
                offer={offer}
                selected={selectedOfferId === offer.id}
                onSelect={() => onSelectOffer(offer)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
