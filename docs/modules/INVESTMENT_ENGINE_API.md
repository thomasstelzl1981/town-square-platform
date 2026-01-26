# Memory: logic/investment-engine-production-v1

## Status: LIVE ✅

The `sot-investment-engine` Edge Function is now deployed and operational.

## API Endpoint
- **Path**: `/sot-investment-engine`
- **Method**: POST
- **Auth**: None required (verify_jwt = false)

## Request Schema
```typescript
{
  purchasePrice: number;        // Kaufpreis
  monthlyRent: number;          // Monatliche Kaltmiete
  equity: number;               // Eigenkapital
  termYears: 5|10|15|20|25|30;  // Zinsbindung
  repaymentRate: number;        // Tilgung (1-5%)
  taxableIncome: number;        // zvE (zu versteuerndes Einkommen)
  maritalStatus: 'single'|'married';  // Grund-/Splittingtarif
  hasChurchTax: boolean;
  churchTaxState?: string;      // BY, BW = 8%, Rest = 9%
  afaModel: 'linear'|'7i'|'7h'|'7b';
  buildingShare: number;        // 0-1 (Gebäudeanteil)
  managementCostMonthly: number;
  valueGrowthRate: number;      // % p.a.
  rentGrowthRate: number;       // % p.a.
}
```

## Response Schema
```typescript
{
  summary: {
    monthlyBurden: number;      // KERNWERT (negativ = Überschuss)
    totalInvestment: number;
    loanAmount: number;
    ltv: number;
    interestRate: number;
    yearlyRent: number;
    yearlyInterest: number;
    yearlyRepayment: number;
    yearlyAfa: number;
    yearlyTaxSavings: number;
    roiBeforeTax: number;
    roiAfterTax: number;
  };
  projection: YearlyData[];     // 40-Jahres-Projektion
  inputs: CalculationInput;
}
```

## Database Tables (Zone 1 Master Data)
- `interest_rates`: LTV/Term matrix (5-30 years, 60-100% LTV)
- `tax_parameters`: AfA rates, costs, tax thresholds
- `church_tax_rates`: By Bundesland (8%/9%)

## Integration Points
- **Zone 1**: Admin → Master-Vorlagen (CRUD)
- **Zone 2**: MOD-08 Investments, MOD-09 Vertriebspartner
- **Zone 3**: Kaufy /beratung page

## Hook
```typescript
import { useInvestmentEngine } from '@/hooks/useInvestmentEngine';
const { calculate, result, isLoading, error } = useInvestmentEngine();
```
