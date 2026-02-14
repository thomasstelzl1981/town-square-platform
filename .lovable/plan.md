
## SYSTEM OF A TOWN — Deep System Audit Report

---

## 1. MODULE WORLD DOCUMENTATION (Ist-Stand)

### Zone 1: Admin Portal (`/admin`)

| Route | Title | Status |
|---|---|---|
| `/admin` | Dashboard | Active |
| `/admin/organizations` | Organisationen | Active |
| `/admin/organizations/:id` | Organisation Details | Active |
| `/admin/users` | Benutzer | Active |
| `/admin/delegations` | Delegationen | Active |
| `/admin/masterdata` | Stammdaten-Vorlagen (+ 6 Sub-Routes) | Active |
| `/admin/ki-office/recherche,kontakte,email` | KI Office (3 Pages) | Active |
| `/admin/tiles` | Tile-Katalog | Active |
| `/admin/integrations` | Integrationen | Active |
| `/admin/oversight` | Oversight | Active |
| `/admin/audit` | Audit Hub | Active |
| `/admin/agreements` | Vereinbarungen | Active |
| `/admin/inbox` | Posteingang | Active |
| `/admin/leadpool` | Lead Pool | Active |
| `/admin/partner-verification` | Partner-Verifizierung | Active |
| `/admin/roles` | Rollen & Berechtigungen | Active |
| `/admin/commissions` | Provisionen | Active |
| `/admin/support` | Support | Active |
| `/admin/futureroom` + 8 sub-routes | FutureRoom Governance | Active |
| `/admin/agents` + 4 sub-routes | Agents | Active |
| `/admin/acquiary` + 6 sub-routes | Acquiary | Active |
| `/admin/sales-desk` + 4 sub-routes | Sales Desk | Active |
| `/admin/armstrong` + 7 sub-routes | Armstrong Console | Active |
| `/admin/landing-pages` | Landing Pages | Active |
| `/admin/fortbildung` | Fortbildung | Active |
| `/admin/website-hosting` | Website Hosting | Active |

### Zone 2: Portal (`/portal`) — 21 Module

| Code | Name | Base | Tiles | Dynamic Routes | Area |
|---|---|---|---|---|---|
| MOD-00 | Dashboard | dashboard | 0 | 0 | - |
| MOD-01 | Stammdaten | stammdaten | 5 (Profil, Vertraege, Abrechnung, Sicherheit, Demo-Daten) | 0 | base |
| MOD-02 | KI Office | office | 7 (Email, Brief, Kontakte, Kalender, Widgets, WhatsApp, Videocalls) | 1 | missions |
| MOD-03 | DMS | dms | 4 (Storage, Posteingang, Sortieren, Einstellungen) | 0 | base |
| MOD-04 | Immobilien | immobilien | 4 (Zuhause, Portfolio, Verwaltung, Sanierung) | 3 | missions |
| MOD-05 | Website Builder | website-builder | 0 | 1 | services |
| MOD-06 | Verkauf | verkauf | 4 (Objekte, Anfragen, Vorgaenge, Reporting) | 1 | missions |
| MOD-07 | Finanzierung | finanzierung | 5 (Selbstauskunft, Dokumente, Anfrage, Status, Privatkredit) | 1 | missions |
| MOD-08 | Investment-Suche | investments | 4 (Suche, Favoriten, Mandat, Simulation) | 3 | missions |
| MOD-09 | Vertriebspartner | vertriebspartner | 5 (Katalog, Beratung, Kunden, Network, Leads) | 8 | operations |
| MOD-10 | Abrechnung | leads | 1 (Uebersicht) | 0 | operations |
| MOD-11 | Finanzierungsmanager | finanzierungsmanager | 5 (Dashboard, Akte, Einreichung, Provisionen, Archiv) | 2 | operations |
| MOD-12 | Akquise-Manager | akquise-manager | 5 (Dashboard, Mandate, Objekteingang, Datenbank, Tools) | 3 | operations |
| MOD-13 | Projekte | projekte | 4 (Dashboard, Projekte, Vertrieb, Landing Page) | 2 | operations |
| MOD-14 | Communication Pro | communication-pro | 4 (Serien-Emails, Recherche, Social, KI-Telefon) | 0 | services |
| MOD-15 | Fortbildung | fortbildung | 4 (Buecher, Fortbildungen, Vortraege, Kurse) | 0 | services |
| MOD-16 | Shops | services | 4 (Amazon, OTTO Office, Miete24, Bestellungen) | 0 | services |
| MOD-17 | Car-Management | cars | 4 (Fahrzeuge, Boote, Privatjet, Angebote) | 0 | base |
| MOD-18 | Finanzanalyse | finanzanalyse | 4 (Dashboard, Reports, Szenarien, Settings) | 0 | base |
| MOD-19 | Photovoltaik | photovoltaik | 4 (Anlagen, Enpal, Dokumente, Einstellungen) | 2 | base |
| MOD-20 | Miety | miety | 5 (Uebersicht, Versorgung, Versicherungen, Smart Home, Kommunikation) | 1 | - |

