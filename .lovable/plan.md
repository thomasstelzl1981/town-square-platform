

# Kontenauslesung: Jan/Feb 2025 Seed + Editierbarkeit + Sperrfunktion

## Ist-Zustand

Die Seed-Daten fuer `rent_payments` laufen aktuell von **Maerz 2025 bis Februar 2026** (12 Eintraege pro Lease). Bei Auswahl von Jahr 2025 fehlen daher Januar und Februar — es werden nur 10 Zeilen angezeigt.

## Umsetzung

### Schritt 1: SQL Migration

**a) Fehlende Seed-Daten ergaenzen (Jan + Feb 2025 pro Lease):**

6 neue `rent_payments`-Eintraege mit deterministischen IDs:

| Lease | due_date | expected_amount | amount | status |
|-------|----------|-----------------|--------|--------|
| ...0001 (Berlin) | 2025-01-01 | 1150 | 1150 | paid |
| ...0001 (Berlin) | 2025-02-01 | 1150 | 1150 | paid |
| ...0002 (Muenchen) | 2025-01-01 | 1580 | 1580 | paid |
| ...0002 (Muenchen) | 2025-02-01 | 1580 | 1580 | paid |
| ...0003 (Hamburg) | 2025-01-01 | 750 | 750 | paid |
| ...0003 (Hamburg) | 2025-02-01 | 750 | 750 | paid |

**b) Neue Spalte `payments_locked` (boolean, default false) auf `nk_periods`** fuer die Sperrfunktion.

### Schritt 2: `src/hooks/useNKAbrechnung.ts`

- `RentPaymentRow` um `id` Feld erweitern
- `fetchRentPayments`: `id` mitlesen aus DB
- Neuer State: `paymentsLocked` (boolean)
- `fetchRentPayments` laedt zusaetzlich `payments_locked` aus `nk_periods`
- Neue Funktion `updateRentPayment(index, field, value)` — lokale Aenderung an `amount` oder `paidDate`
- Neue Funktion `saveRentPayments()` — UPDATE per `id` in die DB
- Neue Funktion `lockPayments()` — setzt `nk_periods.payments_locked = true`
- Alles im Return-Objekt exponiert

### Schritt 3: `src/components/portfolio/NKAbrechnungTab.tsx`

- Ist-Spalte und Eingangsdatum-Spalte: editierbare Input-Felder (wenn nicht gesperrt)
- Button "Zahlungen speichern" unterhalb der Tabelle
- Button "Festschreiben" mit Bestaetigungsdialog (AlertDialog)
- Nach Festschreibung: alle Felder read-only, gruenes Badge "Festgeschrieben"

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| SQL Migration | CREATE | 6 fehlende rent_payments (Jan+Feb 2025) + payments_locked Spalte auf nk_periods |
| `src/hooks/useNKAbrechnung.ts` | EDIT | id in RentPaymentRow, updateRentPayment, saveRentPayments, lockPayments |
| `src/components/portfolio/NKAbrechnungTab.tsx` | EDIT | Editierbare Felder + Speichern/Festschreiben Buttons |

