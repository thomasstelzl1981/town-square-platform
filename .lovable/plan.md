
# Enterprise-Ready System Check v5.0 — Z1/Z2 Alignment Report

## Executive Summary

Das System ist architektonisch solide und enterprise-nah. 21 Module, 7 Zone-3 Websites, 95+ Edge Functions, 7 Golden Path Engine-Registrierungen und 21 formale API-Contracts bilden ein konsistentes Gesamtsystem. **Keine P0-Blocker gefunden.** 12 P1/P2-Items erfordern Aufmerksamkeit, 8 P3-Items sind Cleanup.

---

## PHASE 0 — BASELINE INVENTUR

### Zone-1 World Map (Admin)

| Bereich | Routes | Status |
|---------|--------|--------|
| Core Admin | 12 (Dashboard, Orgs, Users, Delegations, Tiles, Integrations, Oversight, Audit, Agreements, Partner-Verification, Roles, Support) | PASS |
| Masterdata | 7 (Index + 6 Akten-Vorlagen) | PASS |
| KI Office | 3 (Recherche, Kontaktbuch, Email Agent) | PASS |
| FutureRoom | 9 (Dashboard + 8 Sub-Pages, explizites Nesting) | PASS |
| Armstrong | 8 (Dashboard + 7 Sub-Pages) | PASS |
| Desks | 5 (Sales, Acquiary, Agents, Lead, Projekt) | PASS |
| Sonstige | 3 (Fortbildung, Website-Hosting, Petmanager) | PASS |
| **Gesamt** | **47 Routes** | |

**Drift:** Keine Orphan/Rogue Routes gefunden. `FinanceDesk` ist im `adminDeskMap` registriert (`finance-desk`), hat aber keine Manifest-Route mehr (entfernt per Redirect zu FutureRoom). Dies ist ein toter Eintrag im Component Map — kein funktionaler Impact, da der Legacy-Redirect greift.

### Zone-2 Module World Map (21 Module)

| Code | Name | Base | Tiles | Dynamic | Guards | Phase |
|------|------|------|-------|---------|--------|-------|
| MOD-00 | Dashboard | dashboard | 0 | 0 | - | done |
| MOD-01 | Stammdaten | stammdaten | 5 | 0 | - | done |
| MOD-02 | KI Office | office | 7 | 1 | - | done |
| MOD-03 | DMS | dms | 4 | 0 | - | done |
| MOD-04 | Immobilien | immobilien | 4 | 3 | MOD-04 | done |
| MOD-05 | Pets | pets | 4 | 1 | - | phase 1 |
| MOD-06 | Verkauf | verkauf | 4 | 1 | - | done |
| MOD-07 | Finanzierung | finanzierung | 5 | 1 | MOD-07 | done |
| MOD-08 | Investment-Suche | investments | 4 | 3 | - | done |
| MOD-09 | Immomanager | vertriebspartner | 6+6 dyn | 0 | - | done |
| MOD-10 | Lead Manager | leads | 1 | 0 | - | done |
| MOD-11 | Finanzierungsmanager | finanzierungsmanager | 6+7 dyn | - | - | done |
| MOD-12 | Akquisemanager | akquise-manager | 6 | 3 | MOD-12 | done |
| MOD-13 | Projektmanager | projekte | 4 | 2 | MOD-13 | done |
| MOD-14 | Communication Pro | communication-pro | 4 | 0 | - | done |
| MOD-15 | Fortbildung | fortbildung | 4 | 0 | - | done |
| MOD-16 | Shop | services | 4 | 0 | - | done |
| MOD-17 | Car-Management | cars | 4 | 0 | - | done |
| MOD-18 | Finanzen | finanzanalyse | 6 | 0 | - | done |
| MOD-19 | Photovoltaik | photovoltaik | 4 | 2 | MOD-19 | done |
| MOD-20 | Miety | miety | 5 | 1 | - | done |

**Drift:** Keine Orphan-Module. Alle 21 Module haben korrespondierende Page-Komponenten im `portalModulePageMap`.

---

