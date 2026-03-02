# SLC Prüf-Audit — Runbook (End-to-End)

> Version: 1.0.0 | Erstellt: 2026-03-02 | Scope: Wave 1 (Erfassung → Deal Close)

---

## 0) IST-Inventur (Echte Bezeichnungen)

| Bereich | Echte Tabelle / Route / Funktion |
|---------|----------------------------------|
| Sales Cases | `public.sales_cases` (Spalten: id, asset_type, asset_id, property_id, project_id, listing_id, current_phase [enum slc_phase], deal_contact_id, tenant_id, opened_at, closed_at, close_reason) |
| Eventlog | `public.sales_lifecycle_events` (Spalten: id, case_id, event_type [text], severity, phase_before, phase_after [enum slc_phase], actor_id, payload [jsonb], tenant_id, created_at) |
| Reservierungen | `public.sales_reservations` (case_id, listing_id, buyer_contact_id, reserved_price, status, expiry_date, notary_date, etc.) |
| Settlements | `public.sales_settlements` (case_id, deal_value, commissions, platform_share_pct/amount, status, approved_at, invoiced_at, paid_at) |
| Distribution | `public.listing_publications` (listing_id, channel [enum], status, expected_hash, last_synced_hash, last_synced_at) |
| Listings | `public.listings` (property_id, unit_id, status, asking_price, etc.) |
| Commissions | `public.commissions` (reference_type, reference_id, platform_share_pct [default 25]) |
| Projekte | `public.dev_projects` |
| Health Log | `public.process_health_log` (system, run_date, cases_checked, issues_found, events_created, ai_summary, status) |
| Engine | `src/engines/slc/spec.ts` + `engine.ts` (ENG-SLC v1.2.0) |
| Event Recorder | `src/hooks/useSLCEventRecorder.ts` |
| Cases Hook | `src/hooks/useSalesCases.ts` |
| Cron | `supabase/functions/sot-slc-lifecycle/index.ts` |
| Z1 Control Plane | `/admin/sales-desk` (Tabs: Dashboard, Monitor, Settlements, Kontakte, Veröffentlichungen, Inbox, Partner, Audit, Health) |
| Z1 Router | `src/pages/admin/desks/SalesDesk.tsx` |
| SLC Monitor | `src/pages/admin/sales-desk/SLCMonitorTab.tsx` |

### Fehlende Tabellen (nicht vorhanden)
- `project_units` — MOD-13 Unit-Verwaltung unklar
- `partner_assignments` — Verwendung über `listing_publications` channel=partner_network

---

## 1) Befunde aus der Code-/DB-Prüfung

### KRITISCHE LÜCKEN

| # | Befund | Kritikalität | Beschreibung |
|---|--------|-------------|--------------|
| B1 | **Keine idempotency_key Spalte** | 🔴 Blocker | `sales_lifecycle_events` hat kein `idempotency_key`-Feld → Cron/Retry können Duplikate erzeugen. Cron nutzt Date-Range-Check als Workaround (fragil). |
| B2 | **Kein event_source / actor_type** | 🟡 Hoch | Events haben keinen `event_source` (z.B. `edge_fn:sot-slc-lifecycle`, `mod06`, `zone1_admin`) und kein `actor_type` (system/user/cron). Audit-Trail unvollständig. |
| B3 | **Stuck-Clock nutzt updated_at** | 🟡 Hoch | `sot-slc-lifecycle` verwendet `slcCase.updated_at` für Stuck-Detection statt Zeitpunkt des letzten Phasenwechsels. Jedes triviale Update (z.B. deal_contact_id setzen) resettet die Stuck-Clock. |
| B4 | **Kein Unique Idempotency Index** | 🔴 Blocker | Es fehlt `UNIQUE(case_id, idempotency_key) WHERE idempotency_key IS NOT NULL`. Parallel/Retry kann zu doppelten Events führen. |
| B5 | **Kein correlation_key** | 🟡 Mittel | Events sind nicht über Prozesse hinweg korrelierbar (z.B. Reservierung → Settlement → Commission). |
| B6 | **Reservation-Expiry nicht idempotent** | 🟡 Hoch | `deal.reservation_expired` Events haben keinen Idempotency-Key; nur Date-Range-Check verhindert Duplikate. |
| B7 | **Settlement double-billing ungeprüft** | 🟡 Hoch | `sales_settlements` hat keinen Unique-Constraint auf `case_id` oder `reservation_id` → theoretisch doppelte Abrechnungen möglich. |

