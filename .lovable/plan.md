
# Analyse der Shop-Module — Zone 2 und Zone 1 Service Desk

## Befunde

### 1. CarsFahrzeuge — Suchfeld-Problem und Hardcoded Demo-Daten

**Problem 1: Suchfeld nimmt zu viel Platz ein (Zeile 262-265)**
Das Suchfeld steht als eigenstaendiges `<div>` zwischen dem `ModulePageHeader` und dem `WidgetGrid`. Es sitzt nicht im Header und nimmt eine ganze Zeile ein. Loesung: Das Suchfeld in die `actions`-Prop des `ModulePageHeader` verschieben, neben den Plus-Button.

**Problem 2: DEMO_VEHICLES Array hardcoded (Zeilen 63-112)**
`CarsFahrzeuge.tsx` enthaelt ein `DEMO_VEHICLES` Array mit 6 hardcoded Fahrzeugen (3 Autos + 3 Bikes). Das ist eine **DEMO DATA VIOLATION** — diese Daten sollten aus der `cars_vehicles` Tabelle via Seed Engine kommen. Allerdings: Diese Daten sind persoenliche Fahrzeuge (nicht Shop-Produkte), daher ist das ein Fallback fuer den Demo-Modus. Da die Seed Engine bereits `cars_vehicles` befuellt (siehe `demo_vehicles.csv`), kann der Fallback entfernt und rein auf DB-Daten vertraut werden.

**Problem 3: DEMO_TRIPS Array hardcoded (Zeilen 115-121)**
Gleiches Problem — 5 hardcoded Fahrtenbuch-Eintraege. Sollten aus `cars_trips` via Seed kommen.

**Problem 4: VEHICLE_IMAGES hardcoded (Zeilen 53-60)**
Ein Mapping von Fahrzeugnamen zu Unsplash-Bildern. Das ist UI-Config und kein Produktdaten-Verstoss, aber fragwuerdig fuer die Wartbarkeit.

### 2. CarsAngebote — Korrekt migriert, aber Bilder fehlen

Die Komponente laedt korrekt via `useActiveServiceProducts('miete24-autos')` und `useActiveServiceProducts('bmw-fokus')`. **Aber**: In der DB haben ALLE 85 Produkte `has_image: false`. Die Bild-URLs fehlen, daher werden leere Platzhalter gerendert. Das betrifft:
- 7 BMW Fokusmodelle — keine Bilder
- 6 Miete24 Autos — keine Bilder  
- 8 Boote — keine Bilder
- 6 Privatjets — keine Bilder
- 6 Amazon — keine Bilder
- 6 Bueroshop24 — keine Bilder
- usw.

### 3. CarsBoote und CarsPrivatjet — Korrekt migriert

Beide laden aus der DB, Rendering funktioniert korrekt. Metadata-Felder (length, guests, highlights, passengers, range, typicalRoute) werden korrekt extrahiert.

### 4. ShopTab (MOD-16) — Korrekt migriert

Amazon, Bueroshop24, Miete24 und Smart Home laden alle dynamisch aus `service_shop_products`. Der `SHOPS`-Config-Record ist reine UI-Config (Display-Namen, Farben, Credential-Felder) — kein Daten-Verstoss.

### 5. PetsShop (MOD-05) — Korrekt migriert

- Ernaehrung: `ProductGrid shopKey="pet-ernaehrung"` — korrekt
- Lennox Tracker: `TrackerProductsFromDB` — DB-basiert, korrekt
- Lennox Style: `ProductGrid shopKey="pet-style"` — korrekt
- Fressnapf: `ProductGrid shopKey="pet-fressnapf"` — korrekt
- **Kleine Restlast:** Fressnapf-Kategorien (Zeilen 396-414) sind hardcoded Links. Das sind aber Navigations-Links (keine Produkte) und somit akzeptabel als UI-Config.

### 6. ServiceDeskProductCRUD (Zone 1) — Funktioniert korrekt

- Sub-Tab Sidebar, Produktliste, CRUD-Dialog, dynamische Metadata-Felder — alles implementiert
- Produktakte (metadata_schema) zeigt korrekte Feldanzahl pro Shop

### 7. Seed-Daten und Accounts

Die Produkte in `service_shop_products` sind globale Katalogdaten (kein `tenant_id`), daher sind sie fuer ALLE Accounts sofort sichtbar. Ein Publish ist nicht noetig fuer die Test-Umgebung — die Daten sind bereits da.

Die `cars_vehicles` Seed-Daten (persoenliche Fahrzeuge) sind tenant-spezifisch und werden nur fuer den Golden Tenant geseeded.

## Massnahmen

### A. CarsFahrzeuge: Suchfeld in Header verschieben
Das Suchfeld wird in die `actions`-Prop des `ModulePageHeader` integriert, neben den Plus-Button. Das spart eine ganze Zeile vertikal.

### B. CarsFahrzeuge: DEMO_VEHICLES Fallback entfernen
Der hardcoded Fallback wird entfernt. Wenn keine DB-Fahrzeuge vorhanden sind und Demo-Modus aktiv ist, werden die geseedeten Fahrzeuge aus `cars_vehicles` angezeigt. Wenn weder DB noch Seed Daten haben, wird ein leerer Zustand gezeigt.

### C. CarsFahrzeuge: DEMO_TRIPS Fallback entfernen  
Die hardcoded Fahrten werden entfernt. Das Fahrtenbuch zeigt nur echte DB-Eintraege.

### D. Produkt-Bilder: Platzhalter-URLs setzen
Alle 85 Produkte in `service_shop_products` bekommen sinnvolle Platzhalter-Bild-URLs (Unsplash), damit Zone 2 nicht leer aussieht. Das geschieht per SQL UPDATE.

## Technische Umsetzung

### Datei-Aenderungen

| Aktion | Datei | Beschreibung |
|--------|-------|-------------|
| EDIT | `src/components/portal/cars/CarsFahrzeuge.tsx` | Suchfeld in Header; DEMO_VEHICLES + DEMO_TRIPS entfernen |
| DB-UPDATE | `service_shop_products` | image_url fuer alle 85 Produkte setzen |

### CarsFahrzeuge.tsx Aenderungen im Detail

1. **Suchfeld (Zeile 262-265)** verschieben in die `actions`-Prop des `ModulePageHeader` (Zeile 252-259):

```text
Vorher:
  ModulePageHeader
    actions = [Plus-Button]
  <div> Suchfeld </div>
  WidgetGrid

Nachher:
  ModulePageHeader
    actions = [Suchfeld + Plus-Button]
  WidgetGrid
```

2. **DEMO_VEHICLES (Zeilen 63-112)** entfernen
3. **DEMO_TRIPS (Zeilen 115-121)** entfernen
4. **Vehicles-Logik (Zeile 176)** anpassen: Kein Fallback mehr auf hardcoded Array

### Bild-Updates (SQL)

Pro Shop-Key Beispiel-Bilder von Unsplash setzen:
- BMW: Passende BMW/MINI Fahrzeugbilder
- Boote: Yacht/Segelboot-Bilder
- Privatjets: Flugzeug-Bilder
- Amazon/Bueroshop24/Miete24: Produkt-Bilder
- Smart Home: Kamera-Bilder
- Pet-Produkte: Tier/Futter-Bilder
