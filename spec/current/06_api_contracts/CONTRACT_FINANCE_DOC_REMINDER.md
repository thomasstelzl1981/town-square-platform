# Contract: Finance Document Reminder

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

System → Z2

## Trigger

Cron/Scheduled (woechentlich), prueft fehlende Pflichtdokumente.

## Payload-Schema

```json
{
  "finance_request_id": "UUID",
  "missing_documents": ["string"],
  "recipient_email": "string"
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `finance_request_id` | Finanzierungsanfrage |
| `tenant_id` | Organisation |

## SoT nach Uebergabe

Z2 (E-Mail-Notification an User, kein Daten-Handoff).

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Resend-Fehler | Log, naechster Cron-Lauf wiederholt |
| Kein User-Impact bei Einzelfehler | — |

## Code-Fundstelle

- `supabase/functions/finance-document-reminder/index.ts`
