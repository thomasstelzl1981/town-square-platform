# MOD-03 — DMS (Posteingang + Storage Vault)

**Spec Version:** v1.0  
**Status:** READY FOR IMPLEMENTATION  
**Date:** 2026-01-25  
**Zone:** 2 (User Portal, tenant-scoped)  
**Base Route:** `/portal/dms`  
**Entry:** `/portal/dms` (Dashboard)

---

## 0) Route-Änderung (Binding)

### ALT
- Route: `/portal/posteingang`
- Unterpunkte: Dashboard, Eingang, Zuordnung, Archiv, Einstellungen

### NEU
- **Name (Menü + Modul):** DMS
- **Route-Basis:** `/portal/dms`
- **Einstieg:** `/portal/dms` (Dashboard)
- **Unterpunkte:**
  - Dashboard → `/portal/dms`
  - Storage → `/portal/dms/storage`
  - Posteingang → `/portal/dms/post`
  - Sortieren → `/portal/dms/sort`
  - Einstellungen → `/portal/dms/dmssettings`

**Grund:** Konsistente Navigation, Storage-Integration freeze-konform in MOD-03, saubere Trennung von Vault/Index, Inbound, Zuordnung, Consent/Connectors.

---

## 1) Module Principles (FROZEN)

| # | Principle | Description |
|---|-----------|-------------|
| P1 | Single Vault per Tenant | Files in Supabase Storage private bucket. "Move" never moves bytes. |
| P2 | Folder Tree = Index View | Folders are `storage_nodes` in DB tree. Default system tree seeded. |
| P3 | Consent-Gated Extraction | Extraction NEVER automatic. User must confirm (cost implications). |
| P4 | Worker-Driven Architecture | Long-running tasks run in worker. UI only enqueues jobs. |
| P5 | Confidence Gate + Review | Auto-linking only if confidence ≥ threshold, else Needs Review. |

---

## 2) Information Architecture / Nav (Binding)

```
Menu Item: DMS
Base: /portal/dms

0) Dashboard      → /portal/dms
1) Storage        → /portal/dms/storage
2) Posteingang    → /portal/dms/post
3) Sortieren      → /portal/dms/sort
4) Einstellungen  → /portal/dms/dmssettings

Optional (internal/ops only):
- Jobs/Status     → /portal/dms/jobs
```

---

## 3) Router / Screen Specs (Detail)

### 3.1 Dashboard (`/portal/dms`)

**Purpose:** Entry point, overview, quick actions.

**Widgets (MVP):**
- **KPIs:** Storage used (GB), Total docs, New in Post, Needs Review count, Extractions running/failed
- **Recent Activity:** Last uploads/imports/extractions (from audit_log)
- **Quick Actions:**
  - Upload (opens picker → uploads to Storage Inbox)
  - Make readable (opens estimate+consent, requires selection)
  - Connect data room (deep-link to settings)

### 3.2 Storage (`/portal/dms/storage`)

**Layout (3 panels):**
- **Left:** Folder tree (system + custom) with counters
- **Middle:** Document list (filters, search, bulk actions)
- **Right:** Document detail (preview, metadata, extraction status, linking, actions)

**Core Features:**
- Upload via Storage UI + KI-Stripe (dropzone): default node = inbox
- Move: only updates `document_links.node_id`, never moves file bytes
- Preview/Download via signed URLs (short TTL)
- Filters: node_id, status, source, has_extraction, object_id, date range, mime_type
- Bulk actions: Move, Archive, Soft Delete, Extract batch

**System Nodes (seeded, non-deletable):**
- `inbox`
- `immobilien`
- `portfolio_unterlagen`
- `finanzierung`
- `bonitaetsunterlagen`
- `sonstiges`
- `needs_review`
- `archive`

**Custom Nodes:**
- Create/rename/move; delete only if empty and authorized

**Data Room Connectors:**
- Show connected providers: Dropbox, OneDrive, Google Drive
- "Start import" opens import modal
- Result: import_job queued → worker copies files into vault → links to inbox

### 3.3 Posteingang (`/portal/dms/post`)

**Purpose:** Digital mail inbox based on Caya cockpit UX patterns.

