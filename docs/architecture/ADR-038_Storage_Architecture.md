# ADR-038 — STORAGE ARCHITECTURE (Canonical Spec v1.1)

> **Version**: 1.1  
> **Status**: ACTIVE  
> **Datum**: 2026-01-27  
> **Zone**: 2 (User Portal) / MOD-03 DMS

---

## Decision

Hybrid Storage Model: **Native Vault** (Supabase Storage) als primärer Speicher + **User-Data-Connectors** (OAuth) für Import aus externen Quellen + **Zwei-Engine-KI-Parsing** für strukturierte Metadaten-Extraktion.

---

## A) Native Storage (Lovable Cloud / Supabase)

### Bucket-Konfiguration

| Bucket | Visibility | Purpose |
|--------|------------|---------|
| `tenant-documents` | private | Alle Tenant-Dokumente |

**Access Control:**
- Keine öffentlichen URLs
- Zugriff nur via Signed URLs (TTL: 15 Minuten)
- Worker nutzt Service Role

### Path Structure (ERWEITERT v1.1)

```
tenant/{tenant_id}/
├── raw/                                    ← Original-Dateien
│   └── {YYYY}/{MM}/{document_id}-{filename}
│
├── derived/                                ← KI-generierte Metadaten
│   └── {document_id}/
│       ├── metadata.json                   ← Lovable AI (Drag&Drop/UI-Upload)
│       ├── unstructured.json               ← Unstructured.io (Automatik)
│       ├── preview.pdf                     ← Preview-Rendering (optional)
│       └── thumb.png                       ← Thumbnail (optional)
│
└── imports/                                ← Batch-Imports
    └── {batch_id}/
        ├── source.xlsx                     ← Original Import-Datei
        └── parsed.json                     ← KI-Interpretation
```

| Path | Purpose | Created By | Engine |
|------|---------|------------|--------|
| `/raw/` | Original-Dateien | Upload, Import | — |
| `/derived/metadata.json` | KI-Strukturdaten | sot-document-parser | Lovable AI |
| `/derived/unstructured.json` | Volltext-Extraktion | dms-worker | Unstructured.io |
| `/derived/preview.pdf` | Preview-Rendering | dms-worker | — |
| `/derived/thumb.png` | Thumbnail | dms-worker | — |
| `/imports/` | Batch-Import-Daten | TestDataManager | Lovable AI |

### RLS auf Storage

```sql
-- Bucket Policy (tenant-documents)
CREATE POLICY "Tenant isolation"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = get_current_tenant_id()::text
);
```

---

## B) Zwei-Engine-KI-Parsing (NEU v1.1)

### Engine-Übersicht

| Engine | Trigger | API | Kosten | JSON-Output |
|--------|---------|-----|--------|-------------|
| **Lovable AI** | Drag & Drop, UI-Upload | Lovable AI Gateway | Inklusive | `metadata.json` |
| **Unstructured.io** | Resend, Caya, Cloud-Imports | Unstructured.io API | 0.02-0.05€/Seite | `unstructured.json` |

### Engine A: Lovable AI (sot-document-parser)

**Use Cases:**
- Manueller Upload via UI
- Excel/CSV Import
- Bild-Analyse (OCR via Vision)
- Armstrong Chat-Upload

**Technologie:** google/gemini-3-flash-preview

**Output-Schema:**
```json
{
  "version": "1.0",
  "engine": "lovable_ai",
  "model": "google/gemini-3-flash-preview",
  "parsed_at": "2026-01-27T10:00:00Z",
  "confidence": 0.95,
  "warnings": [],
  "data": {
    "properties": [...],
    "contacts": [...],
    "financing": [...],
    "detected_type": "portfolio"
  }
}
```

### Engine B: Unstructured.io (dms-worker)

**Use Cases:**
- E-Mail-Anhänge (Resend Webhook)
- Caya digitale Post
- Cloud-Import (Dropbox, OneDrive, GDrive)

**Pricing:**
- `unstructured_fast`: 0.02€/Seite (digitale PDFs)
- `unstructured_hires`: 0.05€/Seite (OCR für Scans)

### Cost Estimation

```typescript
interface CostEstimate {
  document_id: string;
  page_count: number;
  engine: 'unstructured_fast' | 'unstructured_hires';
  estimated_cost_eur: number;
  credits_required: number; // 1€ = 4 Credits
}

// Beispiel: 10 Seiten mit fast engine
// → 10 * 0.02€ = 0.20€ = 0.8 Credits
```

### Consent Flow