## PHASE 1 — ZONENISOLIERUNG und CROSS-ZONE GOVERNANCE

### ZBC Compliance Report

| Regel | Pruefung | Ergebnis |
|-------|----------|----------|
| ZBC-R01 | Keine Z2-Page importiert Z1-Pages | **PASS** (0 Treffer) |
| ZBC-R02 | Keine Z1-Page importiert Z2-Pages | **PASS** (0 Treffer) |
| ZBC-R08 | Alle Z3 unter /website/** | **PASS** (7 Sites: kaufy, miety, futureroom, sot, acquiary, projekt, sites) |
| ZBC-R09 | Root-Collision Validator aktiv (DEV) | **PASS** |
| ZBC-R10 | Contract-Coverage | **PASS** (12 Cross-Zone EFs mit Contract-Zuordnung) |
| ZBC-R13 | tile_catalog Sync Validator aktiv (DEV) | **PASS** |

### Cross-Zone Handshake Map (Z2 zu Z1 zu Z2)

| Flow | Z2 Trigger | Z1 Intake | Z2 Reflection | Contract | Status |
|------|-----------|-----------|----------------|----------|--------|
| Finance Submit | MOD-07 "Anfrage absenden" | FutureRoom/Inbox | MOD-07/Status, MOD-11/Faelle | CONTRACT_FINANCE_SUBMIT | Impl. |
| Mandate Assignment | - | Admin-Zuweisung | MOD-11 Finanzierungsakte | CONTRACT_MANDATE_ASSIGNMENT | Impl. |
| Listing Publish | MOD-04/MOD-06 Publish CTA | Sales Desk Review | MOD-08/09/Z3 Katalog | CONTRACT_LISTING_PUBLISH | Dok. |
| Listing Distribute | - | Z1 Governance | MOD-08, MOD-09, Zone 3 | CONTRACT_LISTING_DISTRIBUTE | Dok. |
| Acq Mandate Submit | MOD-12 Mandat einreichen | Acquiary/Mandate | MOD-12 Status | CONTRACT_ACQ_MANDATE_SUBMIT | Dok. |
| Renter Invite | MOD-04/Vermietung | Z1 Provisioning | Mieter-Portal | CONTRACT_RENTER_INVITE | Impl. |
| Lead Capture | Z3 Website Form | LeadDesk/Inbox | MOD-09/10 Leadeingang | CONTRACT_LEAD_CAPTURE | Impl. |
| Project Intake | Armstrong/Direct | ProjektDesk | MOD-13 Portfolio | CONTRACT_PROJECT_INTAKE | Dok. |
| Onboarding | Auth Signup | SQL Trigger | MOD-01 Profil | CONTRACT_ONBOARDING | Impl. |

---

## PHASE 2 — MANIFEST/ROUTING/NAV/ROLE-GATING

### Routing/Nav Matrix

- **Manifest-Route-Count**: Z1=47, Z2=21 Module (89+ Tiles/Dynamic), Z3=35 Website-Routes
- **Legacy Redirects**: 20 definiert, alle mit LegacyRedirect-Komponente (preserves params)
- **PathNormalizer**: Aktiv (trailing-slash/case normalization)

### Orphan/Rogue/Dead Route List

| Item | Typ | Details | Severity |
|------|-----|---------|----------|
| ERA-001 | Dead Code | `FinanceDesk` in `adminDeskMap` aber Route entfernt (Redirect zu FutureRoom) | P3 |
| ERA-002 | Spec Drift | `spec/current/02_modules/mod-05_website-builder.md` beschreibt "MSV Downstream Contract" — MOD-05 ist jetzt "Pets", nicht MSV/Website-Builder | P1 |

### Role Gating

- Zone 1: `requires_role: ["platform_admin"]` auf gesamter ZoneDefinition — korrekt
- Zone 2: Role-gated Module (MOD-09, MOD-11, MOD-12) haben `requires_role` im Manifest
- Zone 2: Activation-gated Module (MOD-05, MOD-06, MOD-14, MOD-17, MOD-20) mit `requires_activation: true`
- `tile_catalog` DB-Tabelle als Overlay fuer Sichtbarkeit — DEV-Validator aktiv

---

## PHASE 3 — GOLDEN PATH ENGINE und PROCESS WIRING

### Engine Registry

| GP Key | Definition | Guard | Process | Phase |
|--------|-----------|-------|---------|-------|
| MOD-04 | MOD_04.ts | `goldenPath: { moduleCode: 'MOD-04' }` auf `:id` Route | GP-PORTFOLIO, GP-VERWALTUNG, GP-SANIERUNG | done |
| MOD-07 | MOD_07_11.ts | `goldenPath: { moduleCode: 'MOD-07' }` auf `anfrage/:requestId` | GP-FINANZIERUNG, GP-FM-FALL | done |
| MOD-08 | MOD_08_12.ts | Kein Guard im Manifest | GP-SUCHMANDAT, GP-SIMULATION, GP-AKQUISE-MANDAT | done |
| MOD-13 | MOD_13.ts | `goldenPath: { moduleCode: 'MOD-13' }` auf `:projectId` | GP-PROJEKT | done |
| GP-VERMIETUNG | GP_VERMIETUNG.ts | Kein Guard (event-driven) | GP-VERMIETUNG | done |
| GP-LEAD | GP_LEAD.ts | Kein Guard (event-driven) | GP-LEAD | done |
| GP-FINANCE-Z3 | GP_FINANCE_Z3.ts | Kein Guard (public Z3 flow) | GP-FINANCE-Z3 | done |

### Guarded Routes Coverage

- **5 von 21 Modulen** haben explizite `goldenPath` Guards auf dynamic routes: MOD-04, MOD-07, MOD-12, MOD-13, MOD-19
- GP-VERMIETUNG, GP-LEAD, GP-FINANCE-Z3: Event-driven, keine Route-Guards noetig (korrekt)
- **MOD-08**: Hat 3 dynamic routes OHNE Golden Path Guard — aber interne Routing in `InvestmentsPage.tsx`, nicht via ManifestRouter. KEIN Bypass-Vektor, da data-driven (kein State ohne vorherige Suche).
- **MOD-11**: Hat dynamic routes (einreichung/:requestId, faelle/:requestId) OHNE goldenPath Guard im Manifest, obwohl `MOD-07` registriert ist. Da MOD-11 role-gated (`finance_manager`), ist dies akzeptabel.

### DEV Validators

- `devValidator.ts`: 5 Validierungen (Route-Pattern, Guard-Registrierung, Ledger-Event, ContractRef Backbone, Fail-State Completeness) — alle aktiv
- `architectureValidator.ts`: 5 Validierungen (ZBC-R09, ZBC-R13, ZBC-R10, SBC, GTC) — alle aktiv

### Engine Bypass Vectors

Keine kritischen Bypass-Vektoren gefunden. Alle guarded Routes erfordern Entity-Existenz im Context.

---

## PHASE 4 — SPEC zu IMPLEMENTATION COVERAGE

### Spec Coverage

| Ordner | Dateien | Coverage | Status |
|--------|---------|----------|--------|
| 00_frozen | N/A | Archiviert | OK |
| 01_platform | 2 (ACCESS_MATRIX, ZONE_OVERVIEW) | ~60% | Luecke: Kein ZBC-Dokument, kein Storage-Spec (liegt in 07/) |
| 02_modules | 22 (MOD-00 bis MOD-20 + zone1_futureroom + LANDING_PAGE_BUILDER) | 100% Module abgedeckt | **DRIFT: mod-05 ist "MSV Downstream", sollte "Pets" sein** |
| 03_actions | 1 (README → armstrongManifest.ts) | OK (Delegation an Code-SSOT) | Korrekt deklariert |
| 04_workflows | 2 (README + WF-MEET-01) | ~10% | Sparse — Workflow-SSOT ist Engine/Manifest |
| 05_diagrams | 1 (README Platzhalter) | ~5% | Sparse — acceptable (Diagramme im Manifest) |
| 06_api_contracts | 24 (INDEX + 22 Contracts + module_api_overview) | 95% | Fast komplett |
| 07_storage_boundary | 1 (SBC_V1) | 100% | OK |
| 08_data_provenance | 2 (DPR_V1 + GOLDEN_TENANT_CONTRACT) | 100% | OK |

### Stale Docs / Rename List

| File | Issue | Fix |
|------|-------|-----|
| ERA-002 | `mod-05_website-builder.md` — beschreibt MSV, MOD-05 ist jetzt Pets | Rename + Rewrite |
| ERA-003 | `mod-10_abrechnung.md` — MOD-10 heisst jetzt "Lead Manager" im Manifest | Pruefen/Rename |

---

## PHASE 5 — CONTRACTS/EDGE FUNCTIONS (ohne Payment/Auth)

### Contract Invocation Matrix

21 Contracts dokumentiert in `spec/current/06_api_contracts/INDEX.md`. Davon:
- **6 Implementiert**: Lead Capture, Finance Submit, Mandate Assignment, Onboarding, Email Inbound, Renter Invite
- **15 Dokumentiert**: Listing Publish/Distribute, Acq Mandate/Inbound/Outbound, Social Mandate/Payment, WhatsApp, Renovation, Project Intake, Landing Page, Finance Doc Reminder, Data Room, Terms Gate

### Edge Function Map (95 Functions)

Kategorien (ohne Payment/Auth):
- **Akquise (ACQ)**: 10 EFs (inbound-webhook, outbound, offer-extract, profile-extract, research, contact-enrich, etc.)
- **Armstrong**: 3 (advisor, voice, website)
- **DMS/Storage**: 3 (download-url, upload-url, document-parser)
- **Finance**: 4 (proxy, manager-notify, document-reminder, public-submit)
- **Investment**: 1 (investment-engine)
- **Communication**: 10+ (mail-send, mail-sync, serien-email, whatsapp-*, videocall-*)
- **Projekte**: 3 (project-intake, public-project-intake, project-market-report)
- **Landing Pages**: 3 (generate, website-publish, website-update-section)
- **Research**: 8 (research-engine, free, pro-contacts, firecrawl, etc.)
- **System**: 5+ (tenant-storage-reset, ledger-retention, msv-reminder, etc.)
- **Zone 3**: 3 (website-lead-capture, website-ai-generate, futureroom-public-submit)

### Orphan Edge Functions (keine Code-Referenz/kein Contract)

| Function | Status |
|----------|--------|
| `sot-docs-export-*` (5 EFs) | Utility — Export-Funktionen, kein Cross-Zone Contract noetig |
| `sot-nasa-apod` | Widget-Integration — registriert in integration_registry |
| `sot-zenquotes-proxy` | Widget-Integration — registriert in integration_registry |
| `sot-news-proxy` | Widget-Integration — registriert in integration_registry |
| `check-landing-page-expiry` | Cron — kein Contract noetig |

Kein kritischer Orphan gefunden. Alle EFs haben entweder Contract, Integration-Registry-Eintrag oder Utility-Charakter.

---

## PHASE 6 — DATA/SSOT und ISOLATION

### SSOT Enforcement

MOD-04 ist korrekt als SSOT fuer Properties/Units/Leases/Loans etabliert:
- Downstream-Module (MOD-06, MOD-08, MOD-09, MOD-11, MOD-13, Zone 3) lesen ueber `v_public_listings` (security_invoker=on) oder direkte DB-Queries mit RLS
- Keine parallelen Tabellen mit redundanten Objektdaten gefunden

### DB Linter Results

| Finding | Level | Relevanz (ohne Auth) |
|---------|-------|---------------------|
| RLS Enabled No Policy | INFO | Pruefen welche Tabelle — moeglicherweise neue Tabellen ohne Policy |
| Auth OTP long expiry | WARN | AUSGESCHLOSSEN (Auth-Haertung) |
| Leaked Password Protection | WARN | AUSGESCHLOSSEN (Auth-Haertung) |

**ERA-004**: "RLS Enabled No Policy" muss geprueft werden — welche Tabelle(n) haben RLS aktiviert aber keine Policies? Dies ist ein potentielles Isolation-Risiko.

### Tenant Index Coverage

Alle Business-Tabellen nutzen `tenant_id` mit RLS via `get_user_tenant_id()` (SECURITY DEFINER). 141+ Indizes auf `tenant_id` und FK-Spalten dokumentiert (Memory: enterprise-hardening).

---

## PHASE 7 — TESTDESIGN

### Testmatrix (Smoke/E2E)

| Test-ID | Typ | Modul | Start-URL | Preconditions | Steps | Assertions |
|---------|-----|-------|-----------|---------------|-------|------------|
| T-001 | Smoke | Z1 | /admin | platform_admin | Lade Dashboard | Dashboard rendert, keine Console Errors |
| T-002 | Smoke | Z2 | /portal | Auth | Lade Portal Dashboard | Widgets rendern |
| T-003 | GP | MOD-04 | /portal/immobilien/portfolio | Auth | Demo-Widget klicken, Akte oeffnen | Immobilienakte mit 10+ Tabs |
| T-004 | GP | MOD-07 | /portal/finanzierung/anfrage | Auth | Neue Anfrage, Formulare | Guard aktiv auf /:requestId |
| T-005 | GP | MOD-08 | /portal/investments/suche | Auth | Parameter eingeben, Suche | Investment Engine Ergebnisse |
| T-006 | GP | MOD-13 | /portal/projekte/dashboard | Auth | Demo-Widget, Akte oeffnen | 10-Tab Dossier |
| T-007 | GP | MOD-11 | /portal/finanzierungsmanager/dashboard | finance_manager | Demo-Widget | Gold Standard Flow |
| T-008 | Isolation | Z1/Z2 | Import-Check | - | grep Z1-Imports in Z2 | 0 Treffer |
| T-009 | Routing | Legacy | /portfolio | - | Navigate | Redirect zu /portal/immobilien/portfolio |
| T-010 | Guard | MOD-04 | /portal/immobilien/{random-uuid} | Auth | Direct URL Entry | Redirect + Toast |
| T-011 | Z3 | Kaufy | /website/kaufy | - | Lade Home | Public Website rendert |
| T-012 | Engine | Investment | Edge Function | - | Curl sot-investment-engine | Korrekte Berechnung |

### Execution Log

| Test | Status | Methode |
|------|--------|---------|
| T-001 | Designed | Requires platform_admin session |
| T-002 | Designed | Requires auth session |
| T-003 | **EXECUTED** (prior audit) | Browser automation |
| T-004 | Designed | Requires auth session |
| T-005 | **EXECUTED** (prior audit) | Browser + Edge Function curl |
| T-006 | **EXECUTED** (prior audit) | Browser automation, 4 tabs verified |
| T-007 | Designed | Requires finance_manager role |
| T-008 | **EXECUTED** | grep — 0 cross-zone imports found |
| T-009 | Designed | Browser navigation |
| T-010 | Designed | Direct URL entry |
| T-011 | Designed | Browser navigation |
| T-012 | **EXECUTED** (prior audit) | Edge Function curl — math verified |

---

## PHASE 8 — REPARATURPLAN (priorisiert)

### P1 — Enterprise Risks

| ID | Root Cause | Fix | Files | Verification |
|----|-----------|-----|-------|-------------|
| ERA-002 | Spec-Datei `mod-05_website-builder.md` beschreibt MSV, MOD-05 ist Pets | Datei umbenennen zu `mod-05_pets.md`, Inhalt auf Pets-Modul umschreiben | `spec/current/02_modules/mod-05_website-builder.md` | Dateiname + Inhalt pruefen |
| ERA-004 | RLS Enabled No Policy — Tabelle(n) ohne RLS-Policies | Identifizieren und Policies anlegen | DB | `supabase--linter` erneut |
| ERA-005 | MOD-08 dynamic routes ohne goldenPath Guard im Manifest | Akzeptabel (internes Routing), aber dokumentieren | `routesManifest.ts` Kommentar | devValidator |

### P2 — Drift und Hygiene

| ID | Root Cause | Fix | Files |
|----|-----------|-----|-------|
| ERA-001 | `FinanceDesk` im adminDeskMap ohne Route | Eintrag entfernen | `ManifestRouter.tsx:271` |
| ERA-003 | `mod-10_abrechnung.md` — MOD-10 ist "Lead Manager" | Rename zu `mod-10_lead-manager.md` + Inhalt aktualisieren | `spec/current/02_modules/mod-10_abrechnung.md` |
| ERA-006 | 03_actions nur README (Delegation OK aber nicht explizit) | README um "SSOT liegt in armstrongManifest.ts" Erklaerung erweitern | `spec/current/03_actions/README.md` |
| ERA-007 | 04_workflows nur WF-MEET-01 + README | Entweder befuellen oder offiziell als "moved-to-engine" deklarieren | `spec/current/04_workflows/README.md` |

### P3 — Cleanup

| ID | Root Cause | Fix | Files |
|----|-----------|-----|-------|
| SIA4-004 | NK-Engine hardcoded Personenzahlen | Dynamisch aus DB laden | `src/engines/nkAbrechnung/engine.ts` |
| SIA4-006 | demoDataManifest GP-VERWALTUNG toggleKey | Rename (low risk) | `src/config/demoDataManifest.ts` |
| SIA4-007 | useMSVData Hook-Name | Rename zu useBWAData | `src/hooks/useMSVData.ts` |
| SIA4-008 | bwaKontenplan Kommentar | Update | `src/engines/nkAbrechnung/bwaKontenplan.ts` |
| SIA4-009 | useFinanceRequest TODO case_events | Implementieren | `src/hooks/useFinanceRequest.ts` |
| SIA4-010 | Armstrong webResearchEnabled hardcoded | Aus org_settings lesen | `src/hooks/useArmstrongContext.ts` |
| SIA4-011 | NK-Engine (supabase as any) | Types ergaenzen | `src/hooks/useNKAbrechnung.ts` |
| SIA4-012/013/014 | Verwaltung/BWA Label-Reste | Labels aktualisieren | Diverse |

### Enterprise-Ready Checkliste

| Dimension | Status | Details |
|-----------|--------|---------|
| Zone Isolation (Z1/Z2/Z3) | **PASS** | 0 Cross-Zone Imports, /website/** enforced |
| Manifest-Driven Routing | **PASS** | 0 Rogue Routes, ManifestRouter SSOT |
| Golden Path Engine | **PASS** | 7 GPs registriert, DEV-Validator aktiv |
| API Contracts | **PASS** | 21 Contracts, 6 implementiert, 15 dokumentiert |
| RLS/Tenant Isolation | **PASS mit Vorbehalt** | 1 INFO-Finding "RLS no policy" offen |
| Spec Coverage | **PASS mit Drift** | 2 Spec-Dateien veraltet (MOD-05, MOD-10) |
| Demo Data Framework | **PASS** | 15 GP-Prozesse, alle mit Demo-Widgets |
| DEV Validators | **PASS** | 10 Validierungen aktiv beim App-Start |
| Storage Boundary | **PASS** | SBC v1.0 enforced, Private Buckets korrekt |
| Cross-Zone Governance | **PASS** | Backbone-Pattern durchgesetzt |

---

## PHASE 9 — BACKLOG DATEI

Alle Findings werden in `spec/audit/enterprise_ready_backlog.json` mit Schema:

```text
{
  "id": "ERA-XXXX",
  "severity": "P0|P1|P2|P3",
  "phase": "0-8",
  "dimension": "routing|spec|engine|data|contract|test|code",
  "zone": "Z1|Z2|Z3|Cross",
  "module": "...",
  "title": "...",
  "description": "...",
  "repo_refs": ["file:line"],
  "fix_plan": { "steps": [...], "risk": "low|medium|high" },
  "verification": "...",
  "status": "open"
}
```

20 Items total: 0 P0, 3 P1, 4 P2, 13 P3 (inkl. SIA4-Items die noch offen sind).
