# Contract: Renovation Inbound Email

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Extern → Z1

## Trigger

Resend Webhook (Sanierung). Korrelation ueber Tender-ID (`TND-*`) im Betreff.

## Payload-Schema

Resend-Standard:

```json
{
  "from": "string",
  "to": ["string"],
  "subject": "string (enthaelt TND-{id})",
  "text": "string",
  "html": "string",
  "attachments": []
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `tender_id` | Extrahiert aus Betreff via Regex `TND-[A-Z0-9]+` |
| `service_case_id` | Aufgeloest ueber `tender_id` → `service_cases` |

## SoT nach Uebergabe

Z1 (`service_case_inbound`). Angebot wird zur KI-Extraktion weitergeleitet.

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Kein Tender-Match im Betreff | Manuelles Routing, Eintrag mit `needs_routing = true` |
| Resend Webhook-Fehler | 500, Resend retry (3x) |

## Code-Fundstelle

- `supabase/functions/sot-renovation-inbound-webhook/` (Edge Function)
- `service_case_inbound` Tabelle
