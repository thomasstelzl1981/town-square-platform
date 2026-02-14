
# Fix: Demo-Immobilienakten — Mietverhältnis-Bug und fehlende Datenfelder

## Problem 1: Mietverhältnis-Tab zeigt keine Daten (Kritischer Bug)

**Ursache**: In `PropertyDetailPage.tsx` (Zeile 279) wird die Unit mit `.eq('unit_number', 'MAIN')` gesucht. Die drei Demo-Units heissen aber `WE-B01`, `WE-M01`, `WE-H01`. Dadurch ist `unit` immer `null`, und der TenancyTab erhaelt einen leeren `unitId`-String — folglich werden keine Mietdaten geladen.

**Loesung**: Die Unit-Abfrage aendern: Statt nach `MAIN` zu filtern, die erste Unit des Objekts laden (sortiert nach `created_at`).

**Datei**: `src/pages/portal/immobilien/PropertyDetailPage.tsx` (Zeile 274-281)

Aenderung:
```sql
-- Vorher:
.eq('unit_number', 'MAIN')
.maybeSingle()

-- Nachher:
.order('created_at', { ascending: true })
.limit(1)
.maybeSingle()
```

---

## Problem 2: Unvollstaendige Demo-Datenfelder

Die drei Demo-Immobilien (Berlin BER-01, Muenchen MUC-01, Hamburg HH-01) haben mehrere leere Felder, die fuer eine saubere Darstellung benoetigt werden:

### Fehlende Felder in `properties`

| Feld | BER-01 | MUC-01 | HH-01 |
|------|--------|--------|-------|
| `description` | null | null | null |
| `land_register_refs` | null | null | null |
| `owner_context_id` | null | null | null |
| `land_register_court` | null | null | null |
| `land_register_sheet` | null | null | null |

### Fehlende Felder in `units`

| Feld | BER-01 | MUC-01 | HH-01 |
|------|--------|--------|-------|
| `energy_certificate_type` | null | null | null |
| `dossier_data_quality` | PRUEFEN | PRUEFEN | PRUEFEN |

### Fehlende Felder in `leases`

| Feld | BER-01 | MUC-01 | HH-01 |
|------|--------|--------|-------|
| `next_rent_adjustment_earliest_date` | null | null | null |

**Loesung**: SQL-Migration, die alle leeren Felder mit realistischen Werten befuellt.

---

## Umsetzungsplan

### Schritt 1: PropertyDetailPage — Unit-Query fixen

**Datei**: `src/pages/portal/immobilien/PropertyDetailPage.tsx`

Die Zeilen 274-281 aendern: `.eq('unit_number', 'MAIN')` entfernen und stattdessen `.order('created_at').limit(1)` verwenden. Dadurch wird immer die erste (aelteste) Unit geladen, egal welchen Namen sie hat.

### Schritt 2: SQL-Migration — Demo-Daten vervollstaendigen

Eine neue Migration ausfuehren, die folgende Felder setzt:

**properties** (3 Objekte):
- `description`: Lagebeschreibung (2-3 Saetze pro Objekt)
- `owner_context_id`: Verweis auf den vorhandenen Landlord-Context (`00000000-0000-4000-a000-000000000110` — Familie Mustermann)
- `land_register_court`: Amtsgericht (z.B. "AG Charlottenburg", "AG Muenchen", "AG Hamburg-Mitte")
- `land_register_sheet`: Blattnummer (z.B. "12345")
- `land_register_refs`: JSON mit `{ "of": "Berlin-Mitte", "te_no": "TE-42" }`

**units** (3 Units):
- `energy_certificate_type`: "verbrauch" oder "bedarf"
- `dossier_data_quality`: auf "OK" setzen

**leases** (3 Mietvertraege):
- `next_rent_adjustment_earliest_date`: Realistisches Datum (z.B. 36 Monate nach Start)

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Unit-Query: `MAIN`-Filter entfernen, stattdessen `order+limit` |
| SQL-Migration | Demo-Datenfelder vervollstaendigen |

### Was sich NICHT aendert
- `useUnitDossier.ts` — funktioniert korrekt (nutzt bereits `usePropertyDossier` mit `limit(1)`)
- `TenancyTab.tsx` — funktioniert korrekt (braucht nur eine gueltige `unitId`)
- `EditableUnitDossierView.tsx` — keine Aenderung
- DB-Schema — keine neuen Spalten oder Tabellen
