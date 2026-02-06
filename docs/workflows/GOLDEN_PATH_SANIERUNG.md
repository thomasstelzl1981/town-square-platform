# Golden Path: Sanierung (MOD-04)

**Version:** 1.0  
**Status:** ACTIVE  
**Date:** 2026-02-06

---

## Übersicht

Der Sanierung-Workflow ist ein 8-stufiger "Golden Path" für die Innensanierung von Wohnungen und Häusern. Er ermöglicht die strukturierte Ausschreibung, Angebotseinholung und Vergabe von Handwerksleistungen.

---

## Architektur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MOD-04 SANIERUNG WORKFLOW                               │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Phase 1     │  │ Phase 2     │  │ Phase 3     │  │ Phase 4             │ │
│  │ Anlegen     │→ │ Leistungs-  │→ │ Ausschrei-  │→ │ Inbound + Vergabe   │ │
│  │ (Draft)     │  │ umfang      │  │ bung        │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│       ↓                 ↓                 ↓                   ↓              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Objekt +    │  │ KI-Analyse  │  │ Provider-   │  │ E-Mail-Matching     │ │
│  │ Kategorie   │  │ + LV-Editor │  │ Suche       │  │ + Angebotsvergleich │ │
│  │ auswählen   │  │             │  │ + E-Mail    │  │ + Vergabe           │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │ Resend Integration  │
                            │ • Outbound E-Mails  │
                            │ • Inbound Webhook   │
                            │ • Tender-ID Match   │
                            └─────────────────────┘
```

---

## Datenmodell

### Kerntabellen

| Tabelle | Zweck | SSOT |
|---------|-------|------|
| `service_cases` | Sanierungsvorgänge | ✓ |
| `service_case_providers` | Angeschriebene Dienstleister | ✓ |
| `service_case_inbound` | Eingehende Angebote/E-Mails | ✓ |

### Service Case Status-Flow

```
draft → scope_pending → scope_draft → scope_finalized → ready_to_send → sent → offers_received → under_review → awarded → in_progress → completed
                                                                                                                              ↓
                                                                                                                         cancelled
```

### Tender-ID Format

```
TND-{ORG_PUBLIC_ID}-{YYMMDD}-{SEQ}

Beispiel: TND-A1B2C3-260206-001
```

---

## Die 8 Schritte des Sanierung-Workflows

### Schritt 1: Vorgang anlegen (Draft)

**UI:** `ServiceCaseCreateDialog.tsx`

**Eingaben:**
- Objekt auswählen (Property)
- Einheit auswählen (Unit, optional)
- Kategorie wählen (9 Gewerke)
- Titel eingeben
- Kontaktdaten (Name, Telefon, E-Mail)

**Kategorien:**
| ID | Label | Icon |
|----|-------|------|
| `sanitaer` | Sanitär | Wrench |
| `elektro` | Elektro | Zap |
| `maler` | Maler | Paintbrush |
| `dach` | Dach | Home |
| `fenster` | Fenster | Square |
| `heizung` | Heizung | Flame |
| `gutachter` | Gutachter | ClipboardList |
| `hausverwaltung` | HV | Building2 |
| `sonstige` | Sonstige | Package |

**Akzeptanzkriterien:**
- [ ] Dialog öffnet bei Klick auf "Neuer Vorgang"
- [ ] Objekt-Dropdown lädt Properties
- [ ] Einheiten filtern nach gewähltem Objekt
- [ ] Tender-ID wird automatisch generiert
- [ ] Status nach Anlage: `draft`

---

### Schritt 2: Leistungsumfang definieren

**UI:** `ScopeDefinitionPanel.tsx`, `LineItemsEditor.tsx`, `CostEstimateCard.tsx`

**Zwei Wege:**
1. **KI-gestützt:** Grundriss + Fotos analysieren → LV generieren
2. **Externes LV:** PDF hochladen → als Anhang nutzen

**Edge Function:** `sot-renovation-scope-ai`

**Komponenten:**
- `DMSDocumentSelector`: Dokumente aus DMS auswählen
- `LineItemsEditor`: Editierbares Leistungsverzeichnis
- `CostEstimateCard`: Min/Mittel/Max Kostenschätzung
- `RoomAnalysisDisplay`: Erkannte Räume anzeigen

**Akzeptanzkriterien:**
- [ ] DMS-Dokumente können ausgewählt werden
- [ ] LV-Positionen können hinzugefügt/bearbeitet werden
- [ ] Kostenschätzung zeigt Min/Mittel/Max
- [ ] Status nach Finalisierung: `scope_finalized`

---

### Schritt 3: Dienstleister suchen

**UI:** `ProviderSearchPanel.tsx`

**Funktionen:**
- Google Places API Suche (Edge Function: `sot-places-search`)
- Manuelle Eingabe von Dienstleistern
- Mehrfachauswahl möglich

**Suchlogik:**
```typescript
const getCategorySearchTerm = (cat: string): string => {
  const terms = {
    sanitaer: 'Sanitär Installateur',
    elektro: 'Elektriker',
    maler: 'Maler Lackierer',
    // ...
  };
  return terms[cat] || 'Handwerker';
};
```

**Akzeptanzkriterien:**
- [ ] Suche funktioniert (Mock-Daten ohne API Key)
- [ ] Manuelle Eingabe mit Name + E-Mail
- [ ] Ausgewählte Dienstleister werden gespeichert

---

### Schritt 4: Ausschreibung versenden

**UI:** `TenderDraftPanel.tsx`

**Edge Function:** `sot-renovation-outbound`

**E-Mail-Inhalt:**
- Tender-ID im Betreff
- Objektadresse
- Vollständige Leistungsbeschreibung
- LV-Positionen
- Kostenschätzung (optional)
- Angebotsfrist
- Kundenkontaktdaten (Name, Telefon, E-Mail, WhatsApp)

**E-Mail-Format:**
```
Betreff: Angebotsanfrage: Sanitärarbeiten — TND-A1B2C3-260206-001

