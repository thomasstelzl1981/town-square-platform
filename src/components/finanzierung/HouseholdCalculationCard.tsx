/**
 * HouseholdCalculationCard — Simulates monthly income/expenses after financing
 * 
 * Structure mirrors the Selbstauskunft grid-table layout (Label | Value).
 * All fields are always visible and editable. The "Berechnen" button populates from data.
 * Owner-occupied: rent disabled/0, utility fiction applied.
 * Investment: rental income + tax benefit added.
 */
import * as React from 'react';
import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Calculator, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { ApplicantFormData } from './ApplicantPersonFields';
import type { CalcData } from './FinanceCalculatorCard';

interface HouseholdCalculationCardProps {
  formData: ApplicantFormData;
  coFormData?: ApplicantFormData;
  calcData: CalcData | null;
  usage: string;
  rentalIncome: number;
  livingArea: number;
}

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

const inputCls = "h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-1 px-1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]";

/** Data row: Label | editable value */
function TR({ label, children, highlight, disabled }: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
  disabled?: boolean;
}) {
  return (
    <TableRow className={highlight ? 'bg-muted/15' : ''}>
      <TableCell className="w-[180px] border-r py-1.5 px-3 text-xs text-muted-foreground font-medium whitespace-nowrap">
        {label}
      </TableCell>
      <TableCell className="py-1.5 px-3">{children}</TableCell>
    </TableRow>
  );
}

/** Section header spanning full width */
function SectionHeaderRow({ title, variant }: { title: string; variant?: 'default' | 'financing' }) {
  const bg = variant === 'financing'
    ? 'bg-blue-50/50 dark:bg-blue-950/20'
    : 'bg-muted/40';
  return (
    <TableRow>
      <TableCell colSpan={2} className={`${bg} text-xs font-semibold uppercase tracking-wide py-1.5 px-3`}>
        {title}
      </TableCell>
    </TableRow>
  );
}

/** Sum row */
function SumRow({ label, value, variant }: { label: string; value: number; variant?: 'income' | 'expense' | 'result' }) {
  const color = variant === 'expense'
    ? 'text-destructive'
    : variant === 'result'
      ? (value >= 0 ? 'text-green-600' : 'text-destructive')
      : 'text-foreground';
  return (
    <TableRow className="bg-muted/30 font-medium">
      <TableCell className="w-[180px] border-r py-1.5 px-3 text-xs font-semibold">{label}</TableCell>
      <TableCell className={`py-1.5 px-3 text-sm font-bold ${color}`}>{eurFormat.format(value)}</TableCell>
    </TableRow>
  );
}

interface HHState {
  netIncome: number;
  selfEmployedIncome: number;
  sideJobIncome: number;
  existingRentalIncome: number;
  childBenefit: number;
  alimonyIncome: number;
  otherIncome: number;
  newRentalIncome: number;
  taxBenefit: number;
  livingExpenses: number;
  currentRent: number;
  healthInsurance: number;
  childSupport: number;
  carLeasing: number;
  otherFixedCosts: number;
  newLoanRate: number;
  utilityFiction: number;
}

const EMPTY_STATE: HHState = {
  netIncome: 0, selfEmployedIncome: 0, sideJobIncome: 0,
  existingRentalIncome: 0, childBenefit: 0, alimonyIncome: 0, otherIncome: 0,
  newRentalIncome: 0, taxBenefit: 0,
  livingExpenses: 0, currentRent: 0, healthInsurance: 0,
  childSupport: 0, carLeasing: 0, otherFixedCosts: 0,
  newLoanRate: 0, utilityFiction: 0,
};

