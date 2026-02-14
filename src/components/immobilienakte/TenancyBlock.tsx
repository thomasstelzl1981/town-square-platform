import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency as fmtCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Euro, Wallet } from 'lucide-react';

interface TenancyBlockProps {
  status: 'ACTIVE' | 'VACANT' | 'TERMINATING' | 'ENDED';
  startDate?: string;
  endDate?: string;
  rentColdEur?: number;
  nkAdvanceEur?: number;
  heatingAdvanceEur?: number;
  rentWarmEur?: number;
  paymentDueDay?: number;
  depositAmountEur?: number;
  depositStatus?: 'PAID' | 'OPEN' | 'PARTIAL';
  rentModel?: 'FIX' | 'INDEX' | 'STAFFEL';
  nextRentAdjustmentDate?: string;
}

export function TenancyBlock({
  status,
  startDate,
  rentColdEur,
  nkAdvanceEur,
  heatingAdvanceEur,
  rentWarmEur,
  paymentDueDay,
  depositAmountEur,
  depositStatus,
  rentModel,
  nextRentAdjustmentDate,
}: TenancyBlockProps) {
  const statusConfig = {
    ACTIVE: { label: 'Aktiv', color: 'bg-green-600' },
    VACANT: { label: 'Leer', color: 'bg-red-500' },
    TERMINATING: { label: 'Kündigung', color: 'bg-amber-500' },
    ENDED: { label: 'Beendet', color: 'bg-gray-500' },
  };

  const depositStatusConfig = {
    PAID: { label: 'Gezahlt', color: 'text-green-600' },
    OPEN: { label: 'Offen', color: 'text-red-500' },
    PARTIAL: { label: 'Teilweise', color: 'text-amber-500' },
  };

  const formatCurrency = (value?: number) => 
    value !== undefined ? fmtCurrency(value) : '–';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mietverhältnis
          </span>
          <Badge className={statusConfig[status].color}>
            {statusConfig[status].label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {startDate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Seit {startDate}</span>
          </div>
        )}

        <div className="space-y-1.5 pt-2 border-t">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kaltmiete</span>
            <span className="font-medium">{formatCurrency(rentColdEur)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NK-VZ</span>
            <span>{formatCurrency(nkAdvanceEur)}</span>
          </div>
          {heatingAdvanceEur !== undefined && heatingAdvanceEur > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Heiz-VZ</span>
              <span>{formatCurrency(heatingAdvanceEur)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t font-medium">
            <span>Warmmiete</span>
            <span className="text-primary">{formatCurrency(rentWarmEur)}</span>
          </div>
        </div>

        {paymentDueDay && (
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground">Zahlungstag</span>
            <span>{paymentDueDay}. des Monats</span>
          </div>
        )}

        {depositAmountEur !== undefined && (
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              Kaution
            </span>
            <span className="flex items-center gap-2">
              {formatCurrency(depositAmountEur)}
              {depositStatus && (
                <span className={`text-xs ${depositStatusConfig[depositStatus].color}`}>
                  ({depositStatusConfig[depositStatus].label})
                </span>
              )}
            </span>
          </div>
        )}

        {rentModel && rentModel !== 'FIX' && (
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground">Mietmodell</span>
            <span>{rentModel === 'INDEX' ? 'Indexmiete' : 'Staffelmiete'}</span>
          </div>
        )}

        {nextRentAdjustmentDate && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Nächste Anpassung frühestens</span>
            <span>{nextRentAdjustmentDate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
