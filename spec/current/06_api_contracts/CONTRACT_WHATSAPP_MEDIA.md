# Contract: WhatsApp Media Download

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Intern (Z1 → Z2 DMS)

## Trigger

`sot-whatsapp-webhook` empfaengt Media-Nachricht, ruft intern `sot-whatsapp-media` auf.

## Payload-Schema

```json
{
  "media_id": "string",
  "media_url": "string",
  "mime_type": "string",
  "message_id": "string"
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `media_id` | Meta Media-ID |
| `message_id` | WhatsApp Message-ID |
| `wa_id` | WhatsApp-Nummer des Absenders |

## SoT nach Uebergabe

Z2 DMS (`storage_nodes` via Supabase Storage).

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Meta-Download-Fehler | 502, Retry durch Webhook |
| Storage-Fehler | 500, Log |

## Code-Fundstelle

- `supabase/functions/sot-whatsapp-media/index.ts`
