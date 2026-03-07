

# Plan: Tiefenanalyse — Warum die Objektdaten im Gutachten leer sind

## Root Cause (Hauptursache)

Die Daten sind in der Datenbank vorhanden. Der Snapshot wird korrekt gespeichert (verifiziert: `canonical_snapshot` enthalt Adresse, Flache, Baujahr, Miete etc.). Aber der **Frontend-Code liest das falsche Feld**.

In `useValuationCase.ts` Zeile 359:
```typescript
const rawSnapshot = inputs.snapshot ?? null;  // BUG!
```

Die Edge Function speichert den Snapshot als `canonical_snapshot` in der Tabelle `valuation_inputs`. Die `get`-Action gibt das Objekt 1:1 zuruck:
```json
{ "inputs": { "canonical_snapshot": { ... }, "data_quality": { ... } } }
```

Aber der Code greift auf `inputs.snapshot` zu — ein Feld das **nicht existiert**. Ergebnis: `rawSnapshot = null`, `mappedSnapshot = null`, alle Felder zeigen "–".

## Zweites Problem: `energy_class` Spalte fehlt in der DB

Die `properties`-Tabelle hat **kein** `energy_class` Feld. Die Immobilienakte speichert die Energieklasse zwar im UI (via `useDossierMutations`), aber:
- `useDossierMutations.ts` schreibt `energy_class` an die `properties`-Tabelle (Zeile 51)
- Die Spalte existiert aber nicht → der Wert wird nie persistiert
- `buildServerSSOTSnapshot` mappt `energy_class` auf `p.energy_certificate_value` (falsch! Das ist der kWh-Wert)

## Drittes Problem: Fehlende Felder im SSOT-Snapshot

`buildServerSSOTSnapshot` in der Edge Function ubergibt **nicht** `heating_type` und `energy_source`, obwohl die Spalten in `properties` existieren und Daten enthalten.

## Konkrete Anderungen

### 1. `src/hooks/useValuationCase.ts` — Bug-Fix (Zeile 359)

```typescript
// VORHER (falsch):
const rawSnapshot = inputs.snapshot ?? null;

// NACHHER (korrekt):
const rawSnapshot = inputs.canonical_snapshot ?? inputs.snapshot ?? null;
```

Gleicher Fix fur `data_quality` (Zeile 356):
```typescript
const rawDq = inputs.data_quality ?? inputs.snapshot?.data_quality ?? ...
```

### 2. DB-Migration: `energy_class` Spalte anlegen

```sql
ALTER TABLE public.properties
ADD COLUMN energy_class text;
```

### 3. Edge Function: Fehlende Felder erganzen (UNFREEZE INFRA-edge_functions erforderlich)

In `buildServerSSOTSnapshot` (Zeile 518-558):
```typescript
heating_type: p.heating_type || null,
energy_source: p.energy_source || null,
energy_class: p.energy_class || null,  // NEU (statt p.energy_certificate_value)
ownership_share_percent: p.ownership_share_percent || null,
```

Und den falschen Mapping-Bug fixen:
```typescript
// VORHER (falsch):
energy_class: p.energy_certificate_value || null,

// NACHHER (korrekt):  
energy_class: p.energy_class || null,
```

## Dateien

| Datei | Anderung | Freeze-Status |
|-------|----------|---------------|
| `src/hooks/useValuationCase.ts` | `inputs.snapshot` → `inputs.canonical_snapshot` | Nicht frozen |
| DB-Migration | `ALTER TABLE properties ADD COLUMN energy_class text` | — |
| `supabase/functions/sot-valuation-engine/index.ts` | Fehlende Felder + energy_class Fix | FROZEN (UNFREEZE INFRA-edge_functions notig) |

## Technischer Hintergrund

Verifiziert via DB-Abfrage: Der Snapshot fur Property `451e0542` enthalt:
- `address: "Parkweg"`, `city: "Straubing"`, `postal_code: "94315"`
- `living_area_sqm: 199.79`, `year_built: 1978`, `object_type: "MFH"`
- `net_cold_rent_monthly: 2300`, `purchase_price: 620000`
- `core_renovated: true`, `renovation_year: 2021`
- `plot_area_sqm: 510`, `unit_count_actual: 3`

Alle Daten sind da — sie werden nur nicht gelesen wegen des falschen Feldnamens.

