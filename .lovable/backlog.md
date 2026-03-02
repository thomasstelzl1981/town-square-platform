# TLC Backlog — Tenancy Lifecycle Controller

> **Stand:** 2026-03-02 | **Version:** 1.5
> **Kontext:** TLC v1.5 — alle 4 Phasen abgeschlossen

---

## Phase 1 — RLS-Reparatur & TenancyTab TLC-Integration

| ID | Aufgabe | Status | Prio |
|----|---------|--------|------|
| B-001 | RLS-Policies für tenancy_deadlines, tenancy_payment_plans, tenancy_rent_reductions neu erstellen (PERMISSIVE, tenant_id-basiert, CRUD) | ✅ DONE | P0 |
| B-002 | TenancyTab: Lifecycle-Events Section (Chronologie/Audit-Trail) via useLeaseLifecycle | ✅ DONE | P0 |
| B-003 | TenancyTab: Offene Tasks/Tickets Section via useLeaseLifecycle | ✅ DONE | P0 |
| B-004 | TenancyTab: Mahnhistorie Section via useLeaseLifecycle Events | ✅ DONE (in Events) | P0 |
| B-005 | TenancyTab: Deadlines Section via useTenancyDeadlines | ✅ DONE | P0 |
| B-006 | TenancyTab: Zählerstände Section via useMeterReadings | ✅ DONE | P1 |
| B-007 | TLCWidget: Echte Aggregationen (Deadlines, Mahnungen, Events zählen) | ✅ DONE | P1 |

## Phase 2 — Detailseiten & Workflows

| ID | Aufgabe | Status | Prio |
|----|---------|--------|------|
| B-010 | Übergabeprotokoll-Dialog (Modal/Inline) via useHandoverProtocol | ✅ DONE | P1 |
| B-011 | Mängelmelder + Ticketing UI via useDefectReport | ✅ DONE | P1 |
| B-012 | Bewerbermanagement Section (8-Stufen-Pipeline) via useTenancyApplicants | ✅ DONE | P1 |
| B-013 | Vertragsgenerator Preview via useLeaseContractGenerator | ✅ DONE | P1 |
| B-014 | Ratenplan-Dialog via usePaymentPlan | ✅ DONE | P1 |
| B-015 | Mietminderungs-Dialog (§536 BGB) via useRentReduction | ✅ DONE | P1 |

## Phase 3 — Kommunikation, Finanzen & Dienstleister

| ID | Aufgabe | Status | Prio |
|----|---------|--------|------|
| B-020 | Kommunikations-Panel (Template-Versand) via useTenancyCommunication | ✅ DONE | P1 |
| B-021 | NK-Vorauszahlungsanpassung UI (§560 BGB) via usePrepaymentAdjustment | ✅ DONE | P2 |
| B-022 | Rechnungsprüfung UI (SKR04 + Budget-Check) via useInvoiceVerification | ✅ DONE | P2 |
| B-023 | Dienstleister-Verwaltung (Ranking + SLA) via useServiceProviders | ✅ DONE | P2 |
| B-024 | Versicherungskoordination (Policen + Claims) via useInsuranceCoordination | ✅ DONE | P2 |
| B-025 | Portfolio-Report + CSV-Export via useTenancyReport | ✅ DONE | P2 |

## Phase 4 — Edge Function & Engine-Sync + Tests

| ID | Aufgabe | Status | Prio |
|----|---------|--------|------|
| B-030 | Edge Function sot-tenancy-lifecycle auf Engine v1.5 upgraden | ✅ DONE | P1 |
| B-031 | CRON-Test: Manueller Trigger + Log-Prüfung | ✅ DONE (deploy verified) | P1 |
| B-032 | Engine Unit-Tests: triageDefect, checkRentIncreaseEligibility | ✅ DONE (44/44 pass) | P2 |
| B-033 | Engine Unit-Tests: calculateDepositInterest, generatePaymentPlanSchedule | ✅ DONE (44/44 pass) | P2 |
| B-034 | Engine Unit-Tests: calculateRentReduction, checkDeadlines | ✅ DONE (44/44 pass) | P2 |

## Separat / Demo-Daten (nicht in diesem Sprint)

| ID | Aufgabe | Status | Prio |
|----|---------|--------|------|
| B-090 | Demo-Daten CSVs für TLC-Entitäten in public/demo-data/ anlegen | ⬜ BACKLOG | P3 |
| B-091 | useDemoSeedEngine um TLC-Seed-Funktionen erweitern | ⬜ BACKLOG | P3 |
| B-092 | useDemoCleanup um TLC-Entitäten erweitern | ⬜ BACKLOG | P3 |
