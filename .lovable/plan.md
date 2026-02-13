

# MOD-14 Recherche — Redesign v1.0
## Widget-basiert, Inline-Flow, Async Jobs, Kontaktbuch-Uebergabe

---

## 1. Ausgangslage

Die aktuelle Recherche-Seite (`/portal/communication-pro/recherche`) besteht aus 3 nebeneinanderliegenden Panels (ResearchFreeCard, ResearchProCard, ResearchCandidatesTray) mit hardcoded Demo-Daten, keiner Auftragslogik, keinem Billing-Gate und einem Layout, das auf schmalen Screens horizontal ueberlaeuft.

**Bestehende DB-Tabellen:** `research_sessions` und `research_results` existieren bereits (Session-basiert, nicht Order-basiert). Die `contacts`-Tabelle ist vollstaendig vorhanden mit tenant_id, public_id, email, phone, company, city, etc.

**Verfuegbare Connectoren:** Firecrawl ist als Connector im Workspace vorhanden (nicht verlinkt). Kein Apollo/Epify-Key konfiguriert.

---

## 2. Architektur-Uebersicht

```text
+------------------------------------------------------------------+
|  ResearchTab (neue Seite, ersetzt altes 3-Panel-Layout)          |
|                                                                  |
|  [+Neu] [Auftrag A ■] [Auftrag B ●] [Auftrag C ✓]              |
|  WidgetGrid (horizontal, responsive wrap)                        |
|                                                                  |
|  ┌────────────────────────────────────────────────────────────┐  |
|  │  ResearchOrderInlineFlow (aktiver Auftrag)                 │  |
|  │                                                            │  |
|  │  Section 1: Auftrag definieren (Intent + ICP)              │  |
|  │  Section 2: Trefferlimit & Kosten (HARD GATE)              │  |
|  │  Section 3: Provider & Quellen (Toggle Cards)              │  |
|  │  Section 4: KI-Assistent (4 Action Buttons)                │  |
|  │  Section 5: Consent & Start                                │  |
|  │  Section 6: Ergebnisse (Review + Bulk Import)              │  |
|  └────────────────────────────────────────────────────────────┘  |
+------------------------------------------------------------------+
```

---

## 3. Datenbank-Aenderungen

### 3a. Neue Tabelle: `research_orders`

| Spalte | Typ | Default | Beschreibung |
|--------|-----|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| tenant_id | uuid FK organizations | NOT NULL | Mandant |
| created_by | uuid FK profiles | NOT NULL | Ersteller |
| title | text | NULL | Auftragstitel |
| intent_text | text | NOT NULL | Suchintent Freitext |
| icp_json | jsonb | '{}' | {branche, region, role, keywords, domain} |
| output_type | text | 'contacts' | 'contacts', 'companies', 'both' |
| provider_plan_json | jsonb | '{}' | {firecrawl: bool, epify: bool, apollo: bool, settings: {}} |
| max_results | int | 25 | Hartes Trefferlimit |
| cost_estimate | numeric | 0 | Geschaetzte Kosten |
| cost_cap | numeric | 0 | Bestaetigte Obergrenze |
| cost_spent | numeric | 0 | Tatsaechlich verbraucht |
| status | text | 'draft' | draft, queued, running, needs_review, done, failed, cancelled |
| results_count | int | 0 | Anzahl Treffer |
| consent_confirmed | bool | false | DSGVO/Business-Consent |
| ai_summary_md | text | NULL | KI-Zusammenfassung |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

RLS: tenant_id = auth.jwt()->'user_metadata'->>'tenant_id' (SELECT, INSERT, UPDATE)

### 3b. Neue Tabelle: `research_order_results`

| Spalte | Typ | Default | Beschreibung |
|--------|-----|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| order_id | uuid FK research_orders | NOT NULL | Zugehoeriger Auftrag |
| tenant_id | uuid FK organizations | NOT NULL | Mandant |
| entity_type | text | 'person' | person, company |
| full_name | text | NULL | |
| first_name | text | NULL | |
| last_name | text | NULL | |
| role | text | NULL | Titel/Rolle |
| seniority | text | NULL | |
| company_name | text | NULL | |
| domain | text | NULL | |
| location | text | NULL | |
| email | text | NULL | |
| phone | text | NULL | |
| linkedin_url | text | NULL | |
| source_provider | text | NOT NULL | firecrawl, epify, apollo, manual |
| source_refs_json | jsonb | '{}' | URLs, Provider-IDs |
| confidence_score | int | 0 | 0..100 |
| raw_json | jsonb | NULL | Provider-Payload-Snapshot |
| status | text | 'candidate' | candidate, accepted, rejected, imported |
| imported_contact_id | uuid FK contacts | NULL | Nach Import: Kontakt-ID |
| created_at | timestamptz | now() | |

