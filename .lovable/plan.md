

# Analyse-Ergebnis: Gutachter funktioniert noch NICHT

## Status

Der `case_id`-Fix aus der letzten Runde ist korrekt implementiert — der 400-Fehler "case_id required" ist behoben. **ABER**: Es gibt einen zweiten, tieferen Contract-Drift, der die UI nach einem erfolgreichen `get`-Call zum Crash bringen wird.

## Was jetzt passiert (nach dem bisherigen Fix)

```text
preflight → 200 ✓
run       → 200, case_id vorhanden ✓
get       → 200, case_id im Request ✓  (BEHOBEN)
UI render → CRASH ✗  (NEU — bisher verdeckt)
```

Der Mapper in `useValuationCase.ts` (Zeilen 202-227) gibt die JSON-Werte aus der DB **unverändert** an die UI weiter. Aber die Edge Function speichert intern **komplett andere Feldnamen und Strukturen** als die UI-Typen erwarten.

## Exakter Drift (DB-Objekte vs UI-Typen)

### 1. `valueBand` — wird crashen auf Zeile 95 + 132 in ValuationReportReader

| DB (Edge Function speichert) | UI erwartet (ValueBand aus spec.ts) |
|---|---|
| `confidence: 85` (Zahl 0-100) | `confidence: 'high'` (String) + `confidenceScore: 0.85` (Zahl 0-1) |
| `weighting: [...]` | `weightingTable: WeightingEntry[]` |
| kein `reasoning` | `reasoning: string` |

UI-Crash: `valueBand.confidenceScore` → `undefined.toFixed()` → TypeError
UI-Crash: `valueBand.weightingTable.map()` → `undefined.map()` → TypeError

### 2. `financing` Szenarien — snake_case intern

| DB | UI (FinancingScenario) |
|---|---|
| `loan_amount` | `loanAmount` |
| `interest_rate` | `interestRate` |
| `monthly_rate` | `monthlyRate` |
| `traffic_light` | `trafficLight` |
| `cashflow_after_debt` | `cashflowAfterDebt` |

### 3. `stressTests` — andere Felder

| DB | UI (StressTestResult) |
|---|---|
| `scenario` | `label` |
| `monthly_rate` | `monthlyRate` |
| `cashflow` | `cashflowAfterDebt` |
| kein `trafficLight` | `trafficLight: TrafficLight` |
| kein `annualDebtService` | `annualDebtService: number` |

### 4. `lienProxy` — komplett andere Struktur

| DB | UI (LienProxy) |
|---|---|
| `lien_value` (eine Zahl) | `lienValueLow` + `lienValueHigh` |
| `ltv_window: { safe, max }` | `safeLtvWindow: [number, number]` |
| `risk_drivers: string[]` | `riskDrivers: LienProxyRiskDriver[]` |

### 5. `dataQuality` — andere Felder

| DB | UI (DataQuality) |
|---|---|
| `completeness` | `completenessPercent` |
| `critical_gaps: string[]` | `criticalGaps: number` |
| `belegt` | `fieldsVerified` |
| `missing` | `fieldsMissing` |
| `global_confidence: number` | `globalConfidence: ConfidenceLevel` + `globalConfidenceScore: number` |

### 6. `methods` — nur `confidence` Format

| DB | UI (ValuationMethodResult) |
|---|---|
| `confidence: 0.7` (Zahl 0-1) | `confidence: ConfidenceLevel` ('high'/'medium'/'low') + `confidenceScore: number` |
| `params` keys snake_case | `params` (wird direkt durchgereicht — ok) |
| kein `notes` | `notes: string[]` |

## Fix-Plan

### Einzige Datei: `src/hooks/useValuationCase.ts` (nicht frozen)

Der bestehende Mapper (Zeilen 202-227) muss durch einen vollständigen Transform ersetzt werden, der die DB-Strukturen auf die exakten TypeScript-Interfaces aus `src/engines/valuation/spec.ts` mappt.

Konkret:

1. **valueBand**: `confidence` (Zahl) → `confidenceLevel` String ableiten + `confidenceScore` normalisieren. `weighting` → `weightingTable` umbenennen. `reasoning` mit Default füllen.

2. **methods[]**: `confidence` (Zahl) → `ConfidenceLevel` String. `notes` Default `[]`.

3. **financing[]**: Alle 7 snake_case-Felder → camelCase.

4. **stressTests[]**: `scenario` → `label`, `monthly_rate` → `monthlyRate`, `cashflow` → `cashflowAfterDebt`, `trafficLight` ableiten aus DSCR.

5. **lienProxy**: Struktur komplett umbauen (eine Zahl → Low/High mit ±5% Spread, `ltv_window` → Tuple, `risk_drivers` → `LienProxyRiskDriver[]`).

6. **debtService**: `break_even_rent` → `breakEvenRentMonthly`, `is_viable` → `isViable`.

7. **dataQuality**: `completeness` → `completenessPercent`, `critical_gaps.length` → `criticalGaps`, `belegt` → `fieldsVerified`, `global_confidence` → Score + Level.

### Kein Edge Function Change nötig (INFRA frozen)
### Kein MOD-04 Component Change nötig (MOD-04 frozen)

Der gesamte Fix liegt im Hook-Mapper — eine Datei, keine DB-Migration.

