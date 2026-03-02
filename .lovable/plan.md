

# FLC Prüf-Audit — Konkreter Testkatalog (25 Testfälle + SQL-Audit-Queries)

## Befunde aus der Code-Prüfung

Bevor wir den Testkatalog erstellen, hier die **realen Lücken** im aktuellen Code, die der Audit aufdecken wird:

1. **FinanceDeskMonitorPage nutzt NICHT FLC** — queryt immer noch `leads`-Tabelle statt `finance_lifecycle_events`. Muss auf `useFLCMonitorCases` umgebaut werden (Stuck/SLA-Anzeige fehlt komplett).
2. **Kein INSERT-Policy für authenticated Users** — `eventWriter.ts` (client-side) schreibt via `supabase.from('finance_lifecycle_events').insert()`, aber die RLS hat nur `service_role FOR ALL` und `authenticated FOR SELECT`. Client-side Event-Writes werden mit RLS-Fehler abgelehnt.
3. **`package_status` nicht geladen** — `useFLCMonitorCases` setzt `package_status: null` (Kommentar: "Would need finance_packages join"). SUBMISSION_GATE ist daher immer `failed`.
4. **Kein `phase`-Feld beim Event-Write** — `eventWriter.ts` leitet `phase` korrekt ab, aber `sot-futureroom-public-submit` und `sot-finance-manager-notify` setzen `phase` NICHT im Insert. Stuck-Clock-Abfrage in Cron (`WHERE phase IS NOT NULL`) findet keine Phase-Events von diesen Producern.
5. **Cron-Schedule nicht eingerichtet** — `sot-flc-lifecycle` existiert als Edge Function, aber kein `pg_cron`-Job ist registriert.

---

## Umsetzungsplan (was zu implementieren ist)

### Teil A: Fixes (vor Testdurchführung)

| # | Fix | Dateien |
|---|-----|---------|
| A1 | RLS: INSERT-Policy für authenticated Users hinzufügen (mit tenant-check) | Migration SQL |
| A2 | FinanceDeskMonitorPage auf `useFLCMonitorCases` umbauen (KPI-Cards: Pipeline-Counts nach Phase, Stuck-Liste, SLA-Breaches) | `FinanceDeskMonitorPage.tsx`, `FinanceDeskMonitor.tsx` |
| A3 | `phase`-Feld in allen Edge Function Event-Inserts setzen (aus `FLC_EVENT_PHASE_MAP` ableiten) | `sot-futureroom-public-submit`, `sot-finance-manager-notify`, `sot-flc-lifecycle` (already does this) |
| A4 | `finance_packages` Join in `useFLCMonitorCases` hinzufügen → `package_status` korrekt setzen | `useFLCMonitorCases.ts` |
| A5 | `pg_cron` + `pg_net` Schedule für `sot-flc-lifecycle` einrichten (Werktags 03:00 UTC) | SQL via insert tool |

### Teil B: Testkatalog (25 nummerierte Testfälle)

Jeder Testfall als Given/When/Then + erwartete Evidence.

**Kategorie 1: Datenmodell (DB-Struktur)**

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-01 | Eventlog-Schema | Tabelle existiert | `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='finance_lifecycle_events'` | Alle 12 Spalten vorhanden (id, finance_request_id, finance_mandate_id, future_room_case_id, event_type, phase, actor_id, actor_type, event_source, idempotency_key, correlation_key, metadata, created_at) |
| TC-02 | Idempotency-Index | Unique partial index | `SELECT indexname FROM pg_indexes WHERE tablename='finance_lifecycle_events' AND indexdef LIKE '%idempotency%'` | `idx_fle_idempotency` existiert |
| TC-03 | Commission Default 25% | Default korrigiert | `SELECT column_default FROM information_schema.columns WHERE table_name='commissions' AND column_name='platform_share_pct'` | Default = 25 |
| TC-04 | Keine Legacy 30% | Korrektur durchgeführt | Audit-Query (siehe unten) | 0 Ergebnisse |

**Kategorie 2: Event-Emission (Producer-Korrektheit)**

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-05 | Z3 Intake → case.created | Z3 Form-Submit | `sot-futureroom-public-submit` wird aufgerufen | Event mit `event_type='case.created'`, `event_source` enthält `edge_fn:`, `phase='intake_received'`, idempotency_key = `case_created:<request_id>` |
| TC-06 | Z3 Intake Idempotenz | Gleicher Request 2× | Nochmal submittieren | Zweiter Insert → 23505 (duplicate), kein zweites Event |
| TC-07 | Manager Acceptance → 3 Events | Manager nimmt Mandat an | `sot-finance-manager-notify` aufgerufen | Events: `manager.accepted` + `email.customer_intro_sent` + `commission.terms_accepted`, jedes mit korrektem `phase`-Feld |
| TC-08 | Email Idempotenz | Notify 2× aufrufen | Retry | Emails: genau 1× (zweiter Call → `{skipped: true, reason: 'idempotent'}`) |
| TC-09 | Manager-Email enthält 25% | Acceptance | Manager-Mail prüfen | HTML enthält "25%" und Plattformanteil |

