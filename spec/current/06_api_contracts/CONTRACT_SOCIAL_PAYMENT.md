# Contract: Social Payment Flow

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Z2 → Extern → Z1 (zweistufig)

## Trigger

1. **Create:** User startet Checkout in MOD-14 → `sot-social-payment-create`
2. **Webhook:** Stripe Callback nach Zahlung → `sot-social-payment-webhook`

## Payload-Schema

### Create (Request)

```json
{
  "mandate_id": "UUID"
}
```

### Create (Response)

```json
{
  "checkout_url": "string",
  "session_id": "string"
}
```

### Webhook (Stripe → System)

```json
{
  "mandate_id": "UUID",
  "payment_status": "paid",
  "session_id": "string"
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `mandate_id` | Primaerschluessel in `social_mandates` |
| `session_id` | Stripe Checkout Session ID |

## SoT nach Uebergabe

Z1 — `social_mandates.status` wird auf `review` gesetzt nach erfolgreichem Payment.

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Mandate not found | 404 |
| Already paid | 400, idempotent |
| Stripe API-Fehler | 500, manueller Fix noetig |
| Webhook-Signatur ungueltig | 403 Forbidden |

## Code-Fundstelle

- `supabase/functions/sot-social-payment-create/` (Checkout-Session)
- `supabase/functions/sot-social-payment-webhook/` (Stripe Callback)
- `social_mandates` Tabelle
