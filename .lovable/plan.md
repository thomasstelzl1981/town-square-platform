
# Fix: Google Drive Cloud Sync -- 401 Authorization-Fehler

## Problem-Analyse

Die Backend-Analytics zeigen eindeutig: **Jeder einzelne Aufruf** an die Edge Function `sot-cloud-sync` scheitert mit HTTP 401 ("Missing authorization"). Die CORS-Preflight-Requests (OPTIONS) funktionieren korrekt (200), aber kein POST-Request enthaelt den erforderlichen Authorization-Header.

**Zwei Ursachen:**

1. **Timing-Problem beim Laden:** Der `useCloudSync`-Hook feuert `fetchStatus()` sofort beim Mounten -- noch bevor die Auth-Session aus dem localStorage wiederhergestellt ist. Zu diesem Zeitpunkt hat der Supabase-Client keine Session, also sendet `supabase.functions.invoke()` keinen Authorization-Header.

2. **Fehlende Fehler-Transparenz:** Der catch-Block in `connectGoogleDrive` zeigt nur "Verbindung konnte nicht gestartet werden" statt den tatsaechlichen Fehler (z.B. "Missing authorization" oder "Invalid user"). Dadurch ist die Diagnose unmoeglich.

## Loesung (3 Aenderungen)

### 1. `useCloudSync.ts` -- Auth-Awareness einbauen

- Den Hook so aendern, dass er `fetchStatus()` erst ausfuehrt, wenn eine gueltige Auth-Session vorhanden ist
- Dazu den `useAuth()`-Context importieren und auf `user` pruefen
- `fetchStatus` und `connectGoogleDrive` pruefen vor jedem Aufruf, ob eine Session existiert
- Bessere Fehlermeldungen: den tatsaechlichen Error-Text aus der Edge Function anzeigen

### 2. Edge Function `sot-cloud-sync/index.ts` -- Diagnostik-Logging

- An den Einstiegspunkten (action-Parsing, auth-Check) `console.log` hinzufuegen
- Bei fehlendem Auth-Header loggen, welche Headers tatsaechlich ankommen (ohne sensible Daten)
- Bei `status`-Action: wenn kein Auth-Header da ist, leere Connector-Liste zurueckgeben statt 401 (graceful degradation)

### 3. `CloudSyncCard.tsx` -- Ladezustand verbessern

- Waehrend Auth noch laedt, den Connect-Button deaktivieren mit klarem Hinweis
- Error-State anzeigen, falls die Verbindung fehlschlaegt

## Technische Details

```text
Vorher:
  useEffect -> fetchStatus() -> 401 (kein Token)
  Button Click -> invoke('init') -> 401 (evtl. auch kein Token)

Nachher:
  useEffect -> pruefe user/session -> wenn vorhanden -> fetchStatus()
  Button Click -> pruefe session -> wenn vorhanden -> invoke('init')
  Status-Action ohne Auth -> gibt [] zurueck statt 401
```

### Betroffene Dateien
- `src/hooks/useCloudSync.ts` -- Auth-Guard und bessere Fehlermeldungen
- `supabase/functions/sot-cloud-sync/index.ts` -- Logging + graceful status
- `src/components/dms/CloudSyncCard.tsx` -- UI-Feedback bei fehlendem Auth

### Google Console Einstellungen (Validierung)
Die Redirect-URI `https://ktpvilzjtcaxyuufocrs.supabase.co/functions/v1/sot-cloud-sync?action=callback&provider=google_drive` ist korrekt. Die JavaScript-Origin muss die Preview-URL enthalten. Diese Einstellungen sind aber erst relevant, nachdem der 401-Fehler behoben ist -- der OAuth-Flow wird aktuell gar nicht erst erreicht.
