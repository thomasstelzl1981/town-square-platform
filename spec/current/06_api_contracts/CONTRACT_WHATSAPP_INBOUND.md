# Contract: WhatsApp Inbound

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Extern → Z1

## Trigger

Meta WABA (WhatsApp Business API) Webhook — eingehende Nachricht.

## Payload-Schema

Meta Webhook Standard:

```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "phone_number",
          "id": "wa_message_id",
          "type": "text | image | document | audio",
          "text": { "body": "string" },
          "image": { "id": "media_id", "mime_type": "string" }
        }]
      }
    }]
  }]
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `wa_id` | WhatsApp Message ID |
| `phone_number` | Absender-Telefonnummer |
| `media_id` | Bei Medien-Nachrichten: Meta Media ID |

## SoT nach Uebergabe

Z1. Bei Medien: interner Call an `sot-whatsapp-media` fuer Download.

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Webhook-Verifikation fehlgeschlagen | 403 Forbidden |
| Media-Download-Fehler | Retry, Nachricht wird ohne Media gespeichert |
| Unbekannte Telefonnummer | Nachricht gespeichert, kein Kontakt-Match |

## Code-Fundstelle

- `supabase/functions/sot-whatsapp-webhook/` (Edge Function)
- `whatsapp_messages` (implizit)
