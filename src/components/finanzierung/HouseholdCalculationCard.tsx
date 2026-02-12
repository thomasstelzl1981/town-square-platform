/**
 * HouseholdCalculationCard — T-Konto Layout
 * 
 * Side-by-side: Income (left) | Expenses (right) like a bookkeeping T-account.
 * All fields always visible and editable. "Berechnen" populates from data.
 */
import * as React from 'react';
import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

const inputCls = "h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-1 px-1 text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]";

/** Single row: label + input */
function Row({ label, children, highlight, className }: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-[1fr_100px] items-center border-b px-3 py-1 text-xs ${highlight ? 'bg-muted/15' : ''} ${className || ''}`}>
      <span className="text-muted-foreground font-medium truncate">{label}</span>
      <div>{children}</div>
    </div>
  );
}

/** Section header */
function SectionHeader({ title, variant }: { title: string; variant?: 'default' | 'financing' }) {
  const bg = variant === 'financing'
    ? 'bg-blue-50/50 dark:bg-blue-950/20'
    : 'bg-muted/40';
  return (
    <div className={`${bg} text-xs font-semibold uppercase tracking-wide py-1.5 px-3 border-b`}>
      {title}
    </div>
  );
}

/** Sum row */
function SumLine({ label, value, variant }: { label: string; value: number; variant?: 'income' | 'expense' }) {
  const color = variant === 'expense' ? 'text-destructive' : 'text-foreground';
  return (
    <div className="grid grid-cols-[1fr_auto] items-center bg-muted/30 px-3 py-1.5 border-b">
      <span className="text-xs font-semibold">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{eurFormat.format(value)}</span>
    </div>
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

        {/* T-Konto: two columns side by side */}
        <div className="grid grid-cols-2">
          {/* === LEFT: INCOME === */}
          <div className="border-r">
            <SectionHeader title="Monatliche Einnahmen" />
            <Row label="Nettoeinkommen">{numInput('netIncome')}</Row>
            <Row label="Aus selbstst. Tätigkeit">{numInput('selfEmployedIncome')}</Row>
            <Row label="Nebentätigkeit">{numInput('sideJobIncome')}</Row>
            <Row label="Mieteinnahmen (bestehend)">{numInput('existingRentalIncome')}</Row>
            <Row label="Kindergeld">{numInput('childBenefit')}</Row>
            <Row label="Unterhaltseinnahmen">{numInput('alimonyIncome')}</Row>
            <Row label="Sonstiges">{numInput('otherIncome')}</Row>

            {/* Spacer to align with expenses side */}
            <div className="border-b py-1 px-3 invisible">
              <span className="text-xs">&nbsp;</span>
            </div>

            <SectionHeader title="Neue Finanzierung" variant="financing" />
            <Row label="Mieteinnahmen (neu)" highlight>{numInput('newRentalIncome')}</Row>
            <Row label="Steuervorteil (KA)" highlight>{numInput('taxBenefit')}</Row>

            <SumLine label="Summe Einnahmen" value={totalIncome} variant="income" />
          </div>

          {/* === RIGHT: EXPENSES === */}
          <div>
            <SectionHeader title="Monatliche Ausgaben" />
            <Row label="Lebenshaltungskosten">{numInput('livingExpenses')}</Row>
            <Row label="Aktuelle Warmmiete">{numInput('currentRent', isOwnerOccupied)}</Row>
            <Row label="Priv. Krankenversicherung">{numInput('healthInsurance')}</Row>
            <Row label="Unterhaltsverpflichtungen">{numInput('childSupport')}</Row>
            <Row label="Leasing (Kfz)">{numInput('carLeasing')}</Row>
            <Row label="Sonstige Fixkosten">{numInput('otherFixedCosts')}</Row>

            {/* Empty row: expenses has 6 rows, income has 7 — pad 1 */}
            <div className="border-b py-1 px-3 invisible">
              <span className="text-xs">&nbsp;</span>
            </div>

            <SectionHeader title="Neue Finanzierung" variant="financing" />
            <Row label="Neue Darlehensrate" highlight>{numInput('newLoanRate')}</Row>
            <Row label="Nebenkosten (3 €/qm)" highlight>{numInput('utilityFiction')}</Row>

            <SumLine label="Summe Ausgaben" value={totalExpenses} variant="expense" />
          </div>
        </div>

        {/* Result block — full width */}
        <div className="border-t">
          <SectionHeader title="Ergebnis" />
          <div className="grid grid-cols-2 bg-muted/30 border-b">
            <div className="grid grid-cols-[1fr_auto] items-center px-3 py-1.5 border-r">
              <span className="text-xs font-semibold">Verfügbares Einkommen</span>
              <span className={`text-sm font-bold ${disposable >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {eurFormat.format(disposable)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="text-xs font-semibold">Kapitaldienstfähigkeit</span>
              <span className="ml-auto flex items-center gap-1.5">
                {disposable >= 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-bold text-green-600">Tragfähig</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-bold text-destructive">Nicht tragfähig</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

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
