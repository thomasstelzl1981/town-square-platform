
# Armstrong Orb: Resize-Verhalten verbessern

## Problem

Der Armstrong-Orb (eingeklappt) wird per `useDraggable` Hook positioniert. Beim Resize des Browserfensters wird die Position nur an die Viewport-Grenzen geklemmt (`constrainPosition`), aber der Orb bleibt an seiner absoluten X/Y-Position. Das bedeutet: Fenster verkleinern -> Orb verdeckt Inhalte in der Mitte statt ins Eck zu rutschen.

## Loesung

Den Resize-Handler im `useDraggable` Hook so aendern, dass der Orb **relativ zur unteren rechten Ecke** positioniert bleibt. Wenn der User den Orb nicht manuell verschoben hat, bleibt er immer unten rechts. Wenn er verschoben wurde, wird beim Resize die Position proportional angepasst oder auf die Default-Position (unten rechts) zurueckgesetzt.

## Technische Umsetzung

### Datei: `src/hooks/useDraggable.ts`

**Aenderung im Resize-Handler (Zeilen 202-215):**

Statt nur `constrainPosition` aufzurufen, wird die Position relativ zum Viewport-Rand berechnet:

1. Beim Setzen der Position wird der **Abstand zum rechten und unteren Rand** gespeichert (`offsetFromRight`, `offsetFromBottom`)
2. Beim Resize wird die neue Position aus diesen Offsets berechnet: `x = newWidth - offsetFromRight`, `y = newHeight - offsetFromBottom`
3. Danach wird `constrainPosition` angewendet, damit der Orb nie ausserhalb des Viewports landet

Das ergibt ein natuerliches Verhalten: Der Orb "klebt" am rechten/unteren Rand und bewegt sich mit, wenn das Fenster groesser oder kleiner wird.

**Konkrete Aenderungen:**

- Neuer `useRef` fuer `rightBottomOffset` (Abstand zum rechten/unteren Rand)
- Bei jeder Positionsaenderung (Drag-Ende, Initial) den Offset aktualisieren
- Im `resize`-EventListener: Position = `(viewportWidth - offsetRight, viewportHeight - offsetBottom)`, dann constrainen

### Keine weiteren Dateien betroffen

Die Aenderung ist komplett im Hook gekapselt. `ArmstrongContainer.tsx` und alle anderen Konsumenten profitieren automatisch.
