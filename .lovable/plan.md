
# P0 HARDENING MASTER PLAN — Enterprise GO-Level

## Uebersicht

Dieses Haertungspaket umfasst 5 Teile ohne Architektur- oder Engine-Aenderungen. Alle Aenderungen sind deklarativ (Golden Path Definitionen), datenbankbasiert (Triggers, Constraints) oder Edge-Function-Implementierungen.

---

## TEIL 1: Golden Path Fail-State Design

### Was wird gemacht?
Erweiterung der Type-Definitionen und aller 6 Golden Path Definitionen um optionale Fail-State-Felder.

### Aenderungen:

**1a. `src/manifests/goldenPaths/types.ts`** — Neue Typen hinzufuegen:

```text
FailStateRecovery = 'retry' | 'manual_review' | 'abort' | 'escalate_to_z1' | 'ignore'

interface StepFailState {
  ledger_event: string        // z.B. "listing.distribution.timeout"
  status_update: string       // z.B. "timeout"
  recovery_strategy: FailStateRecovery
  description: string
  escalate_to?: string        // z.B. "Z1"
  max_retries?: number
  camunda_error_code?: string
}

// Neues optionales Feld in GoldenPathStep:
on_timeout?: StepFailState
on_rejected?: StepFailState
on_duplicate?: StepFailState
on_error?: StepFailState
```

**1b. Alle 6 GP-Definitionen erweitern:**

Fuer jeden Cross-Zone-Step und jeden wait_message/service_task-Step werden `on_timeout`, `on_error` und ggf. `on_rejected`/`on_duplicate` ergaenzt. Beispiel fuer MOD_04 Step `listing_distribution_z1`:

```text
on_timeout:
  ledger_event: "listing.distribution.timeout"
  status_update: "timeout"
  recovery_strategy: "manual_review"
  escalate_to: "Z1"
  
on_error:
  ledger_event: "listing.distribution.error"
  status_update: "error"
  recovery_strategy: "retry"
  max_retries: 3
```

SLA-Zeitraeume (nur als Metadaten im Step, keine Engine-Aenderung):
- Z2 nach Z1 Handoff: 24h
- Z1 nach Z2 Assignment: 24h
- Externer Email Response: 72h

**1c. Ledger-Whitelist erweitern** (`src/manifests/goldenPaths/index.ts`):

Neue Events hinzufuegen:
- `*.timeout` Patterns fuer jeden GP (z.B. `listing.distribution.timeout`, `finance.request.timeout`, etc.)
- `*.rejected` Patterns
- `*.duplicate_detected` Patterns
- `*.error` Patterns
- Consent-Events (siehe Teil 2)
- PII-Events (siehe Teil 2)

**1d. `src/goldenpath/devValidator.ts`** erweitern:

Neue Pruefung (Section 5): Fuer jeden Step mit `contract_refs` oder `task_kind === 'wait_message'` pruefen, dass mindestens `on_timeout` und `on_error` definiert sind. Fehlende Fail-States erzeugen `console.error`.

---

## TEIL 2: DSGVO P0 Hardening

### 2a. Consent-Events

**Ledger-Whitelist erweitern** um:
- `consent.given`
- `consent.revoked`
- `consent.updated`

**DB-Funktion `log_data_event` aktualisieren** (Migration):
- Whitelist in der RPC-Funktion um alle neuen Event-Types erweitern (Consent, PII, Fail-State Events)
- Payload-Keys fuer neue Events definieren

### 2b. PII Update Tracking via DB-Triggers

**Neue DB-Triggers** (Migration):

3 Audit-Triggers erstellen:
1. `trg_audit_applicant_profiles` — AFTER UPDATE/DELETE on `applicant_profiles`
2. `trg_audit_contacts` — AFTER UPDATE/DELETE on `contacts`  
3. `trg_audit_profiles` — AFTER UPDATE/DELETE on `profiles`

Jeder Trigger ruft eine gemeinsame Funktion `fn_audit_pii_change()` auf, die:
- Die geaenderten Spalten ermittelt (`OLD` vs `NEW`)
- Einen Eintrag in `data_event_ledger` schreibt mit:
  - `event_type`: `applicant_profile.updated` / `contact.deleted` etc.
  - `payload`: `{ "record_id": "...", "table_name": "...", "changed_fields": ["field1","field2"] }`
  - Keine PII-Werte im Payload — nur Feldnamen
- Soft-Delete erkennt (`deleted_at` wird gesetzt) und als `*.delete_requested` loggt

---

## TEIL 3: Renter Invite Edge Function

### Neue Datei: `supabase/functions/sot-renter-invite/index.ts`

Vollstaendige Implementierung basierend auf CONTRACT_RENTER_INVITE.md:

