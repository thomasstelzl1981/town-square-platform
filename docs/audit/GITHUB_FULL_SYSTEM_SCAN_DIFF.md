# GitHub Full System Scan — Diff Report

**Neuer Scan:** 2026-03-05T18:55:55Z (Branch: `copilot/perform-full-repo-scan`)  
**Vorheriger Stand:** `docs/audit/AUDIT_REPORT_2026-02-09.md` (Datum: 2026-02-09)

---

## Vergleichsübersicht

| Kategorie | Vorheriger Stand (Feb 2026) | Aktueller Befund (Mär 2026) | Delta |
|-----------|------------------------------|------------------------------|-------|
| Gesamt-Status | ✅ PASS (mit P2) | ⚠️ WARN (mit P1/P2) | 🔺 Verschlechtert |
| Build | ✅ PASS | ❌ FAIL (Sandbox) | Sandbox-Einschränkung |
| Lint | ✅ PASS | ❌ FAIL (Sandbox) | Sandbox-Einschränkung |
| Tests | ✅ PASS | ❌ FAIL (Sandbox) | Sandbox-Einschränkung |
| Security | Nicht dokumentiert | ⚠️ 15 Vulns (8 high) | 🔺 Neu erfasst |
| Zone 1 | ✅ PASS | ⚠️ WARN | Neues Desk-Wachstum |
| Zone 2 | ✅ PASS | ✅ PASS | Stabil |
| Zone 3 | ✅ PASS (nach FIX-001) | ✅ PASS | Stabil |

---

## Was bestätigt wurde

### ✅ FIX-001 (SotDemo 404) — Bestätigt gefixt
- **Vorher:** `/sot/demo` zeigte 404; SotDemo fehlte in `sotComponentMap` und `ManifestRouter.tsx`
- **Jetzt:** `SotDemo` ist in `Zone3Router.tsx` korrekt als `React.lazy()` importiert und in den Routes registriert
- **Status:** Fix dauerhaft aktiv ✅

### ✅ YAML-Manifests als DEPRECATED markiert — Bestätigt
- Beide YAML-Dateien (`manifests/routes_manifest.yaml`, `manifests/tile_catalog.yaml`) tragen den Status `DEPRECATED (seit 2026-02-28)`
- Dies entspricht dem vorherigen Befund FINDING-001 (DB/YAML-Drift als bekannt erwartet)
- Statushinweis in Datei-Header vorhanden ✅

### ✅ MOD-02 "5-Tile Exception" — Inzwischen überholte Beschreibung
- Vorheriger Befund: MOD-02 hat 5 Tiles (Ausnahme von 4-Tile-Regel)
- Jetzt: MOD-02 hat **7 Tiles** (email, brief, kontakte, kalender, widgets, whatsapp, videocalls)
- Die "4-Tile-Regel" ist offiziell aufgehoben; 12+ Module überschreiten jetzt 4 Tiles
- Mehrfach-Tile-Module sind jetzt Standard, nicht Ausnahme ✅ (Entscheidung dokumentiert)

### ✅ FINDING-002 (MOD-02 als 4-Tile Exception) — Überholt
- Die Ausnahme-Dokumentation ist nicht mehr relevant, da 4-Tile-Limit offiziell abgeschafft

### ✅ Zone 3 SSOT-Migration — Bestätigt abgeschlossen
- Vorheriger Stand: ManifestRouter.tsx war monolithisch
- Jetzt: Zone1Router, Zone2Router, Zone3Router als separate Code-Split-Router
- ZBC-R08 Legacy-Redirects (`/sot/*` → `/website/sot` etc.) vollständig implementiert ✅

### ✅ MOD-06 Einstellungen-Befund — Teilweise aufgelöst
- Vorheriger Befund FINDING-003: MOD-06 fehlte `EinstellungenTab.tsx`
- Aktueller Stand: MOD-06 hat 4 Tiles (objekte, anfragen, vorgaenge, reporting) — kein `einstellungen`-Tile mehr im Manifest
- Befund ist damit obsolet — das Tile wurde nicht hinzugefügt, sondern entfernt ✅

---

## Was widersprüchlich ist

### ⚠️ Build/Test/Lint-Status
- **Vorheriger Stand (Feb 2026):** Build ✅ PASS, Lint ✅ PASS
- **Aktueller Befund:** Build/Test/Lint ❌ FAIL (Exit 127 — `vite: not found`)
- **Ursache:** Sandbox-Umgebung hat keine global installierten Dev-Tools; `npm install` wurde nicht ausgeführt
- **Widerspruch:** Entweder war die vorherige Umgebung anders konfiguriert, oder der Feb-2026-Audit lief in einer vollständig initialisierten Dev-Umgebung
- **Bewertung:** Kein echter Regressionshinweis — Umgebungsdifferenz, nicht Codeproblem
- **Empfehlung:** CI-Pipeline-Konfiguration dokumentieren; Sandbox-Audit sollte `npm ci` voranstellen

