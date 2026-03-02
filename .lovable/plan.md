

# Steuereffekt bei gewerblichen Anbietern entfernen + NK-Input

## Analyse

### Problem 1: Steuereffekt bei Gesellschaften
Die `sot-investment-engine` Edge Function berechnet **immer** einen persoenlichen Einkommensteuer-Vorteil (ESt-Vergleich zvE mit/ohne Immobilie). Das ist korrekt fuer **Privatpersonen** (Anlage V), aber **falsch fuer gewerbliche Anbieter** (GmbH, KG, etc.). Bei einer Kapitalgesellschaft gibt es keinen persoenlichen Steuervorteil, der die Liquiditaet des Investors verbessert — die Gesellschaft zahlt Koerperschaftsteuer + Gewerbesteuer unabhaengig vom Privatvermoegen des Eigentuemers.

**Aktueller Fehler:** `yearlyTaxSavings` wird **immer** berechnet und in `monthlyBurden` eingerechnet (Z. 178: `monthlyBurden = -yearlyCashFlowAfterTax / 12`). Das verfaelscht die Liquiditaetsberechnung fuer gewerbliche Kontexte.

### Problem 2: Steuersatz-Aenderungen wirken nicht
Der Tax-Rate-Slider existiert in der UI, aber die Engine nutzt den **BMF-Formel-basierten** Steuersatz (aus `taxableIncome` berechnet), nicht einen manuell gesetzten Steuersatz. Es gibt keinen `taxRate`-Input in der Engine — Aenderungen am Steuersatz im Kontext werden ignoriert.

### Problem 3: Nicht umlagefaehige NK ohne Eingabe
Die Engine hat `managementCostMonthly` (Default: 25€/Mo = 300€/Jahr) — **hardcoded** in `Haushaltsrechnung.tsx` (Z. 112, 121, 301). Es gibt **keinen Slider und kein Eingabefeld** dafuer im `InvestmentSliderPanel`. Der Wert wird auch nicht aus den Property-Daten geladen.

## Plan

### 1. Engine erweitern: `isCommercial` Flag

**Datei:** `supabase/functions/sot-investment-engine/index.ts`
- Neuen Input-Parameter `isCommercial: boolean` (Default: `false`)
- Wenn `isCommercial === true`:
  - `yearlyTaxSavings = 0` (keine persoenliche Steuerersparnis)
  - `monthlyBurden` basiert nur auf `yearlyCashFlowBeforeTax`
  - `roiAfterTax = roiBeforeTax` (kein Steuereffekt)
  - In der Projektion: `taxSavings = 0` fuer jedes Jahr

### 2. Hook-Interface erweitern

**Datei:** `src/hooks/useInvestmentEngine.ts`
- `CalculationInput` um `isCommercial?: boolean` erweitern

### 3. Haushaltsrechnung: Steuer-Sektion bedingt ausblenden

**Datei:** `src/components/investment/Haushaltsrechnung.tsx`
- Pruefen ob `result.inputs.isCommercial === true`
- Wenn ja: Steuerersparnis-Zeilen, "Steuereffekt"-Sektion, und "nach Steuervorteil"-Texte ausblenden
- Im Ledger-Variant: Steuerersparnis aus Einnahmen-Spalte entfernen, Summe anpassen
- Ergebnis-Text: "Monatlicher Eigenanteil" statt "Monatlicher Eigenanteil nach Steuervorteil"

### 4. SliderPanel: Steuer-Inputs bedingt ausblenden + NK-Slider hinzufuegen

**Datei:** `src/components/investment/InvestmentSliderPanel.tsx`
- Wenn `isCommercial === true`: zvE-Slider, Kirchensteuer-Switch, Veranlagung-Buttons, AfA-Modell, Gebaeudeanteil **ausblenden** (irrelevant fuer gewerblich)
- **Neuer Slider:** "Nicht umlagefaehige NK" mit Range 0–500€/Mo, Step 5€, Default 25€ — mapped auf `managementCostMonthly`

### 5. Haushaltsrechnung: Hardcoded 300€ durch Engine-Wert ersetzen

**Datei:** `src/components/investment/Haushaltsrechnung.tsx`
- Z. 112, 121, 301: `300` ersetzen durch `year1?.managementCost || (summary.yearlyRent > 0 ? result.inputs.managementCostMonthly * 12 : 300)`

### 6. Kontext-Integration (Erkennung ob gewerblich)

Die Aufrufer (`InvestmentExposeView`, diverse Expose-Pages) muessen das `isCommercial`-Flag setzen. Fuer das **Portfolio** (MOD-04) kann das aus dem `landlord_context.context_type === 'BUSINESS'` abgeleitet werden. Fuer Projekte (MOD-13) aus dem Developer-Context. Default bleibt `false` (Privat).

## Betroffene Dateien

| # | Datei | Aenderung |
|---|-------|-----------|
| 1 | `supabase/functions/sot-investment-engine/index.ts` | `isCommercial` Flag, Steuer-Bypass |
| 2 | `src/hooks/useInvestmentEngine.ts` | `isCommercial` in `CalculationInput` |
| 3 | `src/components/investment/Haushaltsrechnung.tsx` | Steuer-Sektion bedingt, hardcoded 300€ weg |
| 4 | `src/components/investment/InvestmentSliderPanel.tsx` | Steuer-Inputs bedingt, NK-Slider neu |
| 5 | `src/components/investment/InvestmentExposeView.tsx` | `isCommercial` Prop durchreichen |

