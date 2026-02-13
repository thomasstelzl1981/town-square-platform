/**
 * BankExamplesCard — Current market examples for consumer loans (orientation)
 */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark, Star } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';

const MARKET_EXAMPLES = [
  { bank: 'SWK Bank', apr: 5.79, amount: 10000, term: 60, rate: 191.67, cheapest: true },
  { bank: 'SKG Bank', apr: 5.89, amount: 10000, term: 60, rate: 192.11, cheapest: false },
  { bank: 'DKB', apr: 6.29, amount: 10000, term: 60, rate: 193.87, cheapest: false },
  { bank: 'ING', apr: 6.49, amount: 10000, term: 60, rate: 194.75, cheapest: false },
  { bank: 'Targobank', apr: 6.95, amount: 10000, term: 60, rate: 196.78, cheapest: false },
  { bank: 'Postbank', apr: 6.99, amount: 10000, term: 60, rate: 196.96, cheapest: false },
  { bank: 'Commerzbank', apr: 7.49, amount: 10000, term: 60, rate: 199.16, cheapest: false },
  { bank: 'Santander', apr: 7.99, amount: 10000, term: 60, rate: 201.36, cheapest: false },
];

const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export function BankExamplesCard() {
  return (
    <Card className={DESIGN.CARD.BASE}>
      <div className={DESIGN.CARD.SECTION_HEADER}>
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary" />
          <h2 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Aktuelle Marktkonditionen (Orientierung)</h2>
        </div>
        <p className={cn(DESIGN.TYPOGRAPHY.HINT, 'mt-1')}>
          Zweidrittelzins, Stand 02/2026 — Ihre persönlichen Konditionen können abweichen
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={DESIGN.TABLE.HEADER_BG}>
              <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-left')}>Bank</th>
              <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-right')}>Effektivzins</th>
              <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-right')}>Beispiel-Betrag</th>
              <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-right')}>Laufzeit</th>
              <th className={cn(DESIGN.TABLE.HEADER_CELL, 'text-right')}>Monatl. Rate</th>
            </tr>
          </thead>
          <tbody>
            {MARKET_EXAMPLES.map(ex => (
              <tr key={ex.bank} className={cn(DESIGN.TABLE.ROW_BORDER, DESIGN.TABLE.ROW_HOVER)}>
                <td className={cn(DESIGN.TABLE.BODY_CELL, 'font-medium')}>
                  <div className="flex items-center gap-2">
                    {ex.bank}
                    {ex.cheapest && (
                      <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Star className="h-3 w-3" /> Günstigster
                      </Badge>
                    )}
                  </div>
                </td>
                <td className={cn(DESIGN.TABLE.BODY_CELL, 'text-right font-bold')}>
                  {ex.apr.toFixed(2)} %
                </td>
                <td className={cn(DESIGN.TABLE.BODY_CELL, 'text-right')}>
                  {fmt.format(ex.amount)}
                </td>
                <td className={cn(DESIGN.TABLE.BODY_CELL, 'text-right')}>
                  {ex.term} Monate
                </td>
                <td className={cn(DESIGN.TABLE.BODY_CELL, 'text-right font-semibold')}>
                  {fmt.format(ex.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
