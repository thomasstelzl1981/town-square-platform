# Controller Pattern v1.0 — SSOT-Dokument

> Vergleichsmatrix + Homogenitäts-Checkliste + Global Smoketest Runbook
>
> Stand: 2026-03-02 | Gültig für: TLC v1.5, SLC v1.2, FLC v1.1, FDC v1.0

---

## 1) VERGLEICHSMATRIX

| Dimension | TLC (Tenancy) | SLC (Sales) | FLC (Financing) | FDC (Finance Data) |
|---|---|---|---|---|
| **A) Zweck** | Mietverhältnis-Lifecycle (Bewerbung → Auszug) | Verkaufs-Lifecycle (Erfassung → Settlement) | Finanzierungs-Lifecycle (Intake → Auszahlung) | Finance Data Governance (Registry + Integrity) |
| **B) Entity-Key** | `lease_id` | `case_id` (sales_cases) | `finance_request_id` | `tenant_id` + `entity_type` + `entity_id` |
| **C) SSOT-Quellen (read)** | leases, units, properties, tenancy_deadlines, tenancy_tasks, payment_schedule_entries, deposit_records, meter_readings | sales_cases, listings, units, properties, channel_projections, reservations, commissions | finance_requests, finance_mandates, future_room_cases, applicant_profiles, finance_packages, commissions, finance_submission_logs | bank_accounts, bank_account_meta, insurance_contracts, kv_contracts, vorsorge_contracts, pension_records, private_loans, loans, miety_homes/contracts/loans, legal_documents, properties, contract_candidates, user_consents |
| **D) Backbone-Tabellen (write)** | `tenancy_lifecycle_events` (append-only), `tenancy_tasks` (CRUD) | `sales_lifecycle_events` (append-only), `sales_cases` (phase update) | `finance_lifecycle_events` (append-only), `finance_mandates` (status), `commissions` (platform share) | `finance_data_registry` (CRUD), `finance_entity_links` (CRUD), `finance_repair_actions` (CRUD), `data_event_ledger` (append) |
| **E) Engine** | `src/engines/tenancyLifecycle/` — `spec.ts`, `engine.ts`, `conventions.ts` ✅ deterministic | `src/engines/slc/` — `spec.ts`, `engine.ts`, `conventions.ts` ✅ deterministic | `src/engines/flc/` — `spec.ts`, `engine.ts`, `conventions.ts` ✅ deterministic | `src/engines/fdc/` — `spec.ts`, `engine.ts`, `conventions.ts` ✅ deterministic |
| **F) Hook** | ❌ No dedicated hook (inline in TenancyTab) | `useSalesDeskListings`, `useSalesCases` (useSLCKpis) | `useFLCMonitorCases` | `useFinanceDataControl` |
| **G) Patrol/Cron** | `sot-tenancy-lifecycle` — weekly, per-lease candidate, idempotency via `lease_id+key` | `sot-slc-lifecycle` — daily 04:00, per-case candidate, idempotency via `case_id+key` | `sot-flc-lifecycle` — daily 03:00, per-request candidate, idempotency via `request_id+key` | `sot-fdc-patrol` — unscheduled (ready), per-tenant, idempotency via unique open constraint |
| **H) UI Control Plane** | Zone 2: MOD-04 TenancyTab; Zone 1: Property Desk (`/admin/property-desk`) | Zone 1: Sales Desk (`/admin/sales-desk`) — Dashboard, Veröffentlichungen, Monitor | Zone 1: Finance Desk (`/admin/finance-desk`) — Monitor, Fälle | Zone 2: MOD-18 Tab "Kontrolle" (`/portal/finanzanalyse` → KontrolleTab) |
| **I) Idempotency** | `UNIQUE(lease_id, idempotency_key) WHERE NOT NULL` on events | `UNIQUE(case_id, idempotency_key) WHERE NOT NULL` on events | `UNIQUE(finance_request_id, idempotency_key) WHERE NOT NULL` on events | `UNIQUE(tenant_id, entity_type, entity_id)` on registry; `UNIQUE(…, code, scope_key) WHERE status='open'` on actions; `UNIQUE(…, from/to/link_type)` on links |
| **J) Audit/Ledger** | Events = ledger (self-auditing via `tenancy_lifecycle_events`) | Events = ledger (self-auditing via `sales_lifecycle_events`) | Events = ledger (self-auditing via `finance_lifecycle_events`) | `data_event_ledger` (external ledger): `finance.registry.*`, `finance.links.*`, `finance.action.*` |
| **K) Security/RLS** | RESTRICTIVE tenant_id | RESTRICTIVE tenant_id | RESTRICTIVE tenant_id | RESTRICTIVE tenant_id; no external view; no exports |
| **L) Fail-States/Repair** | `tenancy_tasks` (open/in_progress/waiting/resolved/closed/cancelled) | Cron emits `case.stuck_detected` events; no repair table | Cron emits `case.stuck_detected` + `case.sla_breach` events; no repair table | `finance_repair_actions` (open/in_progress/resolved/suppressed) with inline UI resolution |

