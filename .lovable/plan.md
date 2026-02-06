
# MOD-12 AkquiseManager + Zone-1 Acquiary + MOD-08 Mandat Entry

## Implementierungsplan

---

## 1. Übersicht & Golden Path

Der "Akquise-Service" ist ein eigenständiger Workflow (strikt getrennt von MOD-04):

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GOLDEN PATH: AKQUISE-SERVICE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ZONE 2 (User)        ZONE 1 (Admin)           ZONE 2 (Manager)            │
│  ──────────────       ──────────────           ─────────────────            │
│                                                                             │
│  MOD-08               /admin/acquiary           MOD-12                      │
│  ┌──────────┐        ┌─────────────┐           ┌──────────────┐            │
│  │ Mandat   │───────▶│   Inbox     │──────────▶│ Pending      │            │
│  │ erstellen│        │   ↓         │           │ Acceptance   │            │
│  └──────────┘        │ Zuweisung   │           │   ↓          │            │
│       ↓              │   ↓         │           │ Split Gate   │            │
│  ┌──────────┐        │ Audit/Needs │           │   ↓          │            │
│  │ Status/  │◀───────│ Routing     │◀──────────│ Operations:  │            │
│  │ Timeline │        └─────────────┘           │ Sourcing     │            │
│  │ Delivery │                                  │ Outreach     │            │
│  └──────────┘                                  │ Inbound      │            │
│                                                │ Analysis     │            │
│                                                │ Delivery     │            │
│                                                └──────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Datenbank-Schema

### 2.1 Neue Tabellen

**`acq_mandates`** — Akquise-Mandate (Haupt-Entity)
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | Primary Key |
| code | text | z.B. "ACQ-2024-0001" |
| tenant_id | uuid | FK → organizations |
| created_by_user_id | uuid | FK → auth.users |
| client_display_name | text | Nur nach Gate sichtbar |
| search_area | jsonb | Region/Polygon |
| asset_focus | text[] | z.B. ["MFH", "ETW"] |
| price_min / price_max | numeric | Preisbereich |
| yield_target | numeric | Zielrendite % |
| exclusions | text | Ausschlüsse |
| notes | text | Freitext |
| status | text | draft → submitted_to_zone1 → assigned → active → paused → closed |
| assigned_manager_user_id | uuid | FK → auth.users |
| assigned_at | timestamptz | Zuweisung |
| split_terms_confirmed_at | timestamptz | Gate-Bestätigung |
| split_terms_confirmed_by | uuid | Manager der bestätigt hat |
| profile_text_email | text | KI-generiertes Ankaufsprofil (kurz) |
| profile_text_long | text | KI-generiertes Ankaufsprofil (lang) |
| profile_keywords | text[] | Suchbegriffe |
| created_at / updated_at | timestamptz | Timestamps |

**`acq_mandate_events`** — Audit Trail
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| mandate_id | uuid | FK → acq_mandates |
| event_type | text | created, submitted, assigned, accepted, email_sent, etc. |
| actor_id | uuid | Wer hat die Aktion ausgelöst |
| payload | jsonb | Zusätzliche Details |
| created_at | timestamptz | Zeitstempel |

**`contact_staging`** — Staging für externe Kontakte
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| tenant_id | uuid | FK → organizations |
| mandate_id | uuid | FK → acq_mandates (optional) |
| source | text | apollo, apify, firecrawl, manual |
| source_id | text | Externe ID |
| company_name | text | |
| first_name / last_name | text | |
| email / phone | text | |
| website_url | text | |
| role_guess | text | Makler, Eigentümer, etc. |
| service_area | text | Region |
| quality_score | numeric | 0-100 |
| dedupe_key | text | Für Duplikat-Erkennung |
| status | text | pending, approved, rejected |
| approved_at | timestamptz | |
| approved_by | uuid | |
| enrichment_data | jsonb | Firecrawl/AI Anreicherung |
| created_at / updated_at | timestamptz | |

**`user_contact_links`** — Verknüpfung User ↔ MasterContact
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| user_id | uuid | AkquiseManager |
| contact_id | uuid | FK → master_contacts |
| folder | text | z.B. "Mandat ACQ-2024-0001" |
| in_outreach_queue | boolean | Für Outreach markiert |
| created_at | timestamptz | |

