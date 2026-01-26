# DATA MODEL CATALOG

**Version:** v1.0  
**Datum:** 2026-01-26

---

## Tabellen-Übersicht nach Owner

### Backbone / Core

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `profiles` | EXISTS | User Profiles |
| `organizations` | EXISTS | Tenants/Orgs |
| `memberships` | EXISTS | User-Org Relations |
| `contacts` | EXISTS | Shared Contacts |
| `documents` | EXISTS | DMS Documents |
| `agreement_templates` | EXISTS | Consent Templates |
| `user_consents` | EXISTS | Consent Records |
| `audit_events` | EXISTS | Audit Log |
| `org_delegations` | EXISTS | Org-to-Org Delegations |
| `access_grants` | EXISTS | Document Access |
| `tile_catalog` | EXISTS | Module Catalog |
| `tenant_tile_activation` | EXISTS | Tile Activation |
| `integration_registry` | EXISTS | Integrations |
| `plans` | EXISTS | Subscription Plans |
| `subscriptions` | EXISTS | Tenant Subscriptions |
| `invoices` | EXISTS | Billing Invoices |

### MOD-04 Immobilien

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `properties` | EXISTS | Properties |
| `units` | EXISTS | Units |
| `property_features` | EXISTS | Feature Flags |
| `property_financing` | EXISTS | Loan Data |

### MOD-05 MSV

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `leases` | EXISTS | Lease Contracts |
| `renter_invites` | EXISTS | Miety Invites |
| `rent_payments` | NEW | Payment Tracking |
| `rent_reminders` | NEW | Payment Reminders |
| `msv_enrollments` | NEW | MSV Activation per Property |

### MOD-06 Verkauf

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `listings` | NEW | Sales Listings |
| `listing_publications` | NEW | Channel Publications |
| `listing_partner_visibility` | NEW | Partner Access |
| `inquiries` | NEW | Buyer Inquiries |
| `reservations` | NEW | Reservations |
| `transactions` | NEW | Completed Sales |

### MOD-07 Finanzierung

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `finance_cases` | NEW | Financing Cases |
| `finance_case_parties` | NEW | Case Parties |
| `finance_case_documents` | NEW | Document Checklist |
| `finance_readiness_snapshots` | NEW | Readiness Tracking |
| `finance_exports` | NEW | Export Bundles |
| `finance_handoffs` | NEW | Future Room Handoffs |
| `finance_packages` | EXISTS | Legacy (migrate) |
| `finance_documents` | EXISTS | Legacy (migrate) |
| `self_disclosures` | EXISTS | Self-Disclosure Forms |

### MOD-08 Investment-Suche

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `investment_profiles` | EXISTS | Investor Profiles |
| `investment_favorites` | NEW | Watchlist |
| `investment_searches` | NEW | Saved Searches |
| `scraper_providers` | NEW | Scraper Registry |
| `scraper_jobs` | NEW | Scraper Jobs |
| `scraper_results` | NEW | Scraper Results |

### MOD-09 Vertriebspartner

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `partner_pipelines` | EXISTS | Partner Pipeline |
| `commissions` | EXISTS | Commissions |
| `partner_selections` | NEW | Partner Shortlist |
| `partner_verifications` | NEW | Verification Status |

### MOD-10 Leadgenerierung

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `leads` | NEW | Lead Records |
| `lead_assignments` | NEW | Pool Assignments |
| `partner_deals` | NEW | Deal Pipeline |
| `lead_activities` | NEW | Activity Log |
| `ad_campaigns` | NEW | Meta Campaigns |
| `ad_campaign_leads` | NEW | Campaign-Lead Link |

### Zone 1 Admin

| Tabelle | Status | Beschreibung |
|---------|--------|--------------|
| `inbound_items` | EXISTS | Inbound Post |
| `inbound_routing_rules` | EXISTS | Routing Rules |

---

## Neue Tabellen (zu erstellen)

### `listings`

```sql
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  property_id UUID NOT NULL,
  public_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  asking_price NUMERIC,
  commission_rate NUMERIC, -- 5-15%
  status TEXT DEFAULT 'draft', -- draft, active, reserved, sold, withdrawn
  partner_visibility TEXT DEFAULT 'none', -- none, selected, all
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT listings_tenant_property_fk 
    FOREIGN KEY (tenant_id, property_id) 
    REFERENCES properties(tenant_id, id)
);
```

### `leads`

```sql
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  public_id TEXT UNIQUE,
  source TEXT NOT NULL, -- zone1_pool, meta_self, meta_property, referral, manual
  source_campaign_id UUID,
  contact_id UUID REFERENCES contacts(id),
  assigned_partner_id UUID,
  status TEXT DEFAULT 'new', -- new, contacted, qualified, converted, lost
  interest_type TEXT, -- buy, finance, consult
  property_interest_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `finance_cases`

```sql
CREATE TABLE public.finance_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  public_id TEXT UNIQUE,
  case_code TEXT,
  scope_type TEXT DEFAULT 'property', -- property, portfolio
  primary_property_id UUID,
  included_property_ids UUID[],
  purpose TEXT, -- refinance, purchase, equity_release, construction, other
  status TEXT DEFAULT 'draft', -- draft, collecting, ready, blocked, exported, submitted, acknowledged, failed
  responsible_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Enums

```sql
-- Listing Status
CREATE TYPE listing_status AS ENUM (
  'draft', 'internal_review', 'active', 'reserved', 'sold', 'withdrawn'
);

-- Lead Status
CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'converted', 'lost'
);

-- Deal Stage
CREATE TYPE deal_stage AS ENUM (
  'lead', 'qualified', 'proposal', 'negotiation', 
  'reservation', 'closing', 'won', 'lost'
);

-- Finance Case Status
CREATE TYPE finance_case_status AS ENUM (
  'draft', 'collecting', 'ready', 'blocked', 
  'exported', 'submitted', 'acknowledged', 'failed'
);

-- Partner Verification Status
CREATE TYPE partner_verification_status AS ENUM (
  'pending', 'documents_submitted', 'under_review', 
  'approved', 'rejected', 'expired'
);
```

---

## Foreign Key Patterns

### Composite FK mit tenant_id

Alle Child-Tabellen nutzen Composite FKs:

```sql
-- Beispiel: listings → properties
CONSTRAINT listings_tenant_property_fk 
  FOREIGN KEY (tenant_id, property_id) 
  REFERENCES properties(tenant_id, id)
```

Dies verhindert Cross-Tenant-Referenzen.

---

*Dieses Dokument ist der vollständige Datenmodell-Katalog.*
