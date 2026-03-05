/**
 * R-2: Key Facts Bar — Scout24-style 4-KPI summary
 */
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from './exposeTypes';

interface ExposeKeyFactsProps {
  askingPrice: number;
  marketValue: number | null;
  areaSqm: number | null;
  grossYield: number;
}

export function ExposeKeyFacts({ askingPrice, marketValue, areaSqm, grossYield }: ExposeKeyFactsProps) {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(askingPrice || marketValue)}
            </p>
            <p className="text-xs text-muted-foreground">Kaufpreis</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{areaSqm?.toLocaleString('de-DE') || '—'} m²</p>
            <p className="text-xs text-muted-foreground">Wohnfläche</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Zimmer</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{grossYield.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">Bruttorendite</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
