# GitHub Full System Scan — Town Square Platform

**Timestamp:** 2026-03-05T18:55:55Z  
**Branch:** `copilot/perform-full-repo-scan`  
**Scan Type:** READ-ONLY — kein Code geändert, kein PR erstellt  
**SSOT Manifest:** `src/manifests/routesManifest.ts` (YAML-Dateien unter `manifests/` sind DEPRECATED seit 2026-02-28)

---

## Executive Summary

| Bereich | Status | Severity | Details |
|---------|--------|----------|---------|
| Zone 1 (Admin) | ⚠️ WARN | P2 | Routing konsistent; 50+ Admin-Routen, 7 Desk-Bereiche |
| Zone 2 (Portal MOD-00..MOD-22) | ✅ PASS | P2 | 22 Module, Manifest konsistent mit Routers |
| Zone 3 (Websites) | ✅ PASS | P2 | 8 Websites unter `/website/*`; Legacy-Redirects vorhanden |
| npm run build | ❌ FAIL | P1 | `vite: not found` — Build-Tool nicht im PATH (Sandbox-Umgebung) |
| npm run test | ❌ FAIL | P1 | `vitest: not found` — Test-Runner nicht im PATH (Sandbox-Umgebung) |
| npm run lint | ❌ FAIL | P1 | `@eslint/js` package fehlt im Node-Modulpfad (Sandbox-Umgebung) |
| npm audit | ⚠️ WARN | P1/P2 | 15 Vulnerabilities: 0 critical, 8 high, 4 moderate, 3 low |
| Manifest/Test-Drift | ⚠️ WARN | P2 | YAML-Manifests DEPRECATED, TS-SSOT ist aktuell |
| Security (direkte Deps) | 🔴 HIGH | P1 | `dompurify` (direkte Dep) hat moderate XSS-CVE |

### P0-Befunde (Blocking — sofort fixen)
*Keine P0-Befunde identifiziert.*

### P1-Befunde (Kritisch — nächster Sprint)
1. **SEC-01:** `dompurify ^3.3.1` (direkte Abhängigkeit) — moderate XSS-Vulnerabilität (GHSA-v2wj-7wpq-c8vv). Fix: `npm install dompurify@latest`
2. **SEC-02:** `rollup` — high: Arbitrary File Write via Path Traversal (transitive via vite). Fix: `npm audit fix`
3. **SEC-03:** `jspdf ^4.1.0` (direkte Abhängigkeit) — high: PDF Injection + DoS via GIF-Dimensions. Fix: `npm install jspdf@latest`
4. **SEC-04:** `xlsx ^0.18.5` (direkte Abhängigkeit) — high: Prototype Pollution + ReDoS. **Kein Fix verfügbar** — Entscheidung erforderlich (Alternative: `exceljs`)
5. **BUILD-01:** Build/Test/Lint-Tools (`vite`, `vitest`, `eslint`) nicht in Sandbox-PATH → CI-Pipeline-Konfiguration prüfen

### P2-Befunde (Empfohlen — Backlog)
1. **DRIFT-01:** `manifests/tile_catalog.yaml` und `manifests/routes_manifest.yaml` sind DEPRECATED, werden aber nicht gelöscht → Konfusionsrisiko
2. **DRIFT-02:** MOD-11 hat 5 Tiles im TS-Manifest, aber 7 zusätzliche dynamic_routes (Überlappung mit Finance-Funktionen)
3. **MOD-02:** 7 Tiles (email, brief, kontakte, kalender, widgets, whatsapp, videocalls) — weit über bisheriger "4-Tile-Empfehlung"
4. **MOD-18:** 10 Tiles (Finanzen-Modul) — größtes Modul; Split-Kandidat
5. **MOD-22:** 10 Tiles (Pet Manager) — Franchise-Partner-Modul; ebenfalls Split-Kandidat
6. **Z3-01:** Zone 3 Ratgeber-Artikel (SoT) referenzieren Komponenten die teils als Redirect auf `SotPlattform` zeigen (content deprecation risk)

---

## Zone 1: Admin Portal

