

# Phase 2–4: Fahrtenbuch fertigstellen

## Bestandsaufnahme

Phase 1 (erledigt):
- 8 DB-Tabellen erstellt, `cars_trips` erweitert
- Trip Engine (`spec.ts` + `engine.ts`) erstellt
- `VimcarLogbook` entfernt, `LogbookSection` mit Collapsed Widgets eingebaut
- `LogbookExpandedView` ist noch ein Platzhalter

## Phase 2: Edge Function `sot-telematics-sync`

Neue Edge Function `supabase/functions/sot-telematics-sync/index.ts`:

- **Zweck**: Pollt Traccar REST API, schreibt normalisierte Positionen in `cars_positions_raw`, aktualisiert `cars_device_status`, führt Trip Engine aus
- **Auth**: Bearer Token via `TRACCAR_BASE_URL` + `TRACCAR_API_TOKEN` Secrets (müssen vom User konfiguriert werden)
- **Flow**:
  1. Alle aktiven Devices mit `source_type = 'traccar'` laden + deren `cars_device_external_refs`
  2. Pro Device: `GET {TRACCAR_BASE_URL}/api/positions?deviceId={externalId}&from={lastSync}&to={now}`
  3. Positionen normalisieren → UPSERT in `cars_positions_raw` (idempotent via `source_position_id`)
  4. `cars_device_status` aktualisieren (last_signal, is_online, last_lat/lon)
  5. Pro Logbook/Device: Trip Engine mit Positionen im Zeitfenster aufrufen
  6. Neue Trips → INSERT in `cars_trips`
  7. Detection Run → INSERT in `cars_trip_detection_runs`
- **CORS**: Verwendet bestehende `_shared/cors.ts`
- **config.toml**: `[functions.sot-telematics-sync] verify_jwt = false`
- **Cron**: Nicht jetzt einrichten — erst wenn Traccar-Server steht

Secrets benötigt (erst bei Traccar-Setup):
- `TRACCAR_BASE_URL`
- `TRACCAR_API_TOKEN`

## Phase 3: UI Expanded View — vollständige Sektionen

Ersetze den Platzhalter `LogbookExpandedView` in `LogbookSection.tsx` durch ein Tab-basiertes Inline-Detail mit 6 Sektionen:

### A) Gerät (`LogbookDeviceInfo`)
- Lädt `cars_devices` + `cars_device_status` für das Logbook
- Zeigt: IMEI, Protokolltyp, Hersteller, Online/Offline, letztes Signal, Integration Level (A/B)
- Kein Traccar-Branding — nur "Telematics Gateway"

### B) Offene Fahrten (`LogbookOpenTrips`)
- Query: `cars_trips` WHERE `logbook_id = X` AND `classification = 'unclassified'`
- Schnellzuordnung: Buttons für privat/geschäftlich/arbeitsweg
- Felder für Zweck + Geschäftspartner (inline editierbar)
- Mutation: UPDATE `cars_trips` + INSERT `cars_trip_audit`

### C) Fahrtenübersicht (`LogbookTripList`)
- Tabelle aller Fahrten des Logbooks
- Monatsfilter (Select)
- Statusanzeige: offen / klassifiziert / gelockt
- Distanz, Start/End, Dauer, Klassifizierung

### D) Monatsabschluss (`LogbookMonthClose`)
- Zeigt alle noch nicht abgeschlossenen Monate
- Button "Monat abschließen"
- Mutation: INSERT `cars_logbook_locks` + UPDATE `cars_trips` SET `is_locked = true`
- Warnung wenn offene Fahrten im Monat

### E) Export (`LogbookExport`)
- PDF-Export via jsPDF (bereits installiert)
- CSV-Export
- Monatsauswahl, enthält Gesamtkilometer + Privat/Geschäftlich-Anteile

### F) Änderungsprotokoll (`LogbookAuditLog`)
- Query: `cars_trip_audit` WHERE trip_id IN (trips des logbooks)
- Tabelle: Feld, alter Wert, neuer Wert, User, Zeitpunkt, Grund

### LogbookCreateFlow
- Der "+ Fahrtenbuch anlegen" Button öffnet einen Inline-Flow:
  1. Fahrzeug auswählen (Select aus `cars_vehicles`)
  2. Optional: Tracker verbinden (IMEI + Hersteller eingeben → INSERT `cars_devices` + `cars_device_external_refs`)
  3. Erstellen → INSERT `cars_logbooks`

Alle neuen Komponenten in `src/components/portal/cars/logbook/`.

## Phase 4: Cleanup & Registrierungen

1. **CarsFahrtenbuch.tsx**: Datei löschen (wird nicht mehr geroutet, LogbookSection ersetzt sie)
2. **LOGBOOK_OFFERS** (hardcoded in CarsFahrtenbuch.tsx): Entfallen — die Provider-Angebote gehören zum ServiceDesk, nicht ins Fahrtenbuch
3. **`src/config/demoDataRegistry.ts`**: Existiert nicht als separate Datei — Demo-Daten sind in `useDemoSeedEngine.ts` registriert. Kein Eintrag nötig, da das Fahrtenbuch echte Daten nutzt (keine Demo-Seeds für Logbooks/Trips in Phase 1)
4. **ENGINE_REGISTRY.md**: ENG-TRIP bereits registriert in Phase 1
5. **engines/index.ts**: Bereits exportiert in Phase 1

## Implementierungs-Reihenfolge

```text
1. Edge Function sot-telematics-sync erstellen
2. config.toml: verify_jwt = false Eintrag
3. LogbookCreateFlow bauen (Fahrzeug wählen + Tracker verbinden)
4. LogbookExpandedView: 6 Sektionen implementieren
5. CarsFahrtenbuch.tsx löschen
```

## Freeze-Status

- MOD-17: UNFROZEN (vom User bestätigt)
- ENG-TRIP: Nicht in engines_freeze.json (neu)
- Edge Functions: UNFROZEN (`frozen: false`)
- Manifests: FROZEN — keine Änderungen an routesManifest nötig (CarsFahrtenbuch war dort schon nicht mehr gelistet)

