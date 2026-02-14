# SYSTEM OF A TOWN — DEEP AUDIT v2.0

**Datum:** 2026-02-14  
**Scope:** Repo ↔ Runtime ↔ Doku — Golden Paths, ZBC, Demo-Container, Investment Engine  
**Methodik:** Statische Code-Analyse + DB-Queries + Linter + Manifest-Abgleich

---

## 1. EXECUTIVE SUMMARY

| Dimension | Score | Details |
|-----------|-------|---------|
| Routing & Manifest | 9/10 | 1 base-path naming drift (MOD-10) |
| Golden Path Engine | 10/10 | 7 GPs registered, guards active, validators present |
| Contracts (ZBC) | 9/10 | 21 contracts documented, 12 cross-zone functions mapped |
| Demo-Container | 9/10 | 15 processes, all client-side, proper toggle isolation |
| Investment Engine | 10/10 | Clean separation, no demo contamination |
| Data Model / SSOT | 9/10 | 3 demo properties in DB (intentional, `is_demo=true`) |
| Build / Security | 7/10 | 2 SECURITY DEFINER views, auth not hardened |
| Orphan Code | 7/10 | 1 orphan directory, 5 orphan edge functions |
| **OVERALL** | **8.6/10** | |

**P0 Issues: 0** | **P1 Issues: 0** | **P2 Issues: 3** | **P3 Issues: 4**

---

## 2. MODULE WORLD DOCUMENTATION

### Zone 1: Admin (`/admin`) — 45 Routes
| Bereich | Routes | Status |
|---------|--------|--------|
| Core | Dashboard, Organizations, Users, Delegations | ✅ |
| Masterdata | 7 template routes (Immobilienakte, Selbstauskunft, Projektakte, etc.) | ✅ |
| KI Office | Recherche, Kontaktbuch, E-Mail Agent | ✅ |
| FutureRoom | Dashboard + 7 sub-routes (Inbox, Zuweisung, Manager, Banken, etc.) | ✅ |
| Acquiary | Dashboard + 8 sub-routes | ✅ |
| Sales Desk | Dashboard + 4 sub-routes | ✅ |
| Armstrong | Dashboard + 7 sub-routes (Actions, Logs, Billing, KB, etc.) | ✅ |
| Other | Tiles, Integrations, Oversight, Audit, Agreements, Inbox, etc. | ✅ |

### Zone 2: Portal (`/portal`) — 21 Module (MOD-00 to MOD-20)

| Module | Base Path | Tiles | Dynamic Routes | Area | Status |
|--------|-----------|-------|----------------|------|--------|
| MOD-00 Dashboard | /portal/dashboard | 0 | 0 | — | ✅ |
| MOD-01 Stammdaten | /portal/stammdaten | 5 | 0 | Base | ✅ |
| MOD-02 KI Office | /portal/office | 7 | 1 | Client | ✅ |
| MOD-03 DMS | /portal/dms | 4 | 0 | Base | ✅ |
| MOD-04 Immobilien | /portal/immobilien | 4 | 3 | Client | ✅ |
| MOD-05 Website Builder | /portal/website-builder | 0 | 1 | Service | ✅ |
| MOD-06 Verkauf | /portal/verkauf | 4 | 1 | Client | ✅ |
| MOD-07 Finanzierung | /portal/finanzierung | 5 | 1 | Client | ✅ |
| MOD-08 Investment-Suche | /portal/investments | 4 | 3 | Client | ✅ |
| MOD-09 Vertriebspartner | /portal/vertriebspartner | 5 | 8 | Manager | ✅ |
| MOD-10 Abrechnung | /portal/leads | 1 | 0 | Manager | ⚠️ base≠name |
| MOD-11 Finanzierungsmanager | /portal/finanzierungsmanager | 5 | 2 | Manager | ✅ |
| MOD-12 Akquise-Manager | /portal/akquise-manager | 5 | 3 | Manager | ✅ |
| MOD-13 Projekte | /portal/projekte | 4 | 2 | Manager | ✅ |
| MOD-14 Communication Pro | /portal/communication-pro | 4 | 0 | Service | ✅ |
| MOD-15 Fortbildung | /portal/fortbildung | 4 | 0 | Service | ✅ |
| MOD-16 Shops | /portal/services | 4 | 0 | Service | ✅ |
| MOD-17 Car-Management | /portal/cars | 4 | 0 | Base | ✅ |
| MOD-18 Finanzanalyse | /portal/finanzanalyse | 4 | 0 | Base | ✅ |
| MOD-19 Photovoltaik | /portal/photovoltaik | 4 | 2 | Base | ✅ |
| MOD-20 Miety | /portal/miety | 5 | 1 | (inline MOD-04) | ✅ |