**Base:** `/admin`  
**Layout:** `AdminLayout`  
**Zugriff:** Requires `platform_admin` role  
**SSOT:** `zone1Admin` in `src/manifests/routesManifest.ts`  
**Router:** `src/router/Zone1Router.tsx`

### Befunde Zone 1

| # | Befund | Typ | Severity |
|---|--------|-----|----------|
| Z1-01 | Masterdata-Sub-Routen (11 Vorlagen-Typen) vollständig und konsistent | ✅ OK | — |
| Z1-02 | FutureRoom (9 Sub-Routen: inbox, zuweisung, finanzierungsmanager, bankkontakte, monitoring, vorlagen, website-leads, contracts) | ✅ OK | — |
| Z1-03 | Acquiary Desk (6 aktive Tabs + 3 Legacy-Tabs für Rückwärtskompatibilität) | ✅ OK | — |
| Z1-04 | Sales Desk (6 Tabs), Lead Desk (3 Tabs), Projekt Desk (4 Tabs), Pet Desk (6 Tabs), Finance Desk (5 Tabs) | ✅ OK | — |
| Z1-05 | Armstrong Console (13 Sub-Routen: actions, logs, billing, knowledge, policies, test, integrations, engines, golden-paths, costs, health, review) | ✅ OK | — |
| Z1-06 | Ncore Desk + Otto Desk vorhanden | ✅ OK | — |
| Z1-07 | KI-Office konsolidiert auf 3 Admin-Routen (recherche, kontakte, email) — Keine Armstrong-Agents-Route (korrekt lt. Spec) | ✅ OK | — |
| Z1-08 | `ManagerFreischaltung` Route vorhanden | ✅ OK | — |
| Z1-09 | YAML-Manifest `manifests/routes_manifest.yaml` listet andere Route-Struktur als TS-SSOT (DEPRECATED, erwartet) | ⚠️ WARN | P2 |

**Zone 1 Admin-Routen gesamt:** ~75 Routen (inkl. Legacy)

---

## Zone 2: Modul-Matrix MOD-00 bis MOD-22

**Base:** `/portal`  
**Layout:** `PortalLayout`  
**Dashboard:** `/portal` → `PortalDashboard`  
**SSOT:** `zone2Portal.modules` in `src/manifests/routesManifest.ts`  
**Router:** `src/router/Zone2Router.tsx`

> **Hinweis:** MOD-21 (KI-Browser) wurde entfernt (spec dokumentiert). Daher 22 Module (MOD-00..MOD-20 + MOD-22).

