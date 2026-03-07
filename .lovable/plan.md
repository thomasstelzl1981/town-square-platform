

# Homogenisierung Bestand & Aufteiler — Unified Card Layout

## Problem

Die beiden Tabs haben komplett unterschiedliche UI-Patterns:
- **Bestand**: Slider-Grid in einer grossen Card → separate KPI-Cards → Charts → Summary-Cards (6 verschiedene Card-Typen)
- **Aufteiler**: Nummerierte Sektions-Cards mit inline EditField/ComputedField/SubtotalRow (kompaktes Tabellenformat)

Das fuehrt zu einer inkonsistenten Bedienung und verhindert, dass der Nutzer die beiden Szenarien visuell vergleichen kann.

## Design-Entscheidung

Der **Aufteiler-Stil** (nummerierte Cards, inline-editierbare Felder, Zwischensummen) wird zum Standard. Er ist kompakter, uebersichtlicher und professioneller. Die Bestand-Berechnung wird auf dasselbe Pattern umgebaut.

## Neue einheitliche Struktur (beide Tabs)

```text
┌─────────────────────────────────────────────────┐
│ 1  GRUNDERWERBSKOSTEN                           │  IDENTISCH
│    Kaufpreis                    [editierbar]     │
│    Erwerbsnebenkosten (X.X%)   [berechnet]      │
│    ─── Summe Grunderwerb ───                     │
├─────────────────────────────────────────────────┤
│ 2  SANIERUNG / MODERNISIERUNG                   │  IDENTISCH
│    Sanierung / Renovierung     [editierbar]  €  │
│    Teilung / WEG (nur Aufteiler) [editierbar]   │
│    Baunebenkosten              [editierbar]  %  │
│    ─── Summe Bau/NK ───           │  €/m²       │
├─────────────────────────────────────────────────┤
│ 3  FINANZIERUNG                                 │  GLEICHE CARD
│    Eigenkapitalquote           [Slider %]       │
│    Eigenkapital                [berechnet]      │
│    Fremdkapital                [berechnet]      │
│    ──────────────────────                       │
│    Zinssatz p.a.               [Input %]        │
│    Tilgung p.a. (nur Bestand)  [Input %]        │
│    Haltedauer (nur Aufteiler)  [Slider Monate]  │
│    ──────────────────────                       │
│    Zinsen                      [berechnet]      │
│    Disagio (nur Aufteiler)     [editierbar]     │
│    - Mieteinnahmen             [berechnet, grün]│
│    ─── Summe Finanzierung ───                   │
├─────────────────────────────────────────────────┤
│ === GESAMTINVESTITION ===     €X.XXX  │  €/m²   │  IDENTISCH
├─────────────────────────────────────────────────┤
│ 4  KALKULATION                                  │  TAB-SPEZIFISCH
│                                                 │
│  BESTAND:                    AUFTEILER:          │
│  ┌─ Bewirtschaftung ──────┐ ┌─ Exit / Erlöse ─┐│
│  │ Verwaltung    [Slider] │ │ Zielrendite [Sl] ││
│  │ Instandhaltung[Slider] │ │ → Verkauf  [ber] ││
│  │ Mietsteigerung[Slider] │ │ − Provision[ber] ││
│  │ Wertsteigerung[Slider] │ │ + Garagen  [ed]  ││
│  │ Annuität p.a. [ber]    │ │ + Mieterlöse[ber]││
│  │ Rate mtl.     [ber]    │ │─── Gesamterlös──-││
│  │ NOI p.a.      [ber]    │ └──────────────────┘│
│  │ Cashflow mtl. [ber]    │ + Bauherrenaufgaben │
│  │ Cash-on-Cash  [ber]    │   PM       [editb.] │
│  └────────────────────────┘   Marketing [editb.] │
│                               Provision [Slider] │
├─────────────────────────────────────────────────┤
│ === ERGEBNIS ===                                │  GLEICHE CARD
│  BESTAND:                  AUFTEILER:            │
│  Bruttorendite │ Cashflow  Gewinn │ Marge │ ROI  │
│  Cash-on-Cash  │ ROI EK                         │
├─────────────────────────────────────────────────┤
│ 5  PROJEKTION / MATRIX                          │  TAB-SPEZIFISCH
│  BESTAND:                  AUFTEILER:            │
│  Tilgungsplan (Chart)      Alternativenmatrix    │
│  Vermögensentwicklung      (3x3 Tabelle)        │
│  (Chart)                                         │
└─────────────────────────────────────────────────┘
```

