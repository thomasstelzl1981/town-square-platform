

## Plan: Traccar-Integration für Teltonika FMM003 fertigstellen

### Voraussetzungen (deine Seite)
1. Traccar-Server aufsetzen (z.B. Docker auf VPS)
2. Teltonika FMM003 per Configurator auf den Server konfigurieren (IP, Port 5027)
3. SIM-Karte einlegen, Tracker ins Auto stecken
4. Traccar-Gerät im Dashboard erscheint → Device-ID notieren

### Schritt 1: Secrets hinterlegen
- `TRACCAR_BASE_URL` — z.B. `https://traccar.deine-domain.de`
- `TRACCAR_API_TOKEN` — Base64 von `user:passwort` des Traccar-Admin-Accounts

### Schritt 2: LogbookCreateFlow erweitern
- Teltonika FMM003 als explizite Hersteller-Option hinzufügen (aktuell nur generisches "Teltonika")
- `integration_level: 'B'` ist bereits korrekt gesetzt (Zündung + Odometer via OBD)
- IMEI-Feld wird zur Registrierung in `cars_device_external_refs` genutzt

### Schritt 3: Device-Auto-Registration
- Neue Action `register_device` in `sot-telematics-sync` hinzufügen
- Gerät automatisch in Traccar anlegen via REST API (`POST /api/devices`)
- Rückgabe der Traccar-Device-ID → Update in `cars_device_external_refs`
- Damit entfällt das manuelle Nachschlagen der Device-ID

### Schritt 4: Sync testen
- `sot-telematics-sync` aufrufen → prüfen ob Positionen aus Traccar ankommen
- Trip Engine validieren: Fahrt-Erkennung basierend auf Zündung (Standard B)

### Schritt 5: Cron-Job für Auto-Sync
- Scheduled Function (alle 5 Min) für kontinuierlichen Positions-Pull
- Bereits vorbereitet im Edge Function Code, muss nur aktiviert werden

### Technische Details

**Traccar Docker-Setup (Empfehlung für deinen Server):**
```text
docker run -d \
  --name traccar \
  -p 8082:8082 \   ← Web UI
  -p 5027:5027 \   ← Teltonika Protokoll
  -v /opt/traccar/data:/opt/traccar/data \
  traccar/traccar:latest
```

**FMM003 Configurator-Einstellungen:**
```text
Server: deine-server-ip
Port: 5027
APN: je nach SIM-Anbieter
```

**Datenfluss:**
```text
FMM003 (OBD2/LTE) → Traccar Server (Port 5027)
                          ↓
              sot-telematics-sync (Edge Function, Cron 5min)
                          ↓
              cars_positions_raw → Trip Engine → cars_trips
                          ↓
              LogbookSection UI (Fahrten-Liste, Klassifizierung)
```

