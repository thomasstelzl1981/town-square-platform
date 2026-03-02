

# Phase 3 Ergebnisse + Codex-Prompt

## Phase 3: Laufzeit-Checks — Ergebnisse

| Check | Status | Details |
|-------|--------|---------|
| **RLS Linter** | ⚠️ 3 Warnings | `armstrong_chat_sessions`, `mail_campaigns/*`, `user_outbound_identities` haben `USING(true)` auf ALL/INSERT/UPDATE — aber alle sind Service-Role-only Policies, kein User-Facing Risk |
| **Auth Logs (Errors)** | ✅ Keine Fehler | Kein einziger Auth-Error in den letzten Logs |
| **Postgres Logs (Errors)** | ✅ Keine Fehler | Keine ERROR/FATAL/PANIC Eintraege |
| **Edge Function Errors** | ✅ Keine 4xx/5xx | Alle Requests erfolgreich |
| **RLS ohne Tabelle** | ✅ 0 Tabellen | Alle public-Tabellen haben RLS enabled |
| **USING(true) Audit** | ✅ Akzeptabel | 35 Policies mit `USING(true)` — alle SELECT-only auf Katalog-/Template-Tabellen (doc_type_catalog, tile_catalog, interest_rates, etc.) |
| **RESTRICTIVE Policies** | ⚠️ Luecken | ~60 Tabellen ohne RESTRICTIVE Policy (acq_analysis_runs, agreement_templates, audit_events, brand_articles, etc.) |
| **OTP Expiry** | ⚠️ | OTP laeuft zu lange — empfohlenes Limit einhalten |
| **Leaked PW Protection** | ⚠️ | Deaktiviert — sollte fuer Production aktiviert werden |

### Fazit Phase 3
Das System ist **laufzeitstabil** — keine Fehler in Auth, DB oder Edge Functions. Die verbleibenden RLS-Warnings betreffen Service-Role-Policies und Katalog-Tabellen. Die ~60 Tabellen ohne RESTRICTIVE Policy sollten priorisiert gehaertet werden (Codex kann hier die vollstaendige Liste liefern).

---

## Codex/GitHub Copilot Prompt

Hier ist der produktionsreife Prompt, zugeschnitten auf euer Repo:

```text
# Deep System Audit — SystemOfATown Repository

Analyze this repository comprehensively. Output ALL findings as a markdown 
table with columns: File | Line | Finding | Severity (P0/P1/P2/P3)

## 1. DEAD CODE DETECTION

Find all exported functions, types, interfaces, and constants that are 
NEVER imported or referenced anywhere else in the codebase.

Focus directories:
- src/engines/** (15 engines: akquiseCalc, bewirtschaftung, demoData, 
  finanzierung, finanzuebersicht, kontoMatch, marketDirectory, nkAbrechnung, 
  projektCalc, provision, slc, tenancyLifecycle, tripEngine, vorsorgeluecke, vvSteuer)
- src/hooks/** (all custom hooks)
- src/manifests/** (routesManifest, areaConfig, armstrongManifest, goldenPathProcesses)
- src/goldenpath/** (contextResolvers, registry)
- src/config/** (demoDataRegistry, storageManifest, systemWidgets, parserManifest)
- src/components/shared/** (shared UI components)

For each dead export, state: export name, file, whether it's a function/type/const.
Exclude: type-only exports used in .d.ts files.

## 2. TYPE SAFETY VIOLATIONS

Find ALL occurrences of:
- `as any` 
- `as never`
- `as unknown` (when used to bypass type checks, not for legitimate narrowing)
- `@ts-ignore`
- `@ts-expect-error`
- `// eslint-disable` 