### Zusammenfassung pro Controller

**TLC**: Tiefster Feature-Scope (Dunning, NK, Mieterhöhung, Handover). Nutzt eigene Events + Tasks als duale Aktionsstruktur. Cron wöchentlich. Einziger Controller mit `ai` Actor-Type.

**SLC**: Cross-Modul (MOD-04/06/13). Channel Projection + Drift Detection via Hash-Vergleich. Cron täglich. Keine eigene Repair-Tabelle — Stuck wird als Event geloggt.

**FLC**: Cross-Zone (Z3→Z1→MOD-11). Quality Gates als Phase-Blocker. Commission Policy (25% Platform Share). Cron täglich. Keine eigene Repair-Tabelle.

**FDC**: Data-Governance (kein Lifecycle). Registry + Link Graph + Repair Actions. Coverage Scoring statt Phase-Tracking. Nutzt `data_event_ledger` statt eigener Eventlog-Tabelle. Einziger Controller ohne Phase-State-Machine.

---

## 2) HOMOGENITÄTS-CHECKLISTE (Controller Pattern v1.0)

### 2.1 Eventlog Pattern

| Check | TLC | SLC | FLC | FDC |
|---|---|---|---|---|
| Append-only events table | ✅ `tenancy_lifecycle_events` | ✅ `sales_lifecycle_events` | ✅ `finance_lifecycle_events` | ⬜ N/A (uses `data_event_ledger`) |
| `event_source` column | ✅ | ✅ | ✅ | ✅ (in ledger payload) |
| `actor_type` column | ✅ | ✅ | ✅ | ✅ (in ledger payload) |
| `idempotency_key` + unique index | ✅ `(lease_id, key)` | ✅ `(case_id, key)` | ✅ `(request_id, key)` | ⬜ N/A (actions use unique open constraint) |
| Key pattern in conventions.ts | ✅ `TLC_IDEMPOTENCY_KEYS` | ✅ `SLC_IDEMPOTENCY_KEYS` | ✅ `FLC_IDEMPOTENCY_KEYS` | ⬜ N/A |
| `phase_entered_at` from phase-change event | ❌ MISSING | ❌ MISSING | ✅ `FLC_PHASE_CHANGE_EVENTS` + snapshot | ⬜ N/A (no phases) |

**Align Plan:**
1. **TLC/SLC: Add `phase_entered_at` computation** — Currently TLC/SLC stuck detection uses `last_event_at` or `phaseEnteredAt` from case row. FLC correctly derives it from phase-change events via `FLC_PHASE_CHANGE_EVENTS`. Low risk, improves stuck-clock accuracy.

### 2.2 Action/Task Pattern

| Check | TLC | SLC | FLC | FDC |
|---|---|---|---|---|
| Dedicated task/action table | ✅ `tenancy_tasks` | ❌ No table (events only) | ❌ No table (events only) | ✅ `finance_repair_actions` |
| Status model | `open/in_progress/waiting/resolved/closed/cancelled` (6) | — | — | `open/in_progress/resolved/suppressed` (4) |
| Unique open constraint | ❌ MISSING (task dedup via cron logic) | — | — | ✅ `(tenant_id, code, entity_type, entity_id, scope_key) WHERE open` |
| `resolved_at` / `resolved_by` | ❌ (uses `resolved_at` but no `resolved_by`) | — | — | ✅ Both columns |
| Minimal payload | ✅ | — | — | ✅ |