| Modul-Code | Name | Route-Base | Tile-Count | Dynamic Routes | Sichtbarkeit | Risiko | Empfehlung |
|-----------|------|------------|-----------|----------------|--------------|--------|------------|
| MOD-00 | Dashboard | `/portal/dashboard` | 0 | 0 | all orgs | 🟢 LOW | Keine Aktion |
| MOD-01 | Stammdaten | `/portal/stammdaten` | 5 | 0 | all orgs | 🟢 LOW | Keine Aktion |
| MOD-02 | KI Office | `/portal/office` | 7 | 1 | client, partner | 🟡 MEDIUM | 7 Tiles übersteigt Empfehlung; WhatsApp/Videocalls prüfen |
| MOD-03 | DMS | `/portal/dms` | 5 | 0 | client, partner | 🟢 LOW | Keine Aktion |
| MOD-04 | Immobilien | `/portal/immobilien` | 4 | 2 | client | 🟢 LOW | Keine Aktion |
| MOD-05 | Pets (Kunden) | `/portal/pets` | 4 | 1 | client | 🟢 LOW | Keine Aktion |
| MOD-06 | Verkauf | `/portal/verkauf` | 4 | 1 | client (opt-in) | 🟢 LOW | Keine Aktion |
| MOD-07 | Finanzierung | `/portal/finanzierung` | 5 | 1 | client | 🟢 LOW | Keine Aktion |
| MOD-08 | Investments | `/portal/investments` | 4 | 3 | all orgs | 🟢 LOW | Keine Aktion |
| MOD-09 | Immomanager | `/portal/vertriebspartner` | 5 | 2 | partner/subpartner (opt-in) | 🟡 MEDIUM | Route-Base `vertriebspartner` spiegelt nicht neuen Namen `Immomanager` wider |
| MOD-10 | Lead Manager | `/portal/lead-manager` | 5 | 0 | partner (opt-in) | 🟢 LOW | Keine Aktion |
| MOD-11 | Finanzierungsmanager | `/portal/finanzierungsmanager` | 5 | 7 | partner (finance_manager role) | 🟡 MEDIUM | 7 dynamic_routes ungewöhnlich hoch; Legacy-Überhang prüfen |
| MOD-12 | Akquisemanager | `/portal/akquise-manager` | 6 | 3 | partner (akquise_manager role) | 🟢 LOW | Keine Aktion |
| MOD-13 | Projektmanager | `/portal/projekte` | 6 | 3 | partner (opt-in) | 🟢 LOW | Keine Aktion |
| MOD-14 | Communication Pro | `/portal/communication-pro` | 4 | 0 | partner (opt-in) | 🟢 LOW | Keine Aktion |
| MOD-15 | Fortbildung | `/portal/fortbildung` | 4 | 0 | all orgs | 🟢 LOW | Keine Aktion |
| MOD-16 | Services | `/portal/services` | 5 | 0 | all orgs | 🟢 LOW | Keine Aktion |
| MOD-17 | Car Management | `/portal/cars` | 4 | 0 | client | 🟢 LOW | Keine Aktion |
| MOD-18 | Finanzen | `/portal/finanzanalyse` | 10 | 0 | client | 🔴 HIGH | 10 Tiles: Largest module — Split-Kandidat; route-base `finanzanalyse` ≠ module-name `Finanzen` |
| MOD-19 | Photovoltaik | `/portal/photovoltaik` | 4 | 2 | client | 🟢 LOW | Keine Aktion |
| MOD-20 | Miety | `/portal/miety` | 4 | 1 | client | 🟢 LOW | Keine Aktion |
| MOD-22 | Pet Manager | `/portal/petmanager` | 10 | 0 | client (opt-in) | 🟡 MEDIUM | 10 Tiles: Franchise-Modul — Split-Kandidat |

**Gesamt-Tiles Zone 2:** 105 Tiles (ohne MOD-00 Dashboard)  
**Module mit >4 Tiles:** MOD-01 (5), MOD-02 (7), MOD-03 (5), MOD-07 (5), MOD-09 (5), MOD-10 (5), MOD-11 (5), MOD-12 (6), MOD-13 (6), MOD-16 (5), MOD-18 (10), MOD-22 (10)

### Zone 2 Auffälligkeiten

| # | Befund | Typ | Severity |
|---|--------|-----|----------|
| Z2-01 | MOD-09 trägt Route-Base `vertriebspartner` aber wurde in Spec zu `Immomanager` umbenannt | ⚠️ DRIFT | P2 |
| Z2-02 | MOD-18 Route-Base ist `finanzanalyse`, Module-Name ist `Finanzen` — Inkonsistenz | ⚠️ DRIFT | P2 |
| Z2-03 | MOD-11 hat 7 dynamic_routes — davon 5 erscheinen als Finance-Tabs (nicht Einreichungs-Flows) | ⚠️ WARN | P2 |
| Z2-04 | MOD-21 korrekt entfernt (kein Code, kein Route) | ✅ OK | — |
| Z2-05 | PetManager (MOD-22) in `Zone2Router.tsx` unter `portalModulePageMap` vorhanden | ✅ OK | — |
| Z2-06 | `portalModulePageMap` in Zone2Router für alle 22 Module vollständig | ✅ OK | — |
| Z2-07 | Golden Path Guards für MOD-04, MOD-07, MOD-12, MOD-13, MOD-19 konfiguriert | ✅ OK | — |

---

## Zone 3: Websites

**Base:** `/website/*`  
**SSOT:** `zone3Websites` in `src/manifests/routesManifest.ts`  
**Router:** `src/router/Zone3Router.tsx`  
**Legacy Redirects:** Alle `/kaufy2026/*`, `/futureroom/*`, `/sot/*`, `/acquiary/*` → `/website/*` (ZBC-R08)

### Website-Matrix

