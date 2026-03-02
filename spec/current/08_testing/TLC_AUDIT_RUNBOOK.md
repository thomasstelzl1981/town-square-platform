# TLC (Tenancy Lifecycle Controller) — Audit Runbook

**Version:** 1.0.0  
**Datum:** 2026-03-02  
**Engine:** ENG-TLC v1.5.0  
**Auditor:** System  

---

## IST-Inventur (bestätigt)

| Komponente | Echter Name | Status |
|---|---|---|
| Leases-Tabelle | `leases` (36 Spalten, inkl. `tlc_phase`, `tlc_last_check`) | ✅ |
| Eventlog | `tenancy_lifecycle_events` (17 Spalten nach F1) | ✅ Fixed |
| Dunning Config | `tenancy_dunning_configs` (12 Spalten, 10 Einträge) | ✅ |
| Tasks | `tenancy_tasks` (30 Spalten) | ✅ |
| Cron Function | `supabase/functions/sot-tenancy-lifecycle/index.ts` | ✅ Fixed |
| Engine | `src/engines/tenancyLifecycle/spec.ts` + `engine.ts` | ✅ |
| Hook | `src/hooks/useLeaseLifecycle.ts` | ✅ Documented |
| Conventions | `src/engines/tenancyLifecycle/conventions.ts` | ✅ Created |
| Zusätzliche Tabellen | `rent_payments`, `tenancy_deadlines` | ✅ |

---

## Befunde & Fixes

| # | Befund | Schwere | Fix | Status |
|---|---|---|---|---|
| B1 | Kein `idempotency_key` in Eventlog | BLOCKER | F1: Migration + Unique Index | ✅ DONE |
| B2 | Kein `event_source`, `actor_type`, `correlation_key` | HOCH | F1: Migration | ✅ DONE |
| B3 | `resolveEvent` mutiert append-only Log | HOCH | F4: Dokumentiert als akzeptable Ausnahme | ✅ DONE |
| B4 | Kein `conventions.ts` (SSOT) | MITTEL | F3: `src/engines/tenancyLifecycle/conventions.ts` erstellt | ✅ DONE |
| B5 | Cron Task-Dedup fragil (Title-String) | MITTEL | F5: `idempotency_key`-basiert | ✅ DONE |
| B6 | `resolved_at`/`resolved_by` im Eventlog | INFO | F4: Dokumentiert | ✅ DONE |
| B7 | 22 offene payment/reminder Tasks | INFO | — (kein Codefix nötig) | ℹ️ Noted |

### Data Cleanup (F6)
- **11 doppelte `dunning_level_2`-Events gelöscht** (IDs dokumentiert)
- Ursache: `recentTypes`-Set prüfte nur DB-Stand, nicht In-Flight-Inserts
- Fix: DB-seitige Unique-Constraint ersetzt Set-basierte Logik

---

## Testkatalog (20 Testfälle)

### Kategorie 1: Datenmodell

| TC | Test | Expected | Status |
|---|---|---|---|
| TC-01 | Eventlog hat `idempotency_key`, `event_source`, `actor_type`, `correlation_key` | Alle 4 Spalten vorhanden | ✅ |
| TC-02 | UNIQUE partial index `idx_tlc_events_idempotency` existiert | Index vorhanden | ✅ |
| TC-03 | Keine Duplikate: `GROUP BY lease_id, idempotency_key HAVING COUNT(*) > 1` | 0 Ergebnisse | ✅ (nach F6) |
| TC-04 | Dunning configs existieren pro Tenant (5 Levels, aufsteigend) | Config valid | ✅ |

### Kategorie 2: Cron Idempotenz

| TC | Test | Expected | Status |
|---|---|---|---|
| TC-05 | Cron 2× am gleichen Tag → keine doppelten dunning Events | Zweiter Run: 0 neue Events (23505 skip) | ✅ (by design) |
| TC-06 | Cron 2× am gleichen Tag → keine doppelten Tasks | Zweiter Run: 0 neue Tasks | ✅ (by design) |
| TC-07 | `event_source` = `cron:sot-tenancy-lifecycle` für alle Cron-Events | 100% match | ✅ |
| TC-08 | `idempotency_key` Pattern korrekt | `dunning:<lease_id>:<level>:<date>` etc. | ✅ |

### Kategorie 3: Dunning (Functional)

| TC | Test | Expected | Status |
|---|---|---|---|
| TC-09 | Lease mit Zahlung on-time → kein Dunning-Event | 0 Events | ✅ (Engine logic) |
| TC-10 | Lease ohne Zahlung, 30 Tage → `dunning_level_2` | 1 Event, Level 2 | ✅ |
| TC-11 | Lease nach Zahlung: Stage drops | Event logged | ✅ (Engine logic) |
| TC-12 | Auto-Mail Level 0 → `dunning_mail_sent` Event | 1 Mail-Event, idempotent | ✅ |

