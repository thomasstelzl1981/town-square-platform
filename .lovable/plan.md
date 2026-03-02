
## FLC Wave 1.5 — Financing Lifecycle Controller (Implementierungsstand)

### ✅ ERLEDIGT

1. **DB Migration: `finance_lifecycle_events`**
   - Append-only Eventlog mit Idempotency (UNIQUE index auf `idempotency_key`)
   - RLS: service_role full access + authenticated read via `memberships` join
   - Indexes: `(finance_request_id, created_at DESC)`, `(event_type, created_at DESC)`

2. **DB Fix: `commissions.platform_share_pct` Default 30→25**
   - ALTER DEFAULT auf 25
   - UPDATE bestehender pending/approved Finance-Einträge

3. **ENG-FLC Engine (`src/engines/flc/`)**
   - `spec.ts`: 23 Phasen, 26 Event-Typen, 7 Quality Gates, SLA-Thresholds, Snapshot-Interface
   - `engine.ts`: `computeFLCState()`, `determineFLCPhase()`, Gate-Evaluation, Stuck-Detection, Next Actions
   - Registriert in `src/engines/index.ts`

4. **Central Event Writer (`src/services/flc/eventWriter.ts`)**
   - Client-side Helper mit Idempotency (conflict handling on `23505`)
   - Batch-Support

5. **Edge Function: `sot-futureroom-public-submit` (Z3 Intake)**
   - FLC Events: `case.created` + `dataroom.linked` mit Idempotency
   - Correlation via `public_id`

6. **Edge Function: `sot-finance-manager-notify` (Acceptance Flow)**
   - ZWEI E-Mails: Customer Intro + Manager Confirmation (NEU)
   - FLC Events: `manager.accepted`, `email.customer_intro_sent`, `email.manager_confirm_sent`, `commission.terms_accepted`
   - Vollständige Idempotenz: Duplicate-Calls senden keine doppelten E-Mails

7. **Fix #1: Phase-Mapping** — `bank.decision_received` aus `FLC_EVENT_PHASE_MAP` entfernt
   - approved/declined wird aus Snapshot abgeleitet (future_room_cases.bank_response)

8. **Fix #2: Stuck-Clock** — `phase_entered_at` statt `last_event_at`
   - `FLC_PHASE_CHANGE_EVENTS` Set + `findPhaseEnteredAt()` Funktion
   - Snapshot erweitert um `phase_entered_at` Feld

9. **Fix #3: DATAROOM_GATE vs Docs** — Sauber getrennt
   - DATAROOM_GATE = completion_score ≥ 80% (Selbstauskunft)
   - SUBMISSION_GATE = finance_packages.status (Dokumente/Bankpaket)
   - RA_REQUEST_MISSING_FIELDS → DATAROOM_GATE, RA_REQUEST_MISSING_DOCUMENTS → SUBMISSION_GATE

10. **Fix #4: Tenant-Handling** — `sot-futureroom-public-submit`
    - ENV-first (ZONE1_PUBLIC_TENANT_ID), Fallback: slug-basiertes upsert (race-safe)

11. **Fix #5: Conventions SSOT** — `src/engines/flc/conventions.ts`
    - Event sources, Idempotency-Key-Schema, Actor types als typisierte Konstanten

12. **Cron Patrol: `sot-flc-lifecycle`** — Edge Function
    - Targeted scan offener Fälle, Stuck/SLA-Breach mit Tages-Idempotenz
    - phase_entered_at aus letztem Phase-Change-Event (Fix #2 konform)

13. **UI: Finance Desk FLC Integration**
    - `useFLCMonitorCases()` Hook mit computeFLCState client-side
    - FinanceDeskFaellePage: Expandable rows mit Timeline + Gates + NextActions
    - FinanceDeskMonitorPage: KPI-Cards + Stuck/SLA-Breach-Listen + Pipeline-Funnel

### ⬜ NÄCHSTE RUNDE

14. **ENGINE_REGISTRY.md** — ENG-FLC Eintrag hinzufügen

15. **engines_freeze.json** — ENG-FLC Eintrag (frozen: false)

16. **Cron Schedule** — pg_cron Job für sot-flc-lifecycle (täglich 03:00 UTC)

### ⬜ WELLE 2 (nach W1 Stabilisierung)
- Repair Action Queue + UI
- Europace Real API (OAuth2)
- Bank-Package Builder + Docs-Checklist Gate
- Decision/Signature/Payout Tracking
- Settlement Automation (Commission → Invoice → Paid)
