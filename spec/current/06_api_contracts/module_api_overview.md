# Module API Overview — Contract Plan

**Version:** v1.0.0  
**Date:** 2026-02-02  
**Status:** PLANNED / CONTRACT ONLY

---

## Purpose

This document defines the API contract for each module (MOD-01 to MOD-20).
All entities, endpoints, and integrations are PLANNED — implementation follows after approval.

---

## Legend

| Column | Description |
|--------|-------------|
| **Entities** | Database tables/objects managed by module |
| **IDs/Keys** | Required identifiers (tenant_id mandatory) |
| **Core Actions** | Primary user actions |
| **Endpoints** | Planned API paths (Edge Functions) |
| **Zone-1 Intake** | Where data enters from admin governance |
| **RLS/Ownership** | Row-Level Security pattern |
| **Camunda Hook** | Workflow integration (deferred) |

---

## Zone 2: Portal Modules (MOD-01 to MOD-20)

### MOD-01: Stammdaten
| Aspect | Value |
|--------|-------|
| **Entities** | profiles, organizations, org_memberships |
| **IDs/Keys** | tenant_id, user_id, org_id |
| **Core Actions** | Update profile, Manage company, Change password |
| **Endpoints** | /api/profiles/:id, /api/organizations/:id |
| **Zone-1 Intake** | N/A (self-service) |
| **RLS/Ownership** | user-owned (profiles), org_scope (organizations) |
| **Camunda Hook** | Deferred |

### MOD-02: KI Office
| Aspect | Value |
|--------|-------|
| **Entities** | communication_events, contacts, calendar_events |
| **IDs/Keys** | tenant_id, contact_id, event_id |
| **Core Actions** | Send email, Create letter, Manage contacts, Schedule |
| **Endpoints** | /api/office/email, /api/office/letter, /api/contacts |
| **Zone-1 Intake** | N/A |
| **RLS/Ownership** | org_scope |
| **Camunda Hook** | Deferred |

### MOD-03: DMS
| Aspect | Value |
|--------|-------|
| **Entities** | documents, storage_nodes, document_links, extractions |
| **IDs/Keys** | tenant_id, document_id, node_id |
| **Core Actions** | Upload, Classify, Extract, Link to entity |
| **Endpoints** | /api/dms/upload, /api/dms/extract, /api/dms/classify |
| **Zone-1 Intake** | Inbound items → Inbox |
| **RLS/Ownership** | org_scope + node-based ACL |
| **Camunda Hook** | Deferred |

### MOD-04: Immobilien
| Aspect | Value |
|--------|-------|
| **Entities** | properties, units, landlord_contexts, property_features |
| **IDs/Keys** | tenant_id, property_id, unit_id, context_id |
| **Core Actions** | CRUD properties, Assign to context, Set sale_enabled |
| **Endpoints** | /api/properties, /api/units, /api/contexts |
| **Zone-1 Intake** | N/A |
| **RLS/Ownership** | org_scope (tenant_id = owning client) |
| **Camunda Hook** | Deferred (Sanierung workflow) |

### MOD-05: MSV (Miet- und Sondereigentumsverwaltung)
| Aspect | Value |
|--------|-------|
| **Entities** | leases, rent_payments, rental_listings |
| **IDs/Keys** | tenant_id, lease_id, property_id, unit_id |
| **Core Actions** | Create lease, Book payment, Publish rental listing |
| **Endpoints** | /api/msv/leases, /api/msv/payments, /api/msv/listings |
| **Zone-1 Intake** | N/A |
| **RLS/Ownership** | org_scope |
| **Camunda Hook** | Deferred |

### MOD-06: Verkauf
| Aspect | Value |
|--------|-------|
| **Entities** | listings, inquiries, reservations, transactions |
| **IDs/Keys** | tenant_id, listing_id, property_id, inquiry_id |
| **Core Actions** | Create listing, Manage inquiries, Reserve, Complete sale |
| **Endpoints** | /api/verkauf/listings, /api/verkauf/inquiries |
| **Zone-1 Intake** | Sales Desk → Veröffentlichungen |
| **RLS/Ownership** | org_scope + partner visibility flag |
| **Camunda Hook** | Deferred (Sales workflow) |

