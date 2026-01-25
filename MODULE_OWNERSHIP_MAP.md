# Module Ownership Map

> **Version**: 1.1  
> **Datum**: 2026-01-25  
> **Status**: Verbindlich  
> **Conflict Resolution**: K3, K4 applied (see CONFLICT_RESOLUTION_LOG.md)

Dieses Dokument definiert die Eigentümerschaft, Lese-/Schreibrechte und Schnittstellen aller Module im "System of a Town".

---

## 1. Zonen-Ownership

| Zone | Name | Owner | Beschreibung |
|------|------|-------|--------------|
| **Zone 1** | Admin-Portal | Core/Platform | Plattform-Konfiguration, Tenant-Verwaltung, Oversight |
| **Zone 2** | Superuser Portal | Modul-spezifisch | Business-Workflows für Endnutzer (Eigentümer, Partner) |
| **Zone 3** | Websites | Website-Modul | Öffentliche/halb-öffentliche Seiten (Kaufy.io, Meety.io) |

---

## 2. Module-Registry

### 2.1 Core/Foundation (Zone 1 + Backbone)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `organizations` | Core | ✅ | Alle Zonen | Platform Admin |
| `profiles` | Core | ✅ | Self + Platform Admin | Self + Platform Admin |
| `memberships` | Core | ✅ | Org Admin + Platform Admin | Org Admin + Platform Admin |
| `org_delegations` | Core | ✅ | Target/Delegate Org | Target Org Admin + Platform Admin |
| `tile_catalog` | Core | ✅ | Authenticated | Platform Admin |
| `tenant_tile_activation` | Core | ✅ | Tenant Members | Org Admin + Platform Admin |
| `audit_events` | Core | ✅ | Tenant Members + Platform Admin | INSERT only (App-Layer) |
| `contacts` | **Backbone** | ✅ | Tenant Members | Org Admin, Internal Ops |
| `documents` | **Backbone** | ✅ | Tenant Members + via `access_grants` | Tenant (org_admin, internal_ops) |
| `communication_events` | **Backbone** | ✅ | Tenant Members | INSERT only (App-Layer) |

**Hinweis**: `contacts`, `documents` und `communication_events` sind **Cross-Module Objects** und werden von mehreren Modulen referenziert (MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-07, MOD-08).

---

### 2.2 Billing (Zone 1 - Backbone)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `plans` | Billing | ✅ | Authenticated | Platform Admin |
| `subscriptions` | Billing | ✅ | Org Admin (tenant-scoped) + Platform Admin | Platform Admin |
| `invoices` | Billing | ✅ | Org Admin (tenant-scoped) + Platform Admin | Platform Admin |

**Schnittstellen:**
- Stripe-Integration (Phase 2): Webhook → `subscriptions`, `invoices` Updates

---

### 2.3 Agreements/Consents (Zone 1 - Backbone)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `agreement_templates` | Compliance | ✅ | Authenticated | Platform Admin |
| `user_consents` | Compliance | ✅ | Self + Platform Admin | **INSERT only** (Self via App-Layer) |

**Regeln:**
- `user_consents` ist **append-only** (kein UPDATE/DELETE)
- Consent-Logs dienen als rechtlicher Nachweis
- Andere Module MÜSSEN Consent prüfen vor sensiblen Aktionen

---

### 2.4 Post & Documents (Zone 1 - Backbone)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `inbound_items` | Inbox | ✅ | Platform Admin | Platform Admin |
| `inbound_routing_rules` | Inbox | ✅ | Platform Admin | Platform Admin |
| `access_grants` | Documents | ✅ | Tenant + Subject Org | Tenant Admin |

---

### 2.5 Integration Registry (Zone 1)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `integration_registry` | Core | ✅ | Authenticated | Platform Admin |

**Hinweis**: Dies sind die **Definitionen** von Integrationen. Tenant-spezifische Instanzen werden in `connectors` (MOD-03) gespeichert.

---

