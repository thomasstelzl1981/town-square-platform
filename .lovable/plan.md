

# Erweiterter Plan: Display-Name Sync, Geolocation Fallback & Google APIs

## Zusammenfassung der Anforderungen

### 1. Display-Name wird nicht aktualisiert
**Problem:** Nach dem Speichern in `ProfilTab.tsx` wird nur die Query-Cache invalidiert, aber der AuthContext nicht aktualisiert.

**Lösung:** Nach erfolgreichem Update `refreshAuth()` aufrufen.

### 2. Geolocation funktioniert nicht (Chrome-Hinweis)
**Browser-Berechtigung in Chrome aktivieren:**
1. Klick auf das Schloss-Symbol links neben der URL
2. "Website-Einstellungen" → "Standort" → "Zulassen"
3. Seite neu laden

**Alternativ:** Chrome-Einstellungen → Datenschutz und Sicherheit → Website-Einstellungen → Standort

**Hinweis zur Lovable-Preview:** Im iFrame der Vorschau kann Geolocation eingeschränkt sein. In der veröffentlichten Version sollte es funktionieren.

### 3. Fallback: Standort aus Nutzerprofil
Wenn Browser-Geolocation fehlschlägt → Stadt aus `profile.city` (Stammdaten) anzeigen.

### 4. Google APIs aktivieren (Zone 1)
Die Integration Registry hat bereits Einträge für:
- `GOOGLE_MAPS` (Status: `pending_setup`)
- `GOOGLE_PLACES` (Status: `pending_setup`)

Für die Aktivierung wird ein Google Cloud API-Key benötigt.

---

## Technische Änderungen

### Datei 1: `src/pages/portal/stammdaten/ProfilTab.tsx`

**Zeile 35:** `refreshAuth` aus useAuth importieren
```tsx
const { user, isDevelopmentMode, refreshAuth } = useAuth();
```

**Zeilen 139-142:** `onSuccess` erweitern
```tsx
onSuccess: async () => {
  queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
  await refreshAuth(); // ← NEU: AuthContext synchronisieren
  toast.success('Profil gespeichert');
},
```

### Datei 2: `src/components/portal/SystemBar.tsx`

**Neue Fallback-Logik:**

```tsx
// Import erweitern
import { useAuth } from '@/contexts/AuthContext';

export function SystemBar() {
  const { profile, signOut, isDevelopmentMode, user } = useAuth();
  // ... bestehender Code ...

  // Geolocation mit Fallback auf Profil-Stadt
  useEffect(() => {
    // Fallback-Funktion für Profil-Standort
    const useProfileFallback = () => {
      if (profile?.city) {
        setLocation({
          city: profile.city,
          altitude: null  // Aus Profil keine Höhe verfügbar
        });
        console.log('Geolocation Fallback: Using profile city', profile.city);
      } else {
        setLocationError(true);
      }
    };

    if (!navigator.geolocation) {
      useProfileFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, altitude } = position.coords;
        console.log('Geolocation success:', { latitude, longitude, altitude });
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'SystemOfATown/1.0' } }
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || 
                       data.address?.village || data.address?.municipality || 'Unbekannt';
          
          setLocation({
            city,
            altitude: altitude ? Math.round(altitude) : null
          });
        } catch (error) {
          console.error('Geocoding failed, using fallback:', error);
          useProfileFallback();
        }
      },
      (error) => {
        // Detailliertes Logging
        const errorMessages: Record<number, string> = {
          1: 'Berechtigung verweigert',
          2: 'Position nicht verfügbar',
          3: 'Zeitüberschreitung',
        };
        console.warn('Geolocation error:', errorMessages[error.code] || error.message);
        // Fallback auf Profil-Stadt
        useProfileFallback();
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,      // 10 Sekunden Timeout
        maximumAge: 300000   // Cache für 5 Minuten
      }
    );
  }, [profile?.city]);  // Re-run wenn Profil-Stadt sich ändert
```

**UI-Anpassung für Fallback-Anzeige:**
```tsx
{location ? (
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
  </>
) : locationError ? (
  <span className="text-sm text-muted-foreground">Kein Standort</span>
) : null}
```

---

## Google APIs (Zone 1)

### Bereits registriert in `integration_registry`:

| Code | Name | Status |
|------|------|--------|
| `GOOGLE_MAPS` | Google Maps | pending_setup |
| `GOOGLE_PLACES` | Google Places | pending_setup |

### Für Aktivierung benötigt:
1. **Google Cloud Console** → Neues Projekt erstellen
2. **APIs aktivieren:**
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Elevation API (für Höhe über Meeresspiegel)
3. **API-Key erstellen** mit Einschränkungen (HTTP-Referrer)
4. **In Lovable Cloud** als Secret speichern: `GOOGLE_MAPS_API_KEY`

### Vorteile von Google APIs:
- **Maps:** Interaktive Karten statt statischer Embed
- **Places:** Handwerkersuche, Autocomplete für Adressen
- **Geocoding:** Präzisere Standortauflösung
- **Elevation:** Echte Höhendaten (Meeresspiegel)
- **Earth:** 3D-Ansichten für Immobilien

### Nächste Schritte für Google Integration:
1. API-Key bereitstellen
2. Secret in Cloud speichern
3. Integration Registry auf `active` setzen
4. Komponenten umstellen (Maps, Geocoding, etc.)

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/stammdaten/ProfilTab.tsx` | `refreshAuth()` nach Speichern |
| `src/components/portal/SystemBar.tsx` | Geolocation-Fallback auf Profil-Stadt |

---

## Datenfluss nach Implementierung

```
Browser Geolocation
        │
        ▼
   ┌────────────────┐
   │ getCurrentPosition │
   └────────────────┘
        │
   ┌────┴────┐
   │         │
Erfolg    Fehler/Timeout
   │         │
   ▼         ▼
Reverse   Profil-Fallback
Geocoding    │
   │         ▼
   ▼    profile.city
location.city   │
   │         │
   └────┬────┘
        │
        ▼
   SystemBar zeigt:
   📍 München  🏔 520m
```

---

## Chrome Standortberechtigung (Schnellanleitung)

1. **URL-Leiste:** Klick auf Schloss/Info-Icon links
2. **"Berechtigungen"** oder **"Website-Einstellungen"**
3. **"Standort"** → auf **"Zulassen"** ändern
4. **Seite neu laden** (F5 oder ⌘R)

Falls das nicht funktioniert:
- `chrome://settings/content/location` in Adressleiste eingeben
- Die Seite zur "Zulassen"-Liste hinzufügen

---

## Erwartetes Ergebnis

| Szenario | Anzeige |
|----------|---------|
| Geolocation erfolgreich | 📍 München  🏔 520m |
| Geolocation verweigert, aber Profil hat Stadt | 📍 München (ohne Höhe) |
| Geolocation verweigert, kein Profil-Stadt | "Kein Standort" |
| Display-Name geändert | Dashboard zeigt sofort neuen Namen |

