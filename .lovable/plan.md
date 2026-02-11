

# ZIELBILD: Zone Boundary Contract (ZBC) v1.0

---

## 1. ZONE-IDENTITAET UND ROUTING-SSOT

**Regel ZBC-R01:** `src/manifests/routesManifest.ts` ist die einzige Source of Truth fuer alle Routen im System. Keine Route existiert, die nicht hier deklariert ist.

**Regel ZBC-R02:** Folgende Dateien duerfen KEINE Routen definieren:
- `src/App.tsx` (nur Delegation an ManifestRouter + maximale Ausnahmen)
- `src/constants/rolesMatrix.ts` (keine Routing-Logik)
- DB `tile_catalog` (keine Pfade, nur `tile_id`-Referenzen)
- Jede Komponente, die eigene `<Route>`-Elemente rendert

**Regel ZBC-R03:** Erlaubte Ausnahmen in `src/App.tsx` (erschoepfende Liste):
- `/` — Redirect auf `/portal`
- `/auth` — Login/Registrierung (public)
- `/auth/reset-password` — Passwort-Reset (public)
- Hidden-Routes mit kryptischen Pfaden (z.B. Presentation-Seiten)

Alle anderen Routen muessen ueber `ManifestRouter.tsx` aus `routesManifest.ts` generiert werden.

---

## 2. ZONE-ISOLATION (Abschluss)

### 2.1 Allowed Base Paths (Zielbild)

| Zone | Erlaubte Root-Prefixe | Beispiele |
|------|----------------------|-----------|
| Zone 1 | `/admin/**` | `/admin/sales-desk`, `/admin/futureroom` |
| Zone 2 | `/portal/**` | `/portal/immobilien`, `/portal/office` |
| Zone 3 | **`/website/**`** (NEU — siehe Abschnitt 4) | `/website/kaufy/`, `/website/miety/` |
| System | `/`, `/auth`, `/auth/reset-password` | Redirects und Auth |

### 2.2 No-Cross-Import Regeln

**Regel ZBC-R04:** Folgende Import-Grenzen sind verbindlich:

| Quell-Bereich | Darf importieren aus | Darf NICHT importieren aus |
|---|---|---|
| `src/pages/admin/**` | `src/components/ui/**`, `src/shared/**`, `src/hooks/**`, `src/integrations/**` | `src/pages/portal/**`, `src/pages/zone3/**` |
| `src/pages/portal/**` | `src/components/ui/**`, `src/shared/**`, `src/hooks/**`, `src/integrations/**` | `src/pages/admin/**`, `src/pages/zone3/**` |
| `src/pages/zone3/**` | `src/components/ui/**`, `src/shared/**`, `src/hooks/**`, `src/integrations/**` | `src/pages/admin/**`, `src/pages/portal/**` |

**Shared-Bereiche** (zone-agnostisch, fuer alle importierbar):

```text
src/components/ui/**        — shadcn/UI-Primitives
src/shared/**               — Shared Business-Komponenten (z.B. InvestmentResultTile)
src/hooks/**                — Globale Hooks
src/integrations/**         — Supabase Client, Types
src/manifests/**            — Manifests (routesManifest, areaConfig, etc.)
src/constants/**            — Konstanten
src/lib/**                  — Utilities
```

### 2.3 No-Cross-Route Regeln

**Regel ZBC-R05:**
- Zone 2 UI darf keine navigierbaren Links auf `/admin/**` rendern (Ausnahme: `platform_admin`-Gate fuer expliziten Admin-Link im User-Menue)
- Zone 3 UI darf keine Links auf `/portal/**` rendern ausser Call-to-Action "Jetzt registrieren/einloggen" → `/auth`
- Zone 1 UI darf Links auf Zone 2 nur als "Tenant-Kontext oeffnen" rendern (fuer Support-Zwecke)

---

## 3. ZONE-VERANTWORTUNG (SoT-Regeln)

### 3.1 Zonen-Zweck

| Zone | Identitaet | Verantwortung |
|------|-----------|---------------|
| Zone 1 | Governance / Backoffice | Delegation, Admin-Desks, globale Zuweisungen, Audit, Armstrong Console, Integration Registry |
| Zone 2 | Tenant Portal | Operatives Arbeiten, MOD-00 bis MOD-20, mandantenisoliert |
| Zone 3 | Public Websites | Marketing, Entry, Lead Capture, oeffentliche Rechner, publizierte Inserate |

### 3.2 Write-Access-Matrix

