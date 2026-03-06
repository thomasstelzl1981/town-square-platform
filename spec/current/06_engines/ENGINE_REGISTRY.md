# ENGINE REGISTRY — Single Source of Truth (SSOT)

> Version 1.0 | Stand: 2026-02-18 | Maintainer: Zone 1 Governance

---

## Fuer Menschen: Was machen unsere Engines?

| # | Engine | Was macht sie? | Wo im Portal? | Kosten |
|---|--------|---------------|---------------|--------|
| 1 | **Akquise-Kalkulation** | Berechnet ob sich ein Immobilienkauf lohnt (Halten oder Aufteilen) | Immobilien · Akquise | Free |
| 2 | **Finanzierungs-Engine** | Prueft ob der Kunde sich die Finanzierung leisten kann | Finanzierung · Beratung | Free |
| 3 | **Provisions-Engine** | Berechnet Provisionen fuer Kaeufer, Verkaeufer und Partner | Vertrieb | Free |
| 4 | **Bewirtschaftungs-Engine** | Erstellt die Bewirtschaftungsanalyse (BWA/NOI) einer Immobilie | Immobilien | Free |
| 5 | **Projekt-Kalkulation** | Kalkuliert Bautraeger-Projekte mit Margen und Einheitspreisen | Projekte | Free |
| 6 | **NK-Abrechnungs-Engine** | Erstellt gesetzeskonforme Nebenkostenabrechnungen (BetrKV) | Immobilien | Free |
| 7 | **Finanzuebersicht-Engine** | Aggregiert das gesamte Portfolio in einer 40-Jahres-Projektion | Finanzuebersicht | Free |
| 8 | **Vorsorgeluecke-Rechner** | Berechnet Renten- und BU-Luecke fuer die Altersvorsorge | Beratung | Free |
| 9 | **V+V Steuer-Engine** | Erstellt die Anlage V fuer die Steuererklaerung | Immobilien | Free |
| 10 | **Document Intelligence** | Liest PDFs aus und extrahiert strukturierte Daten per KI | Ueberall (Datei-Upload) | 1 Credit/PDF |
| 11 | **Research Engine (SOAT)** | Recherchiert Marktdaten und Standortanalysen | Akquise · Beratung | 2-4 Credits/Run |
| 12 | **Armstrong KI-Copilot** | Der KI-Assistent — beantwortet Fragen, fuehrt Aktionen aus | Ueberall (Copilot-Panel) | 0-12 Credits/Action |
| 13 | **File Intelligence** | Analysiert hochgeladene Dateien im Kontext der Akte | Dateimanager | 1 Credit/Research |
| 14 | **Demo-Daten Engine** | Erzeugt realistische Beispieldaten fuer neue Mandanten | Onboarding | Free |
| 15 | **Golden Path Engine** | Fuehrt Nutzer Schritt fuer Schritt durch komplexe Workflows | Ueberall (Guided Tours) | Free |
| 16 | **Storage Extraction** | Macht den gesamten Datenraum fuer Armstrong durchsuchbar (Bulk) | Dateimanager · Armstrong | 1 Credit/Doc |
| 17 | **Konto-Matching Engine** | Ordnet Kontobewegungen automatisch Immobilien, PV-Anlagen und Vertraegen zu | Konten · Immobilien · PV | Free |
| 18 | **KI-Browser Engine** | Armstrong navigiert kontrolliert im Web, extrahiert und belegt Inhalte | KI-Browser (MOD-21) | 1-4 Credits/Session |
| 19 | **Trip Engine** | Erkennt Fahrten aus GPS/Telematics-Daten fuer das Fahrtenbuch | Fahrzeuge (MOD-17) | Free |
| 20 | **Valuation Engine** | KI-gestuetzte Immobilienbewertung mit deterministischem Rechenkern, Google-Standort, Portal-Comps | MOD-04, MOD-12, MOD-13 | 20 Credits/Case |

