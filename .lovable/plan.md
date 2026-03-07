

# MOD-12 Aufteilerkalkulation Ausbau + Bewertungs-Tab

## Ausgangslage

Die aktuelle `AufteilerCalculation` zeigt Stellschrauben (Slider/Inputs), dann drei Cards (Kosten, Erlöse, Ergebnis) und eine Sensitivitätsanalyse. Was fehlt:

1. **Sanierung/Ausbau/Teilungskosten** — detaillierte Kostenaufstellung statt nur "Projektkosten"
2. **Finanzierungsrechnung** — Zinskosten über die Haltedauer, EK/FK-Split, Disagio, laufende Mieteinnahmen vs. Kapitaldienst
3. **Alternativenmatrix** — Sensitivität über zwei Achsen (Baukosten ± / Verkaufspreis ±)
4. **Bewertung als eigener Tab** — Dritter Tab neben Bestand/Aufteiler mit SoT Valuation Engine

## Plan in 4 Phasen

### Phase 1 — Engine-Erweiterung (spec.ts + engine.ts)

`AufteilerFullParams` erweitern um granulare Kostenstruktur (statt nur `projectCosts`):

```text
+ renovationCosts        (Sanierung)
+ partitioningCosts      (Teilungskosten / WEG-Teilung)
+ constructionAncillary  (Baunebenkosten %)
+ marketingCosts         (Marketing/PR)
+ projectManagementCosts (Projektsteuerung)
+ disagio                (Bankgebühr pauschal)
```

`AufteilerFullResult` erweitern um:

```text
+ financingBreakdown: {
    loanAmountAcquisition   (FK auf Erwerb)
    loanAmountConstruction  (FK auf Bau)
    interestAcquisition     (Zinsen Erwerb)
    interestConstruction    (Zinsen Bau)
    disagio
    totalFinancingCosts
  }
+ totalProjectCosts        (Summe aller Bau-/NK)
+ totalInvestmentGross     (Erwerb + Bau + Finanzierung - Miete)
+ costPerSqm               (Gesamtkosten / m²)
+ alternativenMatrix       (3x3: Baukosten ±10% × Verkauf ±10%)
```

Bestehende `projectCosts`-Logik bleibt rückwärtskompatibel (wird als Fallback genutzt falls granulare Felder = 0).

### Phase 2 — UI-Redesign AufteilerCalculation.tsx

Statt der aktuellen 3 Cards → **5 inline-editierbare Sektionen**, orientiert am PDF-Referenzbeispiel:

```text
┌──────────────────────────────────────────────┐
│ 1. GRUNDERWERBSKOSTEN                        │
│    Kaufpreis              [editierbar]        │
│    Erwerbsnebenkosten     [aus Ankaufskosten] │
│    ─── Summe Grunderwerb ───                  │
├──────────────────────────────────────────────┤
│ 2. BAU-/SANIERUNGSKOSTEN                      │
│    Sanierung              [editierbar]  €/m²  │
│    Baunebenkosten         [editierbar]  €/m²  │
│    Teilung/WEG            [editierbar]  paus. │
│    ─── Summe Bau/NK ───                       │
├──────────────────────────────────────────────┤
│ 3. BAUHERRENAUFGABEN                          │
│    Projektmanagement      [editierbar]        │
│    Marketing/PR           [editierbar]        │
│    Vertriebsprovision     [Slider %]          │
│    ─── Summe Bauherren ───                    │
├──────────────────────────────────────────────┤
│ 4. FINANZIERUNG                               │
│    EK-Quote               [Slider %]          │
│    Zinssatz                [editierbar]        │
│    Laufzeit               [Slider Monate]     │
│    Zinsen Grunderwerb     [berechnet]         │
│    Zinsen Baukosten       [berechnet]         │
│    Disagio                [editierbar]        │
│    − Mieteinnahmen        [berechnet, grün]   │
│    ─── Summe Finanzierung ───                 │
├──────────────────────────────────────────────┤
│ ═══ GESAMTINVESTITION ═══  €X.XXX  │  €/m²   │
├──────────────────────────────────────────────┤
│ 5. EXIT / ERLÖSE                              │
│    Zielrendite Käufer     [Slider]            │
│    → Verkauf Wohnungen    [berechnet]         │
│    Garagen/Stellplätze    [editierbar, opt.]  │
│    Mieterlöse Haltedauer  [berechnet]         │
│    ─── Gesamterlös ───                        │
├──────────────────────────────────────────────┤
│ ═══ ERGEBNIS ═══                              │
│    Gewinn │ Gewinnmarge │ ROI auf EK          │
│    Nettogewinn (nach 25% KöSt optional)       │
├──────────────────────────────────────────────┤
│ 6. ALTERNATIVENMATRIX (3×3)                   │
│    Baukosten ±10% × Verkaufspreis ±10%        │
│    Jede Zelle: Gewinn + Marge                 │
└──────────────────────────────────────────────┘
```

Alle Felder sind inline sichtbar (keine Collapsibles). Editierbare Felder haben Input-Styling, berechnete Felder sind grau/read-only. Zwischensummen sind visuell hervorgehoben.

### Phase 3 — Bewertungs-Tab

Dritter Tab in der Kalkulations-Sektion:

```text
TabsList: [Bestand (Hold)] [Aufteiler (Flip)] [Bewertung]
```

Der Bewertungs-Tab zeigt:
- Dieselben Kopfdaten (KPIs, Basisdaten) wie der obere Bereich — kein Scrollen nötig
- Den bestehenden `ValuationPipeline` / `ValuationReportReader` Workflow
- Start-Button für SoT Valuation Engine (wie bisher in Sektion 3)

Die bisherige Sektion 3 "SoT Bewertung" wird dadurch ersetzt — stattdessen steht der Bewertungs-Tab direkt neben den Kalkulationen.

### Phase 4 — Feinschliff & Test

- Responsive Layout (Mobile: 1-Spalte statt 2-Spalte bei der Matrix)
- Rückwärtskompatibilität: bestehende gespeicherte `calc_aufteiler`-Daten laden korrekt
- `areaSqm` aus Offer-Daten durchreichen für €/m²-Anzeige
- E2E-Prüfung des Flows

## Technische Details

- **Freeze-Status**: MOD-12 = unfrozen, ENG-AKQUISE = unfrozen — alle Änderungen erlaubt
- **Betroffene Dateien**:
  - `src/engines/akquiseCalc/spec.ts` — erweiterte Typen
  - `src/engines/akquiseCalc/engine.ts` — erweiterte Berechnung + Alternativenmatrix
  - `src/pages/portal/akquise-manager/components/AufteilerCalculation.tsx` — kompletter UI-Umbau
  - `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` — Tab-Struktur (3 Tabs), Sektion 3 verschlanken
- **Zone**: Zone 2, keine Cross-Zone-Verletzung
- **Engine-Governance**: Alle Business-Logik bleibt in engine.ts, UI ist reiner State-Holder

