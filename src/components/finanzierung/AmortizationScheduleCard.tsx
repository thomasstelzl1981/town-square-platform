/**
 * AmortizationScheduleCard — Year-by-year amortization table with PDF export.
 */
import { useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown } from 'lucide-react';
import { usePdfExport } from '@/components/pdf';
import type { CalcData } from './FinanceCalculatorCard';

interface Props {
  calcData: CalcData;
}

interface AmortRow {
  year: number;
  balanceStart: number;
  interest: number;
  principal: number;
  annuity: number;
  balanceEnd: number;
}

const fmt = (v: number) =>
  v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AmortizationScheduleCard({ calcData }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { exportToPdf, isExporting } = usePdfExport();

  const rows = useMemo(() => {
    const { loanAmount, interestRate, monthlyRate } = calcData;
    if (!loanAmount || !interestRate || !monthlyRate) return [];

    const monthlyInterest = interestRate / 100 / 12;
    const result: AmortRow[] = [];
    let balance = loanAmount;
    const maxYears = 40;

    for (let year = 1; year <= maxYears && balance > 0.01; year++) {
      const balanceStart = balance;
      let yearInterest = 0;
      let yearPrincipal = 0;

      for (let m = 0; m < 12 && balance > 0.01; m++) {
        const interest = balance * monthlyInterest;
        const payment = Math.min(monthlyRate, balance + interest);
        const principal = payment - interest;
        yearInterest += interest;
        yearPrincipal += principal;
        balance -= principal;
        if (balance < 0) balance = 0;
      }

      result.push({
        year,
        balanceStart,
        interest: yearInterest,
        principal: yearPrincipal,
        annuity: yearInterest + yearPrincipal,
        balanceEnd: Math.max(0, balance),
      });
    }

    return result;
  }, [calcData]);

  const handleExportPdf = () => {
    exportToPdf(contentRef as React.RefObject<HTMLElement>, {
      title: 'Überschlägiges Finanzierungsangebot',
      subtitle: `Darlehensbetrag: ${fmt(calcData.loanAmount)} EUR · Zinssatz: ${fmt(calcData.interestRate)}% · Tilgung: ${fmt(calcData.repaymentRate)}%`,
      module: 'Finanzierungsmanager',
      filename: `tilgungsplan-${fmt(calcData.loanAmount).replace(/\./g, '')}`,
    });
  };

  if (!rows.length) return null;

  // Totals
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0);

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold uppercase tracking-wide">Zins- und Tilgungsplan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Voraussichtlicher Verlauf bis zur Volltilgung ({rows.length} Jahre)
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExportPdf} disabled={isExporting}>
            <FileDown className="h-3.5 w-3.5" /> Als PDF exportieren
          </Button>
        </div>

        <div ref={contentRef} className="overflow-x-auto">
          {/* Summary block for PDF */}
          <div className="px-5 py-3 border-b grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Darlehensbetrag</span>
              <div className="font-semibold">{fmt(calcData.loanAmount)} EUR</div>
            </div>
            <div>
              <span className="text-muted-foreground">Zinssatz</span>
              <div className="font-semibold">{fmt(calcData.interestRate)} % p.a.</div>
            </div>
            <div>
              <span className="text-muted-foreground">Tilgung</span>
              <div className="font-semibold">{fmt(calcData.repaymentRate)} % p.a.</div>
            </div>
            <div>
              <span className="text-muted-foreground">Monatsrate</span>
              <div className="font-semibold">{fmt(calcData.monthlyRate)} EUR</div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-[60px]">Jahr</TableHead>
                <TableHead className="text-xs text-right">Restschuld Anfang</TableHead>
                <TableHead className="text-xs text-right">Zinsen</TableHead>
                <TableHead className="text-xs text-right">Tilgung</TableHead>
                <TableHead className="text-xs text-right">Annuität</TableHead>
                <TableHead className="text-xs text-right">Restschuld Ende</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.year} className={r.year === calcData.termYears ? 'bg-primary/5 font-medium' : ''}>
                  <TableCell className="text-xs py-1.5">{r.year}</TableCell>
                  <TableCell className="text-xs text-right py-1.5">{fmt(r.balanceStart)}</TableCell>
                  <TableCell className="text-xs text-right py-1.5">{fmt(r.interest)}</TableCell>
                  <TableCell className="text-xs text-right py-1.5">{fmt(r.principal)}</TableCell>
                  <TableCell className="text-xs text-right py-1.5">{fmt(r.annuity)}</TableCell>
                  <TableCell className="text-xs text-right py-1.5">{fmt(r.balanceEnd)}</TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell className="text-xs py-1.5">Σ</TableCell>
                <TableCell className="text-xs text-right py-1.5">—</TableCell>
                <TableCell className="text-xs text-right py-1.5">{fmt(totalInterest)}</TableCell>
                <TableCell className="text-xs text-right py-1.5">{fmt(totalPrincipal)}</TableCell>
                <TableCell className="text-xs text-right py-1.5">{fmt(totalInterest + totalPrincipal)}</TableCell>
                <TableCell className="text-xs text-right py-1.5">0,00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
