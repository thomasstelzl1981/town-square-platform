
# Dashboard Redesign: Interaktive Willkommensseite mit Google Earth, Wetter & Armstrong

## Konzeptübersicht

Nach dem Login wird der Benutzer mit einem immersiven, dreistufigen Dashboard begrüßt:

```
+--------------------------------+--------------------------------+
|                                |                                |
|     🌍 GOOGLE EARTH            |    ☀️ WETTER-WIDGET            |
|     (Rotierender Globus        |    (Open-Meteo API)            |
|      mit Zoom auf Standort)    |                                |
|                                |    Temperatur, Wetter, Icon    |
|     Maps 3D / Photorealistic   |    Wind, Luftfeuchtigkeit      |
|                                |    7-Tage Vorschau             |
+--------------------------------+--------------------------------+
|                                                                 |
|     🤖 ARMSTRONG BEGRÜSSUNG                                     |
|                                                                 |
|     "Guten Morgen, Mr. Thomas! Ich hoffe, du hast einen        |
|      schönen Tag. Du bist heute in Oberhaching, das Wetter     |
|      wird heute schön (18°C, sonnig). Wie ich an deinem        |
|      Terminkalender sehe, hast du heute 2 Termine..."          |
|                                                                 |
+-----------------------------------------------------------------+
```

---

## Erforderliche APIs

### 1. Google Maps 3D (Photorealistic 3D Tiles)
**API-Name:** Maps JavaScript API + Photorealistic 3D Tiles

Google Earth ist keine eigenständige API mehr. Stattdessen bietet Google "Photorealistic 3D Tiles" innerhalb der Maps JavaScript API, die Google Earth-ähnliche 3D-Ansichten ermöglicht:

- `flyCameraTo()` - Fliegt von Weltraumansicht zum Standort
- `flyCameraAround()` - Rotiert um einen Punkt
- Tilt & Rotation für 3D-Effekte

**In Google Cloud Console aktivieren:**
- Maps JavaScript API
- Map Tiles API (für Photorealistic 3D)

**Hinweis:** Diese 3D-Funktionalität ist Teil des Maps JavaScript API und nutzt denselben API-Key.

### 2. Open-Meteo API (Kostenlos, kein API-Key!)
**URL:** https://api.open-meteo.com/v1/forecast

Vorteile:
- Keine Registrierung erforderlich
- Keine Kosten
- CORS-freundlich
- Stundengenaue Vorhersagen

Beispiel-Request:
```
https://api.open-meteo.com/v1/forecast?latitude=48.0167&longitude=11.5843
  &current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m
  &daily=temperature_2m_max,temperature_2m_min,weathercode
  &timezone=Europe/Berlin
```

### 3. Bestehende APIs (Integration Registry aktualisieren)

| Code | Neu/Bestehend | Aktivieren in Google Cloud |
|------|---------------|----------------------------|
| `GOOGLE_MAPS` | Bestehend | Maps JavaScript API |
| `GOOGLE_PLACES` | Bestehend | Places API (New) |
| `GOOGLE_EARTH_3D` | **NEU** | Map Tiles API |
| `GOOGLE_ELEVATION` | **NEU** | Elevation API |
| `OPEN_METEO` | **NEU** | Keine Aktivierung nötig! |

---

## Technische Implementierung

### Datei 1: `src/components/dashboard/EarthGlobeCard.tsx` (NEU)

```tsx
// Google Maps 3D mit Photorealistic Tiles
// Nutzt flyCameraTo() für Zoom-Animation von Weltraum zu Standort

interface EarthGlobeCardProps {
  latitude: number;
  longitude: number;
  city: string;
}

export function EarthGlobeCard({ latitude, longitude, city }: EarthGlobeCardProps) {
  // 1. Google Maps 3D Element laden
  // 2. Kamera von Weltraum-Position (altitude: 10000000) starten
  // 3. flyCameraTo() zum Standort animieren
  // 4. flyCameraAround() für langsame Rotation
}
```

### Datei 2: `src/components/dashboard/WeatherCard.tsx` (NEU)

```tsx
// Wetter-Widget mit Open-Meteo API (kostenlos, kein API-Key!)

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  forecast: DailyForecast[];
}

export function WeatherCard({ latitude, longitude }: { latitude: number; longitude: number }) {
  // 1. Fetch von Open-Meteo API
  // 2. Wettercode zu Icon/Text mappen (WMO Standard)
  // 3. Aktuelle Werte + 7-Tage Vorschau anzeigen
}
```

**WMO Wettercodes (Open-Meteo):**
- 0: Klar ☀️
- 1-3: Bewölkt ⛅
- 45-48: Nebel 🌫️
- 51-57: Nieselregen 🌧️
- 61-67: Regen 🌧️
- 71-77: Schnee ❄️
- 80-82: Schauer 🌦️
- 95-99: Gewitter ⛈️

### Datei 3: `src/components/dashboard/ArmstrongGreetingCard.tsx` (NEU)

```tsx
// Personalisierte Begrüßung von Armstrong

interface ArmstrongGreetingCardProps {
  displayName: string;
  city: string;
  weather: WeatherData;
  todayEvents: CalendarEvent[];
}

export function ArmstrongGreetingCard(props: ArmstrongGreetingCardProps) {
  // 1. Tageszeit-basierte Begrüßung
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  // 2. Wettertext generieren
  const weatherText = getWeatherDescription(props.weather);

  // 3. Termin-Info aus calendar_events laden
  const eventInfo = props.todayEvents.length > 0
    ? `Wie ich an deinem Terminkalender sehe, hast du heute ${props.todayEvents.length} Termine.`
    : "Du hast heute keine Termine eingetragen.";

  // 4. Armstrong-Style Nachricht zusammenbauen
}
```