**Align Plan:**
2. **TLC: Add unique open constraint on `tenancy_tasks`** — Add `UNIQUE(lease_id, task_category, idempotency_key) WHERE status IN ('open','in_progress')`. Low risk. Prevents duplicate task creation on cron rerun.
3. **TLC: Add `resolved_by` column** — Minor schema addition for audit trail parity with FDC. Low risk.

### 2.3 Patrol Pattern (Cron)

| Check | TLC | SLC | FLC | FDC |
|---|---|---|---|---|
| Candidate selection (not full scan) | ✅ Active leases only | ✅ Open cases only | ✅ Non-closed requests | ✅ Tenants with registry entries |
| Throttling per day/week/phase | ✅ Weekly + date in key | ✅ Daily + date in key | ✅ Daily + date in key | ✅ Unique open constraint |
| Idempotent writes | ✅ idempotency_key | ✅ idempotency_key | ✅ idempotency_key | ✅ ON CONFLICT DO NOTHING |
| Monitoring summary | ✅ Returns JSON summary | ✅ Returns JSON summary | ✅ Returns JSON summary | ✅ Returns JSON summary |

**Verdict: ✅ PASS — All four crons follow the same pattern.**

### 2.4 Projection/Link Pattern

| Check | TLC | SLC | FLC | FDC |
|---|---|---|---|---|
| Projection/Link table | ⬜ N/A | ✅ `channel_projections` (external drift) | ⬜ N/A | ✅ `finance_entity_links` (internal graph) |
| Unique constraint | — | ✅ `(listing_id, channel)` | — | ✅ `(tenant_id, from_type, from_id, to_type, to_id, link_type)` |
| Drift detection | — | ✅ `expected_hash` vs `last_synced_hash` | — | ⬜ N/A (no external sync) |
| No payload duplication | — | ✅ (refs + hashes only) | — | ✅ (refs only, no SSOT payloads) |

**Verdict: ✅ PASS — Both patterns correctly prevent duplicates and avoid payload duplication.**

### 2.5 Security Pattern (DSGVO/RLS)

| Check | TLC | SLC | FLC | FDC |
|---|---|---|---|---|
| RESTRICTIVE tenant_id | ✅ | ✅ | ✅ | ✅ |
| No anon/public access | ✅ | ✅ | ✅ | ✅ |
| No external view (FDC-specific) | — | — | — | ✅ (no exports, no share) |
| Audit payload minimization | ✅ (events are structural) | ✅ | ✅ | ✅ (ledger: IDs + codes only) |

**Verdict: ✅ PASS**

### 2.6 Engine File Structure

| Check | TLC | SLC | FLC | FDC |
|---|---|---|---|---|
| `spec.ts` (types, constants) | ✅ | ✅ | ✅ | ✅ |
| `engine.ts` (pure logic) | ✅ | ✅ | ✅ | ✅ |
| `conventions.ts` (event sources, keys) | ✅ | ✅ | ✅ | ✅ |
| Exported from `src/engines/index.ts` | ✅ | ✅ | ✅ | ✅ |
| Registered in ENGINE_REGISTRY.md | ✅ | ✅ | ✅ | ✅ |

**Verdict: ✅ PASS — Fully homogeneous 3-file pattern.**

### 2.7 Actor Types Consistency

| Actor | TLC | SLC | FLC | FDC |
|---|---|---|---|---|
| `user` | ✅ | ✅ | ✅ | ✅ |
| `system` | ✅ | ✅ | ✅ | ✅ |
| `cron` | ✅ | ✅ | ✅ | ✅ |
| `edge_fn` | ✅ | ✅ | ❌ MISSING | ❌ MISSING |
| `ai` | ✅ | ❌ | ❌ | ❌ |

**Align Plan:**
4. **FLC/FDC: Add `edge_fn` actor type** — FLC conventions.ts lacks `EDGE_FN`. FDC lacks it too. Minor addition for consistency.
5. **Consider removing `ai` from TLC or adding to all** — TLC has `ai` actor type, others don't. Decision: keep TLC-only since AI-driven events are TLC-specific (defect triage). Document as domain-specific extension.