RLS: tenant_id = auth.jwt()->'user_metadata'->>'tenant_id'

### 3c. Neue Tabelle: `research_billing_log`

| Spalte | Typ | Default |
|--------|-----|---------|
| id | uuid | gen_random_uuid() |
| order_id | uuid FK research_orders | NOT NULL |
| tenant_id | uuid FK organizations | NOT NULL |
| provider | text | NOT NULL |
| units | int | 1 |
| cost | numeric | 0 |
| created_at | timestamptz | now() |

RLS: tenant_id-scoped (SELECT only)

### 3d. Realtime aktivieren

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_order_results;
```

---

## 4. Edge Functions (Backend)

### 4a. `sot-research-run-order` (Orchestrator)

- Empfaengt `{ order_id }`
- Validiert: status=queued, max_results gesetzt, consent_confirmed
- Fuehrt Provider-Plan sequenziell/parallel aus:
  1. Apollo/Epify fetch (wenn aktiviert) -- Stub, Feature-Flag
  2. Firecrawl extract (Impressum/Team-Seiten crawlen)
  3. Dedupe + Merge
  4. KI Scoring (Confidence via Lovable AI / Gemini Flash)
  5. Finalize: Status auf done oder needs_review
- Stop Conditions: results_count >= max_results ODER cost_spent >= cost_cap ODER Provider-Error
- Idempotent via order_id + provider + cursor-hash

### 4b. `sot-research-firecrawl-extract` (Provider Worker)

- Nutzt Firecrawl Connector (muss verlinkt werden)
- Crawlt target domains / query seeds
- Extrahiert Kontakte aus Impressum/Teamseiten via KI (Gemini Flash)
- Schreibt Ergebnisse in `research_order_results`
- Schreibt Kosten in `research_billing_log`

### 4c. `sot-research-ai-assist` (KI-Helfer)

- Endpunkt fuer 4 KI-Aktionen:
  - `suggest_filters`: Intent -> ICP-JSON (Branche, Keywords, Region)
  - `optimize_plan`: Intent + ICP -> Provider-Empfehlung
  - `score_results`: Ergebnisse bewerten (Confidence, Red Flags)
  - `summarize`: Ergebnis-Zusammenfassung + naechste Schritte
- Nutzt Lovable AI Gateway (Gemini 2.5 Flash), kein externer API-Key noetig

### 4d. `sot-research-import-contacts` (Kontaktbuch-Import)

- Empfaengt `{ order_id, result_ids[], duplicate_policy }`
- Dedupe-Matching: email -> phone -> name+company+city
- Bei Match: Option update oder skip
- Upsert in `contacts`-Tabelle
- Setzt `research_order_results.status` -> 'imported' + `imported_contact_id`
- Schreibt Audit Event

---

## 5. Frontend-Komponenten

### 5a. `ResearchTab.tsx` (komplett neu)

Ersetzt das alte 3-Panel-Layout. Struktur:
- WidgetGrid oben (research_orders laden)
- ResearchOrderInlineFlow darunter (aktiver Auftrag)
- max-w-5xl, responsive, kein horizontales Scrollen

### 5b. `ResearchOrderWidget.tsx`

Widget-Card fuer WidgetGrid:
- Titel (gekuerzt), Status-Badge, Provider-Icons, max_results, results_count
- Klick setzt aktiven Auftrag

### 5c. `ResearchOrderInlineFlow.tsx`

6 Sections als vertikaler, scrollbarer Flow:
- Section 1-5 sichtbar im Status `draft`
- Section 6 sichtbar ab Status `done` / `needs_review`
- Sections 1-5 collapsed/readonly wenn Status != draft

### 5d. `ResearchResultsTable.tsx`

Full-width responsive Tabelle:
- Spalten: Name, Firma, Rolle, Ort, Kontaktfelder, Quelle, Confidence, Select-Checkbox
- Sticky Bulk-Action-Bar (Import, CSV Export)
- Needs-Review-Queue: Treffer mit fehlender Email oder Confidence < 60 markiert

### 5e. Hooks

- `useResearchOrders()`: CRUD + Realtime-Subscription auf research_orders
- `useResearchResults(orderId)`: Ergebnisse + Realtime
- `useResearchAI()`: KI-Assist-Aktionen
- `useResearchImport()`: Kontaktbuch-Import mit Dedupe

### 5f. Zu loeschende Dateien

- `ResearchFreeCard.tsx`
- `ResearchProCard.tsx`
- `ResearchCandidatesTray.tsx`
- `CreditConfirmModal.tsx`
- `CandidatePreviewDrawer.tsx`

---

## 6. Connector-Setup

**Firecrawl** muss vor Nutzung mit dem Projekt verlinkt werden (Connector `firecrawl`, Connection `std_01ke3b71ryfhfvfx8gj42g4qn8`). Dies wird als erster Schritt durchgefuehrt.

**Apollo / Epify**: Werden als Feature-Flag implementiert (`provider_plan_json`). Toggle-Cards in der UI sind sichtbar, aber deaktiviert mit Hinweis "API-Key in Einstellungen hinterlegen". Kein Blocker fuer MVP.

---

## 7. Mini Golden Path: GP_RESEARCH_TO_CONTACTS_V1

Kein eigenstaendiger Golden Path, sondern ein Status-Validator:
- Ein Order gilt als "erfolgreich abgeschlossen" nur wenn:
  - (a) `status = done` UND `results_count > 0`, ODER
  - (b) mindestens 1 Result hat `status = imported`
- CTA-Logik: Bei `done` ohne Imports zeigt die UI einen prominenten "Kontakte uebernehmen"-Hinweis
- Wird als einfache Utility-Funktion implementiert, keine neue Engine-Registrierung

---

## 8. Status-Machine

```text
  [draft] --Start--> [queued] --Worker--> [running]
                                             |
                              +--------------+--------------+
                              |              |              |
                         [done]     [needs_review]     [failed]
                              |              |
                              +--> [cancelled] <--+