## Shared Components (extrahiert)

Drei wiederverwendbare Sub-Komponenten werden aus `AufteilerCalculation` extrahiert und in eine gemeinsame Datei verschoben:

| Komponente | Zweck |
|---|---|
| `EditField` | Inline editierbares Zahlenfeld (Label links, Input rechts) |
| `ComputedField` | Read-only berechneter Wert (grau) |
| `SubtotalRow` | Zwischensummen-Zeile mit Separator und optionalem €/m² |
| `SectionCard` | Nummerierte Card-Hulle (Nummer-Badge + Titel + Farbe) |

Neue Datei: `src/pages/portal/akquise-manager/components/CalcShared.tsx`

## Bestand-spezifische Aenderungen

1. **Sanierungskosten NEU**: Bestand erhaelt dieselbe Sanierungs-Card wie Aufteiler (Sanierung, Baunebenkosten). Die Engine `calcBestandFull` muss um `renovationCosts` und `constructionAncillaryPercent` erweitert werden — diese erhoehen das `totalInvestment`.

2. **Finanzierung unified**: Statt Slider-Grid → gleiche inline-Darstellung wie Aufteiler. Bestand hat zusaetzlich `Tilgung p.a.` und `Annuität`; Aufteiler hat stattdessen `Haltedauer` und `Disagio`.

3. **Charts bleiben**: Die 30-Jahres-Charts (Tilgungsplan, Vermögensentwicklung) bleiben als Sektion 5 erhalten — sie sind der Bestand-spezifische Output (analog zur Alternativenmatrix beim Aufteiler).

4. **Schnellanalyse entfaellt**: Die separate "Schnellanalyse"-Card am Anfang wird entfernt. Die KPIs (Gesamtinvestition, EK-Bedarf, Bruttorendite) sind bereits in den Sektionen 1-3 und im Ergebnis-Block enthalten.

## Engine-Erweiterung (spec.ts + engine.ts)

`BestandFullParams` erhaelt:
- `renovationCosts` (default 0)
- `constructionAncillaryPercent` (default 15)
- `areaSqm` (fuer €/m²-Anzeige)

`BestandFullResult` erhaelt:
- `totalConstructionCosts`
- `costPerSqm`
- `noiMonthly` (bisher inline berechnet in der Komponente → in Engine verschieben)
- `monthlyExpenses` (Zinsen + Tilgung + Verwaltung + Instandhaltung)
- `monthlyCashflow`
- `cashOnCash`

Die monatliche Wirtschaftlichkeits-Berechnung (aktuell als IIFE inline im JSX!) wird in die Engine verschoben — ENGINE GOVERNANCE konform.

## Betroffene Dateien

| Datei | Aktion |
|---|---|
| `src/pages/portal/akquise-manager/components/CalcShared.tsx` | NEU — Shared UI-Primitives |
| `src/pages/portal/akquise-manager/components/BestandCalculation.tsx` | Komplett-Umbau auf Card-Sektionen |
| `src/pages/portal/akquise-manager/components/AufteilerCalculation.tsx` | Refactor auf CalcShared-Imports |
| `src/engines/akquiseCalc/spec.ts` | BestandFullParams/Result erweitern |
| `src/engines/akquiseCalc/engine.ts` | Cashflow-Logik aus UI in Engine |
| `src/pages/portal/akquise-manager/components/index.ts` | CalcShared exportieren |

Keine Freeze-Konflikte (MOD-12 unfrozen, ENG-AKQUISE unfrozen).