```
1. User wählt Dokument(e) zum Auslesen
2. UI zeigt Schätzung: "5 Seiten = ca. 0.10€"
3. User bestätigt: "Ja, auslesen"
4. System prüft: Credits verfügbar?
5. Wenn ja: Job erstellt, Credits reserviert
6. Nach Completion: Credits gebucht
7. Bei Fehler: Credits refunded
```

---

## D) User-Data-Connectors (Zone 2 / MOD-03)

### KRITISCH: KEINE Platform-APIs

Diese Connectors gehören dem **User**, nicht der Platform:

| Provider | OAuth | Scope | Config Route |
|----------|-------|-------|--------------|
| Dropbox | ✅ | user | `/portal/dms/dmssettings` |
| OneDrive | ✅ | user | `/portal/dms/dmssettings` |
| Google Drive | ✅ | user | `/portal/dms/dmssettings` |

### Storage in `connectors` Tabelle

```sql
CREATE TABLE connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL, -- Owner des OAuth Tokens
  provider text NOT NULL, -- 'dropbox' | 'onedrive' | 'gdrive'
  status text DEFAULT 'active', -- active | expired | revoked
  access_token_encrypted text, -- Verschlüsselt!
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: User sieht nur eigene Connectors
CREATE POLICY "User owns connector"
ON connectors
FOR ALL
USING (user_id = auth.uid());
```

### Import Flow

```
1. User browst Remote-Ordner (via OAuth API)
2. User wählt Dateien zum Import
3. System erstellt import_* Job in `jobs` Tabelle
4. Worker:
   a. Lädt Datei von Remote
   b. Speichert in tenant-vault/raw/
   c. Erstellt documents-Eintrag
   d. Optional: Extraction Job erstellen
5. UI zeigt importierte Dokumente
```

### GDPR-Compliance

| Regel | Implementation |
|-------|----------------|
| User-Ownership | Tokens gehören User, nicht Platform |
| Disconnect | User kann jederzeit disconnecten |
| Data Copy | Daten werden KOPIERT, kein Live-Sync |
| Audit | Alle Imports werden geloggt |

---

## E) Datenfluss-Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  SOURCES                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Upload  │ │ Dropbox  │ │ OneDrive │ │   Caya   │               │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘               │
└───────┼────────────┼────────────┼────────────┼──────────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STORAGE LAYER (tenant-vault)                                        │
│                                                                      │
│  Path: tenant/{tenant_id}/raw/{YYYY}/{MM}/{doc_id}-{filename}        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  REGISTRY LAYER (documents)                                          │
│                                                                      │
│  - id, public_id, tenant_id                                          │
│  - file_path, name, mime_type, size_bytes                           │
│  - source: upload | dropbox | onedrive | gdrive | caya | email      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
        │
        │  User triggers: "Lesbar machen"
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CONSENT LAYER                                                       │
│                                                                      │
│  1. UI zeigt Schätzung                                              │
│  2. User bestätigt                                                  │
│  3. INSERT INTO extractions (status='queued')                       │
│  4. INSERT INTO jobs (type='extract_document')                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  WORKER LAYER (dms-worker Edge Function)                            │
│                                                                      │
│  1. Lade Datei (signed URL, service role)                           │
│  2. Sende an Unstructured.io API                                    │
│  3. Speichere JSON → derived/{doc_id}/unstructured.json             │
│  4. INSERT INTO document_chunks                                     │
│  5. UPDATE extractions SET status='done'                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  VISIBILITY LAYER (UI)                                              │
│                                                                      │
│  - Status-Badge: "KI-lesbar" ✅                                     │
│  - Volltext-Suche aktiv                                             │
│  - Preview mit extrahiertem Text                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI LAYER (Armstrong)                                               │
│                                                                      │
│  - search_documents: Suche in document_chunks                       │
│  - summarize_document: Chunks → LLM Summary                         │
│  - link_document: Vorschlag → User-Bestätigung                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## F) Security Considerations

### Signed URLs

- TTL: 15 Minuten (nicht verlängerbar)
- Generiert via Edge Function oder Backend
- Client erhält nie Service Role Credentials

### Encryption

- Connector OAuth Tokens: AES-256 encrypted
- Storage: Supabase default encryption at rest
- Transit: TLS 1.3

### Audit Events

| Event | Logged Fields |
|-------|---------------|
| `document_uploaded` | doc_id, source, size, user |
| `document_imported` | doc_id, source, provider, user |
| `extraction_requested` | doc_id, engine, estimated_cost |
| `extraction_completed` | doc_id, pages, actual_cost |
| `connector_connected` | provider, user |
| `connector_disconnected` | provider, user, reason |

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-01-25 | Initial (K6 Resolution: User-Data-Connectors definiert) |
