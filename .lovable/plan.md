
# Dashboard-Optimierung: Drehender Globus & Layout-Anpassung

## Zusammenfassung

1. **Neue Reihenfolge**: Armstrong → Wetter → Globus (statt Globus → Wetter → Armstrong)
2. **Echter drehender Globus**: Verwendet Google Maps `Map3DElement` mit automatischer Rotation
3. **Standort-Markierung**: Dein Standort wird als Punkt auf dem Globus angezeigt
4. **Zoom In Button**: Button startet den Kameraflug vom Weltraum zu deinem Standort

---

## Geplante Änderungen

### 1. PortalDashboard.tsx — Neue Reihenfolge

Aktuell: `[Globe] [Weather] [Armstrong]`
Neu: `[Armstrong] [Weather] [Globe]`

Die Reihenfolge der Kacheln im Grid wird einfach angepasst.

---

### 2. EarthGlobeCard.tsx — Echter 3D Globus mit Rotation

**Was sich ändert:**
- Wechsel von Embed API zu **Google Maps JavaScript API mit Map3DElement**
- Startposition im Weltraum (Altitude: 25.000.000 Meter = ca. 6x Erdradius)
- Automatische Rotation des Globus (`flyCameraAround` mit unendlicher Wiederholung)
- Standort-Marker auf dem Globus (als Polygon3DElement oder über DOM-Overlay)
- **"Zoom In" Action Button**: Startet `flyCameraTo` Animation vom Weltraum zum Standort

**Technische Details:**

```
+----------------------------------------+
|  🌍 Dein Standort                      |
|                                        |
|        [Drehender 3D Globus]           |
|             🔴 ← Standort              |
|                                        |
|  📍 München                            |
|  LAT: 48.1351° N                       |
|  LNG: 11.5820° O                       |
|                                        |
|      [ 🔍 Zoom In ]  ← Action Button   |
+----------------------------------------+
```

**Implementierung:**

```text
Phase 1: Initialisierung
├── Google Maps JS API laden (maps3d Library)
├── Map3DElement erstellen mit:
│   ├── center: { lat: 0, lng: 0, altitude: 0 }
│   ├── range: 25.000.000 m (Weltraum-Ansicht)
│   ├── mode: SATELLITE
│   └── tilt: 0 (senkrecht von oben)
└── Globus startet automatische Rotation

Phase 2: Rotation
├── flyCameraAround() mit:
│   ├── rounds: -1 (unendlich)
│   ├── durationMillis: 120.000 (2 Min pro Umdrehung)
│   └── camera: Weltraum-Position
└── Standort wird als Punkt markiert

Phase 3: Zoom In (Button-Klick)
├── flyCameraTo() mit:
│   ├── endCamera: Standort-Koordinaten
│   ├── altitude: 500 m
│   ├── tilt: 55°
│   └── durationMillis: 5.000 (5 Sekunden Flug)
└── Sanfte Animation vom Weltraum zum Standort
```

**Fallback:**
Falls Map3DElement nicht unterstützt wird (alte Browser), wird der animierte CSS-Globus als Fallback verwendet.

---

## Technische Umsetzung

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/PortalDashboard.tsx` | Reihenfolge: Armstrong → Wetter → Globe |
| `src/components/dashboard/EarthGlobeCard.tsx` | Komplette Überarbeitung: Map3DElement mit Rotation + Zoom Button |

---

## Voraussetzungen

Für den 3D Globus muss in der Google Cloud Console aktiviert sein:
- **Maps JavaScript API** ✓ (bereits aktiv)
- **Map Tiles API** (für 3D Photorealistic Tiles)

---

## UI-Verbesserung: "Zoom In" Button

Der Button wird im unteren Bereich der Karte platziert:
- Glassmorphism-Style passend zum Design-System
- Icon: Lupe oder Zoom-Symbol
- Beim Klick: Kameraflug zum Standort mit 5 Sekunden Animation
- Nach dem Flug: Option "Zurück zur Weltraum-Ansicht"