**`acq_outbound_messages`** — Versendete System-Mails
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| mandate_id | uuid | FK → acq_mandates |
| contact_id | uuid | FK → master_contacts |
| resend_message_id | text | Resend API ID |
| template_code | text | Welche Vorlage |
| subject | text | Betreff |
| status | text | queued, sent, delivered, bounced, replied |
| sent_at | timestamptz | |
| opened_at | timestamptz | |
| bounced_at | timestamptz | |
| routing_token | text | Für Inbound-Zuordnung |
| created_at | timestamptz | |

**`acq_inbound_messages`** — Eingehende E-Mails
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| mandate_id | uuid | FK → acq_mandates (nullable) |
| contact_id | uuid | FK → master_contacts (nullable) |
| resend_inbound_id | text | Resend Webhook ID |
| from_email | text | Absender |
| subject | text | Betreff |
| body_text | text | Text-Inhalt |
| body_html | text | HTML-Inhalt |
| attachments | jsonb | [{filename, storage_path, mime_type}] |
| routing_method | text | token, email_match, thread, ai_fallback, manual |
| routing_confidence | numeric | 0-100 |
| needs_routing | boolean | In Zone-1 Queue |
| routed_at | timestamptz | Wann zugeordnet |
| routed_by | uuid | Wer zugeordnet hat |
| received_at | timestamptz | |
| created_at | timestamptz | |

**`acq_offers`** — Exposés/Angebote
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| mandate_id | uuid | FK → acq_mandates |
| source_type | text | inbound_email, upload, manual, portal_scrape |
| source_contact_id | uuid | FK → master_contacts (optional) |
| source_inbound_id | uuid | FK → acq_inbound_messages (optional) |
| title | text | Objektbezeichnung |
| address | text | Adresse |
| price_asking | numeric | Angebotspreis |
| yield_indicated | numeric | Angebotene Rendite |
| units_count | integer | Anzahl Einheiten |
| area_sqm | numeric | Fläche |
| status | text | new, analyzing, analyzed, presented, accepted, rejected |
| notes | text | Freitext |
| extracted_data | jsonb | KI-Extraktion aus PDF |
| created_at / updated_at | timestamptz | |

**`acq_offer_documents`** — Dokumente zu Offers
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| offer_id | uuid | FK → acq_offers |
| document_type | text | expose, photos, grundbuch, etc. |
| file_name | text | |
| storage_path | text | Supabase Storage |
| mime_type | text | |
| created_at | timestamptz | |

**`acq_analysis_runs`** — Analysen (KI Research, GeoMap, Kalkulation)
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| offer_id | uuid | FK → acq_offers |
| run_type | text | ai_research, geomap, calc_aufteiler, calc_bestand |
| status | text | pending, running, completed, failed |
| input_data | jsonb | Eingabe-Parameter |
| output_data | jsonb | Ergebnis |
| engine_version | text | Versionierung |
| started_at / completed_at | timestamptz | |
| created_at | timestamptz | |

---

## 3. Routen-Manifest Erweiterungen

### 3.1 Zone 1 — Acquiary (bereits teilweise vorhanden)

```typescript
// In routesManifest.ts → zone1Admin.routes erweitern:
{ path: "acquiary", component: "AcquiaryDashboard", title: "Acquiary" },
{ path: "acquiary/inbox", component: "AcquiaryInbox", title: "Inbox" },
{ path: "acquiary/assignments", component: "AcquiaryAssignments", title: "Zuweisungen" },
{ path: "acquiary/mandates", component: "AcquiaryMandates", title: "Mandate" },
{ path: "acquiary/audit", component: "AcquiaryAudit", title: "Audit" },
{ path: "acquiary/needs-routing", component: "AcquiaryNeedsRouting", title: "Needs Routing" },
```

### 3.2 Zone 2 — MOD-08 Investment-Suche

```typescript
// Erweiterung dynamic_routes in MOD-08:
dynamic_routes: [
  { path: "mandat/neu", component: "MandatCreateWizard", title: "Neues Mandat" },
  { path: "mandat/:mandateId", component: "MandatDetail", title: "Mandat-Details", dynamic: true },
]
```

