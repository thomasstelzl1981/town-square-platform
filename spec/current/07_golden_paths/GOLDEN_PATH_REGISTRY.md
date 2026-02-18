# Golden Path Registry — SSOT

> **Stand:** 2026-02-18 | **Version:** 1.0  
> **Pfad:** `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md`  
> **Zone-1-UI:** `/admin/armstrong/golden-paths`

---

## Fuer Menschen — Was macht jeder Golden Path?

| Prozess | Modul | Was passiert? | Wo im Portal? | Zonen-Fluss |
|---------|-------|--------------|---------------|-------------|
| Immobilien-Portfolio | MOD-04 | Vermietereinheiten + Portfoliokennzahlen | Portal > Immobilien > Portfolio | Z2 |
| BWA / Controlling | MOD-04 | Betriebswirtschaftliche Auswertung | Portal > Immobilien > Verwaltung | Z2 |
| Sanierungsauftrag | MOD-04 | LV erstellen, Dienstleister beauftragen | Portal > Immobilien > Sanierung | Z2 |
| Finanzierungsanfrage | MOD-07 | Kunde reicht Finanzierung ein | Portal > Finanzierung | Z2 → Z1 → Z2 |
| Investment-Suchmandat | MOD-08 | Suchmandat fuer Akquise anlegen | Portal > Investments > Mandat | Z2 → Z1 → Z2 |
| Investment-Simulation | MOD-08 | Portfolio simulieren (40 Jahre) | Portal > Investments > Simulation | Z2 |
| Finanzierungsfall | MOD-11 | §34i-Manager: Intake bis Auszahlung | Portal > Finanzierungsmanager | Z2 → Z1 |
| Akquisemandat | MOD-12 | Suchmandante als Akquisemanager | Portal > Akquise-Manager | Z2 → Z1 |
| Projektanlage | MOD-13 | Bauprojekte + Einheiten + Vertrieb | Portal > Projekte | Z2 → Z1 |
| Serien-E-Mail | MOD-14 | Automatisierte E-Mail-Sequenzen | Portal > Communication Pro > Serien | Z2 |
| Rechercheauftrag | MOD-14 | Lead-Recherche via SOAT-Engine | Portal > Communication Pro > Recherche | Z2 |
| Fahrzeugverwaltung | MOD-17 | Fahrzeuge, Leasing, Versicherung | Portal > Cars > Fahrzeuge | Z2 |
| Kontoverwaltung | MOD-18 | Bankkonten + Kontobewegungen | Portal > Finanzanalyse | Z2 |
| PV-Anlagenanlage | MOD-19 | PV-Anlagen + Ertragsmonitoring | Portal > Photovoltaik | Z2 |
| Zuhause-Verwaltung | MOD-20 | Wohnung/Haus + Versorgungsvertraege | Portal > Immobilien > Zuhause | Z2 |
| Tierverwaltung | MOD-05 | Haustiere + Pflege + Services | Portal > Pets | Z2 |
| Pet Manager Demo | MOD-22 | Kunden, Tiere, Buchungen (Demo) | Portal > Pet Manager | Z3 → Z1 → Z2 |

---

## A) Portal-Prozesse (17)

> Quelle: `src/manifests/goldenPathProcesses.ts`

| ID | Modul | Prozess | Phase | Compliance | Route |
|----|-------|---------|-------|------------|-------|
| GP-PORTFOLIO | MOD-04 | Immobilien-Portfolio | done | 6/6 | `/portal/immobilien/portfolio` |
| GP-VERWALTUNG | MOD-04 | BWA / Controlling | done | 6/6 | `/portal/immobilien/verwaltung` |
| GP-SANIERUNG | MOD-04 | Sanierungsauftrag | done | 6/6 | `/portal/immobilien/sanierung` |
| GP-FINANZIERUNG | MOD-07 | Finanzierungsanfrage | done | 6/6 | `/portal/finanzierung/anfrage` |
| GP-SUCHMANDAT | MOD-08 | Investment-Suchmandat | done | 6/6 | `/portal/investments/mandat` |
| GP-SIMULATION | MOD-08 | Investment-Simulation | done | 4/6 | `/portal/investments/simulation` |
| GP-FM-FALL | MOD-11 | Finanzierungsfall | done | 6/6 | `/portal/finanzierungsmanager` |
| GP-AKQUISE-MANDAT | MOD-12 | Akquisemandat | done | 6/6 | `/portal/akquise-manager` |
| GP-PROJEKT | MOD-13 | Projektanlage | done | 6/6 | `/portal/projekte` |
| GP-SERIEN-EMAIL | MOD-14 | Serien-E-Mail-Kampagne | done | 6/6 | `/portal/communication-pro/serien-emails` |
| GP-RECHERCHE | MOD-14 | Rechercheauftrag | done | 6/6 | `/portal/communication-pro/recherche` |
| GP-FAHRZEUG | MOD-17 | Fahrzeugverwaltung | done | 6/6 | `/portal/cars/fahrzeuge` |
| GP-KONTEN | MOD-18 | Kontoverwaltung | done | 6/6 | `/portal/finanzanalyse/dashboard` |
| GP-PV-ANLAGE | MOD-19 | PV-Anlagenanlage | done | 6/6 | `/portal/photovoltaik/anlagen` |
| GP-ZUHAUSE | MOD-20 | Zuhause-Verwaltung | done | 6/6 | `/portal/immobilien/zuhause` |
| GP-PETS | MOD-05 | Tierverwaltung | Phase 1 | 6/6 | `/portal/pets/meine-tiere` |
| GP-PET | MOD-22 | Pet Manager Demo | Phase 1 | 3/6 | `/portal/petmanager` |

