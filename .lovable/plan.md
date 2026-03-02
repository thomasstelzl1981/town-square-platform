

# Plan: Steuereffekt fuer gewerbliche Vermieter in MOD-04 entfernen

## Analyse (korrigiert)

Der vorherige Plan bezog sich auf `InvestmentExposeView` (die Geldmaschine fuer Kaeufer in MOD-08/09/13/Zone3). **MOD-04 nutzt diese Komponente nicht.** MOD-04 hat zwei eigene Berechnungsstellen:

1. **`PortfolioSummaryModal`** (`src/components/portfolio/PortfolioSummaryModal.tsx`)
   - Zeigt "Steuervorteil" als Einnahme-Zeile (Z. 378)
   - Berechnet AfA-basierte Steuerersparnis mit `marginalTaxRate` (Z. 203-209)
   - Default `marginalTaxRate = 0.42` (42%) — **immer aktiv, auch bei gewerblichen Kontexten**
   - Steuervorteil fliesst in "Monatliches Ergebnis" ein → verfaelscht die Liquiditaet

2. **`InventoryInvestmentSimulation`** (`src/components/immobilienakte/InventoryInvestmentSimulation.tsx`)
   - Hat `marginalTaxRate` im Interface, **nutzt ihn aber nicht** in der Projektion
   - Kein Steuervorteil in der Berechnung → hier besteht kein Fehler

**Aufrufer:** `PortfolioTab.tsx` (Z. 1417-1422) uebergibt den Kontext-Namen, aber **nicht den `context_type`**. Die Information ob PRIVATE oder BUSINESS ist in `contexts` verfuegbar (Z. 64: `context_type: string`).

## Betroffene Dateien (nur 2)

| # | Datei | Aenderung |
|---|-------|-----------|
| 1 | `src/components/portfolio/PortfolioSummaryModal.tsx` | `isCommercial` Prop, Steuer-Berechnung + UI bedingt |
| 2 | `src/pages/portal/immobilien/PortfolioTab.tsx` | `isCommercial` aus `selectedContext.context_type` ableiten und uebergeben |

## Umsetzung

### Schritt 1: PortfolioSummaryModal — `isCommercial` Prop

- Neues Prop: `isCommercial?: boolean` (Default: `false`)
- Wenn `isCommercial === true`:
  - `monthlyTaxBenefit = 0` (Zeile 207-209 skippen)
  - `totalIncome = monthlyRent` (ohne Steuervorteil)
  - UI: Zeile "Steuervorteil" ausblenden (Z. 378)
  - UI: Badge "Steuersatz: XX%" ausblenden (Z. 363-365)
  - `marginalTaxRate` wird ignoriert
- Wenn `isCommercial === false`: Alles bleibt wie bisher (Privatperson)

### Schritt 2: PortfolioTab — Context-Typ durchreichen

- In der Aufrufstelle (Z. 1417-1422):
  - `selectedContext` ist bereits verfuegbar (Z. 744)
  - `isCommercial={selectedContext?.context_type === 'BUSINESS'}` uebergeben

### Nicht betroffen

- `InvestmentExposeView` / `Haushaltsrechnung` / `InvestmentSliderPanel` — das sind Kaeufer-Ansichten (MOD-08/09/13/Zone3), hier bleibt die Steuerberechnung korrekt bestehen
- `InventoryInvestmentSimulation` — nutzt keinen Steuervorteil, kein Change noetig

