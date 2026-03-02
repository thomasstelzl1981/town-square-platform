

# TLC Prüf-Audit — Befunde + Fixes + Testkatalog

## IST-Inventur (echte Namen bestätigt)

| Komponente | Echter Name |
|---|---|
| Leases-Tabelle | `leases` (36 Spalten, inkl. `tlc_phase`, `tlc_last_check`) |
| Eventlog | `tenancy_lifecycle_events` (13 Spalten, **kein `idempotency_key`**) |
| Dunning Config | `tenancy_dunning_configs` (12 Spalten, 10 Einträge) |
| Tasks | `tenancy_tasks` (30 Spalten, 22 offene) |
| Cron Function | `supabase/functions/sot-tenancy-lifecycle/index.ts` (737 Zeilen) |
| Engine | `src/engines/tenancyLifecycle/spec.ts` + `engine.ts` (1031 Zeilen) |
| Hook | `src/hooks/useLeaseLifecycle.ts` |
| Conventions | **FEHLT** (kein `src/engines/tenancyLifecycle/conventions.ts`) |
| Zusätzliche Tabellen | `rent_payments`, `tenancy_deadlines` (beide existieren) |

## Kritische Befunde (7 Gaps)

### B1: **BLOCKER** — Kein `idempotency_key` in Eventlog
Die Tabelle `tenancy_lifecycle_events` hat **keine** `idempotency_key`-Spalte und keinen Unique-Index. Das Cron produziert bereits **reale Duplikate**: Jede der 11 aktiven Leases hat 2x `dunning_level_2`-Events vom gleichen Cron-Run (2026-03-02 01:21, ~50ms Abstand).

**Ursache im Code:** Die Dedup-Logik (Zeile 549-552) nutzt ein `recentTypes`-Set, aber der Cron erzeugt pro Lease **zwei** Events gleichen Typs aus verschiedenen `missedMonths` (6 Monate Lookback → mehrere Monate missing → eine Dunning-Berechnung wird zum worst-case aggregiert, ABER die `events[]` Array-Logik pushed manchmal duplicates weil `payment_missed` und `dunning_level_X` beide gepushed werden, und `recentTypes` nur auf den DB-Stand checkt, nicht auf In-Flight-Inserts).

### B2: **HOCH** — Kein `event_source`, `actor_type`, `correlation_key` 
Diese Audit-Felder fehlen komplett in der DB-Tabelle. Nur `triggered_by` existiert (als einfacher String). Im Vergleich zu FLC/SLC fehlt die Provenance-Kette.

### B3: **HOCH** — `resolveEvent` mutiert append-only Log
`useLeaseLifecycle.ts` Zeile 121-126 macht ein `UPDATE` auf `tenancy_lifecycle_events` (`resolved_at`, `resolved_by`). Das verletzt das append-only Prinzip. Resolution sollte ein eigenes Event sein oder in `tenancy_tasks` stattfinden.

### B4: **MITTEL** — Kein `conventions.ts` (SSOT)
FLC und SLC haben beide eine `conventions.ts`. TLC hat keine — Event-Typen, Sources und Idempotency-Patterns sind nicht standardisiert.

### B5: **MITTEL** — Cron Task-Dedup fragil
Task-Dedup (Zeile 620) basiert auf `title`-String-Matching. Wenn der Title sich leicht ändert (z.B. verschiedene Monatsanzahlen), werden Duplikate erzeugt.

### B6: **INFO** — `resolved_at`/`resolved_by` Spalten im Eventlog
Diese existieren und werden genutzt (Update-Pattern). Für echte append-only müssten Resolution-Events stattdessen geschrieben werden — aber das ist ein größerer Umbau.

### B7: **INFO** — 22 offene `payment/reminder` Tasks
Alle 22 offenen Tasks sind payment reminders. Keine Task-Diversität sichtbar (keine deposit/rent_increase/move_out Tasks).

## Fixes (6 Stück)

| # | Fix | Aufwand | Prio |
|---|---|---|---|
| F1 | DB Migration: `idempotency_key`, `event_source`, `actor_type`, `correlation_key` + UNIQUE partial index | S | **Blocker** |
| F2 | `sot-tenancy-lifecycle`: Idempotency-Keys für alle Event-Inserts einbauen + `recentTypes`-Dedup durch DB-Unique ersetzen | M | **Blocker** |
| F3 | `src/engines/tenancyLifecycle/conventions.ts` erstellen (SSOT: Sources, Keys, Actor Types) | S | Hoch |
| F4 | `useLeaseLifecycle.ts`: `resolveEvent` als neues Event statt Update (optional: beibehalten aber dokumentieren) | S | Mittel |
| F5 | Cron Task-Dedup: `idempotency_key`-basiert statt Title-String | S | Mittel |
| F6 | Cleanup: 11 doppelte `dunning_level_2`-Events löschen (Data-Fix) | XS | Sofort |

## Testkatalog (20 Testfälle)

### Kategorie 1: Datenmodell

