# Zone 1: Admin Portal — Route-Struktur v3.0

**Version:** 3.0  
**Status:** AKTIV  
**Aktualisiert:** 2026-02-08  
**Bezug:** ZONE1_COMPLETION_ROADMAP.md

---

## Übersicht

| Attribut | Wert |
|----------|------|
| **Base Path** | `/admin` |
| **Layout** | `AdminLayout` |
| **Requires Role** | `platform_admin` |
| **Organisation** | `internal` (System of a Town) |

Zone 1 ist das **Governance-Portal** für Platform-Administratoren. Es bietet keine End-User-Business-Funktionen, sondern Konfiguration, Oversight und Plattform-Management.

---

## Sidebar-Struktur (10 Gruppen)

Die aktuelle Sidebar-Implementierung in `AdminSidebar.tsx` ist in folgende funktionale Gruppen unterteilt:

### Gruppe 1: Tenants & Access

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin` | Dashboard | Admin-Übersicht mit KPIs |
| `/admin/organizations` | Organizations | Tenant-Verwaltung |
| `/admin/organizations/:id` | OrganizationDetail | Tenant-Details |
| `/admin/users` | Users | Benutzer-Verwaltung |
| `/admin/delegations` | Delegations | Delegations-Übersicht |

---

### Gruppe 2: Masterdata

Read-Only Viewer für Zone 2 Datenstrukturen.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/masterdata/property-template` | PropertyTemplate | Immobilienakte-Vorlage (RO) |
| `/admin/masterdata/self-disclosure-template` | SelfDisclosureTemplate | Selbstauskunft-Vorlage (RO) |

**Hinweis:** Diese Module zeigen die Struktur aus Zone 2 TypeScript-Types. Keine Editoren.

---

### Gruppe 3: KI Office

System-Kommunikation auf Plattform-Ebene.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/email` | AdminEmail | System-Mails (Resend) |
| `/admin/contacts` | MasterContacts | Master-Kontaktdatenbank |
| `/admin/communication` | CommunicationHub | Kommunikations-Timeline |

---

### Gruppe 4: Armstrong Zone 1

KI-Governance und Monitoring für die Armstrong Suite.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/armstrong` | ArmstrongConsole | Dashboard mit KPIs |
| `/admin/armstrong/actions` | ArmstrongActions | Action-Katalog |
| `/admin/armstrong/logs` | ArmstrongLogs | Ausführungs-Logs |
| `/admin/armstrong/knowledge` | ArmstrongKnowledge | Wissensbasis |
| `/admin/armstrong/billing` | ArmstrongBilling | Credit-Verbrauch |
| `/admin/armstrong/policies` | ArmstrongPolicies | Guardrails & Policies |
| `/admin/armstrong/test` | ArmstrongTest | Test Harness |

---

### Gruppe 5: Feature Activation

Modul-Steuerung und Partner-Management.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/tiles` | TileCatalog | Modul-Katalog & Aktivierung |
| `/admin/partner-verification` | PartnerVerification | Partner-Prüfung |

**Hinweis:** Tile-Aktivierung wirkt erst bei echten Tenants (Phase 11). Im Entwicklungs-Account sind alle Module sichtbar.

---

### Gruppe 6: Backbone

Vereinbarungen und Dokumenten-Eingang.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/agreements` | Agreements | Vereinbarungs-Templates |
| `/admin/inbox` | Inbox | Admin-Posteingang (Caya) |

---

### Gruppe 7: Operative Desks

Workstations für spezifische Geschäftsbereiche.

