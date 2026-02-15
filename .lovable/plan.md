

# NK-Abrechnung Sektion 3: Kontenauslesung + Einzelzahlungsliste

## Problem

Sektion 3 "Mieteinnahmen & Vorauszahlungen" zeigt aktuell nur kumulierte Werte aus dem Mietvertrag (Kaltmiete x 12, NK-VZ x 12, Heizkosten-VZ x 12). Es fehlen:
- Ein Button "Kontenauslesung beauftragen", der die tatsaechlichen Zahlungseingaenge aus der `rent_payments`-Tabelle laedt
- Eine Tabelle mit allen Einzelzahlungen (Datum, Betrag, Status) fuer das ausgewaehlte Jahr

Die Daten existieren bereits in der Datenbank — es sind rent_payments mit `paid_date`, `amount`, `status` pro Lease und Monat vorhanden.

## Loesung

### Datei 1: `src/hooks/useNKAbrechnung.ts`

**Neuer State + Funktion hinzufuegen:**

- `rentPayments` State (Array der Einzelzahlungen fuer das gewaehlte Jahr)
- `isLoadingPayments` State
- `fetchRentPayments()` Funktion — wird per Button-Klick ausgeloest:
  - Laedt aus `rent_payments` WHERE `lease_id` = aktive Lease AND `due_date` im gewaehlten Jahr
  - Sortiert nach `due_date` aufsteigend (Jan → Dez)
  - Gibt zurueck: `paid_date`, `amount`, `expected_amount`, `status`, `due_date`
- Beide werden im Return-Objekt des Hooks exponiert

### Datei 2: `src/components/portfolio/NKAbrechnungTab.tsx`

**Sektion 3 erweitern (nach der bestehenden Vorauszahlungstabelle):**

1. **Button "Kontenauslesung"** — laedt die tatsaechlichen Zahlungseingaenge:
   - Icon: `Banknote` (wie im GeldeingangTab)
   - Text: "Kontenauslesung beauftragen"
   - onClick: ruft `fetchRentPayments()` auf
   - Loading-State mit Spinner

2. **Einzelzahlungstabelle** (erscheint nach Laden):
   - Spalten: Monat (due_date), Soll (expected_amount), Ist (amount), Eingangsdatum (paid_date), Status (Badge)
   - Status-Badges: Bezahlt (gruen), Teilweise (gelb), Offen (grau), Ueberfaellig (rot)
   - Summenzeile am Ende mit Gesamtsumme Soll vs. Ist

### Keine DB-Aenderung noetig

Die `rent_payments`-Tabelle existiert bereits mit allen benoetigten Feldern. RLS-Policies sind vorhanden. Demo-Daten sind eingetragen (12 Monate pro Lease).

## Ergebnis

Nach dem Klick auf "Kontenauslesung" erscheint eine detaillierte 12-Zeilen-Tabelle (Jan-Dez) mit allen tatsaechlichen Zahlungseingaengen, ihrem Eingangsdatum und Status — als Datengrundlage fuer weitere Funktionen.

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/hooks/useNKAbrechnung.ts` | EDIT | rentPayments State + fetchRentPayments() Funktion |
| `src/components/portfolio/NKAbrechnungTab.tsx` | EDIT | Sektion 3: Button + Einzelzahlungstabelle |

