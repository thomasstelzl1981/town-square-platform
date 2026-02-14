import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency as fmtCurrency } from '@/lib/formatters';
import { Landmark, Percent, Calendar, Phone } from 'lucide-react';

interface FinancingBlockProps {
  bankName?: string;
  loanNumber?: string;
  outstandingBalanceEur?: number;
  outstandingBalanceAsof?: string;
  interestRatePercent?: number;
  fixedInterestEndDate?: string;
  annuityMonthlyEur?: number;
  specialRepaymentRight?: { enabled: boolean; amountEur?: number };
  contactPerson?: { name?: string; phone?: string; email?: string };
}

export function FinancingBlock({
  bankName,
  loanNumber,
  outstandingBalanceEur,
  outstandingBalanceAsof,
  interestRatePercent,
  fixedInterestEndDate,
  annuityMonthlyEur,
  specialRepaymentRight,
  contactPerson,
}: FinancingBlockProps) {
  const formatCurrency = (value?: number) => 
    value !== undefined ? fmtCurrency(value) : '–';

  if (!bankName && !loanNumber) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Finanzierung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Keine Finanzierung hinterlegt</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="h-4 w-4" />
          Finanzierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {bankName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bank</span>
            <span className="font-medium">{bankName}</span>
          </div>
        )}
        
        {loanNumber && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Darlehens-Nr.</span>
            <span className="font-mono text-xs">{loanNumber}</span>
          </div>
        )}

        {outstandingBalanceEur !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restschuld</span>
              <span className="font-medium">{formatCurrency(outstandingBalanceEur)}</span>
            </div>
            {outstandingBalanceAsof && (
              <div className="text-xs text-muted-foreground text-right">
                per {outstandingBalanceAsof}
              </div>
            )}
          </div>
        )}

        {interestRatePercent !== undefined && (
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground flex items-center gap-1">
              <Percent className="h-3.5 w-3.5" />
              Zinssatz
            </span>
            <span>{interestRatePercent.toFixed(2)} %</span>
          </div>
        )}

        {fixedInterestEndDate && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Zinsbindung bis
            </span>
            <span>{fixedInterestEndDate}</span>
          </div>
        )}

        {annuityMonthlyEur !== undefined && (
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground">Rate mtl.</span>
            <span className="font-medium">{formatCurrency(annuityMonthlyEur)}</span>
          </div>
        )}

        {specialRepaymentRight?.enabled && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Sondertilgung</span>
            <span className="text-green-600">
              Ja{specialRepaymentRight.amountEur ? ` (${formatCurrency(specialRepaymentRight.amountEur)}/Jahr)` : ''}
            </span>
          </div>
        )}

        {contactPerson && (contactPerson.name || contactPerson.phone) && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Ansprechpartner</p>
            {contactPerson.name && <p className="text-sm">{contactPerson.name}</p>}
            {contactPerson.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contactPerson.phone}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
