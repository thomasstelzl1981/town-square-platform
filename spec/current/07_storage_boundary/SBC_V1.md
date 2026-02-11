# Storage Boundary Contract (SBC) v1.0

**Status:** Aktiv  
**Erstellt:** 2026-02-11  
**Gueltig ab:** v1.0  

---

## Zweck

Der SBC definiert verbindliche Regeln fuer Datenisolierung, Zugriffskontrolle und DSGVO-Minimum im Storage-Layer der Plattform. Er ergaenzt den Zone Boundary Contract (ZBC) um die physische Datenschicht.

---

## Regeln

### SBC-R01: Bucket-Klassifizierung und Zugriffsmuster

- Alle Business-Buckets sind **private** (`tenant-documents`, `acq-documents`, `project-documents`, `audit-reports`).
- Zugriff auf private Buckets ausschliesslich via `createSignedUrl()` (TTL max. 3600s fuer Downloads, max. 31536000s fuer persistente Referenzen wie Avatare).
- `getPublicUrl()` darf **NICHT** auf private Buckets angewendet werden.
- Oeffentliche Buckets (`docs-export`, `social-assets`) unterliegen SBC-R07.

### SBC-R02: Tenant-Scope auf allen Storage-Records

- Jede Zeile in `documents`, `document_links`, `storage_nodes` **MUSS** ein `tenant_id` haben.
- Storage-Pfade folgen dem Pattern `{tenant_id}/{...}` fuer tenant-spezifische Buckets.
- Storage RLS-Policies pruefen `foldername[1] = profiles.active_tenant_id`.

### SBC-R03: External Access via access_grants (Server-Side Only)

- Externer Zugriff auf Tenant-Dokumente erfordert eine **Server-seitige Signed URL Issuance**:
  - **Authentifizierte User:** Via `sot-dms-download-url` Edge Function (prueft tenant_id + document ownership)
  - **Externe/Anon-User (Z3):** Via dedizierte Edge Function, die `access_grants` validiert (scope, expires_at, revoked_at) und erst dann eine Signed URL mit Service-Role ausstellt
- Jeder Grant hat `expires_at` (TTL, empfohlen max. 30 Tage) und `revoked_at` (sofortige Sperrung).
- **VERBOTEN:** Clientseitiges Signing mit anon-Key auf private Buckets.
- **VERBOTEN:** Direkte Storage-URLs ohne Grant-Validierung fuer externe Nutzer.

### SBC-R04: Audit Logging (Minimalset)

Folgende Events werden in `audit_events` protokolliert:

| Event-Type | Trigger | Payload-Minimum |
|------------|---------|-----------------|
| `document.view` | Signed URL fuer Preview erstellt | `{ document_id, scope }` |
| `document.download` | Signed URL fuer Download erstellt | `{ document_id, scope }` |
| `grant.created` | access_grant INSERT | `{ grant_id, scope_id, subject_id }` |
| `grant.revoked` | access_grant revoked_at gesetzt | `{ grant_id, scope_id }` |

Alle Events: `actor_user_id`, `target_org_id` (= tenant_id), `payload` (JSON).

### SBC-R05: Retention und Deletion

- Geloeschte Dokumente: `documents.deleted_at` Softdelete, Blob-Loesch nach 30 Tagen Karenzzeit.
- Lead-Daten (`leads`, `lead_activities`): Retention max. 24 Monate nach letzter Aktivitaet.
- Extracted Data (`document_chunks`, `extractions`): Loeschbar unabhaengig vom Quelldokument.
- Phase 1: Dokumentation der Fristen, keine automatische Enforcement.

### SBC-R06: Consent-gated Extraction

- Dokumentenextraktion (AI/OCR) nur nach explizitem User-Trigger (kein automatisches Scanning).
- Extrahierte Daten mit `confidence`-Score. Werte unter Schwellwert erhalten `needs_review = true`.
- Phase 1: Bestehendes `extractions`-Pattern genuegt. Keine zusaetzliche Consent-Infrastruktur.

### SBC-R07: Public Bucket Governance

- **`social-assets`:** Write-Pfad MUSS `{tenant_id}/` als Prefix erzwingen (Storage-Policy). Read bleibt public. Keine PII in Dateinamen oder Metadaten.
- **`docs-export`:** Dateinamen mit UUID-Suffix (unguessable). Admin-only Upload. Keine PII in exportierten Dateien.

### SBC-R08: Legacy Bucket Governance

- Bucket `documents` ist **deprecated** und **frozen** (kein neuer Upload).
- INSERT-Policy entfernt. SELECT bleibt fuer Abwaertskompatibilitaet.
- Neue Uploads MUESSEN in `tenant-documents` mit korrektem Pfad-Prefix landen.
- Bucket wird NICHT geloescht (bestehende Dateien bleiben lesbar).

---

## SSOT-Tabellen

| Tabelle | Rolle | Authoritative fuer |
|---------|-------|---------------------|
| `storage_nodes` | DMS-Baumstruktur | Ordner-Hierarchie, Metadaten |
| `documents` | Dokument-Records | `file_path` → Blob-Referenz |
| `document_links` | N:M Verknuepfung | Document ↔ Entity (property, unit, etc.) |
| `access_grants` | Zugriffssteuerung | Scope, TTL, Revocation |

## Bucket-Register

| Bucket | Typ | Isolation | Status |
|--------|-----|-----------|--------|
| `tenant-documents` | Private | `foldername[1] = tenant_id` | Aktiv |
| `acq-documents` | Private | `foldername[1] = mandate_id` (via assigned_manager) | Aktiv |
| `project-documents` | Private | `foldername[1] = tenant_id` | Aktiv (gehaertet) |
| `audit-reports` | Private | platform_admin only | Aktiv |
| `social-assets` | Public (read) | Write: `foldername[1] = tenant_id` | Aktiv (gehaertet) |
| `docs-export` | Public | Admin-only write, UUID filenames | Aktiv (gehaertet) |
| `documents` | Private | Keine Isolation | **Deprecated/Frozen** |

---

*Generiert im Rahmen des Storage & Data Isolation Hardening — System of a Town Platform*
