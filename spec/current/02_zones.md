# Zone Boundary Contract (ZBC) v1.0

> **Status:** FROZEN — Aenderungen nur per ADR  
> **Erstellt:** 2026-02-11  
> **Geltungsbereich:** Alle Zonen (Z1 Admin, Z2 Portal, Z3 Websites)

---

## ZBC-R01 — Routing SSOT

`src/manifests/routesManifest.ts` ist die **einzige Source of Truth** fuer alle Routen im System.  
Keine Route existiert, die nicht hier deklariert ist.

## ZBC-R02 — Routing-Verbote

Folgende Dateien duerfen **KEINE Routen** definieren:

- `src/App.tsx` (nur Delegation an ManifestRouter + Ausnahmen gem. ZBC-R03)
- `src/constants/rolesMatrix.ts` (keine Routing-Logik)
- DB `tile_catalog` (keine Pfade, nur `tile_id`-Referenzen)
- Jede Komponente, die eigene `<Route>`-Elemente rendert

## ZBC-R03 — Erlaubte Ausnahmen in App.tsx

Erschoepfende Liste der Routen, die direkt in `src/App.tsx` definiert werden duerfen:

| Pfad | Zweck |
|------|-------|
| `/` | Redirect auf `/portal` |
| `/auth` | Login / Registrierung (public) |
| `/auth/reset-password` | Passwort-Reset (public) |
| `/presentation-*` | Hidden-Routes mit kryptischen Pfaden |

Alle anderen Routen muessen ueber `ManifestRouter.tsx` aus `routesManifest.ts` generiert werden.

---

## ZBC-R04 — No-Cross-Import Regeln

| Quell-Bereich | Darf importieren aus | Darf NICHT importieren aus |
|---|---|---|
| `src/pages/admin/**` | `src/components/ui/**`, `src/shared/**`, `src/hooks/**`, `src/integrations/**`, `src/manifests/**`, `src/constants/**`, `src/lib/**` | `src/pages/portal/**`, `src/pages/zone3/**` |
| `src/pages/portal/**` | `src/components/ui/**`, `src/shared/**`, `src/hooks/**`, `src/integrations/**`, `src/manifests/**`, `src/constants/**`, `src/lib/**` | `src/pages/admin/**`, `src/pages/zone3/**` |
| `src/pages/zone3/**` | `src/components/ui/**`, `src/shared/**`, `src/hooks/**`, `src/integrations/**`, `src/manifests/**`, `src/constants/**`, `src/lib/**` | `src/pages/admin/**`, `src/pages/portal/**` |

**Shared-Bereiche** (zone-agnostisch, fuer alle importierbar):

- `src/components/ui/**` — shadcn/UI-Primitives
- `src/shared/**` — Shared Business-Komponenten
- `src/hooks/**` — Globale Hooks
- `src/integrations/**` — Supabase Client, Types
- `src/manifests/**` — Manifests
- `src/constants/**` — Konstanten
- `src/lib/**` — Utilities

## ZBC-R05 — No-Cross-Route Regeln

- Zone 2 UI darf keine navigierbaren Links auf `/admin/**` rendern  
  (Ausnahme: `platform_admin`-Gate fuer expliziten Admin-Link im User-Menue)
- Zone 3 UI darf keine Links auf `/portal/**` rendern  
  (Ausnahme: CTA "Jetzt registrieren/einloggen" → `/auth`)
- Zone 1 UI darf Links auf Zone 2 nur als "Tenant-Kontext oeffnen" rendern (Support)

---

## ZBC-R06 — Zone 3 Write-Verbot

Zone 3 darf **niemals** direkt in Tenant-Tabellen schreiben (properties, units, leases etc.).  
Einziger Weg: Lead-/Request-Intake via Edge Function → danach uebernimmt Zone 1 oder Zone 2.

## ZBC-R07 — Zone 1 Delegationsprinzip

Zone 1 hat keinen direkten Schreibzugriff auf Tenant-Geschaeftsdaten.  
Admin-Aktionen erfolgen ueber Zuweisung/Delegation, nicht durch direktes Editieren.

### Write-Access-Matrix

| Zone | Schreib-Zugriff | Beispiel-Tabellen |
|------|-----------------|-------------------|
| Zone 3 | Nur Leads / Requests / Registrierungen | `leads`, `auth.users` (Signup), `contact_requests` |
| Zone 2 | Tenant-bezogene Datensaetze (CRUD, RLS-isoliert) | `properties`, `units`, `leases`, `documents`, `finance_requests` |
| Zone 1 | Cases delegieren/assignen, globale Config | `org_delegations`, `tile_catalog`, `integration_registry` |

---

## ZBC-R08 — Zone 3 Prefix-Regel

Alle Zone-3-Websites muessen unter **`/website/<brand>/**`** liegen.

### Namenskonvention

| Pfad | Website |
|------|---------|
| `/website/kaufy/**` | KAUFY Marketplace |
| `/website/miety/**` | MIETY Mieter-Portal |
| `/website/futureroom/**` | FutureRoom Finanzierung |
| `/website/sot/**` | System of a Town Marketing |
| `/website/acquiary/**` | ACQUIARY Akquise |
| `/website/projekt/:slug/**` | Dynamische Projekt-Landing-Pages |
| `/website/landing/:slug/**` | Kampagnen-Landing-Pages (zukuenftig) |

