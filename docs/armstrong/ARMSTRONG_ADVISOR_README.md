# Armstrong Advisor — MVP Runtime Documentation

**Version:** 1.0.0  
**Status:** MVP IMPLEMENTATION  
**Date:** 2026-02-08

## Overview

The `sot-armstrong-advisor` Edge Function is the single entry point for Armstrong AI orchestration in Zone 2 (Portal). It implements:

- Intent Classification (EXPLAIN | DRAFT | ACTION)
- Action Suggestion (Manifest-driven + role-gating + module filter)
- Confirm-Gate Flow (2-step call for execute_with_confirmation)
- Action Execution (minimal dispatcher for MVP actions)
- Audit Logging (action runs without PII)

## Scope

### IN SCOPE (MVP)

| Feature | Description |
|---------|-------------|
| Zone 2 Only | Portal modules only |
| MOD-00, MOD-04, MOD-07, MOD-08 | Dashboard, Immobilien, Finanzierung, Investment |
| Intent Classification | EXPLAIN, DRAFT, ACTION |
| Action Suggestion | Based on message keywords + context |
| Confirm Gate | execute_with_confirmation requires confirmed=true |
| Audit Logging | armstrong_action_runs table |

### OUT OF SCOPE (MVP)

- Credit charging / billing deduction
- Multi-agent orchestration
- Zone 1 (Admin) chat
- Zone 3 (Websites) execution
- External tool integrations (Meta, Video, etc.)
- Camunda workflow integration

## API Contract

### Endpoint

```
POST /functions/v1/sot-armstrong-advisor
Authorization: Bearer <JWT>
Content-Type: application/json
```

### Request Body

```typescript
interface RequestBody {
  zone: "Z2";
  module: "MOD-00" | "MOD-04" | "MOD-07" | "MOD-08";
  route: string;  // e.g., "/portal/immobilien/123"
  entity: {
    type: "property" | "mandate" | "finance_case" | "widget" | "none";
    id: string | null;
  };
  message: string;
  conversation?: {
    last_messages: Array<{ role: "user" | "assistant"; content: string }>;
  };
  action_request?: {
    action_code: string | null;
    confirmed: boolean;
    params: Record<string, unknown>;
  };
}
```

### Response Types

#### 1. EXPLAIN

```json
{
  "type": "EXPLAIN",
  "message": "Erklärungstext...",
  "citations": [],
  "suggested_actions": [],
  "next_steps": []
}
```

#### 2. DRAFT

```json
{
  "type": "DRAFT",
  "draft": {
    "title": "string",
    "content": "string",
    "format": "markdown|text|json"
  },
  "suggested_actions": [],
  "next_steps": []
}
```

#### 3. SUGGEST_ACTIONS

```json
{
  "type": "SUGGEST_ACTIONS",
  "intent": "ACTION",
  "suggested_actions": [
    {
      "action_code": "ARM.MOD04.DATA_QUALITY_CHECK",
      "title_de": "Vollständigkeit prüfen",
      "execution_mode": "readonly",
      "risk_level": "low",
      "cost_model": "free",
      "credits_estimate": 0,
      "cost_hint_cents": 0,
      "side_effects": [],
      "why": "Prüft Datenvollständigkeit"
    }
  ],
  "next_steps": ["Wählen Sie eine Aktion aus."]
}
```

#### 4. CONFIRM_REQUIRED

```json
{
  "type": "CONFIRM_REQUIRED",
  "action": {
    "action_code": "ARM.MOD00.CREATE_TASK",
    "title_de": "Aufgabe erstellen",
    "summary": "Erstellt eine To-Do-Aufgabe als Widget",
    "execution_mode": "execute_with_confirmation",
    "risk_level": "low",
    "cost_model": "free",
    "credits_estimate": 0,
    "cost_hint_cents": 0,
    "side_effects": ["modifies_widgets"],
    "preconditions": []
  }
}
```

#### 5. RESULT

```json
{
  "type": "RESULT",
  "action_run_id": "uuid",
  "status": "completed|failed|cancelled",
  "message": "Aktion erfolgreich ausgeführt.",
  "output": { "key": "value" },
  "next_steps": ["Ergebnis prüfen"]
}
```

