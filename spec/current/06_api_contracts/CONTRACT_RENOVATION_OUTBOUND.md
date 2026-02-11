# Contract: Renovation Outbound

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Z2 → Extern

## Trigger

User sendet Anfrage an Dienstleister aus MOD-04 Sanierung (Tender-Draft Workflow).

## Payload-Schema

```json
{
  "service_case_id": "UUID",
  "provider": {
    "name": "string",
    "email": "string",
    "phone": "string | null"
  },
  "email": {
    "to": "string",
    "subject": "string",
    "body_html": "string",
    "attachment_ids": ["UUID"]
  }
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `service_case_id` | Primaerschluessel in `service_cases` |
| `provider_email` | Empfaenger-E-Mail |
| `tender_id` | Im Betreff als `TND-{id}` fuer Inbound-Korrelation |

## SoT nach Uebergabe

Extern (E-Mail via Resend). Status in `service_case_outbound` wird auf `sent` gesetzt.

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Resend API-Key fehlt | 500, Secret-Check |
| Auth-Fehler | 401 |
| Ungueltige E-Mail-Adresse | 400, Frontend-Validierung |

## Code-Fundstelle

- `supabase/functions/sot-renovation-outbound/` (Edge Function)
- `service_cases`, `service_case_outbound` Tabellen