| Zone | Schreib-Zugriff | Beispiel-Tabellen |
|------|-----------------|-------------------|
| Zone 3 | Nur Leads / Requests / Registrierungen erzeugen | `leads` (INSERT only), `auth.users` (Signup), `contact_requests` |
| Zone 2 | Tenant-bezogene Datensaetze (CRUD, RLS-isoliert) | `properties`, `units`, `leases`, `documents`, `finance_requests`, `listings` |
| Zone 1 | Cases delegieren/assignen, globale Admin-Records, Config | `org_delegations`, `tile_catalog`, `integration_registry`, `lead_assignments` |

**Regel ZBC-R06:** Zone 3 darf niemals direkt in Tenant-Tabellen (properties, units, leases etc.) schreiben. Der einzige Weg ist ueber Lead-/Request-Intake (Edge Function), danach uebernimmt Zone 1 oder Zone 2.

**Regel ZBC-R07:** Zone 1 hat keinen direkten Schreibzugriff auf Tenant-Geschaeftsdaten. Admin-Aktionen erfolgen ueber Zuweisung/Delegation, nicht durch direktes Editieren von Properties/Leases.

---

## 4. Z3 PREFIX-REGEL — ENTSCHEIDUNG: `/website/**`

### Bewertung

**Empfehlung: JA — `/website/**` als einheitlicher Prefix.**

Gruende:
1. **Skalierbarkeit:** Aktuell 6 Websites (`kaufy2026`, `miety`, `futureroom`, `sot`, `acquiary`, `projekt`). Kuenftig kommen Landing Pages, Kampagnen-Seiten, Partner-Microsites hinzu. Ohne Prefix droht Root-Namespace-Verschmutzung.
2. **Kollisionsvermeidung:** Ohne Prefix konkurrieren Z3-Pfade (`/kaufy2026`, `/miety`, `/sot`) mit System-Pfaden. Jede neue Website braucht manuelle Pruefung gegen alle Root-Pfade.
3. **Manifest-Validation:** Ein einheitlicher Prefix erlaubt eine einfache programmatische Regel: "Alles unter `/website/**` ist Zone 3" — keine Enumeration noetig.
4. **SEO:** Kein Nachteil, da jede Website unter `/website/kaufy/` ihren eigenen Kontext behaelt. Custom Domains (kaufy.app → proxy auf `/website/kaufy/`) loesen den Branding-Aspekt.

### Verbindliche Regeln

**Regel ZBC-R08:** Alle Zone-3-Websites muessen unter `/website/<brand>/**` liegen.

**Namenskonvention:**

```text
/website/kaufy/**           — KAUFY Marketplace (ehemals /kaufy2026)
/website/miety/**           — MIETY Mieter-Portal
/website/futureroom/**      — FutureRoom Finanzierung
/website/sot/**             — System of a Town Marketing
/website/acquiary/**        — ACQUIARY Akquise
/website/projekt/:slug/**   — Dynamische Projekt-Landing-Pages
/website/landing/:slug/**   — Kampagnen-Landing-Pages (zukuenftig)
```

**Regel ZBC-R09 (No Root Collisions):** Ausserhalb von `/admin`, `/portal`, `/website`, `/auth` und `/` duerfen KEINE weiteren Root-Pfade existieren. `ManifestRouter` muss dies validieren.

**Legacy-Redirects (Migrationsplan):**

| Alt | Neu | Typ |
|-----|-----|-----|
| `/kaufy2026/**` | `/website/kaufy/**` | 301 Redirect |
| `/miety/**` | `/website/miety/**` | 301 Redirect |
| `/futureroom/**` | `/website/futureroom/**` | 301 Redirect |
| `/sot/**` | `/website/sot/**` | 301 Redirect |
| `/acquiary/**` | `/website/acquiary/**` | 301 Redirect |
| `/projekt/:slug` | `/website/projekt/:slug` | 301 Redirect |

---

## 5. CROSS-ZONE HANDOFFS (Contracts)

**Regel ZBC-R10:** Jeder Cross-Zone-Uebergang MUSS einen Contract-Eintrag in `spec/current/06_api_contracts/` haben.

### Contract-Template

Jeder Contract wird als eigene Markdown-Datei angelegt:

