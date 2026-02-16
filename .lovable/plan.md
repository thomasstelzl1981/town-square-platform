

# Fix: Zeitverzoegerung beim Ausblenden des Floating Module Switchers

## Problem

Die "unsichtbare Bruecke" (`pt-2` auf dem aeusseren Container) funktioniert nicht zuverlaessig, weil der absolute Container ausserhalb der visuellen Grenzen des Wrappers liegt und der Browser `onMouseLeave` trotzdem ausloest, bevor die Maus den Floating-Bereich erreicht.

## Loesung

Statt auf rein geometrische Hover-Ueberbrueckung zu setzen, wird ein **Timeout-basierter Ansatz** verwendet:

- `onMouseLeave` loest nicht sofort `setShowModuleSwitcher(false)` aus, sondern startet einen Timer (500ms)
- `onMouseEnter` loescht den Timer sofort — wenn die Maus also von SubTabs zum Floating-Bereich wechselt, wird der Timer aufgehoben bevor er feuert
- Das Floating-Element bekommt eigene `onMouseEnter`/`onMouseLeave` Handler

Dieses Pattern ist der Standard fuer Dropdown-Menues im Web und funktioniert zuverlaessig.

## Technische Aenderung

**Datei:** `src/components/portal/TopNavigation.tsx`

### 1. Import `useRef` hinzufuegen (Zeile 1)

```tsx
import { useMemo, useState, useRef, useCallback } from 'react';
```

### 2. Timeout-Ref und Handler (nach dem bestehenden useState, ca. Zeile 40)

```tsx
const hideTimeout = useRef<ReturnType<typeof setTimeout>>(null);

const showSwitcher = useCallback(() => {
  if (hideTimeout.current) {
    clearTimeout(hideTimeout.current);
    hideTimeout.current = null;
  }
  setShowModuleSwitcher(true);
}, []);

const hideSwitcher = useCallback(() => {
  hideTimeout.current = setTimeout(() => {
    setShowModuleSwitcher(false);
  }, 400);
}, []);
```

### 3. Wrapper-div Handler aktualisieren (Zeile 80-83)

Vorher:
```tsx
onMouseEnter={() => setShowModuleSwitcher(true)}
onMouseLeave={() => setShowModuleSwitcher(false)}
```

Nachher:
```tsx
onMouseEnter={showSwitcher}
onMouseLeave={hideSwitcher}
```

### 4. Floating-Container: eigene Hover-Handler (Zeile 89)

Der aeussere `div` des Floating-Bereichs bekommt ebenfalls die gleichen Handler, damit die Maus beim Betreten den Timer loescht:

```tsx
<div
  className="absolute top-full left-1/2 -translate-x-1/2 z-50 pt-2"
  onMouseEnter={showSwitcher}
  onMouseLeave={hideSwitcher}
>
```

### Verhalten

- Maus verlaesst SubTabs → 400ms Timer startet
- Maus erreicht Floating Pills innerhalb 400ms → Timer wird geloescht, Pills bleiben
- Maus verlaesst gesamten Bereich → nach 400ms verschwinden die Pills
- Klick auf Modul → sofortiges Schliessen (wie bisher)

400ms ist kurz genug, um nicht traege zu wirken, aber lang genug, um die Luecke zu ueberbruecken.

