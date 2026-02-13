

# CarsAutos Umbau: Editierbare Fahrzeugakte, Datenraum, Vimcar-Fahrtenbuch

## Zusammenfassung

Die aktuelle CarsAutos-Komponente zeigt hartcodierte Demo-Daten in read-only Feldern. Der Umbau macht alle Felder editierbar (inline-editing mit DB-Persistenz), fuegt einen echten StorageFileManager-Datenraum hinzu und baut das Fahrtenbuch als eigene Sektion im Vimcar-Stil auf (Tabelle mit Fahrten aus `cars_trips`, manuell + API-ready). Zusaetzlich wird die Vimcar-API als Zone-1-Provider vorbereitet.

---

## Aenderung 1: Editierbare Inline-Felder (AkteField wird Formular)

**Datei:** `src/components/portal/cars/CarsAutos.tsx`

Die bestehende `AkteField`-Komponente zeigt nur Text an. Sie wird durch eine editierbare Variante ersetzt:

- Jedes Feld erhaelt einen `isEditing`-State (Klick auf Wert -> Input-Feld)
- Bei Blur/Enter wird der neue Wert per `supabase.from('cars_vehicles').update(...)` gespeichert
- Alle Felder der Akte nutzen die echten DB-Spalten aus `cars_vehicles` (vin, color, fuel_type, power_kw, first_registration_date, engine_ccm, seats, doors, body_type, weight_kg, co2_g_km, holder_name, holder_address, primary_driver_name, etc.)
- Die Versicherungs-Sektion liest aus `cars_insurances` und ist ebenfalls editierbar
- Demo-Daten werden realistischer: BMW M4 Competition G82 (510 PS, Benzin, Isle of Man Gruen), Mercedes GLE 450 (367 PS, Mild-Hybrid, Obsidianschwarz), Porsche 911 Carrera S 992 (450 PS, Benzin, Kreide)
- Fahrzeugbilder werden modell-spezifisch angepasst (passende Unsplash-Bilder fuer M4, GLE, 911)

---

## Aenderung 2: StorageFileManager als Datenraum

**Datei:** `src/components/portal/cars/CarsAutos.tsx`

Unterhalb der Akte-Sektionen wird ein echter `StorageFileManager` eingebaut (gleicher Pattern wie `DatenraumTab` aus MOD-04):

- Liest `storage_nodes` + `documents` + `document_links` fuer das jeweilige Fahrzeug (`object_type: 'vehicle'`, `object_id: vehicle.id`)
- Upload via `useUniversalUpload` mit `moduleCode: 'MOD_17'`
- Download via `sot-dms-download-url` Edge Function
- Ordner erstellen, loeschen, Dateien loeschen — alles wie im DMS
- Die Fahrzeugbilder werden als initiale Demo-Dokumente im Tree angezeigt (Hinweis-Text, da ohne echte Storage-Dateien)

---

## Aenderung 3: Fahrtenbuch-Sektion im Vimcar-Stil

**Datei:** `src/components/portal/cars/CarsAutos.tsx` (Fahrtenbuch-Sektion)

Die bisherige statische Fahrtenbuch-Anzeige (4 hartcodierte Felder) wird durch eine vollstaendige Tabelle ersetzt:

- Liest aus `cars_trips` (vehicle_id = selektiertes Fahrzeug)
- Tabellen-Spalten: Datum, Start, Ziel, km, Zweck (Geschaeftlich/Privat), Kunde
- Neue Fahrt manuell erfassen: Inline-Zeile am Ende der Tabelle (+ Button)
- Fahrten editierbar (Klick auf Zelle -> Input)
- Vimcar-Badge: "Vimcar-Anbindung verfuegbar" mit Status-Indicator (nicht verbunden / verbunden)
- Wenn `cars_logbook_connections` fuer das Fahrzeug existiert: Sync-Status anzeigen (last_sync_at, Fehler)
- Monats-Zusammenfassung: Gesamt-km, Geschaeftlich-%, Privat-%

