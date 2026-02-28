
## Status

### ✅ Erledigt
- Secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN konfiguriert
- DB-Migration: commpro_phone_assistants erweitert (twilio_number_sid, twilio_phone_number_e164, tier)
- DB-Migration: commpro_phone_call_sessions erweitert (twilio_call_sid, recording_url, armstrong_notified_at)
- Edge Functions: sot-phone-provision, sot-phone-inbound, sot-phone-postcall deployed
- UI Zone 2: StatusForwardingCard mit Nummernkauf, GSM-Codes, Release
- Armstrong-Fix: phone-postcall nutzt profiles.armstrong_email statt redundantem Feld
- Zone 1 CommPro-Desk: Routing, Sub-Tabs (7 Marken), operativeDeskManifest

### 🔲 Offen
- Zone 1 CommPro-Desk: Brand-spezifische Assistenten-Records (pro Marke eigener DB-Eintrag)
- Premium-Tier: ElevenLabs Conversational AI Stream-Integration (Twilio `<Stream>` → ElevenLabs WebSocket)
- Credit-Preflight: System noch nicht implementiert (Platzhalter)
- Armstrong Sidebar: Eintrag für CommPro-Desk in der Admin-Navigation

## Architektur

### 2-Tier Modell
- **Zone 1 (Premium):** Twilio + ElevenLabs Conversational AI für Marken
- **Zone 2 (Standard):** Twilio STT/TTS + LLM für Kunden-Assistenten

### Armstrong Integration
- `phone-postcall` sendet Zusammenfassungen an `profiles.armstrong_email`
- `sot-inbound-receive` verarbeitet die E-Mail → Dashboard-Widget + Aufgaben

### Zone 1 CommPro-Desk
```
/admin/commpro-desk
├── /kaufy        — Telefonassistent für Kaufy
├── /futureroom   — Telefonassistent für FutureRoom
├── /acquiary     — Telefonassistent für Acquiary
├── /sot          — Telefonassistent für SoT
├── /lennox       — Telefonassistent für Lennox & Friends
├── /ncore        — Telefonassistent für Ncore
└── /otto         — Telefonassistent für Otto²
```
