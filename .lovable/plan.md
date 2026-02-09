
# Konsolidierter Gesamtplan: Finanzierungskachel, Query-Fixes und Zinsbindung

## Uebersicht

Drei Arbeitspakete in einer zusammenhaengenden Implementierung:

| Paket | Beschreibung | Dateien |
|-------|-------------|---------|
| A | Default Zinsbindung auf 10 Jahre + Dropdown im SliderPanel | 2 |
| B | Query-Fixes: `units_count` aus DB statt hardcoded | 5 |
| C | Neue Komponente `FinanzierungSummary` + Integration | 6 |

Gesamt: **1 neue Datei**, **12 editierte Dateien**, **0 Migrationen**, **0 Edge-Function-Aenderungen**

---

## Paket A: Zinsbindung-Korrektur

### A1 -- Default von 15 auf 10 Jahre
**Datei:** `src/hooks/useInvestmentEngine.ts`

Zeile 60: `termYears: 15` wird zu `termYears: 10`

Wirkt sich automatisch auf alle Stellen aus, die `defaultInput` verwenden (MOD-08, MOD-09, Zone 3).

### A2 -- Zinsbindung-Dropdown im SliderPanel
**Datei:** `src/components/investment/InvestmentSliderPanel.tsx`

Neues Select-Dropdown "Zinsbindung" mit Optionen 5, 10, 15, 20, 25, 30 Jahre. Position: zwischen Eigenkapital-Slider und Tilgungsrate-Slider. Nutzt die bestehende `update('termYears', value)` Logik.

```text
Label: "Zinsbindung"          Wert: [10 Jahre v]
Optionen: 5 | 10 | 15 | 20 | 25 | 30
```

---

## Paket B: Query-Fixes (units_count)

### Problem
`units_count` ist in 5 Dateien auf `1` hardcoded. Die tatsaechliche Anzahl muss per COUNT auf die `units`-Tabelle ermittelt werden.

### Loesung
Nach dem bestehenden Listing-Query wird ein Subquery eingefuegt:

```typescript
const { count: unitsCount } = await supabase
  .from('units')
  .select('id', { count: 'exact', head: true })
  .eq('property_id', property.id);

// Fallback auf 1 bei NULL/0
units_count: (unitsCount && unitsCount > 0) ? unitsCount : 1
```

### Betroffene Dateien

| # | Datei | Kontext |
|---|-------|---------|
| B1 | `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx` | Zone 3 Expose |
| B2 | `src/pages/portal/investments/InvestmentExposePage.tsx` | MOD-08 Expose |
| B3 | `src/pages/portal/vertriebspartner/PartnerExposePage.tsx` | MOD-09 Expose |
| B4 | `src/pages/portal/investments/SucheTab.tsx` | MOD-08 Suchliste |
| B5 | `src/pages/portal/vertriebspartner/BeratungTab.tsx` | MOD-09 Beratungsliste |

Fuer B4/B5 (Listen): Property-IDs werden gebuendelt und per `.in('property_id', ids)` mit Gruppierung abgefragt.

---

## Paket C: Neue Komponente "FinanzierungSummary"

### C1 -- Komponente erstellen
**Neue Datei:** `src/components/investment/FinanzierungSummary.tsx`

Props:
```typescript
interface FinanzierungSummaryProps {
  purchasePrice: number;
  equity: number;
  result: CalculationResult;
  transferTaxRate?: number;  // Default 6.5%
  notaryRate?: number;       // Default 2.0%
  className?: string;
}
```

**Sektion 1 -- Kaufpreisaufschluesselung:**

```text
Kaufpreis                    250.000 EUR
+ Grunderwerbsteuer (6,5%)    16.250 EUR
+ Notar & Grundbuch (2,0%)     5.000 EUR
----------------------------------------------
= Gesamtinvestition           271.250 EUR
- Eigenkapital                 50.000 EUR
----------------------------------------------
= Finanzierungsbedarf         221.250 EUR
```

**Sektion 2 -- Darlehen:**

```text
Darlehensbetrag              221.250 EUR
Zinssatz (nominal)              3,80%
Zinssatz (effektiv)             3,95%
Zinsen p.a.                    8.408 EUR
Tilgung p.a.                   4.425 EUR
Rate p.a.                     12.833 EUR
Rate / Monat                   1.069 EUR
Tilgungssatz                    2,00%
```

Effektiver Zinssatz: Naeherungsformel `nominal * (1 + nominal / 200)`.

### C2 -- Export registrieren
**Datei:** `src/components/investment/index.ts`

Neue Zeile: `export { FinanzierungSummary } from './FinanzierungSummary';`

### C3 -- Integration in Expose-Seiten
Platzierung: zwischen `Haushaltsrechnung` und `DetailTable40Jahre`.

| # | Datei |
|---|-------|
| C3a | `src/components/investment/InvestmentExposeView.tsx` |
| C3b | `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx` |
| C3c | `src/pages/portal/investments/InvestmentExposePage.tsx` |
| C3d | `src/pages/portal/vertriebspartner/PartnerExposePage.tsx` |

Pattern (identisch ueberall):
```tsx
{calcResult && (
  <FinanzierungSummary
    purchasePrice={listing.asking_price}
    equity={params.equity}
    result={calcResult}
  />
)}
```

---

## Implementierungsreihenfolge

1. **Paket A** zuerst (2 Dateien) -- setzt den korrekten Default, bevor die Engine aufgerufen wird
2. **Paket C1-C2** (neue Komponente + Export) -- muss existieren, bevor sie integriert wird
3. **Paket B + C3** parallel (Query-Fixes und Komponenten-Integration in denselben Dateien)

---

## Risikobewertung

| Aspekt | Risiko | Begruendung |
|--------|--------|-------------|
| Investment Engine | Keins | Keine Aenderung an Edge Function oder Berechnungslogik |
| MasterGraph / Haushaltsrechnung | Keins | Bestehende Komponenten bleiben unangetastet |
| MOD-04 Portfolio | Keins | Verwendet eigene Simulation, nicht betroffen |
| Datenintegritaet | Minimal | units_count-Fallback auf 1 sichert Abwaertskompatibilitaet |
| Rendering | Minimal | FinanzierungSummary rendert nur bei vorhandenem calcResult |