| TC | Test | Expected |
|---|---|---|
| TC-01 | Eventlog hat `idempotency_key`, `event_source`, `actor_type`, `correlation_key` | Alle 4 Spalten vorhanden |
| TC-02 | UNIQUE partial index auf `(lease_id, idempotency_key) WHERE idempotency_key IS NOT NULL` | Index existiert |
| TC-03 | Keine Duplikate: `GROUP BY lease_id, idempotency_key HAVING COUNT(*) > 1` | 0 Ergebnisse |
| TC-04 | Dunning configs existieren pro Tenant (5 Levels, aufsteigend) | Config valid |

### Kategorie 2: Cron Idempotenz

| TC | Test | Expected |
|---|---|---|
| TC-05 | Cron 2× am gleichen Tag → keine doppelten dunning Events | Zweiter Run: 0 neue Events (23505 skip) |
| TC-06 | Cron 2× am gleichen Tag → keine doppelten Tasks | Zweiter Run: 0 neue Tasks |
| TC-07 | `event_source` = `cron:sot-tenancy-lifecycle` für alle Cron-Events | 100% match |
| TC-08 | `idempotency_key` Pattern: `dunning:<lease_id>:<level>:<YYYY-MM-DD>` | Korrekt |

### Kategorie 3: Dunning (Functional)

| TC | Test | Expected |
|---|---|---|
| TC-09 | Lease mit Zahlung on-time → kein Dunning-Event | 0 Events |
| TC-10 | Lease ohne Zahlung, 30 Tage → `dunning_level_2` (days_after_due=28) | 1 Event, Level 2 |
| TC-11 | Lease nach Zahlung: Stage drops | Event logged, open dunning tasks resolved |
| TC-12 | Auto-Mail Level 0 → `dunning_mail_sent` Event | 1 Mail-Event, idempotent |

### Kategorie 4: Engine Determinismus

| TC | Test | Expected |
|---|---|---|
| TC-13 | `determinePhase()` gleicher Input 2× | Identisches Ergebnis |
| TC-14 | `checkRentIncreaseEligibility()` §558 BGB: lease from 2018, no prior increase | `isEligible = true` |
| TC-15 | `determineDunningLevel()` 30 days overdue, config=[5,14,28,42] | Level 2 |
| TC-16 | `checkDepositStatus()` deposit open > 3 months | Warning event candidate |

### Kategorie 5: Hook / UI

| TC | Test | Expected |
|---|---|---|
| TC-17 | `useLeaseLifecycle()` loads events + tasks for a lease | Data returned, sorted desc |
| TC-18 | Realtime subscription fires on new event insert | Hook refetches |

### Kategorie 6: Security

| TC | Test | Expected |
|---|---|---|
| TC-19 | RESTRICTIVE RLS: `tenant_isolation_restrictive` on events + tasks | Policy exists, blocks cross-tenant |
| TC-20 | Event metadata contains no PII (email, phone, address) as top-level keys | 0 PII keys |

## SQL Audit Queries

```sql
-- Duplicate events (current state — should be 0 after fix)
SELECT lease_id, event_type, COUNT(*), MIN(created_at), MAX(created_at)
FROM tenancy_lifecycle_events
GROUP BY lease_id, event_type HAVING COUNT(*) > 1;

-- Missing event_source (after fix)
SELECT COUNT(*) FROM tenancy_lifecycle_events WHERE event_source IS NULL;

-- Duplicate open tasks per lease
SELECT lease_id, task_type, title, COUNT(*)
FROM tenancy_tasks
WHERE status NOT IN ('closed','cancelled','resolved')
GROUP BY lease_id, task_type, title HAVING COUNT(*) > 1;

-- Dunning config completeness
SELECT tenant_id, COUNT(DISTINCT level) as levels
FROM tenancy_dunning_configs GROUP BY tenant_id;

-- PII in payload
SELECT DISTINCT jsonb_object_keys(payload) as key
FROM tenancy_lifecycle_events ORDER BY key;

-- Leases without any events
SELECT l.id, l.status, l.start_date
FROM leases l
LEFT JOIN tenancy_lifecycle_events e ON e.lease_id = l.id
WHERE l.status IN ('active','signed','terminated') AND e.id IS NULL;
```

## Implementation Plan

1. **F6** (Data cleanup): Delete 11 duplicate `dunning_level_2` rows
2. **F1** (Migration): Add 4 columns + unique index to `tenancy_lifecycle_events`
3. **F3** (Conventions): Create `src/engines/tenancyLifecycle/conventions.ts`
4. **F2** (Cron fix): Rewrite dedup logic using idempotency_key inserts with `ON CONFLICT DO NOTHING`
5. **F5** (Task dedup): Switch from title-matching to idempotency-based dedup
6. **F4** (Hook): Document append-only exception for `resolved_at` (keep current behavior, add code comment)
7. **Doc**: Create `spec/current/08_testing/TLC_AUDIT_RUNBOOK.md`

