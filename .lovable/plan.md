

## Überarbeiteter Plan: Camera Snapshot Edge Function Fix

**Datei:** `supabase/functions/sot-camera-snapshot/index.ts`

### Fix 1 (kritisch): `getClaims()` → `getUser()`

Die Methode `supabase.auth.getClaims(token)` existiert nicht in der Supabase JS Client Library. Dies verursacht den Runtime Error. Ersetzen durch `supabase.auth.getUser()`, das automatisch den JWT aus dem Authorization-Header validiert.

### Fix 2 (wichtig): Basic Auth Header + 401-Handling

Aktuell werden Credentials nur in die URL eingebettet (`http://user:pass@host`). Zusätzlich einen expliziten `Authorization: Basic ...` Header senden. Bei 401-Antwort eine klare Fehlermeldung zurückgeben, die auf mögliche Digest Auth hinweist.

### Fix 3: `encodeURIComponent` Doppel-Encoding entfernen

`new URL().username = encodeURIComponent(...)` verursacht Doppel-Encoding, da die URL-Klasse bereits selbst encoded. Direkt `parsed.username = camera.auth_user` setzen.

### Implementierung

Die gesamte Edge Function wird mit Claudes korrigierter Version ersetzt, mit einer Anpassung: `encodeURIComponent` wird bei `parsed.username`/`parsed.password` entfernt, um Doppel-Encoding zu vermeiden.

### Nicht im Scope

- tenant_id Migration (optional, später)
- Digest Auth Implementierung (falls Basic Auth nach diesem Fix immer noch 401 gibt, ist das der nächste Schritt)

### Umfang
- 1 Datei, vollständiger Ersatz der Edge Function
- Keine Freeze-Verletzung (Edge Function, kein Modul-Pfad)
- Re-Deploy automatisch