### Zone 3: Websites (`/website/*`) — 7 Brands

| Brand | Base | Routes | Status |
|-------|------|--------|--------|
| Kaufy | /website/kaufy | 5 | ✅ |
| Miety | /website/miety | 9 | ✅ |
| FutureRoom | /website/futureroom | 6 | ✅ |
| SoT | /website/sot | 12 | ✅ |
| Acquiary | /website/acquiary | 5 | ✅ |
| Projekt LP | /website/projekt | 1 (dynamic) | ✅ |
| Tenant Sites | /website/sites | 1 (dynamic) | ✅ |

### Area Config (Navigation Grouping)

| Area | Label | Modules |
|------|-------|---------|
| Client | Client | MOD-02, MOD-04, MOD-07, MOD-06, MOD-08 |
| Manager | Manager | MOD-13, MOD-09, MOD-11, MOD-12, MOD-10 |
| Base | Base | MOD-03, MOD-18, MOD-17, MOD-19, MOD-01 |
| Service | Service | MOD-14, MOD-15, MOD-05, MOD-16 |

---

## 3. DRIFT REPORT (Repo vs Runtime)

| ID | Type | Finding | Severity |
|----|------|---------|----------|
| DR-01 | Orphan Code | `src/pages/portal/msv/` (6 files) not imported anywhere — legacy MSV pages pre-consolidation | P2 |
| DR-02 | Naming Drift | MOD-10 name="Abrechnung" but base="leads" — historical artifact | P3 |
| DR-03 | TODO in Code | `MSVDashboard.tsx:59` — "TODO: Replace with real rental_managed properties" | P3 |
| DR-04 | Components | `src/components/msv/index.ts` exports 8 components — still actively used by VerwaltungTab | OK |

---

## 4. GOLDEN PATH TESTBOOK

### 4.1 Engine-Registered Golden Paths (7)

| GP | Registration | Guard | Validator | Preconditions | Status |
|----|-------------|-------|-----------|---------------|--------|
| MOD-04 Immobilie | `registerGoldenPath('MOD-04', ...)` | ✅ `:id` route | ✅ contextResolvers.ts | Property exists, tenant_id match | ✅ |
| MOD-07/11 Finanzierung | `registerGoldenPath('MOD-07', ...)` | ✅ `:requestId` route | ✅ | Applicant profile, finance_request | ✅ |
| MOD-08/12 Akquise | `registerGoldenPath('MOD-08', ...)` | ✅ `:mandateId`, `:offerId` | ✅ | Mandate exists | ✅ |
| MOD-13 Projekte | `registerGoldenPath('MOD-13', ...)` | ✅ `:projectId` | ✅ | Project exists | ✅ |
| GP-VERMIETUNG | `registerGoldenPath('GP-VERMIETUNG', ...)` | Via MOD-04 | ✅ | Lease, property | ✅ |
| GP-LEAD | `registerGoldenPath('GP-LEAD', ...)` | N/A (Z3→Z1) | ✅ | Website form submit | ✅ |
| GP-FINANCE-Z3 | `registerGoldenPath('GP-FINANCE-Z3', ...)` | N/A (Z3→Z1) | ✅ | Applicant data + KDF check | ✅ |

### 4.2 Demo-Only Golden Paths (8 additional via demoDataManifest)

All 15 GP processes are covered by the demoDataManifest with toggles. Non-engine GPs (GP-SANIERUNG, GP-SIMULATION, GP-SERIEN-EMAIL, GP-RECHERCHE, GP-FAHRZEUG, GP-PV-ANLAGE, GP-WEBSITE, GP-FM-FALL) use `useDemoLocalEntity` for client-side-only demo data with inject merge strategy.

---

## 5. CONTRACT TEST SUITE

### 5.1 Coverage Summary

| Total Contracts | With Edge Function | DB-Only | Webhook/Cron |
|----------------|--------------------|---------|--------------|
| 21 | 14 | 4 | 3 |

### 5.2 Cross-Zone Edge Function Registry (architectureValidator.ts)

12 functions registered with contract mapping — all verified present in `supabase/functions/`.

### 5.3 Contract Implementation Types (per INDEX.md update)