---

## 3) GLOBAL SMOKETEST RUNBOOK

### 3.1 Fixtures Required

| Controller | Fixture | Source |
|---|---|---|
| **TLC** | 1 active lease with `payment_due_day`, 1 overdue scenario (missed payment) | `leases` + `payment_schedule_entries` |
| **SLC** | 1 sales_case with listing + 1 channel_projection (Kaufy) | `sales_cases` + `listings` + `channel_projections` |
| **FLC** | 1 finance_request + 1 finance_mandate (assigned) | `finance_requests` + `finance_mandates` |
| **FDC** | Registry backfill present + 1 bank_account without meta + 1 insurance without owner | `finance_data_registry` + `bank_accounts` + `insurance_contracts` |

### 3.2 Smoketest Cases

#### TLC (5 Cases)

| # | Given | When | Then |
|---|---|---|---|
| T1 | Active lease with rent due | TLC engine runs `analyzeLease()` | Events include `payment_missed` if overdue; dunning level correct |
| T2 | Dunning event already exists for today | Cron reruns | No duplicate event (idempotency_key blocks insert) |
| T3 | Lease in `active` phase for >30 days | Phase transition to `termination` | `phase_transition` event with correct from/to |
| T4 | Deposit partially paid | Cron computes | `deposit_partial` event + task created |
| T5 | Different tenant tries read | Query `tenancy_lifecycle_events` | 0 rows returned (RLS blocks) |

#### SLC (5 Cases)

| # | Given | When | Then |
|---|---|---|---|
| S1 | Sales case in `published` phase, 61 days old | `sot-slc-lifecycle` cron runs | `case.stuck_detected` event with `stuck:caseId:published:YYYY-MM-DD` key |
| S2 | Same case, cron runs again same day | Re-run cron | No duplicate stuck event (idempotency) |
| S3 | Listing published to Kaufy, title changed | Compute hash | `expected_hash ≠ last_synced_hash` → drift detected |
| S4 | Listing synced, hashes match | Check projection | `is_drifted = false` |
| S5 | Create channel_projection with same (listing_id, channel) | INSERT | Unique constraint violation (no duplicate) |

#### FLC (5 Cases)

| # | Given | When | Then |
|---|---|---|---|
| F1 | finance_request exists with no events | `computeFLCState(snapshot)` | Phase = `intake_received`, gates = CONTACT_GATE blocked |
| F2 | Manager accepted, intro emails pending | Compute state | Phase = `accepted_by_manager`, next action = send intro emails |
| F3 | Commission platform_share < 25% | Validate commission | Fails COMMISSION_GATE |
| F4 | `case.stuck_detected` for same request+phase+day exists | Cron re-emits | Blocked by idempotency_key unique index |
| F5 | Different tenant queries finance_lifecycle_events | SELECT | 0 rows (RLS) |

#### FDC (5 Cases)

| # | Given | When | Then |
|---|---|---|---|
| D1 | Registry backfill ran once (72 entries) | Run backfill SQL again | Count stays 72 (ON CONFLICT DO NOTHING) |
| D2 | bank_account has no bank_account_meta | `computeFinanceIntegrity()` | `ACCOUNT_META_MISSING` action (severity=warn) |
| D3 | Action ACCOUNT_META_MISSING open | User adds meta via UI | Action resolved, `resolved_at` + `resolved_by` set |
| D4 | insurance_contract without owner_person_id | Engine runs | `CONTRACT_OWNER_MISSING` action created |
| D5 | Control Tab rendered | Check UI | No export buttons, no share links, no signed URLs |

### 3.3 SQL Assertions