**Inbound Flow:**
```
Mail from Caya → Zone 1 ingestion → persisted into tenant vault + documents registry → visible in /portal/dms/post
```

**UI Features (MVP):**
- List of inbound items / documents
- Actions:
  - Download (signed URL)
  - Forward/Share (MVP optional)
  - "Start sorting" → pushes item into Sortieren queue
- Status: `new` | `classified` | `needs_review` | `archived`

### 3.4 Sortieren (`/portal/dms/sort`)

**Purpose:** Operational assignment of documents to folder nodes and optional domain entities.

**Input Queues:**
- Primary: from Posteingang via "Start sorting"
- Secondary: from Storage bulk selection

**Features:**
- Show suggestions (auto-classification) with `link_reason` + `confidence`
- Confidence gates:
  - ≥ 0.85 → may auto-link (if enabled)
  - 0.60–0.85 → `needs_review` (store suggestion)
  - < 0.60 → stays inbox/new
- User actions: Accept | Correct | Reject
- Every decision audited

### 3.5 Einstellungen (`/portal/dms/dmssettings`)

**Sections:**

**A) Extraction / Unstructured (Credits, Consent)**
- Activation toggle
- Consent rules (default OFF)
- Engines: `unstructured_fast`, `unstructured_hires`
- Pricing display (placeholders)
- Quotas and usage

**B) Connectors / Authenticators**
- Providers (MVP): Dropbox, OneDrive, Google Drive
- Per provider: Connect/Disconnect, Status, Import, Errors

**C) Security & Audit (read-only)**
- Recent security-relevant events

---

## 4) Storage Layer (Supabase Storage)

**Bucket:** `tenant-vault` (private)

**Paths:**
```
Raw:     tenant/{tenant_id}/raw/{YYYY}/{MM}/{document_id}-{safe_filename}
Derived: tenant/{tenant_id}/derived/{document_id}/unstructured.json
Optional: tenant/{tenant_id}/derived/{document_id}/preview.pdf
Optional: tenant/{tenant_id}/derived/{document_id}/thumb.png
```

**Access:**
- No public buckets
- Client uses signed URLs for preview/download
- Worker uses service role

**Important:** UI "Move" never moves bytes; only updates DB links.

---

## 5) Data Model (Conceptual)

### Enums
- `node_type`: system | custom
- `doc_source`: upload | email | caya | dropbox | onedrive | gdrive | api
- `link_status`: new | classified | linked | needs_review | archived
- `extraction_status`: queued | running | done | failed | canceled
- `extraction_engine`: unstructured_fast | unstructured_hires | other
- `consent_mode`: single | batch | rule
- `job_status`: queued | running | done | failed | dead

### Tables (MVP)

| Table | Purpose |
|-------|---------|
| `storage_nodes` | Folder tree (system + custom nodes) |
| `documents` | File registry (extends existing) |
| `document_links` | Index placement + domain linkage |
| `extractions` | Consent + processing state |
| `document_chunks` | Search/RAG base (FTS) |
| `jobs` | DB-backed queue for worker |
| `connectors` | OAuth connections per tenant |
| `billing_usage` | Counters + quotas |
| `audit_log` | Non-negotiable audit trail |

### Key Relationships
- `document_links.object_id` → MOD-04 properties
- `document_links.unit_id` → MOD-05 units (reserved)
- All tables include `tenant_id` with RLS

---

## 6) API Contract (Endpoints)

### Nodes
```
GET    /storage/nodes
POST   /storage/nodes                 { parent_id, name }
PATCH  /storage/nodes/:id             { name?, parent_id?, sort_index? }
DELETE /storage/nodes/:id
```

### Documents
```
POST   /storage/documents/upload      (multipart) => { document_id }
GET    /storage/documents             query: node_id?, q?, status?, source?, object_id?
GET    /storage/documents/:id
POST   /storage/documents/:id/move    { node_id }
POST   /storage/documents/:id/archive
DELETE /storage/documents/:id         (soft delete)
POST   /storage/documents/:id/signed-url { kind: raw|derived|preview|thumb }
```