```text
spec/current/06_api_contracts/
  INDEX.md                              — Uebersicht aller Contracts
  CONTRACT_LEAD_CAPTURE.md              — Z3 → Z1 Lead Capture
  CONTRACT_FINANCE_SUBMIT.md            — Z2 → Z1 Finanzierungsanfrage
  CONTRACT_MANDATE_ASSIGNMENT.md        — Z1 → Z2 Mandatszuweisung
  CONTRACT_ONBOARDING.md                — Auth → Z2 Tenant-Erstellung
  CONTRACT_DATA_ROOM_ACCESS.md          — Z2 → Z3 Datenraum-Freigabe
  CONTRACT_EMAIL_INBOUND.md             — Extern → Z1 E-Mail-Routing
  module_api_overview.md                — (bestehend) Modul-API-Uebersicht
```

### Contract-Felder (verbindlich)

| Feld | Beschreibung |
|------|-------------|
| Name | Eindeutiger Contract-Name |
| Direction | Z3→Z1, Z2→Z1, Z1→Z2, Auth→Z2, Extern→Z1 |
| Trigger | Was loest den Handoff aus (User-Aktion, Systemereignis) |
| Payload-Schema | Felder mit Typen (JSON-Schema oder Tabellen-Referenz) |
| IDs/Correlation | Welche IDs werden uebergeben und fuer Tracking genutzt |
| SoT nach Uebergabe | Wer ist Owner der Daten nach dem Handoff |
| Code-Fundstelle | Dateipfad der implementierenden Edge Function / Hook |
| Fehlerfaelle/Retry | Was passiert bei Fehler, gibt es Retry-Logik |

### Contract Index (`INDEX.md`)

```text
| Contract | Richtung | Trigger | Code-Fundstelle | Status |
|----------|----------|---------|-----------------|--------|
| Lead Capture | Z3→Z1 | Form-Submit | supabase/functions/lead-capture/ | Implementiert |
| Finance Submit | Z2→Z1 | "Anfrage absenden" | src/hooks/useFinanceRequestSubmit.ts | Implementiert |
| Mandate Assignment | Z1→Z2 | Admin-Zuweisung | src/components/admin/acquiary/ | Implementiert |
| Onboarding | Auth→Z2 | User-Signup | SQL Trigger on_auth_user_created | Implementiert |
| Data Room Access | Z2→Z3 | Freigabe-Aktion | src/hooks/useAccessGrants.ts | Implementiert |
| Email Inbound | Extern→Z1 | Webhook | supabase/functions/resend-inbound-webhook/ | Implementiert |
```

---

## 6. NAVIGATION / TILES / ROLE-GATING (R-001, R-002)

### Entscheidung: Modell A (empfohlen)

**Regel ZBC-R11:** Autoritatives Modell fuer Routing und Tile-Gating:

| Aspekt | SSOT | Nicht-SSOT |
|--------|------|-----------|
| Welche Routen existieren | `routesManifest.ts` | DB darf KEINE neuen Routen definieren |
| Wer sieht welches Tile (Aktivierung, Visibility, Sortierung) | DB `tile_catalog` + `get_tiles_for_role()` | `rolesMatrix.ts` ist **Seed-Only** |
| Area-Gruppierung (Navigation) | `areaConfig.ts` | — |

**Regel ZBC-R12:** `src/constants/rolesMatrix.ts` wird als **Seed-Definition** klassifiziert:
- Dient ausschliesslich als initialer Seed fuer `tile_catalog` bei Tenant-Erstellung
- Wird NICHT zur Laufzeit fuer Berechtigungspruefungen herangezogen
- Header-Kommentar muss dies explizit dokumentieren: `@status seed-only — Runtime-SSOT ist DB tile_catalog`
- Funktionen wie `getTilesForRole()` und `hasModuleAccess()` duerfen nur in Seed-/Admin-Kontexten aufgerufen werden

**Regel ZBC-R13:** DB `tile_catalog` referenziert Tiles ueber eine stabile `tile_id` (z.B. `MOD-04`), die im Code definiert ist. Die DB darf keine eigenen Route-Pfade erfinden.

---

## 7. SPECS VS DOCS (R-003)

**Regel ZBC-R14:** `spec/current/**` ist normativ (verbindlich, versioniert, FROZEN-faehig).

**Regel ZBC-R15:** `docs/**` ist abgeleitet/optional:
- Darf existieren fuer Onboarding, Tutorials, Diagramme
- Muss bei Widerspruch zu `spec/` nachziehen (spec gewinnt)
- Darf NICHT als Quelle fuer Implementierungsentscheidungen dienen

**Regel ZBC-R16:** Golden-Path-Dokus werden konsolidiert:
- `docs/golden-paths/` — einziger Ort fuer GP-Dokumentation
- `docs/workflows/` — wird aufgeloest; Inhalte wandern nach `docs/golden-paths/` oder werden geloescht