### 3.3 Zone 2 — MOD-12 AkquiseManager

```typescript
// Erweiterung dynamic_routes in MOD-12:
dynamic_routes: [
  { path: "mandate/:mandateId", component: "AkquiseMandateDetail", title: "Mandat-Workbench", dynamic: true },
]
```

---

## 4. Komponenten-Struktur

### 4.1 Zone 1: Acquiary

```text
src/pages/admin/
├── Acquiary.tsx                    # Haupt-Router (analog FutureRoom.tsx)
└── acquiary/
    ├── index.ts
    ├── AcquiaryInbox.tsx           # Neue Mandate (submitted_to_zone1)
    ├── AcquiaryAssignments.tsx     # Zuweisung an Manager
    ├── AcquiaryMandates.tsx        # Alle Mandate Übersicht
    ├── AcquiaryAudit.tsx           # Event-Timeline
    └── AcquiaryNeedsRouting.tsx    # Inbound ohne Zuordnung
```

### 4.2 Zone 2: MOD-08 Mandat Tab

```text
src/pages/portal/investments/
├── MandatTab.tsx                   # Liste + Create Button
├── MandatCreateWizard.tsx          # Wizard für Mandat-Erstellung
└── MandatDetail.tsx                # Status/Timeline/Deliveries (Read-Only)
```

### 4.3 Zone 2: MOD-12 AkquiseManager

```text
src/pages/portal/akquise-manager/
├── AkquiseDashboard.tsx            # Übersicht: Pending + Active
├── AkquiseKunden.tsx               # Kontakt-Verwaltung
├── AkquiseMandate.tsx              # Mandats-Liste
├── AkquiseMandateDetail.tsx        # Workbench mit Tabs
│   ├── components/
│   │   ├── GatePanel.tsx           # Split-Bestätigung vor Aktivierung
│   │   ├── SourcingTab.tsx         # Apollo/Apify/Firecrawl
│   │   ├── OutreachTab.tsx         # E-Mail Queue + Versand
│   │   ├── InboundTab.tsx          # Eingehende Nachrichten/Exposés
│   │   ├── AnalysisTab.tsx         # KI Research + GeoMap + Rechner
│   │   └── DeliveryTab.tsx         # Finale Präsentation an Kunden
└── AkquiseTools.tsx                # Standalone-Tools
```

---

## 5. Hooks & API

### 5.1 Neue Hooks (src/hooks/)

```typescript
// useAcqMandate.ts
export function useAcqMandates()                    // Zone 1: alle Mandate
export function useAcqMandatesForManager()          // MOD-12: zugewiesene
export function useAcqMandate(id)                   // Einzelnes Mandat
export function useCreateAcqMandate()               // MOD-08: erstellen
export function useAssignAcqManager()               // Zone 1: zuweisen
export function useAcceptAcqMandate()               // MOD-12: Gate bestätigen
export function useUpdateAcqMandateStatus()         // Status ändern

// useAcqContacts.ts
export function useContactStaging(mandateId)        // Staging-Kontakte
export function useApproveContact()                 // Staging → Master
export function useOutreachQueue(mandateId)         // Outreach-Liste
export function useSendOutreach()                   // E-Mail senden

// useAcqOffers.ts
export function useAcqOffers(mandateId)             // Offers für Mandat
export function useCreateOffer()                    // Manuell/Upload
export function useAcqAnalysisRuns(offerId)         // Analysen
export function useRunAnalysis()                    // KI/GeoMap/Calc starten
```

---

## 6. Edge Functions

### 6.1 Neue Functions

