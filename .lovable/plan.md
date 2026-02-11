

# Angebotsvergleichsmanager: Vollstaendige Struktur immer sichtbar

## Problem

Aktuell zeigt der Manager im Leerzustand nur die Upload-Karte und einen kleinen Alert-Hinweis. Die Vergleichstabelle und die Vergabe-Aktionen erscheinen erst, wenn Angebote vorhanden sind. Das wirkt unfertig und der Nutzer sieht nicht, was ihn erwartet.

## Loesung

Die komplette Struktur wird immer angezeigt — auch ohne Daten. Der Nutzer sieht sofort den gesamten Workflow:

### Aufbau (von oben nach unten):

1. **Header-Karte "Angebotsvergleich"** (immer sichtbar)
   - Icon (BarChart3) + Titel + Beschreibung
   - Status-Badges: Anzahl hochgeladener Angebote, Anzahl ausgewertet
   - Falls Zuschlag erteilt: Gewinner-Badge

2. **Hochgeladene Angebote** (immer sichtbar)
   - Liste aller Angebote als kompakte Zeilen (Dateiname, Anbieter, Status-Badge)
   - Leerzustand: Grauer Platzhalter-Text "Noch keine Angebote hochgeladen"
   - Extraktions-Status inline (Loader oder Haekchen)

3. **Upload-Bereich** (immer sichtbar, aber kompakter)
   - Drag-and-Drop Zone — bleibt wie bisher, aber optisch etwas kleiner

4. **Vergleichstabelle** (immer sichtbar)
   - Im Leerzustand: Tabelle mit Platzhalter-Spalten und gestrichelten Zellen
   - Zeigt exemplarisch die Struktur: "Position | Anbieter 1 | Anbieter 2 | Anbieter 3"
   - Zellen enthalten "—" als Platzhalter
   - Summenzeile unten
   - Mit Daten: Befuellt sich automatisch wie bisher

5. **Vergabe-Aktionen** (immer sichtbar)
   - Im Leerzustand: Deaktivierter Button "Zuschlag erteilen" mit Hinweis "Laden Sie mindestens ein Angebot hoch"

## Technische Aenderungen

### Datei: `OfferComparisonPanel.tsx`

- Entfernen der bedingten Darstellung (`{extractedOffers.length > 0 && ...}`) fuer Tabelle und Aktionen
- Stattdessen: Immer rendern, aber mit Leerzustand-Varianten
- Leere Tabelle zeigt 3 Platzhalter-Spalten mit gestrichelten Borders und "—" Werten
- Alert am Ende entfernen (wird durch die integrierte Leerzustand-Darstellung ersetzt)
- Header-Karte mit Status-Badges hinzufuegen (z.B. "0 Angebote", "0 ausgewertet")
- Alles in einem durchgaengigen Layout statt separaten Karten wo moeglich

Eine Datei, keine DB-Aenderungen.

