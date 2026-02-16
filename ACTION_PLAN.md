# Enterprise Readiness - Action Plan (Trackable)

> **Based on**: [ENTERPRISE_READINESS_REVIEW.md](./ENTERPRISE_READINESS_REVIEW.md)  
> **Sprint Duration**: 2 Wochen each  
> **Team**: 1-2 Developers + 1 QA  
> **Start**: TBD

---

## 🎯 Sprint 1: Security & Performance Foundation

**Ziel**: Kritische Security-Lücken schließen, Performance-Bottlenecks beheben, Test-Foundation starten  
**Dauer**: 2 Wochen (10 Arbeitstage)  
**Story Points**: 15 PT

### Week 1: Security Hardening (5 PT)

#### Tag 1-2: CORS & Webhook Security
- [ ] **CORS-001**: CORS Origins einschränken auf 109 Edge Functions
  - [ ] Liste erlaubter Origins definieren: `kaufy.io`, `miety.de`, `futureroom.de`, `systemofatown.com`
  - [ ] Script erstellen für Bulk-Update aller Functions
  - [ ] Test: CORS von unerlaubten Origins blocken
  - [ ] Merge & Deploy
  - **Owner**: Backend | **PT**: 2 | **Priority**: P0

- [ ] **WEBHOOK-001**: Webhook-Signature-Validation implementieren
  - [ ] `sot-acq-inbound-webhook`: HMAC-SHA256 Signature Check
  - [ ] `sot-renovation-inbound-webhook`: HMAC-SHA256 Signature Check
  - [ ] `sot-whatsapp-webhook`: Meta Webhook Signature Validation
  - [ ] Integration-Tests für ungültige Signaturen
  - **Owner**: Backend | **PT**: 1 | **Priority**: P0

#### Tag 3-4: Architecture Enforcement
- [ ] **ESLINT-001**: ESLint Cross-Zone Rules konfigurieren
  - [ ] Plugin installieren: `eslint-plugin-import` oder Custom Rule
  - [ ] Rule definieren: `no-cross-zone-imports`
    - Blocked: `src/pages/admin/**` → `src/pages/portal/**`
    - Blocked: `src/pages/portal/**` → `src/pages/admin/**`
    - Blocked: `src/pages/zone3/**` → `src/pages/{admin,portal}/**`
  - [ ] CI-Integration: Lint als Pre-Commit Hook
  - **Owner**: DevOps | **PT**: 1 | **Priority**: P1

- [ ] **ARCH-001**: Intra-Portal Violation fixen
  - [ ] Extract `AktionsKatalog` → `src/shared/armstrong/`
  - [ ] Extract `KostenDashboard` → `src/shared/armstrong/`
  - [ ] Update Imports in `stammdaten/AbrechnungTab.tsx`
  - [ ] Verify: ESLint passes
  - **Owner**: Frontend | **PT**: 0.5 | **Priority**: P1

#### Tag 5: Production Code Cleanup
- [ ] **CLEAN-001**: Console.log() Statements entfernen
  - [ ] Logger-Middleware mit `__DEV__` Guards implementieren
  - [ ] Replace 29 `console.log()` durch Logger
  - [ ] Files: `AuthContext.tsx` (3), `useArmstrongVoice.ts` (2), `usePortalLayout.tsx` (3), etc.
  - [ ] CI-Check: Block `console.log` in Production Code
  - **Owner**: Frontend | **PT**: 0.5 | **Priority**: P2

- [ ] **CLEAN-002**: Empty Catch Blocks beheben
  - [ ] 15+ Instanzen: Logging oder Rethrow hinzufügen
  - [ ] Files: `FutureRoomAkte.tsx`, `DictationButton.tsx`, `generateProjectReportPdf.ts`
  - [ ] Pattern: `catch (err) { logger.error('Context', err); }`
  - **Owner**: Frontend | **PT**: 0.5 | **Priority**: P2

### Week 2: Performance & Test Foundation (10 PT)

#### Tag 6-7: Performance Optimizations
- [ ] **PERF-001**: Server-Side Paginierung implementieren
  - [ ] Backend: `.range()` Support in `useAcqOffers`, `useAcqContacts`
  - [ ] Frontend: `AkquiseDatenbank.tsx` Pagination Controls
  - [ ] Contact Lists: Server-Side Pagination
  - [ ] Test: 5000+ Offers ohne Freeze
  - **Owner**: Full-Stack | **PT**: 3 | **Priority**: P1

- [ ] **PERF-002**: Armstrong Dashboard View erstellen
  - [ ] Migration: `CREATE VIEW v_armstrong_dashboard_kpis AS ...`
  - [ ] Aggregations: `actions_24h`, `costs_30d`, `error_rate`, `avg_duration`, etc.
  - [ ] Hook: `useArmstrongDashboard` → Single Query statt 6x
  - [ ] Test: Dashboard lädt <500ms
  - **Owner**: Backend | **PT**: 2 | **Priority**: P1