---

## 8. DATEI-STRUKTUR (Zielbild)

```text
src/
  manifests/
    routesManifest.ts          — SSOT: Alle Routen Z1/Z2/Z3 (Zielbild: Z3 unter /website/**)
    areaConfig.ts              — SSOT: Zone 2 Area-Gruppierung
    armstrongManifest.ts       — SSOT: AI-Actions
    goldenPaths/
      types.ts                 — GP-Typen
      MOD_04.ts                — GP MOD-04 (Immobilie)
      index.ts                 — Re-Exports

  constants/
    rolesMatrix.ts             — Status: SEED-ONLY (Header-Kommentar aendern)

  router/
    ManifestRouter.tsx         — Einziger Router-Generator (kein anderer <Route>-Renderer)

  pages/
    admin/**                   — Zone 1 Seiten (kein Import aus portal/ oder zone3/)
    portal/**                  — Zone 2 Seiten (kein Import aus admin/ oder zone3/)
    zone3/**                   — Zone 3 Seiten (kein Import aus admin/ oder portal/)

  shared/                      — Zone-agnostische Business-Komponenten (z.B. InvestmentResultTile)
  components/ui/**             — shadcn Primitives (zone-agnostisch)
  hooks/**                     — Globale Hooks (zone-agnostisch)
  integrations/**              — Supabase Client/Types (zone-agnostisch)
  goldenpath/                  — GP-Engine, Hooks, Guards
  lib/**                       — Utilities

spec/
  current/
    02_zones.md                — Zone Boundary Contract (dieser Text als Markdown)
    06_api_contracts/
      INDEX.md                 — Contract Index (NEU)
      CONTRACT_*.md            — Einzelne Contracts (NEU)
      module_api_overview.md   — (bestehend)

docs/
  golden-paths/                — Konsolidiert (alle GP-Dokus hier)
```

---

---

# PLAN: Schritte vom Ist zum Soll

---

### Schritt 1 — Zone Boundary Contract dokumentieren

| Aspekt | Detail |
|--------|--------|
| Ziel | ZBC-Regeln (oben) als normatives Dokument verankern |
| Betroffene Dateien | `spec/current/02_zones.md` (neu erstellen oder ueberschreiben) |
| Output | `spec/current/02_zones.md` mit allen ZBC-R01 bis ZBC-R16 Regeln |
| Akzeptanzkriterium | Dokument existiert, enthaelt alle 16 Regeln, ist FROZEN-faehig |

---

### Schritt 2 — Z3 Prefix-Migration: routesManifest anpassen

| Aspekt | Detail |
|--------|--------|
| Ziel | Alle Z3-Websites von Root-Pfaden auf `/website/**` migrieren |
| Betroffene Dateien | `src/manifests/routesManifest.ts` (zone3Websites: base-Pfade aendern), `src/router/ManifestRouter.tsx` (Imports + Component-Maps), `src/manifests/routesManifest.ts` (legacyRoutes: 6 neue Redirects) |
| Output | Z3 base-Pfade: `/website/kaufy`, `/website/miety`, `/website/futureroom`, `/website/sot`, `/website/acquiary`, `/website/projekt`. Legacy-Redirects fuer alte Pfade. |
| Akzeptanzkriterium | Alle Z3-Websites erreichbar unter `/website/*`. Alte Pfade `/kaufy2026`, `/miety` etc. redirecten korrekt. Keine Root-Pfade ausserhalb `/admin`, `/portal`, `/website`, `/auth`. |

---

### Schritt 3 — Root-Collision-Validation in ManifestRouter

| Aspekt | Detail |
|--------|--------|
| Ziel | Programmatische Pruefung: keine unerlaubten Root-Pfade |
| Betroffene Dateien | `src/router/ManifestRouter.tsx` oder `src/goldenpath/devValidator.ts` (DEV-only Check) |
| Output | DEV-Warning wenn ein Z3-base-Pfad nicht mit `/website/` beginnt |
| Akzeptanzkriterium | Im DEV-Modus erscheint `console.error` bei Regelverletzung |

---

### Schritt 4 — rolesMatrix.ts als Seed-Only klassifizieren (R-001)

