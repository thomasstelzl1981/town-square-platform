
# Dashboard-Optimierung: Layout & Echter 3D Globus

## Problem-Analyse

### 1. Layout-Problem (behoben im Plan)
Das aktuelle Layout zeigt Globe und Wetter jeweils über 50% Breite und Armstrong darunter.

### 2. Globus-Problem (Root Cause gefunden!)
Der `EarthGlobeCard` zeigt den **CSS-Fallback** statt der echten Google Maps Satelliten-Ansicht.

**Grund:** `VITE_GOOGLE_MAPS_API_KEY` ist als Secret gespeichert, aber Secrets sind nur für Edge Functions zugänglich, nicht im Frontend-Bundle. Die Bedingung `hasApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY` ist daher immer `false`.

**Lösung:** Google Maps API Keys sind **öffentliche/publishable Keys** (sichtbar im Browser-Netzwerk). Im Projekt existiert bereits ein funktionierender API-Key in `ExposeLocationMap.tsx`, der direkt im Code verwendet wird. Dieser Ansatz wird übernommen.

---

## Geplante Änderungen

### 1. PortalDashboard.tsx - Neues Layout

```text
Desktop (md+):
+-------------+-------------+---------------------------------+
|   🌍 GLOBE  |  ☀️ WETTER  |    🤖 ARMSTRONG BEGRÜSSUNG      |
|   (1/3)     |   (1/3)     |           (1/3)                 |
+-------------+-------------+---------------------------------+

Mobile:
+-------------------------------------------------+
|           🤖 ARMSTRONG BEGRÜSSUNG               |
|              (nur Begrüßung sichtbar)           |
+-------------------------------------------------+
```

**Änderungen:**
- Grid mit `grid-cols-1 md:grid-cols-3` für gleichmäßige Aufteilung
- Globe und Weather Cards: `hidden md:block` (auf Mobile versteckt)
- Armstrong: Immer sichtbar, auf Mobile volle Breite

### 2. EarthGlobeCard.tsx - API Key Fix & Map3DElement

**Problem beheben:**
- Direkten API-Key verwenden (wie in ExposeLocationMap.tsx bereits implementiert)
- Umstellung auf **Google Maps JavaScript API mit Map3DElement** für echten 3D-Globus mit Kameraflug

**Neue Implementierung:**
```tsx
// Google Maps JavaScript API laden
const { Map3DElement } = await google.maps.importLibrary("maps3d");

// 3D Map mit Weltraum-Startposition
const map3D = new Map3DElement({
  center: { lat: 0, lng: 0, altitude: 20000000 }, // Weltraum
  mode: "SATELLITE"
});

// Kameraflug zum Standort
map3D.flyCameraTo({
  endCamera: {
    center: { lat: latitude, lng: longitude, altitude: 500 },
    tilt: 55,
    heading: 0
  },
  durationMillis: 4000
});
```

**Fallback:** Wenn Map3DElement nicht unterstützt wird (alte Browser), Embed API mit Satellitenansicht.

### 3. WeatherCard.tsx - Kompakter für gleichmäßiges Grid

- Reduzierung auf 5-Tage-Vorschau (statt 7)
- Anpassung der Höhe für quadratischere Proportionen
- `h-full` statt `min-h-[280px]`

### 4. ArmstrongGreetingCard.tsx - Horizontales Layout

Für die Einzeilige Darstellung:
- Avatar links (kleiner)
- Text kompakter (Zusammenfassung statt voller Absätze)
- Button rechts
- Termin-Preview horizontal als Chips

---

## Dateien-Übersicht

| Datei | Änderung | Beschreibung |
|-------|----------|--------------|
| `src/pages/portal/PortalDashboard.tsx` | Ändern | 3-Spalten Grid, Mobile nur Armstrong |
| `src/components/dashboard/EarthGlobeCard.tsx` | Ändern | Map3DElement Integration, API Key Fix |
| `src/components/dashboard/WeatherCard.tsx` | Ändern | Kompakteres Design |
| `src/components/dashboard/ArmstrongGreetingCard.tsx` | Ändern | Horizontales Layout |

---

## Technische Details

### Google Maps 3D API Integration

Die Map3DElement API erfordert:
1. **Maps JavaScript API** - bereits aktiviert
2. **Map Tiles API** - muss in der Google Cloud Console aktiviert werden

**Laden der Bibliothek:**
```typescript
// maps3d Library dynamisch laden
const { Map3DElement } = await google.maps.importLibrary("maps3d");
```

**Kamera-Animation:**
```typescript
// Von Weltraum (20.000km) zum Standort (500m) fliegen
map3D.flyCameraTo({
  endCamera: {
    center: { lat, lng, altitude: 500 },
    tilt: 55, // Schräge Ansicht
    heading: 0
  },
  durationMillis: 4000 // 4 Sekunden
});
```

### API Key Handhabung

Da der Google Maps API Key ein **publishable key** ist, wird er direkt im Code verwendet (wie bereits in `ExposeLocationMap.tsx`). Dies ist sicher, da:
- Google Maps API Keys sind per Design öffentlich (sichtbar im Browser)
- Absicherung erfolgt über API-Restrictions in der Google Cloud Console
- HTTP Referrer Restrictions schützen vor Missbrauch

---

## Voraussetzung für 3D Globus

Bitte stelle sicher, dass in der Google Cloud Console die **Map Tiles API** aktiviert ist:
1. Google Cloud Console öffnen
2. APIs & Services → Enable APIs
3. Suche nach "Map Tiles API"
4. Aktivieren

Ohne diese API wird die 3D-Ansicht nicht funktionieren.