List file:line:column for each. Flag P0 if in src/engines/** or supabase/functions/**.

## 3. ENGINE ↔ CRON CONSISTENCY

Compare each Edge Function cron against its client-side engine counterpart:

| Edge Function | Client Engine |
|---------------|---------------|
| supabase/functions/sot-slc-lifecycle/index.ts | src/engines/slc/engine.ts + spec.ts |
| supabase/functions/sot-tenancy-lifecycle/index.ts | src/engines/tenancyLifecycle/engine.ts + spec.ts |
| supabase/functions/sot-rent-arrears-check/index.ts | src/engines/tenancyLifecycle/engine.ts |
| supabase/functions/sot-msv-reminder-check/index.ts | (check for client counterpart) |
| supabase/functions/sot-rent-match/index.ts | src/engines/kontoMatch/engine.ts |

Check for:
- Threshold mismatches (e.g., 0.95 vs 0.5 tolerance)
- Duplicated business logic (logic in cron that should be imported from engine)
- Missing error handling in crons vs engines
- Version string mismatches between spec.ts and engine.ts headers

## 4. QUERY PERFORMANCE (N+1 PATTERNS)

Find all Supabase queries (`supabase.from(`, `.select(`, `.insert(`, `.update(`) 
that are called inside:
- `.map()` callbacks
- `for` / `for...of` / `while` loops
- `.forEach()` callbacks
- React component render functions (not in useEffect/useQuery)

Focus on:
- supabase/functions/**/index.ts (edge functions with loops)
- src/hooks/** (hooks with sequential queries)
- src/pages/** (inline queries)

## 5. UNUSED DEPENDENCIES

Cross-reference package.json dependencies with actual imports across 
ALL .ts/.tsx files. List any dependency that is:
- Never imported anywhere
- Only imported in commented-out code
- Imported but the import is never used (tree-shaking candidate)

## 6. MANIFEST ↔ ROUTING CONSISTENCY

Verify synchronization between:
- src/manifests/routesManifest.ts (TileDefinitions, zone2Portal, zone3Websites)
- src/router/Zone1Router.tsx
- src/router/Zone2Router.tsx  
- src/router/Zone3Router.tsx
- src/manifests/areaConfig.ts

Check:
- Every module in routesManifest has a corresponding lazy route
- Every zone3Website has a route in Zone3Router
- No orphan routes (routes without manifest entries)
- Tile counts match between manifest and actual rendered tiles

## 7. GOLDEN PATH COMPLETENESS

For each Golden Path in src/manifests/goldenPaths/:
- Verify every step has: on_timeout, on_rejected, on_error fail states
- Verify every ledger_event in steps is whitelisted in goldenPaths/index.ts
- Verify every step's event_type has a corresponding entry in the 
  relevant engine's EVENT_PHASE_MAP (SLC or TLC)
- Check contextResolvers.ts: every flag set in the resolver must 
  correspond to an actual database query (no fake/hardcoded flags)

## 8. CROSS-ZONE IMPORT VIOLATIONS

Verify strict zone separation:
- Files in src/components/armstrong/** must NOT import from src/components/<module>/
- Files in src/pages/portal/** must NOT import from src/components/armstrong/**
- Files in src/pages/zone3/** must NOT import from src/components/<module>/ or 
  src/components/armstrong/**
- Only src/components/shared/** and src/components/ui/** may be imported cross-zone

## 9. DEMO DATA GOVERNANCE

Check for hardcoded mock/demo data violations:
- Search for `const MOCK_`, `const DEMO_`, `const FAKE_`, `const SAMPLE_` 
  in src/components/** and src/pages/**
- Search for inline arrays with fake names, addresses, phone numbers, emails
- Verify all demo data references point to public/demo-data/ files
- Check that src/config/demoDataRegistry.ts covers all demo data sources

## 10. SECURITY — SUPABASE CLIENT USAGE

Find any instance of:
- `supabase.rpc("execute_sql"` or similar raw SQL execution
- Unparameterized queries or string concatenation in query filters
- `SUPABASE_SERVICE_ROLE_KEY` usage outside of supabase/functions/
- Direct access to auth.users table from client code
- localStorage/sessionStorage used for role/permission checks

Output format: Group findings by category, then sort by severity within each group.
```

---

## Naechste Schritte

1. **Codex-Prompt ausfuehren** — Kopiere den Prompt oben in Codex/GitHub Copilot auf eurem Repo
2. **Ergebnisse hier einspielen** — Poste die Codex-Findings hier, ich priorisiere und implementiere
3. **Phase 4 hier starten** — Modul-Smoke-Tests (Module 4, 5, 6, 8, 9, 13) auf Manifest/Route-Konsistenz
4. **RLS Haertung** — Die ~60 Tabellen ohne RESTRICTIVE Policy systematisch abarbeiten

