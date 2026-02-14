# Contract: Email Inbound

| Feld | Wert |
|------|------|
| **Name** | Email Inbound |
| **Direction** | Extern → Z1 |
| **Trigger** | Resend Webhook (`email.received`) |
| **Payload-Schema** | `{ from: string, to: string, subject: string, body_text?: string, body_html?: string, attachments?: Array<{ filename, content_type, size }> }` |
| **IDs/Correlation** | `in_reply_to_message_id`, Tender-ID (im Betreff für Sanierung) |
| **SoT nach Übergabe** | Z1 (je nach Routing: `acq_inbound_messages`, `admin_inbound_emails`, `service_case_inbound`) |
| **Code-Fundstelle** | `supabase/functions/sot-inbound-receive/` (allgemein), `supabase/functions/sot-renovation-inbound-webhook/` (Sanierung) |
| **Fehlerfälle/Retry** | Bei Webhook-Fehler: Resend retried automatisch. Bei Routing-Fehler: E-Mail wird als `needs_routing = true` markiert für manuelle Zuordnung. |

## Inbound-Adresse

**Eine einzige Inbound-E-Mail-Adresse pro Account.** Diese wird automatisch aus der Outbound-System-Identity abgeleitet und ist unter Stammdaten einsehbar. Aktenspezifische E-Mail-Adressen existieren nicht.

## Routing-Logik

1. **Tender-ID-Match:** Betreff enthält `TND-*` → Zuordnung an Sanierungsvorgang
2. **Reply-Match:** `In-Reply-To` Header → Zuordnung an bestehenden Thread
3. **Absender-Match:** E-Mail-Adresse bekannt → Zuordnung an Kontakt
4. **Sortierregeln (Posteingang):** Keywords in Betreff/Absender → Zuordnung an Sortierkachel (`inbox_sort_containers`) → manuelle Bestätigung im Posteingang
5. **Kein Match:** `needs_routing = true` → manuelle Zuordnung in Z1

## Automatische Dokumentenzuordnung zu Akten

Die Zuordnung eingehender Dokumente zu Akten (Properties, Fahrzeuge, Personen etc.) erfolgt ausschließlich über **Sortierregeln im Posteingang** (MOD-03 DMS → Sortieren-Tab). Jede Akte erzeugt bei Neuanlage automatisch eine Sortierkachel mit Keyword-basierten Regeln. Die Zuordnung ist ein Vorschlag — die finale Ablage im Datenraum erfolgt nach manueller Bestätigung.

## Match Confidence

| Level | Methode |
|-------|---------|
| `high` | Tender-ID im Betreff oder Reply-Match |
| `medium` | Absender-E-Mail passt zu Provider/Kontakt oder Sortierregel-Match |
| `low` | Heuristik |
| `none` | Kein Match → manuelles Routing |
