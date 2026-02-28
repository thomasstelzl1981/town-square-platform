

## Plan: Fahrtenbuch-Integration fertigstellen (ohne Server)

Alles, was wir jetzt bauen können, funktioniert sofort in der UI. Traccar-Verbindung wird erst aktiv, wenn du bei Strato die Server-URL hast — dann trägst du nur noch 2 Werte ein und alles läuft.

### Was jetzt gemacht wird

**1. LogbookCreateFlow verbessern**
- "Teltonika FMM003" als eigene Auswahl-Option hinzufügen (statt nur generisch "Teltonika")
- Hersteller-Liste erweitern: `Teltonika FMM003`, `Seeworld R58L`, `Andere`
- `integration_level` automatisch setzen: FMM003 → `B` (OBD2), Seeworld → `A` (GPS-only)

**2. `register_device` Action in die Backend-Funktion einbauen**
- Neue Action in `sot-telematics-sync`: nimmt IMEI + Gerätename, registriert das Gerät automatisch in Traccar via REST API (`POST /api/devices`)
- Speichert die zurückgegebene Traccar-Device-ID in `cars_device_external_refs`
- Wird automatisch beim Erstellen eines Fahrtenbuchs aufgerufen (wenn Tracker ausgewählt)
- Funktioniert erst, wenn Secrets hinterlegt sind — bis dahin wird das Gerät lokal gespeichert und die Traccar-Registrierung übersprungen

**3. Secrets vorbereiten (noch NICHT anlegen)**
- Zwei Secrets werden benötigt: `TRACCAR_BASE_URL` und `TRACCAR_API_TOKEN`
- Diese legen wir erst an, wenn du deine Strato-Zugangsdaten hast
- Der Code prüft, ob die Secrets vorhanden sind und überspringt die Traccar-Kommunikation, wenn nicht

### Was du später machst (nach Strato-Setup)
1. Traccar auf dem Strato-Server installieren (Docker-Befehl, den ich dir dann gebe)
2. Admin-Account erstellen
3. Mir die URL + Zugangsdaten geben → ich lege die 2 Secrets an
4. FMM003 einstecken → Geräte-Registrierung läuft automatisch

### Technische Details

**Dateien die geändert werden:**
- `src/components/portal/cars/logbook/LogbookCreateFlow.tsx` — Hersteller-Optionen erweitern, auto-register Aufruf
- `supabase/functions/sot-telematics-sync/index.ts` — Neue `register_device` Action hinzufügen

**Kein Docker, kein ngrok nötig.** Die UI funktioniert sofort, Fahrten können auch manuell angelegt werden. Die automatische Erkennung startet erst mit Server-Verbindung.