Sehr geehrte Damen und Herren,

wir bitten um Abgabe eines Angebots für folgende Leistungen:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJEKT:
Leipziger Str. 42
04103 Leipzig
Einheit: WE-01

VORGANG:
Tender-ID: TND-A1B2C3-260206-001
Titel: Badsanierung komplett

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LEISTUNGSBESCHREIBUNG:
...

ANGEBOTSFRIST:
20. Februar 2026

KONTAKT FÜR RÜCKFRAGEN:
Max Mustermann
Tel: +49 151 12345678
E-Mail: max@example.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bitte senden Sie Ihr Angebot an diese Adresse.
Bitte die Tender-ID "TND-A1B2C3-260206-001" im Betreff angeben.
```

**Akzeptanzkriterien:**
- [ ] E-Mail-Vorschau zeigt alle Daten
- [ ] Bearbeiten-Modus für Angebotsfrist + Hinweise
- [ ] Versand nur nach expliziter Bestätigung
- [ ] Status nach Versand: `sent`

---

### Schritt 5: Angebote empfangen

**UI:** `UnassignedInboundList.tsx`

**Edge Function:** `sot-renovation-inbound-webhook` (Resend Webhook)

**Matching-Logik:**
1. Tender-ID im Betreff → `exact` Match
2. Tender-ID im Body → `high` Match
3. Absender-E-Mail → `medium` Match
4. Kein Match → `pending` Status

**Match Confidence:**
| Level | Bedeutung |
|-------|-----------|
| `exact` | Tender-ID im Betreff gefunden |
| `high` | Tender-ID im Body gefunden |
| `medium` | Absender-E-Mail passt zu Provider |
| `low` | Heuristik-Match |
| `none` | Kein Match |

**Akzeptanzkriterien:**
- [ ] Webhook empfängt E-Mails
- [ ] Tender-ID wird extrahiert
- [ ] Automatische Zuordnung bei Match
- [ ] Unzugeordnete E-Mails erscheinen in Liste

---

### Schritt 6: Angebote zuordnen

**UI:** `UnassignedInboundList.tsx` (Assign-Dialog)

**Manuelle Zuordnung:**
- Liste aller aktiven Vorgänge
- Suche nach Titel/Tender-ID
- Klick auf "Zuordnen"

**Akzeptanzkriterien:**
- [ ] Unzugeordnete E-Mails sichtbar
- [ ] Manuelle Zuordnung möglich
- [ ] Status nach Zuordnung: `matched`

---

### Schritt 7: Angebote vergleichen

**UI:** `OffersComparisonPanel.tsx`

**Funktionen:**
- Alle Anbieter in Tabelle
- Kontaktdaten (E-Mail, Telefon, Website)
- Angebotsbetrag eingeben/bearbeiten
- Gültigkeitsdatum
- Günstigstes Angebot markiert

**Akzeptanzkriterien:**
- [ ] Alle Provider mit Kontaktdaten sichtbar
- [ ] Angebotsbeträge editierbar
- [ ] Günstigstes Angebot hervorgehoben
- [ ] Vergabe-Button pro Anbieter

---

### Schritt 8: Auftrag vergeben

**UI:** `OffersComparisonPanel.tsx` (Award-Dialog)

**Workflow:**
1. Provider auswählen
2. Anmerkungen zur Vergabe (optional)
3. Bestätigen
4. Status → `awarded`

**Akzeptanzkriterien:**
- [ ] Vergabe-Dialog mit Provider-Details
- [ ] Anmerkungen-Feld
- [ ] Status nach Vergabe: `awarded`
- [ ] Nur ein Provider kann "awarded" sein

---

## Dateistruktur

```
src/
├── components/portal/immobilien/sanierung/
│   ├── ServiceCaseCreateDialog.tsx    # Schritt 1
│   ├── ServiceCaseStatusBadge.tsx     # Status-Badges
│   ├── scope/
│   │   ├── ScopeDefinitionPanel.tsx   # Schritt 2 Container
│   │   ├── LineItemsEditor.tsx        # LV-Editor
│   │   ├── CostEstimateCard.tsx       # Kostenschätzung
│   │   ├── DMSDocumentSelector.tsx    # Dokumentauswahl
│   │   ├── RoomAnalysisDisplay.tsx    # Raum-Analyse
│   │   └── index.ts
│   ├── tender/
│   │   ├── ProviderSearchPanel.tsx    # Schritt 3
│   │   ├── TenderDraftPanel.tsx       # Schritt 4
│   │   └── index.ts
│   └── inbound/
│       ├── UnassignedInboundList.tsx  # Schritt 5-6
│       ├── OffersComparisonPanel.tsx  # Schritt 7-8
│       └── index.ts
├── hooks/
│   ├── useServiceCases.ts             # CRUD für service_cases
│   └── useServiceCaseInbound.ts       # CRUD für inbound/providers
└── pages/portal/immobilien/
    └── SanierungTab.tsx               # Hauptseite