| Function | Zweck |
|----------|-------|
| `sot-acq-outbound` | Resend API: System-Mail senden mit Routing-Token |
| `sot-acq-inbound-webhook` | Resend Inbound Webhook: deterministische Zuordnung |
| `sot-acq-profile-generate` | Lovable AI: Ankaufsprofil generieren |
| `sot-acq-contact-enrich` | Lovable AI: Contact-Staging anreichern |
| `sot-acq-offer-extract` | Lovable AI: Exposé-Daten aus PDF extrahieren |
| `sot-acq-ai-research` | Lovable AI: Standort-/Objektanalyse |
| `sot-apollo-search` | Apollo API Proxy |
| `sot-apify-portal-job` | Apify Webhook/Job-Start |
| `sot-firecrawl-scrape` | Firecrawl API Proxy |
| `sot-geomap-snapshot` | GeoMap KPI Abruf |

---

## 7. Implementierungs-Phasen (MVP)

### Phase 1: Datenbank + Basis-UI (Prio 1)
1. Migration: `acq_mandates`, `acq_mandate_events` erstellen
2. RLS-Policies für tenant_id + role-based access
3. MOD-08 MandatTab: Liste + Create Wizard
4. Zone-1 Acquiary: Inbox + Assignments
5. Hooks: useAcqMandates, useCreateAcqMandate, useAssignAcqManager

### Phase 2: MOD-12 Gate + Operations (Prio 1)
1. AkquiseDashboard: Pending + Active Mandate
2. AkquiseMandateDetail: Gate-Panel (Split-Bestätigung)
3. Status-Workflow: assigned → active
4. Audit-Events schreiben

### Phase 3: Contact Staging + Outreach (Prio 2)
1. Migration: `contact_staging`, `user_contact_links`, `acq_outbound_messages`
2. SourcingTab: Manuelle Kontakt-Erfassung + Approval-Flow
3. OutreachTab: Queue + Template-Auswahl
4. Edge Function: sot-acq-outbound (Resend API)

### Phase 4: Inbound + Routing (Prio 2)
1. Migration: `acq_inbound_messages`
2. Edge Function: sot-acq-inbound-webhook
3. InboundTab: Nachrichtenliste + "Convert to Offer"
4. Zone-1 Needs Routing: Fallback-Queue

### Phase 5: Offers + Analysis (Prio 3)
1. Migration: `acq_offers`, `acq_offer_documents`, `acq_analysis_runs`
2. Upload-Flow: PDF → Storage → Extraction
3. AnalysisTab: KI Research + GeoMap + Rechner (Placeholder)
4. Edge Functions: sot-acq-offer-extract, sot-acq-ai-research

### Phase 6: Externe Integrationen (Prio 4)
1. Apollo: sot-apollo-search + Staging-Import
2. Apify: Portal-Scraping Jobs
3. Firecrawl: Website-Mining
4. GeoMap: KPI-Snapshots

---

## 8. Workflow-Steps für MOD-12

```typescript
// WorkflowSubbar.tsx erweitern:
export const AKQUISE_MANAGER_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'gate', label: 'Annahme', path: 'mandate/:id' },           // Split-Gate
  { id: 'sourcing', label: 'Sourcing', path: 'mandate/:id/sourcing' },
  { id: 'outreach', label: 'Outreach', path: 'mandate/:id/outreach' },
  { id: 'inbound', label: 'Eingang', path: 'mandate/:id/inbound' },
  { id: 'analysis', label: 'Analyse', path: 'mandate/:id/analysis' },
  { id: 'delivery', label: 'Delivery', path: 'mandate/:id/delivery' },
];
```

---

## 9. RBAC & Gating