### Posteingang
```
GET    /dms/post                      query: status?, date?, page?
POST   /dms/post/:id/download-url     => signed url
POST   /dms/post/:id/start-sort       => queues sort item
```

### Sortieren
```
GET    /dms/sort/queue
POST   /dms/sort/:document_id/accept  { node_id, object_id?, unit_id? }
POST   /dms/sort/:document_id/reject
```

### Extraction
```
POST   /storage/extractions/estimate  { document_ids[], engine }
POST   /storage/extractions/confirm   { document_ids[], engine, consent_mode, consent=true }
GET    /storage/extractions/:id
POST   /storage/extractions/:id/cancel
```

### Connectors
```
POST   /storage/connectors/:provider/connect/start
POST   /storage/connectors/:provider/connect/confirm   { code/token }
GET    /storage/connectors
POST   /storage/connectors/:id/import                  { remote_path }
POST   /storage/connectors/:id/disconnect
```

---

## 7) Worker Architecture

**Definition:** Separate background service consuming jobs from `jobs` table.

**Queue Algorithm (MVP):**
```sql
SELECT ... FOR UPDATE SKIP LOCKED
WHERE status='queued' AND run_at <= now()
ORDER BY created_at
LIMIT 1
```

**Job Types:**
1. `extract_document`
2. `import_dropbox`
3. `import_onedrive`
4. `import_gdrive`

**Backoff:**
- attempts 1 → +1 min
- attempts 2 → +5 min
- attempts 3 → +30 min
- attempts ≥4 → dead

---

## 8) Classification + Sorting Logic

**After Extraction:**
1. Determine `doc_type` (contract/invoice/energy/financing/bank/bonity/etc.)
2. Map to system node
3. Optional object linking (if MOD-04 objects exist)

**Confidence Gates:**
| Range | Action |
|-------|--------|
| ≥ 0.85 | Auto-link (status=linked) |
| 0.60–0.85 | needs_review (store suggestion) |
| < 0.60 | Keep in inbox (status=new) |

---

## 9) Consent + Billing Model

### A) Native Storage (Lovable Cloud)

| Tier | Storage | Docs | Extractions/Mo | Preis |
|------|---------|------|----------------|-------|
| **Free** | 1 GB | 1.000 | 50 Seiten | Inkl. |
| **Pro** | 10 GB | 10.000 | 500 Seiten | 9.90€/Mo |
| **Enterprise** | 100 GB | Unlim. | Unlim. | Custom |

### B) Extraction Pricing

| Engine | Preis/Seite | Use Case |
|--------|-------------|----------|
| `unstructured_fast` | 0.02€ | Digitale PDFs |
| `unstructured_hires` | 0.05€ | Gescannte Dokumente |

### C) Consent Flow (KRITISCH)

Extraction ist **IMMER consent-gated**:

1. User wählt Dokument(e) zum Auslesen
2. UI zeigt Schätzung: "5 Seiten = ca. 0.10€"
3. User bestätigt explizit: "Ja, auslesen"
4. System prüft Credits-Verfügbarkeit
5. Wenn ja: Job erstellt, Credits reserviert
6. Nach Completion: Credits final gebucht
7. Bei Fehler: Credits refunded

### D) Upselling Flow

1. User erreicht 80% Storage-Quota
2. Dashboard zeigt Warnung
3. Armstrong schlägt Upgrade vor: "Fast voll - Upgrade?"
4. Click → MOD-01 Billing → Stripe Checkout
5. Quota-Erhöhung sofort aktiv

---

## 10) Security (RLS + Signed URLs + Audit)

**RLS:**
- All tables: tenant member check
- Deletion: soft delete only for documents
- Worker: service role for updates

**Signed URLs:**
- Short TTL for previews/downloads
- Client never sees service role credentials

**Audit Required Events:**
- upload, move, delete, archive
- extract_estimate, extract_consent, extract_done, extract_failed
- connector_connect, connector_disconnect, import_started, import_done, import_failed
- sort_accept, sort_correct, sort_reject

---

## 11) MVP Acceptance Criteria

