

# Engine-Audit: Vollständige Systemübersicht

## Befund

Die `ENGINE_REGISTRY.md` (v1.8) ist weitgehend aktuell mit **20 Engines**, aber es gibt **1 fehlenden Eintrag**: **ENG-FLC** (Financing Lifecycle Controller) existiert im Code (`src/engines/flc/`) mit `spec.ts`, `engine.ts`, `conventions.ts` und wird aus `src/engines/index.ts` exportiert — fehlt aber komplett in der Registry.

## Ist-Zustand: Alle 21 Engines im Code

### Kalkulations-Engines (client-side, pure TS, kostenlos)

| # | Code | Name | Pfad | In Registry? | In Freeze? | Status |
|---|------|------|------|-------------|-----------|--------|
| 1 | ENG-AKQUISE | Akquise-Kalkulation | `src/engines/akquiseCalc/` | ✅ | frozen | Live |
| 2 | ENG-FINANCE | Finanzierungs-Engine | `src/engines/finanzierung/` | ✅ | frozen | Live |
| 3 | ENG-PROVISION | Provisions-Engine | `src/engines/provision/` | ✅ | frozen | Live |
| 4 | ENG-BWA | Bewirtschaftungs-Engine | `src/engines/bewirtschaftung/` | ✅ | frozen | Live |
| 5 | ENG-PROJEKT | Projekt-Kalkulation | `src/engines/projektCalc/` | ✅ | frozen | Live |
| 6 | ENG-NK | NK-Abrechnung | `src/engines/nkAbrechnung/` | ✅ | frozen | Live |
| 7 | ENG-FINUEB | Finanzübersicht | `src/engines/finanzuebersicht/` | ✅ | frozen | Live |
| 8 | ENG-VORSORGE | Vorsorgelücke | `src/engines/vorsorgeluecke/` | ✅ | frozen | Live |
| 9 | ENG-VVSTEUER | V+V Steuer | `src/engines/vvSteuer/` | ✅ | frozen | Live |
| 10 | ENG-KONTOMATCH | Konto-Matching | `src/engines/kontoMatch/` | ✅ | frozen | Teilweise |
| 11 | ENG-MKTDIR | Market Directory | `src/engines/marketDirectory/` | ✅ | frozen | Live |
| 12 | ENG-TRIP | Trip Engine | `src/engines/tripEngine/` | ✅ | — | Teilweise |

### Orchestrierungs-/Lifecycle-Controller (client-side + Edge Functions)

| # | Code | Name | Pfad | In Registry? | In Freeze? | Status |
|---|------|------|------|-------------|-----------|--------|
| 13 | ENG-TLC | Tenancy Lifecycle | `src/engines/tenancyLifecycle/` | ✅ | — | Live |
| 14 | ENG-SLC | Sales Lifecycle | `src/engines/slc/` | ✅ | frozen | Teilweise |
| 15 | ENG-FLC | **Financing Lifecycle** | `src/engines/flc/` | ❌ **FEHLT** | — | Teilweise |
| 16 | ENG-FDC | Finance Data Controller | `src/engines/fdc/` | ✅ | frozen | Live |
| 17 | ENG-PLC | Pet Service Lifecycle | `src/engines/plc/` | ✅ | frozen | Teilweise |

### Valuation (hybrid: client calc + Edge Function)

| # | Code | Name | Pfad | In Registry? | In Freeze? | Status |
|---|------|------|------|-------------|-----------|--------|
| 18 | ENG-VALUATION | SoT Valuation Engine | `src/engines/valuation/` | ✅ | **nicht frozen** | Aktive Entwicklung |

### Shared

| # | Code | Pfad | Beschreibung |
|---|------|------|-------------|
| — | (shared) | `src/engines/shared/controllerConventions.ts` | Gemeinsame Controller-Konventionen (TLC/SLC/FLC/FDC/PLC) |

### Daten-/KI-/Infrastruktur-Engines (Edge Functions, NICHT in `src/engines/`)

| # | Code | Name | In Registry? |
|---|------|------|-------------|
| 19 | ENG-DOCINT | Document Intelligence v3 | ✅ |
| 20 | ENG-RESEARCH | Research Engine (SOAT) | ✅ |
| 21 | ENG-STOREX | Storage Extraction | ✅ |
| 22 | ENG-KIBROWSER | KI-Browser Engine | ✅ (geplant) |
| 23 | ENG-ARMSTRONG | Armstrong KI-Copilot | ✅ |
| 24 | ENG-FILEINTEL | File Intelligence | ✅ |
| 25 | ENG-DEMO | Demo-Daten Engine | ✅ |
| 26 | ENG-GOLDEN | Golden Path Engine | ✅ |

**Gesamt: 26 Engine-Codes** (18 mit Client-Code in `src/engines/`, 8 als Edge Functions / Infrastruktur)

---

## Handlungsbedarf

### 1. ENG-FLC in Registry nachtragen
Die Financing Lifecycle Controller Engine (`src/engines/flc/`) mit 3 Dateien (spec.ts v1.1.0, engine.ts, conventions.ts) fehlt komplett in `ENGINE_REGISTRY.md`. Sie muss als Orchestrierungs-Engine mit Scope MOD-07, MOD-11, Zone 1 Finance Desk aufgenommen werden.

### 2. ENG-FLC in Freeze-Datei nachtragen
`engines_freeze.json` hat keinen Eintrag für ENG-FLC. Da alle anderen Controller (TLC, SLC, FDC, PLC) frozen sind, sollte ENG-FLC ebenfalls dort registriert werden.

### 3. ENG-TRIP + ENG-TLC in Freeze-Datei prüfen
Diese beiden Engines haben keinen Freeze-Eintrag. Das kann gewollt sein (aktive Entwicklung), sollte aber dokumentiert werden.

### 4. Externe Dokumentation aktualisieren
Die Dokumentation, die der User extern pflegt, listet nur 7+6 = 13 Engines. Es fehlen dort:
- ENG-KONTOMATCH, ENG-MKTDIR, ENG-TRIP (Kalkulation)
- ENG-TLC, ENG-SLC, ENG-FLC, ENG-FDC, ENG-PLC (Controller)
- ENG-VALUATION (Bewertung)
- ENG-STOREX, ENG-KIBROWSER (Daten)

---

## Umsetzung

Zwei Dateien zu aktualisieren:

1. **`spec/current/06_engines/ENGINE_REGISTRY.md`** — ENG-FLC Eintrag in Technische Registry + Orchestrierung-Tabelle + Changelog v1.9
2. **`spec/current/00_frozen/engines_freeze.json`** — ENG-FLC Eintrag hinzufügen (frozen: false oder true, je nach Wunsch)