---

## Technische Registry

### Kalkulation (10 Engines)

Alle Kalkulationsengines sind **pure TypeScript Functions**, laufen **client-side** und sind **kostenlos**.

| Code | Name | Modul | Status | Dateipfade |
|------|------|-------|--------|-----------|
| ENG-AKQUISE | Akquise-Kalkulation | MOD-04, MOD-12 | ✅ Live | `src/engines/akquiseCalc/spec.ts`, `engine.ts` |
| ENG-FINANCE | Finanzierungs-Engine | MOD-07, MOD-11 | ✅ Live | `src/engines/finanzierung/spec.ts`, `engine.ts` |
| ENG-PROVISION | Provisions-Engine | MOD-09 | ✅ Live | `src/engines/provision/spec.ts`, `engine.ts` |
| ENG-BWA | Bewirtschaftungs-Engine | MOD-04 | ✅ Live | `src/engines/bewirtschaftung/spec.ts`, `engine.ts` |
| ENG-PROJEKT | Projekt-Kalkulation | MOD-13 | ✅ Live | `src/engines/projektCalc/spec.ts`, `engine.ts` |
| ENG-NK | NK-Abrechnungs-Engine | MOD-04 | ✅ Live | `src/engines/nkAbrechnung/` |
| ENG-FINUEB | Finanzuebersicht-Engine | MOD-18 | ✅ Live | `src/engines/finanzuebersicht/spec.ts`, `engine.ts` |
| ENG-VORSORGE | Vorsorgeluecke-Rechner | MOD-08 | ✅ Live | `src/engines/vorsorgeluecke/spec.ts`, `engine.ts` |
| ENG-VVSTEUER | V+V Steuer-Engine | MOD-04 | ✅ Live | `src/engines/vvSteuer/spec.ts` |
| ENG-KONTOMATCH | Konto-Matching Engine | MOD-04, MOD-18, MOD-19 | ⚡ Teilweise | `src/engines/kontoMatch/spec.ts`, `engine.ts`, `recurring.ts` |
| ENG-MKTDIR | Market Directory Engine | Zone 1 | ✅ Live | `src/engines/marketDirectory/spec.ts`, `engine.ts` |
| ENG-TRIP | Trip Engine (Fahrtenbuch) | MOD-17 | ⚡ Teilweise | `src/engines/tripEngine/spec.ts`, `engine.ts` |
| ENG-TLC | Tenancy Lifecycle Controller | MOD-04, MOD-00 | ✅ Live | `src/engines/tenancyLifecycle/spec.ts`, `engine.ts` |
| ENG-SLC | Sales Lifecycle Controller | MOD-04, MOD-06, MOD-13 | ⚡ Teilweise | `src/engines/slc/spec.ts`, `engine.ts` |
| ENG-FLC | Financing Lifecycle Controller | MOD-07, MOD-11, Z1 Finance | ⚡ Teilweise | `src/engines/flc/spec.ts`, `engine.ts`, `conventions.ts` |
| ENG-FDC | Finance Data Controller | MOD-18, MOD-20, MOD-04 | ✅ Live | `src/engines/fdc/spec.ts`, `engine.ts`, `conventions.ts` |
| ENG-PLC | Pet Service Lifecycle Controller | MOD-22, MOD-05, Z3, Z1 | ⚡ Teilweise | `src/engines/plc/spec.ts`, `engine.ts` |
| ENG-VALUATION | SoT Valuation Engine | MOD-04, MOD-12, MOD-13 | 🔲 Geplant | `src/engines/valuation/spec.ts`, `engine.ts` |

### Orchestrierung (4 Engines)