### 2.6 Immobilienportfolio (Zone 2 - MOD-04)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `properties` | Immobilien | ✅ | Tenant Members | Org Admin, Internal Ops |
| `units` | Immobilien | ✅ | Tenant Members | Org Admin, Internal Ops |
| `property_features` | Immobilien | ✅ | Tenant Members | Org Admin, Internal Ops |
| `property_financing` | Immobilien | ✅ | Tenant Members | Org Admin, Internal Ops |

**Erweiterung Etappe 3:**
- `properties.is_public_listing` → Zone 3 Website filtert hierauf
- `properties.public_listing_approved_at/by` → Audit-Trail für Freigabe

---

### 2.7 Sales Partner (Zone 2 - MOD-07)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `partner_pipelines` | Sales Partner | ✅ | Tenant Members | Org Admin, Internal Ops, Sales Partner |
| `investment_profiles` | Sales Partner | ✅ | Tenant Members | Org Admin, Internal Ops, Sales Partner |
| `commissions` | Sales Partner | ✅ | Tenant Members | **Platform Admin only** |

**Regeln:**
- `commissions` CUD ist Platform Admin only (sensible Finanzdaten)
- `commissions.agreement_consent_id` MUSS gesetzt sein vor Status-Change zu `approved`
- Consent-Code: `SALES_MANDATE` oder `COMMISSION_AGREEMENT`

---

### 2.8 Financing (Zone 2 - MOD-08)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `finance_packages` | Financing | ✅ | Tenant Members | Org Admin, Internal Ops |
| `self_disclosures` | Financing | ✅ | Tenant Members | Tenant Members (Self-Service) |
| `finance_documents` | Financing | ✅ | Tenant Members | Org Admin, Internal Ops |

**Regeln:**
- Export (`exported_at` setzen) NUR wenn `data_sharing_consent_id` existiert
- Consent-Code: `DATA_SHARING_FUTURE_ROOM`
- Status-Enum begrenzt auf Phase 1: `draft`, `incomplete`, `complete`, `ready_for_handoff`

---

### 2.9 Vermietung/Miety (Zone 2 - MOD-05)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `leases` | Miety | ✅ | Landlord + Renter (via renter_org_id) | Landlord (Org Admin, Internal Ops) |
| `renter_invites` | Miety | ✅ | Landlord | Landlord (Org Admin, Internal Ops) |

---

### 2.10 KI Office (Zone 2 - MOD-02)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `mail_accounts` | KI Office | ✅ | User (self) | User (self) |
| `mail_sync_status` | KI Office | ✅ | User (self) | Worker (service role) |
| `letter_drafts` | KI Office | ✅ | Tenant Members | Tenant Members |
| `letter_sent` | KI Office | ✅ | Tenant Members | **INSERT only** (App-Layer) |
| `calendar_events` | KI Office | ✅ | Tenant Members | Tenant Members |
| `calendar_reminders` | KI Office | ✅ | Tenant Members | Tenant Members |

**Hinweis**: `contacts` und `communication_events` sind Backbone Objects (siehe 2.1).

---

### 2.11 DMS / Posteingang (Zone 2 - MOD-03)

| Tabelle | Owner | Source of Truth | Read | Write |
|---------|-------|-----------------|------|-------|
| `storage_nodes` | DMS | ✅ | Tenant Members | Org Admin, Internal Ops |
| `document_links` | DMS | ✅ | Tenant Members | Tenant Members |
| `extractions` | DMS | ✅ | Tenant Members | Worker (service role) |
| `document_chunks` | DMS | ✅ | Tenant Members + **Armstrong** | Worker (service role) |
| `jobs` | DMS | ✅ | Internal only | Worker (service role) |
| `connectors` | DMS | ✅ | User (self) | User (self) |
| `billing_usage` | DMS / MOD-01 | ✅ | Tenant Members | System |

**Hinweise:**
- `documents` ist ein Backbone Object (siehe 2.1)
- `connectors` speichert **User-scoped OAuth Tokens** für Dropbox/OneDrive/GDrive (GDPR-konform, User-Ownership)
- `integration_registry` (Zone 1) enthält **Platform-API-Definitionen**, nicht User-Connectors
- **Armstrong-Zugriff**: `document_chunks` ist READ-only für Armstrong (MOD-02) zur Dokumentensuche

