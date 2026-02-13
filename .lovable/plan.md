
# MOD-17: Autos + Bikes zusammenlegen zu "Fahrzeuge" (4 Tabs)

## Ziel

Die bisherigen 5 Tabs (Autos, Bikes, Boote, Privatjet, Angebote) werden auf 4 reduziert, indem "Autos" und "Bikes" zu einem einzigen Tab **"Fahrzeuge"** zusammengefuehrt werden.

## Aenderungen

### 1. routesManifest.ts — Tiles von 5 auf 4

Vorher:
```
tiles: [
  { path: "autos",     title: "Autos" },
  { path: "bikes",     title: "Bikes" },
  { path: "boote",     title: "Boote" },
  { path: "privatjet", title: "Privatjet" },
  { path: "angebote",  title: "Angebote" },
]
```

Nachher:
```
tiles: [
  { path: "fahrzeuge",  component: "CarsFahrzeuge", title: "Fahrzeuge" },
  { path: "boote",      component: "CarsBoote",     title: "Boote" },
  { path: "privatjet",  component: "CarsPrivatjet",  title: "Privatjet" },
  { path: "angebote",   component: "CarsAngebote",   title: "Angebote" },
]
```

### 2. CarsPage.tsx — Routes anpassen

- Entfernen: Routen fuer `autos` und `bikes`
- Hinzufuegen: Route fuer `fahrzeuge`
- Default-Redirect: `Navigate to="fahrzeuge"`

### 3. Neue Komponente: CarsFahrzeuge.tsx

Basiert auf dem bestehenden `CarsAutos.tsx`, erweitert um die Bike-Daten:

- **Header**: "Fahrzeuge" (statt "Autos")
- **Demo-Daten**: Die 3 Demo-Autos (BMW M4, Mercedes GLE, Porsche 911) + die 3 Demo-Bikes (BMW R 1300 GS, Ducati Panigale V4 S, Harley-Davidson Road Glide) werden in einer gemeinsamen Liste dargestellt
- **Widget-Grid**: Alle 6 Fahrzeuge als Kacheln — Autos mit `Car`-Icon, Bikes mit `Bike`-Icon
- **DB-Query**: Laedt weiterhin aus `cars_vehicles` (dort koennen sowohl Autos als auch Motorraeder gespeichert sein, unterscheidbar z.B. ueber `body_type` oder ein neues Feld)
- **VehicleCreateDialog**: Bleibt unveraendert, "Fahrzeug hinzufuegen" deckt beides ab
- **Inline-Akte**: Identisch zu CarsAutos, funktioniert fuer beide Typen

### 4. index.ts — Exporte anpassen

- Entfernen: `CarsAutos`, `CarsBikes`
- Hinzufuegen: `CarsFahrzeuge`

### 5. ManifestRouter / Component Map

Falls `CarsFahrzeuge` dort registriert werden muss, wird der Eintrag hinzugefuegt.

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| NEU | `src/components/portal/cars/CarsFahrzeuge.tsx` — Zusammengefuehrte Autos+Bikes Komponente |
| EDIT | `src/manifests/routesManifest.ts` — 4 Tiles statt 5 |
| EDIT | `src/pages/portal/CarsPage.tsx` — Routes aktualisieren |
| EDIT | `src/components/portal/cars/index.ts` — Exporte anpassen |

Die Dateien `CarsAutos.tsx` und `CarsBikes.tsx` bleiben im Dateisystem bestehen (koennen spaeter entfernt werden), werden aber nicht mehr importiert oder geroutet.