**Begrüßungsvarianten:**
- "Guten Morgen, Mr. Thomas!"
- "Hallo Thomas, schön dich zu sehen!"
- "Guten Abend, Mr. Thomas. Ich hoffe, du hattest einen produktiven Tag."

### Datei 4: `src/hooks/useWeather.ts` (NEU)

```tsx
// Custom Hook für Open-Meteo API

export function useWeather(latitude: number, longitude: number) {
  return useQuery({
    queryKey: ['weather', latitude, longitude],
    queryFn: async () => {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m` +
        `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
        `&timezone=Europe/Berlin`
      );
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 Minuten Cache
  });
}
```

### Datei 5: `src/hooks/useTodayEvents.ts` (NEU)

```tsx
// Hook für heutige Kalendertermine

export function useTodayEvents(userId: string) {
  return useQuery({
    queryKey: ['calendar-events-today', userId],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_at', startOfDay.toISOString())
        .lte('start_at', endOfDay.toISOString())
        .order('start_at');

      return data;
    },
  });
}
```

### Datei 6: `src/pages/portal/PortalDashboard.tsx` (ÜBERARBEITEN)

```tsx
export default function PortalDashboard() {
  const { profile } = useAuth();
  const { location } = useGeolocation(); // Aus SystemBar-Logik extrahiert

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Obere Reihe: 2 Kacheln nebeneinander */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Earth 3D Globe */}
        <EarthGlobeCard
          latitude={location?.latitude || 48.0167}
          longitude={location?.longitude || 11.5843}
          city={location?.city || profile?.city || "Unbekannt"}
        />

        {/* Wetter Widget */}
        <WeatherCard
          latitude={location?.latitude || 48.0167}
          longitude={location?.longitude || 11.5843}
        />
      </div>

      {/* Untere Reihe: Armstrong Begrüßung (volle Breite) */}
      <ArmstrongGreetingCard
        displayName={profile?.display_name || ""}
        city={location?.city || ""}
        weather={weatherData}
        todayEvents={todayEvents}
      />
    </div>
  );
}
```

---

## Integration Registry Updates

Neue Einträge hinzufügen:

```sql
INSERT INTO integration_registry (code, name, status, description) VALUES
  ('GOOGLE_EARTH_3D', 'Google Earth 3D (Photorealistic)', 'pending_setup', 
   'Photorealistic 3D Tiles für immersive Globus-Ansicht'),
  ('GOOGLE_ELEVATION', 'Google Elevation API', 'pending_setup',
   'Höhendaten über Meeresspiegel'),
  ('OPEN_METEO', 'Open-Meteo Weather', 'active',
   'Kostenlose Wetter-API, kein API-Key erforderlich');
```

---

## Google Cloud Console: Vollständige API-Liste

Aktiviere diese APIs für den gemeinsamen API-Key:

| API | Zweck | Kosten |
|-----|-------|--------|
| **Maps JavaScript API** | 3D Globus, Karten | $200 Guthaben/Monat |
| **Map Tiles API** | Photorealistic 3D | Inkl. in JavaScript API |
| **Places API (New)** | Handwerkersuche | $200 Guthaben/Monat |
| **Geocoding API** | Adressauflösung | $200 Guthaben/Monat |
| **Elevation API** | Höhe ü. Meeresspiegel | $200 Guthaben/Monat |

**Gesamtes Guthaben:** $200/Monat (wird auf alle APIs angerechnet)

---

## Dateien-Übersicht

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `src/components/dashboard/EarthGlobeCard.tsx` | NEU | Google Maps 3D Globus |
| `src/components/dashboard/WeatherCard.tsx` | NEU | Wetter-Widget |
| `src/components/dashboard/ArmstrongGreetingCard.tsx` | NEU | Personalisierte Begrüßung |
| `src/hooks/useWeather.ts` | NEU | Open-Meteo API Hook |
| `src/hooks/useTodayEvents.ts` | NEU | Kalender-Events Hook |
| `src/hooks/useGeolocation.ts` | NEU | Extrahierte Standort-Logik |
| `src/pages/portal/PortalDashboard.tsx` | ÄNDERN | Neues Layout |
| `src/lib/weatherCodes.ts` | NEU | WMO Code → Icon/Text Mapping |

---

## Design-Konzept

### EarthGlobeCard
- Dunkler Hintergrund (Space-Theme)
- Goldener Rand (ORBITAL Design)
- Animation: Kamera fliegt von Weltraum zum Standort
- Langsame Rotation um den Standort

### WeatherCard
- Glasmorphismus-Stil
- Dynamisches Icon basierend auf Wetter
- Temperatur groß, Details kleiner
- Kompakte 7-Tage-Vorschau

### ArmstrongGreetingCard
- Bot-Icon links
- Fließtext wie Chat-Nachricht
- Gradient-Hintergrund (Gold → Blau, wie Armstrong-Header)
- Typing-Animation beim ersten Laden

---

## Zusammenfassung: API-Keys benötigt

| API | Key erforderlich | Status |
|-----|------------------|--------|
| Open-Meteo | **NEIN** (kostenlos!) | Sofort nutzbar |
| Google Maps 3D | **JA** (GOOGLE_MAPS_API_KEY) | Wartet auf Setup |
| Google Elevation | **JA** (gleicher Key) | Wartet auf Setup |
| Google Places | **JA** (gleicher Key) | Wartet auf Setup |

**Ein Google API-Key reicht für alles!**
