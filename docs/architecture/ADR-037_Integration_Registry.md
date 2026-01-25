# ADR-037 — INTEGRATION REGISTRY (Canonical Spec v1.0)

> **Version**: 1.0  
> **Status**: FROZEN  
> **Datum**: 2026-01-25  
> **Zone**: 1 (Admin/Governance)

---

## Decision

Zone 1 verwaltet alle **Platform-APIs** zentral in der `integration_registry`. **User-Data-Connectors** (OAuth für externe Speicher/Mail) gehören zu Zone 2 und werden in modulspezifischen Tabellen gespeichert.

---

## A) Registry Entry Types (enum: `integration_type`)

| Type | Beschreibung | Beispiel |
|------|--------------|----------|
| `integration` | Externer SaaS/API Provider | Resend, Stripe, Unstructured |
| `connector` | Tenant-gebundene Anbindung (Instanz) | Caya per Tenant |
| `edge_function` | Interne Backend-Operation | dms-worker, armstrong-chat |
| `webhook` | Extern eingehender Trigger | Stripe Webhook |
| `secret` | Secret-Referenz (Lovable Cloud) | RESEND_API_KEY |

---

## B) Platform-API-Katalog (Zone 1 Scope)

Diese Integrationen werden zentral verwaltet und stehen allen Tenants zur Verfügung:

| Code | Type | Scope | Phase | Purpose | Secret-Ref |
|------|------|-------|-------|---------|------------|
| `RESEND` | integration | platform | 1 | System-Mail (transaktional) | SEC-RESEND |
| `STRIPE` | integration | platform | 2 | Billing & Credits | SEC-STRIPE |
| `CAYA` | integration | tenant | 1 | Inbound Post (Scan-to-Digital) | SEC-CAYA |
| `UNSTRUCTURED` | integration | platform | 1 | Document Extraction API | SEC-UNSTRUCTURED |
| `LOVABLE_AI` | integration | platform | 1 | AI-Features (Armstrong, etc.) | SEC-LOVABLE-AI |
| `SIMPLEFAX` | integration | platform | 2 | Fax-Versand | SEC-SIMPLEFAX |
| `BRIEFDIENST` | integration | platform | 2 | Brief-Versand (Post) | SEC-BRIEFDIENST |
| `GOOGLE_PLACES` | integration | platform | 2 | Contractor Search | SEC-GPLACES |

### Scope-Erklärung

| Scope | Bedeutung |
|-------|-----------|
| `platform` | Einmalige Konfiguration, für alle Tenants nutzbar |
| `tenant` | Jeder Tenant konfiguriert eigene Credentials |

---

## C) NICHT in Zone 1 — User-Data-Connectors

Die folgenden sind **KEINE Platform-APIs**. Sie gehören dem User und werden in Zone 2 modulspezifisch verwaltet:

### DMS (MOD-03) → `connectors` Tabelle

| Provider | OAuth | Beschreibung |
|----------|-------|--------------|
| Dropbox | ✅ | Cloud-Storage Import |
| OneDrive | ✅ | Microsoft Cloud Import |
| Google Drive | ✅ | Google Cloud Import |

**Konfiguration**: `/portal/dms/dmssettings`

### KI Office (MOD-02) → `mail_accounts` Tabelle

| Provider | OAuth | Beschreibung |
|----------|-------|--------------|
| Gmail OAuth | ✅ | Personal Mailbox |
| Outlook OAuth | ✅ | Microsoft Mail |
| IMAP Generic | ❌ | Beliebiger IMAP-Server |

**Konfiguration**: `/portal/ki-office/email` (Settings)

### GDPR-Compliance

- Tokens gehören dem User
- User kann jederzeit disconnecten
- Daten werden KOPIERT in tenant-vault (kein Live-Sync)
- Platform hat keinen Zugriff auf User-Credentials

---

## D) Edge Functions Katalog

| Name | Module | Trigger | Purpose |
|------|--------|---------|---------|
| `dms-worker` | MOD-03 | Cron (30s) / pg_notify | Extraction, Import Jobs |
| `armstrong-chat` | MOD-02 | HTTP | Chatbot Completions |
| `caya-webhook` | MOD-03 | Webhook | Inbound Post Ingestion |
| `send-email` | MOD-02 | HTTP | Systemmail via Resend |
| `briefgenerator` | MOD-02 | HTTP | AI Draft + PDF |

---

## E) Status Lifecycle (enum: `integration_status`)

```
pending_setup → active → degraded → disabled
                  ↑___________↓
```

| Status | Bedeutung |
|--------|-----------|
| `pending_setup` | Neu registriert, Credentials fehlen |
| `active` | Voll funktionsfähig |
| `degraded` | Funktioniert mit Einschränkungen |
| `disabled` | Manuell oder automatisch deaktiviert |

---

## F) Governance Rules

1. **Nur registrierte Integrationen dürfen genutzt werden**
   - Edge Functions prüfen gegen `integration_registry`
   - Unregistrierte Calls werden blockiert

2. **Secrets werden nur per Referenz gespeichert**
   - `secret_ref` verweist auf Lovable Cloud Secret
   - Keine Klartext-Credentials in DB

3. **Platform Admin kontrolliert Registry**
   - Nur `platform_admin` kann CUD auf `integration_registry`
   - Tenants können Instanzen aktivieren (wo erlaubt)

4. **Audit-Trail für Status-Änderungen**
   - Jede Status-Änderung → `audit_events`

---

## G) DB Schema

```sql
-- Bereits existierend in DB, hier dokumentiert

CREATE TABLE integration_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text UNIQUE NOT NULL,
  tenant_id uuid REFERENCES organizations(id), -- NULL = platform-wide
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  type integration_type NOT NULL,
  status integration_status DEFAULT 'pending_setup',
  version text DEFAULT '1.0.0',
  config_schema jsonb DEFAULT '{}',
  default_config jsonb DEFAULT '{}',
  documentation_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: Authenticated READ, Platform Admin WRITE
```

---

## H) Seed Data (MVP)

```sql
-- Initiale Platform-Integrationen
INSERT INTO integration_registry (public_id, code, name, type, status, description) VALUES
  ('INT-RESEND', 'RESEND', 'Resend Email', 'integration', 'active', 'Transaktionale System-Mails'),
  ('INT-UNSTRUCTURED', 'UNSTRUCTURED', 'Unstructured.io', 'integration', 'active', 'Document Extraction & OCR'),
  ('INT-LOVABLE-AI', 'LOVABLE_AI', 'Lovable AI Gateway', 'integration', 'active', 'AI-Features (Armstrong, etc.)'),
  ('INT-CAYA', 'CAYA', 'Caya Post', 'integration', 'pending_setup', 'Inbound Post Digitalisierung'),
  ('INT-STRIPE', 'STRIPE', 'Stripe Billing', 'integration', 'pending_setup', 'Billing & Credits');
```

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-01-25 | Initial (K6 Resolution: User-Data-Connectors nach Zone 2 verschoben) |
