

# Konten-Zuordnung und Auto-Matching: bank_transactions zu rent_payments

## Problem

Die Datenkette ist unterbrochen. Drei Luecken existieren:

1. **Konto-Zuordnung**: Auf dem Konto (KontoAkteInline) MUSS eine Zuordnung zur Vermietereinheit gewaehlt werden. Der Select existiert bereits, aber Demo-Konten haben `disabled` gesetzt und echte Konten haben oft keine Zuordnung.

2. **Matching-Logik fehlt**: Es gibt keinen Code, der importierte `bank_transactions` mit `rent_payments` abgleicht. Die Felder `linked_bank_account_id` und `auto_match_enabled` auf `leases` sind vorhanden, werden aber nie ausgewertet.

3. **GeldeingangTab liest nur rent_payments**: Selbst wenn Transaktionen importiert sind, erscheinen sie nicht auf der Immobilien-Detailseite.

## Datenkette (Soll-Zustand)

```text
CSV-Import
    |
    v
bank_transactions (account_ref = Konto-ID)
    |
    v
Auto-Match-Engine (Lease hat linked_bank_account_id + auto_match_enabled)
    |  Prueft: Betrag = Warmmiete? Datum im richtigen Monat? Verwendungszweck enthaelt Miete-Kennwort?
    v
rent_payments (lease_id, amount, status='paid'/'partial', paid_date)
    |
    v
GeldeingangTab zeigt Soll vs. Ist
```

## Aenderungen

### Phase A: Zuordnungs-Pflicht sichtbar machen

**`src/components/finanzanalyse/KontoAkteInline.tsx`**

- Wenn ein echtes Konto KEINE Zuordnung hat (`owner_type` leer), wird ein Hinweis-Banner angezeigt: "Bitte weisen Sie dieses Konto einer Person oder Vermietereinheit zu, damit Umsaetze korrekt zugeordnet werden koennen."
- Der bestehende Zuordnungs-Select bleibt unveraendert, bekommt aber visuell einen gelben Rahmen wenn leer.

### Phase B: Matching-Engine (Edge Function)

**`supabase/functions/sot-rent-match/index.ts`** (NEU)

Edge Function, die manuell oder nach jedem CSV-Import aufgerufen wird:

1. Laedt alle Leases mit `auto_match_enabled = true` und `linked_bank_account_id IS NOT NULL`
2. Fuer jede Lease: Laedt `bank_transactions` des verknuepften Kontos fuer den aktuellen Monat
3. Matching-Kriterien:
   - `amount_eur` entspricht Warmmiete (Toleranz +/- 1 EUR)
   - `booking_date` liegt im erwarteten Monat
   - Optional: `purpose_text` enthaelt Wohnungskennung oder Mieternamen
4. Bei Match: Erstellt/aktualisiert `rent_payments`-Eintrag mit `status = 'paid'` und `paid_date`
5. Bei Teilmatch (Betrag weicht ab): `status = 'partial'`
6. Markiert die `bank_transaction` mit `match_status = 'AUTO_MATCHED'`

### Phase C: GeldeingangTab erweitern

**`src/components/portfolio/GeldeingangTab.tsx`**

- Nach CSV-Import: Button "Abgleich starten" ruft `sot-rent-match` auf
- Alternativ: Automatischer Abgleich wenn `auto_match_enabled = true` und der bestehende "Mieteingang pruefen"-Button gedrueckt wird
- Die bestehende `sot-rent-arrears-check` Function wird erweitert oder vor dem Arrears-Check wird erst `sot-rent-match` aufgerufen

### Phase D: Rueckkopplung im CSV-Import

**`src/components/finanzanalyse/TransactionCsvImportDialog.tsx`**

- Nach erfolgreichem Import: Toast mit Hinweis "X Umsaetze importiert. Automatischen Abgleich starten?" mit Action-Button
- Bei Klick: `sot-rent-match` wird aufgerufen
- Ergebnis wird als Toast angezeigt: "Y Mietzahlungen automatisch zugeordnet"

## Betroffene Dateien

| Datei | Phase | Aenderung |
|-------|-------|-----------|
| `src/components/finanzanalyse/KontoAkteInline.tsx` | A | Hinweis-Banner bei fehlender Zuordnung |
| `supabase/functions/sot-rent-match/index.ts` | B | NEU: Matching-Engine |
| `src/components/portfolio/GeldeingangTab.tsx` | C | Abgleich-Button, ruft sot-rent-match |
| `src/components/finanzanalyse/TransactionCsvImportDialog.tsx` | D | Post-Import Abgleich-Trigger |
| `supabase/config.toml` | B | Eintrag fuer sot-rent-match (verify_jwt = false) |

## Voraussetzungen

- `bank_transactions.match_status` Spalte existiert bereits (Typ: text, nullable)
- `leases.linked_bank_account_id` und `auto_match_enabled` existieren bereits
- `rent_payments` Tabelle existiert bereits mit allen benoetigten Feldern
- Keine neue DB-Migration noetig
