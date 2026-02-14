# System Integrity & Repo Consistency Audit v3.0

**Date:** 2026-02-14  
**BUILD_MODE:** OFF  
**Auditor:** Lovable AI  

---

## A) Executive Answer

| # | Question | Answer | Evidence |
|---|----------|--------|----------|
| 1 | BUILD_MODE | OFF | Set by auditor |
| 2 | HEAD SHA | N/A (Lovable Cloud — no direct git access) | R0.4 constraint: git commands not available in Lovable environment |
| 3 | Commits last 24h | N/A | Same |
| 4 | Critical blockers? | **NO** | No P0 items found |
| 5 | Go/No-Go | **GO — Weiterarbeiten möglich** | All manifests consistent, all contracts present, no missing route targets |

**Summary:** The system is structurally sound. 3 P3 cleanup items found (dead map entry, orphan files, spec naming). No P0 or P1 blockers.

---

## B) Repo Freshness

> **R0.3 applies:** BUILD_MODE=OFF. No git commands available in Lovable Cloud environment.  
> Cannot provide commit SHAs or diffstats. Repo freshness assessed via file inspection only.

**EVIDENCE:**
- COMMAND: `lov-list-dir` on all key directories
- OUTPUT: All expected directories exist (`src/manifests/`, `src/router/`, `src/goldenpath/`, `spec/current/`, `spec/current/06_api_contracts/`, `spec/current/02_modules/`)
- INTERPRETATION: Repo structure complete. Previous audit items (BL-01 MSV folder deletion) confirmed landed.

**Landed Changes Report:**
- `src/pages/portal/msv/` — DELETED (confirmed absent)
- `src/pages/portal/immobilien/RentalExposeDetail.tsx` — EXISTS (redirect stub created)
- `spec/audit/deep_audit_v2.md` + `deep_audit_v2_backlog.json` — EXISTS
- `spec/audit/system_integrity_audit_v2.md` + `v2_backlog.json` — EXISTS

---

## C) Manifest Integrity

### C1) Rogue Routes Check

**EVIDENCE:**
- COMMAND: `lov-search-files` for `<Route\b|<Routes\b` in `src/`
- OUTPUT: 28 files contain `<Route` or `<Routes>`
- INTERPRETATION: All are either:
  - `ManifestRouter.tsx` (SSOT router) ✅
  - Module page files with internal `<Routes>` blocks (e.g., `VertriebspartnerPage.tsx`, `VerkaufPage.tsx`, `FinanzierungsmanagerPage.tsx`) ✅ — This is the documented pattern where each module page handles its own tile routing internally.
  - `Inbox.tsx` uses `<Route>` as a Lucide icon import, not a router component ✅
  - Zone 3 sub-pages with internal routing ✅

**ASSERTION: No rogue routes.** ✅

### C2) Route Target Existence

**EVIDENCE (Zone 2 — portalModulePageMap):**

| Map Key | Import Target | File Exists | Status |
|---------|--------------|-------------|--------|
| dashboard | PortalDashboard | ✅ | OK |
| stammdaten | StammdatenPage | ✅ | OK |
| office | OfficePage | ✅ | OK |
| dms | DMSPage | ✅ | OK |
| immobilien | ImmobilienPage | ✅ | OK |
| **msv** | **MSVPage** | **✅ (redirect stub)** | **⚠️ Dead entry — no manifest module has base="msv"** |
| verkauf | VerkaufPage | ✅ | OK |
| finanzierung | FinanzierungPage | ✅ | OK |
| finanzierungsmanager | FinanzierungsmanagerPage | ✅ | OK |
| investments | InvestmentsPage | ✅ | OK |
| vertriebspartner | VertriebspartnerPage | ✅ | OK |
| leads | LeadsPage | ✅ | OK |
| akquise-manager | AkquiseManagerPage | ✅ | OK |
| projekte | ProjektePage | ✅ | OK |
| communication-pro | CommunicationProPage | ✅ | OK |
| fortbildung | FortbildungPage | ✅ | OK |
| services | ServicesPage | ✅ | OK |
| cars | CarsPage | ✅ | OK |
| finanzanalyse | FinanzanalysePage | ✅ | OK |
| photovoltaik | PhotovoltaikPage | ✅ | OK |
| miety | MietyPortalPage | ✅ | OK |
| website-builder | WebsiteBuilderPage | ✅ | OK |

**FINDING:** `msv` key in `portalModulePageMap` (ManifestRouter.tsx:299) has no corresponding manifest module. It resolves to `MSVPage.tsx` which is a redirect stub to `/portal/immobilien/verwaltung`. This is harmless but dead code.