MOD-20 is rendered inline within MOD-04 as "ZUHAUSE" default tile. Not in areaConfig independently.

### Zone 3: Websites

| Brand | Base | Routes | Status |
|---|---|---|---|
| Kaufy | `/website/kaufy` | 5 (Home, Vermieter, Verkaeufer, Vertrieb, Expose/:publicId) | Active |
| Miety | `/website/miety` | 9 (Home, Leistungen, Vermieter, App, Preise, So-funktioniert, Kontakt, Registrieren, Invite) | Active |
| FutureRoom | `/website/futureroom` | 6 (Home, Bonitat, Karriere, FAQ, Login, Akte) | Active |
| SoT | `/website/sot` | 14 (Home, Real-Estate, Capital, Projects, Management, Energy, Karriere, Produkt, Module, Module/:id, Preise, Demo, FAQ, Use-Cases) | Active |
| Acquiary | `/website/acquiary` | 5 (Home, Methodik, Netzwerk, Karriere, Objekt) | Active |
| Projekt | `/website/projekt` | 1 (/:slug dynamic) | Active |
| Sites | `/website/sites` | 1 (/:slug dynamic) | Active |

---

## 2. DRIFT REPORT (Repo vs Runtime)

### P0 Critical: `properties.annual_income` is NULL for all demo properties

**Root Cause**: The migration that created the demo properties set `purchase_price` but NOT `annual_income`. All DB-driven views (Kaufy Home, MOD-08 SucheTab, MOD-09 BeratungTab, Expose pages) derive `monthly_rent_total` from `properties.annual_income / 12`, which returns 0 when NULL.

**Impact**: When the DB query runs (after user clicks "search"), all three demo properties show 0 EUR rent and 0% yield, despite `useDemoListings.ts` providing correct values. The deduplication logic means: if both DB and demo exist for the same property, either the demo version shows (correct rent) or the DB version shows (0 rent), depending on which takes priority.

**Evidence**: `SELECT p.annual_income FROM properties WHERE code IN ('BER-01','MUC-01','HH-01')` returns NULL for all three.

### P1: `v_public_listings` view missing `monthly_rent` column

The view only exposes: `public_id, title, description, asking_price, city, postal_code, property_type, total_area_sqm, year_built, published_at, channel`. No rent/income data. Consumers must join separately to `properties.annual_income` (which is also NULL -- see P0).

### P1: MOD-20 (Miety) not in `areaConfig.ts`

MOD-20 is defined in `routesManifest.ts` but absent from all 4 areas in `areaConfig.ts`. It is rendered inline in MOD-04 as "ZUHAUSE", so it has no standalone nav entry. This is architecturally intentional but undocumented -- a user navigating to `/portal/miety/*` directly would bypass the area system.

