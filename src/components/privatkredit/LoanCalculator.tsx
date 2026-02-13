/**
 * LoanCalculator — Amount/Term inputs + offer comparison table
 * Redesigned: glass-card wrapper, FORM_GRID, TABLE-based offer list
 */
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Star, Check } from 'lucide-react';
import { calculateMockOffers, type MockOffer } from '@/hooks/useConsumerLoan';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';

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
    <div className={cn(disabled && 'opacity-50 pointer-events-none', 'space-y-4 md:space-y-6')}>
      {/* Input Cards — 2-column form grid */}
      <div className={DESIGN.FORM_GRID.FULL}>
        <Card className={DESIGN.CARD.BASE}>
          <div className={DESIGN.CARD.SECTION_HEADER}>
            <h2 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Kreditbetrag & Laufzeit</h2>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="loan-amount" className={DESIGN.TYPOGRAPHY.LABEL}>Kreditbetrag (EUR)</Label>
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
              <Label htmlFor="loan-term" className={DESIGN.TYPOGRAPHY.LABEL}>Laufzeit (Monate)</Label>
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
          </CardContent>
        </Card>

        <Card className={DESIGN.CARD.BASE}>
          <div className={DESIGN.CARD.SECTION_HEADER}>
            <h2 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Berechnung</h2>
          </div>
          <CardContent className="p-4 flex flex-col justify-between h-[calc(100%-41px)]">
            <div className="space-y-2">
              <p className={DESIGN.TYPOGRAPHY.MUTED}>
                Geben Sie Kreditbetrag und Laufzeit ein, um Angebote von verschiedenen Banken zu vergleichen.
              </p>
              {amount >= 1000 && term >= 6 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Betrag:</span>
                    <span className="font-medium">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Laufzeit:</span>
                    <span className="font-medium">{term} Monate</span>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleCalculate}
              disabled={amount < 1000 || term < 6}
              className="w-full gap-2 mt-4"
              size="lg"
            >
              <Calculator className="h-4 w-4" />
              Angebote berechnen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Offers Table */}
      {calculated && offers.length > 0 && (
        <Card className={DESIGN.CARD.BASE}>
          <div className={DESIGN.CARD.SECTION_HEADER}>
            <div className="flex items-center justify-between">
              <h2 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>
                {offers.length} Angebote gefunden
              </h2>
              <span className={DESIGN.TYPOGRAPHY.HINT}>sortiert nach Effektivzins</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={DESIGN.TABLE.HEADER_BG}>
                  <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-left')}>Bank</th>
                  <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-right')}>Effektivzins</th>
                  <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-right')}>Monatliche Rate</th>
                  <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-right')}>Gesamtbetrag</th>
                  <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-center')}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {offers.map(offer => {
                  const isSelected = selectedOfferId === offer.id;
                  return (
                    <tr
                      key={offer.id}
                      className={cn(
                        DESIGN.TABLE.ROW_BORDER,
                        DESIGN.TABLE.ROW_HOVER,
                        isSelected && 'bg-primary/5 ring-2 ring-inset ring-primary/30',
                        'cursor-pointer'
                      )}
                      onClick={() => onSelectOffer(offer)}
                    >
                      <td className={cn(DESIGN.TABLE.BODY_CELL, 'font-medium')}>
                        <div className="flex items-center gap-2">
                          {offer.bank_name}
                          {offer.recommended && (
                            <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <Star className="h-3 w-3" /> Empfohlen
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className={cn(DESIGN.TABLE.BODY_CELL, 'text-right font-bold')}>
                        {offer.apr.toFixed(2)} %
                      </td>
                      <td className={cn(DESIGN.TABLE.BODY_CELL, 'text-right font-semibold')}>
                        {offer.monthly_rate.toFixed(2)} €
                      </td>
                      <td className={cn(DESIGN.TABLE.BODY_CELL, 'text-right')}>
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(offer.total_amount)}
                      </td>
                      <td className={cn(DESIGN.TABLE.BODY_CELL, 'text-center')}>
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); onSelectOffer(offer); }}
                        >
                          {isSelected ? (
                            <><Check className="h-3 w-3 mr-1" /> Gewählt</>
                          ) : (
                            'Wählen'
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