### MOD-07: Finanzierung
| Aspect | Value |
|--------|-------|
| **Entities** | finance_requests, applicant_profiles, finance_documents |
| **IDs/Keys** | tenant_id, request_id, profile_id |
| **Core Actions** | Fill self-disclosure, Upload docs, Submit request |
| **Endpoints** | /api/finanzierung/requests, /api/finanzierung/profiles |
| **Zone-1 Intake** | Finance Desk → Inbox |
| **RLS/Ownership** | org_scope + assigned_to |
| **Camunda Hook** | Deferred (Finanzierung workflow) |

### MOD-08: Investment-Suche
| Aspect | Value |
|--------|-------|
| **Entities** | investment_profiles, investment_searches, customer_projects |
| **IDs/Keys** | tenant_id, search_id, profile_id |
| **Core Actions** | Search listings, Save favorites, Request mandate |
| **Endpoints** | /api/investments/search, /api/investments/favorites |
| **Zone-1 Intake** | N/A |
| **RLS/Ownership** | org_scope |
| **Camunda Hook** | Deferred |

### MOD-09: Vertriebspartner
| Aspect | Value |
|--------|-------|
| **Entities** | partner_pipelines, commissions, partner_listings |
| **IDs/Keys** | tenant_id, pipeline_id, listing_id, partner_org_id |
| **Core Actions** | Browse catalog, Create pipeline, Earn commission |
| **Endpoints** | /api/partner/catalog, /api/partner/pipelines |
| **Zone-1 Intake** | Partner Verification → Approved partners |
| **RLS/Ownership** | org_scope (partner org) |
| **Camunda Hook** | Deferred |

### MOD-10: Leads
| Aspect | Value |
|--------|-------|
| **Entities** | leads, ad_campaigns, ad_campaign_leads |
| **IDs/Keys** | tenant_id, lead_id, campaign_id |
| **Core Actions** | Receive leads, Qualify, Convert |
| **Endpoints** | /api/leads, /api/leads/campaigns |
| **Zone-1 Intake** | Lead Pool → Distribution |
| **RLS/Ownership** | org_scope |
| **Camunda Hook** | Deferred |

### MOD-11: Finanzierungsmanager
| Aspect | Value |
|--------|-------|
| **Entities** | finance_mandates, future_room_cases, finance_bank_contacts |
| **IDs/Keys** | tenant_id, mandate_id, case_id, bank_id |
| **Core Actions** | Accept mandate, Review case, Submit to bank |
| **Endpoints** | /api/fmanager/mandates, /api/fmanager/cases |
| **Zone-1 Intake** | FutureRoom → Mandate Inbox |
| **RLS/Ownership** | assigned_to (finance_manager role) |
| **Camunda Hook** | Deferred |

### MOD-12: Akquise-Manager
| Aspect | Value |
|--------|-------|
| **Entities** | acquisition_mandates, acquisition_tasks (PLANNED) |
| **IDs/Keys** | tenant_id, mandate_id, customer_id |
| **Core Actions** | Intake customer, Analyze needs, Present, Close |
| **Endpoints** | /api/akquise/mandates, /api/akquise/customers |
| **Zone-1 Intake** | Acquiary → Zuordnung |
| **RLS/Ownership** | org_scope (partner) |
| **Camunda Hook** | Deferred |

### MOD-13: Projekte
| Aspect | Value |
|--------|-------|
| **Entities** | projects, project_milestones (PLANNED) |
| **IDs/Keys** | tenant_id, project_id |
| **Core Actions** | Create project, Track milestones, Manage portfolio |
| **Endpoints** | /api/projects |
| **Zone-1 Intake** | N/A |
| **RLS/Ownership** | org_scope |
| **Camunda Hook** | Deferred |

### MOD-14: Communication Pro
| Aspect | Value |
|--------|-------|
| **Entities** | email_campaigns, social_posts, research_contacts (PLANNED) |
| **IDs/Keys** | tenant_id, campaign_id |
| **Core Actions** | Send series emails, Social posting, Research |
| **Endpoints** | /api/commpro/campaigns, /api/commpro/social |
| **Zone-1 Intake** | N/A |
| **RLS/Ownership** | org_scope (partner) |
| **Camunda Hook** | Deferred |