```sql
-- ═══ CROSS-CONTROLLER: Duplicate idempotency keys ═══

-- TLC: duplicate events
SELECT lease_id, idempotency_key, COUNT(*)
FROM tenancy_lifecycle_events
WHERE idempotency_key IS NOT NULL
GROUP BY 1,2 HAVING COUNT(*) > 1;
-- PASS: 0 rows

-- SLC: duplicate events
SELECT case_id, idempotency_key, COUNT(*)
FROM sales_lifecycle_events
WHERE idempotency_key IS NOT NULL
GROUP BY 1,2 HAVING COUNT(*) > 1;
-- PASS: 0 rows

-- FLC: duplicate events
SELECT finance_request_id, idempotency_key, COUNT(*)
FROM finance_lifecycle_events
WHERE idempotency_key IS NOT NULL
GROUP BY 1,2 HAVING COUNT(*) > 1;
-- PASS: 0 rows

-- ═══ FDC: Duplicate registry entries ═══
SELECT tenant_id, entity_type, entity_id, COUNT(*)
FROM finance_data_registry
GROUP BY 1,2,3 HAVING COUNT(*) > 1;
-- PASS: 0 rows

-- ═══ FDC: Duplicate open actions ═══
SELECT tenant_id, code, entity_type, entity_id, scope_key, COUNT(*)
FROM finance_repair_actions
WHERE status = 'open'
GROUP BY 1,2,3,4,5 HAVING COUNT(*) > 1;
-- PASS: 0 rows

-- ═══ FDC: Duplicate links ═══
SELECT tenant_id, from_type, from_id, to_type, to_id, link_type, COUNT(*)
FROM finance_entity_links
GROUP BY 1,2,3,4,5,6 HAVING COUNT(*) > 1;
-- PASS: 0 rows

-- ═══ CROSS-CONTROLLER: Missing event_source ═══
SELECT 'TLC' AS ctrl, COUNT(*) FROM tenancy_lifecycle_events WHERE event_source IS NULL
UNION ALL
SELECT 'SLC', COUNT(*) FROM sales_lifecycle_events WHERE event_source IS NULL
UNION ALL
SELECT 'FLC', COUNT(*) FROM finance_lifecycle_events WHERE event_source IS NULL;
-- PASS: all 0 (for new events post-migration; legacy may have NULLs)

-- ═══ SLC: Channel projection drift ═══
SELECT COUNT(*) AS drifted_count
FROM channel_projections
WHERE expected_hash IS DISTINCT FROM last_synced_hash
  AND expected_hash IS NOT NULL;
-- INFO: shows current drift count

-- ═══ FDC: Invalid resolved actions (missing resolved_at/by) ═══
SELECT COUNT(*) FROM finance_repair_actions
WHERE status = 'resolved' AND (resolved_at IS NULL OR resolved_by IS NULL);
-- PASS: 0 rows

-- ═══ CROSS-CONTROLLER: RLS sanity (run as anon) ═══
-- These should all return 0 rows when executed without auth:
-- SELECT COUNT(*) FROM tenancy_lifecycle_events;
-- SELECT COUNT(*) FROM sales_lifecycle_events;
-- SELECT COUNT(*) FROM finance_lifecycle_events;
-- SELECT COUNT(*) FROM finance_data_registry;
-- SELECT COUNT(*) FROM finance_repair_actions;
-- PASS: all 0 (RESTRICTIVE RLS blocks anon)
```

### 3.4 Smoketest Report Template