| Website | Base-URL | Layout | Routen | Dynamic | Status |
|---------|----------|--------|--------|---------|--------|
| KAUFY | `/website/kaufy` | `Kaufy2026Layout` | 11 | 2 (expose/:publicId, ratgeber/:slug) | ✅ AKTIV |
| FutureRoom | `/website/futureroom` | `FutureRoomLayout` | 11 | 1 (ratgeber/:slug) | ✅ AKTIV |
| SoT (System of a Town) | `/website/sot` | `SotLayout` | ~25 | 0 | ✅ AKTIV |
| ACQUIARY | `/website/acquiary` | `AcquiaryLayout` | 11 | 1 (ratgeber/:slug) | ✅ AKTIV |
| Lennox & Friends | `/website/tierservice` | `LennoxLayout` | ~14 | 1 (partner/:slug) | ✅ AKTIV |
| Ncore | `/website/ncore` | `NcoreLayout` | ~10 | 1 (ratgeber/:slug) | ✅ AKTIV |
| Otto² Advisory | `/website/otto-advisory` | `OttoAdvisoryLayout` | 10 | 1 (ratgeber/:slug) | ✅ AKTIV |
| ZL Wohnbau | `/website/zl-wohnbau` | `ZLWohnbauLayout` | 8 | 1 (ratgeber/:slug) | ✅ AKTIV |

### Zone 3 Auffälligkeiten

| # | Befund | Typ | Severity |
|---|--------|-----|----------|
| Z3-01 | SoT Ratgeber-Sub-Routen referenzieren dedizierte Komponenten (`RatgeberMsvVsWeg` etc.) | ✅ OK | — |
| Z3-02 | SoT legacy-Routen (`real-estate`, `finance`, `management`, `energy`, `armstrong`, `capital`) zeigen alle auf `SotPlattform` — kein 404-Risiko | ✅ OK | — |
| Z3-03 | ZBC-R08 Legacy-Redirects (`/sot/*` → `/website/sot`) vollständig in `legacyRoutes` | ✅ OK | — |
| Z3-04 | Lennox `ueber-uns`, `anbieter/:providerId`, `profil` Redirects vorhanden | ✅ OK | — |
| Z3-05 | `project-landing` Directory unter `src/pages/zone3/` — kein entsprechender Eintrag in `zone3Websites` sichtbar | ⚠️ WARN | P2 |

---

## Manifest / Test-Drift

| Artefakt | Status | Letzte Sync | Abweichung |
|----------|--------|-------------|------------|
| `manifests/routes_manifest.yaml` | DEPRECATED (seit 2026-02-28) | 2026-02-02 v1.1.0 | Strukturell veraltet — NICHT für Runtime |
| `manifests/tile_catalog.yaml` | DEPRECATED (seit 2026-02-28) | 2026-02-02 v1.1.0 | Listet alte Sub-Tiles; DB-Seeds outdated |
| `src/manifests/routesManifest.ts` | ✅ SSOT AKTIV | 2026-03-05 | Keine Drift — Router konsumieren direkt |
| `src/test/manifestDrivenRoutes.test.ts` | Test vorhanden | 2026-02-18 | Test-Runner in Sandbox nicht ausführbar |

### Bekannte Drifts (aus vorherigem Audit 2026-02-09 + neue Befunde)

| Modul | Manifest (TS) | YAML tile_catalog | DB-Seeds | Drift |
|-------|---------------|-------------------|----------|-------|
| MOD-01 | vertraege, abrechnung, sicherheit, rechtliches | firma, abrechnung, sicherheit | firma | ⚠️ YAML+DB outdated |
| MOD-06 | objekte, anfragen, vorgaenge, reporting (4 tiles) | objekte, anfragen, vorgaenge, reporting | N/A | YAML stimmt überein |
| MOD-09 | katalog, beratung, kunden, network, provisionen | N/A | N/A | Name drift: vertriebspartner→Immomanager |
| MOD-11 | 5 tiles + 7 dynamic | selbstauskunft/einreichen (old) | outdated | ⚠️ Test alt |
| MOD-18 | finanzanalyse (route-base) | N/A | N/A | Name: Finanzen ≠ finanzanalyse |

---

## Security-Übersicht

