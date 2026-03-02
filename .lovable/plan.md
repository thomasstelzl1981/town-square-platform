# Digitale Miet-Sonderverwaltung — Masterplan (TLC)

> **Version:** 1.2.0 | **Stand:** 2026-03-02
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
│        tenancy_handover_protocols (Übergabe) ★NEW       │
│        tenancy_meter_readings   (Zählerstände) ★NEW     │
│  Edge: sot-tenancy-lifecycle    (Weekly CRON + KI)      │
│  Hook: useLeaseLifecycle        (Client consumption)    │
│        useHandoverProtocol      ★NEW                    │
│        useDefectReport          ★NEW                    │
│        useMeterReadings         ★NEW                    │
│  Engine: src/engines/tenancyLifecycle/                   │
└─────────────────────────────────────────────────────────┘
```

---

## 30 Aufgabenfelder — Status & Zuordnung

| # | Aufgabenfeld | TLC-Phase | Engine/Komponente | IST % | ZIEL % | Prio |
|---|---|---|---|---|---|---|
| 01 | **Mietakte (Casefile/SSOT)** | ALLE | Immobilienakte (MOD-04) | 90 | 100 | ✅ |
| 02 | **DMS/Versionen/Vorlagen** | ALLE | DMS (MOD-03), StorageX | 90 | 100 | ✅ |
| 03 | **Rollen & Rechte (RBAC)** | ALLE | RLS, memberships | 60 | 90 | T2 |
| 04 | **Kommunikationshub** | LAUFEND | MOD-02 Email, MOD-14 | 40 | 80 | T2 |
| 05 | **Ticketing/Service Desk** | LAUFEND | tenancy_tasks + SLA/Triage | **60** | 70 | ✅ T2 |
| 06 | **Vermietung/Bewerbermanagement** | BEWERBUNG | applicant_profiles | 55 | 85 | T2 |
| 07 | **Besichtigungs- & Terminplanung** | BEWERBUNG | Google Calendar (MOD-02) | 30 | 70 | T2 |
| 08 | **Vertragsgenerator & E-Signatur** | VERTRAG | Briefgenerator + Google E-Sign | 40 | 80 | T3 |
| 09 | **Einzug/Übergabeprotokoll** | EINZUG | tenancy_handover_protocols + checklist | **65** | 70 | ✅ T2 |
| 10 | **Kündigung/Auszug/Rückgabe** | KÜNDIGUNG | TLC State Machine + move_out checklist | **65** | 80 | ✅ T2 |
| 11 | **Zahlungsmanagement/OP-Liste** | LAUFEND | ENG-KONTOMATCH, sot-rent-match | 85 | 95 | T1 ✅ |
| 12 | **Mahnwesen (Stufen/Zustellung)** | LAUFEND | tenancy_dunning_configs | **80** | 90 | T1 ✅ |
| 13 | **Ratenplan- & Rückstandsmanagement** | LAUFEND | TLC + ENG-KONTOMATCH | 20 | 80 | T2 |
| 14 | **Kaution (Anlage/Abrechnung)** | VERTRAG→AUSZUG | leases.deposit_* + TLC | **75** | 85 | T1 ✅ |
| 15 | **Nebenkosten/Betriebskosten** | LAUFEND | ENG-NK (vollständig) | 90 | 95 | ✅ |
| 16 | **Vorauszahlungsanpassung** | LAUFEND | ENG-NK + Briefgenerator | 30 | 80 | T2 |
| 17 | **Mängelmanagement/Instandhaltung** | LAUFEND | tenancy_tasks + triageDefect + SLA | **60** | 70 | ✅ T2 |
| 18 | **Dienstleistersteuerung** | LAUFEND | tenancy_tasks + contacts | 10 | 60 | T3 |
| 19 | **Rechnungsprüfung/Kostenstellen** | LAUFEND | property_expenses + ENG-BWA | 50 | 80 | T2 |
| 20 | **Schadenmanagement (Incident)** | LAUFEND | tenancy_tasks (damage) + useDefectReport | **60** | 70 | ✅ T2 |
| 21 | **Versicherungskoordination** | LAUFEND | MOD-11 Claims + TLC | 10 | 60 | T3 |
| 22 | **Mieterhöhungen (Index/Staffel)** | LAUFEND | ENG-TLC rent_increase check | **80** | 90 | T1 ✅ |
| 23 | **3-Jahres-Erhöhungscheck** | LAUFEND | ENG-TLC + Armstrong KI | **75** | 85 | T1 ✅ |
| 24 | **Mietminderung** | LAUFEND | leases + tenancy_lifecycle_events | 0 | 70 | T2 |
| 25 | **Owner-Cockpit/Dashboards** | ALLE | MOD-00 Dashboard Widgets | **80** | 95 | T1 ✅ |
| 26 | **Reporting/Exporte** | ALLE | PDF/CSV + Anlage V + BWA | 70 | 90 | T2 |
| 27 | **Audit-Trail/Ledger** | ALLE | tenancy_lifecycle_events | **70** | 90 | T1 ✅ |
| 28 | **Fristen- & Aufgabenmanagement** | ALLE | tenancy_tasks + TLC CRON + SLA | **65** | 85 | ✅ T2 |
| 29 | **Automations/Rules Engine** | ALLE | TLC State Machine + CRON | **50** | 80 | T1 ✅ |
| 30 | **KI-Assistenz (Max Power)** | ALLE | Armstrong + gemini-2.5-pro | 80 | 95 | T1 ✅ |

---

## Tier-1 Implementierung (ABGESCHLOSSEN ✅)

### 1. TLC Foundation
- [x] DB: `tenancy_lifecycle_events` Tabelle
- [x] DB: `tenancy_dunning_configs` Tabelle
- [x] DB: `tenancy_tasks` Tabelle (Tickets + Aufgaben)
- [x] Engine: `src/engines/tenancyLifecycle/spec.ts`
- [x] Engine: `src/engines/tenancyLifecycle/engine.ts`
- [x] Hook: `src/hooks/useLeaseLifecycle.ts`
- [x] Edge Function: `sot-tenancy-lifecycle` (Weekly CRON + KI)
- [x] CRON-Job registrieren (pg_cron + pg_net) — Sonntag 03:00 UTC
- [x] ENGINE_REGISTRY.md + GOLDEN_PATH_REGISTRY.md aktualisiert
- [x] Dashboard Widget (TLCWidget) — Ampel-Logik, Kategorien, Events

### 2. Mahnwesen (Feld 12)
- [x] Mahnstufen-Config Seed-Daten (5 Stufen für alle aktiven Tenants)
- [x] Automatische Mahnung via KI-generierte E-Mail (Level 0: auto_send)
- [x] Chronologie in `tenancy_lifecycle_events`
- [x] Mahngebühren pro Stufe (0/5/10/15 €)

### 3. Mieterhöhungs-Engine (Felder 22+23)
- [x] Sperrfristen-Prüfung (§558 BGB, 15 Monate)
- [x] Kappungsgrenze (20%/15% für angespannte Märkte)
- [x] Index-Trigger + Staffelstufe
- [x] 3-Jahres-Check (`performThreeYearCheck`)
- [x] Vorschlagslogik (konservativ/markt/max)

### 4. Kautionsverwaltung (Feld 14)
- [x] Kautionskonto-Tracking + Anomalie-Erkennung
- [x] Abrechnungs-Template (`calculateDepositSettlement`)
- [x] Zinsgutschrift (§551 BGB, 0.1% p.a.)
- [x] Auto-Task bei move_out

### 5. Dashboard & Armstrong (Feld 25+30)
- [x] TLCWidget mit Ampel-Logik
- [x] Armstrong Proactive Hints

---

## Tier-2 Implementierung (IN PROGRESS 🔧)

### Ticketing & Service Desk (Feld 5) ✅
- [x] tenancy_tasks mit SLA-Feldern (sla_hours, sla_deadline, escalation_level)
- [x] Defect severity assessment column
- [x] Photo attachment support
- [x] TLCWidget zeigt neue Kategorien (Einzug/Auszug/Zähler)

### Einzug/Auszug Workflows (Felder 9+10) ✅
- [x] DB: `tenancy_handover_protocols` Tabelle
- [x] DB: `tenancy_meter_readings` Tabelle
- [x] Spec: HandoverRoom, HandoverKeyItem, HandoverMeterReading Types
- [x] Spec: MOVE_IN_CHECKLIST_ITEMS (8 Items)
- [x] Spec: MOVE_OUT_CHECKLIST_ITEMS (10 Items)
- [x] Engine: `generateMoveChecklist()` + `checkMoveChecklistDeadlines()`
- [x] Hook: `useHandoverProtocol` (CRUD)
- [x] Hook: `useMeterReadings` (CRUD)

### Mängelmanagement (Felder 17+20) ✅
- [x] Spec: DefectSeverity + DEFECT_SLA_HOURS + DEFECT_TRIAGE_KEYWORDS
- [x] Engine: `triageDefect()` — Keyword-basierte Auto-Triage
- [x] Engine: `calculateSlaDeadline()`
- [x] Hook: `useDefectReport` — Creates task + lifecycle event

### Remaining Tier-2 (TODO)
- [ ] RBAC-Erweiterung (Feld 3)
- [ ] Kommunikationshub (Feld 4)
- [ ] Vermietung/Besichtigung (Felder 6+7)
- [ ] Ratenplan-Management (Feld 13)
- [ ] Vorauszahlungsanpassung (Feld 16)
- [ ] Mietminderung (Feld 24)
- [ ] Reporting/Exporte (Feld 26)
- [ ] Rechnungsprüfung (Feld 19)

---

## Tier-3 Implementierung (Langfristig)

### E-Signatur (Feld 8)
- [ ] Google E-Signature API Integration

### Dienstleistersteuerung (Feld 18)
- [ ] Angebotseinholung, Vergleich, Beauftragung

### Versicherungskoordination (Feld 21)
- [ ] Standardisierte Versicherer-Meldungen
- [ ] Regulierungs-Nachverfolgung