#### 6. BLOCKED

```json
{
  "type": "BLOCKED",
  "reason_code": "NOT_ALLOWED|OUT_OF_SCOPE|NEEDS_CONSENT|MISSING_ENTITY",
  "message": "Erklärung...",
  "suggested_actions": [],
  "next_steps": []
}
```

## MVP Executable Actions

Only these actions can be fully executed in MVP:

### MOD-00 (Dashboard Widgets)
- `ARM.MOD00.CREATE_TASK` — execute_with_confirmation
- `ARM.MOD00.CREATE_REMINDER` — execute_with_confirmation
- `ARM.MOD00.CREATE_NOTE` — execute_with_confirmation

### MOD-04 (Immobilien)
- `ARM.MOD04.DATA_QUALITY_CHECK` — readonly
- `ARM.MOD04.CALCULATE_KPI` — readonly
- `ARM.MOD04.VALIDATE_PROPERTY` — readonly

### MOD-07 (Finanzierung)
- `ARM.MOD07.EXPLAIN_SELBSTAUSKUNFT` — readonly
- `ARM.MOD07.DOC_CHECKLIST` — readonly
- `ARM.MOD07.VALIDATE_READINESS` — readonly

### MOD-08 (Investments)
- `ARM.MOD08.RUN_SIMULATION` — readonly
- `ARM.MOD08.ANALYZE_FAVORITE` — readonly

All other actions from the manifest can be **suggested** but not executed.

## Confirm-Gate Flow

For actions with `execution_mode: 'execute_with_confirmation'`:

1. **First Call** (without `confirmed: true`):
   - Returns `CONFIRM_REQUIRED` with action details
   - UI displays confirmation dialog

2. **Second Call** (with `confirmed: true`):
   - Executes the action
   - Returns `RESULT`

```typescript
// Step 1: Request action
const response1 = await fetch(url, {
  body: JSON.stringify({
    zone: "Z2",
    module: "MOD-00",
    route: "/portal",
    entity: { type: "none", id: null },
    message: "Erstelle eine Aufgabe",
    action_request: {
      action_code: "ARM.MOD00.CREATE_TASK",
      confirmed: false,
      params: { title: "Meine Aufgabe" }
    }
  })
});
// Returns: { type: "CONFIRM_REQUIRED", action: {...} }

// Step 2: Confirm and execute
const response2 = await fetch(url, {
  body: JSON.stringify({
    // ... same as above ...
    action_request: {
      action_code: "ARM.MOD00.CREATE_TASK",
      confirmed: true,  // <-- Now confirmed
      params: { title: "Meine Aufgabe" }
    }
  })
});
// Returns: { type: "RESULT", status: "completed", ... }
```

## Logging

Every executed action creates a record in `armstrong_action_runs`:

| Field | Description |
|-------|-------------|
| action_code | The executed action |
| zone | Always "Z2" for MVP |
| org_id | Organization from JWT |
| user_id | User from JWT |
| status | pending/completed/failed |
| input_context | Redacted context (no raw message) |
| output_result | Summary only |
| duration_ms | Execution time |
| pii_present | Always false in MVP |
| retention_days | 90 days |

## Smoke Tests

### Test 1: Explain Request

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-04",
    "route": "/portal/immobilien",
    "entity": { "type": "none", "id": null },
    "message": "Was ist eine Immobilienakte?"
  }'
# Expected: { type: "EXPLAIN", message: "...", ... }
```

### Test 2: Action Suggestion

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-04",
    "route": "/portal/immobilien/123",
    "entity": { "type": "property", "id": "123" },
    "message": "Prüfe die Vollständigkeit"
  }'
# Expected: { type: "SUGGEST_ACTIONS", suggested_actions: [...] }
```

### Test 3: Readonly Execution

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-04",
    "route": "/portal/immobilien/123",
    "entity": { "type": "property", "id": "<property-uuid>" },
    "message": "",
    "action_request": {
      "action_code": "ARM.MOD04.DATA_QUALITY_CHECK",
      "confirmed": false,
      "params": {}
    }
  }'