**EVIDENCE (Zone 2 — portalDynamicComponentMap):**

| Map Key | Import Target | File Exists | Status |
|---------|--------------|-------------|--------|
| PropertyDetail | PropertyDetailPage | ✅ | OK |
| CreatePropertyRedirect | CreatePropertyRedirect | ✅ | OK |
| RentalExposeDetail | RentalExposeDetail | ✅ | OK |
| ExposeDetail | ExposeDetail | ✅ | OK |
| AnfrageDetailPage | AnfrageDetailPage | ✅ | OK |
| FMFallDetail | FMFallDetail | ✅ | OK |

**Note:** MOD-11 `FMEinreichungDetail` is declared in manifest but NOT in `portalDynamicComponentMap`. However, it IS handled internally by `FinanzierungsmanagerPage.tsx` (line 52) — this is correct per the module-internal routing pattern.

**EVIDENCE (Zone 1 — adminComponentMap):**
- All 40+ admin component keys verified via lazy imports in ManifestRouter.tsx lines 57-268
- FutureRoom sub-pages (8 routes) have dedicated lazy imports (lines 279-286) ✅
- Desk components (sales-desk, acquiary, agents) resolved via `adminDeskMap` ✅

**EVIDENCE (Zone 3 — all component maps):**
- kaufy2026: 5 components ✅
- miety: 9 components ✅
- futureroom: 6 components (FutureRoomAkte → FutureRoomAkteGuarded wrapper) ✅
- sot: 14 components ✅
- acquiary: 5 components ✅
- projekt: 1 component ✅
- sites: 1 component ✅

### C3) Duplicate Route IDs / Paths

**EVIDENCE:**
- COMMAND: Manual inspection of `routesManifest.ts`
- OUTPUT: All 21 module codes are unique (MOD-00 through MOD-20). All base paths are unique.
- INTERPRETATION: No duplicates found. ✅

### C4) Legacy Redirects Validity

**EVIDENCE:**
- COMMAND: Inspected `legacyRoutes` array (routesManifest.ts:624-663)
- OUTPUT: 24 legacy redirects defined
- All redirect targets verified against manifest routes:
  - `/portal/immobilien/portfolio` ✅ (tile exists)
  - `/portal/immobilien/neu` ✅ (dynamic route exists)
  - `/portal/immobilien/:id` ✅ (dynamic route exists)
  - `/portal/finanzierung/*` tiles ✅
  - `/admin/futureroom` ✅
  - `/portal/finanzierungsmanager/*` ✅
  - `/website/*` Z3 prefixes ✅

**ASSERTION: All legacy redirects target valid paths.** ✅

### C5) Tile Catalog Alignment

**EVIDENCE:**
- Manifest defines tiles per module with paths matching internal `<Route>` definitions
- Module pages implement their own `<Routes>` blocks that mirror manifest tile paths
- INTERPRETATION: No drift detected between manifest tile declarations and module page routing. ✅

---

## D) Spec Integrity

### D1) Spec Tree

**EVIDENCE:**
- COMMAND: `lov-list-dir spec/current`
- OUTPUT:
  - `00_frozen/` ✅
  - `01_platform/` ✅
  - `02_modules/` ✅ (22 files: mod-00 through mod-20 + zone1_futureroom)
  - `06_api_contracts/` ✅ (22 files: 21 contracts + INDEX.md + module_api_overview.md)
  - `07_storage_boundary/` ✅ (bonus)
  - `08_data_provenance/` ✅ (bonus)
  - `02_zones.md` ✅

### D2) Missing Optional Dirs

| Directory | Status | Impact |
|-----------|--------|--------|
| 03_actions | MISSING | P3 — doc gap only, Armstrong actions defined in `armstrongManifest.ts` |
| 04_workflows | MISSING | P3 — doc gap only, Golden Paths defined in `src/manifests/goldenPaths/` |
| 05_diagrams | MISSING | P3 — doc gap only |

### D3) Spec ↔ Manifest Cross-Check