```

Uebergaenge:
- draft -> queued: User klickt "Start" (max_results + consent required)
- queued -> running: Edge Function uebernimmt
- running -> done: Alle Provider fertig, results_count > 0
- running -> needs_review: Ergebnisse vorhanden, aber Confidence-Issues
- running -> failed: Provider-Errors oder cost_cap erreicht ohne Ergebnisse
- done/needs_review -> cancelled: User bricht ab

---

## 9. Responsive / CI

- Container: `max-w-5xl mx-auto`
- WidgetGrid: Standard 4-col Pattern (bestehendes `WidgetGrid` + `WidgetCell`)
- Ergebnisliste: full-width, responsive Tabelle mit horizontalem Scroll nur innerhalb der Tabelle
- Getestet auf 1366x768 ohne horizontale Scrollbar

---

## 10. Implementierungs-Reihenfolge

| Schritt | Was | Abhaengigkeit |
|---------|-----|--------------|
| 1 | Firecrawl Connector verlinken | - |
| 2 | DB Migration (3 Tabellen + Realtime) | - |
| 3 | Edge Function: `sot-research-ai-assist` | Lovable AI |
| 4 | Edge Function: `sot-research-firecrawl-extract` | Firecrawl Connector |
| 5 | Edge Function: `sot-research-run-order` (Orchestrator) | Steps 3+4 |
| 6 | Edge Function: `sot-research-import-contacts` | contacts-Tabelle |
| 7 | Frontend Hooks (useResearchOrders, useResearchResults, etc.) | Step 2 |
| 8 | Frontend UI (ResearchTab, Widgets, InlineFlow, ResultsTable) | Step 7 |
| 9 | Alte Dateien loeschen (5 Dateien) | Step 8 |
| 10 | E2E-Test auf 1366x768 | Step 9 |

---

## 11. Akzeptanzkriterien

- Keine horizontale Scrollbar bei 1366x768
- Widget-Grid oben, Inline-Flow darunter, alles auf einer Seite
- "+" erstellt Draft, Start erzeugt RUNNING, danach wieder "+" verfuegbar
- Start ohne max_results + Consent nicht moeglich (Button deaktiviert)
- Auftrag stoppt bei max_results oder cost_cap
- Apollo komplett ausblendbar wenn disabled
- Bulk "Ins Kontaktbuch" fuehrt zu Upsert mit Dedupe
- Import markiert Results als imported + schreibt Audit Event
- KI startet keine kostenpflichtigen Schritte ohne User-CTA

