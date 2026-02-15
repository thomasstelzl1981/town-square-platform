

# Reparaturplan: MediaWidget fuellt WidgetCell nicht aus

## Fehleranalyse

Die CI-Architektur ist korrekt:
- `WidgetGrid` (4 Spalten) und `WidgetCell` (`h-[260px] md:h-auto md:aspect-square`) sind korrekt eingesetzt
- Das Problem liegt in `MediaWidget.tsx`: Der `<button>` hat kein `h-full w-full` und fuellt daher die quadratische WidgetCell NICHT aus

```text
IST-ZUSTAND:
+------------------+
| WidgetCell       |
| (aspect-square)  |
|  +--------+      |
|  |MediaWid|      |  <-- Button nur so gross wie Content
|  |  Icon  |      |
|  |  Text  |      |
|  +--------+      |
|                  |
+------------------+

SOLL-ZUSTAND:
+------------------+
|  MediaWidget     |
|  h-full w-full   |
|                  |
|     Icon         |  <-- Button fuellt gesamte Zelle
|     Titel        |
|     Subtitle     |
|     Badge        |
|                  |
+------------------+
```

## Fix

### Datei: `src/components/shared/MediaWidget.tsx`

Eine Zeile ergaenzen — `h-full w-full` zum Button hinzufuegen:

Zeile 26, aendern von:
```
'relative flex flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center',
```
zu:
```
'relative h-full w-full flex flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center',
```

Das ist der gesamte Fix. Die WidgetCell gibt die quadratische Form vor, der MediaWidget-Button fuellt sie jetzt komplett aus.

## Begriffsklaerung fuer zukuenftige Kommunikation

| Begriff | Bedeutung |
|---------|-----------|
| **WidgetCell** | Der CI-Wrapper aus dem Design Manifest — erzwingt `aspect-square` auf Desktop, `h-[260px]` auf Mobile |
| **WidgetGrid** | Das 4-Spalten-Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) |
| **"CI-Kachel"** oder **"Widget"** | Jede Komponente innerhalb einer WidgetCell — MUSS `h-full w-full` haben |

Wenn Sie in Zukunft "quadratische CI-Kachel" oder einfach "Widget im WidgetGrid" sagen, ist klar: WidgetGrid + WidgetCell + Inhalt mit `h-full w-full`.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/shared/MediaWidget.tsx` | `h-full w-full` zum Button hinzufuegen |

Keine weiteren Dateien betroffen. Keine DB-Migration noetig.