### P2: `rolesMatrix.ts` still lists MOD-20 as "Miety" while display label is "ZUHAUSE"

The constants file at `src/constants/rolesMatrix.ts` line 156 shows `name: 'Miety'` while `areaConfig.ts` overrides display to "ZUHAUSE". Minor label drift.

### P2: Security Definer Views (2 ERRORs from linter)

Two views use `SECURITY DEFINER`, which bypasses RLS of the querying user. Likely `v_public_listings` and another view. These are intentional for public access but should be explicitly documented.

### P2: OTP long expiry + leaked password protection disabled

Auth configuration warnings from linter. Not blocking but should be addressed before production.

---

## 3. GOLDEN PATH TESTBOOK

### GP Registry: 15 Processes Registered

All 15 Golden Paths in `goldenPathProcesses.ts` have `phase: 'done'` and full `compliance` flags set to `true`.

### Engine-Registered Golden Paths (7 definitions in `src/manifests/goldenPaths/`)

| File | Modules Covered |
|---|---|
| MOD_04.ts | MOD-04 (Portfolio, Verwaltung, Sanierung) |
| MOD_07_11.ts | MOD-07 + MOD-11 (Finanzierung chain) |
| MOD_08_12.ts | MOD-08 + MOD-12 (Investment/Akquise chain) |
| MOD_13.ts | MOD-13 (Projekte) |
| GP_LEAD.ts | Lead Capture (Z3 to Z1) |
| GP_VERMIETUNG.ts | Vermietung Flow |
| GP_FINANCE_Z3.ts | Finance Z3 entry |

### GP-PORTFOLIO (MOD-04): Test Design

- **Precondition**: User logged in, tenant active, demo toggle ON
- **Start**: `/portal/immobilien/portfolio`
- **Steps**: Demo widget at position 0 -> Click opens Immobilienakte inline -> Dossier A-J sections -> DMS upload
- **Assertions**: Properties table has BER-01/MUC-01/HH-01 with `is_demo=true`, units and leases exist
- **DB State**: Verified -- all 3 properties, 3 units, 3 leases present
- **FAILURE**: `annual_income` is NULL on all 3 properties (P0)

### GP-FINANZIERUNG (MOD-07): Test Design

- **Start**: `/portal/finanzierung/selbstauskunft`
- **Steps**: Fill Selbstauskunft -> Upload docs -> Create Anfrage -> Submit to FutureRoom
- **Contract**: `CONTRACT_FINANCE_SUBMIT` (Z2->Z1)
- **Edge Function**: `sot-finance-manager-notify`
- **Status**: Engine-registered, Guard active on dynamic route `anfrage/:requestId`

### GP-SUCHMANDAT (MOD-08): Test Design

- **Start**: `/portal/investments/mandat`
- **Steps**: Create mandate via wizard -> Submit to Zone 1 Acquiary -> MOD-12 accepts
- **Contract**: `CONTRACT_ACQ_MANDATE_SUBMIT` (Z2->Z1)
- **FAILURE**: Investment Engine shows 0 rent for DB listings due to NULL `annual_income` (P0)

---

## 4. CONTRACT TEST SUITE

### 21 Contracts Documented in `spec/current/06_api_contracts/`