| Aspekt | Detail |
|--------|--------|
| Ziel | rolesMatrix.ts Header-Kommentar aendern, Runtime-Aufrufe identifizieren und auf DB umstellen |
| Betroffene Dateien | `src/constants/rolesMatrix.ts` (Header), alle Dateien die `getTilesForRole()` oder `hasModuleAccess()` importieren |
| Output | Header markiert als `@status seed-only`. Runtime-Code nutzt ausschliesslich `get_tiles_for_role()` RPC. |
| Akzeptanzkriterium | Kein Runtime-Code (ausserhalb von Seed/Admin-Kontexten) importiert `getTilesForRole` aus rolesMatrix |

---

### Schritt 5 — tile_catalog und routesManifest synchronisieren (R-002)

| Aspekt | Detail |
|--------|--------|
| Ziel | tile_catalog referenziert nur `tile_id`s die in routesManifest existieren |
| Betroffene Dateien | `supabase/migrations/*tile_catalog*`, `src/manifests/routesManifest.ts` |
| Output | Validierungsfunktion (DEV-only) die tile_catalog-Eintraege gegen routesManifest prueft |
| Akzeptanzkriterium | Kein tile_catalog-Eintrag ohne korrespondierenden Manifest-Eintrag |

---

### Schritt 6 — Contract Index erstellen (R-005)

| Aspekt | Detail |
|--------|--------|
| Ziel | Alle Cross-Zone-Handoffs formalisieren |
| Betroffene Dateien | `spec/current/06_api_contracts/INDEX.md` (neu), `spec/current/06_api_contracts/CONTRACT_*.md` (6 neue Dateien) |
| Output | INDEX.md mit Uebersichtstabelle. Je ein Contract-Dokument fuer: Lead Capture, Finance Submit, Mandate Assignment, Onboarding, Data Room Access, Email Inbound |
| Akzeptanzkriterium | Jeder identifizierte Handoff hat ein Contract-Dokument mit allen Pflichtfeldern (Direction, Trigger, Payload, IDs, SoT, Fehlerfaelle) |

---

### Schritt 7 — Dokumentation konsolidieren (R-003, R-004)

| Aspekt | Detail |
|--------|--------|
| Ziel | GP-Dokus zusammenfuehren, Workflow-Ordner aufloesen |
| Betroffene Dateien | `docs/workflows/GOLDEN_PATH_FINANZIERUNG.md` → `docs/golden-paths/`, `docs/workflows/GOLDEN_PATH_SANIERUNG.md` → `docs/golden-paths/`, `docs/workflows/GOLDEN_PATH_E2E.md` → `docs/golden-paths/` |
| Output | Alle GP-Dokus in `docs/golden-paths/`. `docs/workflows/` entweder leer oder geloescht. |
| Akzeptanzkriterium | Kein GP-Dokument mehr in `docs/workflows/`. Alle Referenzen aktualisiert. |

---

### Schritt 8 — GoldenPathGuard in ManifestRouter einbinden

| Aspekt | Detail |
|--------|--------|
| Ziel | MOD-04 Route-Guard aktivieren (aus Golden-Path-Audit P0) |
| Betroffene Dateien | `src/router/ManifestRouter.tsx`, `src/goldenpath/GoldenPathGuard.tsx` |
| Output | Dynamic Routes fuer MOD-04 (`/portal/immobilien/:id`) werden durch GoldenPathGuard gewrappt |
| Akzeptanzkriterium | Zugriff auf `/portal/immobilien/<ungueltige-id>` redirected auf Portfolio mit Toast-Hinweis |

---

### Schritt 9 — devValidator beim App-Start triggern

| Aspekt | Detail |
|--------|--------|
| Ziel | Alle DEV-Validierungen (GP-Routes, Root-Collisions, Tile-Sync) automatisch ausfuehren |
| Betroffene Dateien | `src/main.tsx` oder `src/App.tsx`, `src/goldenpath/devValidator.ts` |
| Output | Im DEV-Modus werden beim Start alle Validierungen ausgefuehrt |
| Akzeptanzkriterium | Bei Route-Mismatch oder Root-Collision erscheint `console.error` in der Browser-Konsole |

---

### Reihenfolge

```text
Phase A (Fundament):     Schritt 1 (ZBC-Doku) → Schritt 2 (Z3 Prefix) → Schritt 3 (Validation)
Phase B (SSOT-Bereinigung): Schritt 4 (rolesMatrix) → Schritt 5 (tile_catalog Sync)
Phase C (Dokumentation):    Schritt 6 (Contract Index) → Schritt 7 (Doku-Konsolidierung)
Phase D (Enforcement):      Schritt 8 (GP Guard) → Schritt 9 (DEV Validator)
```