```
═══════════════════════════════════════════════
CONTROLLER SMOKETEST REPORT
═══════════════════════════════════════════════
Timestamp:    ____-__-__ __:__:__ UTC
Environment:  Preview / Production
Tester:       _______________

─── TLC ────────────────────────────────────
T1 Engine analysis:     [ PASS / FAIL ]
T2 Idempotency rerun:   [ PASS / FAIL ]
T3 Phase transition:     [ PASS / FAIL ]
T4 Deposit partial:      [ PASS / FAIL ]
T5 RLS cross-tenant:     [ PASS / FAIL ]
SQL: duplicate idem keys: [ 0 = PASS / N = FAIL ]

─── SLC ────────────────────────────────────
S1 Stuck detection:      [ PASS / FAIL ]
S2 Idempotency rerun:    [ PASS / FAIL ]
S3 Drift detection:      [ PASS / FAIL ]
S4 No false drift:       [ PASS / FAIL ]
S5 Link unique:          [ PASS / FAIL ]
SQL: duplicate idem keys: [ 0 = PASS / N = FAIL ]
SQL: drift count:         [ N (info) ]

─── FLC ────────────────────────────────────
F1 Phase computation:    [ PASS / FAIL ]
F2 Gate blocking:        [ PASS / FAIL ]
F3 Commission policy:    [ PASS / FAIL ]
F4 Idempotency rerun:    [ PASS / FAIL ]
F5 RLS cross-tenant:     [ PASS / FAIL ]
SQL: duplicate idem keys: [ 0 = PASS / N = FAIL ]

─── FDC ────────────────────────────────────
D1 Backfill idempotent:  [ PASS / FAIL ]
D2 Engine ACCOUNT_META:  [ PASS / FAIL ]
D3 Action resolution:    [ PASS / FAIL ]
D4 CONTRACT_OWNER:       [ PASS / FAIL ]
D5 No external view:     [ PASS / FAIL ]
SQL: duplicate registry:  [ 0 = PASS / N = FAIL ]
SQL: duplicate open acts: [ 0 = PASS / N = FAIL ]
SQL: duplicate links:     [ 0 = PASS / N = FAIL ]
SQL: invalid resolved:    [ 0 = PASS / N = FAIL ]

─── OVERALL ────────────────────────────────
Total Cases:   20
Passed:        __
Failed:        __
Regressions:   __ (list)
═══════════════════════════════════════════════
```

---

## 4) TOP 5 ALIGNMENTS (Prioritized)

| # | Area | File/Table | Change | Risk | Benefit |
|---|---|---|---|---|---|
| 1 | **TLC: Unique open constraint on tasks** | `tenancy_tasks` table | Add `UNIQUE(lease_id, category, idempotency_key) WHERE status IN ('open','in_progress')` via migration | Low — additive index | Prevents duplicate tasks on cron rerun (parity with FDC) |
| 2 | **TLC: Add `resolved_by`** | `tenancy_tasks` table | `ALTER TABLE tenancy_tasks ADD COLUMN resolved_by UUID NULL` | Low — additive column | Audit trail parity with FDC actions |
| 3 | **TLC/SLC: `phase_entered_at` from events** | Engine logic + cron functions | Compute `phase_entered_at` from last phase-changing event (not `last_event_at`) | Medium — logic change in cron | Accurate stuck-clock (FLC already does this correctly) |
| 4 | **FLC/FDC: Add `edge_fn` actor type** | `src/engines/flc/conventions.ts`, `src/engines/fdc/conventions.ts` | Add `EDGE_FN: 'edge_fn'` to actor types | Trivial | Consistency across all 4 controllers |
| 5 | **Unified conventions import** | New `src/engines/shared/controllerConventions.ts` | Extract common actor types + status models into shared file; controllers import + extend | Low — additive file | Single source for `user/system/cron/edge_fn/ai` + `open/in_progress/resolved/suppressed` |

---

## Appendix: File Index

| Controller | spec.ts | engine.ts | conventions.ts | Cron | Hook | UI |
|---|---|---|---|---|---|---|
| TLC | `src/engines/tenancyLifecycle/spec.ts` | `src/engines/tenancyLifecycle/engine.ts` | `src/engines/tenancyLifecycle/conventions.ts` | `supabase/functions/sot-tenancy-lifecycle/` | (inline TenancyTab) | MOD-04 TenancyTab, Z1 PropertyDesk |
| SLC | `src/engines/slc/spec.ts` | `src/engines/slc/engine.ts` | `src/engines/slc/conventions.ts` | `supabase/functions/sot-slc-lifecycle/` | `useSalesDeskListings`, `useSalesCases` | Z1 SalesDesk |
| FLC | `src/engines/flc/spec.ts` | `src/engines/flc/engine.ts` | `src/engines/flc/conventions.ts` | `supabase/functions/sot-flc-lifecycle/` | `useFLCMonitorCases` | Z1 FinanceDesk |
| FDC | `src/engines/fdc/spec.ts` | `src/engines/fdc/engine.ts` | `src/engines/fdc/conventions.ts` | `supabase/functions/sot-fdc-patrol/` | `useFinanceDataControl` | MOD-18 KontrolleTab |