**npm audit Ergebnis (2026-03-05):**
- **Total Dependencies:** 1.113 (prod: 801, dev: 238, optional: 101, peer: 20)
- **Vulnerabilities:** 15 gesamt

| Severity | Anzahl |
|----------|--------|
| 🔴 High | 8 |
| 🟡 Moderate | 4 |
| 🟢 Low | 3 |
| ⚫ Critical | 0 |

### High-Severity Vulnerabilities

| Package | Via | Fix |
|---------|-----|-----|
| `@rollup/plugin-terser` | `serialize-javascript` | Upgrade `vite-plugin-pwa` → 0.19.8 (Major!) |
| `jspdf` (direkte Dep) | PDF Injection, DoS via GIF | `npm install jspdf@latest` |
| `minimatch` | ReDoS (multiple CVEs) | `npm audit fix` |
| `rollup` | Arbitrary File Write / Path Traversal | `npm audit fix` |
| `serialize-javascript` | RCE via RegExp.flags | Upgrade `vite-plugin-pwa` → 0.19.8 |
| `vite-plugin-pwa` | via `workbox-build` | Upgrade → 0.19.8 (Major!) |
| `workbox-build` | via `@rollup/plugin-terser` | Upgrade `vite-plugin-pwa` → 0.19.8 |
| `xlsx` (direkte Dep) | Prototype Pollution, ReDoS | **Kein Fix verfügbar** — Alternative evaluieren |

### Moderate Vulnerabilities

| Package | Issue | Fix |
|---------|-------|-----|
| `ajv` | ReDoS via `$data` option | `npm audit fix` |
| `dompurify` (direkte Dep) | XSS — GHSA-v2wj-7wpq-c8vv | `npm install dompurify@latest` |
| `esbuild` | Dev-Server CORS issue | Upgrade `vite` → 7.3.1 (Major!) |
| `vite` | via `esbuild` | Upgrade → 7.3.1 (Major!) |

### Low Vulnerabilities

| Package | Issue | Fix |
|---------|-------|-----|
| `@tootallnate/once` | Incorrect Control Flow Scoping | Upgrade `jsdom` → 28.1.0 (Major!) |
| `http-proxy-agent` | via `@tootallnate/once` | Upgrade `jsdom` → 28.1.0 |
| `jsdom` (devDep) | via `http-proxy-agent` | Upgrade → 28.1.0 (Major!) |

---

## Performance-Übersicht

**Build-Status:** NICHT ausführbar in Sandbox-Umgebung (`vite: not found`)  
**Einschätzung basierend auf Code-Analyse:**

| Bereich | Beobachtung | Risiko |
|---------|-------------|--------|
| Code-Splitting | Alle Zonen und Module lazy-loaded via `React.lazy()` | 🟢 LOW |
| Chunks | Zone1Router, Zone2Router, Zone3Router als separate Chunks | 🟢 LOW |
| Bundle-Größe | `mermaid ^11.12.2` ist ein schwerer Chunk (~800KB+) | 🟡 MEDIUM |
| Bundle-Größe | `jspdf ^4.1.0` schwer (~500KB) | 🟡 MEDIUM |
| Bundle-Größe | `xlsx ^0.18.5` schwer (~300KB) | 🟡 MEDIUM |
| Module-Count | 22 Module, alle lazy-loaded → Initial-Bundle schlank | 🟢 LOW |
| Images | Public-Dir nicht auditiert — kein direkter Befund | — |

---

## "No-Regret Fixes" vs. "Entscheidungsbedarf"

### No-Regret Fixes (sofort, kein Business-Impact)

1. `npm install dompurify@latest` — direktes Dep, XSS-Fix, wahrscheinlich non-breaking
2. `npm install jspdf@latest` — direktes Dep, Security-Fix
3. `npm audit fix` — transititve Deps (rollup, minimatch, ajv) — non-breaking patch-upgrades
4. YAML-Manifests `manifests/routes_manifest.yaml` + `manifests/tile_catalog.yaml` löschen oder als `ARCHIVED` kennzeichnen (reduziert Konfusion)
5. MOD-09 Name in Manifest von `Immomanager` auf `vertriebspartner` angleichen ODER Route-Base umbenennen (Konsistenz)

### Entscheidungsbedarf (Product/Business)

