

# Portfolio-Redesign: 3-Widget-Ansicht statt Kontext-Leiste

## Problem

Die aktuelle Portfolio-Seite hat eine redundante Struktur:
- Oben: Kleine Kontext-Auswahl-Kacheln ("Alle", "Familie Mustermann", Firma, "Verwalten")
- Darunter: KPI-Zeile (5 StatCards)
- Darunter: Charts und Tabelle

Die kleinen Kacheln oben und die Widgets unten sind doppelt. Der User moechte stattdessen **3 grosse Widgets** im WidgetGrid sehen, die als Schritte fungieren.

## Neues Layout

```text
+--------------------------------------------------+
| PageShell: PORTFOLIO                             |
+--------------------------------------------------+
|                                                  |
|  +-----------+  +-----------+  +-----------+     |
|  |  WIDGET 1 |  |  WIDGET 2 |  |  WIDGET 3 |     |
|  |           |  |           |  |           |     |
|  |   Alle    |  |  Familie  |  |  Firma    |     |
|  | Immobilien|  | Mustermann|  |  GmbH     |     |
|  |           |  |           |  |           |     |
|  | 5 Objekte |  | 3 Objekte |  | 2 Objekte |     |
|  | KPIs      |  | KPIs      |  | KPIs      |     |
|  +-----------+  +-----------+  +-----------+     |
|                                                  |
|  [+ Vermietereinheit]  [Verwalten]               |
|                                                  |
|  --- Ab hier: Detail fuer gewaehlten Kontext --- |
|  KPI-Zeile (5 Cards)                             |
|  Charts (Vermoegen + EUeR)                       |
|  Tabelle (Immobilienportfolio)                    |
|  Investment-Kalkulation                           |
+--------------------------------------------------+
```

## Design-Konzept

Jedes der 3 Widgets ist eine grosse Kachel im `WidgetGrid` (max 4 Spalten, `aspect-square` Desktop, `h-[260px]` Mobile):

- **Widget 1 "Alle Immobilien"**: Zeigt Gesamtportfolio-KPIs (Objekte, Verkehrswert, Rendite). Klick = kein Kontext-Filter (alle Daten).
- **Widget 2 "Familie Mustermann"** (oder andere private Kontexte): Zeigt kontext-spezifische KPIs. Klick = filtert auf diesen Kontext.
- **Widget 3 "Firma XY GmbH"** (geschaeftliche Kontexte): Analog zu Widget 2.

Bei Klick auf ein Widget wird dieses visuell hervorgehoben (ring-2, border-primary) und die darunter liegenden KPIs, Charts und Tabelle aktualisieren sich auf den gewaehlten Kontext — genau wie bisher, aber ohne die kleinen redundanten Kacheln.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Kompletter Umbau der Kontext-Auswahl: Kleine Kacheln (Zeilen 631-709) ersetzen durch WidgetGrid mit 3 grossen WidgetCells. KPI-Zeile (Zeilen 718-745) bleibt, wandert unter die Widget-Auswahl. "Verwalten"-Button wird als kleine Aktion unter den Widgets platziert |

## Keine weiteren Dateien betroffen

- Keine Manifest-Aenderung (Tiles/Routen bleiben gleich)
- Keine DB-Migration (tile_catalog unveraendert)
- Keine Spec/Audit-Aenderung (rein visuelles Redesign innerhalb PortfolioTab)
- ContextManager-Collapsible bleibt funktional

## Technische Umsetzung

### Widget-Karten Inhalt

Jede Widget-Karte zeigt:
- **Header**: Icon-Box + Kontext-Name (via WidgetHeader)
- **Badge**: "Privat" oder "Geschaeftlich"
- **Mini-KPIs**: Objekte, Verkehrswert, Rendite (3 kompakte Zeilen)
- **Visueller Zustand**: Ausgewaehlte Karte hat `ring-2 ring-primary border-primary`

### Dynamisches Grid

- 1 Kontext = 1 Widget (Spalte)
- "Alle" ist immer Widget 1
- Kontexte werden dynamisch aus der DB geladen (wie bisher)
- Bei mehr als 3 Kontexten: 4. Spalte nutzen (max 4 im Grid)
- "Verwalten" und "+ Neue Einheit" als Buttons unterhalb des Grids

### Imports

Nutzt bestehende Shared-Komponenten:
- `WidgetGrid` (variant="widget")
- `WidgetCell`
- `WidgetHeader`

