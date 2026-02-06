import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Sparkles, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface CostEstimateCardProps {
  min: number | null;
  mid: number | null;
  max: number | null;
  onEstimate: () => void;
  isEstimating: boolean;
  hasLineItems: boolean;
  location?: string;
  dataSource?: string;
}

export function CostEstimateCard({
  min,
  mid,
  max,
  onEstimate,
  isEstimating,
  hasLineItems,
  location = 'Berlin',
  dataSource,
}: CostEstimateCardProps) {
  const hasEstimate = min !== null && max !== null;
  
  // Convert cents to euros
  const minEuro = min ? min / 100 : 0;
  const midEuro = mid ? mid / 100 : 0;
  const maxEuro = max ? max / 100 : 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            KI-gestützte Kostenschätzung
          </CardTitle>
          <Button
            variant="default"
            size="sm"
            onClick={onEstimate}
            disabled={isEstimating || !hasLineItems}
          >
            {isEstimating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Berechne...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Berechnen
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasEstimate ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Minimum */}
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Minimum</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(minEuro)}
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                  Basis-Ausstattung
                </p>
              </div>
              
              {/* Mittel */}
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
                  <Minus className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Mittel</span>
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {formatCurrency(midEuro)}
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                  Standard-Qualität
                </p>
              </div>
              
              {/* Maximum */}
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Maximum</span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(maxEuro)}
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                  Premium-Qualität
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>📍 Preisbasis: {location}, {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</span>
              {dataSource && (
                <span>{dataSource}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Calculator className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {hasLineItems 
                ? 'Klicken Sie auf "Berechnen" für eine KI-gestützte Kostenschätzung'
                : 'Erstellen Sie zuerst ein Leistungsverzeichnis'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
