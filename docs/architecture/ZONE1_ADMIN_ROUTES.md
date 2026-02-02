# Zone 1: Admin Portal — Route-Struktur

## Übersicht

| Attribut | Wert |
|----------|------|
| **Base Path** | `/admin` |
| **Layout** | `AdminLayout` |
| **Requires Role** | `platform_admin` |
| **Organisation** | `internal` (System of a Town) |

## Architektur

Zone 1 ist das **Governance-Portal** für Platform-Administratoren. Es bietet keine End-User-Business-Funktionen, sondern Konfiguration, Oversight und Plattform-Management.

---

## Route-Gruppierung

### Backbone

Kernfunktionen für Plattform-Governance.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin` | Dashboard | Admin-Übersicht |
| `/admin/organizations` | Organizations | Tenant-Verwaltung |
| `/admin/organizations/:id` | OrganizationDetail | Tenant-Details |
| `/admin/users` | Users | Benutzer-Verwaltung |
| `/admin/delegations` | Delegations | Delegations-Übersicht |
| `/admin/contacts` | MasterContacts | Master-Kontaktdatenbank |
| `/admin/master-templates` | MasterTemplates | Vorlagen-Verwaltung |
| `/admin/tiles` | TileCatalog | Modul-Konfiguration |
| `/admin/integrations` | Integrations | System-Integrationen |
| `/admin/communication` | CommunicationHub | Kommunikations-Center |
| `/admin/oversight` | Oversight | Plattform-Übersicht |
| `/admin/audit` | AuditLog | Audit-Protokoll |
| `/admin/billing` | Billing | Abrechnung |
| `/admin/agreements` | Agreements | Vereinbarungen |
| `/admin/inbox` | Inbox | Admin-Posteingang |
| `/admin/leadpool` | LeadPool | Lead-Pool |
| `/admin/partner-verification` | PartnerVerification | Partner-Prüfung |
| `/admin/commissions` | CommissionApproval | Provisionen |
| `/admin/support` | Support | Support-Center |

---

### FutureRoom (Backbone-Erweiterung)

Finanzierungsmanagement auf Plattform-Ebene.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/futureroom` | FutureRoom | Dashboard |
| `/admin/futureroom/bankkontakte` | FutureRoomBanks | Bank-Directory |
| `/admin/futureroom/finanzierungsmanager` | FutureRoomManagers | Manager-Pool |

**Verantwortlichkeiten:**
- Mandate-Inbox: Triage eingehender Finanzierungsanfragen
- Bank-Directory: Zentrale Bankpartner-Liste
- Manager-Delegation: Zuweisung an `finance_manager`

---

### Agents (Backbone-Erweiterung)

KI-Agenten-Management.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/agents` | AgentsDashboard | Agenten-Übersicht |
| `/admin/agents/catalog` | AgentsCatalog | Agenten-Katalog |
| `/admin/agents/instances` | AgentsInstances | Laufende Instanzen |
| `/admin/agents/runs` | AgentsRuns | Ausführungs-Historie |
| `/admin/agents/policies` | AgentsPolicies | Governance-Regeln |

**Verantwortlichkeiten:**
- Agent-Katalog: Verfügbare KI-Agenten
- Instance-Management: Aktive Agent-Instanzen
- Policy-Enforcement: Sicherheits-Policies

---

### Desks

Operative Workstations für spezifische Geschäftsbereiche.

#### Sales Desk

Verkaufs-Management auf Plattform-Ebene.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/sales-desk` | SalesDeskDashboard | Dashboard |
| `/admin/sales-desk/veroeffentlichungen` | SalesDeskPublishing | Publikations-Oversight |
| `/admin/sales-desk/inbox` | SalesDeskInbox | Anfragen-Inbox |
| `/admin/sales-desk/partner` | SalesDeskPartner | Partner-Übersicht |
| `/admin/sales-desk/audit` | SalesDeskAudit | Verkaufs-Audit |

#### Finance Desk

Finanzierungs-Management auf Plattform-Ebene.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/finance-desk` | FinanceDeskDashboard | Dashboard |
| `/admin/finance-desk/inbox` | FinanceDeskInbox | Anfragen-Inbox |
| `/admin/finance-desk/berater` | FinanceDeskBerater | Berater-Pool |
| `/admin/finance-desk/zuweisung` | FinanceDeskZuweisung | Mandats-Zuweisung |
| `/admin/finance-desk/monitoring` | FinanceDeskMonitoring | Status-Monitoring |

#### Acquiary

Akquise-Management auf Plattform-Ebene.

| Route | Component | Beschreibung |
|-------|-----------|--------------|
| `/admin/acquiary` | AcquiaryDashboard | Dashboard |
| `/admin/acquiary/zuordnung` | AcquiaryZuordnung | Lead-Zuordnung |
| `/admin/acquiary/inbox` | AcquiaryInbox | Akquise-Inbox |
| `/admin/acquiary/mandate` | AcquiaryMandate | Mandats-Verwaltung |

---

## Sidebar-Struktur

Die `AdminSidebar.tsx` gruppiert Routes dynamisch aus dem Manifest:

```
📁 Backbone
  ├── Dashboard
  ├── Organizations
  ├── Users
  ├── Delegations
  ├── Tiles
  ├── Integrations
  ├── Communication
  ├── Oversight
  ├── Audit
  ├── Billing
  └── Support

📁 FutureRoom
  ├── Dashboard
  ├── Bankkontakte
  └── Finanzierungsmanager

📁 Agents
  ├── Dashboard
  ├── Katalog
  ├── Instanzen
  ├── Runs
  └── Policies

📁 Desks
  ├── Sales Desk
  │   ├── Dashboard
  │   ├── Veröffentlichungen
  │   ├── Inbox
  │   ├── Partner
  │   └── Audit
  ├── Finance Desk
  │   ├── Dashboard
  │   ├── Inbox
  │   ├── Berater
  │   ├── Zuweisung
  │   └── Monitoring
  └── Acquiary
      ├── Dashboard
      ├── Zuordnung
      ├── Inbox
      └── Mandate
```

---

## Datenfluss

Zone 1 ist **Read-Heavy** mit selektiven Write-Operationen:

| Operation | Typ | Beispiel |
|-----------|-----|----------|
| Tenant-Oversight | READ | Alle Organisations-Daten einsehen |
| Mandats-Delegation | WRITE | `finance_mandates.assigned_manager_id` setzen |
| Partner-Verification | WRITE | `organizations.verified_at` setzen |
| Policy-Management | WRITE | `org_policies` erstellen/ändern |

---

## Zugriffs-Matrix

| Bereich | platform_admin | org_admin | Andere |
|---------|----------------|-----------|--------|
| Backbone | ✅ Full | ❌ | ❌ |
| FutureRoom | ✅ Full | ❌ | ❌ |
| Agents | ✅ Full | ❌ | ❌ |
| Desks | ✅ Full | ❌ | ❌ |

Zone 1 ist **exklusiv** für `platform_admin` aus `internal`-Organisationen.
