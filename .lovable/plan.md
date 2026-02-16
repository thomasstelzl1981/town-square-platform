

# Street View Widget interaktiv machen (Inline, kein Pop-Up)

## Ist-Zustand
Die Street-View-Kachel in der UebersichtTile zeigt nur ein statisches Bild (Google Street View Static API). Es gibt keinen Link und keine Moeglichkeit, interaktiv durch die Strasse zu navigieren.

## Loesung
Die Street-View-Kachel wird klickbar gemacht. Bei Klick wird das statische Bild durch ein interaktives Google Street View Embed ersetzt — direkt in der Kachel selbst, ohne Pop-Up oder neue Seite.

## Technische Umsetzung

### Datei: `src/pages/portal/miety/tiles/UebersichtTile.tsx`

**Aenderung an der Street-View-Kachel (Zeilen 195-222):**

1. Neuer State: `streetViewActive` (boolean, default false)
2. Die Kachel wird bei Klick umgeschaltet:
   - **Inaktiv (Standard):** Statisches Bild wie bisher, mit einem kleinen "Street View starten"-Overlay-Button
   - **Aktiv:** Ein `iframe` mit der interaktiven Google Street View Embed API ersetzt das statische Bild. Die Kachel wird auf eine groessere Hoehe (z.B. 400px) erweitert und nimmt die volle Breite des 3-Spalten-Grids ein (`col-span-3`), damit die Navigation komfortabel ist
3. Ein "Schliessen"-Button bringt die Kachel zurueck zum statischen Bild

**Embed-URL-Muster:**
```text
https://www.google.com/maps/embed/v1/streetview?key=${mapsApiKey}&location=${lat},${lng}&heading=0&pitch=0&fov=90
```
Da wir keine exakten Koordinaten haben, verwenden wir alternativ den Parameter `location` mit der kodierten Adresse oder die generische Embed-URL:
```text
https://www.google.com/maps/embed?pb=...&layer=streetview
```
Oder zuverlaessiger die einfache Embed-Variante:
```text
https://www.google.com/maps/embed/v1/streetview?key=${mapsApiKey}&location=${mapQuery}
```

**Visuelles Verhalten:**
- Klick auf das statische Bild -> Kachel expandiert auf `col-span-3` mit 400px Hoehe
- Ein interaktives Street View iframe wird geladen
- Der Nutzer kann mit Maus/Touch durch die Strassen navigieren
- Ein "X"-Button oben rechts schliesst die interaktive Ansicht und stellt das statische Bild wieder her

### Keine weiteren Dateien betroffen

Es wird nur die UebersichtTile.tsx modifiziert. Keine neuen Komponenten, keine Datenbankmigrationen, keine Route-Aenderungen.

## Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `UebersichtTile.tsx` | Street-View-Kachel: State fuer aktiv/inaktiv, Klick expandiert zu interaktivem iframe (col-span-3, 400px), Schliessen-Button |

