/**
 * FinanceCalculatorCard — Annuity calculator with live interest rate lookup.
 * Sits beside FinanceRequestCard in MOD-11 (2-column layout).
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Calculator, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  finanzierungsbedarf: number;
  purchasePrice: number;
  /** Called when user clicks "Eckdaten in Antrag übernehmen" */
  onTransferToApplication?: () => void;
}

function TR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[160px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{children}</TableCell>
    </TableRow>
  );
}

function TRComputed({ label, value }: { label: string; value: string }) {
  return (
    <TableRow className="bg-muted/30">
      <TableCell className="text-xs font-semibold py-1.5 px-3 w-[160px] border-r">{label}</TableCell>
      <TableCell className="text-sm font-semibold py-1.5 px-3">{value}</TableCell>
    </TableRow>
  );
}

const inputCls = "h-7 text-xs border-0 bg-transparent shadow-none";
const fmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FinanceCalculatorCard({ finanzierungsbedarf, purchasePrice, onTransferToApplication }: Props) {
  const [termYears, setTermYears] = useState('10');
  const [repaymentRate, setRepaymentRate] = useState('1.5');

  // Calculate LTV and round up to nearest 10 for lookup
  const rawLTV = useMemo(() => {
    if (!purchasePrice || purchasePrice <= 0) return 0;
    return (finanzierungsbedarf / purchasePrice) * 100;
  }, [finanzierungsbedarf, purchasePrice]);

  const ltvForLookup = useMemo(() => {
    const rounded = Math.ceil(rawLTV / 10) * 10;
    return Math.min(Math.max(rounded, 60), 100);
  }, [rawLTV]);

  // Load interest rate from DB
  const { data: rateData } = useQuery({
    queryKey: ['interest_rate', termYears, ltvForLookup],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interest_rates')
        .select('interest_rate')
        .eq('term_years', Number(termYears))
        .eq('ltv_percent', ltvForLookup)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: finanzierungsbedarf > 0 && purchasePrice > 0,
  });

  const interestRate = rateData?.interest_rate ? Number(rateData.interest_rate) : 0;
  const repayment = Number(repaymentRate) || 0;
  const loan = finanzierungsbedarf;

  // Annuity calculation
  const monthlyRate = useMemo(() => {
    if (!loan || !interestRate) return 0;
    return (loan * (interestRate + repayment)) / 100 / 12;
  }, [loan, interestRate, repayment]);

  const yearlyRate = monthlyRate * 12;

  // Remaining debt after fixed-rate period (annuity formula)
  const remainingDebt = useMemo(() => {
    if (!loan || !interestRate || !repayment) return 0;
    const monthlyInterest = interestRate / 100 / 12;
    const totalMonthlyRate = monthlyRate;
    const months = Number(termYears) * 12;
    // Standard annuity remaining balance formula
    let balance = loan;
    for (let i = 0; i < months; i++) {
      const interest = balance * monthlyInterest;
      const principal = totalMonthlyRate - interest;
      balance -= principal;
      if (balance <= 0) return 0;
    }
    return Math.max(0, balance);
  }, [loan, interestRate, monthlyRate, termYears, repayment]);

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-2.5 border-b bg-muted/20">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Finanzierungskalkulator
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Konditionen und Ratenberechnung
          </p>
        </div>

        <Table>
          <TableBody>
            <TR label="Darlehensbetrag (€)">
              <span className="text-xs">{loan > 0 ? `${fmt(loan)} €` : '—'}</span>
            </TR>
            <TR label="Beleihungsauslauf">
              <span className="text-xs">
                {rawLTV > 0 ? `${fmt(rawLTV)} %` : '—'}
                {rawLTV > 0 && <span className="text-muted-foreground ml-1">(Lookup: {ltvForLookup}%)</span>}
              </span>
            </TR>
            <TR label="Zinsbindung">
              <Select value={termYears} onValueChange={setTermYears}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25, 30].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y} Jahre</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TR>
            <TR label="Zinssatz p.a.">
              <span className="text-xs">{interestRate > 0 ? `${fmt(interestRate)} %` : '—'}</span>
            </TR>
            <TR label="Tilgung p.a. (%)">
              <Input
                value={repaymentRate}
                onChange={e => setRepaymentRate(e.target.value)}
                type="number"
                step="0.1"
                placeholder="1.5"
                className={inputCls}
              />
            </TR>
          </TableBody>
        </Table>

        <div className="border-t" />

        <Table>
          <TableBody>
            <TRComputed label="Monatsrate" value={monthlyRate > 0 ? `${fmt(monthlyRate)} €` : '—'} />
            <TRComputed label="Jahresrate" value={yearlyRate > 0 ? `${fmt(yearlyRate)} €` : '—'} />
            <TRComputed
              label={`Restschuld (${termYears} J.)`}
              value={remainingDebt > 0 ? `${fmt(remainingDebt)} €` : loan > 0 && interestRate > 0 ? '0,00 €' : '—'}
            />
          </TableBody>
        </Table>

        {onTransferToApplication && (
          <div className="px-4 py-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={onTransferToApplication}
            >
              <ArrowDown className="h-3.5 w-3.5" /> Eckdaten in Antrag übernehmen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
