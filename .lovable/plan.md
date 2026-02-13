
# Sanierung Dashboard: Button durch CTA-Widget ersetzen

## Aenderung

Datei: `src/pages/portal/immobilien/SanierungTab.tsx`

### Was wird entfernt
- Der `actions`-Prop im `ModulePageHeader` (Zeilen 33-38) — der "Sanierung starten"-Button rechts oben verschwindet
- Der Empty-State-Block (Zeilen 46-61) — die grosse zentrierte Karte mit dem HardHat-Icon wird nicht mehr benoetigt, da das CTA-Widget immer sichtbar ist

### Was wird hinzugefuegt
- Ein festes **CTA-Widget** im `WidgetGrid`, das als **erstes Widget** (links) angezeigt wird — vor den bestehenden ServiceCaseCards
- Das Widget nutzt `WidgetCell` + `WidgetHeader` (Icon: `Plus`, Title: "Neue Sanierung starten")
- Klick oeffnet den bestehenden `ServiceCaseCreateDialog`
- Gleiche Groesse und Stil wie die ServiceCaseCards (aspect-square, Card-Design)

### Neues Layout

```text
+-----------+  +-----------+  +-----------+
|  CTA      |  |  Case 1   |  |  Case 2   |
|           |  |           |  |           |
|    +      |  | Badezimmer|  |  Dach     |
|   Neue    |  | Sanierung |  | Sanierung |
| Sanierung |  |           |  |           |
|  starten  |  | Status... |  | Status... |
+-----------+  +-----------+  +-----------+
```

### Imports
- Hinzufuegen: `WidgetGrid`, `WidgetCell`, `WidgetHeader` aus shared-Komponenten
- Entfernen: `Button`-Import (nicht mehr benoetigt), Empty-State-spezifische Elemente

### Logik
- Das WidgetGrid wird **immer** gerendert (kein Empty-State-Branch mehr)
- Erstes Element im Grid: CTA-Widget
- Danach: bestehende `ServiceCaseCard`-Map ueber `activeCases`
- Loading-State bleibt mit Skeletons