| Contract | Direction | Edge Function | Implementation Status |
|---|---|---|---|
| Lead Capture | Z3->Z1 | `sot-lead-inbox` | Implemented |
| Finance Submit | Z2->Z1 | `finance_requests` status enum | Implemented |
| Mandate Assignment | Z1->Z2 | `sot-finance-manager-notify` | Implemented |
| Onboarding | Auth->Z2 | SQL Trigger | Implemented |
| Data Room Access | Z2->Z3 | `access_grants` table | Implemented |
| Email Inbound | Extern->Z1 | `sot-inbound-receive` | Implemented |
| Renter Invite | Z2->Z1->Z3 | `sot-renter-invite` | Implemented |
| Acq Mandate Submit | Z2->Z1 | `acq_mandates` status enum | Documented |
| Listing Publish | Z2->Z1 | `sot-listing-publish` | Documented |
| Listing Distribute | Z1->Z2/Z3 | `listings`, `listing_publications` | Documented |
| Social Mandate Submit | Z2->Z1 | `sot-social-mandate-submit` | Documented |
| Social Payment | Z2->Extern->Z1 | `sot-social-payment-*` | Documented |
| Acq Inbound Email | Extern->Z1 | `sot-acq-inbound-webhook` | Documented |
| Renovation Outbound | Z2->Extern | `sot-renovation-outbound` | Documented |
| Renovation Inbound | Extern->Z1 | `sot-renovation-inbound-webhook` | Documented |
| WhatsApp Inbound | Extern->Z1 | `sot-whatsapp-webhook` | Documented |
| Project Intake | Z1->Z2 | `sot-project-intake` | Documented |
| WhatsApp Media | Intern | `sot-whatsapp-media` | Documented |
| Acq Outbound Email | Z2->Extern | `sot-acq-outbound` | Documented |
| Finance Doc Reminder | System->Z2 | `finance-document-reminder` | Documented |
| Landing Page Generate | Z2->Z3 | `sot-generate-landing-page` | Documented |

### Contract Coverage: Architecture Validator registers 12 cross-zone edge functions -- all have matching contract files.

### Contract Drift: None detected. All 21 contract files exist in repo, and all referenced edge functions exist in `supabase/functions/`.

---

## 5. ROUTING/NAV AUDIT REPORT

### Manifest Completeness

- All 21 Zone 2 modules have routes in `routesManifest.ts`
- All 7 Zone 3 websites have routes in manifest
- Zone 1 has 49 routes defined
- Legacy redirects: 19 entries covering old paths

### Drift Findings

- **Sites**: `TenantSiteRenderer` is imported from `src/pages/website/TenantSiteRenderer.tsx` -- path diverges from Zone 3 convention (`src/pages/zone3/sites/`). The layout file is at `src/pages/zone3/sites/TenantSiteLayout.tsx` but the renderer is at `src/pages/website/`. Minor structural inconsistency.
- **MOD-20 standalone routes**: `/portal/miety/*` routes exist and work, but MOD-20 is primarily accessed via `/portal/immobilien/zuhause`. Both paths render `MietyPortalPage`. No collision but potential user confusion.
- **GoldenPathGuard coverage**: Active on MOD-04 `:id` dynamic route, MOD-07 `anfrage/:requestId`, and other dynamic routes where `goldenPath` config is set in manifest. Engine files cover MOD-04, MOD-07/11, MOD-08/12, MOD-13.

---

## 6. DEMO-CONTAINER MAP

### Toggle Mechanism

- **Hook**: `useDemoToggles()` in `src/hooks/useDemoToggles.ts`
- **Persistence**: `localStorage` key `gp_demo_toggles`
- **Scope**: User-local (per browser), not tenant-scoped
- **UI Control**: MOD-01 Stammdaten > Demo-Daten tab
- **Default**: All 15 toggles ON

### 15 Registered Demo Containers

