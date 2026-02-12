/**
 * HouseholdCalculationCard — Simulates monthly income/expenses after financing
 * 
 * All fields are editable (except computed sums).
 * For owner-occupied: rent & utilities set to 0 in the "new financing" section,
 * replaced by utility fiction (3€/sqm) and loan rate.
 * For investment: adds rental income + tax benefit as income, loan rate as expense.
 */
import * as React from 'react';
import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table';
import { Calculator, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { ApplicantFormData } from './ApplicantPersonFields';
import type { CalcData } from './FinanceCalculatorCard';

interface HouseholdCalculationCardProps {
  formData: ApplicantFormData;
  coFormData?: ApplicantFormData;
  calcData: CalcData | null;
  usage: string;          // "eigennutzung" | "vermietung" | ""
  rentalIncome: number;   // new rental income from Eckdaten
  livingArea: number;     // sqm for utility fiction
}

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const inputCls = "h-7 text-xs border-0 bg-transparent shadow-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]";

function TR({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <TableRow className={highlight ? 'bg-muted/30' : ''}>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[200px] border-r whitespace-nowrap">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{children}</TableCell>
    </TableRow>
  );
}

function TRSum({ label, value, variant }: { label: string; value: number; variant?: 'income' | 'expense' | 'result' }) {
  const color = variant === 'expense' ? 'text-destructive' : variant === 'result' ? (value >= 0 ? 'text-green-600' : 'text-destructive') : 'text-primary';
  return (
    <TableRow className="bg-muted/30 font-medium">
      <TableCell className="w-[200px] border-r py-1.5 px-3 text-xs font-semibold">{label}</TableCell>
      <TableCell className={`py-1.5 px-3 text-sm font-bold ${color}`}>{eurFormat.format(value)}</TableCell>
    </TableRow>
  );
}

function SectionRow({ title }: { title: string }) {
  return (
    <TableRow>
      <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">
        {title}
      </TableCell>
    </TableRow>
  );
}

interface CalcState {
  // Income overrides
  netIncome: number;
  selfEmployedIncome: number;
  sideJobIncome: number;
  existingRentalIncome: number;
  childBenefit: number;
  alimonyIncome: number;
  otherIncome: number;
  // New financing income
  newRentalIncome: number;
  taxBenefit: number;
  // Expense overrides
  livingExpenses: number;
  currentRent: number;
  healthInsurance: number;
  childSupport: number;
  carLeasing: number;
  otherFixedCosts: number;
  // New financing expenses
  newLoanRate: number;
  utilityFiction: number;
}

export default function HouseholdCalculationCard({
  formData, coFormData, calcData, usage, rentalIncome, livingArea
}: HouseholdCalculationCardProps) {
  const [calculated, setCalculated] = useState(false);
  const [state, setState] = useState<CalcState | null>(null);

  const isOwnerOccupied = usage === 'eigennutzung';
  const isInvestment = usage === 'vermietung';

  const set = useCallback((field: keyof CalcState, value: number) => {
    setState(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleCalculate = useCallback(() => {
    const sum = (a: number | null, b: number | null) => (a || 0) + (b || 0);
    const co = coFormData;

    // Estimate tax benefit for investment: simplified as (interest * marginal tax rate)
    // Use 42% as default marginal rate if not specified
    const annualInterest = calcData ? (calcData.loanAmount * calcData.interestRate / 100) : 0;
    const estimatedTaxBenefit = isInvestment ? Math.round((annualInterest * 0.42) / 12) : 0;

    const utilityFictionValue = isOwnerOccupied ? Math.round(livingArea * 3) : 0;

    setState({
      netIncome: sum(formData.net_income_monthly, co?.net_income_monthly ?? null),
      selfEmployedIncome: sum(formData.self_employed_income_monthly, co?.self_employed_income_monthly ?? null),
      sideJobIncome: sum(formData.side_job_income_monthly, co?.side_job_income_monthly ?? null),
      existingRentalIncome: sum(formData.rental_income_monthly, co?.rental_income_monthly ?? null),
      childBenefit: sum(formData.child_benefit_monthly, co?.child_benefit_monthly ?? null),
      alimonyIncome: sum(formData.alimony_income_monthly, co?.alimony_income_monthly ?? null),
      otherIncome: sum(formData.other_regular_income_monthly, co?.other_regular_income_monthly ?? null),
      newRentalIncome: isInvestment ? rentalIncome : 0,
      taxBenefit: estimatedTaxBenefit,
      livingExpenses: sum(formData.living_expenses_monthly, co?.living_expenses_monthly ?? null),
      currentRent: isOwnerOccupied ? 0 : sum(formData.current_rent_monthly, co?.current_rent_monthly ?? null),
      healthInsurance: sum(formData.health_insurance_monthly, co?.health_insurance_monthly ?? null),
      childSupport: sum(formData.child_support_amount_monthly, co?.child_support_amount_monthly ?? null),
      carLeasing: sum(formData.car_leasing_monthly, co?.car_leasing_monthly ?? null),
      otherFixedCosts: sum(formData.other_fixed_costs_monthly, co?.other_fixed_costs_monthly ?? null),
      newLoanRate: calcData?.monthlyRate || 0,
      utilityFiction: utilityFictionValue,
    });
    setCalculated(true);
  }, [formData, coFormData, calcData, usage, rentalIncome, livingArea, isOwnerOccupied, isInvestment]);

  // Computed totals
  const totalIncome = state ? (
    state.netIncome + state.selfEmployedIncome + state.sideJobIncome +
    state.existingRentalIncome + state.childBenefit + state.alimonyIncome +
    state.otherIncome + state.newRentalIncome + state.taxBenefit
  ) : 0;

  const totalExpenses = state ? (
    state.livingExpenses + state.currentRent + state.healthInsurance +
    state.childSupport + state.carLeasing + state.otherFixedCosts +
    state.newLoanRate + state.utilityFiction
  ) : 0;

  const disposable = totalIncome - totalExpenses;

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 py-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-base font-semibold uppercase tracking-wide">
              Haushaltsrechnung inkl. Finanzierungsobjekt
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Simulation der monatlichen Einnahmen und Ausgaben nach Abschluss der neuen Finanzierung
          </p>
        </div>

        {!calculated ? (
          /* Empty state */
          <div className="p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Klicken Sie auf den Button, um die Haushaltsrechnung auf Basis der Selbstauskunft und der Finanzierungsdaten zu berechnen.
            </p>
            <Button onClick={handleCalculate} className="gap-2">
              <Calculator className="h-4 w-4" /> Haushaltsrechnung berechnen
            </Button>
          </div>
        ) : state && (
          <>
            {/* Two-column grid: Income | Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
              {/* LEFT: Income */}
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead colSpan={2} className="text-xs font-semibold uppercase bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                        Monatliche Einnahmen
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SectionRow title="Bestehende Einnahmen" />
                    <TR label="Nettoeinkommen">
                      <Input type="number" value={state.netIncome || ''} onChange={e => set('netIncome', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Aus selbstst. Tätigkeit">
                      <Input type="number" value={state.selfEmployedIncome || ''} onChange={e => set('selfEmployedIncome', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Nebentätigkeit">
                      <Input type="number" value={state.sideJobIncome || ''} onChange={e => set('sideJobIncome', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Mieteinnahmen (bestehend)">
                      <Input type="number" value={state.existingRentalIncome || ''} onChange={e => set('existingRentalIncome', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Kindergeld">
                      <Input type="number" value={state.childBenefit || ''} onChange={e => set('childBenefit', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Unterhaltseinnahmen">
                      <Input type="number" value={state.alimonyIncome || ''} onChange={e => set('alimonyIncome', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Sonstiges">
                      <Input type="number" value={state.otherIncome || ''} onChange={e => set('otherIncome', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>

                    <SectionRow title="Neue Finanzierung — Einnahmen" />
                    <TR label="Mieteinnahmen (neu)" highlight={isInvestment}>
                      <Input type="number" value={state.newRentalIncome || ''} onChange={e => set('newRentalIncome', parseFloat(e.target.value) || 0)} className={inputCls} disabled={isOwnerOccupied} />
                    </TR>
                    <TR label="Steuervorteil (Kapitalanlage)" highlight={isInvestment}>
                      <Input type="number" value={state.taxBenefit || ''} onChange={e => set('taxBenefit', parseFloat(e.target.value) || 0)} className={inputCls} disabled={isOwnerOccupied} />
                    </TR>

                    <TRSum label="Summe Einnahmen" value={totalIncome} variant="income" />
                  </TableBody>
                </Table>
              </div>

              {/* RIGHT: Expenses */}
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead colSpan={2} className="text-xs font-semibold uppercase bg-red-50 dark:bg-red-950/30 text-destructive">
                        Monatliche Ausgaben
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SectionRow title="Bestehende Ausgaben" />
                    <TR label="Lebenshaltungskosten">
                      <Input type="number" value={state.livingExpenses || ''} onChange={e => set('livingExpenses', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Aktuelle Warmmiete">
                      <Input type="number" value={state.currentRent || ''} onChange={e => set('currentRent', parseFloat(e.target.value) || 0)} className={inputCls} disabled={isOwnerOccupied} />
                    </TR>
                    <TR label="Private Krankenversicherung">
                      <Input type="number" value={state.healthInsurance || ''} onChange={e => set('healthInsurance', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Unterhaltsverpflichtungen">
                      <Input type="number" value={state.childSupport || ''} onChange={e => set('childSupport', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Leasing (Kfz)">
                      <Input type="number" value={state.carLeasing || ''} onChange={e => set('carLeasing', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label="Sonstige Fixkosten">
                      <Input type="number" value={state.otherFixedCosts || ''} onChange={e => set('otherFixedCosts', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>

                    <SectionRow title="Neue Finanzierung — Ausgaben" />
                    <TR label="Neue Darlehensrate">
                      <Input type="number" value={state.newLoanRate || ''} onChange={e => set('newLoanRate', parseFloat(e.target.value) || 0)} className={inputCls} />
                    </TR>
                    <TR label={`Nebenkosten (${isOwnerOccupied ? '3 €/qm Fiktion' : 'entfällt'})`} highlight={isOwnerOccupied}>
                      <Input type="number" value={state.utilityFiction || ''} onChange={e => set('utilityFiction', parseFloat(e.target.value) || 0)} className={inputCls} disabled={!isOwnerOccupied} />
                    </TR>

                    <TRSum label="Summe Ausgaben" value={totalExpenses} variant="expense" />
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Result bar */}
            <div className="px-5 py-4 border-t bg-muted/10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {disposable >= 0 ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive shrink-0" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Verfügbares Einkommen</p>
                    <p className={`text-xl font-bold ${disposable >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {eurFormat.format(disposable)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Kapitaldienstfähigkeit</p>
                  <p className={`text-lg font-bold ${disposable >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {disposable >= 0 ? 'Tragfähig' : 'Nicht tragfähig'}
                  </p>
                </div>
              </div>
              {isOwnerOccupied && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Bei Eigennutzung entfällt die bisherige Warmmiete. Nebenkosten werden mit 3 €/qm/Monat angesetzt.
                </p>
              )}
              {isInvestment && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Steuervorteil geschätzt mit 42% Grenzsteuersatz auf die jährlichen Darlehenszinsen.
                </p>
              )}
            </div>

            {/* Recalculate button */}
            <div className="px-5 py-3 border-t flex gap-3">
              <Button variant="outline" size="sm" onClick={handleCalculate} className="gap-2 text-xs">
                <Calculator className="h-3.5 w-3.5" /> Neu berechnen
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}