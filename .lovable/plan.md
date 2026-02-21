

# Google Drive Integration -- Vollstaendige Implementierung

## Ueberblick

Google Drive ist der beste Startpunkt: Du hast bereits Google Workspace und die Cloud Console. Die Datenbank-Tabellen (`cloud_sync_connectors`, `cloud_sync_log`) und die Edge Function (`sot-cloud-sync`) existieren bereits als Scaffold -- wir muessen sie nur mit echtem OAuth- und Sync-Code fuellen.

## Was der Nutzer am Ende kann

1. Auf der Intelligenz-Seite "Google Drive verbinden" klicken
2. Im Google-Login-Fenster sein Google-Konto waehlen und Zugriff erlauben
3. Einen Google-Drive-Ordner als Sync-Quelle auswaehlen
4. Dateien werden automatisch in den DMS-Datenraum importiert
5. Verbindung jederzeit trennen

## Voraussetzung: Google Cloud Console Setup (durch dich, einmalig)

Bevor wir Code deployen, brauchst du in deiner Google Cloud Console:

1. **Projekt** auswaehlen (oder neues erstellen)
2. **Google Drive API** aktivieren (APIs & Services > Library > "Google Drive API" > Enable)
3. **OAuth Consent Screen** konfigurieren:
   - User Type: External (oder Internal falls nur fuer deine Organisation)
   - App-Name, Support-E-Mail eintragen
   - Scopes hinzufuegen: `drive.readonly` (zum Lesen der Dateien)
4. **OAuth Client ID** erstellen:
   - Type: Web Application
   - Authorized Redirect URI: `https://ktpvilzjtcaxyuufocrs.supabase.co/functions/v1/sot-cloud-sync?action=callback&provider=google_drive`
5. **Client ID und Client Secret** kopieren -- diese werden als Secrets gespeichert

## Technischer Ablauf

```text
Nutzer klickt              Edge Function            Google
"Verbinden"                (sot-cloud-sync)         OAuth
    |                           |                      |
    |-- action=init ----------->|                      |
    |<-- redirect_url ----------|                      |
    |                           |                      |
    |-- Browser Redirect --------------------------->  |
    |                           |   (Login + Consent)  |
    |<-- callback mit code -----|<-- auth code --------|
    |                           |                      |
    |                           |-- token exchange --->|
    |                           |<-- access_token -----|
    |                           |                      |
    |                           |-- store tokens in DB |
    |<-- "Verbunden!" ---------|                      |
    |                           |                      |
    |-- action=sync ----------->|                      |
    |                           |-- list files ------->|
    |                           |<-- file list --------|
    |                           |-- download file ---->|
    |                           |-- upload to Storage  |
    |                           |-- create documents   |
    |<-- sync result -----------|                      |
```

## Implementierung

### Phase 1: Secrets und OAuth-Flow

**Schritt 1: Secrets speichern**
- `GOOGLE_DRIVE_CLIENT_ID` und `GOOGLE_DRIVE_CLIENT_SECRET` als Backend-Secrets hinterlegen

**Schritt 2: Edge Function `sot-cloud-sync` umbauen**

Die bestehende Scaffold-Function wird mit echtem Code gefuellt:

| Action | Aktuell | Neu |
|---|---|---|
| `init` | Gibt Placeholder-URL zurueck | Baut echte Google OAuth-URL mit `client_id`, `redirect_uri`, Scopes (`drive.readonly`) und `state`-Parameter (tenant_id + user_id verschluesselt) |
| `callback` | Gibt "scaffold" zurueck | Empfaengt `code` von Google, tauscht gegen `access_token` + `refresh_token`, speichert in `cloud_sync_connectors`, leitet zurueck zur App |
| `status` | Funktioniert bereits | Bleibt, wird um Token-Ablauf-Info erweitert |
| `sync` | Gibt "scaffold" zurueck | Listet Dateien aus Drive-Ordner, laedt herunter, speichert in `tenant-documents` Storage, erstellt `documents`-Eintraege |

