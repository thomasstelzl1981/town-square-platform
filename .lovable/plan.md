

# Sortierkacheln fuer alle Demo-Akten anlegen und Klick-Flow implementieren

## Analyse-Ergebnis

### Vorhandene Entitaeten im Demo-Tenant

| Typ | Anzahl | Details | Sortierkachel vorhanden? |
|-----|--------|---------|--------------------------|
| Properties | 3 | BER-01 (Berlin), MUC-01 (Muenchen), HH-01 (Hamburg) | Nein |
| Fahrzeuge | 2 | Porsche 911 (B-P911), BMW M5 (M-M5005) | Nein |
| PV-Anlagen | 0 | Keine in der Datenbank | — |
| Personen (household) | 0 | Keine in der Datenbank | — |
| Versicherungen | 0 | Nur KFZ-Versicherungen (an Fahrzeuge gebunden) | — |
| Vorsorge/Hosting/Miety | 0 | Keine Datensaetze | — |

**Bestehende Sortierkacheln:** Nur 1 — "Rechnungen" (Seed-Default)

### Wichtige Erkenntnis

PV-Anlagen und Personen existieren aktuell **nicht** in der Datenbank. Falls du diese bereits angelegt hattest, waren sie moeglicherweise client-seitige Demo-Daten oder wurden bei einem Reset entfernt. Fuer Sortierkacheln brauchen wir reale DB-Eintraege. Der Plan konzentriert sich daher auf die **5 vorhandenen Entitaeten** (3 Properties + 2 Fahrzeuge) und den allgemeinen "Rechnungen"-Container.

---

## Teil 1: SPEC-Datei aktualisieren

### `spec/current/06_api_contracts/CONTRACT_EMAIL_INBOUND.md`

- Routing-Logik vereinfachen: **Eine Inbound-Adresse pro Account**
- Aktenspezifische Routing-Tokens entfernen
- Klarstellen: Zuordnung erfolgt ueber Sortierregeln im Posteingang
- Match-Confidence anpassen (kein "exact" via Routing-Token mehr)

---

## Teil 2: SQL-Migration — 5 Sortierkacheln anlegen

Fuer den Demo-Tenant `a0000000-0000-4000-a000-000000000001`:

| Kachel-Name | Entity-Typ | Keywords |
|-------------|-----------|----------|
| Schadowstr., Berlin | property | Schadowstr, Berlin, BER-01 |
| Leopoldstr., Muenchen | property | Leopoldstr, Muenchen, MUC-01 |
| Osterstr., Hamburg | property | Osterstr, Hamburg, HH-01 |
| Porsche 911 (B-P911) | vehicle | Porsche, 911, B-P911 |
| BMW M5 (M-M5005) | vehicle | BMW, M5, M-M5005 |

Jede Kachel bekommt:
- `entity_type` + `entity_id` (Verknuepfung zur Akte)
- `property_id` (bei Properties)
- `is_enabled = true`
- Eine Sortierregel mit `field: 'subject'`, `operator: 'contains'`

---

## Teil 3: Sortierkachel-Klick-Flow (SortierenTab.tsx)

### Neuer Flow

Aktuell oeffnet ein Klick auf die Kachel nur den Bearbeiten-Dialog. Neues Verhalten:

1. **Klick auf Kachel-Body** → Oeffnet eine **Detail-Ansicht** (Sheet/Dialog)
2. Die Detail-Ansicht zeigt:
   - Name + Status der Kachel
   - Aktive Sortierregeln (Keywords als Badges)
   - Liste der zugeordneten Dokumente (aktuell leer — Platzhalter mit "Noch keine Dokumente zugeordnet")
   - Button **"Im Datenraum oeffnen"** → Navigiert zum DMS-Storage mit Filter auf die verknuepfte Entitaet
3. **Bearbeiten** bleibt ueber den Pencil-Button erreichbar (unveraendert)

### Technische Umsetzung in `SortierenTab.tsx`

- Neuer State: `selectedContainer: SortContainer | null`
- Klick auf Card (nicht auf Action-Buttons) setzt `selectedContainer`
- Neuer Dialog/Sheet: "Kachel-Details" mit Dokument-Liste und Navigation
- "Im Datenraum oeffnen" nutzt `entity_type` + `entity_id` zur Navigation

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `spec/current/06_api_contracts/CONTRACT_EMAIL_INBOUND.md` | Routing-Logik: 1 Adresse pro Account |
| `src/pages/portal/dms/SortierenTab.tsx` | Detail-Ansicht bei Klick, Dokument-Liste, "Datenraum oeffnen" |
| SQL-Migration | 5 Sortierkacheln + Regeln fuer Demo-Akten |

### Was sich NICHT aendert
- `useRecordCardDMS.ts` — erstellt weiterhin Sortierkacheln bei Neuanlage (korrekt)
- `CreatePropertyDialog.tsx` — hat eigene Sort-Container-Erstellung (korrekt)
- `PosteingangTab.tsx` — keine Aenderung
- `OutboundIdentityWidget.tsx` — Upload-E-Mail bleibt die einzige Inbound-Adresse

