
# Street View & Satellit reparieren — API-Key nutzen

## Problem
Kachel 2 und 3 verwenden inoffizielle Google-Maps-URLs, die den konfigurierten API-Key ignorieren. Die Adresse ("Sauerlacher Strasse 30, 82041 Oberhaching") ist korrekt in der DB vorhanden und wird auch korrekt zusammengebaut (`buildMapQuery`).

## Loesung

### Aenderung in einer Datei: `src/pages/portal/miety/tiles/UebersichtTile.tsx`

**1. API-Key laden (neuer useQuery-Hook):**
- Ruft die bestehende Edge Function `sot-google-maps-key` auf
- Cached den Key fuer die Session
- Zeigt Ladeindikator waehrend Key geladen wird

**2. Kachel 2 — Street View (Zeilen 171-185):**
- Ersetze den iframe durch ein `<img>`-Tag mit der offiziellen **Street View Static API**:
  `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=ADRESSE&key=API_KEY`
- Die Adresse wird direkt als Text uebergeben (kein Geocoding noetig, Google loest das intern auf)
- Fallback-Anzeige wenn kein Street-View-Bild verfuegbar

**3. Kachel 3 — Satellitenansicht (Zeilen 187-201):**
- Ersetze die inoffizielle URL durch die offizielle **Google Maps Embed API**:
  `https://www.google.com/maps/embed/v1/place?key=API_KEY&q=ADRESSE&maptype=satellite&zoom=18`

### Voraussetzungen (Google Cloud Console)
- "Street View Static API" muss aktiviert sein
- "Maps Embed API" muss aktiviert sein
- Beide sind standardmaessig bei "uneingeschraenkter" API enthalten