| Process ID | Module | Data Source | Scope | Consumers |
|---|---|---|---|---|
| GP-PORTFOLIO | MOD-04 | `useDemoListings` | cross_zone | 8 files |
| GP-VERWALTUNG | MOD-04 | `useDemoLocalEntity` | z2_only | 1 file |
| GP-SANIERUNG | MOD-04 | `useDemoLocalEntity` | z2_only | 1 file |
| GP-FINANZIERUNG | MOD-07 | `useDemoFinanceCase` | cross_zone | 2 files |
| GP-SUCHMANDAT | MOD-08 | `useDemoAcquisition` | cross_zone | 2 files |
| GP-SIMULATION | MOD-08 | `useDemoLocalEntity` | z2_only | 1 file |
| GP-FM-FALL | MOD-11 | `useDemoLocalEntity` | manager | 1 file |
| GP-AKQUISE-MANDAT | MOD-12 | `useDemoLocalEntity` | manager | 1 file |
| GP-PROJEKT | MOD-13 | `useDemoListings` | cross_zone | 4 files |
| GP-SERIEN-EMAIL | MOD-14 | `useDemoLocalEntity` | z2_only | 1 file |
| GP-RECHERCHE | MOD-14 | `useDemoLocalEntity` | z2_only | 1 file |
| GP-FAHRZEUG | MOD-17 | `useDemoLocalEntity` | z2_only | 1 file |
| GP-PV-ANLAGE | MOD-19 | `useDemoLocalEntity` | z2_only | 1 file |
| GP-WEBSITE | MOD-05 | `useDemoLocalEntity` | z2_only | 1 file |
| GP-VERMIETUNG | - | `useDemoListings` | cross_zone | (engine only) |

### INVESTMENT ENGINE REGRESSION FINDINGS

**P0-IE-001: `properties.annual_income` is NULL for all 3 demo properties**

The Kaufy homepage, MOD-08 SucheTab, MOD-09 BeratungTab, and all Expose pages derive `monthly_rent_total` from `properties.annual_income / 12`. Since `annual_income` is NULL in the DB, these views show 0 EUR rent when loading from database queries.

- The `useDemoListings.ts` hook provides correct values (BER-01: 1150/mo, MUC-01: 1580/mo, HH-01: 750/mo)
- But when DB query results override demo data (deduplication logic), the DB's 0 rent wins
- This causes Investment Engine calculations to produce incorrect results (0 rent = infinite negative cashflow)

**Fix**: SQL migration to set `annual_income` on the 3 demo properties:
- BER-01: `annual_income = 13800` (1150 * 12)
- MUC-01: `annual_income = 18960` (1580 * 12)  
- HH-01: `annual_income = 9000` (750 * 12)

**P1-IE-002: `v_public_listings` view has no rent/income column**

The view exposes price, area, type, but NOT rental income. Consumers must separately join to `properties.annual_income` (which is NULL). The view should either include `annual_income` or a computed `monthly_rent` column.

**P1-IE-003: Kaufy DB query hardcodes `unit_count: 1`**

In `Kaufy2026Home.tsx` line 207, the transform always sets `unit_count: 1` instead of querying actual unit count from the `units` table (as `SucheTab.tsx` does correctly in lines 200-213).

---

## 7. UX/CONTENT QA REPORT

- All module pages follow the `PageShell > ModulePageHeader > WidgetGrid > Inline Flow` pattern as mandated
- Demo widgets use emerald-green styling consistently
- No TODO/placeholder texts found in main flows
- SoT website was recently rebuilt with scroll-snap sections (5 screens)
- Dark mode: not checked in Zone 3 websites (these are public-facing with their own color schemes)

---

## 8. TECH DEEP TEST REPORT

### RLS

- 2 `SECURITY DEFINER` views flagged by linter (likely `v_public_listings` and one other)
- These are architecturally intentional for public data access but should be documented
- Tenant isolation: `get_user_tenant_id()` function used consistently in RLS policies

### Edge Functions

- 95 edge functions deployed in `supabase/functions/`
- All `sot-*` prefixed functions follow naming convention
- `sot-investment-engine` is the core calculation engine -- functional, accepts `CalculationInput`, returns `CalculationResult`

### Data Integrity

- `data_event_ledger` table exists for audit trail
- `credit_ledger` exists for billing
- `audit_events`, `audit_jobs`, `audit_reports` tables present

---

## 9. REPARATURPLAN (Priorisiert)

### P0: properties.annual_income NULL (System-Breaking)

