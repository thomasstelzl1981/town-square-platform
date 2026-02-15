
# Engine-Audit Zone 2: Wo fehlen Engines?

## Status Quo — Vorhandene Engines

| Engine | Ort | Zweck |
|--------|-----|-------|
| Golden Path Engine | `src/goldenpath/engine.ts` | Workflow-Orchestrierung, Step-Evaluation, Routing-Guards |
| Investment Engine | `useInvestmentEngine.ts` + Edge Function | 40-Jahres-Cashflow, Steuer, Finanzierung |
| NK-Abrechnung Engine | `src/engines/nkAbrechnung/` | Nebenkostenabrechnung mit Umlageschluessel |
| Research Engine | `useResearchEngine.ts` + Edge Function | Kontaktrecherche-Orchestrierung |

## Identifizierte Luecken — Wo Engines fehlen

### 1. Akquise-Kalkulations-Engine (MOD-12) — HOHE PRIORITAET

**Problem:** Die Bestandskalkulation und Aufteilerkalkulation leben als `useMemo`-Bloecke direkt in den Komponenten (`BestandCalculation.tsx`, `AufteilerCalculation.tsx`, `QuickCalcTool.tsx`, `StandaloneCalculatorPanel.tsx`). Dieselbe Logik existiert in 4 verschiedenen Dateien — hohe Drift-Gefahr.

**Engine-Scope:**
- `calcBestand(params)` — Kaufpreis, Mietrendite, NK, Finanzierung, Cashflow
- `calcAufteiler(params)` — Aufteilung, Zielrendite, Verkaufserloes, Gewinnspanne
- Reine Funktionen, kein DB-Zugriff

**Datei:** `src/engines/akquiseCalc/engine.ts`

---

### 2. Finanzierungs-Engine (MOD-07/MOD-11) — HOHE PRIORITAET

**Problem:** Die Kernlogik (Snapshot-Erstellung, Haushaltsrechnung, Bonitaetspruefung, Europace-Mapping) ist ueber `useFinanceData`, `useFinanceSubmission`, `useConsumerLoan` und die Europace-Adapter verteilt. Es gibt keine zentrale Berechnungsschicht.

**Engine-Scope:**
- `calcHaushaltsrechnung(income, expenses)` — Einnahmen/Ausgaben-Saldo
- `calcBonitaet(profile, request)` — Tragfaehigkeitspruefung (DSR, LTV)
- `createSnapshot(selfDisclosure)` — Deterministische Snapshot-Erzeugung
- `mapToEuropace(case)` — Europace-API-Payload-Mapping (Vorbereitung)

**Datei:** `src/engines/finanzierung/engine.ts`

---

### 3. Provisions-Engine (MOD-04 Verkauf / MOD-09 Partner) — MITTLERE PRIORITAET

**Problem:** Provisionsberechnungen (Innenprovision, Aussenprovision, Tippgeber) werden inline in `VorgaengeTab.tsx` und `NetworkTab.tsx` berechnet. Bei mehreren Akteuren (Verkaeufer, Partner, Tippgeber) entsteht Inkonsistenz-Risiko.

**Engine-Scope:**
- `calcCommission(dealValue, rates, splits)` — Provisionsverteilung
- `calcPartnerShare(deal, partnerContract)` — Partneranteil
- `calcTippgeberFee(deal, agreement)` — Tippgeber-Verguetung

**Datei:** `src/engines/provision/engine.ts`

---

### 4. Vermietungs-/BWA-Engine (MOD-04/MOD-20) — MITTLERE PRIORITAET

**Problem:** MOD-04 hat einen "BWA"-Tab ohne konsolidierte Berechnungslogik. Die NK-Engine deckt nur die Abrechnung ab, nicht die laufende Bewirtschaftung (Mieteinnahmen, Leerstand, Instandhaltungsruecklage, EUeR).

**Engine-Scope:**
- `calcBWA(property, period)` — Betriebswirtschaftliche Auswertung pro Objekt
- `calcLeerstandsquote(units, leases)` — Leerstandsberechnung
- `calcInstandhaltungsruecklage(property, rules)` — Peters'sche Formel
- `calcMietspiegelVergleich(unit, region)` — Mietpotenzial

**Datei:** `src/engines/bewirtschaftung/engine.ts`

---

### 5. Projekt-Kalkulations-Engine (MOD-13) — NIEDRIGERE PRIORITAET

**Problem:** Die Projektkalkulation (Baukosten, Verkaufserloes, Marge) lebt inline in `ProjectDetailPage.tsx`. Fuer den Landing Page Builder und die Investment Engine muessen dieselben Zahlen konsistent sein.

**Engine-Scope:**
- `calcProjektKalkulation(units, costs, financing)` — Gesamtkalkulation
- `calcUnitPricing(unit, strategy)` — Einzelpreis-Berechnung
- `calcVertriebsStatus(units, reservations)` — Verkaufsfortschritt

**Datei:** `src/engines/projektCalc/engine.ts`

---

## Architektur-Empfehlung

Alle neuen Engines folgen dem gleichen Muster wie die NK-Abrechnung Engine:

```text
src/engines/
  nkAbrechnung/          (existiert)
    engine.ts
    spec.ts
    allocationLogic.ts
  akquiseCalc/           (NEU)
    engine.ts
    spec.ts
  finanzierung/          (NEU)
    engine.ts
    spec.ts
  provision/             (NEU)
    engine.ts
    spec.ts
  bewirtschaftung/       (NEU)
    engine.ts
    spec.ts
  projektCalc/           (NEU)
    engine.ts
    spec.ts
```

**Prinzipien:**
- `engine.ts` = Reine Funktionen, kein DB-Zugriff, testbar
- `spec.ts` = Typen, Konstanten, Kategorien (SSOT)
- Hooks (`useXxxEngine`) rufen die Engine-Funktionen und mappen DB-Daten
- Edge Functions nutzen dieselbe Logik serverseitig (z.B. PDF-Export)

## Empfohlene Reihenfolge

| Prioritaet | Engine | Grund |
|------------|--------|-------|
| 1 | Akquise-Kalkulation | 4-fache Code-Duplikation, hoechstes Drift-Risiko |
| 2 | Finanzierung | Kerngeschaeft, Europace-Anbindung steht bevor |
| 3 | Provision | Cross-Modul (MOD-04, MOD-09, MOD-15), Konsistenz kritisch |
| 4 | Bewirtschaftung/BWA | BWA-Tab ist aktuell leer, Engine als Fundament |
| 5 | Projekt-Kalkulation | Abhaengig von Investment Engine, geringeres Risiko |