### MOD-15: Fortbildung
| Aspect | Value |
|--------|-------|
| **Entities** | courses, enrollments, certificates (PLANNED) |
| **IDs/Keys** | tenant_id, course_id, enrollment_id |
| **Core Actions** | Browse catalog, Enroll, Complete, Download certificate |
| **Endpoints** | /api/fortbildung/courses, /api/fortbildung/enrollments |
| **Zone-1 Intake** | N/A (platform-provided content) |
| **RLS/Ownership** | user-owned (enrollments) |
| **Camunda Hook** | Deferred |

### MOD-16: Services
| Aspect | Value |
|--------|-------|
| **Entities** | service_catalog, service_requests, service_orders (PLANNED) |
| **IDs/Keys** | tenant_id, request_id, order_id |
| **Core Actions** | Browse, Request service, Track order |
| **Endpoints** | /api/services/catalog, /api/services/requests |
| **Zone-1 Intake** | N/A |
| **RLS/Ownership** | org_scope |
| **Camunda Hook** | Deferred |

### MOD-17: Car-Management
| Aspect | Value |
|--------|-------|
| **Entities** | vehicles, vehicle_services, fleet_overview (PLANNED) |
| **IDs/Keys** | tenant_id, vehicle_id |
| **Core Actions** | Add vehicle, Schedule service, Track fleet |
| **Endpoints** | /api/cars/vehicles, /api/cars/services |
| **Zone-1 Intake** | N/A |
| **RLS/Ownership** | org_scope (partner) |
| **Camunda Hook** | Deferred |

### MOD-18: Finanzanalyse
| Aspect | Value |
|--------|-------|
| **Entities** | financial_reports, scenarios, kpi_snapshots (PLANNED) |
| **IDs/Keys** | tenant_id, report_id |
| **Core Actions** | Generate report, Run scenarios, Export |
| **Endpoints** | /api/finanzanalyse/reports, /api/finanzanalyse/scenarios |
| **Zone-1 Intake** | N/A |
| **RLS/Ownership** | org_scope |
| **Camunda Hook** | Deferred |

### MOD-19: Photovoltaik
| Aspect | Value |
|--------|-------|
| **Entities** | pv_offers, pv_checklists, pv_projects (PLANNED) |
| **IDs/Keys** | tenant_id, offer_id, project_id |
| **Core Actions** | Request offer, Complete checklist, Track project |
| **Endpoints** | /api/pv/offers, /api/pv/projects |
| **Zone-1 Intake** | N/A (self-service) |
| **RLS/Ownership** | org_scope |
| **Camunda Hook** | Deferred |

### MOD-20: Miety (Renter Portal)
| Aspect | Value |
|--------|-------|
| **Entities** | renter_profiles, renter_documents, meter_readings (PLANNED) |
| **IDs/Keys** | renter_org_id, lease_id, document_id |
| **Core Actions** | View documents, Submit readings, Communicate |
| **Endpoints** | /api/miety/profile, /api/miety/documents, /api/miety/readings |
| **Zone-1 Intake** | Landlord invitation via MOD-05 MSV |
| **RLS/Ownership** | renter_org owned |
| **Camunda Hook** | Deferred |

---

## Zone 1: Admin Desk Intake Points

| Desk | Modules Served | Intake Entity | Status |
|------|----------------|---------------|--------|
| **Finance Desk** | MOD-07, MOD-11 | finance_mandates | PLANNED |
| **Sales Desk** | MOD-06, MOD-09 | listings, partner_releases | PLANNED |
| **Acquiary** | MOD-12 | acquisition_mandates | PLANNED |
| **Lead Pool** | MOD-10 | leads | PLANNED |
| **Partner Verification** | MOD-09 | partner applications | PLANNED |

---

## Camunda Correlation Keys

Format: `{entityType}_{entityId}_{timestamp}`

Examples:
- `finance_request_a1b2c3d4_1706803200`
- `listing_e5f6g7h8_1706803200`
- `acquisition_mandate_i9j0k1l2_1706803200`

---

**Document End**
