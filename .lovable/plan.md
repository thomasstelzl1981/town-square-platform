
# Globus-Widget ersetzen + Places API fixen

## Teil 1: Globus-Widget mit react-globe.gl ersetzen

### Problem
Der Google Maps 3D-Globus (`maps3d`) hat mehrere Schwachstellen:
- Abhaengig von Google API Key (Runtime-Aufloesung ueber Edge Function)
- Safari komplett ausgeschlossen (Fallback auf CSS-Globus)
- WebGL2-Pflicht, instabil in eingebetteten Umgebungen
- Zoom-to-Location funktioniert nur wenn alle APIs korrekt konfiguriert sind

### Loesung: react-globe.gl
`react-globe.gl` ist ein ThreeJS/WebGL-basierter Globus, der:
- **Keinen API Key** benoetigt
- Eingebaute **pointOfView-Animation** fuer Zoom-to-Location hat
- Einen sichtbaren, texturierten Erdglobus mit Rotation rendert
- In allen modernen Browsern inkl. Safari funktioniert (WebGL1 reicht)
- Marker/Pins auf dem Globus darstellen kann

### Technische Umsetzung

**Neue Dependency:**
- `react-globe.gl` (aktuelle Version)
- `three` ist bereits transitive Dependency von react-globe.gl

**Dateien die sich aendern:**

| Datei | Aenderung |
|-------|-----------|
| `src/components/dashboard/EarthGlobeCard.tsx` | Komplett neu: react-globe.gl statt Google Maps 3D |
| `src/components/dashboard/earth-globe/CSSGlobeFallback.tsx` | Bleibt als Fallback fuer WebGL-Fehler |
| `src/components/dashboard/earth-globe/getGoogleMapsApiKey.ts` | Wird geloescht (nicht mehr benoetigt fuer Globus) |

**Verhalten des neuen Globus:**

```text
Idle-Zustand:
  - Erdglobus mit Textur (Natural Earth oder eingebaute Textur)
  - Langsame Auto-Rotation
  - Koordinaten-Anzeige (LAT/LNG) wie bisher
  - Standort-Pin auf dem Globus (wenn Koordinaten vorhanden)

Klick auf Zoom-Button:
  - pointOfView-Animation fliegt zum Standort
  - Tilt + Zoom auf ~1000km Hoehe
  - Pin wird hervorgehoben

Klick auf Zoom-Out:
  - Zurueck zur Uebersichts-Ansicht
  - Auto-Rotation startet wieder
```

**Wichtig:** `getGoogleMapsApiKey.ts` wird nur geloescht wenn es NICHT von anderen Komponenten importiert wird. Die Edge Function `sot-google-maps-key` bleibt bestehen — sie wird moeglicherweise noch fuer die Places-Suche oder Property-Embeds benoetigt.

---

## Teil 2: Places API Edge Function auf neue API umstellen

### Problem
Die Edge Function `sot-places-search` nutzt die **Legacy Places API** (`textsearch/json`), die in der Google Cloud Console nicht aktiviert ist. Fehlermeldung:
```
"You're calling a legacy API, which is not enabled for your project."
```

### Loesung: Umstellung auf Places API (New)
Die neue Google Places API nutzt einen anderen Endpunkt und Header-basierte Authentifizierung:

```text
Alt (Legacy):
  GET https://maps.googleapis.com/maps/api/place/textsearch/json?query=...&key=...

Neu (Places API New):
  POST https://places.googleapis.com/v1/places:searchText
  Header: X-Goog-Api-Key: ...
  Header: X-Goog-FieldMask: places.displayName,places.formattedAddress,...
  Body: { "textQuery": "Handwerker Muenchen" }
```

**Dateien die sich aendern:**

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/sot-places-search/index.ts` | Umstellung auf Places API (New) Endpunkte |

**Vorteile der neuen API:**
- Nur ein Request statt zwei (Text Search + Details) — die neue API liefert Details direkt mit
- Bessere Ergebnisse durch FieldMask (nur gewuenschte Felder)
- Zukunftssicher (Legacy wird abgekuendigt)

---

## Risikobewertung

| Risiko | Bewertung |
|--------|-----------|
| react-globe.gl rendert nicht | Niedrig — WebGL1 reicht, CSSGlobeFallback bleibt als Auffangnetz |
| Bundle-Groesse steigt | Mittel — react-globe.gl + three.js sind ~200-300kb gzipped. Wird aber lazy geladen (Dashboard-Widget) |
| Places API (New) nicht aktiviert in Google Cloud | Moeglich — muss vom User in der Google Cloud Console aktiviert werden. Der Fix im Code ist trotzdem korrekt |
| getGoogleMapsApiKey.ts wird anderswo genutzt | Wird geprueft — falls ja, bleibt die Datei bestehen |

**Gesamtrisiko: NIEDRIG bis MITTEL.** Der Globus-Wechsel ist eine isolierte Widget-Aenderung. Die Places-API-Umstellung ist ein Backend-Fix ohne UI-Auswirkung.

## Zusammenfassung

- 1 neue Dependency (`react-globe.gl`)
- 1 Datei neu schreiben (EarthGlobeCard.tsx)
- 1 Datei loeschen (getGoogleMapsApiKey.ts — nach Pruefung)
- 1 Edge Function umschreiben (sot-places-search)
- 0 Datenbank-Aenderungen
- CSSGlobeFallback bleibt als Sicherheitsnetz