### BESTÄTIGTE STÄRKEN ✅

- `commissions.platform_share_pct` Default = 25 ✅
- Alle SLC-Tabellen haben RESTRICTIVE `tenant_isolation` RLS ✅
- Engine (ENG-SLC) ist pure functions, kein DB/UI Import ✅
- Phase-Transitions validiert via `isValidTransition()` ✅
- Drift-Detection Modell korrekt (expected_hash vs last_synced_hash) ✅
- Health Log vorhanden (`process_health_log`) ✅
- Cron hat AI-Summary via Gemini ✅

---

## 2) Umsetzungsplan (Fixes vor Testdurchführung)

| # | Fix | Aufwand | Dateien |
|---|-----|---------|---------|
| F1 | Spalten `idempotency_key`, `event_source`, `actor_type`, `correlation_key` zu `sales_lifecycle_events` hinzufügen + Unique Partial Index | S | Migration SQL |
| F2 | `useSLCEventRecorder` erweitern: `eventSource`, `actorType`, `idempotencyKey`, `correlationKey` Parameter | S | `useSLCEventRecorder.ts` |
| F3 | `sot-slc-lifecycle` Stuck-Clock auf Phase-Change-Timestamp umstellen (letztes Event mit `phase_after != phase_before`) | M | `sot-slc-lifecycle/index.ts` |
| F4 | Cron-Events mit `idempotency_key` versehen: `stuck:<case_id>:<phase>:<YYYY-MM-DD>`, `drift:<case_id>:<channel>:<YYYY-MM-DD>` | S | `sot-slc-lifecycle/index.ts` |
| F5 | Unique Constraint auf `sales_settlements(case_id)` oder `(case_id, reservation_id)` | XS | Migration SQL |
| F6 | SLC Conventions File anlegen (analog FLC) | S | `src/engines/slc/conventions.ts` |

---

## 3) Testkatalog (25 Testfälle)

### Kategorie 1: Datenmodell (DB-Struktur)

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-01 | Eventlog-Schema vollständig | Tabelle existiert | Schema-Query | Spalten: id, case_id, event_type, severity, phase_before, phase_after, actor_id, payload, tenant_id, created_at + **NEU nach F1:** idempotency_key, event_source, actor_type, correlation_key |
| TC-02 | Idempotency-Index | Nach F1 | Index-Query | `idx_sle_idempotency` existiert: UNIQUE(case_id, idempotency_key) WHERE idempotency_key IS NOT NULL |
| TC-03 | Sales Case Phase Enum | slc_phase Typ | Enum-Query | Alle 14 Phasen vorhanden (captured → closed_lost) |
| TC-04 | Commission Default 25% | commissions Tabelle | `SELECT column_default` | platform_share_pct Default = 25 |
| TC-05 | Settlement Unique | Nach F5 | Insert 2× gleiche case_id | Zweites Insert → Constraint-Violation |

### Kategorie 2: Event-Emission (Producer-Korrektheit)

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-06 | asset.captured Event | Neues Listing erstellt | `useSLCEventRecorder.recordEvent()` | Event: event_type='asset.captured', phase_before=null, phase_after='captured', event_source='mod04' o.ä. |
| TC-07 | mandate.activated Event | Verkaufsauftrag erteilt | recordEvent() mit 'mandate.activated' | Phase-Transition: captured/readiness_check → mandate_active |
| TC-08 | channel.published Event | Listing veröffentlicht | recordEvent() mit 'channel.published' | Phase-Transition: mandate_active → published, payload enthält channel |
| TC-09 | deal.reserved Event | Reservierung erstellt | recordEvent() mit 'deal.reserved' | Phase-Transition: → reserved, case.deal_contact_id gesetzt |
| TC-10 | deal.finance_submitted | Finanzierung eingereicht | recordEvent() mit 'deal.finance_submitted' | Phase: reserved → finance_submitted |
| TC-11 | case.closed_won | Verkauf abgeschlossen | recordEvent() mit 'case.closed_won' | Phase → closed_won, closed_at gesetzt |
| TC-12 | Idempotenz (Event) | Gleicher Event 2× | recordEvent() 2× mit gleichem idempotency_key | Zweiter Insert → 23505 Duplicate-Skip, kein zweites Event |