- **Edge Function**: sot-lead-inbox, sot-finance-manager-notify, sot-listing-publish, sot-social-mandate-submit, sot-project-intake, sot-acq-outbound, sot-renovation-outbound, sot-generate-landing-page, sot-renter-invite
- **Edge Function (Webhook)**: sot-inbound-receive, sot-acq-inbound-webhook, sot-renovation-inbound-webhook, sot-whatsapp-webhook, sot-whatsapp-media, sot-social-payment-create/webhook
- **Edge Function (Cron)**: finance-document-reminder
- **DB Status-Enum**: CONTRACT_FINANCE_SUBMIT (finance_requests), CONTRACT_ACQ_MANDATE_SUBMIT (acq_mandates)
- **DB Trigger**: CONTRACT_ONBOARDING (on_auth_user_created)
- **DB Table/RLS**: CONTRACT_DATA_ROOM_ACCESS (access_grants)
- **DB Table/Trigger**: CONTRACT_LISTING_DISTRIBUTE (listings + listing_publications)

---

## 6. DEMO-CONTAINER MAP

### 6.1 Toggle Mechanism

| Component | Implementation | Scope | Status |
|-----------|---------------|-------|--------|
| useDemoToggles | localStorage (`gp_demo_toggles_{userId}`) | Per-user | ✅ Scoped |
| DemoDatenTab | MOD-01 Stammdaten | UI toggle panel | ✅ |
| goldenPathProcesses | 15 processes defined | All zones | ✅ |

### 6.2 Demo Data Sources

| Source | Type | DB Impact | Status |
|--------|------|-----------|--------|
| useDemoListings | Client-side synthetic | NONE | ✅ Clean |
| useDemoLocalEntity | Client-side synthetic | NONE | ✅ Clean |
| useDemoFinanceCase | Client-side synthetic | NONE | ✅ Clean |
| useDemoAcquisition | Client-side synthetic | NONE | ✅ Clean |
| properties (is_demo=true) | DB records | 3 rows (BER-01, MUC-01, HH-01) | ✅ Documented |

### 6.3 Investment Engine Analysis

**Finding: NO contamination detected.**

- `useInvestmentEngine.ts`: Pure edge function call with typed I/O, no demo branching
- Demo listings provide `monthlyRent` + `askingPrice` for demo simulations but calculations are real
- Investment components (MasterGraph, InvestmentSliderPanel, etc.) receive data-agnostic props
- PortfolioTab correctly filters `is_demo` properties when toggle is OFF
- Dedup logic in consumers prevents double-display when DB and demo sources overlap

---

## 7. ROUTING/NAV AUDIT

| Check | Result |
|-------|--------|
| Zone Boundary (ZBC-R09) | ✅ All 7 Z3 websites under `/website/**` |
| Legacy Redirects | ✅ 18 redirect rules covering all known legacy paths |
| GoldenPath Guard Coverage | ✅ MOD-04, MOD-07, MOD-12, MOD-13, MOD-19 |
| Tile Catalog Sync (ZBC-R13) | ✅ Runtime validator active in DEV |
| MOD-20 Exclusion | ✅ Documented in areaConfig.ts JSDoc |

---

## 8. TECH DEEP TEST

### 8.1 Linter (4 findings — all pre-existing)

| Finding | Severity | Status |
|---------|----------|--------|
| SECURITY DEFINER view #1 (v_public_listings) | ERROR | Acknowledged (SIA-0005) |
| SECURITY DEFINER view #2 | ERROR | Acknowledged (SIA-0005) |
| Auth OTP long expiry | WARN | Acknowledged (SIA-0006) |
| Leaked password protection disabled | WARN | Acknowledged (SIA-0006) |

### 8.2 pg_trgm Extension
Migrated from `public` to `extensions` schema (SIA-0007, done this session).

### 8.3 Edge Function Orphans (from SIA-0009)
5 candidates: `sot-social-autoresponder`, `sot-research-run-order`, `sot-research-free`, `sot-research-firecrawl-extract`, `sot-dms-upload-url`.

---

## 9. REPARATURPLAN

| Priority | ID | Title | Risk | Effort |
|----------|----|----|------|--------|
| **P2** | BL-000001 | Delete orphan `src/pages/portal/msv/` directory | low | 5 min |
| **P2** | BL-000002 | SECURITY DEFINER views require Cloud config (SIA-0005) | low | Cloud config |
| **P2** | BL-000003 | Auth hardening: OTP + leaked password (SIA-0006) | low | Cloud config |
| **P3** | BL-000004 | MOD-10 base path "leads" → rename to "abrechnung" | medium | Route migration |
| **P3** | BL-000005 | Remove TODO in MSVDashboard.tsx | low | 5 min |
| **P3** | BL-000006 | Delete 5 orphan edge functions (SIA-0009) | medium | Product review |
| **P3** | BL-000007 | MSVPage.tsx redirect can be removed (MSV route not in manifest) | low | 5 min |

---

## 10. BACKLOG JSON

See `spec/audit/deep_audit_v2_backlog.json`
