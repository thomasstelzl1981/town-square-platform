

## Fix: Demo-Fahrzeuge auf 2 reduzieren (BMW M4 + Mercedes GLE)

### Ist-Zustand
- `demo_vehicles.csv` enthaelt 6 Eintraege (3 Autos + 3 Bikes)
- Seed-Engine erwartet `cars_vehicles: 6`
- Alle 6 sind in der Demo-DB vorhanden

### Soll-Zustand
- Nur 2 Fahrzeuge: BMW M4 Competition (d0000000-...0301) + Mercedes GLE 450 (d0000000-...0302)

### Umsetzung

| # | Datei / Aktion | Aenderung |
|---|----------------|-----------|
| 1 | `public/demo-data/demo_vehicles.csv` | Zeilen 4-7 entfernen (Porsche, BMW Bike, Ducati, Harley) |
| 2 | `src/hooks/useDemoSeedEngine.ts` | `cars_vehicles: 6` auf `cars_vehicles: 2` aendern; `oldVehicleIds`-Array auf die 4 entfernten IDs erweitern (0303-0306) |
| 3 | DB Cleanup | DELETE aus `cars_vehicles` WHERE id IN (0303, 0304, 0305, 0306) AND tenant_id = Demo-Tenant |
| 4 | DB Cleanup | DELETE aus `storage_nodes` WHERE entity_id IN (0303, 0304, 0305, 0306) AND module_code = 'MOD-17' |

