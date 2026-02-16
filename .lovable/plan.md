
# Vorsorge-Lueckenrechner — Engine 9 + UI (am Ende des Vorsorge-Tabs)

## Einordnung im Modul

```text
PORTAL (/portal)
  └── Finanzanalyse (MOD-18) — /portal/finanzanalyse
        ├── Dashboard        /portal/finanzanalyse/dashboard
        ├── Investment       /portal/finanzanalyse/investment
        ├── Sachversicherungen
        ├── VORSORGE         /portal/finanzanalyse/vorsorge   <── HIER
        ├── Krankenversicherung
        ├── Abonnements
        ├── Vorsorgedokumente
        └── Darlehen
```

### Aufbau des Vorsorge-Tabs (VorsorgeTab.tsx) — vorher vs. nachher

```text
VORHER:                              NACHHER:
┌────────────────────────┐           ┌────────────────────────┐
│ ModulePageHeader [+]   │           │ ModulePageHeader [+]   │
│ Info-Banner (DRV-Hint) │           │ Info-Banner (DRV-Hint) │
│                        │           │                        │
│ WidgetGrid             │           │ WidgetGrid             │
│ ┌────┐ ┌────┐ ┌────┐  │           │ ┌────┐ ┌────┐ ┌────┐  │
│ │bAV │ │BU  │ │Rür.│  │           │ │bAV │ │BU  │ │Rür.│  │
│ └────┘ └────┘ └────┘  │           │ └────┘ └────┘ └────┘  │
│                        │           │                        │
│ [Detail-Card wenn      │           │ [Detail-Card wenn      │
│  Vertrag selektiert]   │           │  Vertrag selektiert]   │
│                        │           │                        │
│                        │           │ ── Separator ────────  │
│                        │           │                        │
│                        │           │ VORSORGE-LUECKENRECHNER│
│                        │           │ ┌────────────────────┐ │
│                        │           │ │ Personen-Chips     │ │
│                        │           │ │ [Hauptperson][Part]│ │
│                        │           │ ├────────────────────┤ │
│                        │           │ │ ALTERSVORSORGE     │ │
│                        │           │ │ Gesetzl. + Privat  │ │
│                        │           │ │ Slider 60-90%      │ │
│                        │           │ │ => Luecke/Surplus   │ │
│                        │           │ ├────────────────────┤ │
│                        │           │ │ BU/EU-LUECKE       │ │
│                        │           │ │ Gesetzl. + Privat  │ │
│                        │           │ │ => Luecke/Surplus   │ │
│                        │           │ ├────────────────────┤ │
│                        │           │ │ [i] Daten fehlen?  │ │
│                        │           │ │ -> Personenakte     │ │
│                        │           │ └────────────────────┘ │
└────────────────────────┘           └────────────────────────┘
```

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/engines/vorsorgeluecke/spec.ts` | **NEU** — Typen und Konstanten |
| `src/engines/vorsorgeluecke/engine.ts` | **NEU** — Berechnungslogik (pure TS) |
| `src/engines/index.ts` | Export Engine 9 ergaenzen |
| `src/components/portal/finanzanalyse/VorsorgeLueckenrechner.tsx` | **NEU** — UI-Komponente |
| `src/pages/portal/finanzanalyse/VorsorgeTab.tsx` | Import + Einbindung am Seitenende |

Keine DB-Migration noetig — alle Felder existieren bereits.

## Engine 9: `src/engines/vorsorgeluecke/`

### spec.ts — Typen und Konstanten

**Eingabetypen:**

- `VLPersonInput`: employment_status, net_income_monthly, gross_income_monthly, ruhegehaltfaehiges_grundgehalt, ruhegehaltfaehige_dienstjahre
- `VLPensionInput`: projected_pension, disability_pension, pension_type
- `VLContractInput`: contract_type, monthly_benefit, insured_sum, current_balance, status, category

**Ausgabetypen:**

- `AltersvorsorgeResult`: gesetzliche_versorgung, gesetzliche_quelle ('drv' | 'pension' | 'missing'), private_renten, private_verrentung, expected_total, retirement_need, gap, surplus, capital_needed
- `BuLueckeResult`: gesetzliche_absicherung, gesetzliche_quelle ('drv_em' | 'dienstunfaehigkeit' | 'fallback' | 'missing'), private_bu, total_absicherung, bu_need, bu_gap, bu_surplus

**Konstanten:**

- DEFAULT_NEED_PERCENT = 0.75
- DEFAULT_ANNUITY_YEARS = 25
- BEAMTE_MAX_VERSORGUNGSSATZ = 0.7175
- BEAMTE_SATZ_PRO_JAHR = 0.0179375
- EM_FALLBACK_PERCENT = 0.35
- Altersvorsorge-Typen: bAV, Riester, Ruerup, Lebensversicherung, Privat, Versorgungswerk, Sonstige
- BU-Typen: Berufsunfaehigkeitsversicherung, Dienstunfaehigkeitsversicherung

### engine.ts — Berechnungslogik

**`calcAltersvorsorge(person, pension, contracts, needPercent?)`:**

1. Gesetzliche Versorgung ermitteln:
   - Employee/Self-employed: `pension.projected_pension` oder quelle='missing'
   - Beamter: `pension.projected_pension` ODER Berechnung: `grundgehalt * min(dienstjahre * 1.79375%, 71.75%)`
2. Private Altersvorsorge aggregieren (nur category='vorsorge', nur Altersvorsorge-Typen):
   - Wenn `monthly_benefit` vorhanden: direkt addieren
   - Sonst wenn `insured_sum` oder `current_balance`: Verrentung = Kapital / 25 / 12
3. Ergebnis:
   - need = net_income * needPercent
   - gap = max(0, need - total)
   - surplus = max(0, total - need)
   - capital_needed = gap * 12 * 25

**`calcBuLuecke(person, pension, contracts, needPercent?)`:**

1. Gesetzliche BU/EU:
   - Employee: `pension.disability_pension` oder Fallback 35% von gross
   - Beamter: erreichter Versorgungssatz * Grundgehalt (Mindestversorgung)
   - Self-employed: 0
2. Private BU: Summe `monthly_benefit` aller BU/DU-Vertraege (category='vorsorge')
3. Ergebnis: need = net_income * needPercent, gap = max(0, need - total)

### Datenisolation (harte Sperre)

Die Engine importiert KEINE anderen Engines. Sie erhaelt ausschliesslich:
- Personen-Felder aus `household_persons`
- Renten-Felder aus `pension_records`
- Vertraege aus `vorsorge_contracts` mit `category='vorsorge'`

Kein Zugriff auf: Immobilien, Investments, Depots, Cashflow, PV, Mieteinnahmen.

## UI-Komponente: VorsorgeLueckenrechner.tsx

### Datenquellen (uebergeben als Props, kein eigenes Fetching)

- `persons` — aus `useFinanzanalyseData()`
- `pensionRecords` — aus `useFinanzanalyseData()`
- `contracts` — die bereits im VorsorgeTab gefilterten Vorsorge-Vertraege

### Layout

1. **Personen-Chips**: Horizontale Badge-Leiste, Hauptperson vorselektiert
2. **Altersvorsorge-Sektion**:
   - Gesetzliche Versorgung (Betrag + Quelle oder "Daten fehlen")
   - Private Vorsorge (Summe Renten + Summe Verrentung)
   - Bedarfs-Slider (60-90%, Default 75%)
   - Ergebnis: Progress-Bar (gruen = gedeckt, rot = Luecke) + Zahlen
   - Kapitalbedarf bei Luecke
3. **BU/EU-Sektion**:
   - Gesetzliche Absicherung (Betrag + Quelle)
   - Private BU-Leistungen
   - Bedarfs-Slider
   - Ergebnis: Progress-Bar + Zahlen
4. **Footer**: "Daten fehlen?" mit Link zur Personenakte (UebersichtTab)

### Fehlende-Daten-Handling

- Fehlende DRV-Daten: Hinweis-Badge "DRV-Daten fehlen" + Link "In Personenakte ergaenzen"
- Fehlende Beamten-Daten: Analog
- Kein Einkommen: "Nettoeinkommen nicht hinterlegt"
- Keine Schaetzung aus anderen Modulen, keine Fallback-Werte aus Vermoegenswerten

## Aenderungen in VorsorgeTab.tsx

Am Ende der Datei (nach dem `showNew`-Block, vor `</PageShell>`):

```text
<Separator className="my-8" />
<VorsorgeLueckenrechner
  persons={persons (gefiltert nach Demo-Toggle)}
  pensionRecords={pensionRecords}
  contracts={contracts (die bereits category='vorsorge' gefilterten)}
/>
```

Dafuer wird der bestehende `useFinanzanalyseData()` Hook um `pensionRecords` erweitert (ist bereits vorhanden und wird exportiert).

## Engines-Index Update

```text
// Engine 9: Vorsorge-Lueckenrechner
export * from './vorsorgeluecke/engine';
export * from './vorsorgeluecke/spec';
```