**Flow:**
1. Empfaengt POST mit `{ invite_id }` oder `{ lease_id, email, contact_id }`
2. Service-Role DB-Client erstellt
3. Validierung:
   - Lease existiert und gehoert zum Tenant
   - Email ist gueltig
   - Kein Duplikat (Pruefung via `idx_renter_invites_pending_per_lease` — bereits als UNIQUE partial index vorhanden)
4. Falls `invite_id` nicht uebergeben: Insert in `renter_invites` mit Token und 72h Expiry
5. Ledger-Event: `renter.invite.sent`
6. Email-Versand via Resend (Pattern aus `sot-system-mail-send`)
7. Response mit `{ success: true, invite_id }`

**Acceptance-Endpoint** (separater POST-Pfad via `action` Parameter):
1. Token validieren
2. Expiry pruefen (72h) 
3. Status-Update: `pending` -> `accepted`, `accepted_at = now()`
4. Renter-Org Provisioning (Insert in `organizations` mit `org_type: 'renter'`)
5. `lease.renter_org_id` setzen
6. Data-Room Access Grant erstellen (`access_grants`)
7. Ledger-Events: `renter.invite.accepted`, `renter.org.provisioned`, `data_room.access.granted`

**Idempotenz:** 
- Bereits `accepted` -> ignorieren, return success
- Der existierende UNIQUE partial index `idx_renter_invites_pending_per_lease` verhindert doppelte pending Invites pro Lease

**Timeout:**
- Expires_at ist bereits auf 14 Tage gesetzt (DB-Default). Wird auf 72h angepasst oder per Parameter konfigurierbar.
- Expiry-Check bei Acceptance: Token abgelaufen -> `renter.invite.expired` Ledger-Event, Status = `expired`

**Config:** `supabase/config.toml` Eintrag mit `verify_jwt = false` (Token-basierte Acceptance braucht keine Auth).

---

## TEIL 4: Status Transition Hardening

### DB-Validation-Triggers (Migration)

Fuer 4 Tabellen werden Validation-Triggers erstellt (keine CHECK Constraints, da diese immutable sein muessen):

**1. `finance_requests`:**
```text
Erlaubt: draft->submitted, submitted->assigned, assigned->processing,
         processing->completed, processing->rejected, submitted->timeout
Blockiert: assigned->draft, completed->processing, rejected->submitted
```

**2. `acq_mandates`:**
```text
Erlaubt: draft->submitted, submitted->assigned, assigned->active,
         active->completed, active->rejected, submitted->timeout
```

**3. `dev_projects`:**
```text
Erlaubt: planning->construction, construction->sales, sales->handover,
         handover->completed
```

**4. `leases`:**
```text
Erlaubt: draft->active, active->terminated, active->expired
```

Jeder Trigger: `BEFORE UPDATE` — prueft `OLD.status` vs `NEW.status`. Bei ungueltigem Uebergang: `RAISE EXCEPTION 'Invalid status transition: % -> %'`.

---

## TEIL 5: Validierung

### Automatische Pruefungen nach Umsetzung:
- devValidator laeuft ohne neue Errors (alle Cross-Zone Steps haben Fail-States)
- Ledger-Whitelist enthaelt alle neuen Events
- Build kompiliert ohne TypeScript-Fehler
- Keine Aenderung an `engine.ts` Core-Logik
- Keine neuen Routes oder Zonen
- Edge Function `sot-renter-invite` deployed und aufrufbar

---

## Zusammenfassung der Dateiaenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/goldenPaths/types.ts` | Neue Fail-State Typen |
| `src/manifests/goldenPaths/MOD_04.ts` | Fail-States fuer 5 Cross-Zone Steps |
| `src/manifests/goldenPaths/MOD_07_11.ts` | Fail-States fuer 3 Cross-Zone Steps |
| `src/manifests/goldenPaths/MOD_08_12.ts` | Fail-States fuer 3 Cross-Zone Steps |
| `src/manifests/goldenPaths/MOD_13.ts` | Fail-States fuer 2 Cross-Zone Steps |
| `src/manifests/goldenPaths/GP_VERMIETUNG.ts` | Fail-States fuer 2 Cross-Zone Steps |
| `src/manifests/goldenPaths/GP_LEAD.ts` | Fail-States fuer 1 Cross-Zone Step |
| `src/manifests/goldenPaths/index.ts` | Erweiterte Ledger-Whitelist (~30 neue Events) |
| `src/goldenpath/devValidator.ts` | Neue Pruefung: Fail-State Vollstaendigkeit |
| `supabase/functions/sot-renter-invite/index.ts` | Neue Edge Function |
| Migration 1 | `log_data_event` RPC: erweiterte Whitelist + Payload-Keys |
| Migration 2 | PII Audit Triggers (3 Tabellen) |
| Migration 3 | Status Transition Triggers (4 Tabellen) |
| Migration 4 | Renter Invite Ledger-Events in Whitelist |

**Keine Aenderungen an:**
- `src/goldenpath/engine.ts` (Engine-Core bleibt unberuehrt)
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- Routing oder Zonen-Architektur
