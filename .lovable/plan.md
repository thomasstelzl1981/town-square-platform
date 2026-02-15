
# NK-Abrechnung Demo-Flow reparieren: Posteingang + Mieteingang-Tracking

## Analyse-Ergebnis

### Problem 1: Dokumente nicht im Posteingang sichtbar

Die 6 NK-Dokumente (3x WEG-Jahresabrechnung, 3x Grundsteuerbescheid) existieren in der Datenbank mit `source: 'email'` und sind korrekt mit den Properties verlinkt (`document_links`). Sie erscheinen aber **nicht** im Posteingang, weil:

- Der Posteingang liest aus der Tabelle `inbound_emails` — dort gibt es keinen Demo-Eintrag
- Der Posteingang ist zudem durch einen Gate geschuetzt: Ohne aktive `postservice_mandates` wird nur eine Landingpage angezeigt
- Die Demo-Dokumente wurden per Migration direkt in `documents` und `document_links` eingefuegt — der Posteingang-Flow wurde komplett uebersprungen

**Loesung:** Fuer den Demo-Flow muessen wir den "Posteingang-Empfang"-Schritt simulieren. Dafuer:
1. Eine Demo-`postservice_mandates`-Zeile seeden (damit der Posteingang ueberhaupt sichtbar ist)
2. Drei Demo-`inbound_emails` Zeilen seeden (eine pro Hausverwaltung)
3. Sechs `inbound_attachments`-Zeilen seeden (verknuepft mit den bereits vorhandenen `document_id`s)
4. Die Sortier-Container haben korrekte Keywords — damit werden die Dokumente in den Sortier-Kacheln sichtbar

### Problem 2: Mieteingang-Tracking hat keine `rent_payments`-Eintraege

Die Demo-Transaktionen in `demoKontoData.ts` erzeugen client-seitig 14 Monate Mietgutschriften (Jan 2025 – Feb 2026). Aber die Tabelle `rent_payments` ist komplett leer (0 Zeilen). Der `GeldeingangTab` zeigt deshalb 12 leere Monate.

**Loesung:** Demo-Seed fuer `rent_payments` erstellen:
- Fuer alle 3 Leases (BER-01, MUC-01, HH-01) je 12 Monate (Maerz 2025 – Februar 2026)
- Jeweils `status: 'paid'` mit korrekt berechneter Warmmiete
- Ein Monat (z.B. Februar 2026) bleibt bewusst `open` fuer BER-01, damit der Mahnung-Flow demonstriert werden kann

### Problem 3: NKAbrechnungTab greift auf `nk_cost_items` korrekt zu

Hier funktioniert der Flow bereits: 33 `nk_cost_items` existieren, 3 `nk_periods` existieren, alle `document_links` sind vorhanden mit `link_status: 'linked'`. Der Readiness-Check sollte `READY` liefern, sobald der Tab mit den richtigen Property/Unit/Tenant-IDs aufgerufen wird.

## Technische Umsetzung

### Schritt 1: SQL Migration — Demo-Daten fuer Posteingang + Mieteingaenge

Eine neue Migration, die folgende Daten idempotent (ON CONFLICT DO NOTHING) einfuegt:

**Tabelle `postservice_mandates`:**
- 1 Zeile mit `status: 'active'` fuer den Demo-Tenant

**Tabelle `inbound_emails`:**
- 3 Zeilen (eine pro HV-Absender: WEG Berliner Str. 42, WEG Maximilianstr. 8, WEG Elbchaussee 120)
- `status: 'ready'`, `pdf_count: 2` (WEG-Abrechnung + Grundsteuer)

**Tabelle `inbound_attachments`:**
- 6 Zeilen, verknuepft mit den bestehenden `document_id`s (f0000000-...)
- `is_pdf: true`, `document_id` gesetzt

**Tabelle `rent_payments`:**
- 35 Zeilen (3 Leases x 12 Monate, minus 1 offener Monat)
- BER-01: 11 Monate paid (Maerz 2025 – Jan 2026), 1 Monat open (Feb 2026)
- MUC-01: 12 Monate paid
- HH-01: 12 Monate paid
- Betraege exakt aus den Lease-Daten: BER=1150, MUC=1580, HH=750

### Schritt 2: Posteingang-Gate fuer Demo entsperren

Die `PosteingangTab.tsx` prueft aktuell `postservice_mandates.status = 'active'`. Da wir jetzt einen Demo-Eintrag haben, wird der Gate automatisch geoeffnet.

Kein Code-Aenderung noetig — nur die Migration reicht.

### Schritt 3: Geldeingang — Demo-Button "Mieteingang-Check ausfuehren"

Im `GeldeingangTab.tsx` einen Button hinzufuegen, der die Edge Function `sot-rent-arrears-check` manuell triggert. Damit kann der Demo-Flow gezeigt werden:
1. Tabelle zeigt 11 bezahlte + 1 offenen Monat
2. Klick auf "Mieteingang pruefen" → Edge Function laeuft → Task Widget erscheint auf Dashboard
3. Task Widget oeffnet Brief-Generator mit vorausgefuellter Mahnung

### Dateien

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| SQL Migration | CREATE | Demo-Seed: `postservice_mandates`, `inbound_emails`, `inbound_attachments`, `rent_payments` |
| `src/components/portfolio/GeldeingangTab.tsx` | EDIT | Button "Mieteingang pruefen" (ruft `sot-rent-arrears-check` auf) |

### Kein Breaking Change

- Alle bestehenden Queries und Flows bleiben unveraendert
- Demo-Daten nutzen feste UUIDs mit ON CONFLICT DO NOTHING
- Die Edge Function `sot-rent-arrears-check` existiert bereits und ist deployed
- NKAbrechnungTab benoetigt keine Aenderung — die Daten sind bereits vollstaendig
