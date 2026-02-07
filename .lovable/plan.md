
# Bugfix: Logo + Settings-Icon + Uhrzeit wiederherstellen

## Zusammenfassung der drei Fixes

| Problem | Losung |
|---------|--------|
| Logo verschwunden | PNG statt SVG importieren |
| Settings-Icon doppelt | Standalone Settings-Button entfernen (Zeilen 169-179) |
| Uhrzeit fehlt | Digitale Zeit wieder hinzufugen (ohne Clock-Icon) |

---

## Dateiänderungen

### 1. AppLogo.tsx - PNG statt SVG verwenden

**Datei:** `src/components/portal/AppLogo.tsx`

**Zeilen 11-13 andern von:**
```tsx
// Logo imports - SVG for native transparency
import logoLight from '@/assets/logos/armstrong_logo_light.svg';
import logoDark from '@/assets/logos/armstrong_logo_dark.svg';
```

**Zu:**
```tsx
// Logo imports - PNG with transparency
import logoLight from '@/assets/logos/armstrong_logo_light.png';
import logoDark from '@/assets/logos/armstrong_logo_dark.png';
```

---

### 2. SystemBar.tsx - Settings-Button entfernen

**Zeilen 169-179 komplett entfernen:**
```tsx
{/* Settings button */}
<Button
  variant="ghost"
  size="icon"
  asChild
  className="h-9 w-9"
>
  <Link to="/portal/stammdaten/sicherheit" title="Einstellungen">
    <Settings className="h-5 w-5" />
  </Link>
</Button>
```

---

### 3. SystemBar.tsx - Digitale Uhrzeit wieder hinzufugen

**Zeilen 119-165 (Center section) erweitern:**

Die Uhrzeit soll nach dem Standort angezeigt werden, aber **ohne das Clock-Icon**:

```tsx
{/* Center section: Location + Time (digital only, no icon) */}
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
    </>
  ) : locationError ? (
    <button
      onClick={() => {
        // ... retry logic bleibt gleich
      }}
      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
      title="Standort aktivieren"
    >
      <MapPin className="h-4 w-4" />
      <span className="text-sm">Standort?</span>
    </button>
  ) : null}
  
  {/* Digitale Uhrzeit - ohne Icon */}
  <span className="text-sm font-mono tabular-nums">{formattedTime}</span>
</div>
```

---

## Visuelle Darstellung

### Vorher (fehlerhaft):
```text
+--------------------------------------------------------------------+
| [Haus]  [LOGO FEHLT]    Standort?           [Zahnrad] [Rakete] [T] |
+--------------------------------------------------------------------+
                          ^ Keine Uhr          ^ Doppelt
```

### Nachher (korrigiert):
```text
+--------------------------------------------------------------------+
| [Haus]  [ARMSTRONG LOGO]    Standort? · 11:05         [Rakete] [T] |
+--------------------------------------------------------------------+
          ^ Sichtbar          ^ Mit Uhrzeit             ^ Nur 2 Icons
```

---

## Zusammenfassung der Änderungen

| Datei | Zeilen | Aktion |
|-------|--------|--------|
| `src/components/portal/AppLogo.tsx` | 11-13 | SVG zu PNG andern |
| `src/components/portal/SystemBar.tsx` | 169-179 | Settings-Button entfernen |
| `src/components/portal/SystemBar.tsx` | 164 | Uhrzeit nach Standort hinzufugen |
