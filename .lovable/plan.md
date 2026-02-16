

# Finanzbericht-Korrekturen: 6 Punkte

## 1. Krankenversicherung im Finanzbericht aufnehmen

Die KV-Daten liegen nur clientseitig vor (DEMO_KV_CONTRACTS in `src/engines/demoData/data.ts`). Nur die private KV (PKV) von Max (685 EUR/mtl.) ist ausgabenrelevant — Lisas GKV wird komplett vom Arbeitgeber getragen, die Kinder sind familienversichert.

**Aenderungen:**
- `useFinanzberichtData.ts`: KV-Daten aus `getDemoKVContracts()` importieren und in Ausgaben integrieren (nur PKV-Beitraege ohne AG-Anteil)
- Neues Feld `healthInsurance` in `FinanzberichtExpenses` (685 EUR/mtl.)
- Neues Return-Feld `kvContracts` fuer die Auflistung im Bericht
- `FinanzberichtSection.tsx`: Neue Sektion "Krankenversicherung" mit Uebersicht aller Haushaltsmitglieder (Typ, Versicherer, Beitrag, AG-Anteil)
- In Ausgaben-Sektion: neue Zeile "Krankenversicherung (PKV)" mit 685 EUR

## 2. Portfolio-Darlehen: Bank und Darlehenssumme ergaenzen

Die `loans`-Tabelle hat `bank_name` und `original_amount`, aber der Hook selektiert diese Felder nicht.

**Aenderungen:**
- `useFinanzberichtData.ts` Zeile 271: Query erweitern um `bank_name, original_amount`
- Zeile 432-439: `bank` von `'—'` auf `l.bank_name` und `loanAmount` von `0` auf `l.original_amount` aendern

Aktuelle Demo-Daten (bereits korrekt in DB):
- BER-01: Sparkasse Berlin, 252.000 EUR
- MUC-01: HypoVereinsbank, 378.000 EUR
- HH-01: Hamburger Sparkasse, 157.500 EUR

## 3. Steuereffekt Kapitalanlage als Einnahme

Kapitalanlage-Immobilien erzeugen typischerweise steuerliche Verluste (AfA, Zinsen uebersteigen Einnahmen), die das zu versteuernde Einkommen senken. Der monatliche Steuereffekt muss als Einnahme dargestellt werden.

**Aenderungen:**
- `FinanzberichtIncome`: Neues Feld `taxBenefitRental`
- Berechnung: Vereinfachte Schaetzung basierend auf Portfolio-Daten:
  - Jaehrliche AfA (2% auf Gebaeudewert, ~80% des Kaufpreises)
  - Jaehrliche Zinsen (aus loans)
  - Jaehrliche Mieteinnahmen (aus portfolioSummary)
  - Steuerlicher Verlust = Mieteinnahmen - Zinsen - AfA - Verwaltung
  - Steuereffekt = Verlust * angenommener Grenzsteuersatz (42%)
- In Einnahmen-Sektion: neue Zeile "Steuereffekt Kapitalanlage"

## 4. Lebenshaltungskosten: 35% der Arbeitseinkommen

Aktuell wird `living_expenses_monthly` aus `applicant_profiles` gelesen (2.200 EUR). Stattdessen soll der Wert als 35% der Arbeitseinkommen (Netto + Selbststaendig, ohne V+V und PV) berechnet werden.

**Aenderungen:**
- `useFinanzberichtData.ts`: `livingExpenses` nicht aus DB, sondern berechnen:
  ```
  livingExpenses = (netIncomeTotal + selfEmployedIncome) * 0.35
  ```
  - Max: 8.500 EUR + Lisa: 3.200 EUR = 11.700 EUR * 0.35 = 4.095 EUR/mtl.

## 5. Vorsorge-Sparplaene nach Investment verschieben

Aktuell werden Vorsorge-Vertraege mit "spar" im Typ als `savingsContracts` gefuehrt. Der "Privater ETF-Sparplan" (300 EUR/mtl.) gehoert aber in die Investment-Sektion.

**Aenderungen:**
- `useFinanzberichtData.ts`: Filter-Logik aendern — Vertraege mit Typ "ETF-Sparplan" oder "Sparplan" als `investmentContracts` separieren (neues Return-Feld)
- Reine Sparvertraege (z.B. Bausparvertrag) bleiben bei `savingsContracts`
- `FinanzberichtSection.tsx`: Neue Sektion "Investment" mit Icon `TrendingUp` fuer ETF-Sparplaene
- Ausgaben-Aufteilung: "Sparvertraege" und "Investment" getrennt anzeigen

## 6. Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useFinanzberichtData.ts` | KV-Import, loans Query erweitern (bank_name, original_amount), Steuereffekt berechnen, Lebenshaltungskosten-Formel, Investment-Vertraege separieren |
| `src/components/finanzanalyse/FinanzberichtSection.tsx` | Neue Sektionen: Krankenversicherung, Investment; Ausgaben um KV erweitern; Steuereffekt-Zeile |

## 7. Technische Details

### KV-Integration
```text
import { getDemoKVContracts } from '@/engines/demoData';

kvContracts = getDemoKVContracts()
pkvExpense = sum of (monthlyPremium - employerContribution) where type === 'PKV'
// Max: 685 - 0 = 685 EUR
// Lisa: GKV mit 100% AG-Anteil → 0 EUR
```

### Steuereffekt-Berechnung
```text
totalPurchasePrice = sum(portfolioProperties.purchase_price)
buildingValue = totalPurchasePrice * 0.80
annualAfA = buildingValue * 0.02
annualInterest = portfolioSummary.annualInterest
annualRent = portfolioSummary.annualIncome
taxLoss = annualRent - annualInterest - annualAfA
taxBenefit = taxLoss < 0 ? abs(taxLoss) * 0.42 / 12 : 0
```

### Loans Query Fix
```text
// Vorher:
.select('id, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent, property_id')
// Nachher:
.select('id, bank_name, original_amount, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent, property_id')
```

### Lebenshaltungskosten
```text
// Vorher: aus applicant_profiles.living_expenses_monthly
// Nachher: berechnet
livingExpenses = (netIncomeTotal + selfEmployedIncome) * 0.35
// = (3200 + 8500) * 0.35 = 4095 EUR
```

