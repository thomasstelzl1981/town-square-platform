
# Nachsendeauftraege als eigenstaendige Kacheln (Multi-Mandate)

## Problemstellung

Aktuell zeigt die Postservice-Kachel nur **einen** Nachsendeauftrag und wechselt zwischen "Einrichten"-Ansicht und "Aktiv"-Ansicht. Der Nutzer benoetigt aber die Moeglichkeit, **mehrere** Nachsendeauftraege zu verwalten (z.B. fuer verschiedene Vermietereinheiten oder Firmen). Ausserdem fehlen in der aktiven Ansicht die Details wie Empfaenger und Adresse.

## Loesung

Die mittlere Kachel "Digitaler Postservice" wird umgebaut:

1. **Query aendern**: Statt `limit(1).maybeSingle()` werden **alle** Mandate geladen (ausser `cancelled`)
2. **Jeder aktive Nachsendeauftrag** wird als eigene Mini-Kachel innerhalb der Postservice-Card dargestellt mit:
   - Empfaengername (aus `payload_json.recipient_name`)
   - Adresse (Strasse, PLZ, Ort aus `payload_json`)
   - Status-Badge (Eingereicht / In Bearbeitung / Aktiv)
   - Postfach-Nummer
   - "Widerrufen"-Button direkt in der Kachel
3. **Button "Weiteren Nachsendeauftrag einrichten"** bleibt immer sichtbar (unterhalb der bestehenden Mandate)
4. Widerrufene Auftraege werden nicht angezeigt

## Visuelles Konzept

```text
+------------------------------------------+
| [Mail-Icon] Digitaler Postservice        |
| Nachsendeauftraege verwalten             |
+------------------------------------------+
|                                          |
| +--------------------------------------+ |
| | Mister Thomas / System of a Town     | |
| | Musterstrasse 1, 80331 Muenchen      | |
| | Postfach: A0000000                   | |
| | Weiterleitung: [Aktiv]               | |
| |                                      | |
| | Kosten: 30 Credits/Monat + 3/Brief   | |
| | [Widerrufen]                         | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | Firma XY GmbH                        | |
| | Hauptstr. 5, 10115 Berlin            | |
| | Postfach: A0000000                   | |
| | Status: [Eingereicht]                | |
| |                                      | |
| | Kosten: 30 Credits/Monat + 3/Brief   | |
| | [Widerrufen]                         | |
| +--------------------------------------+ |
|                                          |
| [+ Weiteren Nachsendeauftrag einrichten] |
|                                          |
| Kostenmodell (Info-Box)                  |
+------------------------------------------+
```

## Technische Umsetzung

### Datei: `src/pages/portal/dms/EinstellungenTab.tsx`

**Query anpassen (Zeile 104-119):**
- `postservice_mandates` Query aendern: `.in('status', ['requested', 'setup_in_progress', 'active', 'paused'])` statt `limit(1).maybeSingle()`, Ergebnis als Array
- Typ von `mandate` (single) auf `mandates` (Array) aendern

**Kachel B komplett umbauen (Zeile 270-374):**
- Ueber `mandates` Array iterieren
- Jedes Mandat als eigene innere Kachel (`rounded-xl border p-4`) mit:
  - `payload_json.recipient_name` als Titel (fett)
  - `payload_json.address`, `payload_json.postal_code`, `payload_json.city` als Adresszeile
  - Postfach-Nummer aus `tenant_id`
  - Status-Badge via bestehender `getMandateStatusBadge()`
  - Individueller "Widerrufen"-Button der die jeweilige Mandate-ID nutzt
- `cancelMandate` Mutation anpassen: Parameter `mandateId` statt festes `mandate.id`
- "Nachsendeauftrag einrichten"-Button immer sichtbar (nicht nur wenn kein Mandat existiert)
- Kostenmodell-Infobox bleibt am Ende der Kachel

**Keine Datenbank-Aenderungen noetig** — Die `postservice_mandates` Tabelle unterstuetzt bereits mehrere Eintraege pro Tenant.
