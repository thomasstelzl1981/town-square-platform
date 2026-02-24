

# Market Directory Engine — Reparatur + Ausbau

## Problem-Diagnose (verifiziert)

### Bug 1: Kontaktbuch zeigt KEINE Spalten
- `AdminKontaktbuch.tsx` Zeile 392-398: Wenn `filteredContacts.length === 0`, wird ein Empty-State-Block gerendert STATT der Tabelle
- DB-Abfrage bestaetigt: 0 Kontakte in der Datenbank vorhanden
- Ergebnis: Man sieht NIEMALS die Spaltenstruktur, sondern nur "Keine Kontakte" mit einem Button

### Bug 2: Recherche versteckt Ergebnisse
- `AdminRecherche.tsx` Zeilen 396 und 446: Filter und Ergebnistabelle sind in `{selectedOrderId && (...)}` eingeschlossen
- Solange kein Auftrag angeklickt wird, sieht man Filter und Ergebnistabelle gar nicht
- 4 alte "Neue Recherche"-Eintraege stehen noch in der DB

### Was korrekt existiert (nicht kaputt)
- `src/engines/marketDirectory/spec.ts`: Kategorien stimmen (family_office, bank_retail, bank_private, mortgage_broker_34i, insurance_broker_34d, dog_boarding, etc.)
- `src/engines/marketDirectory/engine.ts`: 12 Pure Functions (normalizeContact, calcConfidence, findDedupeMatches, classifyCategory, etc.)
- Engine ist in `src/engines/index.ts` exportiert und in `ENGINE_REGISTRY.md` registriert

---

## Umsetzungsplan (3 Bloecke)

### Block 1: UI-Bugs sofort beheben

#### 1a) Kontaktbuch — Tabelle IMMER anzeigen
**Datei:** `src/pages/admin/ki-office/AdminKontaktbuch.tsx`

**Aenderung (Zeilen 392-398):** Die `if (filteredContacts.length === 0)` Bedingung entfernen, die den gesamten Tabellenblock versteckt. Stattdessen:
- Tabellenkopf mit allen 16 Spalten IMMER rendern
- Bei 0 Ergebnissen: eine einzelne `TableRow` mit `colSpan={16}` und Text "Keine Kontakte vorhanden — erstellen oder aus Recherche importieren"
- Damit sieht man immer: Anrede, Vorname, Nachname, Firma, Kategorie, E-Mail, Mobil, Telefon, Strasse, PLZ, Ort, Permission, DNC, Quality, Letzter Kontakt, Aktionen

#### 1b) Recherche — Filter + Ergebnisse IMMER sichtbar
**Datei:** `src/pages/admin/ki-office/AdminRecherche.tsx`

**Aenderung (Zeilen 396, 446):** Die `{selectedOrderId && (...)}` Guards um den Filter- und Ergebnistabellen-Block entfernen. Stattdessen:
- Filter-Card immer rendern
- Ergebnistabelle immer rendern
- Bei keiner Auswahl/keinen Ergebnissen: leere Tabellenzeile "Bitte Auftrag auswaehlen oder neue Suche starten"

#### 1c) DB-Bereinigung: "Neue Recherche"-Altlasten
4 Datensaetze in `soat_search_orders` mit Titel-Muster "X — Neue Recherche" loeschen (alle Status=draft, keine Ergebnisse):
- `Acquiary — Neue Recherche`
- `Sales — Neue Recherche`
- `Finance — Neue Recherche`
- `Pet — Neue Recherche`

---

### Block 2: Engine-Kategorie-Schema in contactSchema.ts korrigieren

**Datei:** `src/config/contactSchema.ts`

Aktuell importiert `contactSchema.ts` bereits aus der Engine (`CATEGORY_REGISTRY`, `CATEGORY_GROUPS`). Das ist korrekt. Die Kategorien aus der Engine sind:

