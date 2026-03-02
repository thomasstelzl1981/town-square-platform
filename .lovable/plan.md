

# Plan: Property Desk + ENG-TLC/ENG-SLC in Armstrong + GP-VERKAUF

INFRA-goldenpath is **UNFROZEN** for this session.

---

## 3 Work Packages

### 1. Property Desk (Zone 1) — TLC-Governance-Zentrale

New operative desk following the ProjektDesk/SalesDesk pattern. Central hub for tenancy lifecycle monitoring.

**Tabs:** Dashboard (KPIs: active leases, open tasks, critical events, overdue payments) | TLC Monitor (events + tasks from `tenancy_lifecycle_events` / `tenancy_tasks`) | Leases (all leases systemwide) | Mahnwesen (dunning configs) | Process Health (embed existing `ProcessHealthTab` filtered to TLC)

**Files:**
| File | Action |
|------|--------|
| `src/pages/admin/desks/PropertyDesk.tsx` | NEW — Full desk with 5 tabs, using `OperativeDeskShell` |
| `src/pages/admin/desks/index.ts` | EDIT — Add `PropertyDesk` export |
| `src/router/Zone1Router.tsx` | EDIT — Add `property-desk` to `adminDeskMap` + `DESK_PREFIXES` |
| `src/manifests/operativeDeskManifest.ts` | EDIT — Add Property Desk definition |

**Zone-Flow:** Z2 (MOD-04 Immobilien) → Z1 (Property Desk) → Z2 (MOD-20 Miety)

---

### 2. ENG-TLC + ENG-SLC in Armstrong Engine Registry

Add both orchestration engines to `ArmstrongEngines.tsx` with a new `orchestration` category.

**File:** `src/pages/admin/armstrong/ArmstrongEngines.tsx`
- Add `'orchestration'` to `EngineCategory` type + `CATEGORY_CONFIG`
- Add ENG-TLC entry: status `live`, module `MOD-04/MOD-00`, billing `Free + KI (1 Credit/Run)`, capabilities: Phase-Tracking, Mahnwesen, CRON weekly, KI-Summary
- Add ENG-SLC entry: status `partial`, module `MOD-04/MOD-06/MOD-13`, billing `Free + KI (1 Credit/Run)`, capabilities: 11-Phase State Machine, Drift-Detection, Stuck-Detection, CRON daily
- Show capabilities detail for orchestration engines (same as data/ai)

---

### 3. GP-VERKAUF Golden Path (SLC Workflow)

New 11-step Golden Path for the Sales Lifecycle Controller.

**Files:**
| File | Action |
|------|--------|
| `src/manifests/goldenPaths/GP_VERKAUF.ts` | NEW — 11 steps matching SLC phases, fail-states on cross-zone steps |
| `src/manifests/goldenPaths/index.ts` | EDIT — Export + register GP-VERKAUF, add SLC events to LEDGER_EVENT_WHITELIST |
| `src/goldenpath/contextResolvers.ts` | EDIT — Add GP-VERKAUF resolver (reads `sales_cases` phase → flags) |
| `src/pages/admin/armstrong/ArmstrongGoldenPaths.tsx` | EDIT — Add GP-VERKAUF to ENGINE_WORKFLOWS array |
| `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md` | EDIT — Document GP-VERKAUF |

**GP-VERKAUF Context Resolver Flags:**
`case_exists`, `mandate_active`, `published`, `inquiry_received`, `reserved`, `contract_drafted`, `notary_scheduled`, `notary_completed`, `handover_done`, `settlement_approved`, `case_closed`

**GP-VERKAUF Steps (11):**
1. Mandat aktiviert (MOD-13/MOD-04 → Z1)
2. Veröffentlicht (Z1 → Z3)
3. Anfrage eingegangen (Z3 → Z1)
4. Reserviert (Z1 → Z2)
5. Kaufvertragsentwurf
6. Notartermin vereinbart
7. Beurkundet
8. Übergabe
9. Abrechnung/Settlement
10. Abgeschlossen (won)
11. Abgeschlossen (lost) — branching fail-state

---

## Summary: 11 Files

| # | File | Action |
|---|------|--------|
| 1 | `src/pages/admin/desks/PropertyDesk.tsx` | NEW |
| 2 | `src/pages/admin/desks/index.ts` | EDIT |
| 3 | `src/router/Zone1Router.tsx` | EDIT |
| 4 | `src/manifests/operativeDeskManifest.ts` | EDIT |
| 5 | `src/pages/admin/armstrong/ArmstrongEngines.tsx` | EDIT |
| 6 | `src/manifests/goldenPaths/GP_VERKAUF.ts` | NEW |
| 7 | `src/manifests/goldenPaths/index.ts` | EDIT |
| 8 | `src/goldenpath/contextResolvers.ts` | EDIT |
| 9 | `src/pages/admin/armstrong/ArmstrongGoldenPaths.tsx` | EDIT |
| 10 | `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md` | EDIT |
| 11 | `spec/current/06_engines/ENGINE_REGISTRY.md` | EDIT (update orchestration section) |

