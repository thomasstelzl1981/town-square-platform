

# Portfolio-Redesign: Exakt 3 Widgets

## Das Problem

Aktuell werden dynamisch N+1 Widgets erzeugt (1x "Alle" + N Kontexte) plus ein separater "Verwalten"-Button. Das fuehrt zu einer ueberladenen, doppelten Struktur.

## Neues Layout — Genau 3 Widgets

```text
+-----------+  +-----------+  +-----------+
|  WIDGET 1 |  |  WIDGET 2 |  |  WIDGET 3 |
|           |  |           |  |           |
|   Alle    |  |  Familie  |  |    +      |
| Immobilien|  | Mustermann|  |   Neue    |
|           |  |           |  | Vermieter-|
| 5 Objekte |  | 3 Objekte |  |  einheit  |
| KPIs      |  | KPIs      |  |  anlegen  |
+-----------+  +-----------+  +-----------+
```

- **Widget 1**: "Alle Immobilien" — Gesamtportfolio-KPIs (Objekte, Verkehrswert, Rendite). Immer vorhanden.
- **Widget 2**: Erster vorhandener Kontext (z.B. "Familie Mustermann") — kontext-spezifische KPIs. Bei Klick wird gefiltert.
- **Widget 3**: "Neue Vermietereinheit anlegen" — Plus-Icon, Klick oeffnet den CreateContextDialog. Kein KPI-Inhalt, sondern ein Call-to-Action-Widget im gleichen Design.

Falls mehr als 1 Kontext existiert, werden Widget 2..N dynamisch eingefuegt und das "Anlegen"-Widget rutscht ans Ende (max 4 Spalten im Grid).

## Aenderung

Nur eine Datei: `src/pages/portal/immobilien/PortfolioTab.tsx`

### Was wird entfernt
- Der separate "Verwalten"-Button (Zeilen 761-770)
- Das Collapsible ContextManager-Panel (Zeilen 772-778)
- Die Collapsible/ContextManager-Imports und der `showContextManager`-State

### Was wird geaendert
- Die dynamische Widget-Schleife (Zeilen 709-757) bleibt, aber nach dem letzten Kontext-Widget kommt ein **festes drittes Widget** als "Neue Vermietereinheit anlegen" (Plus-Icon, gleiche Card-Groesse, gleicher WidgetHeader-Stil)
- Klick auf das dritte Widget oeffnet direkt den `CreateContextDialog` (bereits importiert und vorhanden in KontexteTab/ContextManager)
- Fuer die Verwaltung bestehender Kontexte: Klick auf ein Kontext-Widget waehlt es aus UND zeigt optional einen kleinen "Bearbeiten"-Link im Widget selbst (statt separatem Panel)

### Technisch

- `WidgetGrid`, `WidgetCell`, `WidgetHeader` werden weiterhin genutzt
- Das "Anlegen"-Widget nutzt `WidgetHeader` mit `Plus`-Icon und Title "Neue Vermietereinheit"
- Der `CreateContextDialog` wird direkt in PortfolioTab importiert und per State gesteuert
- `ContextManager`-Import und Collapsible werden entfernt