Demo-Fahrten (wenn DB leer):
- 12.02.2026: Muenchen -> Stuttgart, 234 km, Geschaeftlich, Kunde: Huber GmbH
- 10.02.2026: Muenchen -> Nuernberg, 167 km, Geschaeftlich, Kunde: Meyer AG
- 08.02.2026: Muenchen -> Starnberg, 42 km, Privat
- 05.02.2026: Muenchen -> Augsburg, 68 km, Geschaeftlich, Kunde: Schmidt & Partner
- 03.02.2026: Muenchen -> Garmisch, 89 km, Privat

---

## Aenderung 4: Vimcar API-Provider in Zone 1

**Neue Datei:** `src/config/apiProviders.ts`

Eine Konfigurationsdatei fuer externe API-Provider wird angelegt (Zone-1-Muster):

```text
VIMCAR = {
  id: 'vimcar',
  name: 'Vimcar Fleet',
  baseUrl: 'https://api.vimcar.com/v1',
  authType: 'api_key',
  endpoints: {
    trips: '/trips',
    vehicles: '/vehicles',
    sync: '/sync',
  },
  status: 'planned', // nicht verbunden
  description: 'Automatisches Fahrtenbuch & Fuhrpark-Management'
}
```

Dies dient als Referenz fuer die zukuenftige Integration. Die `cars_logbook_connections`-Tabelle hat bereits ein `provider`-Enum (`car_logbook_provider`) das 'vimcar' enthaelt.

---

## Aenderung 5: Realistische Fahrzeugbilder

Anpassung der `VEHICLE_IMAGES`-Map fuer modell-spezifische Bilder:

| Fahrzeug | Bild |
|----------|------|
| BMW M4 Competition | Unsplash BMW M4 gruen/sportlich |
| Mercedes GLE 450 | Unsplash Mercedes SUV dunkel |
| Porsche 911 Carrera S | Unsplash Porsche 911 weiss/hell |

---

## Technische Details

### Editierbare Akte — Ablauf

```text
Klick auf Wert
  -> State: editingField = 'license_plate'
  -> Input wird angezeigt (vorausgefuellt)
  -> Blur oder Enter:
     -> supabase.from('cars_vehicles').update({ license_plate: newValue }).eq('id', vehicleId)
     -> queryClient.invalidateQueries(['cars_vehicles'])
     -> Toast: "Kennzeichen aktualisiert"
```

### Datenraum — Architektur (identisch zu DatenraumTab/MOD-04)

```text
StorageFileManager
  <- storage_nodes (tenant_id + object_type='vehicle' + object_id=vehicleId)
  <- documents (via document_links)
  <- useUniversalUpload (moduleCode='MOD_17', entityId=vehicleId)
  <- sot-dms-download-url (Edge Function fuer Downloads)
```

### Fahrtenbuch — Vimcar-ready

```text
cars_trips Tabelle (bereits vorhanden):
  - vehicle_id, start_at, end_at, start_address, end_address
  - distance_km, classification (business/private), purpose, customer_name
  - source (manual/vimcar/other), connection_id (FK auf cars_logbook_connections)

cars_logbook_connections (bereits vorhanden):
  - vehicle_id, provider (vimcar), status (pending/active/error)
  - api_credentials_encrypted, last_sync_at, sync_error_message
```

### Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| UMBAU | `src/components/portal/cars/CarsAutos.tsx` — Editierbare Felder, Datenraum, Fahrtenbuch |
| NEU | `src/config/apiProviders.ts` — Zone-1 API-Provider-Registry (Vimcar) |

Keine Datenbank-Migration noetig — alle Tabellen (`cars_vehicles`, `cars_insurances`, `cars_trips`, `cars_logbook_connections`, `storage_nodes`, `documents`, `document_links`) existieren bereits.