# Expected: { type: "RESULT", status: "completed", output: {...} }
```

### Test 4: Confirm Gate (Step 1)

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-00",
    "route": "/portal",
    "entity": { "type": "none", "id": null },
    "message": "",
    "action_request": {
      "action_code": "ARM.MOD00.CREATE_TASK",
      "confirmed": false,
      "params": { "title": "Test Task" }
    }
  }'
# Expected: { type: "CONFIRM_REQUIRED", action: {...} }
```

### Test 5: Confirm Gate (Step 2)

```bash
# Same as Test 4 but with confirmed: true
# Expected: { type: "RESULT", status: "completed", ... }
```

### Test 6: Out of Scope Module

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-12",
    "route": "/portal/akquise",
    "entity": { "type": "none", "id": null },
    "message": "Hilfe mit Akquise"
  }'
# Expected: { type: "EXPLAIN", message: "...nicht unterstützt...", ... }
```

### Test 7: Zone 3 Blocked

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z3",
    "module": "MOD-04",
    "route": "/kaufy",
    "entity": { "type": "none", "id": null },
    "message": "Test"
  }'
# Expected: { type: "BLOCKED", reason_code: "OUT_OF_SCOPE", ... }
```

### Test 8: Draft Intent

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-04",
    "route": "/portal/immobilien",
    "entity": { "type": "none", "id": null },
    "message": "Schreibe eine Email an den Makler"
  }'
# Expected: { type: "DRAFT", draft: {...}, ... }
```

### Test 9: Investment Simulation

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-08",
    "route": "/portal/investments",
    "entity": { "type": "none", "id": null },
    "message": "",
    "action_request": {
      "action_code": "ARM.MOD08.RUN_SIMULATION",
      "confirmed": false,
      "params": {
        "purchase_price": 350000,
        "equity": 70000,
        "interest_rate": 3.8,
        "repayment_rate": 2.5
      }
    }
  }'
# Expected: { type: "RESULT", output: { monthly_rate_eur: ..., ... } }
```

### Test 10: Finance Doc Checklist

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-07",
    "route": "/portal/finanzierung",
    "entity": { "type": "none", "id": null },
    "message": "",
    "action_request": {
      "action_code": "ARM.MOD07.DOC_CHECKLIST",
      "confirmed": false,
      "params": {}
    }
  }'
# Expected: { type: "RESULT", output: { required: [...], optional: [...] } }
```

### Test 11: Invalid Action

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-04",
    "route": "/portal/immobilien",
    "entity": { "type": "none", "id": null },
    "message": "",
    "action_request": {
      "action_code": "ARM.INVALID.ACTION",
      "confirmed": false,
      "params": {}
    }
  }'
# Expected: { type: "BLOCKED", reason_code: "NOT_ALLOWED", ... }
```

### Test 12: Non-Executable MVP Action

```bash
curl -X POST ${SUPABASE_URL}/functions/v1/sot-armstrong-advisor \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Z2",
    "module": "MOD-04",
    "route": "/portal/immobilien",
    "entity": { "type": "none", "id": null },
    "message": "",
    "action_request": {
      "action_code": "ARM.MOD04.CREATE_PROPERTY",
      "confirmed": true,
      "params": {}
    }
  }'
# Expected: { type: "SUGGEST_ACTIONS", why: "...nur als Vorschlag..." }
```

## Evidence Files

| Component | Path |
|-----------|------|
| Edge Function | `supabase/functions/sot-armstrong-advisor/index.ts` |
| Config | `supabase/config.toml` (verify_jwt = false) |
| Types | `src/types/armstrong.ts` |
| Manifest | `src/manifests/armstrongManifest.ts` |
| Documentation | `docs/armstrong/ARMSTRONG_ADVISOR_README.md` |
| DB Table | `armstrong_action_runs` |

## Security Rules

1. **R1: Actions from Manifest Only** — No invented actions
2. **R2: Role/Org Enforcement** — Filter by roles_allowed, zones, module
3. **R3: execution_mode Strict** — readonly executes, execute_with_confirmation needs confirm
4. **R4: Confirm Gate** — Always show summary, side_effects, cost before confirm
5. **R5: Input Redaction** — No raw message text in logs

## Performance Targets

| Metric | Target |
|--------|--------|
| Explain/Suggest | < 2-4s |
| KPI/Simulation | < 6s |
| Action Execution | < 3s |
