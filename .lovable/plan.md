
# Entfernung des Hover-Menüs (Module Switcher) aus der TopNavigation

## Problem

Das schwebende Modul-Switcher-Menü, das beim Hover über die erste Navigationsreihe (AreaTabs) erscheint, macht die Bedienung unruhig und unsicher statt einfacher.

## Lösung

Komplette Entfernung des Hover-Mechanismus und des Floating Module Switcher Portals aus `TopNavigation.tsx`. Die AreaTabs bleiben als reine Klick-Navigation bestehen.

## Änderungen

### `src/components/portal/TopNavigation.tsx`

**Entfernt wird:**
- `useState` fuer `showModuleSwitcher`
- `useRef` fuer `hideTimeout` und `triggerRef`
- `useState` fuer `portalPosition`
- `showSwitcher` und `hideSwitcher` Callbacks
- `useEffect` fuer Portal-Positionsberechnung
- `onMouseEnter` / `onMouseLeave` auf dem AreaTabs-Wrapper
- Der gesamte `createPortal`-Block (Zeilen 120–166)
- Import von `createPortal` aus `react-dom`
- Nicht mehr benoetigte Imports: `useState`, `useRef`, `useCallback`, `useEffect` (sofern anderweitig nicht gebraucht), `iconMap`, `isDevelopmentMode`, `areaModules`, `allModules` (diese werden teilweise noch fuer Level 2 benoetigt)

**Ergebnis:** Die Komponente reduziert sich auf die AreaTabs (Level 1), die ModuleTabs/SubTabs (Level 2/3) und die bestehende Klick-basierte Navigation — ohne schwebende Overlays.

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/TopNavigation.tsx` | Hover-Mechanismus und Floating Module Switcher Portal entfernen |

Keine weiteren Dateien betroffen. Die Memory-Notiz `ux/top-navigation-hover-standard` wird obsolet.
