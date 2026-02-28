
## Plan: KI-Telefonassistent — Twilio-Integration (2-Stufen)

### Architektur

```
Anrufer → GSM-Weiterleitung → Twilio-Nummer (pro User)
       → Webhook → Edge Function "phone-inbound"
       ├─ Zone 1: ElevenLabs Conversational AI (Sprach-Dialog)
       └─ Zone 2: Twilio <Say>/<Gather> + LLM
       → Edge Function "phone-postcall"
       → Armstrong Inbound-Email → Widget + persönliche E-Mail an User
       → DB: commpro_phone_call_sessions
```

### Armstrong-Integration (Post-Call Flow)

1. `phone-postcall` erstellt LLM-Summary + Action-Items
2. Sendet strukturierte E-Mail an Armstrong-Inbound-Adresse des Tenant-Users
3. Armstrong erkennt den Anruf-Kontext und:
   - Erzeugt ein Widget im Dashboard ("Verpasster Anruf von Thomas Müller")
   - Formuliert eine persönliche E-Mail an den User mit Summary + nächsten Schritten
4. Kontakt-Matching: Caller-ID → `contacts.phone` / `contacts.phone_mobile`
   - Wenn Treffer → personalisierter Kontext (offene Vorgänge, letzte Kommunikation)
   - Wenn kein Treffer → neuer Kontaktvorschlag

### Stufen

| | Zone 1 (Eigene Marken) | Zone 2 (Kunden) |
|---|---|---|
| Telefonie | Twilio | Twilio |
| Stimme | ElevenLabs Conversational AI | Twilio `<Say>` + `<Gather>` + LLM |
| Post-Call | LLM + Armstrong-Context | LLM + Armstrong-Inbound-Email |
| Kontakterkennung | Ja (Caller-ID → Kontakt) | Ja (gleicher Lookup) |

### Implementierungs-Reihenfolge

- [x] 1. Plan erstellen
- [ ] 2. Secrets einrichten (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
- [ ] 3. DB-Migration (twilio_number_sid, twilio_phone_number_e164, armstrong_inbound_email)
- [ ] 4. Edge Function `phone-provision` (Nummernkauf via Twilio API)
- [ ] 5. Edge Function `phone-inbound` (Webhook + TwiML, Zone-Routing)
- [ ] 6. Edge Function `phone-postcall` (Summary + Armstrong-Inbound-Email)
- [ ] 7. UNFREEZE MOD-14 → UI: StatusForwardingCard erweitern (Nummernkauf + GSM-Codes)
- [ ] 8. Credit-Integration (sot-credit-preflight)

### Secrets

- `TWILIO_ACCOUNT_SID` — ⏳ noch einzurichten
- `TWILIO_AUTH_TOKEN` — ⏳ noch einzurichten
- `ELEVENLABS_API_KEY` — ✅ vorhanden

### Kosten-Modell (Credit-basiert)

| Posten | ~Preis | Credits |
|--------|--------|---------|
| Nummer/Monat | ~1 EUR | 4 Credits |
| Anruf/Min (Twilio) | ~0.01 EUR | 1 Credit |
| ElevenLabs Audio/Min | ~0.05 EUR | 1 Credit/Min |
| Post-Call LLM | ~0.01 EUR | 1 Credit |
