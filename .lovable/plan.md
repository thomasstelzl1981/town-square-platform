

# Armstrong Zone 2: Fehlende Buero-Manager Actions

## Status Quo

Armstrong hat aktuell **ca. 55 Z2-Actions** (ohne Coach-Slides). Diese decken Erklaerungen, Kalkulationen, DMS und einige Schreibvorgaenge ab. Allerdings fehlen zentrale **operative Buero-Taetigkeiten**, die ein Buero-Manager taeglich ausfuehrt.

## Identifizierte Luecken nach Kategorie

### 1. E-Mail & Kommunikation (MOD-02)

Armstrong kann Briefe senden und WhatsApp beantworten, aber:

| Fehlende Action | Beschreibung | Execution Mode | Widget? |
|----------------|-------------|----------------|---------|
| ARM.MOD02.SEND_EMAIL | E-Mail ueber Outbound Identity versenden | execute_with_confirmation | Ja -- Widget zur Freigabe |
| ARM.MOD02.DRAFT_EMAIL | E-Mail-Entwurf erstellen (ohne Versand) | draft_only | Nein |
| ARM.MOD02.REPLY_EMAIL | Antwort auf eine empfangene E-Mail verfassen und senden | execute_with_confirmation | Ja -- Widget zur Freigabe |
| ARM.MOD02.SEND_BULK_EMAIL | Serien-E-Mail an Kontaktgruppe senden (DSGVO-konform) | execute_with_confirmation | Ja -- Widget mit Empfaengerliste |

### 2. Kalender & Terminverwaltung (MOD-02)

Aktuell hat Armstrong KEINE Kalender-Actions:

| Fehlende Action | Beschreibung | Execution Mode | Widget? |
|----------------|-------------|----------------|---------|
| ARM.MOD02.CREATE_APPOINTMENT | Termin im Kalender anlegen | execute_with_confirmation | Ja -- Widget mit Termindetails |
| ARM.MOD02.RESCHEDULE_APPOINTMENT | Bestehenden Termin verschieben | execute_with_confirmation | Ja -- Widget zur Bestaetigung |
| ARM.MOD02.CANCEL_APPOINTMENT | Termin absagen (mit optionaler Benachrichtigung) | execute_with_confirmation | Ja -- Widget mit Absagegrund |
| ARM.MOD02.SCHEDULE_VIDEOCALL | Videocall planen und Einladung versenden | execute_with_confirmation | Ja -- Widget mit Einladungslink |
| ARM.MOD02.DAILY_BRIEFING | Tagesuebersicht: Termine, offene Tasks, Faelligkeiten | readonly | Nein |

### 3. Kontaktverwaltung (MOD-02)

Armstrong kann Kontakte recherchieren (MOD-14), aber nicht operativ verwalten:

| Fehlende Action | Beschreibung | Execution Mode | Widget? |
|----------------|-------------|----------------|---------|
| ARM.MOD02.CREATE_CONTACT | Neuen Kontakt im Kontaktbuch anlegen | execute_with_confirmation | Nein (interner Write) |
| ARM.MOD02.SEARCH_CONTACT | Kontakt im Kontaktbuch suchen | readonly | Nein |
| ARM.MOD02.ADD_CONTACT_NOTE | Notiz zu einem Kontakt hinzufuegen | execute | Nein (interner Write) |
| ARM.MOD02.LOG_INTERACTION | Gespraech/Interaktion bei einem Kontakt protokollieren | execute | Nein (interner Write) |

### 4. Immobilienverwaltung (MOD-04)

Armstrong kann Immobilien und Einheiten anlegen, aber die operative Verwaltung fehlt:

| Fehlende Action | Beschreibung | Execution Mode | Widget? |
|----------------|-------------|----------------|---------|
| ARM.MOD04.CREATE_LEASE | Mietvertrag anlegen | execute_with_confirmation | Nein (interner Write) |
| ARM.MOD04.CREATE_TENANT | Mieter anlegen und mit Einheit verknuepfen | execute_with_confirmation | Nein (interner Write) |
| ARM.MOD04.DRAFT_RENT_ADJUSTMENT | Mieterhoehungsschreiben vorbereiten (Mietspiegelbasiert) | draft_only | Nein |
| ARM.MOD04.DRAFT_RENT_REMINDER | Mahnschreiben bei Mietrueckstand vorbereiten | draft_only + execute_with_confirmation | Ja -- Widget zur Brief-Freigabe |
| ARM.MOD04.RUN_NK_ABRECHNUNG | Nebenkostenabrechnung berechnen und als Entwurf erstellen | execute_with_confirmation | Ja -- Widget zur Freigabe |
| ARM.MOD04.DRAFT_TENANT_LETTER | Allgemeines Mieterschreiben vorbereiten (Betriebskosten, Hausverwaltung etc.) | draft_only | Nein |

### 5. Finanzierung (MOD-07/11)

| Fehlende Action | Beschreibung | Execution Mode | Widget? |
|----------------|-------------|----------------|---------|
| ARM.MOD07.CREATE_FINANCE_REQUEST | Finanzierungsanfrage aus Selbstauskunft + Objekt erstellen | execute_with_confirmation | Ja -- Widget zur Freigabe |
| ARM.MOD07.CHECK_CREDITWORTHINESS | Bonitaetspruefung anhand Haushaltsueberschuss | readonly (Engine) | Nein |
| ARM.MOD07.SUBMIT_TO_BANK | Finanzierungspaket an Bankpartner uebermitteln | execute_with_confirmation | Ja -- Widget zur Freigabe |

### 6. Tagesgeschaeft & Produktivitaet (MOD-00)

