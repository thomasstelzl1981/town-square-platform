# Digitale Miet-Sonderverwaltung — Masterplan (TLC)

> **Version:** 1.0.0 | **Stand:** 2026-03-02
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
│  Edge: sot-tenancy-lifecycle    (Weekly CRON + KI)      │
│  Hook: useLeaseLifecycle        (Client consumption)    │
│  Engine: src/engines/tenancyLifecycle/                   │
└─────────────────────────────────────────────────────────┘
```

---

## 30 Aufgabenfelder — Status & Zuordnung

| # | Aufgabenfeld | TLC-Phase | Engine/Komponente | IST % | ZIEL % | Prio |
|---|---|---|---|---|---|---|
| 01 | **Mietakte (Casefile/SSOT)** | ALLE | Immobilienakte (MOD-04) | 90 | 100 | ✅ |
| 02 | **DMS/Versionen/Vorlagen** | ALLE | DMS (MOD-03), StorageX | 90 | 100 | ✅ |
| 03 | **Rollen & Rechte (RBAC)** | ALLE | RLS, org_memberships | 60 | 90 | T2 |
| 04 | **Kommunikationshub** | LAUFEND | MOD-02 Email, MOD-14 | 40 | 80 | T2 |
| 05 | **Ticketing/Service Desk** | LAUFEND | tenancy_tasks (NEU) | 0 | 70 | T1 |
| 06 | **Vermietung/Bewerbermanagement** | BEWERBUNG | applicant_profiles | 55 | 85 | T2 |
| 07 | **Besichtigungs- & Terminplanung** | BEWERBUNG | Google Calendar (MOD-02) | 30 | 70 | T2 |
| 08 | **Vertragsgenerator & E-Signatur** | VERTRAG | Briefgenerator + Google E-Sign | 40 | 80 | T3 |
| 09 | **Einzug/Übergabeprotokoll** | EINZUG | tenancy_tasks + DMS | 15 | 70 | T2 |
| 10 | **Kündigung/Auszug/Rückgabe** | KÜNDIGUNG | TLC State Machine | 15 | 80 | T2 |
| 11 | **Zahlungsmanagement/OP-Liste** | LAUFEND | ENG-KONTOMATCH, sot-rent-match | 85 | 95 | T1 |
| 12 | **Mahnwesen (Stufen/Zustellung)** | LAUFEND | tenancy_dunning_configs (NEU) | 25 | 90 | T1 |
| 13 | **Ratenplan- & Rückstandsmanagement** | LAUFEND | TLC + ENG-KONTOMATCH | 20 | 80 | T2 |
| 14 | **Kaution (Anlage/Abrechnung)** | VERTRAG→AUSZUG | leases.deposit_* + TLC | 20 | 85 | T1 |
| 15 | **Nebenkosten/Betriebskosten** | LAUFEND | ENG-NK (vollständig) | 90 | 95 | ✅ |
| 16 | **Vorauszahlungsanpassung** | LAUFEND | ENG-NK + Briefgenerator | 30 | 80 | T2 |
| 17 | **Mängelmanagement/Instandhaltung** | LAUFEND | tenancy_tasks (ticket_type: defect) | 10 | 70 | T2 |
| 18 | **Dienstleistersteuerung** | LAUFEND | tenancy_tasks + contacts | 10 | 60 | T3 |
| 19 | **Rechnungsprüfung/Kostenstellen** | LAUFEND | property_expenses + ENG-BWA | 50 | 80 | T2 |
| 20 | **Schadenmanagement (Incident)** | LAUFEND | tenancy_tasks (ticket_type: damage) | 10 | 70 | T2 |
| 21 | **Versicherungskoordination** | LAUFEND | MOD-11 Claims + TLC | 10 | 60 | T3 |
| 22 | **Mieterhöhungen (Index/Staffel)** | LAUFEND | ENG-TLC rent_increase check | 40 | 90 | T1 |
| 23 | **3-Jahres-Erhöhungscheck** | LAUFEND | ENG-TLC + Armstrong KI | 0 | 85 | T1 |
| 24 | **Mietminderung** | LAUFEND | leases + tenancy_lifecycle_events | 0 | 70 | T2 |
| 25 | **Owner-Cockpit/Dashboards** | ALLE | MOD-00 Dashboard Widgets | 75 | 95 | T1 |
| 26 | **Reporting/Exporte** | ALLE | PDF/CSV + Anlage V + BWA | 70 | 90 | T2 |
| 27 | **Audit-Trail/Ledger** | ALLE | tenancy_lifecycle_events | 30 | 90 | T1 |
| 28 | **Fristen- & Aufgabenmanagement** | ALLE | tenancy_tasks + TLC CRON | 10 | 85 | T1 |
| 29 | **Automations/Rules Engine** | ALLE | TLC State Machine + CRON | 0 | 80 | T1 |
| 30 | **KI-Assistenz (Max Power)** | ALLE | Armstrong + gemini-2.5-pro | 80 | 95 | T1 |

---

## Tier-1 Implementierung (Sofort — Sprint S6)

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
- [ ] Mahnstufen-Config Seed-Daten
- [ ] Automatische Mahnung via `sot-mail-send`
- [ ] Chronologie in `tenancy_lifecycle_events`

### 3. Mieterhöhungs-Engine (Felder 22+23)
- [ ] Sperrfristen-Prüfung (§558 BGB, 15 Monate)
- [ ] Kappungsgrenze (20%/15%)
- [ ] Index-Trigger bei VPI-Änderung
- [ ] 3-Jahres-Check pro Einheit
- [ ] Vorschlagslogik (konservativ/markt/max)

### 4. Kautionsverwaltung (Feld 14)
- [ ] Kautionskonto-Tracking erweitern
- [ ] Abrechnungs-Template bei Auszug
- [ ] Zinsgutschrift-Berechnung

### 5. Dashboard-Widget (Feld 25)
- [ ] "Offene Aufgaben pro Mietverhältnis" Widget
- [ ] Fälligkeits-Ampel (grün/gelb/rot)
- [ ] Armstrong Proactive Hints aus TLC-Events

---

## Tier-2 Implementierung (Mittelfristig)

### Ticketing & Service Desk (Feld 5)
- [ ] tenancy_tasks als Ticket-System
- [ ] Auto-Kategorisierung via Armstrong KI
- [ ] SLA-Timer, Eskalationspfade

### Einzug/Auszug Workflows (Felder 9+10)
- [ ] Digitales Übergabeprotokoll (Fotos, Checkliste)
- [ ] Zählerstand-Workflow
- [ ] Kautionsabrechnung bei Auszug

### Vermietung & Besichtigung (Felder 6+7)
- [ ] Bewerberstrecke (Portal-UI)
- [ ] Google Calendar Integration für Besichtigungen

### Mängelmanagement (Felder 17+20)
- [ ] Mängelmeldung via Portal (Foto/Video)
- [ ] Triage-Logik (Notfall/Standard)
- [ ] Schadenfall-Akte

---

## Tier-3 Implementierung (Langfristig)

### E-Signatur (Feld 8)
- [ ] Google E-Signature API Integration

### Dienstleistersteuerung (Feld 18)
- [ ] Angebotseinholung, Vergleich, Beauftragung

### Versicherungskoordination (Feld 21)
- [ ] Standardisierte Versicherer-Meldungen
- [ ] Regulierungs-Nachverfolgung