- **Root cause**: Migration created properties with `purchase_price` but omitted `annual_income`
- **Fix**: SQL migration: `UPDATE properties SET annual_income = X WHERE id = Y` for all 3 demo properties
- **Files**: Database only (no code changes needed)
- **Verification**: Query `v_public_listings`, run Investment Engine search on Kaufy, check MOD-08/09
- **Risk**: Low (only affects 3 demo records with `is_demo=true`)

### P1: v_public_listings missing rent data

- **Root cause**: View definition does not include `annual_income` or computed rent
- **Fix**: Alter view to add `annual_income` column from properties join, or add computed `monthly_rent`
- **Files**: SQL migration only
- **Verification**: Query view, check Kaufy/MOD-08 results include rent
- **Risk**: Low

### P1: Kaufy hardcoded unit_count: 1

- **Root cause**: Transform in `Kaufy2026Home.tsx` line 207 hardcodes `unit_count: 1` instead of querying units table
- **Fix**: Add units subquery (same pattern as `SucheTab.tsx` lines 200-213)
- **Files**: `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx`
- **Verification**: Check multi-unit properties show correct count on Kaufy
- **Risk**: Low

### P2: Security warnings (OTP expiry, leaked password protection)

- **Fix**: Configure auth settings via Lovable Cloud
- **Risk**: Low

### P2: TenantSiteRenderer path inconsistency

- **Fix**: Move `src/pages/website/TenantSiteRenderer.tsx` to `src/pages/zone3/sites/TenantSiteRenderer.tsx`
- **Risk**: Low (just import path change)

---

## 10. BACKLOG JSON