**Kategorie 3: Engine (Computed State)**

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-10 | Determinismus | Gleicher Snapshot 2× | `computeFLCState(snapshot)` | Identisches Ergebnis |
| TC-11 | Phase approved aus Snapshot | `bank_response='approved'` | `determineFLCPhase(snapshot)` | Phase = `approved` (nicht aus Event abgeleitet) |
| TC-12 | DATAROOM_GATE ≠ Docs | `completion_score=60`, `package_status='complete'` | `computeFLCState()` | DATAROOM_GATE = failed, SUBMISSION_GATE = passed |
| TC-13 | COMMISSION_GATE | `platform_share_pct=30` | Gates evaluieren | COMMISSION_GATE = failed + NextAction `RA_FIX_COMMISSION_SHARE` |
| TC-14 | Stuck-Clock Phase-Change | Phase `assigned_to_manager`, letzter Phase-Change vor 4 Tagen, aber doc.uploaded gestern | `isFLCStuck()` mit `phaseEnteredAt` = vor 4d | isStuck = true (4 > 3d Threshold), NICHT von gestern reset |

**Kategorie 4: Cron-Patrol**

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-15 | Stuck Detection | Fall in `assigned_to_manager` seit 5 Tagen | Cron läuft | Event `case.stuck_detected` mit `phase=assigned_to_manager`, `days_in_phase=5` |
| TC-16 | SLA Breach | Fall in `assigned_to_manager` seit 8 Tagen (>2×3) | Cron läuft | Event `case.sla_breach` |
| TC-17 | Tages-Idempotenz | Cron 2× am gleichen Tag | Zweiter Lauf | Kein zusätzliches Event (idempotency_key enthält Datum) |
| TC-18 | Terminal Skip | `finance_requests.status='completed'` | Cron | Fall wird übersprungen, kein Event |

**Kategorie 5: UI (Finance Desk)**

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-19 | Fälle-Liste | Offene Fälle vorhanden | Finance Desk → Fälle Tab | Tabelle zeigt: Vorgang, Kontakt, Manager, Phase-Badge, Fortschrittsbalken, Stuck-Badge |
| TC-20 | Timeline Expand | Fall mit Events | Klick auf Zeile | Timeline zeigt Events chronologisch mit Typ + Source + Timestamp |
| TC-21 | Blocking Gates | Fall mit fehlender Selbstauskunft | Expand | "Blockierende Gates" zeigt DATAROOM_GATE mit Message |
| TC-22 | Monitor KPIs | Stuck-Fälle vorhanden | Finance Desk → Monitor Tab | KPI-Cards zeigen Stuck-Count + SLA-Breach-Count (NICHT alte Leads-Stats) |

**Kategorie 6: Security & DSGVO**

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-23 | RLS Tenant-Isolation | User in Tenant A | Query Events für Tenant B Request | 0 Ergebnisse (RLS blockiert) |
| TC-24 | Kein PII in metadata | Events vorhanden | `SELECT DISTINCT jsonb_object_keys(metadata) FROM finance_lifecycle_events` | Keine Felder wie `email`, `phone`, `address` als Top-Level Keys |
| TC-25 | Anon kann keine Events lesen | Nicht eingeloggt | Select auf finance_lifecycle_events | 0 Ergebnisse (RLS) |

### Teil C: SQL-Audit-Queries (Copy/Paste)

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

-- Phase-Feld Missing Check (Fix A3)
SELECT COUNT(*) as missing_phase_count
FROM finance_lifecycle_events
WHERE event_type IN ('case.created','manager.accepted','email.customer_intro_sent','commission.terms_accepted')
  AND phase IS NULL;

-- Fehlende event_source
SELECT id, event_type, created_at
FROM finance_lifecycle_events
WHERE event_source IS NULL;

-- Stuck Cases (manuelle Prüfung)
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

### Zusammenfassung der 5 Fixes + Aufwand

| Fix | Aufwand | Kritikalität |
|-----|---------|--------------|
| A1: INSERT RLS Policy | XS (1 SQL Statement) | **Blocker** — Client-side Events funktionieren nicht |
| A2: Monitor auf FLC umbauen | M (Page + Komponente) | Hoch — Monitor zeigt falsche Daten |
| A3: `phase`-Feld in Edge Functions | S (3 Dateien, je 1 Zeile) | Hoch — Stuck-Clock findet keine Phase-Events |
| A4: `package_status` Join | S (1 Datei, +10 Zeilen) | Mittel — SUBMISSION_GATE immer failed |
| A5: pg_cron Schedule | XS (1 SQL Statement) | Hoch — Cron läuft nie automatisch |