Neue Actions:
| Action | Funktion |
|---|---|
| `folders` | Listet Google-Drive-Ordner auf (fuer Ordner-Auswahl im UI) |
| `disconnect` | Loescht Tokens aus DB, widerruft Google-Zugriff |
| `refresh` | Erneuert abgelaufenen Access Token via Refresh Token |

### Phase 2: UI-Komponente

**Schritt 3: `CloudSyncCard.tsx` funktional machen**

Die bestehende "Coming Soon"-Karte wird zur echten Steuerung:

- **Nicht verbunden**: Button "Mit Google Drive verbinden" -- oeffnet OAuth-Popup
- **Verbunden**: Zeigt Google-Konto-Name, letzten Sync-Zeitpunkt, Anzahl synchronisierter Dateien
- **Ordner-Auswahl**: Dropdown/Browser zur Auswahl des Drive-Ordners
- **Sync-Button**: Manueller Sync ausloesen
- **Trennen-Button**: Verbindung loesen

Dropbox und OneDrive bleiben als "Bald verfuegbar" in der Karte sichtbar.

**Schritt 4: Hook `useCloudSync.ts` erstellen**

Neuer Hook der die Edge Function aufruft:
- `connectGoogleDrive()` -- startet OAuth-Flow
- `disconnectProvider(connectorId)` -- trennt Verbindung
- `syncNow(connectorId)` -- loest manuellen Sync aus
- `connectors` -- reaktive Liste der Verbindungen
- `isConnecting`, `isSyncing` -- Loading-States

### Phase 3: Sync-Engine

**Schritt 5: Datei-Sync in der Edge Function**

Der `sync`-Action-Handler:
1. Refresh Token pruefen (erneuern falls abgelaufen)
2. Google Drive API: Dateien im konfigurierten Ordner listen
3. Delta-Sync: Nur neue/geaenderte Dateien (via `modifiedTime`)
4. Pro Datei:
   - Download von Google Drive
   - Upload in `tenant-documents` Storage (Pfad: `{tenantId}/CLOUD_SYNC/{filename}`)
   - `documents`-Eintrag erstellen (wie beim normalen Upload)
   - `cloud_sync_log`-Eintrag schreiben
5. Credit-Abrechnung: 1 Credit pro synchronisierter Datei

### Dateien die erstellt/geaendert werden

| Datei | Aenderung |
|---|---|
| `supabase/functions/sot-cloud-sync/index.ts` | Kompletter Umbau: OAuth-Flow, Token-Management, Drive-API-Calls, File-Sync |
| `src/components/dms/CloudSyncCard.tsx` | Von "Coming Soon" zu funktionaler Steuerung mit Connect/Sync/Disconnect |
| `src/hooks/useCloudSync.ts` | Neuer Hook fuer die Edge-Function-Kommunikation |
| `supabase/config.toml` | `verify_jwt = false` fuer sot-cloud-sync (OAuth Callback kommt ohne JWT) |

### Dateien die NICHT geaendert werden
- Datenbank-Schema (Tabellen existieren bereits)
- `storageManifest.ts` (kein neues Modul, Dateien landen in CLOUD_SYNC-Pfad)
- Routing, Manifests

## Einschraenkungen (V1)

- **Richtung**: Erst nur Google Drive → Datenraum (Import). Spaeter auch Datenraum → Drive (Export)
- **Kein automatischer Hintergrund-Sync**: Der Nutzer loest den Sync manuell aus. Auto-Sync (z.B. alle 30 Min) ist eine spaetere Erweiterung
- **Nur Google Drive**: Dropbox/OneDrive bleiben "Coming Soon"
- **Dateitypen**: Alle Dateien werden importiert; die KI-Extraktion (Phase 2 des Upload-Contracts) kann optional getriggert werden