| Code | Name | Status | Billing | Ausfuehrung |
|------|------|--------|---------|-------------|
| ENG-TLC | Tenancy Lifecycle Controller | ✅ Live | Free + KI (1 Credit/Run) | Edge Function (`sot-tenancy-lifecycle`, Weekly CRON Sun 03:00 UTC) + Client Engine |
| ENG-SLC | Sales Lifecycle Controller | ⚡ Teilweise | Free | Client Engine (Phase-Tracking, Drift-Detection, Stuck-Detection) |
| ENG-FLC | Financing Lifecycle Controller | ⚡ Teilweise | Free | Client Engine (14-Phasen State Machine, 7 Quality Gates) + Edge Function (`sot-flc-lifecycle`, Daily CRON) + `sot-finance-manager-notify` |
| ENG-PLC | Pet Service Lifecycle Controller | ⚡ Teilweise | Free | Client Engine (Marketplace Phase-Tracking, Deposit-Calculation, Stuck-Detection) |

> **ENG-FLC** orchestriert Finanzierungsfaelle von Z3-Intake ueber Z1-Zuweisung bis MOD-11-Bearbeitung. 14 Phasen (INTAKE_RECEIVED → PLATFORM_FEE_PAID), 7 Quality Gates, SLA-Ueberwachung (48h Intake, 72h Manager-Annahme), idempotente E-Mail-Benachrichtigung, 25% Plattformanteil-Erzwingung.

> **ENG-TLC** ist der uebergeordnete Orchestrator fuer alle Mietverhaeltnisse. Er prueft woechentlich: Zahlungsstatus, Mahnstufen, Mieterhoehungs-Berechtigung (§558 BGB), Kautionsstatus, Fristen und generiert KI-gestuetzte Next-Best-Actions via `google/gemini-2.5-pro`.

### Daten (4 Engines)

| Code | Name | Status | Billing | Ausfuehrung |
|------|------|--------|---------|-------------|
| ENG-DOCINT | Document Intelligence v3 | ✅ Live | 1 Credit/PDF | Edge Function (`sot-document-parser` + `_shared/tabular-parser`) |
| ENG-RESEARCH | Research Engine (SOAT) | ⚡ Teilweise | 2-4 Credits/Run | Edge Function (`sot-research-*`) |
| ENG-STOREX | Storage Extraction | ⚡ Teilweise | 1 Credit/Doc | Edge Function (`sot-storage-extractor`) |
| ENG-KIBROWSER | KI-Browser Engine | 🔲 Geplant | 1-4 Credits/Session | Edge Function (`sot-ki-browser`) |

### KI (2 Engines)

| Code | Name | Status | Billing | Ausfuehrung |
|------|------|--------|---------|-------------|
| ENG-ARMSTRONG | Armstrong KI-Copilot | ✅ Live | 0-12 Credits/Action | Edge Function (`sot-armstrong-*`) |
| ENG-FILEINTEL | File Intelligence | ⚡ Teilweise | 1 Credit/Research | Edge Function (`sot-file-intel`) |

### Infrastruktur (2 Engines)

| Code | Name | Status | Billing | Ausfuehrung |
|------|------|--------|---------|-------------|
| ENG-DEMO | Demo-Daten Engine | ✅ Live | Free | Client + Edge Function |
| ENG-GOLDEN | Golden Path Engine | ⚡ Teilweise | Free | Client-side |

---

## Governance-Regeln

### GR-1: Pure Functions (Kalkulation)
Alle 9 Kalkulationsengines MUESSEN als pure TypeScript Functions implementiert sein:
- Keine Seiteneffekte, keine DB-Aufrufe
- Deterministische Ergebnisse bei gleichen Inputs
- Exportiert ueber `src/engines/index.ts`

### GR-2: Tenant-Scope (Daten/KI)
Alle Engines die auf Mandantendaten zugreifen MUESSEN den `tenant_id` als Parameter erhalten und RLS-konform arbeiten.

