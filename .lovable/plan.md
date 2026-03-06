

# SoT Valuation Engine — SSOT-Final Mode Erweiterung (MOD-04 Override)

## Bestandsaufnahme & Analyse

### Aktuelle Implementierung (v5.0)
Die Engine funktioniert als **"Draft-only"** System:
- **Edge Function** (`sot-valuation-engine`): 993 Zeilen, 6 Stages, behandelt alle Quellen gleich
- **Hook** (`useValuationCase`): Sendet `propertyId` und `sourceContext`, aber die Edge Function nutzt `property_id` nicht zum SSOT-Datenabruf
- **BewertungTab** (MOD-04): Wählt Property aus Liste, sendet aber nur die ID — die Edge Function liest die Property-Daten nicht aus der DB
- **Spec/Engine**: Vollständig, aber `CanonicalPropertySnapshot` kennt kein `source_mode`
- **DB**: `valuation_cases` hat kein `source_mode`, kein `property_id` Feld

### Kernproblem
MOD-04 hat **umfangreiche SSOT-Daten** in 4 Tabellen:
- `properties`: Adresse, Typ, Baujahr, Grundbuch, WEG, Flurstück, Kaufpreis, Fläche, Geokoordinaten
- `units`: Zimmer, Fläche, Hausgeld, Miete, MEA, Zustand, Energieausweis
- `leases`: Nettokaltmiete, NK-Vorauszahlung, Heizung, Mietstatus
- `loans`: Restschuld, Zins, Tilgung, Zinsbindung, Rate

Diese Daten werden aktuell **ignoriert**. Die Engine extrahiert stattdessen alles per KI aus Exposé-Text — auch wenn die strukturierten Daten bereits vorhanden sind.

---

## Implementierungsplan

### 1. DB-Migration: `valuation_cases` erweitern

Neue Spalten:
- `source_mode TEXT DEFAULT 'DRAFT_INTAKE'` — `'SSOT_FINAL'` oder `'DRAFT_INTAKE'`
- `property_id UUID REFERENCES properties(id)` — nullable, verknüpft mit MOD-04 Property
- `draft_source_ref UUID` — nullable, für Exposé/Inbox Referenz

### 2. Engine Spec erweitern (`src/engines/valuation/spec.ts`)

Neue Types:
- `ValuationSourceMode = 'SSOT_FINAL' | 'DRAFT_INTAKE'`
- `FieldSource = 'SSOT' | 'Extracted' | 'User' | 'Derived'`
- `SnapshotField<T>` — Wrapper: `{ value: T, source: FieldSource, confidence: number, evidence_refs: string[] }`
- `DiffEntry` — für SSOT vs. Extracted Vergleich: `{ field, ssotValue, extractedValue, decision }`
- `LegalTitleBlock` — Grundbuch, Flurstück, Eigentumsanteil, WEG, Dokumentstatus

Erweiterung von `CanonicalPropertySnapshot`:
- Neue Felder: `purchasePrice`, `acquisitionCosts`, `notaryDate`, `ownershipSharePercent`, `parcelNumber`, `landRegisterCourt/Sheet/Volume`, `wegFlag`, `teNumber`, `unitOwnershipNr`, `meaShare`, `existingLoanData`
- Neues Feld: `sourceMode: ValuationSourceMode`
- Neues Feld: `legalTitle: LegalTitleBlock`

### 3. Engine Logic erweitern (`src/engines/valuation/engine.ts`)

Neue Funktionen:
- `buildSnapshotFromSSOT(property, units, leases, loans)` — Baut vollständigen Snapshot aus DB-Daten
- `mergeSnapshots(ssotSnapshot, extractedSnapshot)` — Deterministisch: SSOT gewinnt immer, Extracted nur als Fallback
- `detectDiffs(ssotSnapshot, extractedSnapshot)` — Findet Abweichungen für Diff-Review UI
- `buildLegalTitleBlock(property)` — Extrahiert Grundbuch/WEG/Flurstück aus Property

### 4. Edge Function erweitern (`sot-valuation-engine`)

**Stage 0 — Preflight:** 
- Neuer Parameter `property_id` im Request
- Wenn `property_id` vorhanden: `source_mode = 'SSOT_FINAL'`
- Property + Units + Leases + Loans aus DB laden (via `sbAdmin`)
- Preflight-Response enthält `source_mode` Label

**Stage 1 — Intake:**
- SSOT_FINAL: `buildSnapshotFromSSOT()` als Primärquelle; Exposé-Extraction nur für Evidence/Fallback
- DRAFT_INTAKE: wie bisher
- Merge via `mergeSnapshots()`, Diffs via `detectDiffs()` in `valuation_inputs` speichern

**Stage 4 — Calculations:**
- SSOT_FINAL nutzt echte Loan-Daten für Financing statt Defaults (wenn vorhanden)
- Legal/Title als Risk/Quality Signals (DataQuality Score höher bei SSOT)

