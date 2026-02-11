# Contract: Social Mandate Submit

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Z2 → Z1

## Trigger

User reicht Social-Media-Mandat ein in MOD-14.

## Payload-Schema

```json
{
  "mandate_id": "UUID",
  "tenant_id": "UUID",
  "budget_total_cents": "number",
  "regions": ["string"],
  "start_date": "ISO-8601",
  "end_date": "ISO-8601"
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `mandate_id` | Primaerschluessel in `social_mandates` |
| `tenant_id` | Mandanten-Zuordnung |

## SoT nach Uebergabe

Z1 (Social Media Review Queue).

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| `tenant_id` fehlt | 400 Bad Request |
| Auth-Fehler | 401 Unauthorized |
| Budget unter Minimum | 400, Frontend-Validierung |

## Code-Fundstelle

- `supabase/functions/sot-social-mandate-submit/` (Edge Function)
- `social_mandates` Tabelle
