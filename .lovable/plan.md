
# MOD-00 "Dashboard" aus Navigation entfernen + Sub-Tabs bereinigen

## Problem

MOD-00 "Dashboard" taucht als Modul-Tab unter "Base" auf (neben Stammdaten, KI Office, etc.). Das ist falsch — das Dashboard ist nur ueber den Home-Button erreichbar und soll NICHT als eigener Navigationspunkt existieren.

Zwei Stellen muessen korrigiert werden:

### 1. areaConfig.ts — MOD-00 aus Base-Modules entfernen

In Zeile 29 steht aktuell:
```
modules: ['MOD-00', 'MOD-01', 'MOD-02', 'MOD-03', 'MOD-16', 'MOD-20']
```

MOD-00 muss raus:
```
modules: ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-16', 'MOD-20']
```

Damit verschwindet der "Dashboard"-Tab aus der Level-2-Navigation unter Base. Base hat dann wieder 5 Module (die korrekte Anzahl).

### 2. routesManifest.ts — MOD-00 Tiles leeren

Die 4 Tiles (Widgets, Shortcuts, Aktivitaet, Einstellungen) in Zeile 174-179 werden auf ein leeres Array gesetzt:
```
tiles: []
```

Damit rendert SubTabs nichts mehr, falls MOD-00 jemals als aktives Modul erkannt wird (z.B. ueber die URL /portal/dashboard).

### 3. Test-Datei anpassen

Die Tile-Gesamtzahl in `manifestDrivenRoutes.test.ts` muss von 88 auf 84 reduziert werden (4 Tiles weniger).

## Mobile Navigation

Die MobileBottomNav ist **nicht betroffen** — sie rendert korrekt 5 Buttons (Home + 4 Areas) direkt aus `areaConfig`, ohne MOD-00 einzubeziehen. Das bleibt so.

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/areaConfig.ts` | `'MOD-00'` aus Base-Modules entfernen |
| `src/manifests/routesManifest.ts` | MOD-00 `tiles` auf `[]` setzen |
| `src/test/manifestDrivenRoutes.test.ts` | Tile-Count von 88 auf 84 |
