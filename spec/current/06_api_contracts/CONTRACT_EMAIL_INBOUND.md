# Contract: Email Inbound

| Feld | Wert |
|------|------|
| **Name** | Email Inbound |
| **Direction** | Extern → Z1 |
| **Trigger** | Resend Webhook (`email.received`) |
| **Payload-Schema** | `{ from: string, to: string, subject: string, body_text?: string, body_html?: string, attachments?: Array<{ filename, content_type, size }> }` |
| **IDs/Correlation** | `routing_token` (im To-Feld), `in_reply_to_message_id`, Tender-ID (im Betreff für Sanierung) |
| **SoT nach Übergabe** | Z1 (je nach Routing: `acq_inbound_messages`, `admin_inbound_emails`, `service_case_inbound`) |
| **Code-Fundstelle** | `supabase/functions/sot-inbound-receive/` (allgemein), `supabase/functions/sot-renovation-inbound-webhook/` (Sanierung) |
| **Fehlerfälle/Retry** | Bei Webhook-Fehler: Resend retried automatisch. Bei Routing-Fehler: E-Mail wird als `needs_routing = true` markiert für manuelle Zuordnung. |

## Routing-Logik

1. **Routing-Token-Match:** To-Adresse enthält Token → direktes Routing an Mandat/Thread
2. **Tender-ID-Match:** Betreff enthält `TND-*` → Zuordnung an Sanierungsvorgang
3. **Reply-Match:** `In-Reply-To` Header → Zuordnung an bestehenden Thread
4. **Absender-Match:** E-Mail-Adresse bekannt → Zuordnung an Kontakt
5. **Kein Match:** `needs_routing = true` → manuelle Zuordnung in Z1

## Match Confidence

| Level | Methode |
|-------|---------|
| `exact` | Routing-Token oder Tender-ID im Betreff |
| `high` | Tender-ID im Body |
| `medium` | Absender-E-Mail passt zu Provider/Kontakt |
| `low` | Heuristik |
| `none` | Kein Match → manuelles Routing |