supabase/functions/
├── sot-renovation-scope-ai/           # KI-Analyse
├── sot-places-search/                 # Google Places API
├── sot-renovation-outbound/           # E-Mail-Versand
└── sot-renovation-inbound-webhook/    # E-Mail-Empfang
```

---

## Edge Functions

### sot-renovation-scope-ai

**Zweck:** KI-Analyse von Grundrissen und Fotos

**Input:**
```json
{
  "documents": [{ "id": "...", "mime_type": "image/png" }],
  "category": "sanitaer"
}
```

**Output:**
```json
{
  "rooms": [{ "name": "Bad", "area_sqm": 6.5, "doors": 1, "windows": 1 }],
  "line_items": [{ "description": "Demontage Waschbecken", "unit": "Stk", "quantity": 1 }],
  "cost_estimate": { "min": 5000, "mid": 7500, "max": 12000 }
}
```

### sot-places-search

**Zweck:** Dienstleister-Suche via Google Places API

**Secrets:** `GOOGLE_PLACES_API_KEY` (optional, Mock-Daten ohne)

**Input:**
```json
{
  "query": "Sanitär Installateur Berlin",
  "location": "Berlin"
}
```

### sot-renovation-outbound

**Zweck:** Ausschreibungs-E-Mail versenden

**Secrets:** `RESEND_API_KEY` (optional, Logging ohne)

**Input:**
```json
{
  "service_case_id": "...",
  "provider": { "name": "...", "email": "..." },
  "email": { "to": "...", "subject": "...", "body": "..." },
  "deadline": "2026-02-20"
}
```

### sot-renovation-inbound-webhook

**Zweck:** Eingehende E-Mails parsen und zuordnen

**Secrets:** `RESEND_WEBHOOK_SECRET` (optional)

**Webhook-Payload:** Resend `email.received` Event

---

## Secrets für Live-Betrieb

| Secret | Erforderlich | Fallback |
|--------|--------------|----------|
| `GOOGLE_PLACES_API_KEY` | Nein | Mock-Daten |
| `RESEND_API_KEY` | Nein | Console-Logging |
| `RESEND_WEBHOOK_SECRET` | Nein | Keine Signatur-Validierung |

---

## Verifizierungsprotokoll

| # | Aktion | Erwartung | ✓ |
|---|--------|-----------|---|
| 1 | `/portal/immobilien/sanierung` öffnen | Tab mit Workflow-Leiste | ✓ |
| 2 | "Neuer Vorgang" klicken | Dialog öffnet | |
| 3 | Objekt + Kategorie wählen | Dropdown funktioniert | |
| 4 | Vorgang speichern | Toast + Vorgang in Liste | |
| 5 | Leistungsumfang Tab öffnen | ScopeDefinitionPanel lädt | |
| 6 | LV-Position hinzufügen | Editor funktioniert | |
| 7 | Provider suchen | Mock-Ergebnisse erscheinen | |
| 8 | E-Mail-Vorschau prüfen | Alle Daten korrekt | |
| 9 | Unzugeordnete E-Mails prüfen | Liste leer (kein Webhook) | |
| 10 | Angebotsvergleich öffnen | Tabelle mit Providern | |

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-02-06 | Initial version — Phase 1-4 implementiert |
