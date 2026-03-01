

# Fix: sot-phone-postcall Webhook-Verarbeitung

## Problem
Die Edge Function `sot-phone-postcall` empfängt den ElevenLabs-Webhook korrekt (200 Response), aber erstellt keine Call-Session in der Datenbank. Zwei Ursachen:

1. **`updated_at`-Spalte fehlt** — Die Function setzt `updated_at` im Insert-Payload, aber die Tabelle `commpro_phone_call_sessions` hat diese Spalte nicht. Das Insert schlägt fehl.
2. **Kein Error-Handling bei Insert** — Der Code destructured nur `data` und ignoriert `error`, sodass der Fehler verschluckt wird.
3. **ElevenLabs Payload-Format unklar** — Der Webhook könnte ein anderes Format haben als unser Test (z.B. verschachteltes `data`-Objekt vs. flaches Objekt).

## Lösung

### 1. Datenbank-Migration
- `updated_at` Spalte zur Tabelle `commpro_phone_call_sessions` hinzufügen (mit Default `now()`)

### 2. Edge Function Fix (`sot-phone-postcall`)
- Error-Handling bei allen DB-Operationen (Insert + Update) hinzufügen mit `console.error`
- Robustes Payload-Parsing: ElevenLabs sendet den Webhook als flaches Objekt oder mit `data`-Wrapper — beide Fälle abfangen
- Debug-Logging für eingehende Payload-Struktur hinzufügen (Typ, vorhandene Keys), damit wir beim nächsten Testanruf sofort sehen, was ankommt

### 3. Validierung
- Testanruf mit simuliertem ElevenLabs-Payload nach dem Fix
- Prüfung, ob Session korrekt erstellt wird mit Transkript, Summary und E-Mail-Benachrichtigungen

## Betroffene Dateien
- `supabase/functions/sot-phone-postcall/index.ts` — Error-Handling + Debug-Logging
- Neue DB-Migration — `updated_at` Spalte