#### Tag 8-10: Test Foundation (Critical Paths)
- [ ] **TEST-001**: NK Abrechnung Engine Tests
  - [ ] Unit-Tests: Umlageschlüssel-Korrektheit
  - [ ] Unit-Tests: Heiz-/Warmwasser-Aufteilung nach Verbrauch
  - [ ] Unit-Tests: Nachzahlungs-Berechnungen (Soll vs. Ist)
  - [ ] Coverage-Ziel: 80%+ für `nkAbrechnung/`
  - **Owner**: QA + Backend | **PT**: 3 | **Priority**: P0

- [ ] **TEST-002**: Finance Calculation Tests
  - [ ] `useConsumerLoan`: Zins-/Raten-Berechnung
  - [ ] `useFinanceMandate`: Darlehens-Aggregation
  - [ ] `useFinanceSubmission`: Europace-Payload-Validation
  - [ ] Coverage-Ziel: 70%+ für Finance Hooks
  - **Owner**: QA + Backend | **PT**: 2 | **Priority**: P0

### Sprint 1 Review Checklist
- [ ] Security: CORS + Webhooks geschlossen
- [ ] Architecture: ESLint Rules aktiv, 0 Violations
- [ ] Performance: Paginierung + Armstrong View live
- [ ] Tests: 15+ kritische Tests hinzugefügt
- [ ] Coverage: Von 4% auf 15%+ gestiegen
- [ ] CI: Alle Checks grün

---

## 🚀 Sprint 2: Test Expansion & TypeScript Strictness

**Ziel**: Test-Coverage auf 25%+, TypeScript strict mode, E2E Happy Paths  
**Dauer**: 2 Wochen (10 Arbeitstage)  
**Story Points**: 15 PT

### Week 1: Test Expansion (11 PT)

#### Tag 1-3: Golden Path & Integration Tests
- [ ] **TEST-003**: Golden Path Guards Unit-Tests
  - [ ] `GP_FINANCE_Z3.ts`: Zone 3 → Finance Flow Guards
  - [ ] `GP_LEAD.ts`: Lead Capture → Routing Logic
  - [ ] `GP_VERMIETUNG.ts`: Rental Process Steps
  - [ ] Coverage-Ziel: 100% für Golden Path Guards
  - **Owner**: QA + Frontend | **PT**: 4 | **Priority**: P0

- [ ] **TEST-004**: Acquisition Flow Integration Tests
  - [ ] `useAcqMandate`: Mandats-Erstellung + Validierung
  - [ ] `useAcqOffers`: Angebots-Generierung + Status-Transitions
  - [ ] Pipeline-Status: Draft → Active → Won/Lost
  - [ ] Coverage-Ziel: 70%+ für ACQ Hooks
  - **Owner**: QA + Backend | **PT**: 3 | **Priority**: P0

#### Tag 4-5: E2E Happy Paths (Playwright)
- [ ] **E2E-001**: Finance Request Flow (Zone 3 → Zone 1)
  - [ ] Step 1: Submit finance request via public form
  - [ ] Step 2: Verify lead creation in admin pool
  - [ ] Step 3: Assign to agent
  - [ ] Step 4: Process finance package → Europace
  - [ ] Assertion: Finance package visible in Zone 2
  - **Owner**: QA | **PT**: 2 | **Priority**: P0

- [ ] **E2E-002**: Rental Management Happy Path
  - [ ] Step 1: Create property
  - [ ] Step 2: Add unit with pricing
  - [ ] Step 3: Create lease for unit
  - [ ] Step 4: Generate NK Abrechnung
  - [ ] Assertion: PDF generated correctly
  - **Owner**: QA | **PT**: 2 | **Priority**: P0

### Week 2: TypeScript Strictness & Tech Debt (4 PT)

#### Tag 6-8: Type-Safety Refactor
- [ ] **TS-001**: Activate `strict: true` in tsconfig.json
  - [ ] Phase 1: Fix NK Abrechnung Types (Priority)
  - [ ] Phase 2: Fix Finance Hooks Types
  - [ ] Phase 3: Fix Armstrong Integration Types
  - [ ] Phase 4: Remaining 60+ `any` Types
  - [ ] CI: Build muss mit strict mode durchlaufen
  - **Owner**: Frontend | **PT**: 5 | **Priority**: P1

