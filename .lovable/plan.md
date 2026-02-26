

## Problem

Die Kamera-Snapshot-Anfrage geht an `https://undefined.supabase.co/...` statt an die richtige URL. In `src/hooks/useCameras.ts` (Zeile ~116) wird `VITE_SUPABASE_PROJECT_ID` gelesen, aber zur Laufzeit ist dieser Wert `undefined`.

## Ursache

Die Umgebungsvariable `VITE_SUPABASE_PROJECT_ID` wird möglicherweise nicht korrekt in der Build-Umgebung injiziert. `VITE_SUPABASE_URL` hingegen funktioniert nachweislich (alle anderen API-Requests nutzen sie erfolgreich).

## Fix

**Datei:** `src/hooks/useCameras.ts`, Funktion `useCameraSnapshot`

Ersetze:
```typescript
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const url = `https://${projectId}.supabase.co/functions/v1/sot-camera-snapshot?camera_id=${cameraId}`;
```

Mit:
```typescript
const baseUrl = import.meta.env.VITE_SUPABASE_URL;
const url = `${baseUrl}/functions/v1/sot-camera-snapshot?camera_id=${cameraId}`;
```

Dies nutzt `VITE_SUPABASE_URL` (`https://ktpvilzjtcaxyuufocrs.supabase.co`), die nachweislich in allen anderen Requests korrekt funktioniert.

## Umfang

- 1 Datei, 2 Zeilen Änderung
- Kein Modul-Code betroffen (shared hook)
- Keine Freeze-Verletzung