## ZBC-R09 — No Root Collisions

Ausserhalb von `/admin`, `/portal`, `/website`, `/auth` und `/` duerfen **KEINE** weiteren Root-Pfade existieren.  
`devValidator.ts` prueft dies im DEV-Modus.

---

## ZBC-R10 — Cross-Zone Contracts

Jeder Cross-Zone-Uebergang MUSS einen Contract-Eintrag in `spec/current/06_api_contracts/` haben.

### Pflichtfelder pro Contract

| Feld | Beschreibung |
|------|-------------|
| Name | Eindeutiger Contract-Name |
| Direction | Z3→Z1, Z2→Z1, Z1→Z2, Auth→Z2, Extern→Z1 |
| Trigger | Ausloesende Aktion |
| Payload-Schema | Felder mit Typen |
| IDs/Correlation | Tracking-IDs |
| SoT nach Uebergabe | Owner der Daten nach Handoff |
| Code-Fundstelle | Dateipfad |
| Fehlerfaelle/Retry | Fehlerbehandlung |

### Contract Index

Siehe `spec/current/06_api_contracts/INDEX.md`

---

## ZBC-R11 — Autoritatives Modell (Routing + Tile-Gating)

| Aspekt | SSOT | Nicht-SSOT |
|--------|------|-----------|
| Welche Routen existieren | `routesManifest.ts` | DB darf KEINE neuen Routen definieren |
| Wer sieht welches Tile | DB `tile_catalog` + `get_tiles_for_role()` | `rolesMatrix.ts` ist Seed-Only |
| Area-Gruppierung | `areaConfig.ts` | — |

## ZBC-R12 — rolesMatrix.ts Status: Seed-Only

- Dient ausschliesslich als initialer Seed fuer `tile_catalog` bei Tenant-Erstellung
- Wird **NICHT** zur Laufzeit fuer Berechtigungspruefungen herangezogen
- Header-Kommentar: `@status seed-only — Runtime-SSOT ist DB tile_catalog`

## ZBC-R13 — tile_catalog Referenz-Regel

DB `tile_catalog` referenziert Tiles ueber eine stabile `tile_id` (z.B. `MOD-04`), die im Code definiert ist.  
Die DB darf keine eigenen Route-Pfade erfinden.

---

## ZBC-R14 — Specs sind normativ

`spec/current/**` ist normativ (verbindlich, versioniert, FROZEN-faehig).

## ZBC-R15 — Docs sind abgeleitet

`docs/**` ist abgeleitet/optional:
- Darf existieren fuer Onboarding, Tutorials, Diagramme
- Muss bei Widerspruch zu `spec/` nachziehen (spec gewinnt)

## ZBC-R16 — Golden-Path-Konsolidierung

- `docs/golden-paths/` — einziger Ort fuer GP-Dokumentation
- `docs/workflows/` — wird aufgeloest

---

## Allowed Base Paths (Uebersicht)

| Zone | Root-Prefix | Beispiele |
|------|-------------|-----------|
| Zone 1 | `/admin/**` | `/admin/sales-desk`, `/admin/futureroom` |
| Zone 2 | `/portal/**` | `/portal/immobilien`, `/portal/office` |
| Zone 3 | `/website/**` | `/website/kaufy/`, `/website/miety/` |
| System | `/`, `/auth`, `/auth/reset-password` | Redirects und Auth |

## Zonen-Zweck

| Zone | Identitaet | Verantwortung |
|------|-----------|---------------|
| Zone 1 | Governance / Backoffice | Delegation, Admin-Desks, Audit, Armstrong |
| Zone 2 | Tenant Portal | Operatives Arbeiten, MOD-00 bis MOD-20 |
| Zone 3 | Public Websites | Marketing, Entry, Lead Capture |

---

## Datei-Struktur (Zielbild)

```
src/
  manifests/
    routesManifest.ts          — SSOT: Alle Routen Z1/Z2/Z3
    areaConfig.ts              — SSOT: Zone 2 Area-Gruppierung
    armstrongManifest.ts       — SSOT: AI-Actions
    goldenPaths/               — GP-Definitionen
  constants/
    rolesMatrix.ts             — Status: SEED-ONLY
  router/
    ManifestRouter.tsx         — Einziger Router-Generator
  pages/
    admin/**                   — Zone 1 (kein Import aus portal/ oder zone3/)
    portal/**                  — Zone 2 (kein Import aus admin/ oder zone3/)
    zone3/**                   — Zone 3 (kein Import aus admin/ oder portal/)
  shared/                      — Zone-agnostische Business-Komponenten
  components/ui/**             — shadcn Primitives
  hooks/**                     — Globale Hooks
  integrations/**              — Supabase Client/Types
  goldenpath/                  — GP-Engine, Hooks, Guards
  lib/**                       — Utilities
spec/
  current/
    02_zones.md                — Dieses Dokument (ZBC)
    06_api_contracts/
      INDEX.md                 — Contract Index
      CONTRACT_*.md            — Einzelne Contracts
docs/
  golden-paths/                — Konsolidiert
```
