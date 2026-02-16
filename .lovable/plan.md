

# Fix: Google Street View Widget -- falsches Bild und Klickverhalten

## Problem-Analyse

### 1. Falsches Bild
Die Street View Static API (`maps.googleapis.com/maps/api/streetview`) wird mit dem Parameter `location=Leopoldstra%C3%9Fe%2042%2080802%20M%C3%BCnchen` aufgerufen. Google's Geocoding loest diese Zeichenkette teils ungenau auf und zeigt ein Panorama eines nahen Restaurants statt des Gebaeudes an Leopoldstrasse 42. Die Loesung: Den `location`-Parameter mit Komma-Trennern formatieren (Strasse+Nr, PLZ Stadt) statt alle Teile mit Leerzeichen zu verbinden. Zusaetzlich den `source=outdoor`-Parameter setzen, um Indoor-Panoramen (z.B. Restaurant-Innenansichten) auszuschliessen.

### 2. Falsches Klickverhalten
Aktuell oeffnet ein Klick auf die Street-View-Kachel ein eingebettetes Iframe innerhalb der Anwendung (`setStreetViewActive(true)`). Gewuenscht: Ein Klick soll Google Street View in einem neuen Browser-Tab oeffnen.

---

## Aenderungen

### Datei: `src/pages/portal/miety/tiles/UebersichtTile.tsx`

**A) `buildMapQuery` anpassen**
Die Funktion wird so geaendert, dass Adressteile mit Komma getrennt werden (bessere Geocoding-Genauigkeit):
```
// Vorher:
[home.address, home.address_house_no, home.zip, home.city].filter(Boolean).join(' ')

// Nachher:
[`${home.address} ${home.address_house_no}`.trim(), `${home.zip} ${home.city}`.trim()].filter(Boolean).join(', ')
```

**B) Static-Image URL: `source=outdoor` hinzufuegen**
```
// Vorher:
`...streetview?size=600x400&location=${mapQuery}&key=${mapsApiKey}`

// Nachher:
`...streetview?size=600x400&location=${mapQuery}&source=outdoor&key=${mapsApiKey}`
```

**C) Klickverhalten aendern: Neuer Tab statt Inline-Iframe**
- Der `onClick`-Handler auf der Kachel wird von `setStreetViewActive(true)` auf `window.open(streetViewUrl, '_blank')` umgestellt
- Die Street View URL wird als externer Google Maps Link generiert:
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=ADRESSE`
- Der gesamte Inline-Iframe-Block (Zeilen 199-218, der `streetViewActive`-Branch) wird entfernt, da er nicht mehr benoetigt wird
- Die State-Variable `streetViewActive` kann ebenfalls entfernt werden

**D) Overlay-Text anpassen**
Von "Street View starten" zu "Street View oeffnen" -- um klarzumachen, dass ein externer Link geoeffnet wird.

---

## Zusammenfassung

| Was | Vorher | Nachher |
|---|---|---|
| Adress-Format | Leerzeichen-getrennt | Komma-getrennt |
| Static API | Kein `source`-Filter | `source=outdoor` |
| Klick-Aktion | Inline-Iframe in der App | Neuer Browser-Tab mit Google Maps |
| State `streetViewActive` | Wird benoetigt | Wird entfernt |

