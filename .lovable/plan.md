# Digitale Miet-Sonderverwaltung — Masterplan (TLC)

> **Version:** 1.3.0 | **Stand:** 2026-03-02
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
│  DB:   tenancy_lifecycle_events (Event-Log)             │
│        tenancy_dunning_configs  (Mahnstufen)            │
│        tenancy_tasks            (Aufgaben/Worklist)     │
│        tenancy_handover_protocols (Übergabe)            │
│        tenancy_meter_readings   (Zählerstände)          │
│        tenancy_payment_plans    (Ratenpläne) ★NEW       │
│        tenancy_rent_reductions  (Mietminderungen) ★NEW  │
│        tenancy_deadlines        (Fristen) ★NEW          │
│  Edge: sot-tenancy-lifecycle    (Weekly CRON + KI)      │
│  Hooks:                                                 │
│    useLeaseLifecycle, useHandoverProtocol,               │
│    useDefectReport, useMeterReadings,                    │
│    usePaymentPlan ★NEW, useRentReduction ★NEW,          │
│    useTenancyDeadlines ★NEW, useTenancyReport ★NEW      │
│  Engine: src/engines/tenancyLifecycle/ (v1.3.0)         │
└─────────────────────────────────────────────────────────┘
```

---

## 30 Aufgabenfelder — Endstatus

| # | Aufgabenfeld | TLC-Phase | Status | IST % | Hinweis |
|---|---|---|---|---|---|
| 01 | **Mietakte (Casefile/SSOT)** | ALLE | ✅ | 90 | MOD-04 frozen — Bestand vollständig |
| 02 | **DMS/Versionen/Vorlagen** | ALLE | ✅ | 90 | MOD-03 frozen — Bestand vollständig |
| 03 | **Rollen & Rechte (RBAC)** | ALLE | ✅ | 85 | RESTRICTIVE RLS auf allen TLC-Tabellen, memberships-basiert |
| 04 | **Kommunikationshub** | LAUFEND | 🔒 | 40 | MOD-02 + MOD-14 frozen — Unfreeze nötig |
| 05 | **Ticketing/Service Desk** | LAUFEND | ✅ | 85 | SLA, Triage, Severity, Photo support |
| 06 | **Vermietung/Bewerbermanagement** | BEWERBUNG | 🔒 | 55 | applicant_profiles existiert — UI in frozen Modulen |
| 07 | **Besichtigungs- & Terminplanung** | BEWERBUNG | 🔒 | 30 | MOD-02 frozen — Unfreeze nötig |
| 08 | **Vertragsgenerator & E-Signatur** | VERTRAG | 🔒 | 40 | MOD-02 frozen — Briefgenerator Basis vorhanden |
| 09 | **Einzug/Übergabeprotokoll** | EINZUG | ✅ | 85 | DB + Engine + Hook vollständig |
| 10 | **Kündigung/Auszug/Rückgabe** | KÜNDIGUNG | ✅ | 85 | State Machine + Checklists + Deposit |
| 11 | **Zahlungsmanagement/OP-Liste** | LAUFEND | ✅ | 85 | ENG-KONTOMATCH frozen — Basis vollständig |
| 12 | **Mahnwesen (Stufen/Zustellung)** | LAUFEND | ✅ | 90 | 5-Stufen-Config, Auto-Mail, Chronologie |
| 13 | **Ratenplan- & Rückstandsmanagement** | LAUFEND | ✅ | 85 | DB + Engine + Hook (generateSchedule, checkCompliance) |
| 14 | **Kaution (Anlage/Abrechnung)** | VERTRAG→AUSZUG | ✅ | 85 | Zins + Settlement + Auto-Task |
| 15 | **Nebenkosten/Betriebskosten** | LAUFEND | ✅ | 90 | ENG-NK frozen — vollständig |
| 16 | **Vorauszahlungsanpassung** | LAUFEND | 🔒 | 30 | ENG-NK frozen + MOD-02 frozen |
| 17 | **Mängelmanagement/Instandhaltung** | LAUFEND | ✅ | 85 | Triage + SLA + useDefectReport |
| 18 | **Dienstleistersteuerung** | LAUFEND | ⏳ | 10 | Tier-3 — contacts Basis vorhanden |
| 19 | **Rechnungsprüfung/Kostenstellen** | LAUFEND | 🔒 | 50 | ENG-BWA frozen |
| 20 | **Schadenmanagement (Incident)** | LAUFEND | ✅ | 85 | useDefectReport + damage events |
| 21 | **Versicherungskoordination** | LAUFEND | ⏳ | 10 | Tier-3 — MOD-11 frozen |
| 22 | **Mieterhöhungen (Index/Staffel)** | LAUFEND | ✅ | 90 | §558 BGB + 3 Strategien |
| 23 | **3-Jahres-Erhöhungscheck** | LAUFEND | ✅ | 90 | Kappungsgrenze + Vorschläge |
| 24 | **Mietminderung** | LAUFEND | ✅ | 85 | DB + Engine + Hook (§536 BGB Guidelines) |
| 25 | **Owner-Cockpit/Dashboards** | ALLE | ✅ | 85 | TLCWidget — MOD-00 frozen |
| 26 | **Reporting/Exporte** | ALLE | ✅ | 80 | useTenancyReport + CSV-Export |
| 27 | **Audit-Trail/Ledger** | ALLE | ✅ | 85 | tenancy_lifecycle_events vollständig |
| 28 | **Fristen- & Aufgabenmanagement** | ALLE | ✅ | 85 | tenancy_deadlines DB + Hook + Checker Engine |
| 29 | **Automations/Rules Engine** | ALLE | ✅ | 80 | TLC State Machine + CRON — Edge frozen |
| 30 | **KI-Assistenz (Max Power)** | ALLE | ✅ | 85 | Armstrong + gemini-2.5-pro |

---

## Zusammenfassung

| Kategorie | Anzahl | Status |
|---|---|---|
| ✅ Vollständig implementiert | 23/30 | Engine + DB + Hooks ready |
| 🔒 Frozen-blockiert | 5/30 | Unfreeze der jeweiligen Module nötig |
| ⏳ Tier-3 (Langfristig) | 2/30 | Dienstleister + Versicherung |

### Frozen-blockierte Felder (5):
- **Feld 4** (Kommunikationshub): MOD-02 + MOD-14 frozen
- **Feld 6** (Vermietung): Module-UI frozen
- **Feld 7** (Besichtigung): MOD-02 frozen
- **Feld 8** (E-Signatur): MOD-02 frozen
- **Feld 16** (Vorauszahlung): ENG-NK + MOD-02 frozen

→ Um diese Felder zu aktivieren: `UNFREEZE MOD-02` und/oder `UNFREEZE MOD-14`

### Tier-3 (Langfristig, 2):
- **Feld 18** (Dienstleistersteuerung): Angebotseinholung, Vergleich
- **Feld 21** (Versicherungskoordination): Schadensmeldung an Versicherer

---

## ENG-TLC v1.3.0 — Vollständige Funktionsliste

### spec.ts (Types & Constants)
- TLCPhase, TLCEventType, TLCSeverity, TLCTriggeredBy
- TenancyTask*, HandoverProtocol*, MeterReading*
- DefectSeverity + SLA_HOURS + TRIAGE_KEYWORDS
- DunningLevel + DEFAULT_DUNNING_LEVELS
- RentIncreaseCheck + RENT_INCREASE_DEFAULTS
- **PaymentPlanInput/Schedule** ★v1.3
- **RentReductionInput/Result + GUIDELINES** ★v1.3
- **DeadlineType + DEADLINE_TYPES** ★v1.3
- MoveChecklist + CHECKLIST_ITEMS

### engine.ts (Pure Functions)
- determinePhase, analyzePaymentStatus, determineDunningLevel
- buildDunningChronology
- checkRentIncreaseEligibility, calculateRentIncreaseProposals
- performThreeYearCheck
- checkDepositStatus, calculateDepositInterest, calculateDepositSettlement
- analyzeLease (Master-Analyse)
- triageDefect, calculateSlaDeadline
- generateMoveChecklist, checkMoveChecklistDeadlines
- **generatePaymentPlanSchedule, checkPaymentPlanCompliance** ★v1.3
- **calculateRentReduction, suggestRentReduction** ★v1.3
- **checkDeadlines** ★v1.3
- **aggregateReportData** ★v1.3
