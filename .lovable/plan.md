

## Analyse: Warum der Nummernkauf still scheitert

### Ursache 1: Fehlende config.toml-Registrierung
`sot-phone-provision` ist **nicht** in `supabase/config.toml` registriert. Alle anderen ~60 Edge Functions haben dort einen Eintrag mit `verify_jwt = false`. Ohne diesen Eintrag verhält sich die JWT-Validierung am Gateway anders und kann zu stiller Ablehnung führen.

Gleiches gilt für `sot-phone-inbound` und `sot-phone-postcall` — keine der Phone-Functions ist registriert.

### Ursache 2: Kein Debug-Logging
Die Funktion hat keinerlei `console.log()` am Anfang des Handlers. Deshalb sehen wir in den Logs nur "booted" → "shutdown" — keine Information darüber, ob der Auth-Check, der Twilio-API-Call oder etwas anderes fehlschlägt.

### Ursache 3: Potentieller Twilio-API-Timeout
Falls der Request doch durchkommt: Die Twilio AvailablePhoneNumbers API + Purchase ist ein Two-Step-Call. Wenn der erste Call (Suche) oder zweite (Kauf) langsam antwortet, kann das Edge Function Timeout (150s) greifen.

---

## Implementierungsplan

### 1. config.toml — Alle Phone-Functions registrieren
Einträge hinzufügen für:
- `sot-phone-provision` → `verify_jwt = false`
- `sot-phone-inbound` → `verify_jwt = false`  
- `sot-phone-postcall` → `verify_jwt = false`

### 2. sot-phone-provision — Debug-Logging hinzufügen
An folgenden Stellen `console.log()` einfügen:
- Zeile 14: `console.log("provision handler called, method:", req.method)`
- Nach Auth-Check (Zeile 37): `console.log("authenticated user:", userId)`
- Nach JSON-Parse (Zeile 39): `console.log("action:", action, "brand_key:", brand_key)`
- Vor Twilio-Search (Zeile 62): `console.log("searching Twilio for", cc, "numbers...")`
- Nach Twilio-Search (Zeile 65): `console.log("Twilio search response status:", searchRes.status)`
- Vor Twilio-Buy (Zeile 89): `console.log("purchasing number:", number.phone_number)`
- Nach Twilio-Buy (Zeile 97): `console.log("Twilio buy response status:", buyRes.status)`

### 3. Redeploy + Erneuter Test
Nach dem Deployment erneut den Kauf-Button drücken. Die Logs zeigen dann exakt, wo der Prozess hängt oder scheitert.