**Stage 5 — Report:**
- Report Header zeigt `source_mode`
- Legal & Title Block wird generiert und in Results gespeichert

### 5. UI-Erweiterungen

**ValuationPreflight:**
- Zeigt Source-Mode Badge: "Datenbasis: MOD-04 SSOT (Final)" vs. "Datenbasis: Exposé Draft"
- SSOT-Final zeigt Quellenliste aus Property-Daten statt nur Dokumente

**ValuationReportReader — neuer Block "Recht & Eigentum":**
- Grundbuch (Gericht/Blatt/Band)
- Flurstück
- Eigentumsanteil / WEG / MEA
- Dokumentstatus (Grundbuchauszug vorhanden? TE vorhanden?)
- Disclaimer: "Belastungen nicht automatisch ausgewertet"

**BewertungTab (MOD-04):**
- Wenn Property gewählt: automatisch `source_mode: 'SSOT_FINAL'` + vollständigen Property-Datensatz mitsenden
- Property-Details laden (Units, Leases, Loans) für den Run-Call

**ValuationPdfGenerator:**
- Neuer Block "Recht & Eigentum" auf Seite 3/4 (kompakt)
- Report Header zeigt Source-Mode

### 6. Diff-Review UI (neues Shared Component)

`ValuationDiffReview` in `src/components/shared/valuation/`:
- Zeigt Felder wo SSOT != Extracted
- Pro Feld: beide Werte + Evidence Links
- Buttons: "SSOT behalten" (Default), "SSOT aktualisieren", "Ignorieren"
- Default: SSOT behalten, kein automatischer Override

### 7. Draft→Final Handoff

Wenn ein Draft-Case später eine `property_id` bekommt:
- Neuer "Upgrade" Action im Edge Function
- Verknüpft `draft_case_id` mit `property_id`
- Nächster Run aus MOD-04 schaltet automatisch auf SSOT_FINAL

---

## Technische Details

### SSOT Property Data Fetch (Edge Function)

```text
properties: address, city, postal_code, property_type, year_built, market_value,
            purchase_price, acquisition_costs, total_area_sqm, latitude, longitude,
            land_register_court/sheet/volume, parcel_number, weg_flag, te_number,
            ownership_share_percent, unit_ownership_nr, manager_contact

units:      area_sqm, rooms, hausgeld_monthly, current_monthly_rent, condition_grade,
            mea_share, parking_count, energy_certificate_value/type

leases:     rent_cold_eur, nk_advance_eur, heating_advance_eur, status, start_date

loans:      outstanding_balance_eur, interest_rate_percent, repayment_rate_percent,
            annuity_monthly_eur, fixed_interest_end_date, bank_name
```

### Merge Priority (deterministisch)

```text
1. SSOT (property/units/leases/loans Felder) — höchste Priorität
2. User (explizit im UI bestätigt/editiert)
3. Extracted (KI-Extraktion aus Exposé)
4. Derived (berechnet: z.B. €/m² aus Preis/Fläche)
```

### Dateien (Änderungen/Neu)

| Datei | Aktion |
|-------|--------|
| `src/engines/valuation/spec.ts` | Erweitern: SourceMode, FieldSource, LegalTitleBlock |
| `src/engines/valuation/engine.ts` | Neu: buildSnapshotFromSSOT, mergeSnapshots, detectDiffs, buildLegalTitleBlock |
| `supabase/functions/sot-valuation-engine/index.ts` | Erweitern: SSOT-Fetch, source_mode Logic, Legal Block |
| `supabase/migrations/xxx.sql` | Neue Spalten: source_mode, property_id, draft_source_ref |
| `src/hooks/useValuationCase.ts` | Erweitern: Property-Daten laden und mitsenden |
| `src/pages/portal/immobilien/BewertungTab.tsx` | Erweitern: Full property data fetch, SSOT-Modus |
| `src/components/shared/valuation/ValuationPreflight.tsx` | Source-Mode Badge |
| `src/components/shared/valuation/ValuationReportReader.tsx` | Legal & Title Block |
| `src/components/shared/valuation/ValuationDiffReview.tsx` | Neu: Diff-Review UI |
| `src/components/shared/valuation/ValuationPdfGenerator.ts` | Legal Block + Source-Mode Header |
| `src/components/shared/valuation/index.ts` | Export ValuationDiffReview |

### Aufwandsschätzung

| Workstream | Iterationen |
|-----------|-------------|
| DB-Migration (3 Spalten) | 1 |
| Engine spec + engine Erweiterung | 2-3 |
| Edge Function SSOT-Fetch + Merge | 3-4 |
| UI: Preflight Badge + Legal Block + Diff-Review | 2-3 |
| BewertungTab SSOT-Modus | 1-2 |
| PDF Legal Block | 1 |
| **Gesamt** | **~10-14** |

