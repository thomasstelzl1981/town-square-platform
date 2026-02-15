
# Engines 2-5 implementieren

Aufbauend auf der bereits fertigen Akquise-Kalkulations-Engine werden nun die vier verbleibenden Engines erstellt.

## Neue Dateien (8 Dateien)

### Engine 2: Finanzierung (`src/engines/finanzierung/`)

**spec.ts** — Typen und Konstanten:
- `HaushaltsrechnungInput` (income, expenses arrays)
- `HaushaltsrechnungResult` (surplus, DSR)
- `BonitaetInput` / `BonitaetResult` (LTV, DSCR, Tragfaehigkeit)
- `AnnuityParams` / `AnnuityResult` (Zins, Tilgung, Monatsrate, Restschuld)
- `SnapshotInput` / `SnapshotResult`
- `FINANZIERUNG_DEFAULTS` (Standard-Zinsbindung, Tilgung, LTV-Grenzen)

**engine.ts** — Reine Funktionen:
- `calcHaushaltsrechnung(input)` — Einnahmen minus Ausgaben, DSR-Quote
- `calcBonitaet(input)` — LTV, DSCR, max. Darlehensbetrag, Ampel-Bewertung
- `calcAnnuity(params)` — Monatsrate, Restschuld nach Zinsbindung (extrahiert aus FinanceCalculatorCard)
- `calcConsumerLoanOffers(amount, termMonths)` — Mock-Offer-Berechnung (extrahiert aus useConsumerLoan)
- `createApplicantSnapshot(profile)` — Deterministische Snapshot-Erzeugung (extrahiert aus useSubmitFinanceRequest)

### Engine 3: Provision (`src/engines/provision/`)

**spec.ts** — Typen und Konstanten:
- `CommissionInput` (dealValue, rates, splits)
- `CommissionResult` (brutto, netto, splits pro Partei)
- `TippgeberInput` / `TippgeberResult`
- `PROVISION_DEFAULTS` (Standard-Saetze)

**engine.ts** — Reine Funktionen:
- `calcCommission(input)` — Provisionsverteilung (Innen/Aussen)
- `calcPartnerShare(deal, contract)` — Partneranteil
- `calcTippgeberFee(deal, agreement)` — Tippgeber-Verguetung (25% SoT-Anteil etc.)

### Engine 4: Bewirtschaftung (`src/engines/bewirtschaftung/`)

**spec.ts** — Typen und Konstanten:
- `BWAInput` (Mieteinnahmen, Kosten, Perioden)
- `BWAResult` (Ueberschuss, Rendite, Cashflow)
- `InstandhaltungInput` / `InstandhaltungResult`
- `LeerstandInput` / `LeerstandResult`
- `BEWIRTSCHAFTUNG_DEFAULTS`

**engine.ts** — Reine Funktionen:
- `calcBWA(input)` — Betriebswirtschaftliche Auswertung
- `calcInstandhaltungsruecklage(input)` — Peters'sche Formel
- `calcLeerstandsquote(units, leases)` — Leerstandsberechnung
- `calcMietpotenzial(currentRent, marketRent)` — Mietanpassungspotenzial

### Engine 5: ProjektCalc (`src/engines/projektCalc/`)

**spec.ts** — Typen und Konstanten:
- `ProjektKalkInput` (units, costs, financing)
- `ProjektKalkResult` (Gesamtkosten, Erloes, Marge)
- `UnitPricingInput` / `UnitPricingResult`
- `VertriebsStatusInput` / `VertriebsStatusResult`

**engine.ts** — Reine Funktionen:
- `calcProjektKalkulation(input)` — Gesamtkalkulation
- `calcUnitPricing(unit, strategy)` — Einzelpreis-Berechnung
- `calcVertriebsStatus(units, reservations)` — Verkaufsfortschritt in Prozent

## Index-Datei

**src/engines/index.ts** — Re-Exportiert alle Engines fuer einfachen Import.

## Keine DB-Aenderungen

Alle Engines sind reine Funktionen ohne Seiteneffekte. Die Anbindung an bestehende Komponenten (Refactoring der Inline-Logik) erfolgt in einem separaten Schritt.
