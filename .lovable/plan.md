

## Analyse: Warum "Assistent konnte nicht geladen werden"

Drei konkrete Bugs gefunden und behoben:

### ✅ Bug 1: RLS-Policy falsche Rolle — BEHOBEN
Die Policy "Admins can manage brand assistants" wurde von `roles: {public}` auf `TO authenticated` korrigiert. Nutzt jetzt `is_platform_admin(auth.uid())` korrekt.

### ✅ Bug 2: StatusForwardingCard sendet kein `brand_key` — BEHOBEN
`StatusForwardingCard` akzeptiert jetzt eine optionale `brandKey` Prop und sendet diese an `sot-phone-provision`. `BrandPhonePanel` übergibt den `brandKey`.

### ✅ Bug 3: postcall hat kein Billing-Tracking — BEHOBEN
- `commpro_phone_call_sessions` hat jetzt `twilio_price`, `twilio_price_unit`, `billed_credits` Spalten
- `sot-phone-postcall` extrahiert und speichert Twilio-Preise aus dem Callback

---

## Nächste Schritte

- Zone 1 testen: Ncore und Otto²Advisory Assistenten laden und Nummer kaufen
- Zone 2 Billing-Pipeline: sot-phone-billing Cron-Job + Credit-Preflight (später)