### Compliance-Checkliste (Design Manifest V4.0)

Jeder Portal-Prozess wird gegen 6 Kriterien geprueft:

1. **ModulePageHeader** — CI-konformer Seitentitel
2. **WidgetGrid** — Karten-Grid (max 4 Spalten)
3. **WidgetCell** — Standard-Dimensionen pro Karte
4. **DemoWidget** — Hardcoded Demo an Position 0
5. **InlineFlow** — Detail-Sektionen vertikal scrollbar
6. **NoSubNavigation** — Keine Tabs, kein Sub-Routing

---

## B) Engine-Workflows (8)

> Quelle: `src/manifests/goldenPaths/index.ts` + Einzeldateien

| Key | Workflow | Schritte | Zonen | Fail-States | Camunda-ready |
|-----|----------|----------|-------|-------------|---------------|
| MOD-04 | Immobilien-Zyklus | 10 | Z2 → Z1 → Z2 | ✅ | ✅ |
| MOD-07 | Finanzierung | 5 | Z2 → Z1 → Z2 | ✅ | ✅ |
| MOD-08 | Investment/Akquise | 7 | Z2 → Z1 → Z2 | ✅ | ✅ |
| MOD-13 | Projekte | 5 | Z2 → Z1 | ✅ | ✅ |
| GP-VERMIETUNG | Vermietungszyklus | 5 | Z1 → Z3 | ✅ | ✅ |
| GP-LEAD | Lead-Generierung | 4 | Z3 → Z1 → Z2 | ✅ | ✅ |
| GP-FINANCE-Z3 | Zone-3-Finanzierung | 7 | Z3 → Z1 → Z2 | ✅ | ✅ |
| GP-PET | Pet Manager Lifecycle | 7 | Z3 → Z1 → Z2 | ✅ | ✅ |

### Workflow-Architektur

Jeder Engine-Workflow besteht aus:

- **Phasen** mit `required_entities` und `required_contracts`
- **Steps** mit `step_type` (user_task, service_task, wait_message)
- **Fail-States** fuer Cross-Zone-Steps (on_timeout, on_rejected, on_error)
- **Ledger-Events** registriert in `LEDGER_EVENT_WHITELIST`
- **Success-State** als Endzustand

---

## Governance-Regeln

| Code | Regel | Gilt fuer |
|------|-------|-----------|
| GP-GR-1 | Jeder Workflow MUSS Fail-States fuer Cross-Zone-Steps definieren | Engine-Workflows |
| GP-GR-2 | Alle Events MUESSEN in der `LEDGER_EVENT_WHITELIST` registriert sein | Engine-Workflows |
| GP-GR-3 | Demo-Widget an Position 0 in jedem Portal-Prozess (id: `__demo__`) | Portal-Prozesse |
| GP-GR-4 | Compliance 6/6 fuer Done-Status | Portal-Prozesse |

---

## Dateipfade

### Portal-Prozesse
- Registry: `src/manifests/goldenPathProcesses.ts`
- Helper: `getProcessById()`, `getProcessesByModule()`, `getCompliantProcesses()`

### Engine-Workflows
- Registry: `src/manifests/goldenPaths/index.ts`
- Definitionen: `src/manifests/goldenPaths/MOD_04.ts`, `MOD_07_11.ts`, `MOD_08_12.ts`, `MOD_13.ts`, `GP_VERMIETUNG.ts`, `GP_LEAD.ts`, `GP_FINANCE_Z3.ts`, `GP_PET.ts`
- Engine: `src/goldenpath/engine.ts`
- Hook: `src/goldenpath/useGoldenPath.ts`
- Guard: `src/goldenpath/GoldenPathGuard.tsx`
- Validator: `src/goldenpath/devValidator.ts`

### Ledger-Events
- Whitelist: `LEDGER_EVENT_WHITELIST` in `src/manifests/goldenPaths/index.ts`
- Aktuell ~80 registrierte Events (inkl. Fail-States und DSGVO-Events)

---

## Changelog

| Version | Datum | Aenderung |
|---------|-------|-----------|
| 1.0 | 2026-02-18 | Initiale Konsolidierung: 17 Portal-Prozesse + 8 Engine-Workflows |