### GR-3: Credit-Preflight (Kostenpflichtige Engines)
Vor jeder kostenpflichtigen Engine-Ausfuehrung MUSS ein Credit-Check via `sot-credit-preflight` erfolgen:
1. Pruefen ob genuegend Credits vorhanden
2. Credits reservieren (PENDING)
3. Engine ausfuehren
4. Credits abbuchen oder freigeben

### GR-4: Versionierung
Jede Engine hat eine `engineVersion` die in `armstrong_action_runs.engine_version` geloggt wird.

---

## Status-Legende

| Symbol | Bedeutung |
|--------|-----------|
| ✅ Live | Vollstaendig implementiert und produktiv |
| ⚡ Teilweise | Grundfunktion vorhanden, Erweiterungen geplant |
| 🔲 Geplant | Spezifiziert aber noch nicht implementiert |

---

## Changelog

| Datum | Aenderung |
|-------|-----------|
| 2026-02-25 | v1.1 — ENG-DOCINT auf v3 aktualisiert: Universeller Parser mit XLSX/CSV/PDF-Support via `_shared/tabular-parser.ts`. `sot-pdf-to-csv` entfernt (Logik in `sot-document-parser` konsolidiert). Upload-Sanitization systemweit homogenisiert (`sanitizeFileName` + `UPLOAD_BUCKET`). |
| 2026-02-18 | v1.0 — Initiale Konsolidierung aller 15 Engines aus UI-Registry und Code-Specs |
| 2026-02-28 | v1.2 — ENG-TRIP (Trip Engine) fuer MOD-17 Fahrtenbuch hinzugefuegt. Pure TS Functions fuer Fahrterkennung aus GPS/Telematics (Standard A + B). |
| 2026-03-02 | v1.3 — ENG-TLC (Tenancy Lifecycle Controller) hinzugefuegt. Orchestrator fuer Miet-Sonderverwaltung: Weekly CRON, State Machine (7 Phasen), Mahnwesen, Mieterhoehungs-Checks, KI-Summary. DB: tenancy_lifecycle_events, tenancy_dunning_configs, tenancy_tasks. |
| 2026-03-02 | v1.4 — ENG-SLC (Sales Lifecycle Controller) hinzugefuegt. Cross-Module Event-Layer fuer Verkaufsabwicklung: 11-Phasen State Machine, Drift-Detection, Stuck-Detection. DB: sales_cases, sales_lifecycle_events. |
| 2026-03-02 | v1.5 — ENG-TLC + ENG-SLC in ArmstrongEngines.tsx als Orchestrierungs-Kategorie registriert. GP-VERKAUF Golden Path (11 Steps) mit Context Resolver und 17 Ledger-Events erstellt. Property Desk (Zone 1) für TLC-Governance implementiert. |
| 2026-03-02 | v1.6 — ENG-FDC (Finance Data Controller) hinzugefuegt. DSGVO-konformes Governance Backbone fuer MOD-18: Registry (72 Objekte), Link Graph, Repair Actions. 12 Integritaetsregeln, Coverage Scoring, Patrol Cron (sot-fdc-patrol). |
| 2026-03-02 | v1.7 — ENG-PLC (Pet Service Lifecycle Controller) hinzugefuegt. Marktplatz-Modell fuer Pet Services: 11-Phasen State Machine, 7.5% nicht-erstattbare Plattformgebuehr (Deposit), Stripe-Integration, Stuck-Detection. DB: pet_service_cases, pet_lifecycle_events. |
| 2026-03-06 | v1.8 — ENG-VALUATION (SoT Valuation Engine) hinzugefuegt. Ersetzt Sprengnetter + GeoMap komplett. 6-Stage Pipeline (Preflight, Intake, Norm+Location, Comps, Calc, Report). Deterministischer Kern (Ertrag/Comp-Proxy/Sachwert). Google Maps (Geocode/Places/Routes/Static), Portal-Comps via Scraper. 12-Seiten PDF. 20 Credits/Case. DB: valuation_cases, valuation_inputs, valuation_results, valuation_reports. |