| Fehlende Action | Beschreibung | Execution Mode | Widget? |
|----------------|-------------|----------------|---------|
| ARM.MOD00.DAILY_BRIEFING | Morgen-Briefing: Termine, Faelligkeiten, offene Widgets, neue E-Mails | readonly | Nein |
| ARM.MOD00.WEEKLY_SUMMARY | Wochenrueckblick: Erledigte Tasks, KPIs, naechste Woche | readonly | Nein |
| ARM.MOD00.PRIORITIZE_INBOX | Posteingang priorisieren und sortieren (KI-gestuetzt) | readonly | Nein |
| ARM.MOD00.GENERATE_REPORT | Bericht zu einem Thema erstellen (Portfolio, Finanzen, Vermietung) | execute_with_confirmation | Ja -- Widget mit Report-Link |

### 7. Vertrieb & Akquise (MOD-12)

| Fehlende Action | Beschreibung | Execution Mode | Widget? |
|----------------|-------------|----------------|---------|
| ARM.MOD12.DRAFT_ACQ_EMAIL | Akquise-Anschreiben fuer Mandat erstellen | draft_only | Nein |
| ARM.MOD12.ANALYZE_OFFER | Eingehendes Angebot bewerten (Bestand/Aufteiler) | readonly | Nein |
| ARM.MOD12.CREATE_MANDATE | Akquise-Mandat anlegen | execute_with_confirmation | Nein (interner Write) |

### 8. Sanierung (MOD-16)

| Fehlende Action | Beschreibung | Execution Mode | Widget? |
|----------------|-------------|----------------|---------|
| ARM.MOD16.DRAFT_TENDER | Ausschreibung fuer Handwerkerleistung vorbereiten | draft_only | Nein |
| ARM.MOD16.COMPARE_OFFERS | Handwerkerangebote vergleichen und Empfehlung geben | readonly | Nein |
| ARM.MOD16.COMMISSION_CONTRACTOR | Handwerker beauftragen (E-Mail-Versand) | execute_with_confirmation | Ja -- Widget zur Freigabe |

## Zusammenfassung: 30 neue Actions

| Kategorie | Neue Actions | Davon mit Widget |
|-----------|-------------|-----------------|
| E-Mail & Kommunikation | 4 | 3 |
| Kalender & Termine | 5 | 3 |
| Kontaktverwaltung | 4 | 0 |
| Immobilienverwaltung | 6 | 2 |
| Finanzierung | 3 | 2 |
| Tagesgeschaeft | 4 | 1 |
| Vertrieb & Akquise | 3 | 0 |
| Sanierung | 3 | 1 |
| **Gesamt** | **32** | **12** |

## Widget-Governance-Regel

Jede Action, die eine der folgenden Bedingungen erfuellt, MUSS ein Task-Widget auf dem Dashboard erzeugen:

1. **Externe Kommunikation**: E-Mail senden, Brief senden, WhatsApp senden
2. **Kreditzahlung**: Metered Actions ueber 2 Credits
3. **Datenaenderung an Dritten**: Mietanpassung, Kuendigung, Bankeinreichung
4. **Oeffentliche Sichtbarkeit**: Landing Page publizieren, Inserat veroeffentlichen

Interne Schreibvorgaenge (Kontakt anlegen, Notiz speichern, Mietvertrag anlegen) sind **kein** Widget-Pflichtfall, da sie keine externen Konsequenzen haben.

## Umsetzungsplan

### Phase 1: Kern-Buero-Actions (Prioritaet HOCH)

Die 12 wichtigsten Actions fuer den taeglichen Buero-Betrieb:

1. ARM.MOD02.SEND_EMAIL
2. ARM.MOD02.DRAFT_EMAIL
3. ARM.MOD02.REPLY_EMAIL
4. ARM.MOD02.CREATE_APPOINTMENT
5. ARM.MOD02.SCHEDULE_VIDEOCALL
6. ARM.MOD02.CREATE_CONTACT
7. ARM.MOD02.SEARCH_CONTACT
8. ARM.MOD00.DAILY_BRIEFING
9. ARM.MOD04.DRAFT_RENT_REMINDER
10. ARM.MOD04.CREATE_LEASE
11. ARM.MOD04.CREATE_TENANT
12. ARM.MOD00.PRIORITIZE_INBOX

### Phase 2: Operative Erweiterungen (Prioritaet MITTEL)

13-22: Restliche Kalender-, Finanzierungs- und Verwaltungs-Actions

### Phase 3: Spezialisierte Actions (Prioritaet NIEDRIG)

23-32: Akquise-, Sanierungs- und Report-Actions

## Technische Details

### Datei-Aenderungen

Nur **eine Datei** betroffen: `src/manifests/armstrongManifest.ts`

- 32 neue Action-Eintraege im `armstrongActions`-Array
- TOP_30_MVP_ACTION_CODES bleibt unveraendert (separater MVP-Scope)
- Jede Action folgt dem bestehenden `ArmstrongActionV2`-Schema

### Widget-Pattern fuer externe Actions

Actions mit `execution_mode: 'execute_with_confirmation'` und Side-Effect `sends_external_communication` oder `credits_consumed` erzeugen ein Task-Widget:

```text
{
  action_code: 'ARM.MOD02.SEND_EMAIL',
  execution_mode: 'execute_with_confirmation',
  side_effects: ['sends_external_communication', 'credits_consumed'],
  // -> Armstrong erstellt Widget auf Dashboard
  // -> User bestaetigt oder bricht ab
  // -> Bei Bestaetigung: Edge Function fuehrt aus
}
```

### Kein SQL noetig

Alle Aenderungen sind rein manifest-seitig. Die `task_widgets`-Tabelle und der `useTaskWidgets`-Hook existieren bereits und unterstuetzen die neuen Action-Codes automatisch.