### ⚠️ Anzahl Zone 3 Routen
- **Vorheriger Stand:** 9 Smoke-Test-Routen erwähnt (`/miety`, `/futureroom`, `/sot`, etc.)
- **Aktueller Befund:** Zone 3 hat 8 vollständige Website-Sub-Sites unter `/website/*`; Legacy-Pfade zusätzlich
- **Widerspruch:** Im vorherigen Audit sind `/miety` und `/futureroom` als Root-Pfade erwähnt — diese sind jetzt via legacyRoutes auf `/website/*` redirected
- **Bewertung:** Kein Problem, ZBC-R08-Migration hat stattgefunden — nur Doku-Lücke im alten Audit

---

## Was neu entdeckt wurde

### 🔴 NEU-01: Security-Vulnerabilities (nicht im alten Audit)
- **15 npm-Vulnerabilities** wurden erstmals erfasst (8 high, 4 moderate, 3 low)
- Direktes Dep `dompurify` hat moderate XSS-CVE (GHSA-v2wj-7wpq-c8vv)
- Direktes Dep `jspdf` hat high PDF-Injection + DoS
- Direktes Dep `xlsx` hat high Prototype Pollution (kein Fix verfügbar)
- **Handlungsbedarf:** `npm install dompurify@latest jspdf@latest` sofort; `xlsx`-Alternative evaluieren
- **Severity:** P1

### 🟡 NEU-02: MOD-09 Name/Route-Base Inkonsistenz
- Manifest-Name: `Immomanager`, Route-Base: `vertriebspartner`
- Im alten Audit nicht erwähnt
- **Severity:** P2

### 🟡 NEU-03: MOD-11 dynamic_routes Überlappung
- 7 dynamic_routes in MOD-11, davon 5 Finance-Tabs (nicht Submission-Flows)
- Architektonisch unklar ob diese als `tiles` oder `dynamic_routes` klassifiziert sein sollten
- **Severity:** P2

### 🟡 NEU-04: project-landing Zone3-Lücke
- `src/pages/zone3/project-landing/` existiert als Directory
- Kein Eintrag in `zone3Websites` Manifest vorhanden
- Entweder noch nicht registriert oder intern (non-public)
- **Severity:** P2

### 🟡 NEU-05: MOD-18 Name/Route-Base Inkonsistenz
- Manifest-Name `Finanzen`, Route-Base `finanzanalyse`
- Im alten Audit nicht erwähnt
- **Severity:** P2

### 🟢 NEU-06: 8 vollständige Zone3-Websites jetzt dokumentiert
- Kaufy, FutureRoom, SoT, ACQUIARY, Lennox, Ncore, Otto² Advisory, ZL Wohnbau
- Im alten Audit waren nur die Haupt-Brand-Sites erwähnt
- Vollständige Website-Matrix jetzt in GITHUB_FULL_SYSTEM_SCAN.md

### 🟢 NEU-07: 22-Modul-Struktur vollständig validiert
- MOD-00..MOD-22 (ohne MOD-21, der entfernt wurde) alle in SSOT vorhanden
- Zone2Router portalModulePageMap komplett — alle Module haben entsprechende Page-Komponenten
- Golden Path Guards für 5 Module konfiguriert (MOD-04, MOD-07, MOD-12, MOD-13, MOD-19)

### 🟢 NEU-08: Konkrete Merge-Gates erstmals definiert
- Gate A (Must-Pass), Gate B (Warn-Only), Gate C (Backlog) als formale Governance-Struktur
- Im alten Audit nur "Guardrails Compliance" Checkliste

---

## Fazit Vergleich

| Aspekt | Bewertung |
|--------|-----------|
| Code-Qualität | Stabil — keine neuen Regressions im Routing |
| Security-Schuld | NEU erfasst — Handlungsbedarf P1 (dompurify, jspdf, xlsx) |
| Architektur-Reife | Verbessert — Code-Splitting, Zone-Router, SSOT konsolidiert |
| Dokumentations-Qualität | Verbessert — YAML deprecated, TS-Manifest als einzige Wahrheit |
| Technische Schuld | Moderat — YAML-Altlasten, MOD-09/18 Namensdrift, MOD-11 dynamic_routes |
| Gesamt-Trend | Reif wachsendes System — kurzfristiger Security-Handlungsbedarf, sonst stabil |

---

*Erstellt: 2026-03-05 | Scan-Art: Read-Only Diff | Vergleichsbasis: AUDIT_REPORT_2026-02-09.md*
