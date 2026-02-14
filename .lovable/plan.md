

# PV Connector: SMA Tripower Anbindung via Local Bridge

## Architektur

Der SMA Sunny Tripower (2021) bietet eine lokale WebConnect JSON-API ueber HTTP/HTTPS. Da weder Cloud-Funktionen noch der Browser (CORS) direkt auf lokale IPs zugreifen koennen, wird ein lokales Bridge-Script eingesetzt:

```text
+------------------+       HTTP/JSON        +------------------+
| SMA Tripower     | <-------------------> | Bridge-Script    |
| 192.168.x.x:80   |  login + getValues    | (Python, lokal)  |
+------------------+                        +--------+---------+
                                                     |
                                            Supabase REST API
                                            (INSERT pv_measurements)
                                                     |
                                            +--------+---------+
                                            | Datenbank        |
                                            | pv_measurements  |
                                            | pv_connectors    |
                                            +--------+---------+
                                                     |
                                              Realtime / Query
                                                     |
                                            +--------+---------+
                                            | Frontend UI      |
                                            | Live-Monitoring   |
                                            +------------------+
```

## Was wird gebaut

### 1. Lokales Bridge-Script (`sma_bridge.py`)

Ein Python-Script, das du auf deinem Rechner im WLAN startest. Es:
- Loggt sich beim SMA Wechselrichter ein (`POST /dyn/login.json`)
- Pollt alle 10 Sekunden die aktuelle Leistung (`6100_40263F00`) und ggf. Tagesertrag
- Schreibt die Messwerte per Supabase REST API in `pv_measurements`
- Aktualisiert `pv_connectors.status` und `last_sync_at`

Du startest es so:
```text
python sma_bridge.py --ip 192.168.x.x --password DEIN_WR_PASSWORT --plant-id UUID
```

Das Script wird im Projekt-Root unter `tools/sma_bridge.py` abgelegt.

### 2. Edge Function: `pv-connector-bridge`

Empfaengt Messdaten vom Bridge-Script und schreibt sie in die DB. Endpoints:

| Action | Beschreibung |
|--------|-------------|
| `ingest` | Messwerte empfangen und in `pv_measurements` schreiben |
| `status` | Connector-Status aktualisieren (connected/offline/error) |
| `test` | Einfacher Ping/Health-Check fuer die UI |

Authentifizierung: Das Bridge-Script nutzt einen Service-Key oder den normalen Auth-Token.

### 3. Hook: `usePvConnectors.ts`

Neuer Hook fuer Connector-CRUD und Live-Daten:

- `usePvConnectors(plantId)` — Connector-Liste und Status
- `usePvMeasurements(plantId)` — Letzte Messwerte aus `pv_measurements` (Realtime-Subscription)
- `usePvConnectorActions()` — Test/Start/Stop Aktionen (ruft Edge Function)

### 4. UI: Connector-Sektion im PV-Dossier

Neue Sektion zwischen "Live-Monitoring" (B) und "Standort" (C) im `PVPlantDossier.tsx`:

```text
+-------------------------------------------------------+
| [Plug] Connector / Fernueberwachung                   |
|-------------------------------------------------------|
| Typ: [SMA WebConnect v] [Solar-Log v] [Demo v]        |
|                                                       |
| --- SMA WebConnect ---                                |
| Wechselrichter-IP:  [192.168.___.___ ]                |
| Passwort:           [********        ]                |
| Polling-Intervall:  [10] Sekunden                     |
|                                                       |
| Status: [*] Verbunden   Letztes Update: 14:32:05      |
|                                                       |
| [Verbindung pruefen]  [Konfiguration speichern]       |
|                                                       |
| --- Bridge-Anleitung ---                              |
| > python tools/sma_bridge.py --ip 192.168.x.x ...    |
| [Befehl kopieren]                                     |
+-------------------------------------------------------+
```

### 5. Live-Monitoring Upgrade

Der bestehende Monitoring-Bereich (Sektion B) wird erweitert:
- Wenn `pv_measurements`-Eintraege mit `source = 'sma_webconnect'` vorhanden sind, werden diese statt der Demo-Daten angezeigt
- Realtime-Subscription auf `pv_measurements` fuer sofortige UI-Updates
- Timeseries-Chart zeigt echte Messwerte der letzten 24h

### 6. Demo-Fallback (`demo_timo_leif`)

Wenn kein echter Connector konfiguriert oder offline ist:
- Bisheriger `DemoLiveGenerator` bleibt aktiv
- Status-Anzeige zeigt "Demo-Modus" Badge
- Umschalten auf echte Daten erfolgt automatisch, sobald Messwerte eintreffen

## SMA WebConnect API Details (Sunny Tripower 2021)

Die API funktioniert so:

**Login:**
```text
POST https://192.168.x.x/dyn/login.json
Body: {"right":"usr","pass":"PASSWORT"}
Response: {"result":{"sid":"SESSION_ID"}}
```

**Werte lesen:**
```text
POST https://192.168.x.x/dyn/getValues.json?sid=SESSION_ID
Body: {"destDev":[],"keys":["6100_40263F00"]}
Response: {"result":{"SERIAL":{"6100_40263F00":{"1":[{"val":4230}]}}}}
```

Wichtige Register-Keys:
| Key | Bedeutung | Einheit |
|-----|-----------|---------|
| `6100_40263F00` | Aktuelle Leistung | W |
| `6400_00260100` | Gesamtenergie | Wh |
| `6400_00262200` | Tagesertrag | Wh |

## Datenbank-Aenderungen

### Migration: `active_connector` Spalte in `pv_plants`

```sql
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS active_connector text DEFAULT 'demo_timo_leif';
```

### Realtime fuer `pv_measurements`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.pv_measurements;
```

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| **NEU** `tools/sma_bridge.py` | Lokales Bridge-Script (Python) |
| **NEU** `supabase/functions/pv-connector-bridge/index.ts` | Edge Function fuer Daten-Ingestion |
| **NEU** `src/hooks/usePvConnectors.ts` | Connector CRUD + Realtime Measurements |
| `src/pages/portal/photovoltaik/PVPlantDossier.tsx` | Neue Connector-Sektion + Live-Daten aus DB |
| `src/hooks/usePvMonitoring.ts` | Erweitert: DB-Messwerte statt nur Demo |
| `src/hooks/usePvPlants.ts` | Interface um `active_connector` erweitern |
| SQL-Migration | `active_connector` Spalte + Realtime |

## Was sich NICHT aendert

- `DemoLiveGenerator.ts` bleibt als Fallback
- Zone 1 Admin-Seiten unveraendert
- `ConnectorCard.tsx` und `EinstellungenTab.tsx` bleiben
- Bestehende RLS-Policies fuer `pv_connectors` und `pv_measurements` sind bereits korrekt konfiguriert

