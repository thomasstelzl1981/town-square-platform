# Admin Portal Concept — Zone 1

> **Status**: CONCEPT PHASE — NOT YET IMPLEMENTED  
> **Last Updated**: 2026-01-21  
> **Zone**: 1 (Internal Control Center)

---

## Purpose

The Admin Portal (Zone 1) is the **internal control center** for platform operators and administrators. It enables:
- Managing thousands of tenants (organizations)
- Managing millions of user accounts
- Configuring features, integrations, and access
- Supporting users across all tenants (God Mode)
- Preparing data for Zone 2 (User Portals) and Zone 3 (Websites)

---

## Three-Zone Relationship

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SHARED FOUNDATION                           │
│  (Database, RLS, Organizations, Memberships, Delegations, Audit)    │
└─────────────────────────────────────────────────────────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ZONE 1        │    │   ZONE 2        │    │   ZONE 3        │
│   Admin Portal  │───▶│   User Portals  │───▶│   Websites      │
│   (Operators)   │    │   (End Users)   │    │   (Public)      │
│                 │    │                 │    │                 │
│   • Configure   │    │   • Work        │    │   • Convert     │
│   • Manage      │    │   • Collaborate │    │   • Advise      │
│   • Support     │    │   • Communicate │    │   • Capture     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Proposed Menu Structure

### 📊 DASHBOARD
System health, tenant counts, pending actions, alerts.

### 🏢 TENANTS & STRUCTURE
| Subsection | Responsibility |
|------------|----------------|
| Organizations | Create/manage org hierarchy, view tree |
| Partner Structures | Sales networks, partner relationships |
| Org Settings | Per-tenant configuration |

**Prepares Zone 2**: Tenant context for user login  
**Prepares Zone 3**: Which portal/brand to render

### 👥 USERS & ACCESS
| Subsection | Responsibility |
|------------|----------------|
| User Accounts | Profiles, credentials, status |
| Memberships | User ↔ Org assignments with roles |
| Roles & Capabilities | Role definitions (future) |
| Delegations | Cross-org access grants |

**Prepares Zone 2**: User authentication, role-based UI  
**Prepares Zone 3**: Returning visitor identification

### 📇 CONTACTS (Master Registry)
| Subsection | Responsibility |
|------------|----------------|
| All Contacts | Unified contact registry (persons/companies) |
| Account Links | Contact ↔ User mapping |
| Import / Sync | Bulk import, deduplication |

**Prepares Zone 2**: CRM tile, Immobilien contacts  
**Prepares Zone 3**: Lead capture destination

### 📬 COMMUNICATION HUB
| Subsection | Responsibility |
|------------|----------------|
| Email Flows | Inbound/outbound configuration |
| Newsletters & Campaigns | Template management, campaign rules |
| Serial Letters | Template management, merge logic |
| Logs & Delivery Status | Tracking, debugging |

**Prepares Zone 2**: Email sending, notifications  
**Prepares Zone 3**: Inquiry handling, lead notifications

### 📮 POST & DOCUMENTS
| Subsection | Responsibility |
|------------|----------------|
| Inbound Post | Kaya inbox, digitized mail |
| Outbound Post | Queue, tracking, status |
| Document Routing | Assign to tenant/user/contact |
| Metadata & Classification | Document tagging, categorization |

**Prepares Zone 2**: Document inbox per user  
**Prepares Zone 3**: Document collection from forms

### 🧩 FEATURE ACTIVATION
| Subsection | Responsibility |
|------------|----------------|
| Feature Catalog | Available tile-modules for Zone 2 |
| Tenant Features | Active features per organization |
| Dependencies & Bundles | Module prerequisites |

**Prepares Zone 2**: Which tiles to render per tenant/role

### 🔗 INTEGRATIONS
| Subsection | Responsibility |
|------------|----------------|
| API Connections | Status, credentials, health |
| Webhooks & Events | Event routing configuration |
| Partner APIs | Europace, ProHyp, etc. |

**Prepares Zone 2 + 3**: API calls, external data

### 💳 BILLING & PLANS (P2)
| Subsection | Responsibility |
|------------|----------------|
| Subscription Plans | Plan definitions |
| Tenant Billing | Per-tenant billing status |
| Credits & Usage | Usage tracking |

### 🛡️ SECURITY & COMPLIANCE
| Subsection | Responsibility |
|------------|----------------|
| Audit Events | Event log viewer with filtering |
| Privacy Settings | Lockdown status per org |
| Data Policies | Retention, export rules |

