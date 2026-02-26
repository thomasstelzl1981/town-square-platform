

## Plan: Digest Auth in sot-camera-snapshot implementieren

**Datei:** `supabase/functions/sot-camera-snapshot/index.ts`

Die Kamera-Response bestätigt das Problem eindeutig:
```
WWW-Authenticate: Digest realm="Login to ac916551...", qop="auth", nonce="...", opaque="..."
```

### Änderungen

1. **Pure-JS MD5-Funktion** vor dem `Deno.serve` Block einfügen (~60 Zeilen, RFC 1321-basiert, keine externe Abhängigkeit)

2. **`parseDigestChallenge`** und **`buildDigestAuth`** Helper-Funktionen einfügen

3. **Fetch-Block ersetzen** (Zeilen 69-155): URL-embedded Credentials entfernen, stattdessen 2-Schritt Digest Auth Flow:
   - Request 1: GET ohne Auth an `camera.snapshot_url`
   - Bei 401 + Digest Challenge: MD5-Digest berechnen, Request 2 mit `Authorization: Digest ...`
   - Bei 401 ohne Digest: Basic Auth Fallback
   - Bei 401 ohne Credentials: Fehlermeldung

4. **Keine Änderungen** an DB, Frontend oder anderen Dateien

### Umfang
- 1 Datei, vollständiger Ersatz der Edge Function
- Keine Freeze-Verletzung (Edge Function, kein Modul-Pfad)
- Re-Deploy automatisch