- [ ] **TS-002**: Zod Schema Validation
  - [ ] Webhook Payloads: `sot-acq-inbound-webhook`, `sot-renovation-inbound-webhook`
  - [ ] Public Endpoints: `sot-public-project-intake`, `sot-futureroom-public-submit`
  - [ ] Error Handling: 400 Bad Request bei Validation Failure
  - **Owner**: Backend | **PT**: 2 | **Priority**: P1

#### Tag 9-10: Tech Debt Triage
- [ ] **DEBT-001**: TODO/FIXME → Backlog Tickets
  - [ ] Audit: 27 TODO/FIXME Comments
  - [ ] Create Tickets: Jira/Linear/GitHub Issues
  - [ ] Fields: Owner, Priority, Sprint, Deadline
  - [ ] Pattern: `// TODO (TICKET-123): Description`
  - **Owner**: PM + Tech Lead | **PT**: 1 | **Priority**: P2

- [ ] **DEBT-002**: Deprecated Code Audit
  - [ ] Liste: 14 Deprecated Items (`routes_manifest.yaml`, `MarketingTab.tsx`, Finance-Felder)
  - [ ] Decision per Item: Migrate oder Remove
  - [ ] Migration-Plan: 2 Sprints Timeline
  - [ ] Kommunikation: Breaking Changes Announcement
  - **Owner**: Tech Lead | **PT**: 2 | **Priority**: P2

### Sprint 2 Review Checklist
- [ ] Test-Coverage: 25%+ (von 4%)
- [ ] TypeScript: `strict: true` aktiviert, Build grün
- [ ] E2E: 2 Happy Paths (Finance, Rental) grün
- [ ] Zod: Validation auf 4+ kritischen Endpoints
- [ ] Tech Debt: 27 TODOs → Tickets, 14 Deprecated Items dokumentiert

---

## 📊 Post-Sprint 2: Continuous Improvement

### Monitoring & Observability
- [ ] **MONITOR-001**: Coverage Reports in CI
  - [ ] Vitest Coverage Plugin konfigurieren
  - [ ] Istanbul/NYC Integration
  - [ ] Minimum Coverage: 25% (enforced)
  - [ ] Coverage Badge in README

- [ ] **MONITOR-002**: Performance Monitoring
  - [ ] Sentry Integration (Error Tracking)
  - [ ] Custom Metrics: Page Load, API Response Times
  - [ ] Alerts: Response Time >2s, Error Rate >1%

- [ ] **MONITOR-003**: Security Scanning
  - [ ] Snyk: Dependency Vulnerabilities
  - [ ] OWASP Dependency-Check
  - [ ] npm audit als Pre-Commit Hook

### Documentation Updates
- [ ] **DOC-001**: RLS Policy Dokumentation
  - [ ] Liste aller Tabellen mit RLS Status
  - [ ] Policy-Patterns dokumentieren
  - [ ] Service Role Bypass Cases auflisten

- [ ] **DOC-002**: View-Liste mit Security-Audit
  - [ ] Inventory: Alle Database Views
  - [ ] Security-Check: Tenant-Filtering vorhanden?
  - [ ] Performance-Metrics: Index Usage

- [ ] **DOC-003**: Test-Strategy Guide
  - [ ] Wann Unit vs. Integration vs. E2E?
  - [ ] Test-Naming Conventions
  - [ ] Mock-Data Best Practices

---

## 🎯 Definition of Done (Production-Ready)

### Security ✅
- [x] CORS auf spezifische Origins eingeschränkt
- [x] Webhook-Signature-Validation implementiert
- [x] Rate-Limiting auf Public Endpoints (Future)
- [x] Zod-Schemas für alle Inputs

### Architecture ✅
- [x] ESLint Cross-Zone Rules aktiv
- [x] 0 Cross-Zone Violations
- [x] Golden Path Guards getestet
- [x] SSOT Routing verifiziert

### Quality ✅
- [x] Test-Coverage ≥25%
- [x] TypeScript `strict: true`
- [x] 0 `console.log()` in Production
- [x] 0 Empty Catch Blocks ohne Logging

### Performance ✅
- [x] Server-Side Paginierung
- [x] Armstrong Dashboard <500ms
- [x] Portfolio Load <2s (1000 Units)
- [x] N+1 Queries eliminiert

### Documentation ✅
- [x] RLS Policies dokumentiert
- [x] Views auditiert
- [x] Test-Strategy Guide vorhanden
- [x] Tech Debt transparent (Backlog)

---

## 📞 Contact & Review

**Questions**: Siehe [ENTERPRISE_READINESS_REVIEW.md](./ENTERPRISE_READINESS_REVIEW.md) Sections 1-10  
**Progress Tracking**: Dieses Dokument via Git verfolgen  
**Sprint Planning**: Diese Checklists in Jira/Linear importieren

**Review-Zyklus**: Weekly Sync, Sprint Review nach 2 Wochen