### Kategorie 3: Engine (Computed State)

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-13 | Phase Determinismus | Event-Liste mit 5 Events | `determineCurrentPhase(events)` | Identisches Ergebnis bei 2 Aufrufen |
| TC-14 | isValidTransition forward | Phase=published, target=reserved | `isValidTransition('published', 'reserved')` | true |
| TC-15 | isValidTransition backward | Phase=reserved, target=published | `isValidTransition('reserved', 'published')` | false |
| TC-16 | closed_lost → mandate_active (Reopen) | Phase=closed_lost | `isValidTransition('closed_lost', 'mandate_active')` | true |
| TC-17 | Stuck Detection korrekt | Phase=mandate_active, phaseEnteredAt=15 Tage her | `isStuck('mandate_active', date, now)` | true (15 > 14d threshold) |
| TC-18 | Drift Detection | expected_hash='abc', last_synced_hash='xyz' | `computeChannelDrift([...])` | is_drifted = true |

### Kategorie 4: Cron-Patrol

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-19 | Stuck Event erzeugt | Case in `published` seit 65 Tagen | Cron läuft | Event: `case.stuck_detected`, severity='error' (65 > 60×2? nein → 'warning'), payload.days_in_phase=65 |
| TC-20 | Reservation Expiry | Reservation mit expiry_date < now | Cron läuft | Event: `deal.reservation_expired`, reservation.status='expired' |
| TC-21 | Settlement Pending | Case in `notary_completed` seit 20 Tagen, kein Settlement | Cron läuft | Event: `deal.settlement_pending` |
| TC-22 | Tages-Idempotenz | Cron 2× am gleichen Tag | Zweiter Lauf | Kein doppeltes stuck/drift Event (nach F4: idempotency_key verhindert) |
| TC-23 | Terminal Skip | Case mit closed_at != null | Cron läuft | Case wird übersprungen |

### Kategorie 5: UI (Sales Desk)

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-24 | SLC Monitor zeigt Cases | Offene Cases vorhanden | /admin/sales-desk/monitor | Tabelle zeigt: Asset, Phase-Badge, Kontakt, Stuck-Badge, Actions (Advance/Close) |
| TC-25 | Timeline chronologisch | Case mit Events | Monitor → Case expandieren / Detail | Events chronologisch mit event_type, severity, phase_before→phase_after, created_at |

### Kategorie 6: Security & DSGVO

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-26 | RLS Tenant-Isolation | User in Tenant A | Query sales_lifecycle_events für Tenant B case | 0 Ergebnisse |
| TC-27 | Anon kann keine Events lesen | Nicht eingeloggt | SELECT auf sales_lifecycle_events | 0 Ergebnisse (RLS) |
| TC-28 | Payload PII-Check | Events vorhanden | `SELECT DISTINCT jsonb_object_keys(payload)` | Keine PII (email, phone, address) als Top-Level Keys |

### Kategorie 7: Drift & Distribution

| TC | Test | Given | When | Then |
|----|------|-------|------|------|
| TC-29 | Drift erkannt | listing_publications: expected_hash ≠ last_synced_hash | `computeChannelDrift()` | is_drifted = true, countDriftedChannels > 0 |
| TC-30 | Resync setzt hash | Channel wird re-synced | last_synced_hash = expected_hash | is_drifted = false |

---

## 4) SQL-Audit-Queries (Copy/Paste)

