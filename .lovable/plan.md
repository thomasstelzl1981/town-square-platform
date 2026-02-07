
# Google Maps 3D Globus: Vollständige API-Integration

## Problem-Analyse

Die aktuelle `EarthGlobeCard.tsx` verwendet **nur CSS-Animationen** - Google Maps API wird gar nicht geladen. Der API-Key (`VITE_GOOGLE_MAPS_API_KEY`) existiert als Secret, wird aber nirgendwo im Frontend genutzt.

---

## Lösung: Google Maps JavaScript API mit Map3DElement

### Datei: `src/components/dashboard/EarthGlobeCard.tsx`

**Komplette Überarbeitung:**

```text
Aktuelle Implementierung:
├── Nur CSS-Animation
├── Kein API-Aufruf
└── Zoom-Button öffnet google.com/maps (extern)

Neue Implementierung:
├── Google Maps JS API laden
├── Map3DElement für echten 3D-Globus
├── Automatische Rotation vom Weltraum
├── Zoom-In mit flyCameraTo Animation
└── CSS-Fallback bei Fehler
```

### Technische Umsetzung

**1. API-Key aus Environment laden:**
```
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
```

**2. Google Maps Script dynamisch laden:**
```
Script-URL: https://maps.googleapis.com/maps/api/js?key={API_KEY}&v=alpha&libraries=maps3d
```

**3. Map3DElement erstellen:**
```text
Initialisierung:
├── center: { lat: 0, lng: 0, altitude: 0 }
├── range: 25.000.000 m (Weltraum-Ansicht)
├── mode: SATELLITE
└── tilt: 0 (senkrecht von oben)

Rotation:
├── flyCameraAround()
├── rounds: Infinity
└── durationMillis: 120.000 (2 Min/Umdrehung)

Zoom-In (Button-Klick):
├── flyCameraTo()
├── endCamera: User-Koordinaten
├── altitude: 500 m
├── tilt: 55°
└── durationMillis: 5.000 (5 Sek Flug)
```

**4. Glasbutton im Eck:**
```text
Position: absolute bottom-3 right-3
Style: rounded-full bg-white/20 backdrop-blur-md
Icon: ZoomIn (Lucide)
```

**5. Fallback-Logik:**
```text
Falls API fehlschlägt (z.B. Billing, Network):
├── Zeige CSS-animierten Globus
├── Console-Log des Fehlers
└── Button öffnet externe Google Maps URL
```

---

## Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/dashboard/EarthGlobeCard.tsx` | Komplette Neuimplementierung mit Google Maps 3D API |

---

## Voraussetzungen (bereits erfüllt laut deiner Aussage)

- Maps JavaScript API ✓
- Map Tiles API ✓
- Billing aktiviert ✓
- `VITE_GOOGLE_MAPS_API_KEY` als Secret ✓

---

## Zusammenfassung

Die Komponente wird den API-Key aus den Environment-Variablen laden, das Google Maps Script dynamisch einbinden, und den echten 3D-Globus mit Rotation und Zoom-Animation anzeigen. Bei jedem Fehler wird automatisch auf den CSS-Globus zurückgefallen.
