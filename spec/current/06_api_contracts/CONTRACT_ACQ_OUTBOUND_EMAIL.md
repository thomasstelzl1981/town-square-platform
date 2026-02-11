# Contract: Acquisition Outbound Email

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Z2 → Extern

## Trigger

User sendet Akquise-Anschreiben aus MOD-12.

## Payload-Schema

```json
{
  "mandate_id": "UUID",
  "contact_id": "UUID",
  "to_email": "string",
  "subject": "string",
  "body_html": "string",
  "routing_token": "string"
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `mandate_id` | Akquise-Mandat |
| `contact_id` | Ziel-Kontakt |
| `routing_token` | Fuer Inbound-Tracking via `sot-acq-inbound-webhook` |

## SoT nach Uebergabe

Extern (E-Mail via Resend). `acq_outbound_messages` als Audit-Log.

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Resend API-Fehler | 500, Toast. Kein Retry, User kann erneut senden. |

## Code-Fundstelle

- `supabase/functions/sot-acq-outbound/index.ts`
- `acq_outbound_messages` Tabelle
