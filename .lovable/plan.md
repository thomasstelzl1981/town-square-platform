
## FLC Wave 1 — Financing Lifecycle Controller (Implementierungsstand)

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

### ⬜ NÄCHSTE RUNDE (W1 Fortsetzung)

7. **Cron Patrol: `sot-flc-lifecycle`** — Edge Function analog `sot-slc-lifecycle`
   - Täglich 03:00 UTC, Stuck-Detection, SLA-Breach Events
   - KI-Summary via Gemini 2.5 Pro
   - `process_health_log` Eintrag

8. **UI: Finance Desk FLC Integration**
   - `useFLCMonitorCases()` Hook
   - Finance Desk "Fälle" Tab: Timeline aus `finance_lifecycle_events`
   - Finance Desk "Monitor" Tab: Stuck/SLA-Breach Alerts
   - Optional: MOD-07 StatusTab computed state

9. **ENGINE_REGISTRY.md** — ENG-FLC Eintrag hinzufügen

10. **engines_freeze.json** — ENG-FLC Eintrag (frozen: false)

### ⬜ WELLE 2 (nach W1 Stabilisierung)
- Repair Action Queue + UI
- Europace Real API (OAuth2)
- Bank-Package Builder + Docs-Checklist Gate
- Decision/Signature/Payout Tracking
- Settlement Automation (Commission → Invoice → Paid)