**FINANZ:** Family Office, Filialbank, Privatbank, Immobiliardarlehensvermittler (34i), Versicherungsmakler (34d), Finanzanlagenvermittler (34f), Honorar-Berater (34h), Finanzberater allgemein, Kreditvermittler

**PET:** Hundepension, Hundetagesstaette, Hundefriseur, Hundeschule, Zoofachhandel, Tierarzt/Tierklinik, Petsitter/Gassi-Service

**IMMOBILIEN:** Hausverwaltung, Maklerbuero, Steuerberater (Immo)

**ALLGEMEIN:** Offen, Mieter, Eigentuemer, Verwalter, Makler, Bank, Handwerker, Partner, Sonstige

Diese stimmen mit dem Spec ueberein. Es sind exakt die vom User geforderten "Discovery Targets".

Was fehlt: Die User-Hauptkategorien aus dem Prompt explizit im UI hervorheben:
- "Family Offices" (vorhanden als `family_office`)
- "Banken" (vorhanden als `bank_retail`, `bank_private`)
- "Immobilienmakler" (vorhanden als `real_estate_agent`)
- "Immobilienunternehmen" — fehlt, wird als neue Kategorie `real_estate_company` in IMMOBILIEN-Gruppe ergaenzt
- "Finanzdienstleister (Versicherungen, Vertriebe)" (vorhanden als `insurance_broker_34d`, `financial_broker_34f`, `financial_advisor`)
- "Hundepensionen" (vorhanden als `dog_boarding`)

**Aenderung:** Eine neue Kategorie `real_estate_company` (Immobilienunternehmen) in `spec.ts` ergaenzen.

---

### Block 3: Engine erweitern fuer echte Discovery-Faehigkeit

Die aktuellen 12 Pure Functions in `engine.ts` decken Normalisierung, Scoring, Dedupe und Klassifizierung ab. Was fehlt, sind die Discovery-spezifischen Funktionen:

#### 3a) `spec.ts` erweitern

Neue Interfaces und Typen:

| Interface | Zweck |
|-----------|-------|
| `RegionQueueEntry` | Region mit priority_score, cooldown, last_scanned_at (Spec 3.1) |
| `DiscoveryBudget` | Tagesbudget: 70% Top-Regionen, 30% Exploration (Spec 3.2) |
| `ProviderAdapterConfig` | Adapter-Definition: provider_id, rate_limits, quota (Spec 3.3) |
| `DiscoveryJob` | Job-Definition: type, region, category, cursor, status (Spec 8) |
| `OutreachThread` | Kontakt-gebundener Thread: contact_id, messages[], events[] (Spec 7.1) |
| `OutreachMessage` | Einzelne Nachricht im Thread: direction, template_id, delivery_status (Spec 7.1) |
| `CampaignSequence` | Sequenz-Definition: steps[], conditions, quiet_hours (Spec 7.2) |
| `SequenceStep` | Einzel-Step: template_id, delay_hours, stop_conditions (Spec 7.2) |

Neue Konstanten:

| Konstante | Inhalt |
|-----------|--------|
| `TOP_REGIONS_DE` | Top-50 Staedte/Metropolregionen in DE mit Einwohnerzahl fuer Scoring |
| `PROVIDER_CONFIGS` | Google Places + Firecrawl + Apify Adapter-Defaults |
| `DAILY_TARGET` | `{ raw: 800, approved: 500, reviewThreshold: 0.60 }` |
| `OUTREACH_LIMITS` | `{ maxPerDay: 200, quietHoursStart: 20, quietHoursEnd: 8 }` |

#### 3b) `engine.ts` erweitern

Neue Pure Functions:

| Funktion | Input | Output | Beschreibung |
|----------|-------|--------|-------------|
| `scoreRegion(region, history)` | Region + bisherige Scans | `{ priority: number, reason: string }` | Region-Priorisierung (Spec 3.1) |
| `planDailyBudget(regions, target)` | Regionen + Tagesziel | `{ topRegions: [], exploration: [], budget: DiscoveryBudget }` | 70/30 Split (Spec 3.2) |
| `mapProviderCategory(providerType, providerValue)` | Provider-Typ + Rohdaten | `{ primary: string, secondary: string[] }` | Provider-Mapping auf interne Kategorien (Spec 1.2) |
| `validateContactCompleteness(contact)` | Kontaktdaten | `{ isComplete: boolean, missingFields: string[], score: number }` | Prueft ob alle Pflichtfelder (Spec 2) vorhanden |
| `buildOutreachSegment(contacts, filters)` | Kontaktpool + Filter | `ContactRecord[]` | Filtert Kontakte fuer Outreach: approved + nicht DNC + Kategorie/Region (Spec 7.2) |
| `shouldSendNow(step, lastSent, quietHours)` | Step + Historie | `boolean` | Quiet-Hours + Delay-Check (Spec 7.2) |
| `classifyInbound(message, thread)` | Eingehende Nachricht | `{ type: 'reply' | 'bounce' | 'unsubscribe' | 'complaint', confidence: number }` | Inbound-Klassifizierung (Spec 7.4) |
| `applySuppressionRules(contact, event)` | Kontakt + Event | `ComplianceFlags` | DNC-Logik: Unsubscribe/Bounce/Complaint (Spec 7.4) |

#### 3c) Engine-Version auf 2.0.0 setzen

---

## Dateien mit Aenderungen

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/pages/admin/ki-office/AdminKontaktbuch.tsx` | EDIT | Empty-State entfernen, Tabelle immer zeigen |
| `src/pages/admin/ki-office/AdminRecherche.tsx` | EDIT | Filter/Ergebnisse immer sichtbar, selectedOrderId-Guard entfernen |
| `src/engines/marketDirectory/spec.ts` | EDIT | Neue Kategorie `real_estate_company`, Discovery/Outreach-Interfaces, Region-Konstanten |
| `src/engines/marketDirectory/engine.ts` | EDIT | 8 neue Pure Functions (Region-Scoring, Budget-Planung, Outreach-Segment, Suppression) |
| `src/config/contactSchema.ts` | KEINE | Importiert bereits korrekt aus Engine |
| DB | DELETE | 4 "Neue Recherche"-Drafts loeschen |

## Was NICHT angefasst wird

- Hooks (useSoatSearchEngine, useDeskContacts, useResearchEngine, useResearchImport)
- Edge Functions (sot-research-engine etc.)
- E-Mail Agent
- Route-Manifest
- Andere Module

---

## Umsetzungsreihenfolge

1. `spec.ts` erweitern (neue Interfaces + Konstanten + Kategorie)
2. `engine.ts` erweitern (8 neue Pure Functions)
3. `AdminKontaktbuch.tsx` fixen (Tabelle immer sichtbar)
4. `AdminRecherche.tsx` fixen (Filter/Ergebnisse immer sichtbar)
5. DB: 4 Draft-Eintraege loeschen

---

## Abnahme-Kriterien

1. Kontaktbuch zeigt bei 0 Kontakten trotzdem alle 16 Spaltenkoepfe
2. Recherche zeigt Filter + Ergebnistabelle immer (auch ohne Auftragsauswahl)
3. Keine "Neue Recherche"-Titel mehr in der DB
4. Engine hat 20 Pure Functions (12 bestehend + 8 neu)
5. Engine spec.ts definiert Discovery-Interfaces (RegionQueue, DiscoveryBudget, ProviderAdapter)
6. Engine spec.ts definiert Outreach-Interfaces (OutreachThread, CampaignSequence)
7. Neue Kategorie `real_estate_company` (Immobilienunternehmen) ist in Taxonomie
8. Keine Business-Logik in UI-Komponenten (nur Import + Aufruf der Engine)