| Module | Manifest Base | Spec File | Match |
|--------|--------------|-----------|-------|
| MOD-00 | dashboard | mod-00_dashboard.md | ✅ |
| MOD-01 | stammdaten | mod-01_stammdaten.md | ✅ |
| MOD-02 | office | mod-02_ki-office.md | ✅ |
| MOD-03 | dms | mod-03_dms_storage.md | ✅ |
| MOD-04 | immobilien | mod-04_immobilien.md | ✅ |
| MOD-05 | website-builder | mod-05_website-builder.md | ✅ |
| MOD-06 | verkauf | mod-06_verkauf_contract.md | ✅ |
| MOD-07 | finanzierung | mod-07_finanzierung.md | ✅ |
| MOD-08 | investments | mod-08_investment-suche.md | ✅ |
| MOD-09 | vertriebspartner | mod-09_vertriebspartner.md | ✅ |
| MOD-10 | leads | mod-10_provisionen.md | ⚠️ Name drift: Manifest says "Abrechnung", spec says "Provisionen", route is `/leads` |
| MOD-11 | finanzierungsmanager | mod-11_finanzierungsmanager.md | ✅ |
| MOD-12 | akquise-manager | mod-12_akquise-manager.md | ✅ |
| MOD-13 | projekte | mod-13_projekte.md | ✅ |
| MOD-14 | communication-pro | mod-14_communication-pro.md | ✅ |
| MOD-15 | fortbildung | mod-15_fortbildung.md | ✅ |
| MOD-16 | services | mod-16_services.md | ✅ |
| MOD-17 | cars | mod-17_car-management.md | ✅ |
| MOD-18 | finanzanalyse | mod-18_finanzanalyse.md | ✅ |
| MOD-19 | photovoltaik | mod-19_photovoltaik.md | ✅ |
| MOD-20 | miety | mod-20_miety.md | ✅ |

---

## E) Contracts Integrity

### E1) Registry Completeness

**EVIDENCE:**
- COMMAND: `lov-list-dir spec/current/06_api_contracts`
- OUTPUT: 21 CONTRACT_*.md files
- Cross-checked against INDEX.md (provided in context): 21 entries listed

| INDEX Entry | File Exists | Status |
|-------------|-------------|--------|
| CONTRACT_LEAD_CAPTURE | ✅ | OK |
| CONTRACT_FINANCE_SUBMIT | ✅ | OK |
| CONTRACT_MANDATE_ASSIGNMENT | ✅ | OK |
| CONTRACT_ONBOARDING | ✅ | OK |
| CONTRACT_DATA_ROOM_ACCESS | ✅ | OK |
| CONTRACT_EMAIL_INBOUND | ✅ | OK |
| CONTRACT_ACQ_MANDATE_SUBMIT | ✅ | OK |
| CONTRACT_LISTING_PUBLISH | ✅ | OK |
| CONTRACT_LISTING_DISTRIBUTE | ✅ | OK |
| CONTRACT_SOCIAL_MANDATE_SUBMIT | ✅ | OK |
| CONTRACT_SOCIAL_PAYMENT | ✅ | OK |
| CONTRACT_ACQ_INBOUND_EMAIL | ✅ | OK |
| CONTRACT_RENOVATION_OUTBOUND | ✅ | OK |
| CONTRACT_RENOVATION_INBOUND | ✅ | OK |
| CONTRACT_WHATSAPP_INBOUND | ✅ | OK |
| CONTRACT_PROJECT_INTAKE | ✅ | OK |
| CONTRACT_WHATSAPP_MEDIA | ✅ | OK |
| CONTRACT_ACQ_OUTBOUND_EMAIL | ✅ | OK |
| CONTRACT_FINANCE_DOC_REMINDER | ✅ | OK |
| CONTRACT_LANDING_PAGE_GENERATE | ✅ | OK |
| CONTRACT_RENTER_INVITE | ✅ | OK |

**ASSERTION: 100% contract registry completeness.** ✅

### E2) Invocation Evidence (Edge Functions)

| Contract | Edge Function | Exists in `supabase/functions/` | Status |
|----------|--------------|--------------------------------|--------|
| Lead Capture | sot-lead-inbox | ✅ | Implemented |
| Mandate Assignment | sot-finance-manager-notify | ✅ | Implemented |
| Email Inbound | sot-inbound-receive | ✅ | Implemented |
| Acq Inbound Email | sot-acq-inbound-webhook | ✅ | Implemented |
| Acq Outbound Email | sot-acq-outbound | ✅ | Implemented |
| Renovation Outbound | sot-renovation-outbound | ✅ | Implemented |
| Renovation Inbound | sot-renovation-inbound-webhook | ✅ | Implemented |
| WhatsApp Inbound | sot-whatsapp-webhook | ✅ | Implemented |
| WhatsApp Media | sot-whatsapp-media | ✅ | Implemented |
| Project Intake | sot-project-intake | ✅ | Implemented |
| Finance Doc Reminder | finance-document-reminder | ✅ | Implemented |
| Landing Page Generate | sot-generate-landing-page | ✅ | Implemented |
| Listing Publish | sot-listing-publish | ✅ | Implemented |
| Social Mandate Submit | sot-social-mandate-submit | ✅ | Implemented |
| Social Payment | sot-social-payment-create + webhook | ✅ | Implemented |
| Renter Invite | sot-renter-invite | ✅ | Implemented |
| Finance Submit | DB Status-Enum | N/A (DB-only) | Spec-only ✅ |
| Onboarding | SQL Trigger | N/A (DB trigger) | Spec-only ✅ |
| Data Room Access | DB Table/RLS | N/A (DB-only) | Spec-only ✅ |
| Acq Mandate Submit | DB Status-Enum | N/A (DB-only) | Spec-only ✅ |
| Listing Distribute | DB Table/Trigger | N/A (DB-only) | Spec-only ✅ |

