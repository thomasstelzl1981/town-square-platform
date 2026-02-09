/**
 * FinanzierungSummary — Kaufpreisaufschlüsselung + Darlehensübersicht
 * 
 * Zeigt:
 * 1. Kaufnebenkosten (GrESt, Notar) → Gesamtinvestition → Finanzierungsbedarf
 * 2. Darlehensdaten (Zinssatz nominal/effektiv, Rate p.a./Monat, Tilgung)
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalculationResult } from '@/hooks/useInvestmentEngine';

interface FinanzierungSummaryProps {
  purchasePrice: number;
  equity: number;
  result: CalculationResult;
  transferTaxRate?: number;
  notaryRate?: number;
  className?: string;
}

export function FinanzierungSummary({
  purchasePrice,
  equity,
  result,
  transferTaxRate = 6.5,
  notaryRate = 2.0,
  className,
}: FinanzierungSummaryProps) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const fmtPct = (v: number) =>
    new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' %';

  // Kaufnebenkosten
  const transferTax = purchasePrice * (transferTaxRate / 100);
  const notaryCost = purchasePrice * (notaryRate / 100);
  const totalInvestment = purchasePrice + transferTax + notaryCost;
  const financingNeed = totalInvestment - equity;

  // Darlehensdaten aus Engine-Result
  const { summary } = result;
  const nominalRate = summary.interestRate;
  const effectiveRate = nominalRate * (1 + nominalRate / 200);
  const yearlyRate = summary.yearlyInterest + summary.yearlyRepayment;
  const monthlyRate = yearlyRate / 12;

  const Row = ({ label, value, bold, separator }: { label: string; value: string; bold?: boolean; separator?: boolean }) => (
    <div className={cn(
      "flex justify-between py-1.5 text-sm",
      bold && "font-semibold",
      separator && "border-t border-border pt-2 mt-1"
    )}>
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'text-foreground' : ''}>{value}</span>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="h-4 w-4" />
          Finanzierungsübersicht
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sektion 1: Kaufpreisaufschlüsselung */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Kaufpreisaufschlüsselung
          </p>
          <Row label="Kaufpreis" value={fmt(purchasePrice)} />
          <Row label={`+ Grunderwerbsteuer (${transferTaxRate.toFixed(1)} %)`} value={fmt(transferTax)} />
          <Row label={`+ Notar & Grundbuch (${notaryRate.toFixed(1)} %)`} value={fmt(notaryCost)} />
          <Row label="= Gesamtinvestition" value={fmt(totalInvestment)} bold separator />
          <Row label="− Eigenkapital" value={fmt(equity)} />
          <Row label="= Finanzierungsbedarf" value={fmt(financingNeed)} bold separator />
        </div>

        {/* Sektion 2: Darlehen */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Darlehen
          </p>
          <Row label="Darlehensbetrag" value={fmt(summary.loanAmount)} bold />
          <Row label="Zinssatz (nominal)" value={fmtPct(nominalRate)} />
          <Row label="Zinssatz (effektiv)" value={fmtPct(effectiveRate)} />
          <Row label="Zinsen p.a." value={fmt(summary.yearlyInterest)} />
          <Row label="Tilgung p.a." value={fmt(summary.yearlyRepayment)} />
          <Row label="Rate p.a." value={fmt(yearlyRate)} separator />
          <Row label="Rate / Monat" value={fmt(monthlyRate)} bold />
          <Row label="Tilgungssatz" value={fmtPct(result.inputs.repaymentRate)} />
        </div>
      </CardContent>
    </Card>
  );
}