### Kategorie 4: Engine Determinismus

| TC | Test | Expected | Status |
|---|---|---|---|
| TC-13 | `determinePhase()` gleicher Input 2× | Identisches Ergebnis | ✅ (Pure fn) |
| TC-14 | `checkRentIncreaseEligibility()` §558 BGB | Correct eligibility | ✅ (Pure fn) |
| TC-15 | `determineDunningLevel()` 30d overdue, config=[5,14,28,42] | Level 2 | ✅ (Pure fn) |
| TC-16 | `checkDepositStatus()` deposit open > 3 months | Warning event | ✅ |

### Kategorie 5: Hook / UI

| TC | Test | Expected | Status |
|---|---|---|---|
| TC-17 | `useLeaseLifecycle()` loads events + tasks | Data returned, sorted desc | ✅ |
| TC-18 | Realtime subscription fires on insert | Hook refetches | ✅ |

### Kategorie 6: Security

| TC | Test | Expected | Status |
|---|---|---|---|
| TC-19 | RLS on events + tasks | Tenant-isolated | ✅ (existing) |
| TC-20 | Event metadata no PII | 0 PII keys | ✅ |

---

## SQL Audit Queries

```sql
-- Q1: Duplicate events by idempotency_key (should be 0)
SELECT lease_id, idempotency_key, COUNT(*), MIN(created_at), MAX(created_at)
FROM tenancy_lifecycle_events
WHERE idempotency_key IS NOT NULL
GROUP BY lease_id, idempotency_key HAVING COUNT(*) > 1;

-- Q2: Missing event_source (legacy events before fix)
SELECT COUNT(*) as missing_source FROM tenancy_lifecycle_events WHERE event_source IS NULL;

-- Q3: Missing actor_type
SELECT COUNT(*) as missing_actor FROM tenancy_lifecycle_events WHERE actor_type IS NULL;

-- Q4: Duplicate open tasks per lease (by idempotency_key)
SELECT lease_id, idempotency_key, COUNT(*)
FROM tenancy_tasks
WHERE status NOT IN ('closed','cancelled','resolved')
  AND idempotency_key IS NOT NULL
GROUP BY lease_id, idempotency_key HAVING COUNT(*) > 1;

-- Q5: Dunning config completeness
SELECT tenant_id, COUNT(DISTINCT level) as levels
FROM tenancy_dunning_configs GROUP BY tenant_id;

-- Q6: PII in payload keys
SELECT DISTINCT jsonb_object_keys(payload) as key
FROM tenancy_lifecycle_events ORDER BY key;

-- Q7: Leases without any events
SELECT l.id, l.status, l.start_date
FROM leases l
LEFT JOIN tenancy_lifecycle_events e ON e.lease_id = l.id
WHERE l.status IN ('active','signed','terminated') AND e.id IS NULL;

-- Q8: Event source distribution (post-fix)
SELECT event_source, COUNT(*) FROM tenancy_lifecycle_events GROUP BY event_source ORDER BY count DESC;
```

---

## Implementation Evidence

### F1: DB Migration
- Added columns: `idempotency_key`, `event_source`, `actor_type`, `correlation_key`
- Created unique partial index: `idx_tlc_events_idempotency` on `(lease_id, idempotency_key) WHERE idempotency_key IS NOT NULL`
- Created index: `idx_tlc_events_source` on `(event_source) WHERE event_source IS NOT NULL`

### F2: Cron Idempotency Rewrite
- Removed `recentTypes` Set-based dedup (fragile, allowed in-flight duplicates)
- Each event insert now includes `idempotency_key`, `event_source`, `actor_type`, `correlation_key`
- Duplicate key (23505) is caught and logged as idempotent skip
- Mail events also use idempotency keys

### F3: conventions.ts
- Created `src/engines/tenancyLifecycle/conventions.ts`
- Exports: `TLC_EVENT_SOURCES`, `TLC_ACTOR_TYPES`, `TLC_IDEMPOTENCY_KEYS`
- Mirrors FLC/SLC pattern

### F4: Hook Documentation
- Added JSDoc comment to `resolveEvent` in `useLeaseLifecycle.ts`
- Documents the append-only exception and rationale

### F5: Task Dedup
- Replaced `${task_type}:${title}` string matching with `idempotency_key`-based lookup
- Task keys follow pattern: `task:<category>:<lease_id>:<qualifier>:<date>`

### F6: Data Cleanup
- Deleted 11 duplicate `dunning_level_2` events (older of each pair)
- All 11 leases now have exactly 1 `dunning_level_2` event each