| Rolle | Zone | Zugriff |
|-------|------|---------|
| `platform_admin` | Zone 1 | Voller Zugriff auf /admin/acquiary/* |
| `normal user` | Zone 2 | MOD-08: Mandat erstellen + Status sehen |
| `akquise_manager` | Zone 2 | MOD-12: Zugewiesene Mandate bearbeiten |

**Gate-Regel in MOD-12:**
- Mandant-Name (`client_display_name`) wird erst sichtbar nach `split_terms_confirmed_at IS NOT NULL`
- Vor Gate: nur Mandat-Code + Suchkriterien sichtbar

---

## 10. System-Mail Routing-Token

Jede Outbound-Mail enthält:
- **Reply-To:** `acq+{mandate_id}+{contact_id}@incoming.systemofatown.de`
- **Custom Header:** `X-Acq-Token: {mandate_id}:{contact_id}:{signature}`

Inbound-Webhook prüft:
1. Reply-To Parser → mandate_id + contact_id
2. From-Email Match → master_contacts.email
3. Thread-ID Match → References/In-Reply-To
4. AI Fallback → Lovable AI Klassifikation
5. Confidence < 80% → needs_routing = true

---

## 11. Acceptance Criteria

| # | Szenario | Erwartung |
|---|----------|-----------|
| A | User erstellt Mandat in MOD-08 | Status = submitted_to_zone1, sichtbar in Acquiary Inbox |
| B | Admin weist Manager zu | Mandat erscheint in MOD-12 "Pending Acceptance" |
| C | Manager bestätigt Split | Status = active, client_display_name sichtbar |
| D | Manager fügt Kontakt manuell hinzu | contact_staging → approval → master_contacts |
| E | Manager sendet E-Mail | acq_outbound_messages erstellt, Resend API aufgerufen |
| F | Antwort kommt rein | acq_inbound_messages mit korrekter mandate_id |
| G | Inbound ohne Token | needs_routing = true, sichtbar in Zone-1 Needs Routing |
| H | Manager lädt Exposé hoch | acq_offers + acq_offer_documents erstellt |
| I | KI-Analyse gestartet | acq_analysis_runs mit output_data |

---

## 12. Dateien-Übersicht (Neu zu erstellen)

```text
Datenbank:
├── supabase/migrations/xxxxxxxx_acq_mandates.sql
├── supabase/migrations/xxxxxxxx_acq_contacts.sql
├── supabase/migrations/xxxxxxxx_acq_offers.sql

Zone 1 (Admin):
├── src/pages/admin/Acquiary.tsx
├── src/pages/admin/acquiary/
│   ├── index.ts
│   ├── AcquiaryInbox.tsx
│   ├── AcquiaryAssignments.tsx
│   ├── AcquiaryMandates.tsx
│   ├── AcquiaryAudit.tsx
│   └── AcquiaryNeedsRouting.tsx

Zone 2 (Portal MOD-08):
├── src/pages/portal/investments/
│   ├── MandatTab.tsx (erweitern)
│   ├── MandatCreateWizard.tsx
│   └── MandatDetail.tsx

Zone 2 (Portal MOD-12):
├── src/pages/portal/akquise-manager/ (erweitern)
│   ├── AkquiseDashboard.tsx (erweitern)
│   ├── AkquiseKunden.tsx (erweitern)
│   ├── AkquiseMandate.tsx (erweitern)
│   ├── AkquiseMandateDetail.tsx
│   └── components/
│       ├── GatePanel.tsx
│       ├── SourcingTab.tsx
│       ├── OutreachTab.tsx
│       ├── InboundTab.tsx
│       ├── AnalysisTab.tsx
│       └── DeliveryTab.tsx

Hooks:
├── src/hooks/useAcqMandate.ts
├── src/hooks/useAcqContacts.ts
└── src/hooks/useAcqOffers.ts

Edge Functions:
├── supabase/functions/sot-acq-outbound/
├── supabase/functions/sot-acq-inbound-webhook/
├── supabase/functions/sot-acq-profile-generate/
├── supabase/functions/sot-acq-contact-enrich/
├── supabase/functions/sot-acq-offer-extract/
└── supabase/functions/sot-acq-ai-research/

Types:
└── src/types/acquisition.ts

Manifest:
└── src/manifests/routesManifest.ts (erweitern)
```

---

## Technische Hinweise

1. **Analog-Muster:** FutureRoom.tsx + futureroom/* dient als Vorlage für Acquiary
2. **Workflow-Subbar:** AKQUISE_MANAGER_WORKFLOW_STEPS analog zu FINANCE_MANAGER_WORKFLOW_STEPS
3. **ModuleHowItWorks:** moduleContents['MOD-12'] bereits vorhanden, ggf. anpassen
4. **RLS-Policies:** tenant_id + assigned_manager_user_id für MOD-12 Isolation
5. **Resend-API:** Secrets für RESEND_API_KEY müssen konfiguriert werden
6. **Apollo/Apify/Firecrawl:** API-Keys als Secrets, zunächst Placeholder-UI

