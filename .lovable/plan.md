

# Tiefenanalyse: Google Drive Integration (sot-cloud-sync)

## Kritischer Fehler gefunden

### Bug: Veraltete Supabase-JS Version bricht Authentifizierung

Die Edge Function `sot-cloud-sync/index.ts` importiert `@supabase/supabase-js@2.39.3` (Zeile 1). Sie verwendet jedoch die Methode `sbUser.auth.getClaims(token)` (Zeile 173), die erst ab Version ~2.49+ verfuegbar ist.

**Auswirkung:** Jede authentifizierte Aktion (init, folders, sync, disconnect) schlaegt mit einem Runtime-Error fehl:
```
TypeError: sbUser.auth.getClaims is not a function
```

Nur die `status`-Action funktioniert im nicht-authentifizierten Fallback (Zeile 163: gibt leere Liste zurueck). Der `callback`-Flow (nach Google OAuth) braucht keine Auth und funktioniert ebenfalls. Aber der **gesamte interaktive Flow** — Verbinden, Ordner waehlen, Synchronisieren, Trennen — ist kaputt.

### Warum ist das bisher nicht aufgefallen?

Die Datenbank-Tabelle `cloud_sync_connectors` ist leer — kein einziger Nutzer hat je erfolgreich Google Drive verbunden. Der `status`-Call gibt immer `{ connectors: [] }` zurueck (ohne Auth-Check), daher kein sichtbarer Fehler in der UI. Der Fehler tritt erst auf, wenn man den "Verbinden"-Button klickt.

## Weitere Befunde

| # | Befund | Schwere |
|---|--------|---------|
| 1 | **supabase-js@2.39.3 → getClaims fehlt** | KRITISCH — blockiert gesamten Flow |
| 2 | Secrets vorhanden (GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET) | OK |
| 3 | CORS-Konfiguration mit Origin-Allowlist | OK |
| 4 | config.toml: verify_jwt = false | OK (Auth wird manuell im Code geprueft) |
| 5 | OAuth Popup-Flow mit postMessage | OK — gut implementiert |
| 6 | Token-Refresh (ensureFreshToken) | OK — 1-Minute Buffer, Refresh-Token-Flow |
| 7 | Delta-Sync via modifiedTime | OK |

## Plan: Fix

### Aenderung 1: supabase-js Version aktualisieren (Zeile 1)

```typescript
// Vorher:
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Nachher:
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
```

Dies macht `getClaims()` verfuegbar und behebt den gesamten Authentifizierungs-Flow.

| Datei | Aenderung |
|---|---|
| `supabase/functions/sot-cloud-sync/index.ts` Zeile 1 | Version 2.39.3 → 2.49.1 |

Nach der Aenderung wird die Edge Function automatisch neu deployed. Dann kann der Google-Drive-Verbindungsflow getestet werden.