export default function HouseholdCalculationCard({
  formData, coFormData, calcData, usage, rentalIncome, livingArea
}: HouseholdCalculationCardProps) {
  const [state, setState] = useState<HHState>({ ...EMPTY_STATE });

  const isOwnerOccupied = usage === 'eigennutzung';
  const isInvestment = usage === 'vermietung';

  const set = useCallback((field: keyof HHState, value: number) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCalculate = useCallback(() => {
    const sum = (a: number | null | undefined, b: number | null | undefined) => (a || 0) + (b || 0);
    const co = coFormData;

    const annualInterest = calcData ? (calcData.loanAmount * calcData.interestRate / 100) : 0;
    const estimatedTaxBenefit = isInvestment ? Math.round((annualInterest * 0.42) / 12) : 0;
    const utilityFictionValue = isOwnerOccupied ? Math.round(livingArea * 3) : 0;

    setState({
      netIncome: sum(formData.net_income_monthly, co?.net_income_monthly),
      selfEmployedIncome: sum(formData.self_employed_income_monthly, co?.self_employed_income_monthly),
      sideJobIncome: sum(formData.side_job_income_monthly, co?.side_job_income_monthly),
      existingRentalIncome: sum(formData.rental_income_monthly, co?.rental_income_monthly),
      childBenefit: sum(formData.child_benefit_monthly, co?.child_benefit_monthly),
      alimonyIncome: sum(formData.alimony_income_monthly, co?.alimony_income_monthly),
      otherIncome: sum(formData.other_regular_income_monthly, co?.other_regular_income_monthly),
      newRentalIncome: isInvestment ? rentalIncome : 0,
      taxBenefit: estimatedTaxBenefit,
      livingExpenses: sum(formData.living_expenses_monthly, co?.living_expenses_monthly),
      currentRent: isOwnerOccupied ? 0 : sum(formData.current_rent_monthly, co?.current_rent_monthly),
      healthInsurance: sum(formData.health_insurance_monthly, co?.health_insurance_monthly),
      childSupport: sum(formData.child_support_amount_monthly, co?.child_support_amount_monthly),
      carLeasing: sum(formData.car_leasing_monthly, co?.car_leasing_monthly),
      otherFixedCosts: sum(formData.other_fixed_costs_monthly, co?.other_fixed_costs_monthly),
      newLoanRate: calcData?.monthlyRate || 0,
      utilityFiction: utilityFictionValue,
    });
  }, [formData, coFormData, calcData, usage, rentalIncome, livingArea, isOwnerOccupied, isInvestment]);

  // Computed totals
  const totalIncome =
    state.netIncome + state.selfEmployedIncome + state.sideJobIncome +
    state.existingRentalIncome + state.childBenefit + state.alimonyIncome +
    state.otherIncome + state.newRentalIncome + state.taxBenefit;

  const totalExpenses =
    state.livingExpenses + state.currentRent + state.healthInsurance +
    state.childSupport + state.carLeasing + state.otherFixedCosts +
    state.newLoanRate + state.utilityFiction;

  const disposable = totalIncome - totalExpenses;

  const numInput = (field: keyof HHState, disabled?: boolean) => (
    <Input
      type="number"
      value={state[field] || ''}
      onChange={e => set(field, parseFloat(e.target.value) || 0)}
      className={inputCls}
      disabled={disabled}
    />
  );

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

        {/* Single vertical table — Selbstauskunft style */}
        <Table>
          <TableBody>
            {/* === INCOME === */}
            <SectionHeaderRow title="Monatliche Einnahmen" />
            <TR label="Nettoeinkommen">{numInput('netIncome')}</TR>
            <TR label="Aus selbstst. Tätigkeit">{numInput('selfEmployedIncome')}</TR>
            <TR label="Nebentätigkeit">{numInput('sideJobIncome')}</TR>
            <TR label="Mieteinnahmen (bestehend)">{numInput('existingRentalIncome')}</TR>
            <TR label="Kindergeld">{numInput('childBenefit')}</TR>
            <TR label="Unterhaltseinnahmen">{numInput('alimonyIncome')}</TR>
            <TR label="Sonstiges">{numInput('otherIncome')}</TR>

            {/* New financing income */}
            <SectionHeaderRow title="Neue Finanzierung — Einnahmen" variant="financing" />
            <TR label="Mieteinnahmen (neu)" highlight>{numInput('newRentalIncome')}</TR>
            <TR label="Steuervorteil (Kapitalanlage)" highlight>{numInput('taxBenefit')}</TR>

            <SumRow label="Summe Einnahmen" value={totalIncome} variant="income" />

            {/* === EXPENSES === */}
            <SectionHeaderRow title="Monatliche Ausgaben" />
            <TR label="Lebenshaltungskosten">{numInput('livingExpenses')}</TR>
            <TR label="Aktuelle Warmmiete">{numInput('currentRent', isOwnerOccupied)}</TR>
            <TR label="Priv. Krankenversicherung">{numInput('healthInsurance')}</TR>
            <TR label="Unterhaltsverpflichtungen">{numInput('childSupport')}</TR>
            <TR label="Leasing (Kfz)">{numInput('carLeasing')}</TR>
            <TR label="Sonstige Fixkosten">{numInput('otherFixedCosts')}</TR>

            {/* New financing expenses */}
            <SectionHeaderRow title="Neue Finanzierung — Ausgaben" variant="financing" />
            <TR label="Neue Darlehensrate" highlight>{numInput('newLoanRate')}</TR>
            <TR label="Nebenkosten (3 €/qm)" highlight>{numInput('utilityFiction')}</TR>

            <SumRow label="Summe Ausgaben" value={totalExpenses} variant="expense" />

            {/* === RESULT === */}
            <SectionHeaderRow title="Ergebnis" />
            <SumRow label="Verfügbares Einkommen" value={disposable} variant="result" />
            <TableRow className="bg-muted/30">
              <TableCell className="w-[180px] border-r py-1.5 px-3 text-xs font-semibold">Kapitaldienstfähigkeit</TableCell>
              <TableCell className="py-1.5 px-3 text-sm font-bold flex items-center gap-2">
                {disposable >= 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Tragfähig</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">Nicht tragfähig</span>
                  </>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Info + Button */}
        <div className="px-5 py-3 border-t flex items-center gap-3 flex-wrap">
          <Button onClick={handleCalculate} variant="outline" size="sm" className="gap-2 text-xs">
            <Calculator className="h-3.5 w-3.5" /> Haushaltsrechnung berechnen
          </Button>
          {isOwnerOccupied && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Bei Eigennutzung entfällt die Warmmiete. Nebenkosten: 3 €/qm/Monat.
            </p>
          )}
          {isInvestment && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Steuervorteil geschätzt mit 42% Grenzsteuersatz.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