### 🆘 SUPPORT CENTER
| Subsection | Responsibility |
|------------|----------------|
| User Lookup | Search, impersonate (God Mode) |
| Tickets | Support ticket management (P2) |
| System Logs | Technical debugging |

### ⚙️ SYSTEM
| Subsection | Responsibility |
|------------|----------------|
| Settings | Platform-wide configuration |
| Admin Users | Platform admin management |

---

## What NEVER Belongs in Admin Portal

| Feature | Reason | Belongs To |
|---------|--------|------------|
| Property management UI | Business work | Zone 2 (Immobilien tile) |
| Lease/rental workflows | Business work | Zone 2 (Miety tile) |
| Financing calculators | End-user tool | Zone 2 (Finanzierung tile) |
| Chat/AI assistant | End-user experience | Zone 2 + Zone 3 |
| Exposé builder | Content creation | Zone 2 (Exposé tile) |
| Customer-facing dashboards | End-user UX | Zone 2 |
| Marketing landing pages | Public content | Zone 3 |

**Rule of thumb**: If it's *doing* business work → Zone 2/3. If it's *configuring/managing* → Zone 1.

---

## Scalability Requirements

### Database
- Cursor-based pagination for all lists
- GIN indexes for full-text search
- Partial indexes for status-based filtering
- Materialized views for aggregate stats (optional)

### UI
- Virtual scrolling for large lists
- Lazy-loaded components
- Server-side filtering and sorting
- Debounced search inputs

### Caching
- React Query for client state
- Future: Redis for high-frequency queries

---

## Proposed Module/Feature Framework (Future Schema)

```sql
-- Catalog of available features
CREATE TABLE module_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Feature dependencies
CREATE TABLE module_dependencies (
  module_id TEXT REFERENCES module_catalog(id),
  depends_on TEXT REFERENCES module_catalog(id),
  PRIMARY KEY (module_id, depends_on)
);

-- Activated features per tenant
CREATE TABLE tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id),
  module_id TEXT REFERENCES module_catalog(id),
  activated_at TIMESTAMPTZ DEFAULT now(),
  activated_by UUID REFERENCES auth.users(id),
  is_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(tenant_id, module_id)
);
```

---

## Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | **Contact ownership**: Globally unique or tenant-scoped? | Deduplication, privacy |
| 2 | **Inbound post routing**: Rules, AI, or manual? | Post & Documents complexity |
| 3 | **Email domains**: Per-tenant subdomain or shared? | Email config UI |
| 4 | **Feature dependencies**: Strict DAG or soft recommendations? | Feature Activation logic |
| 5 | **Billing model**: Per-seat, per-tenant, per-feature, usage? | Billing schema |

---

## Priority Backlog

### P0 — Must Have for Productive Admin Portal
1. Search + Filter + Pagination (Organizations, Users)
2. Audit Events Viewer
3. Full Organization Tree View
4. Membership bulk operations
5. Feature Catalog + Tenant Activation (schema + UI)

### P1 — Short-Term Next
6. Contact Master Registry (schema + basic UI)
7. Email Configuration UI
8. Inbound Post Routing (basic)
9. Integration Status Dashboard
10. Support Mode enhancements

### P2 — Later
11. Billing & Plans
12. Ticket System
13. Newsletter/Campaign Management
14. Serial Letter Builder
15. Advanced Analytics

---

## Current Implementation Status (Phase 1.2)

| Feature | Status |
|---------|--------|
| Auth + Session | ✅ Implemented |
| Admin Shell (Sidebar) | ✅ Implemented |
| Organizations (List/Detail/Create) | ✅ Implemented |
| Users/Memberships (CRUD) | ✅ Implemented |
| Delegations (Create/Revoke) | ✅ Implemented |
| Support Mode (Basic) | ✅ Implemented |
| Dashboard (Basic Stats) | ✅ Implemented |
| Parent Access Lockdown | ✅ Implemented |
| Audit Events Table | ✅ Implemented (schema only) |
| Search/Pagination | ❌ Not yet |
| Feature Activation | ❌ Not yet |
| Contact Registry | ❌ Not yet |
| Communication Hub | ❌ Not yet |
| Post & Documents | ❌ Not yet |

---

## Next Steps (Pending Approval)

1. **Discuss and finalize Open Questions** (especially Contact ownership)
2. **Approve P0 items** for implementation
3. **Design Contact Master schema** before implementation
4. **Design Communication Hub schema** before implementation
5. **Design Post & Documents schema** before implementation

---

*This document is for alignment only. No implementation until explicit approval.*
