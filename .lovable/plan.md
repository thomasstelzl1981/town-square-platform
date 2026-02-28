

## Problem
Die Edge Function nutzt `TWILIO_ACCOUNT_SID:TWILIO_AUTH_TOKEN` für Basic Auth. Der User hat stattdessen einen **Twilio API Key** bereitgestellt (`SK...` + Secret). Bei Twilio API Keys ist die Basic Auth: `ApiKeySid:ApiKeySecret`, aber die Account SID (`AC...`) wird weiterhin in den URL-Pfaden benötigt.

## Plan

### 1. Neue Secrets anlegen
- `TWILIO_API_KEY_SID` = `SK8676e98953f1b921eaaf52bbd1d6c92f`
- `TWILIO_API_KEY_SECRET` = `JqzweJEVIhKgL1AqECHfcqzsvjM5FZ0z`

### 2. sot-phone-provision: Auth auf API Key umstellen
- Basic Auth ändern von `TWILIO_SID:TWILIO_TOKEN` zu `TWILIO_API_KEY_SID:TWILIO_API_KEY_SECRET`
- `TWILIO_ACCOUNT_SID` weiterhin für URL-Pfade verwenden (bleibt unverändert)
- Gleiche Änderung in `sot-phone-inbound` und `sot-phone-postcall` falls diese auch Twilio-API-Calls machen

### 3. Redeploy + Test

