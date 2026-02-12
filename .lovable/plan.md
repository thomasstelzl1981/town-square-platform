

# Fix: Objekte aus Kaufy — 3-Zeilen-Design und Datenproblem

## Fehleranalyse

### Problem 1: Zu wenig Daten in der View
Die View `v_public_listings` enthaelt aktuell nur **1 Listing** (Leipzig, Blochmannstrasse). Wenn man etwas anderes tippt, erscheint kein Dropdown und das 3-Zeilen-Design ist nicht sichtbar.

### Problem 2: Karten-Design im Grundzustand
Die Kaufy-Karte zeigt im Ausgangszustand nur:
- 1 Suchfeld
- 1 Button ("Objekt uebernehmen")

Das ist zu spartanisch fuer eine professionelle Arbeitsumgebung. Es fehlt ein visueller Hinweis auf die Suchfunktion und das 3-Zeilen-Format.

### Problem 3: Kein Zustand sichtbar ohne Eingabe
Wenn die Datenbank-View nur wenige oder keine Listings enthaelt, bleibt die Karte komplett leer — der User sieht nie die 3-Zeilen-Struktur.

## Reparaturvorschlag

### Datei: `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx`

**A) Sofort-Listing-Anzeige statt reiner Suche**

Wenn der User das Suchfeld fokussiert (auch ohne Eingabe), werden die neuesten 5-8 Listings sofort angezeigt. Aktuell zeigt `filteredListings` nur Ergebnisse wenn `searchQuery.trim()` nicht leer ist (Zeile 132). Aenderung:

```text
Vorher: if (!searchQuery.trim() || !listings) return [];
Nachher: if (!listings) return [];
         if (!searchQuery.trim()) return listings.slice(0, 8); // Zeige neueste
         // ... dann Filter wie bisher
```

So sieht der User beim Klick in das Suchfeld sofort die verfuegbaren Objekte im 3-Zeilen-Format.

**B) Visuelles Upgrade der Karte**

Die Karte bekommt einen dezenten Platzhalter-Bereich wenn keine Objekte ausgewaehlt sind:
- Icon + Text: "Klicken Sie in das Suchfeld, um verfuegbare Objekte anzuzeigen"
- Kleine Vorschau-Zeile mit Anzahl verfuegbarer Listings: "(X Objekte verfuegbar)"

**C) Konsistenz: Beide Layouts (Standard + Split-View)**

Die Aenderungen werden an beiden Stellen identisch umgesetzt:
- Standard-Layout: Zeilen 401-448
- Split-View-Layout: Zeilen 257-304

### Konkrete Code-Aenderungen

1. **Zeile 131-140** (`filteredListings` Memo): Logik aendern — bei leerem Query die neuesten 8 Listings zurueckgeben statt leeres Array
2. **Zeile 264-265 und 408-409** (Beschreibungstext): Ergaenzen um "(X Objekte verfuegbar)" Badge
3. **Zeile 271 und 415** (`onFocus`-Handler): Dropdown immer oeffnen, auch ohne Query — `onFocus={() => setShowDropdown(true)}`

### Keine weiteren Dateien betroffen
### Keine Datenbank-Aenderungen noetig

Die Aenderung stellt sicher, dass das 3-Zeilen-Design sofort sichtbar wird, sobald der User ins Suchfeld klickt — auch ohne etwas einzutippen.

