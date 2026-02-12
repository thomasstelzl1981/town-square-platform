/**
 * FinanceOfferCard — Professional-looking preliminary finance offer.
 * Displays calculated loan terms in a non-tabular, visually distinct layout.
 */
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDown, TableProperties, FileText } from 'lucide-react';
import type { CalcData } from './FinanceCalculatorCard';

interface Props {
  calcData: CalcData | null;
  onTransferToApplication?: () => void;
  onShowAmortization?: () => void;
  showAmortizationActive?: boolean;
}

const fmt = (v: number) =>
  v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Metric({ label, value, unit, highlight }: { label: string; value: string; unit?: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 ${highlight ? 'col-span-2 sm:col-span-1' : ''}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-lg' : 'text-sm'}`}>
        {value}{unit ? <span className="text-muted-foreground font-normal ml-1">{unit}</span> : null}
      </span>
    </div>
  );
}

export default function FinanceOfferCard({ calcData, onTransferToApplication, onShowAmortization, showAmortizationActive }: Props) {
  const hasData = calcData && calcData.loanAmount > 0 && calcData.interestRate > 0;

  // Effective interest (Näherung: vierteljährliche Zinsverrechnung)
  const effectiveRate = useMemo(() => {
    if (!calcData || !calcData.interestRate) return 0;
    const r = calcData.interestRate / 100;
    return ((Math.pow(1 + r / 12, 12) - 1) * 100);
  }, [calcData]);

  // Estimated total term until full repayment
  const totalTermYears = useMemo(() => {
    if (!calcData || !calcData.interestRate || !calcData.monthlyRate || !calcData.loanAmount) return 0;
    const monthlyInterestRate = calcData.interestRate / 100 / 12;
    const monthlyPayment = calcData.monthlyRate;
    if (monthlyPayment <= calcData.loanAmount * monthlyInterestRate) return 99; // never paid off
    const months = -Math.log(1 - (calcData.loanAmount * monthlyInterestRate) / monthlyPayment) / Math.log(1 + monthlyInterestRate);
    return Math.ceil(months / 12);
  }, [calcData]);

  if (!hasData) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Bitte füllen Sie die Eckdaten und den Kalkulator aus, um ein überschlägiges Finanzierungsangebot zu erhalten.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-5 py-3 border-b bg-muted/20">
          <h3 className="text-base font-semibold uppercase tracking-wide">
            Überschlägiges Finanzierungsangebot
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unverbindliche Indikation auf Basis der eingegebenen Eckdaten
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
            <Metric label="Darlehensbetrag" value={fmt(calcData.loanAmount)} unit="EUR" highlight />
            <Metric label="Zinssatz nominal" value={fmt(calcData.interestRate)} unit="% p.a." />
            <Metric label="Zinssatz effektiv" value={fmt(effectiveRate)} unit="% p.a." />
            <Metric label="Anfängliche Tilgung" value={fmt(calcData.repaymentRate)} unit="% p.a." />
            <Metric label="Darlehensrate" value={fmt(calcData.monthlyRate)} unit="EUR / Monat" highlight />
            <Metric label="Voraussichtliche Laufzeit" value={totalTermYears >= 99 ? '> 40' : `ca. ${totalTermYears}`} unit="Jahre" />
          </div>
        </div>

        <div className="px-5 py-3 border-t flex flex-wrap gap-3">
          {onTransferToApplication && (
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={onTransferToApplication}>
              <ArrowDown className="h-3.5 w-3.5" /> Eckdaten in Antrag übernehmen
            </Button>
          )}
          {onShowAmortization && (
            <Button
              variant={showAmortizationActive ? 'default' : 'outline'}
              size="sm"
              className="gap-2 text-xs"
              onClick={onShowAmortization}
            >
              <TableProperties className="h-3.5 w-3.5" /> Tilgungsplan {showAmortizationActive ? 'ausblenden' : 'anzeigen'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
