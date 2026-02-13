
# MOD-17 Fahrzeuge — Umbau abgeschlossen

## Neue Menüstruktur (5 Tiles)

| # | Path | Titel | Inhalt |
|---|------|-------|--------|
| 1 | autos | Autos | Widget-Grid + Inline-Fahrzeugakte |
| 2 | bikes | Bikes | Motorrad-Widgets + Inline-Akte |
| 3 | boote | Boote | Haller Experiences Ibiza Charter |
| 4 | privatjet | Privatjet | NetJets Flotte |
| 5 | angebote | Angebote | Miete24 + BMW/MINI Fokusmodelle |

## Reihenfolge in Base

`['MOD-03', 'MOD-18', 'MOD-17', 'MOD-19', 'MOD-01']`

MOD-17 nach Finanzmanager, vor Photovoltaik.

## Geänderte Dateien

- `src/manifests/areaConfig.ts` — Reihenfolge
- `src/manifests/routesManifest.ts` — Tiles
- `src/pages/portal/CarsPage.tsx` — Routing
- `src/components/portal/cars/CarsAutos.tsx` — NEU
- `src/components/portal/cars/CarsBikes.tsx` — NEU
- `src/components/portal/cars/CarsBoote.tsx` — NEU
- `src/components/portal/cars/CarsPrivatjet.tsx` — NEU
- `src/components/portal/cars/CarsAngebote.tsx` — Komplett umgebaut
- `src/components/portal/cars/index.ts` — Aktualisiert
