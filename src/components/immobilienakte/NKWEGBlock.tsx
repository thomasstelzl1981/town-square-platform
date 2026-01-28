import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Building } from 'lucide-react';

interface NKWEGBlockProps {
  periodCurrent?: string;
  allocationKeyDefault?: 'SQM' | 'PERSONS' | 'MEA' | 'CONSUMPTION' | 'UNITS';
  lastSettlementDate?: string;
  lastSettlementBalanceEur?: number;
  hausgeldMonthlyEur?: number;
  allocatablePaEur?: number;
  nonAllocatablePaEur?: number;
  topCostBlocks?: Record<string, number>;
}

export function NKWEGBlock({
  periodCurrent,
  allocationKeyDefault,
  lastSettlementDate,
  lastSettlementBalanceEur,
  hausgeldMonthlyEur,
  allocatablePaEur,
  nonAllocatablePaEur,
  topCostBlocks,
}: NKWEGBlockProps) {
  const formatCurrency = (value?: number) => 
    value !== undefined ? `${value.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : '–';

  const allocationKeyLabels: Record<string, string> = {
    SQM: 'qm',
    PERSONS: 'Personen',
    MEA: 'MEA',
    CONSUMPTION: 'Verbrauch',
    UNITS: 'Einheiten',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Nebenkosten / WEG
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {periodCurrent && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Periode</span>
            <span>{periodCurrent}</span>
          </div>
        )}

        {allocationKeyDefault && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Umlageschlüssel</span>
            <span>{allocationKeyLabels[allocationKeyDefault] || allocationKeyDefault}</span>
          </div>
        )}

        {lastSettlementDate && (
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Letzte Abrechnung</span>
              <span>{lastSettlementDate}</span>
            </div>
            {lastSettlementBalanceEur !== undefined && (
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Saldo</span>
                <span className={lastSettlementBalanceEur >= 0 ? 'text-red-500' : 'text-green-600'}>
                  {lastSettlementBalanceEur >= 0 ? '+' : ''}{formatCurrency(lastSettlementBalanceEur)}
                </span>
              </div>
            )}
          </div>
        )}

        {hausgeldMonthlyEur !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1 mb-2 text-muted-foreground">
              <Building className="h-3.5 w-3.5" />
              <span>WEG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hausgeld mtl.</span>
              <span className="font-medium">{formatCurrency(hausgeldMonthlyEur)}</span>
            </div>
            {allocatablePaEur !== undefined && (
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-muted-foreground">Umlagefähig p.a.</span>
                <span>{formatCurrency(allocatablePaEur)}</span>
              </div>
            )}
            {nonAllocatablePaEur !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Nicht umlagef. p.a.</span>
                <span>{formatCurrency(nonAllocatablePaEur)}</span>
              </div>
            )}
          </div>
        )}

        {topCostBlocks && Object.keys(topCostBlocks).length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Top-Kostenblöcke p.a.</p>
            <div className="space-y-1">
              {Object.entries(topCostBlocks).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{key}</span>
                  <span>{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
