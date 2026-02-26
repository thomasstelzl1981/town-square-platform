

# Amcrest Kamera-Integration in MOD-20 Smart Home

## Technische Herausforderung

Die App laeuft ueber HTTPS. Direkte HTTP-Aufrufe an eine lokale IP-Kamera werden vom Browser als **Mixed Content** blockiert. Loesung: Eine Backend-Funktion als Proxy, die den Snapshot von der Kamera holt und als Bild zurueckgibt.

**Voraussetzung:** Die Kamera muss vom Internet erreichbar sein (Port-Forwarding im Router auf Port 80/443 der Kamera, oder DynDNS/VPN).

## Architektur

```text
Browser (HTTPS)
    │
    ▼
Edge Function: sot-camera-snapshot
    │  (holt Bild von Kamera-URL)
    ▼
Amcrest Kamera (HTTP, via Port-Forwarding)
    │
    ▼
Snapshot JPEG → zurueck an Browser als base64 oder blob
```

## Umsetzung (4 Schritte)

### Schritt 1: DB-Tabelle `cameras`
```sql
CREATE TABLE public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL DEFAULT 'Kamera 1',
  snapshot_url TEXT NOT NULL,        -- z.B. http://meine-ip:8080/cgi-bin/snapshot.cgi
  auth_user TEXT,                     -- HTTP Basic Auth Username
  auth_pass TEXT,                     -- HTTP Basic Auth Passwort (verschluesselt speichern waere besser)
  refresh_interval_sec INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
-- RLS: Nur eigene Kameras sehen/bearbeiten
CREATE POLICY "cameras_own" ON public.cameras FOR ALL USING (auth.uid() = user_id);
```

### Schritt 2: Edge Function `sot-camera-snapshot`
- Nimmt `camera_id` als Parameter
- Liest Kamera-URL + Credentials aus `cameras`-Tabelle
- Macht HTTP-Request an die Snapshot-URL mit Basic Auth
- Gibt JPEG-Bild als Response zurueck (Content-Type: image/jpeg)
- Validiert dass die Kamera dem anfragenden User gehoert

### Schritt 3: SmartHomeTile.tsx umbauen (MOD-20)
- **Kamera hinzufuegen Dialog:** Name, Snapshot-URL, Username, Passwort, Refresh-Intervall
- **Kamera-Karten:** Fuer jede Kamera eine Card mit:
  - Live-Snapshot (wird alle X Sekunden refreshed via Edge Function)
  - Name + Status-Badge (online/offline)
  - Bearbeiten / Loeschen Buttons
- **Empty State** bleibt fuer User ohne Kameras

### Schritt 4: Hook `useCameras.ts`
- CRUD fuer `cameras`-Tabelle
- `useSnapshot(cameraId)` — ruft Edge Function auf, gibt Blob-URL zurueck
- Auto-Refresh via `setInterval` basierend auf `refresh_interval_sec`

## Dateien

| Datei | Aktion |
|-------|--------|
| `supabase/migrations/xxx.sql` | Tabelle `cameras` anlegen |
| `supabase/functions/sot-camera-snapshot/index.ts` | Proxy Edge Function |
| `src/hooks/useCameras.ts` | CRUD + Snapshot-Hook |
| `src/pages/portal/miety/tiles/SmartHomeTile.tsx` | UI mit Kamera-Grid + Dialog |
| `src/components/miety/AddCameraDialog.tsx` | Formular fuer Kamera-Konfiguration |

## Wichtig fuer den User

- Router muss **Port-Forwarding** eingerichtet haben (externer Port → Kamera-IP:80)
- Oder: DynDNS-Dienst nutzen (z.B. `meinekamera.duckdns.org:8080`)
- Ohne oeffentliche Erreichbarkeit funktioniert der Proxy nicht — die Edge Function laeuft in der Cloud, nicht im lokalen Netzwerk

