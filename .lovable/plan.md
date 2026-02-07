

# Plan: SystemBar Geo-Erweiterung + SubTabs Zentrierung

## Übersicht

Zwei UI-Verbesserungen für die Desktop-Ansicht:

1. **SystemBar erweitern**: Neben der Uhrzeit auch Standort (Stadt) und Höhenmeter anzeigen
2. **SubTabs zentrieren**: Level-3-Navigation horizontal mittig ausrichten

---

## Teil 1: Geo-Location im SystemBar

### Technische Umsetzung

**Browser Geolocation API** → **Reverse Geocoding** → Anzeige

```text
┌────────────────────────────────────────────────────────────┐
│ [Home]  System of a Town    📍 Berlin · 34m · 14:32        │
└────────────────────────────────────────────────────────────┘
```

### Implementierung

**Datei:** `src/components/portal/SystemBar.tsx`

**Neue States:**
```typescript
const [location, setLocation] = useState<{
  city: string;
  altitude: number | null;
} | null>(null);
const [locationLoading, setLocationLoading] = useState(true);
```

**Neuer useEffect für Geolocation:**
```typescript
useEffect(() => {
  if (!navigator.geolocation) {
    setLocationLoading(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude, altitude } = position.coords;
      
      // Reverse Geocoding mit kostenlosem OpenStreetMap Nominatim API
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await response.json();
        const city = data.address?.city || data.address?.town || data.address?.village || 'Unbekannt';
        
        setLocation({
          city,
          altitude: altitude ? Math.round(altitude) : null
        });
      } catch (error) {
        console.error('Geocoding failed:', error);
      }
      setLocationLoading(false);
    },
    (error) => {
      console.error('Geolocation error:', error);
      setLocationLoading(false);
    },
    { enableHighAccuracy: true }
  );
}, []);
```

**Anzeige im Center-Section:**
```tsx
{/* Center section: Location + Time */}
<div className="hidden sm:flex items-center gap-3 text-muted-foreground">
  {location && (
    <>
      <div className="flex items-center gap-1.5">
        <MapPin className="h-4 w-4" />
        <span className="text-sm">{location.city}</span>
      </div>
      {location.altitude !== null && (
        <div className="flex items-center gap-1">
          <Mountain className="h-3.5 w-3.5" />
          <span className="text-sm">{location.altitude}m</span>
        </div>
      )}
      <span className="text-muted-foreground/50">·</span>
    </>
  )}
  <div className="flex items-center gap-1.5">
    <Clock className="h-4 w-4" />
    <span className="text-sm font-mono">{formattedTime}</span>
  </div>
</div>
```

### Hinweise

- **Benutzer-Erlaubnis erforderlich**: Browser fragt nach Standort-Berechtigung
- **Fallback**: Wenn abgelehnt oder nicht verfügbar → nur Uhrzeit anzeigen
- **Höhenmeter-Genauigkeit**: GPS-Höhe ist oft ungenau (±10-50m), wird aber angezeigt wenn verfügbar
- **Kostenloser API**: Nominatim (OpenStreetMap) hat ein Rate-Limit, aber für einzelne Anfragen ausreichend

---

## Teil 2: SubTabs Zentrierung

### Aktuelle Situation

```tsx
// Zeile 25 in SubTabs.tsx
<div className="flex items-center gap-1 px-4 py-2 overflow-x-auto ...">
```

Die Tabs sind **linksbündig** (`flex` ohne `justify-center`).

### Lösung

**Datei:** `src/components/portal/SubTabs.tsx`

**Änderung:**
```tsx
<div className="flex items-center justify-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none bg-background/50">
```

Hinzufügen von `justify-center` zur Flex-Container-Klasse.

---

## Dateiänderungen

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/components/portal/SystemBar.tsx` | MODIFY | Geolocation hinzufügen, Standort + Höhe anzeigen |
| `src/components/portal/SubTabs.tsx` | MODIFY | `justify-center` hinzufügen |

---

## Neue Icons benötigt

```typescript
import { MapPin, Mountain } from 'lucide-react';
```

Beide sind in lucide-react verfügbar.

---

## Visuelle Darstellung

### SystemBar (nach Änderung)

```text
Desktop:
┌──────────────────────────────────────────────────────────────────┐
│ [🏠 Portal]  [S] System of a Town    📍 Berlin · ⛰ 34m · 🕐 14:32 │
└──────────────────────────────────────────────────────────────────┘

Mobile (kompakter):
┌─────────────────────────────────┐
│ [🏠]           🕐 14:32    [👤] │
└─────────────────────────────────┘
(Standort nur auf Desktop, da Platz begrenzt)
```

### SubTabs (nach Änderung)

```text
Vorher (linksbündig):
│ [Profil] [Organisation] [Abrechnung] [Sicherheit]               │

Nachher (zentriert):
│          [Profil] [Organisation] [Abrechnung] [Sicherheit]      │
```

---

## Privacy-Hinweis

Der Standort wird:
- **Nur lokal im Browser** verwendet
- **Nicht an Backend** gesendet
- **Einmalig** beim Laden abgefragt (nicht kontinuierlich getrackt)
- **Optional** — funktioniert auch ohne Berechtigung

