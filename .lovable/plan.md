

# Fix: ServiceDeskFahrzeuge — Korrektur der Sub-Tabs

## Das Problem

`ServiceDeskFahrzeuge.tsx` hat aktuell 4 Sub-Tabs:

```text
Fahrzeuge | Boote | Privatjet | Angebote
```

**"Fahrzeuge" ist FALSCH hier.** Der Tab `/portal/cars/fahrzeuge` (CarsFahrzeuge) ist eine persoenliche Fahrzeugverwaltung — der User legt dort seine eigenen Autos und Bikes an (CRUD auf `cars_vehicles` Tabelle). Das ist kein Shop und gehoert nicht in den Service Desk.

Die eigentlichen Shop-Bereiche in MOD-17 mit hardcoded Daten sind:

| Zone 2 Komponente | Inhalt | Hardcoded Produkte |
|---|---|---|
| CarsAngebote | BMW/MINI Fokusmodelle (Helming und Sohn) | 7 Modelle |
| CarsAngebote | Miete24 Auto-Abos | 6 Angebote |
| CarsBoote | Haller Experiences Yacht Charter | 8 Boote |
| CarsPrivatjet | NetJets Fleet | 6 Jets |

## Die Loesung

### 1. ServiceDeskFahrzeuge.tsx — Sub-Tabs korrigieren

Sub-Tabs aendern von:

```text
Fahrzeuge | Boote | Privatjet | Angebote
```

zu:

```text
BMW Fokusmodelle | Miete24 | Boote | Privatjet
```

Die Shop-Keys werden:
- `bmw-fokus` — BMW und MINI Fokusmodelle (Helming und Sohn)
- `miete24-autos` — Miete24 Auto-Abo Angebote
- `boote` — Haller Experiences Yacht Charter
- `privatjet` — NetJets Fleet

### 2. Zone 2 Komponenten — Hardcoded Daten durch DB ersetzen

Alle drei Komponenten enthalten hardcoded Produkt-Arrays, die ueber den Service Desk in Zone 1 bestuckt werden sollten:

**CarsAngebote.tsx:**
- `MIETE24_OFFERS` (6 Eintraege, Zeilen 44-51) entfernen
- `FOKUS_MODELLE` (7 Eintraege, Zeilen 54-97) entfernen
- Stattdessen: `useActiveServiceProducts('miete24-autos')` und `useActiveServiceProducts('bmw-fokus')` laden
- Rendering bleibt gleich, Daten kommen aus `service_shop_products.metadata` (JSONB) fuer spezifische Felder wie `power`, `term`, `kmPerYear`, `configLink`

**CarsBoote.tsx:**
- `IBIZA_BOATS` (8 Eintraege, Zeilen 31-88) entfernen
- Stattdessen: `useActiveServiceProducts('boote')` laden
- Boot-spezifische Felder (length, guests, highlights) in `metadata` JSONB

**CarsPrivatjet.tsx:**
- `NETJETS_FLEET` (6 Eintraege, Zeilen 32-75) entfernen
- Stattdessen: `useActiveServiceProducts('privatjet')` laden
- Jet-spezifische Felder (passengers, range, typicalRoute) in `metadata` JSONB

### 3. CarsFahrzeuge bleibt UNVERAENDERT

Die persoenliche Fahrzeugverwaltung (`CarsFahrzeuge.tsx`) wird NICHT angetastet. Sie funktioniert korrekt mit der `cars_vehicles` Tabelle und hat nichts mit dem Service Desk zu tun.

## Dateien

| Aktion | Datei |
|---|---|
| EDIT | `src/pages/admin/service-desk/ServiceDeskFahrzeuge.tsx` — Sub-Tabs korrigieren |
| EDIT | `src/components/portal/cars/CarsAngebote.tsx` — Hardcoded Daten durch DB ersetzen |
| EDIT | `src/components/portal/cars/CarsBoote.tsx` — Hardcoded Daten durch DB ersetzen |
| EDIT | `src/components/portal/cars/CarsPrivatjet.tsx` — Hardcoded Daten durch DB ersetzen |
| NICHT | `src/components/portal/cars/CarsFahrzeuge.tsx` — bleibt unveraendert |

## Technischer Ansatz

Die spezifischen Felder (z.B. `power`, `configLink`, `range`, `highlights`) werden im `metadata` JSONB-Feld von `service_shop_products` gespeichert. Das Service Desk CRUD zeigt diese als generische Felder an. Die Zone 2 Komponenten lesen sie typsicher aus:

```typescript
// Beispiel: CarsAngebote
const { data: miete24 } = useActiveServiceProducts('miete24-autos');
const { data: bmwFokus } = useActiveServiceProducts('bmw-fokus');

// Felder aus metadata extrahieren
const fuel = product.metadata?.fuel as string;
const configLink = product.metadata?.configLink as string;
```