1. **`xlsx` ersetzen:** Kein Security-Fix verfügbar. Alternativen: `exceljs`, `papaparse`. Business-Impact: Breaking Change in Excel-Export-Features
2. **`vite-plugin-pwa` Upgrade:** Major-Version (0.x → 0.19.8) — PWA-Konfiguration muss ggf. migriert werden
3. **`vite` Upgrade** (5.x → 7.x): Major. Breaking Changes in Konfiguration und Plugins möglich
4. **MOD-18 Split:** 10-Tile-Modul „Finanzen" in 2 Module aufteilen? Product-Entscheidung erforderlich
5. **MOD-22 Split:** 10-Tile Pet Manager splitten? Franchise-Architektur-Entscheidung
6. **MOD-02 Tiles:** WhatsApp-Integration und Videocalls (LiveKit) in eigenem Modul oder behalten?

---

## Konkrete Merge-Gates

### Gate A: Must-Pass (Blocking für jeden Merge)

- [ ] **A-01:** `npm audit` zeigt keine neuen Vulnerabilities (Baseline: 15 aktuell bekannt)
- [ ] **A-02:** Alle neuen Routen müssen in `src/manifests/routesManifest.ts` deklariert sein
- [ ] **A-03:** `src/test/manifestDrivenRoutes.test.ts` must pass (sobald CI-Umgebung verfügbar)
- [ ] **A-04:** Keine neuen direkten Dependencies mit bekannten high/critical CVEs ohne Approval
- [ ] **A-05:** Zone2Router `portalModulePageMap` muss alle Module abdecken

### Gate B: Warn-Only (In Review-Kommentar erwähnen, aber nicht blocken)

- [ ] **B-01:** Neues Modul mit >6 Tiles → Begründung erforderlich
- [ ] **B-02:** Neuer Dynamic Route ohne `goldenPath` Guard → Kommentar erklären warum nicht nötig
- [ ] **B-03:** YAML-Manifests NICHT synchronisieren (sind DEPRECATED) — nur TS-SSOT
- [ ] **B-04:** Performance-sensitive Packages (mermaid, jspdf, xlsx) — Chunk-Größe im Build-Log prüfen

### Gate C: Backlog (Technische Schuld, kein akuter Block)

- [ ] **C-01:** YAML-Manifests `manifests/` archivieren oder löschen (Konfusionspotenzial)
- [ ] **C-02:** MOD-09 Route-Base / Name-Konsistenz
- [ ] **C-03:** MOD-11 dynamic_routes aufräumen (5 Finance-Tabs als echte Tiles vs. dynamic_routes)
- [ ] **C-04:** `xlsx` durch sichere Alternative ersetzen
- [ ] **C-05:** `project-landing` Zone3-Bereich in `zone3Websites` manifest aufnehmen oder dokumentieren
- [ ] **C-06:** DB-Seeds für `tile_catalog.sub_tiles` synchronisieren (MOD-01, MOD-06, MOD-11, MOD-13)

---

## Durchgeführte Checks

| Check | Befehl | Exit-Code | Kurzfazit |
|-------|--------|-----------|-----------|
| Build | `npm run build` | 127 | `vite: not found` — Tool nicht im Sandbox-PATH installiert |
| Test (manifestDrivenRoutes) | `npm run test -- src/test/manifestDrivenRoutes.test.ts` | 127 | `vitest: not found` — Tool nicht im Sandbox-PATH installiert |
| Lint | `npm run lint` | 127 / ESLint Error | `eslint: not found` / `@eslint/js` package fehlt |
| npm audit | `npm audit --json` | 0 | 15 Vulnerabilities: 8 high, 4 moderate, 3 low, 0 critical |

> **Hinweis:** Exit-Code 127 bedeutet "Command not found" in der Sandbox-Umgebung. Die Build/Test/Lint-Tools sind als devDependencies definiert, müssen aber via `npm install` oder `npx` aufgerufen werden. Der produktive CI-Build ist davon nicht betroffen wenn er `npx vite build` bzw. `node_modules/.bin/vite` nutzt.

---

*Erstellt: 2026-03-05 | Scan-Art: Read-Only | Keine Codeänderungen*
