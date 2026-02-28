

## Plan: Twilio Auth Token korrigieren und Region fixieren

### Ursache
Der gespeicherte `TWILIO_AUTH_TOKEN` stimmte nicht mit dem Live Auth Token überein. Der Screenshot bestätigt den korrekten Wert: `3d2f711a55c3db2726b8a69f1a03ff5f`. Zusätzlich ist der Account in der **IE1 (Ireland) Region**, weshalb wir die Region als Secret setzen sollten, damit der Code direkt den richtigen Host verwendet.

### Schritte

1. **Secret `TWILIO_AUTH_TOKEN` aktualisieren** auf den bestätigten Wert `3d2f711a55c3db2726b8a69f1a03ff5f`

2. **Neues Secret `TWILIO_REGION` setzen** auf `ie1` — damit verwendet die Edge Function direkt `api.ie1.twilio.com` ohne Fallback-Versuche auf den falschen Host

3. **Edge Function `sot-phone-provision` redeployen** und testen

Keine Code-Änderungen nötig — die Edge Function unterstützt bereits `TWILIO_REGION` und `TWILIO_AUTH_TOKEN`. Es fehlen nur die korrekten Secret-Werte.

