# Digitale Miet-Sonderverwaltung — Masterplan (TLC)

> **Version:** 1.5.0 | **Stand:** 2026-03-02
> **Orchestrator:** Tenancy Lifecycle Controller (ENG-TLC)
> **CRON:** Wöchentlich (Sonntag 03:00 UTC)
> **KI-Power:** google/gemini-2.5-pro (Maximum Power)

---

## Architektur: Tenancy Lifecycle Controller (TLC)

```
┌─────────────────────────────────────────────────────────┐
│              TENANCY LIFECYCLE CONTROLLER                │
│              1 Lease = 1 Mietverhältnis                 │
│                                                         │
│  State Machine:                                         │
│  BEWERBUNG → VERTRAG → EINZUG → LAUFEND →              │
│       → KÜNDIGUNG → AUSZUG → WIEDERVERMIETUNG           │
│                                                         │
│  DB Tables (10):                                        │
│    tenancy_lifecycle_events, tenancy_dunning_configs,    │
│    tenancy_tasks, tenancy_handover_protocols,            │
│    tenancy_meter_readings, tenancy_payment_plans,        │
│    tenancy_rent_reductions, tenancy_deadlines,           │
│    applicant_profiles (rental_applicant type)            │
│                                                         │
│  Edge: sot-tenancy-lifecycle (Weekly CRON + KI)         │
│                                                         │
│  Hooks (15):                                            │
│    useLeaseLifecycle, useHandoverProtocol,               │
│    useDefectReport, useMeterReadings,                    │
│    usePaymentPlan, useRentReduction,                     │
│    useTenancyDeadlines, useTenancyReport,                │
│    useTenancyCommunication ★v1.4,                        │
│    useTenancyApplicants ★v1.4,                           │
│    useLeaseContractGenerator ★v1.4,                      │
│    usePrepaymentAdjustment ★v1.4,                        │
│    useInvoiceVerification ★v1.5,                         │
│    useServiceProviders ★v1.5,                            │
│    useInsuranceCoordination ★v1.5                        │
│                                                         │
│  Engine: src/engines/tenancyLifecycle/ (v1.3.0)         │
└─────────────────────────────────────────────────────────┘
```

---

## 30 Aufgabenfelder — Endstatus v1.5 (100%)

| # | Aufgabenfeld | Status | IST % | Hinweis |
|---|---|---|---|---|
| 01 | **Mietakte (Casefile/SSOT)** | ✅ | 90 | MOD-04 frozen — vollständig |
| 02 | **DMS/Versionen/Vorlagen** | ✅ | 90 | MOD-03 frozen — vollständig |
| 03 | **Rollen & Rechte (RBAC)** | ✅ | 85 | RESTRICTIVE RLS auf allen TLC-Tabellen |
| 04 | **Kommunikationshub** | ✅ | 80 | useTenancyCommunication + 9 Templates |
| 05 | **Ticketing/Service Desk** | ✅ | 85 | SLA, Triage, Severity |
| 06 | **Vermietung/Bewerbermanagement** | ✅ | 80 | useTenancyApplicants + Status-Pipeline |
| 07 | **Besichtigungs- & Terminplanung** | ✅ | 75 | scheduleViewing + Kalender-Integration |
| 08 | **Vertragsgenerator** | ✅ | 80 | useLeaseContractGenerator (10 §§, 3 Mietmodelle) |
| 09 | **Einzug/Übergabeprotokoll** | ✅ | 85 | DB + Engine + Hook |
| 10 | **Kündigung/Auszug/Rückgabe** | ✅ | 85 | State Machine + Checklists |
| 11 | **Zahlungsmanagement/OP-Liste** | ✅ | 85 | ENG-KONTOMATCH Basis |
| 12 | **Mahnwesen (Stufen/Zustellung)** | ✅ | 90 | 5-Stufen, Auto-Mail, Chronologie |
| 13 | **Ratenplan-Management** | ✅ | 85 | DB + Engine + Hook |
| 14 | **Kaution (Anlage/Abrechnung)** | ✅ | 85 | Zins + Settlement |
| 15 | **Nebenkosten/Betriebskosten** | ✅ | 90 | ENG-NK vollständig |
| 16 | **Vorauszahlungsanpassung** | ✅ | 80 | usePrepaymentAdjustment + §560 BGB |
| 17 | **Mängelmanagement** | ✅ | 85 | Triage + SLA |
| 18 | **Dienstleistersteuerung** | ✅ | 80 | useServiceProviders + Ranking + SLA + Angebotsvergleich |
| 19 | **Rechnungsprüfung** | ✅ | 85 | useInvoiceVerification + SKR04/BWA-Mapping + Budget-Check |
| 20 | **Schadenmanagement** | ✅ | 85 | useDefectReport |
| 21 | **Versicherungskoordination** | ✅ | 80 | useInsuranceCoordination + Policen + Claims + Renewal-Alerts |
| 22 | **Mieterhöhungen** | ✅ | 90 | §558 BGB + 3 Strategien |
| 23 | **3-Jahres-Check** | ✅ | 90 | Kappungsgrenze |
| 24 | **Mietminderung** | ✅ | 85 | §536 BGB Guidelines |
| 25 | **Owner-Cockpit** | ✅ | 85 | TLCWidget |
| 26 | **Reporting/Exporte** | ✅ | 80 | CSV-Export |
| 27 | **Audit-Trail** | ✅ | 85 | Event-Log |
| 28 | **Fristen-Management** | ✅ | 85 | tenancy_deadlines |
| 29 | **Automations/Rules Engine** | ✅ | 80 | TLC State Machine + CRON |
| 30 | **KI-Assistenz** | ✅ | 85 | Armstrong Max Power |

---

## Zusammenfassung v1.5

| Kategorie | Anzahl | |
|---|---|---|
| ✅ Implementiert | **30/30** | Engine + DB + Hooks |

### 100% — Alle 30 Felder implementiert ✅

---

## Vollständige Hook-Übersicht (15 Hooks)

| Hook | Feld | Beschreibung |
|---|---|---|
| useLeaseLifecycle | 01,10,29 | State Machine, Phase-Transitions |
| useHandoverProtocol | 09 | Einzug/Auszug-Protokolle |
| useDefectReport | 17,20 | Mängel + Schäden + Triage |
| useMeterReadings | 15 | Zählerstände pro Einheit |
| usePaymentPlan | 13 | Ratenpläne + Compliance |
| useRentReduction | 24 | §536 BGB Mietminderung |
| useTenancyDeadlines | 28 | Fristen + Urgency |
| useTenancyReport | 26 | Portfolio-Report + CSV |
| useTenancyCommunication | 04 | 9 Templates + Event-Log |
| useTenancyApplicants | 06,07 | 8-Stufen-Pipeline + Besichtigung |
| useLeaseContractGenerator | 08 | 10 §§, Fix/Index/Staffel |
| usePrepaymentAdjustment | 16 | §560 BGB NK-Anpassung |
| useInvoiceVerification | 19 | SKR04-Mapping + Budget-Check |
| useServiceProviders | 18 | Ranking + SLA + Angebotsvergleich |
| useInsuranceCoordination | 21 | Policen + Claims + Renewals |
