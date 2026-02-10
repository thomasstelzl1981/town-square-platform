

# Area-Reihenfolge neu sortieren

## Aenderung

Die Reihenfolge der 4 Areas in der Top-Navigation wird umgestellt:

| Position | Alt | Neu |
|----------|-----|-----|
| 1 | Base | **Missions** |
| 2 | Missions | **Operations** |
| 3 | Operations | **Base** |
| 4 | Services | **Services** |

## Betroffene Datei

**`src/manifests/areaConfig.ts`** -- Die Reihenfolge des `areaConfig`-Arrays bestimmt die Tab-Reihenfolge in der `AreaTabs`-Komponente. Die Array-Eintraege werden einfach umsortiert (missions, operations, base, services). Keine inhaltlichen Aenderungen an den Definitionen selbst.

## Risiko

Kein Risiko. Nur die Anzeigereihenfolge aendert sich, keine Routen, keine Daten, keine Logik betroffen.

