
# Plan: SystemBar Home-Button + Logo-Container

## Ubersicht

Zwei Anderungen an der SystemBar:

1. **Home-Button vereinfachen**: Text "Portal" entfernen, nur das Haus-Icon anzeigen
2. **Logo-Container einrichten**: Flexibler Container mit Theme-Erkennung fur automatischen Logo-Wechsel

---

## Teil 1: Home-Button vereinfachen

**Datei:** `src/components/portal/SystemBar.tsx`

**Zeilen 102-111 andern von:**
```tsx
<Link 
  to="/portal" 
  className={cn(
    'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
    'text-muted-foreground hover:text-foreground hover:bg-accent'
  )}
>
  <Home className="h-4 w-4" />
  <span className="text-sm font-medium hidden sm:inline">Portal</span>
</Link>
```

**Zu:**
```tsx
<Link 
  to="/portal" 
  className={cn(
    'flex items-center justify-center p-2 rounded-lg transition-colors',
    'text-muted-foreground hover:text-foreground hover:bg-accent'
  )}
  title="Zur Portal-Startseite"
>
  <Home className="h-5 w-5" />
</Link>
```

**Anderungen:**
- Text "Portal" entfernt
- Icon etwas grosser (h-5 w-5 statt h-4 w-4) fur bessere Sichtbarkeit
- Padding angepasst (p-2 statt px-3 py-1.5)
- Tooltip hinzugefugt fur Barrierefreiheit

---

## Teil 2: Logo-Container mit Theme-Support

### Neue Komponente: AppLogo

**Neue Datei:** `src/components/portal/AppLogo.tsx`

```tsx
/**
 * APP LOGO - Theme-aware logo container
 * 
 * Automatically switches between light/dark logo variants
 * based on current theme. Supports different size presets.
 */

import { useTheme } from 'next-themes';

// Logo imports
import logoLight from '@/assets/logos/armstrong_logo_light.png';
import logoDark from '@/assets/logos/armstrong_logo_dark.png';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function AppLogo({ size = 'sm', className, showText = true }: AppLogoProps) {
  const { resolvedTheme } = useTheme();
  
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;
  
  const sizeClasses = {
    sm: 'h-6',    // SystemBar
    md: 'h-10',   // Login page
    lg: 'h-16',   // Landing page
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={logo} 
        alt="Armstrong - System of a Town" 
        className={cn(sizeClasses[size], "w-auto object-contain")}
      />
    </div>
  );
}
```

### Logo-Dateien kopieren

Die hochgeladenen Logos werden in `src/assets/logos/` gespeichert:

| Datei | Verwendung |
|-------|------------|
| `armstrong_logo_light.png` | Fur Light Mode |
| `armstrong_logo_dark.png` | Fur Dark Mode |
| `armstrong_logo_mono_white.png` | Fur dunkle Hintergrunde (optional) |
| `armstrong_logo_mono_black.png` | Fur helle Hintergrunde (optional) |

### SystemBar aktualisieren

**Datei:** `src/components/portal/SystemBar.tsx`

**Zeilen 113-119 andern von:**
```tsx
{/* Logo placeholder - neutral, no branding */}
<div className="hidden md:flex items-center gap-2 text-muted-foreground">
  <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-bold">
    S
  </div>
  <span className="text-sm font-medium">System of a Town</span>
</div>
```

**Zu:**
```tsx
{/* Logo - Theme-aware */}
<div className="hidden md:flex items-center">
  <AppLogo size="sm" />
</div>
```

---

## Dateistruktur nach Anderung

```
src/
├── assets/
│   └── logos/
│       ├── armstrong_logo_light.png
│       ├── armstrong_logo_dark.png
│       ├── armstrong_logo_mono_white.png
│       └── armstrong_logo_mono_black.png
├── components/
│   └── portal/
│       ├── AppLogo.tsx          (NEU)
│       └── SystemBar.tsx        (MODIFY)
```

---

## Visuelle Darstellung

### Vorher
```text
┌────────────────────────────────────────────────────────────────┐
│ [🏠 Portal]  [S] System of a Town    📍 ... · 🕐 10:44    [👤] │
└────────────────────────────────────────────────────────────────┘
```

### Nachher (Light Mode)
```text
┌────────────────────────────────────────────────────────────────┐
│ [🏠]  [ARMSTRONG LOGO - LIGHT]     📍 ... · 🕐 10:44     [👤] │
└────────────────────────────────────────────────────────────────┘
```

### Nachher (Dark Mode)
```text
┌────────────────────────────────────────────────────────────────┐
│ [🏠]  [ARMSTRONG LOGO - DARK]      📍 ... · 🕐 10:44     [👤] │
└────────────────────────────────────────────────────────────────┘
```

---

## Vorteile des Logo-Containers

1. **Theme-Awareness**: Automatischer Wechsel zwischen Light/Dark Logo
2. **Wiederverwendbar**: Kann auf Login-Seite, Landing Page, etc. verwendet werden
3. **Grossenanpassung**: Vordefinierte Grossen (sm/md/lg) fur konsistentes Erscheinungsbild
4. **Erweiterbar**: Einfach weitere Logo-Varianten hinzufugen (z.B. Mono-Versionen)
5. **Optimiert**: Logos werden uber ES6-Import eingebunden (Bundler-optimiert)

---

## Zusammenfassung der Anderungen

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `src/assets/logos/armstrong_logo_light.png` | COPY | Light-Mode Logo |
| `src/assets/logos/armstrong_logo_dark.png` | COPY | Dark-Mode Logo |
| `src/assets/logos/armstrong_logo_mono_white.png` | COPY | Mono-Logo weiss |
| `src/assets/logos/armstrong_logo_mono_black.png` | COPY | Mono-Logo schwarz |
| `src/components/portal/AppLogo.tsx` | CREATE | Neue Logo-Komponente |
| `src/components/portal/SystemBar.tsx` | MODIFY | Home-Button + Logo-Container |