#### FutureRoom

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/futureroom` | FutureRoom | Dashboard |
| `/admin/futureroom/inbox` | FutureRoomInbox | Mandate-Inbox |
| `/admin/futureroom/zuweisungen` | FutureRoomAssignments | Manager-Zuweisung |
| `/admin/futureroom/bankkontakte` | FutureRoomBanks | Bank-Directory |
| `/admin/futureroom/finanzierungsmanager` | FutureRoomManagers | Manager-Pool |

#### Sales Desk

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/sales-desk` | SalesDesk | Dashboard |
| `/admin/sales-desk/veroeffentlichungen` | SalesDeskPublishing | Publikations-Oversight |
| `/admin/sales-desk/inbox` | SalesDeskInbox | Anfragen-Inbox |
| `/admin/sales-desk/partner` | SalesDeskPartner | Partner-Übersicht |

#### Finance Desk

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/finance-desk` | FinanceDesk | Dashboard (Redirect zu FutureRoom) |

#### Acquiary

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/acquiary` | Acquiary | Dashboard |
| `/admin/acquiary/objekteingang` | AcquiaryObjekteingang | Objekt-Eingang |
| `/admin/acquiary/inbox` | AcquiaryInbox | Akquise-Inbox |
| `/admin/acquiary/mandate` | AcquiaryMandate | Mandats-Verwaltung |
| `/admin/acquiary/kontakte` | AcquiaryKontakte | Kontakt-Staging |
| `/admin/acquiary/outreach` | AcquiaryOutreach | Outreach-Kampagnen |
| `/admin/acquiary/templates` | AcquiaryTemplates | E-Mail-Templates |

#### LeadPool & Provisionen

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/leadpool` | LeadPool | Lead-Pool-Verwaltung |
| `/admin/commissions` | CommissionApproval | Provisionen |

---

### Gruppe 8: AI Agents

KI-Agenten-Governance.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/agents` | AgentsDashboard | Agenten-Übersicht |
| `/admin/agents/catalog` | AgentsCatalog | Agenten-Katalog |
| `/admin/agents/instances` | AgentsInstances | Laufende Instanzen |
| `/admin/agents/runs` | AgentsRuns | Ausführungs-Historie |
| `/admin/agents/policies` | AgentsPolicies | Governance-Regeln |

---

### Gruppe 9: System

Integrationen, Oversight und Audit.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/integrations` | Integrations | System-Integrationen |
| `/admin/oversight` | Oversight | Plattform-Übersicht (KPIs) |
| `/admin/audit` | AuditLog | Audit-Protokoll |

---

### Gruppe 10: Platform Admin

Support und zukünftige Abrechnung.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/support` | Support | Support-Center |
| `/admin/billing` | Billing | Rechnungsstellung (später) |

---

## Zugriffs-Matrix

| Bereich | platform_admin | org_admin | Andere |
|---------|----------------|-----------|--------|
| Alle Zone 1 Routes | ✅ Full | ❌ | ❌ |

Zone 1 ist **exklusiv** für `platform_admin` aus `internal`-Organisationen.

---

## Datenfluss-Regeln

### Zone 1 ist Read-Heavy mit selektiven Writes

| Operation | Typ | Beispiel |
|-----------|-----|----------|
| Tenant-Oversight | READ | Alle Organisations-Daten einsehen |
| Mandats-Delegation | WRITE | `finance_mandates.assigned_manager_id` setzen |
| Partner-Verification | WRITE | `organizations.verified_at` setzen |
| Lead-Zuweisung | WRITE | `leads.assigned_to` setzen |
| Tile-Aktivierung | WRITE | `tenant_tile_activation` Einträge |

### Strikte Trennung

- **Zone 1 liest** Zone 2 Daten (Oversight)
- **Zone 1 schreibt** nur Governance-Daten (Aktivierungen, Zuweisungen, Verifizierungen)
- **Zone 1 verändert NIEMALS** Business-Daten ohne explizite Freigabe

---

## Changelog

| Version | Datum | Änderungen |
|---------|-------|------------|
| 3.0 | 2026-02-08 | 10-Gruppen-Struktur, Armstrong Suite, Masterdata als RO |
| 2.0 | 2026-01-25 | Desks hinzugefügt, FutureRoom erweitert |
| 1.0 | 2026-01-15 | Initiale Struktur |
