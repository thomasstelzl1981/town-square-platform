# Contract: Acquisition Inbound Email

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Extern → Z1

## Trigger

Resend Webhook (Akquise-spezifisch). Routing-Token im `to`-Feld: `acq+{mandate}+{contact}@...`

## Payload-Schema

Resend-Standard:

```json
{
  "from": "string",
  "to": ["string"],
  "subject": "string",
  "text": "string",
  "html": "string",
  "attachments": [],
  "headers": {}
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `mandate_id` | Extrahiert aus Routing-Token |
| `contact_id` | Extrahiert aus Routing-Token |
| `in_reply_to_message_id` | Referenz auf `acq_outbound_messages.id` |
| `routing_token` | Vollstaendiger Token aus `to`-Feld |

## Routing-Confidence

| Level | Beschreibung |
|-------|-------------|
| `exact` | Token-Match (mandate + contact) |
| `email_match` | Absender-E-Mail passt zu bekanntem Kontakt |
| `thread` | `in_reply_to` Match |
| `low` | Kein automatisches Routing moeglich |

## SoT nach Uebergabe

Z1 Acquiary (`acq_inbound_messages`). Bei `low` Confidence: `needs_routing = true`.

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Kein Token-Match | `needs_routing = true`, manuelles Routing |
| Resend Webhook-Fehler | 500, Resend retry (3x) |

## Code-Fundstelle

- `supabase/functions/sot-acq-inbound-webhook/` (Edge Function)
- `acq_inbound_messages` Tabelle