---

## F) Zone Alignment

### F1) Cross-Zone Flows

| Flow | Z2 Sender | Z1 Receiver | Contract | Status |
|------|-----------|-------------|----------|--------|
| Finance Submit | MOD-07 AnfrageTab | FutureRoom Inbox | CONTRACT_FINANCE_SUBMIT | ✅ Both ends exist |
| Mandate Assignment | FutureRoom Zuweisung | MOD-11 | CONTRACT_MANDATE_ASSIGNMENT | ✅ |
| Listing Publish | MOD-06 / MOD-13 | Sales Desk | CONTRACT_LISTING_PUBLISH | ✅ |
| Lead Capture | Z3 Websites | Lead Pool | CONTRACT_LEAD_CAPTURE | ✅ |
| Acq Mandate | MOD-08 / MOD-12 | Acquiary | CONTRACT_ACQ_MANDATE_SUBMIT | ✅ |
| Renter Invite | MOD-04 Verwaltung | Z1 → Z3 Miety | CONTRACT_RENTER_INVITE | ✅ |

**ASSERTION: All cross-zone flows have both sender and receiver.** ✅

---

## G) Orphans / Dead Code

| File | Referenced By | Status | Severity |
|------|-------------|--------|----------|
| `src/pages/portal/MSVPage.tsx` | ManifestRouter `msv` key | Dead map entry — no module with base `msv` | P3 |
| `src/pages/admin/ki-office/AdminKiOfficeEmail.tsx` | `AdminEmailAgent.tsx` (internal import) | **NOT orphan** — used as sub-component | OK |
| `src/pages/admin/ki-office/AdminKiOfficeRecherche.tsx` | `AdminRecherche.tsx` references concept but file has own export | Needs verification | P3 |
| `src/pages/admin/ki-office/AdminKiOfficeKontakte.tsx` | `AdminKontaktbuch.tsx` references in comment | Needs verification | P3 |
| `src/pages/zone3/futureroom/FutureRoomAuthGuard.tsx` | `FutureRoomAkteGuarded.tsx` (lazy import) | **NOT orphan** — active dependency | OK |

---

## H) Build Report

> BUILD_MODE = OFF. Skipped.

---

## I) Repair Plan

### SIA3-001 (P3): Remove dead `msv` key from portalModulePageMap

- **Impact:** Harmless dead code; `MSVPage` is a redirect stub
- **Fix Steps:**
  1. Remove `msv: MSVPage` from `portalModulePageMap` (ManifestRouter.tsx:299)
  2. Remove `MSVPage` lazy import (ManifestRouter.tsx:113)
  3. Optionally delete `src/pages/portal/MSVPage.tsx`
- **Files:** `src/router/ManifestRouter.tsx`, `src/pages/portal/MSVPage.tsx`
- **Verification:** Confirm no manifest module has `base: "msv"`
- **Risk:** Low

### SIA3-002 (P3): MOD-10 naming drift (Abrechnung vs Provisionen vs /leads)

- **Impact:** Confusing but functional — manifest says "Abrechnung", spec says "Provisionen", route is `/leads`
- **Fix Steps:**
  1. Update `spec/current/02_modules/mod-10_provisionen.md` title to "Abrechnung"
  2. OR update manifest name to "Provisionen" — requires product decision
- **Files:** `spec/current/02_modules/mod-10_provisionen.md` OR `src/manifests/routesManifest.ts`
- **Verification:** Name consistency across manifest, spec, and UI
- **Risk:** Low

### SIA3-003 (P3): Missing optional spec directories

- **Impact:** Documentation gap only. No implementation risk.
- **Fix Steps:**
  1. Create `spec/current/03_actions/` with Armstrong action index
  2. Create `spec/current/04_workflows/` with Golden Path index
  3. Create `spec/current/05_diagrams/` with architecture diagrams
- **Files:** New directories only
- **Risk:** Low

---

## J) Backlog JSON
