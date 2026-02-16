

# Fix: Floating Module Switcher wird durch overflow-hidden abgeschnitten

## Ursache

Das Floating-Menue verwendet `position: absolute` und ragt unterhalb der `<nav>` heraus. Der uebergeordnete Container in `PortalLayout.tsx` (Zeile 145) hat jedoch `overflow-hidden`, was **alles abschneidet**, was ueber seine Grenzen hinausgeht — sowohl visuell als auch fuer Maus-Events.

```text
div.overflow-hidden          <-- schneidet alles ab
  SystemBar
  TopNavigation (nav)
    AreaTabs
    div.relative
      SubTabs
      div.absolute.top-full  <-- Floating Menu ragt UNTERHALB der nav heraus
                                  → wird von overflow-hidden abgeschnitten
  div.flex-1 (Main Content)
```

Das erklaert alle drei Symptome:
- Menue verschwindet (es war nie sichtbar, weil geclippt)
- Klicks funktionieren nicht (geclippter Bereich empfaengt keine Events)
- Timer-Aenderungen haben keinen Effekt (das Problem ist nicht der Timer)

## Loesung

Das Floating-Menue muss aus dem `overflow-hidden`-Kontext herausgeloest werden. Dafuer wird es als **Portal** gerendert, das direkt in `document.body` eingefuegt wird und somit von keinem Overflow betroffen ist.

## Technische Aenderungen

### Datei 1: `src/components/portal/TopNavigation.tsx`

**1. React Portal importieren (Zeile 9)**

```tsx
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
```

**2. Ref fuer Positionierung hinzufuegen**

Ein `useRef` auf dem `div.relative` Wrapper, um die Position des Floating-Menues relativ zum Trigger zu berechnen:

```tsx
const triggerRef = useRef<HTMLDivElement>(null);
const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0 });
```

**3. Position berechnen wenn sichtbar**

```tsx
useEffect(() => {
  if (showModuleSwitcher && triggerRef.current) {
    const rect = triggerRef.current.getBoundingClientRect();
    setPortalPosition({
      top: rect.bottom,
      left: rect.left + rect.width / 2,
    });
  }
}, [showModuleSwitcher]);
```

**4. Floating-Menue als Portal rendern**

Statt `position: absolute` innerhalb des `div.relative`, wird das Menue via `createPortal` in `document.body` gerendert mit `position: fixed`:

```tsx
{areaModules.length > 0 && createPortal(
  <div
    className={cn(
      "fixed z-50 pt-3 transition-all duration-200 -translate-x-1/2",
      showModuleSwitcher
        ? "opacity-100 pointer-events-auto translate-y-0"
        : "opacity-0 pointer-events-none -translate-y-1"
    )}
    style={{ top: portalPosition.top, left: portalPosition.left }}
    onMouseEnter={showSwitcher}
    onMouseLeave={hideSwitcher}
  >
    <div className="flex items-center gap-1 px-4 py-2
                    bg-card/80 backdrop-blur-xl shadow-lg rounded-2xl border border-border/30">
      {/* NavLinks wie bisher */}
    </div>
  </div>,
  document.body
)}
```

**5. triggerRef an den Wrapper binden**

```tsx
<div
  ref={triggerRef}
  className="relative"
  onMouseEnter={showSwitcher}
  onMouseLeave={hideSwitcher}
>
  <SubTabs ... />
  {/* Floating menu jetzt via Portal ausserhalb */}
</div>
```

### Zusammenfassung

- **Ursache**: `overflow-hidden` auf dem uebergeordneten Layout-Container clippt das absolute Floating-Menue
- **Fix**: Portal (`createPortal`) rendert das Menue direkt in `document.body` mit `position: fixed`
- **Positionierung**: wird dynamisch ueber `getBoundingClientRect()` des Trigger-Elements berechnet
- **Timer + Events**: bleiben unveraendert (waren korrekt, nur das Rendering war das Problem)

