

# Bugfix-Plan: SystemBar Location + Navigation Zentrierung

## Problem-Analyse

### 1. Standort wird nicht angezeigt
**Console-Log gefunden:**
```
Geolocation error: {}
```

Der Browser verweigert die Geolocation-Berechtigung im Preview-Iframe. Das ist ein bekanntes Problem bei eingebetteten iframes (Sicherheitseinschränkung).

**Lösungsoptionen:**
- A) Fallback-Anzeige mit "Standort anfordern"-Button
- B) IP-basierte Geolocation als Fallback (weniger genau, aber funktioniert)

### 2. Zentrierung fehlt bei Level 1 und Level 2
**Aktuelle Situation:**

| Level | Komponente | Aktuelle Klassen | Problem |
|-------|------------|------------------|---------|
| Level 1 | `AreaTabs.tsx` Zeile 24 | `flex items-center gap-1` | Kein `justify-center` |
| Level 2 | `ModuleTabs.tsx` Zeile 81 | `flex items-center gap-1` | Kein `justify-center` |
| Level 3 | `SubTabs.tsx` Zeile 25 | `flex items-center justify-center gap-1` | OK |

---

## Implementierungsplan

### Fix 1: AreaTabs.tsx — Level 1 zentrieren

**Datei:** `src/components/portal/AreaTabs.tsx`

**Zeile 24 andern von:**
```tsx
<div className="flex items-center gap-1 px-4 py-2">
```

**Zu:**
```tsx
<div className="flex items-center justify-center gap-1 px-4 py-2">
```

### Fix 2: ModuleTabs.tsx — Level 2 zentrieren

**Datei:** `src/components/portal/ModuleTabs.tsx`

**Zeile 81 andern von:**
```tsx
<div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none">
```

**Zu:**
```tsx
<div className="flex items-center justify-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none">
```

### Fix 3: SystemBar.tsx — Geolocation Fallback

Da der Preview-Iframe Geolocation blockiert, zeigen wir einen klickbaren Fallback an:

**Datei:** `src/components/portal/SystemBar.tsx`

**Neue State-Variable:**
```tsx
const [locationError, setLocationError] = useState(false);
```

**Fehler-Handling erweitern (Zeile 78-80):**
```tsx
(error) => {
  console.error('Geolocation error:', error);
  setLocationError(true);  // NEU
},
```

**Anzeige mit Fallback-Button (Zeile 122-136):**
```tsx
{/* Center section: Location + Time */}
<div className="hidden sm:flex items-center gap-3 text-muted-foreground">
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
      <span className="text-muted-foreground/50">·</span>
    </>
  ) : locationError ? (
    <>
      <button
        onClick={() => {
          // Retry geolocation request
          navigator.geolocation?.getCurrentPosition(/* ... */);
        }}
        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        title="Standort aktivieren"
      >
        <MapPin className="h-4 w-4" />
        <span className="text-sm">Standort?</span>
      </button>
      <span className="text-muted-foreground/50">·</span>
    </>
  ) : null}
  <div className="flex items-center gap-1.5">
    <Clock className="h-4 w-4" />
    <span className="text-sm font-mono">{formattedTime}</span>
  </div>
</div>
```

---

## Dateiänderungen Zusammenfassung

| Datei | Aktion | Änderung |
|-------|--------|----------|
| `src/components/portal/AreaTabs.tsx` | MODIFY | `justify-center` hinzufugen |
| `src/components/portal/ModuleTabs.tsx` | MODIFY | `justify-center` hinzufugen |
| `src/components/portal/SystemBar.tsx` | MODIFY | `locationError` State + Fallback-Button |

---

## Erwartetes Ergebnis

### SystemBar (nach Fix)
```text
┌──────────────────────────────────────────────────────────────────┐
│ [Portal] [S] System of a Town   📍 Standort? · 🕐 10:44    [👤]  │
└──────────────────────────────────────────────────────────────────┘
                                  ↑ Klickbar zum Aktivieren

Nach Berechtigung:
┌──────────────────────────────────────────────────────────────────┐
│ [Portal] [S] System of a Town   📍 Berlin · ⛰ 34m · 🕐 10:44  [👤] │
└──────────────────────────────────────────────────────────────────┘
```

### Navigation (nach Fix)
```text
Level 1 (zentriert):
│           [Base] [Missions] [Operations] [Services]            │

Level 2 (zentriert):
│        [Stammdaten] [KI Office] [Dokumente] [Services] [Miety] │

Level 3 (bereits zentriert):
│              [Profil] [Organisation] [Abrechnung]               │
```

---

## Hinweis zur Geolocation

Die Geolocation funktioniert moglicherweise nur:
- In der publizierten Version (nicht im Preview-Iframe)
- Wenn der User aktiv die Berechtigung erteilt
- Auf HTTPS-Seiten

Der Fallback-Button ermöglicht dem User, die Berechtigung erneut anzufordern.

