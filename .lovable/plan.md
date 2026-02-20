

# Umbau "Geldeingang" zu "Zahlungsverkehr" (MOD-04)

## Problemanalyse

Nach Code-Review der aktuellen Implementierung wurden folgende Defizite identifiziert:

1. **Zwei redundante Buttons** ("Abgleich starten" + "Mieteingang pruefen") -- beide rufen unterschiedliche Edge Functions auf (`sot-rent-match` bzw. `sot-rent-arrears-check`), aber der Nutzer erkennt den Unterschied nicht
2. **Auto-Match funktioniert nur unter Bedingungen**: `auto_match_enabled = true` UND `linked_bank_account_id` muss gesetzt sein -- sonst passiert nichts
3. **Keine Sicht auf vorhandene Transaktionen**: Die Tabelle zeigt nur `rent_payments`-Eintraege, nicht die zugrunde liegenden `bank_transactions`
4. **Manuelle Zuordnung fehlt**: Es gibt keine Moeglichkeit, eine existierende Banktransaktion manuell einer Immobilie/einem Mietverhaeltnis zuzuweisen
5. **Tab-Name zu eng**: "Geldeingang" suggeriert nur Einnahmen -- fuer NK-Abrechnung und Steuer werden aber alle Buchungen benoetigt

## Loesung: 3-Zonen-Layout "Zahlungsverkehr"

### Zone A: Aktionsleiste (oben)
- **Ein einzelner Button "Kontenabgleich starten"** mit animiertem Fortschritt (wie beim Vorsorgerechner)
  - Ruft `sot-rent-match` auf (Auto-Matching)
  - Danach automatisch `sot-rent-arrears-check` (Rueckstands-Pruefung)
  - Zeigt Ergebnis: "X Zahlungen zugeordnet, Y Rueckstaende erkannt"
- **Button "Zahlung manuell erfassen"** (wie bisher, aber prominenter)

### Zone B: Zahlungsuebersicht (Mitte) -- bestehende 12-Monats-Tabelle
- Bleibt erhalten: Soll vs. Ist pro Monat
- Wird ergaenzt um eine **Quell-Spalte** ("Auto" / "Manuell" / "Bank")
- Klick auf eine Zeile oeffnet Detail-Ansicht mit der zugeordneten Banktransaktion

### Zone C: Transaktions-Zuordnung (unten) -- NEU
- **Collapsible-Bereich "Nicht zugeordnete Buchungen"**
- Laedt alle `bank_transactions` fuer das verknuepfte Konto mit `match_status IS NULL` oder `unmatched`
- Jede Transaktion zeigt: Datum, Betrag, Verwendungszweck, Absender
- **Button "Zuordnen"** pro Transaktion: Erstellt einen `rent_payments`-Eintrag und setzt `match_status = 'MANUAL_OVERRIDE'` in `bank_transactions`
- Filter nach Zeitraum und Betragsspanne

### Tab-Umbenennung
- Von "Geldeingang" zu **"Zahlungen"** (kurz, neutral, umfasst Ein- und Ausgaben)
- Icon bleibt `Banknote`

## Technische Details

### Dateien die geaendert werden

1. **`src/components/portfolio/GeldeingangTab.tsx`** -- Hauptumbau:
   - Rename-Export zu `ZahlungsverkehrTab` (Alias beibehalten fuer Kompatibilitaet)
   - Konsolidierung der zwei Buttons zu einem sequentiellen Ablauf
   - Neuer Bereich: Nicht zugeordnete Transaktionen mit manuellem Zuordnungs-Button
   - Neue Query auf `bank_transactions` WHERE `account_ref = linked_bank_account_id` AND `match_status` IS NULL/unmatched

2. **`src/pages/portal/immobilien/PropertyDetailPage.tsx`** -- Tab-Label:
   - `TabsTrigger value="geldeingang"` Label aendern zu "Zahlungen"

3. **`supabase/functions/sot-rent-match/index.ts`** -- Edge Function bleibt, wird nicht geaendert (Logik ist korrekt)

### Datenfluss

```text
Nutzer klickt "Kontenabgleich starten"
         |
         v
  sot-rent-match (Edge Function)
  - Liest bank_transactions (unmatched)
  - Vergleicht mit Warmmiete + Suchbegriffe
  - Erstellt rent_payments + setzt match_status
         |
         v
  sot-rent-arrears-check (Edge Function)
  - Prueft offene Monate ohne Zahlung
  - Erstellt Task-Widgets bei Rueckstaenden
         |
         v
  UI aktualisiert: 12-Monats-Tabelle + Rest-Liste
         |
         v
  Nutzer kann MANUELL zuordnen:
  - Klickt "Zuordnen" bei einer Transaktion
  - System erstellt rent_payment + markiert TX
```

### Was NICHT geaendert wird
- `sot-rent-match` Edge Function (Logik funktioniert, Problem war nur UI-seitig)
- `sot-rent-arrears-check` Edge Function
- `rent_payments` Tabellenstruktur
- `bank_transactions` Tabellenstruktur
- NK-Abrechnung (bleibt wie ist, konsumiert `rent_payments`)