```json
[
  {
    "id": "BL-000001",
    "severity": "P0",
    "type": "data",
    "zone": "cross-zone",
    "module": "MOD-04",
    "area": "investment_engine",
    "title": "properties.annual_income NULL for all demo properties",
    "description": "All 3 demo properties (BER-01, MUC-01, HH-01) have NULL annual_income in the database. All DB-driven views (Kaufy, MOD-08, MOD-09, Expose pages) derive monthly rent from this field, resulting in 0 EUR rent and broken Investment Engine calculations.",
    "repro": {
      "start_url": "/website/kaufy",
      "steps": ["Enter 50000 Eigenkapital + 60000 zvE", "Click search", "Observe results show 0 EUR rent"],
      "preconditions": ["demo=true", "listings in DB with active kaufy publications"]
    },
    "expected": "BER-01: 1150 EUR/mo, MUC-01: 1580 EUR/mo, HH-01: 750 EUR/mo",
    "actual": "All show 0 EUR/mo rent when loaded from DB query",
    "evidence": {
      "db_tables": ["properties"],
      "logs": ["SELECT annual_income FROM properties WHERE code='BER-01' → NULL"]
    },
    "suspected_root_cause": "Migration that created demo properties set purchase_price but omitted annual_income. Leases have correct monthly_rent values but the query path uses properties.annual_income instead.",
    "repo_refs": {
      "files": ["src/pages/zone3/kaufy2026/Kaufy2026Home.tsx", "src/pages/portal/investments/SucheTab.tsx", "src/pages/portal/vertriebspartner/BeratungTab.tsx"],
      "manifest_entries": [],
      "contract_refs": [],
      "golden_path_refs": ["GP-PORTFOLIO"]
    },
    "fix_plan": {
      "approach": "minimal",
      "steps": ["UPDATE properties SET annual_income=13800 WHERE id='d0000000-0000-4000-a000-000000000001'", "UPDATE properties SET annual_income=18960 WHERE id='d0000000-0000-4000-a000-000000000002'", "UPDATE properties SET annual_income=9000 WHERE id='d0000000-0000-4000-a000-000000000003'"],
      "risk": "low",
      "verification": ["SELECT annual_income FROM properties WHERE is_demo=true", "Run Investment Engine search on Kaufy", "Check MOD-08 SucheTab results"]
    },
    "status": "new"
  },
  {
    "id": "BL-000002",
    "severity": "P1",
    "type": "data",
    "zone": "cross-zone",
    "module": "admin",
    "area": "investment_engine",
    "title": "v_public_listings view missing rent/income column",
    "description": "The public listings view exposes price, area, type but no rental income data. Consumers must separately query properties.annual_income which is also NULL (see BL-000001).",
    "repro": {
      "start_url": "/website/kaufy",
      "steps": ["Query v_public_listings", "Observe no rent column exists"],
      "preconditions": []
    },
    "expected": "View includes monthly_rent or annual_income column",
    "actual": "View only has: public_id, title, description, asking_price, city, postal_code, property_type, total_area_sqm, year_built, published_at, channel",
    "evidence": {
      "db_tables": ["v_public_listings"]
    },
    "suspected_root_cause": "View was created without income data projection",
    "repo_refs": {
      "files": [],
      "manifest_entries": [],
      "contract_refs": ["CONTRACT_LISTING_DISTRIBUTE.md"],
      "golden_path_refs": []
    },
    "fix_plan": {
      "approach": "minimal",
      "steps": ["ALTER VIEW v_public_listings to include properties.annual_income"],
      "risk": "low",
      "verification": ["SELECT * FROM v_public_listings LIMIT 1 — verify annual_income column present"]
    },
    "status": "new"
  },
  {
    "id": "BL-000003",
    "severity": "P1",
    "type": "bug",
    "zone": "Z3",
    "module": "website",
    "area": "investment_engine",
    "title": "Kaufy hardcodes unit_count: 1 for DB listings",
    "description": "Kaufy2026Home.tsx line 207 always sets unit_count: 1 for DB-loaded listings instead of querying the actual unit count from the units table, unlike SucheTab.tsx which queries correctly.",
    "repro": {
      "start_url": "/website/kaufy",
      "steps": ["Search for multi-unit property", "Observe unit count shows 1"],
      "preconditions": ["Multi-unit property exists in DB with active kaufy publication"]
    },
    "expected": "unit_count reflects actual number of units from DB",
    "actual": "unit_count always 1",
    "evidence": {
      "logs": ["Kaufy2026Home.tsx line 207: unit_count: 1"]
    },
    "suspected_root_cause": "Missing units subquery in Kaufy DB fetch — copy from SucheTab pattern",
    "repo_refs": {
      "files": ["src/pages/zone3/kaufy2026/Kaufy2026Home.tsx", "src/pages/portal/investments/SucheTab.tsx"],
      "manifest_entries": [],
      "contract_refs": [],
      "golden_path_refs": []
    },
    "fix_plan": {
      "approach": "minimal",
      "steps": ["Add units count subquery to Kaufy2026Home queryFn (same pattern as SucheTab lines 200-213)"],
      "risk": "low",
      "verification": ["Check Kaufy results for multi-unit properties"]
    },
    "status": "new"
  },
  {
    "id": "BL-000004",
    "severity": "P2",
    "type": "security",
    "zone": "cross-zone",
    "module": "admin",
    "area": "other",
    "title": "SECURITY DEFINER views bypass RLS of querying user",
    "description": "2 views use SECURITY DEFINER which enforces the view creator's permissions rather than the querying user's. Likely v_public_listings (intentional for public access) and one other.",
    "repro": {
      "start_url": "",
      "steps": ["Run Supabase linter"],
      "preconditions": []
    },
    "expected": "Views documented as intentional SECURITY DEFINER or converted to SECURITY INVOKER",
    "actual": "Linter flags 2 ERROR-level warnings",
    "evidence": {
      "logs": ["Supabase linter: 2x Security Definer View ERROR"]
    },
    "suspected_root_cause": "Views created for public access without explicit documentation",
    "repo_refs": {
      "files": [],
      "manifest_entries": [],
      "contract_refs": [],
      "golden_path_refs": []
    },
    "fix_plan": {
      "approach": "minimal",
      "steps": ["Document which views are intentionally SECURITY DEFINER", "Consider converting non-public views to SECURITY INVOKER"],
      "risk": "low",
      "verification": ["Re-run linter"]
    },
    "status": "new"
  },
  {
    "id": "BL-000005",
    "severity": "P2",
    "type": "security",
    "zone": "cross-zone",
    "module": "admin",
    "area": "other",
    "title": "Auth OTP long expiry + leaked password protection disabled",
    "description": "OTP expiry exceeds recommended threshold and leaked password protection is disabled.",
    "repro": {
      "start_url": "",
      "steps": ["Run Supabase linter"],
      "preconditions": []
    },
    "expected": "OTP expiry within recommended range, leaked password protection enabled",
    "actual": "Both warnings flagged",
    "evidence": {},
    "suspected_root_cause": "Default auth configuration not hardened",
    "repo_refs": {
      "files": [],
      "manifest_entries": [],
      "contract_refs": [],
      "golden_path_refs": []
    },
    "fix_plan": {
      "approach": "minimal",
      "steps": ["Configure auth OTP expiry", "Enable leaked password protection"],
      "risk": "low",
      "verification": ["Re-run linter"]
    },
    "status": "new"
  },
  {
    "id": "BL-000006",
    "severity": "P2",
    "type": "drift",
    "zone": "Z3",
    "module": "website",
    "area": "other",
    "title": "TenantSiteRenderer path inconsistency with Zone 3 convention",
    "description": "TenantSiteRenderer lives at src/pages/website/ while all other Zone 3 components are under src/pages/zone3/. Layout is correctly at src/pages/zone3/sites/.",
    "repro": {
      "start_url": "",
      "steps": ["Check file locations"],
      "preconditions": []
    },
    "expected": "src/pages/zone3/sites/TenantSiteRenderer.tsx",
    "actual": "src/pages/website/TenantSiteRenderer.tsx",
    "evidence": {},
    "suspected_root_cause": "Created before Zone 3 directory convention was established",
    "repo_refs": {
      "files": ["src/pages/website/TenantSiteRenderer.tsx", "src/router/ManifestRouter.tsx"],
      "manifest_entries": ["routesManifest.ts: sites definition"],
      "contract_refs": [],
      "golden_path_refs": []
    },
    "fix_plan": {
      "approach": "minimal",
      "steps": ["Move file to src/pages/zone3/sites/TenantSiteRenderer.tsx", "Update import in ManifestRouter.tsx"],
      "risk": "low",
      "verification": ["Navigate to /website/sites/test-slug"]
    },
    "status": "new"
  },
  {
    "id": "BL-000007",
    "severity": "P2",
    "type": "content",
    "zone": "Z2",
    "module": "MOD-20",
    "area": "manifest",
    "title": "MOD-20 label drift between rolesMatrix and areaConfig",
    "description": "rolesMatrix.ts shows MOD-20 name as 'Miety' while areaConfig.ts overrides display to 'ZUHAUSE'. Minor inconsistency.",
    "repro": {
      "start_url": "",
      "steps": ["Compare labels in rolesMatrix.ts vs areaConfig.ts"],
      "preconditions": []
    },
    "expected": "Consistent naming across all registries",
    "actual": "Miety vs ZUHAUSE label mismatch",
    "evidence": {},
    "suspected_root_cause": "Display override added in areaConfig without updating rolesMatrix",
    "repo_refs": {
      "files": ["src/constants/rolesMatrix.ts", "src/manifests/areaConfig.ts"],
      "manifest_entries": [],
      "contract_refs": [],
      "golden_path_refs": []
    },
    "fix_plan": {
      "approach": "minimal",
      "steps": ["Update rolesMatrix.ts MOD-20 name to 'Miety / ZUHAUSE' or align"],
      "risk": "low",
      "verification": ["Check admin roles page displays correctly"]
    },
    "status": "new"
  }
]
```