```sql
-- TC-01: Eventlog Schema Check
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_lifecycle_events'
ORDER BY ordinal_position;

-- TC-02: Idempotency Index Check
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'sales_lifecycle_events'
  AND indexdef LIKE '%idempotency%';

-- TC-03: SLC Phase Enum Values
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'slc_phase'
ORDER BY e.enumsortorder;

-- TC-04: Commission Default Check
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'commissions' AND column_name = 'platform_share_pct';

-- TC-05: Settlement Uniqueness Check
SELECT case_id, COUNT(*)
FROM sales_settlements
GROUP BY case_id
HAVING COUNT(*) > 1;

-- Duplicate Events (nach F1/F4)
SELECT case_id, idempotency_key, COUNT(*)
FROM sales_lifecycle_events
WHERE idempotency_key IS NOT NULL
GROUP BY 1, 2
HAVING COUNT(*) > 1;

-- Missing event_source (nach F1/F2)
SELECT id, event_type, created_at
FROM sales_lifecycle_events
WHERE event_source IS NULL;

-- Stuck Cases (manuelle Prüfung)
SELECT e.case_id, e.event_type, e.phase_before, e.phase_after, e.created_at,
       e.payload->>'days_in_phase' as days_stuck
FROM sales_lifecycle_events e
WHERE e.event_type IN ('case.stuck_detected', 'deal.settlement_pending')
ORDER BY e.created_at DESC
LIMIT 50;

-- Channel Drift Status
SELECT lp.listing_id, lp.channel, lp.status, lp.expected_hash, lp.last_synced_hash,
       CASE WHEN lp.expected_hash IS NOT NULL AND lp.last_synced_hash IS NOT NULL
            AND lp.expected_hash != lp.last_synced_hash THEN 'DRIFT' ELSE 'OK' END as drift_status
FROM listing_publications lp
WHERE lp.status = 'active';

-- Commission Anomalies (platform_share_pct != 25)
SELECT id, reference_id, reference_type, platform_share_pct, status
FROM commissions
WHERE platform_share_pct != 25
  AND status IN ('pending', 'approved');

-- Phase Distribution (aktive Cases)
SELECT current_phase, COUNT(*) as cnt
FROM sales_cases
WHERE closed_at IS NULL
GROUP BY current_phase
ORDER BY cnt DESC;

-- Event Coverage pro Phase
SELECT sc.current_phase,
       COUNT(DISTINCT sc.id) as cases,
       COUNT(DISTINCT e.id) as events,
       ROUND(COUNT(DISTINCT e.id)::numeric / NULLIF(COUNT(DISTINCT sc.id), 0), 1) as events_per_case
FROM sales_cases sc
LEFT JOIN sales_lifecycle_events e ON e.case_id = sc.id
WHERE sc.closed_at IS NULL
GROUP BY sc.current_phase
ORDER BY cases DESC;

-- Double-Billing Check (settlements)
SELECT case_id, reservation_id, COUNT(*), SUM(platform_share_amount)
FROM sales_settlements
GROUP BY case_id, reservation_id
HAVING COUNT(*) > 1;

-- PII in Payload Check
SELECT DISTINCT jsonb_object_keys(payload) as key
FROM sales_lifecycle_events
ORDER BY key;

-- RLS: Verify restrictive policy exists
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('sales_cases', 'sales_lifecycle_events', 'sales_settlements', 'sales_reservations')
  AND policyname LIKE '%restrictive%';

-- Cron Health Log
SELECT run_date, cases_checked, issues_found, events_created, status, error_message
FROM process_health_log
WHERE system = 'slc'
ORDER BY run_date DESC
LIMIT 10;
```

---

## 5) Fix-Zusammenfassung

| Fix | Aufwand | Kritikalität | Status |
|-----|---------|--------------|--------|
| F1: Eventlog-Spalten + Idempotency Index | S | 🔴 Blocker | ✅ DONE (Migration) |
| F2: EventRecorder erweitern | S | 🔴 Blocker | ✅ DONE (useSLCEventRecorder.ts) |
| F3: Stuck-Clock Phase-Change | M | 🟡 Hoch | ✅ DONE (findPhaseEnteredAt in Cron) |
| F4: Cron Idempotency Keys | S | 🟡 Hoch | ✅ DONE (idempotency_key in all Cron events) |
| F5: Settlement Unique Constraint | XS | 🟡 Hoch | ✅ DONE (Migration) |
| F6: SLC Conventions File | S | 🟡 Mittel | ✅ DONE (src/engines/slc/conventions.ts) |

---

## 6) Regressions-Checklist

- [ ] MOD-04 Immobilie anlegen / bearbeiten weiterhin ok
- [ ] MOD-06 VorgaengeTab zeigt Reservierungen korrekt
- [ ] MOD-13 Project Intake / Unit Generation / Publish ok
- [ ] Zone-3 Kaufy zeigt Listings korrekt
- [ ] MOD-09 Partner-Zuweisungen funktional
- [ ] InvestEngine Berechnungen unverändert
- [ ] Sales Desk Dashboard/Monitor laden ohne Fehler
- [ ] Cron schreibt korrekt in process_health_log
