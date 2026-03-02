# FLC Prüf-Audit — Testkatalog & Runbook

> Version: 1.0 | Stand: 2026-03-02 | Scope: Welle 1 + 1.5

## Fix-Status (A1–A5)

| # | Fix | Status |
|---|-----|--------|
| A1 | RLS INSERT Policy für authenticated Users | ✅ Done |
| A2 | Monitor auf FLC umgebaut (useFLCMonitorCases) | ✅ Done |
| A3 | `phase`-Feld in Edge Function Event-Inserts | ✅ Done |
| A4 | `finance_packages` Join in useFLCMonitorCases | ✅ Done |
| A5 | pg_cron Schedule (Mo–Fr 03:00 UTC) | ✅ Done |

---

## Testkatalog (25 Testfälle)

### Kategorie 1: Datenmodell (DB-Struktur)

| TC | Test | Erwartung |
|----|------|-----------|
| TC-01 | Eventlog-Schema vorhanden | 12 Spalten (id, finance_request_id, finance_mandate_id, future_room_case_id, event_type, phase, actor_id, actor_type, event_source, idempotency_key, correlation_key, metadata, created_at) |
| TC-02 | Idempotency-Index | UNIQUE(finance_request_id, idempotency_key) WHERE idempotency_key IS NOT NULL |
| TC-03 | Commission Default 25% | `column_default = 25` |
| TC-04 | Keine Legacy 30% | 0 Ergebnisse bei Audit-Query |

### Kategorie 2: Event-Emission

| TC | Test | Erwartung |
|----|------|-----------|
| TC-05 | Z3 Intake → case.created | event_type='case.created', phase='intake_received', event_source enthält 'edge_fn:' |
| TC-06 | Z3 Intake Idempotenz | Zweiter Insert → 23505, kein Duplikat |
| TC-07 | Manager Acceptance → 3 Events | manager.accepted (phase=accepted_by_manager) + email.customer_intro_sent (phase=intro_emails_sent) + commission.terms_accepted (phase=commission_terms_ready) |
| TC-08 | Email Idempotenz | Retry → `{skipped: true, reason: 'idempotent'}` |
| TC-09 | Manager-Email enthält 25% | HTML enthält "25%" und "Plattformanteil" |

### Kategorie 3: Engine (Computed State)

| TC | Test | Erwartung |
|----|------|-----------|
| TC-10 | Determinismus | Gleicher Snapshot 2× → identisches Ergebnis |
| TC-11 | Phase approved aus Snapshot | bank_response='approved' → Phase = approved |
| TC-12 | DATAROOM_GATE ≠ Docs | completion_score=60 + package_status='complete' → DATAROOM failed, SUBMISSION passed |
| TC-13 | COMMISSION_GATE | platform_share_pct=30 → COMMISSION_GATE failed + RA_FIX_COMMISSION_SHARE |
| TC-14 | Stuck-Clock Phase-Change | Phase seit 4d, letztes Event gestern → isStuck=true (4 > 3d) |

### Kategorie 4: Cron-Patrol

| TC | Test | Erwartung |
|----|------|-----------|
| TC-15 | Stuck Detection | assigned_to_manager seit 5d → case.stuck_detected |
| TC-16 | SLA Breach | assigned_to_manager seit 8d → case.sla_breach |
| TC-17 | Tages-Idempotenz | Cron 2× am Tag → kein zusätzliches Event |
| TC-18 | Terminal Skip | status='completed' → kein Event |

### Kategorie 5: UI (Finance Desk)

| TC | Test | Erwartung |
|----|------|-----------|
| TC-19 | Fälle-Liste | Tabelle zeigt Phase-Badge, Fortschrittsbalken, Stuck-Badge |
| TC-20 | Timeline Expand | Events chronologisch mit Typ + Source + Timestamp |
| TC-21 | Blocking Gates | DATAROOM_GATE mit Message bei fehlender Selbstauskunft |
| TC-22 | Monitor KPIs | Stuck-Count + SLA-Breach-Count (NICHT alte Leads-Stats) |

### Kategorie 6: Security & DSGVO

| TC | Test | Erwartung |
|----|------|-----------|
| TC-23 | RLS Tenant-Isolation | User Tenant A kann keine Events Tenant B sehen |
| TC-24 | Kein PII in metadata | Keine email/phone/address als Top-Level Keys |
| TC-25 | Anon kann keine Events lesen | 0 Ergebnisse ohne Auth |

---

## SQL-Audit-Queries

```sql
-- TC-04: Legacy 30% Commission Check
SELECT id, reference_id, reference_type, platform_share_pct, status
FROM commissions
WHERE reference_type IN ('finance_mandate', 'finance_request')
  AND platform_share_pct != 25
  AND status IN ('pending', 'approved');

-- TC-06: Duplicate Idempotency Check
SELECT finance_request_id, idempotency_key, COUNT(*)
FROM finance_lifecycle_events
WHERE idempotency_key IS NOT NULL
GROUP BY 1, 2
HAVING COUNT(*) > 1;

-- Event Coverage: Fälle ohne case.created
SELECT fr.id, fr.public_id, fr.status, fr.submitted_at
FROM finance_requests fr
LEFT JOIN finance_lifecycle_events e
  ON e.finance_request_id = fr.id AND e.event_type = 'case.created'
WHERE fr.status NOT IN ('draft')
  AND e.id IS NULL
ORDER BY fr.submitted_at DESC;

-- Phase-Feld Missing Check
SELECT COUNT(*) as missing_phase_count
FROM finance_lifecycle_events
WHERE event_type IN ('case.created','manager.accepted','email.customer_intro_sent','commission.terms_accepted')
  AND phase IS NULL;

-- Fehlende event_source
SELECT id, event_type, created_at
FROM finance_lifecycle_events
WHERE event_source IS NULL;

-- Stuck Cases
SELECT e.finance_request_id, e.event_type, e.phase, e.idempotency_key, e.created_at
FROM finance_lifecycle_events e
WHERE e.event_type IN ('case.stuck_detected', 'case.sla_breach')
ORDER BY e.created_at DESC
LIMIT 50;

-- Drei-Status-Konsistenz
SELECT fr.id, fr.status as req_status, fm.status as mandate_status, frc.status as case_status
FROM finance_requests fr
LEFT JOIN finance_mandates fm ON fm.finance_request_id = fr.id
LEFT JOIN future_room_cases frc ON frc.finance_mandate_id = fm.id
WHERE fr.status = 'completed'
  AND (frc.status IS NOT NULL AND frc.status NOT IN ('closed', 'completed'));

-- PII in metadata (DSGVO)
SELECT DISTINCT jsonb_object_keys(metadata) as key
FROM finance_lifecycle_events
ORDER BY key;
```