### Cross-Module Access (DMS → MOD-02)

| Access | Von | Zu | Tabelle | Permission |
|--------|-----|------|---------|------------|
| Armstrong Search | MOD-02 | MOD-03 | `document_chunks` | READ |
| Armstrong Link | MOD-02 | MOD-03 | `document_links` | WRITE (mit Consent) |

---

## 3. Cross-Module API-Regeln

### Grundprinzipien

1. **Ein Modul darf fremde Tabellen NICHT "wild" beschreiben**
2. **Cross-Module Writes nur über definierte Interface Actions** (siehe `INTERFACES.md`)
3. **Cross-Module Reads erlaubt, wenn:**
   - RLS es sauber abbildet
   - Das Zielmodul "Source of Truth" bleibt
   - Keine Duplikate/Shadow Tables entstehen

### Delegation-Regeln

- Zugriff auf delegierte Daten NUR wenn Scope explizit aktiv ist
- Keine impliziten Rechte über Hierarchie (außer `parent_access_blocked = false`)
- Delegation-Scopes müssen in `org_delegations.scopes` JSONB enthalten sein

---

## 4. Sicherheitsregeln

### 4.1 RLS-Prinzipien

- **Keine SECURITY DEFINER** für Authorization
- **Platform Admin = God Mode** (bypassed alle Policies)
- **Tenant-scoped** für alle Business-Tabellen
- **Inline EXISTS checks** in Policies (keine Helper-Functions)

### 4.2 Append-Only Tabellen

| Tabelle | Begründung |
|---------|------------|
| `audit_events` | Forensische Integrität |
| `user_consents` | Rechtlicher Nachweis, DSGVO |
| `communication_events` | Kommunikations-Audit-Trail |
| `letter_sent` | Versand-Nachweis |

### 4.3 Sensitive Tabellen (Platform Admin Only für CUD)

| Tabelle | Begründung |
|---------|------------|
| `commissions` | Finanzielle Auswirkungen, Betrugsrisiko |
| `inbound_items` | Plattform-weite Routing-Entscheidungen |
| `inbound_routing_rules` | Sicherheitskritische Automatisierung |

---

## 5. Audit-Events (Mindestabdeckung)

Diese Aktionen MÜSSEN als `audit_events` erfasst werden:

| Event Type | Modul | Beschreibung |
|------------|-------|--------------|
| `consent_accepted` | Agreements | User akzeptiert Vereinbarung |
| `consent_declined` | Agreements | User lehnt ab |
| `finance_exported` | Financing | Paket an Future Room übergeben |
| `commission_created` | Sales Partner | Provision angelegt |
| `commission_status_changed` | Sales Partner | Status-Übergang |
| `property_public_listing_approved` | Immobilien | Listing öffentlich geschaltet |
| `delegation_created` | Core | Neue Delegation |
| `delegation_revoked` | Core | Delegation widerrufen |
| `membership_created` | Core | Neues Mitglied |
| `membership_deleted` | Core | Mitglied entfernt |
| `letter_sent` | KI Office | Brief versendet |
| `document_archived` | DMS | Dokument archiviert |
| `inbound_item_assigned` | DMS | Posteingang zugeordnet |

---

## 6. Governance

- **Updates zu diesem Dokument** erfordern ADR in `DECISIONS.md`
- **Neue Module** müssen hier eingetragen werden vor Implementation
- **Änderungen an Ownership** erfordern Review durch Architektur-Owner
- **GitHub-Sync**: Dieses Dokument ist Teil des versionierten Repositories

---

## 7. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-01-21 | Initial |
| 1.1 | 2026-01-25 | K3/K4 Resolutions: `contacts`, `documents`, `communication_events` → Backbone. MOD-02 (2.10), MOD-03 (2.11) Tabellen hinzugefügt. Append-Only erweitert. |
| 1.2 | 2026-01-25 | K6 Resolution: `connectors` als User-scoped definiert. Armstrong-Zugriff auf `document_chunks` dokumentiert. `billing_usage` hinzugefügt. |
