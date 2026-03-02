# Digitale Miet-Sonderverwaltung — Masterplan (TLC)

> **Version:** 2.0.0 | **Stand:** 2026-03-02
> **Orchestrator:** Tenancy Lifecycle Controller (ENG-TLC)
> **CRON:** Wöchentlich (Sonntag 03:00 UTC)
> **KI-Power:** google/gemini-2.5-pro (Maximum Power)
> **Backlog:** `.lovable/backlog.md`

---

## Status-Übersicht

| Schicht | IST | SOLL | Gap |
|---------|-----|------|-----|
| Engine (spec.ts + engine.ts) | 90% | 100% | Tests fehlen |
| DB-Tabellen (8 tenancy_*) | 85% | 100% | RLS für 3 Tabellen reparieren |
| Hooks (15 Stück) | 80% | 100% | Code vorhanden, typisiert |
| UI-Integration | 5% | 100% | 14/15 Hooks nicht eingebunden |
| Edge Function (CRON) | 70% | 100% | v1.1 → v1.5 Upgrade nötig |
| Tests | 0% | 100% | 0 Tests vorhanden |
| Gesamtreifegrad | **~35%** | **100%** | Phase 1-4 nötig |

---

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│              TENANCY LIFECYCLE CONTROLLER                │
│              1 Lease = 1 Mietverhältnis                 │
│                                                         │
│  State Machine:                                         │
│  BEWERBUNG → VERTRAG → EINZUG → LAUFEND →              │
│       → KÜNDIGUNG → AUSZUG → WIEDERVERMIETUNG           │
│                                                         │
│  DB Tables (8):                                         │
│    tenancy_lifecycle_events, tenancy_dunning_configs,    │
│    tenancy_tasks, tenancy_handover_protocols,            │
│    tenancy_meter_readings, tenancy_payment_plans,        │
│    tenancy_rent_reductions, tenancy_deadlines            │
│                                                         │
│  Edge: sot-tenancy-lifecycle (Weekly CRON + KI)         │
│                                                         │
│  Hooks (15):                                            │
│    useLeaseLifecycle, useHandoverProtocol,               │
│    useDefectReport, useMeterReadings,                    │
│    usePaymentPlan, useRentReduction,                     │
│    useTenancyDeadlines, useTenancyReport,                │
│    useTenancyCommunication, useTenancyApplicants,        │
│    useLeaseContractGenerator, usePrepaymentAdjustment,   │
│    useInvoiceVerification, useServiceProviders,          │
│    useInsuranceCoordination                              │
│                                                         │
│  Engine: src/engines/tenancyLifecycle/ (v1.5.0)         │
└─────────────────────────────────────────────────────────┘
```

---

## Phasenplan

### Phase 0 — Governance ✅ DONE

- [x] UNFREEZE MOD-00 bis MOD-22
- [x] UNFREEZE INFRA-edge_functions
- [x] UNFREEZE INFRA-manifests
- [x] Backlog-Datei angelegt (.lovable/backlog.md)
- [x] Plan überarbeitet (.lovable/plan.md v2.0)

### Phase 1 — RLS-Reparatur & TenancyTab TLC-Integration

**Ziel:** TenancyTab wird zur zentralen Mietakte mit allen TLC-Daten.

| # | Aufgabe | Backlog-ID |
|---|---------|------------|
| 1 | RLS-Policies für 3 Tabellen reparieren (tenant_id CRUD) | B-001 |
| 2 | TenancyTab: Lifecycle-Events Section | B-002 |
| 3 | TenancyTab: Tasks/Tickets Section | B-003 |
| 4 | TenancyTab: Mahnhistorie Section | B-004 |
| 5 | TenancyTab: Deadlines Section | B-005 |
| 6 | TenancyTab: Zählerstände Section | B-006 |
| 7 | TLCWidget: Echte Aggregationen | B-007 |

### Phase 2 — Detailseiten & Workflows

**Ziel:** UI-Dialoge für komplexe TLC-Prozesse.

| # | Aufgabe | Backlog-ID |
|---|---------|------------|
| 1 | Übergabeprotokoll-Dialog | B-010 |
| 2 | Mängelmelder + Ticketing | B-011 |
| 3 | Bewerbermanagement (8-Stufen-Pipeline) | B-012 |
| 4 | Vertragsgenerator Preview | B-013 |
| 5 | Ratenplan-Dialog | B-014 |
| 6 | Mietminderungs-Dialog | B-015 |

### Phase 3 — Kommunikation, Finanzen & Dienstleister

**Ziel:** Alle verbleibenden Hooks in die UI integrieren.

| # | Aufgabe | Backlog-ID |
|---|---------|------------|
| 1 | Kommunikations-Panel | B-020 |
| 2 | NK-Vorauszahlungsanpassung | B-021 |
| 3 | Rechnungsprüfung | B-022 |
| 4 | Dienstleister-Verwaltung | B-023 |
| 5 | Versicherungskoordination | B-024 |
| 6 | Portfolio-Report + CSV-Export | B-025 |

### Phase 4 — Edge Function & Engine-Sync + Tests

**Ziel:** Backend-Automatisierung produktionsreif.

| # | Aufgabe | Backlog-ID |
|---|---------|------------|
| 1 | Edge Function auf v1.5 upgraden | B-030 |
| 2 | CRON-Test | B-031 |
| 3 | Engine Unit-Tests (Set 1) | B-032 |
| 4 | Engine Unit-Tests (Set 2) | B-033 |
| 5 | Engine Unit-Tests (Set 3) | B-034 |

---

## 30 Aufgabenfelder — Referenz

| # | Aufgabenfeld | Hook | Engine-Funktion |
|---|---|---|---|
| 01 | Mietakte (SSOT) | useLeaseLifecycle | — |
| 02 | DMS/Versionen | — | — |
| 03 | Rollen & Rechte | — | — |
| 04 | Kommunikationshub | useTenancyCommunication | — |
| 05 | Ticketing/Service Desk | useDefectReport | triageDefect |
| 06 | Bewerbermanagement | useTenancyApplicants | — |
| 07 | Besichtigungsplanung | useTenancyApplicants | scheduleViewing |
| 08 | Vertragsgenerator | useLeaseContractGenerator | — |
| 09 | Übergabeprotokoll | useHandoverProtocol | — |
| 10 | Kündigung/Auszug | useLeaseLifecycle | — |
| 11 | Zahlungsmanagement | — | ENG-KONTOMATCH |
| 12 | Mahnwesen | useLeaseLifecycle | calculateDunningLevel |
| 13 | Ratenplan | usePaymentPlan | generatePaymentPlanSchedule |
| 14 | Kaution | — | calculateDepositInterest |
| 15 | Nebenkosten | useMeterReadings | ENG-NK |
| 16 | Vorauszahlungsanpassung | usePrepaymentAdjustment | — |
| 17 | Mängelmanagement | useDefectReport | triageDefect |
| 18 | Dienstleistersteuerung | useServiceProviders | — |
| 19 | Rechnungsprüfung | useInvoiceVerification | — |
| 20 | Schadenmanagement | useDefectReport | — |
| 21 | Versicherungskoordination | useInsuranceCoordination | — |
| 22 | Mieterhöhungen | — | checkRentIncreaseEligibility |
| 23 | 3-Jahres-Check | — | checkRentIncreaseEligibility |
| 24 | Mietminderung | useRentReduction | calculateRentReduction |
| 25 | Owner-Cockpit | TLCWidget | — |
| 26 | Reporting/Exporte | useTenancyReport | — |
| 27 | Audit-Trail | useLeaseLifecycle | — |
| 28 | Fristen-Management | useTenancyDeadlines | checkDeadlines |
| 29 | Automations/Rules | — | TLC State Machine |
| 30 | KI-Assistenz | — | Armstrong |

---

## Regeln

- **Keine Demo-Daten** im Golden Tenant oder User-Modulen
- Demo-Daten ausschließlich über Demo Seed Engine + public/demo-data/ CSVs
- Jede Phase wird nach Abschluss im Backlog als ✅ DONE markiert
- Nach jeder Phase: Re-Freeze-Entscheidung
