

## Drei Aenderungen an der Lennox & Friends Website

### 1. Header-Link "Partner finden" loest sofort Ortung aus

Aktuell gibt es keinen Header-Link fuer die Partnersuche. Der "Partner in meiner Naehe finden"-Button im Hero scrollt nur zum Standort-Widget. 

**Aenderung:**
- In `LennoxLayout.tsx` einen neuen Nav-Link "Partner finden" hinzufuegen, der zur Startseite navigiert mit einem URL-Parameter (`?locate=1`)
- In `LennoxStartseite.tsx` beim Laden pruefen ob `?locate=1` gesetzt ist — wenn ja, sofort `navigator.geolocation` aufrufen und Ergebnisse anzeigen
- Das "Standort aktivieren"-Widget (Zeilen 100-128) entfaellt komplett. Stattdessen bleibt nur die Suchleiste (Ort/PLZ + Suchen-Button) immer sichtbar
- `handleGeolocation` wird erweitert um echte Browser-Geolocation (mit Fallback auf "Mein Standort")

### 2. Hero-Bild bleibt nach der Suche sichtbar

Aktuell wird der gesamte Hero-Bereich (70vh mit Bild) durch einen kleinen Text-Header ersetzt wenn `hasSearched = true`.

**Aenderung:**
- Der Hero mit dem grossen Bild bleibt IMMER sichtbar (Zeilen 56-78 werden nicht mehr bedingt gerendert)
- Nach der Suche wird der Hero etwas kompakter (z.B. 40vh statt 70vh) aber das Bild bleibt
- Der "Partner in meiner Naehe finden"-Button im Hero wird nach der Suche ausgeblendet (da Ergebnisse bereits da sind)
- Der kompakte Text-Header (Zeilen 80-96) entfaellt

### 3. Shop-Seite bekommt ein generiertes Hero-Bild

Die `LennoxShop.tsx` zeigt aktuell nur ein Icon und Text als Header.

**Aenderung:**
- Ein neues Hero-Bild via AI generieren (Alpine/Natur-Stil passend zum CI) und unter `public/shop/` speichern
- In `LennoxShop.tsx` den Header durch ein Hero-Bild mit Text-Overlay ersetzen (aehnlich wie auf der Startseite, aber kompakter)

### Technische Dateien

| Datei | Aenderung |
|-------|-----------|
| `LennoxLayout.tsx` | Nav-Link "Partner finden" mit `?locate=1` ergaenzen |
| `LennoxStartseite.tsx` | Hero immer anzeigen (kompakt nach Suche), Standort-Widget entfernen, `?locate=1` abfangen und Geolocation starten, Suchleiste immer sichtbar |
| `LennoxShop.tsx` | Hero-Bild-Sektion oben einfuegen |
| `public/shop/lennox-shop-hero.jpg` | NEU — AI-generiertes Bild (Alpine Outdoor mit Hund) |