| AC | Criterion |
|----|-----------|
| AC1 | `/portal/dms` is dashboard entry |
| AC2 | Upload via Storage UI + KI-Stripe works, files appear in inbox |
| AC3 | Default system nodes seeded, custom nodes creatable |
| AC4 | Inbound items appear in `/portal/dms/post`, download works |
| AC5 | Sortieren queue works with accept/correct/reject |
| AC6 | Extraction: estimate → consent → worker → chunks → search |
| AC7 | Connectors OAuth flow + import works |
| AC8 | Tenant isolation enforced, signed URLs expire, audit logs exist |

---

## 12) Cross-Module Dependencies

| Dependency | Description |
|------------|-------------|
| MOD-04 Immobilien | `document_links.object_id` → properties |
| MOD-05 MSV | `document_links.unit_id` → units (reserved) |
| Zone 1 Integration Registry | Connector registration (Dropbox, OneDrive, GDrive) |
| MOD-01 Stammdaten | Billing/Credits integration |
| Backbone | `audit_events` table (existing) |

---

## 13) Open Items (See ZONE2_OPEN_QUESTIONS.md)

- ~~Q3.1: Armstrong-Rolle in MOD-03~~ → Section 14 klärt
- Q3.2: documents-Tabelle Migration
- Q3.3: inbound_items Memory vs Spec
- Q3.4: Worker-Deployment
- ~~Q3.5: audit_log vs audit_events~~ → N1 resolved
- ~~Q3.6: connectors vs integration_registry~~ → ADR-037 klärt
- Q3.7: Caya-Webhook-Format

---

## 14) Armstrong-Anbindung (KI-Integration)

### Datenfluss KI → DMS

Armstrong (MOD-02) kann auf DMS-Daten zugreifen:

| Aktion | Methode | Tabelle |
|--------|---------|---------|
| **Suche** | `document_chunks` mit Volltext-Index | `document_chunks` |
| **Inhalt** | Chunks laden für Analyse | `document_chunks` |
| **Metadaten** | Status, Links, Typ | `documents`, `extractions` |
| **Verknüpfung** | Mit User-Bestätigung | `document_links` |

### Voraussetzungen

- Dokument muss `extraction_status = 'done'` haben
- Chunks müssen in `document_chunks` existieren
- RLS: Nur Tenant-eigene Dokumente

### Armstrong Document Tools

Definiert in MOD-02 Section 4.5:

| Tool | Beschreibung | Consent |
|------|--------------|---------|
| `search_documents` | Volltextsuche | Nein (READ) |
| `get_document_content` | Chunks laden | Nein (READ) |
| `summarize_document` | LLM Summary | Nein (READ) |
| `link_document` | Verknüpfung erstellen | **Ja (WRITE)** |

### UI-Integration

- Armstrong-Stripe zeigt "Dokumentsuche" als verfügbare Fähigkeit
- Drag & Drop Dokument auf Armstrong → Analyse starten
- Armstrong kann Dokumente vorschlagen für Sortierung
- Sortiervorschläge erfordern User-Bestätigung

### Verwendbare Befehle (Beispiele)

| User sagt | Armstrong tut |
|-----------|---------------|
| "Finde den Mietvertrag für Hauptstr. 15" | `search_documents({query: "mietvertrag hauptstr"})` |
| "Was steht in diesem Dokument?" | `get_document_content({document_id})` → Summarize |
| "Wie hoch ist die Miete laut Vertrag?" | RAG-Query auf Chunks → Antwort mit Quellenangabe |
| "Ordne das der Immobilie zu" | `link_document({...})` → User-Bestätigung erforderlich |

### Edge Function: armstrong-chat

```typescript
// Relevante Tools für DMS-Integration
const dmsTools = [
  {
    name: 'search_documents',
    description: 'Suche in Dokumenten des aktuellen Tenants',
    parameters: { query: 'string', filters?: 'object' }
  },
  {
    name: 'get_document_content',
    description: 'Lade Volltext eines Dokuments',
    parameters: { document_id: 'uuid' }
  },
  {
    name: 'link_document',
    description: 'Verknüpfe Dokument mit Entity (erfordert Bestätigung)',
    parameters: { document_id: 'uuid', target_type: 'string', target_id: 'uuid' },
    requires_confirmation: true
  }
];
```
