
# Fix: Home-Button führt direkt zum cleanen Dashboard

## Problem

Beim Klick auf den Home-Button wird kurz `activeArea = null` gesetzt, aber der `useEffect` in `usePortalLayout.tsx` synchronisiert die Route `/portal` sofort wieder auf `activeArea = 'base'`, weil `deriveAreaFromPath()` für nicht-gematchte Pfade `'base'` als Default zurückgibt.

**Resultat**: 
- Erster Klick → "Base" wird angezeigt mit Level-2-Navigation (Module)
- Zweiter Klick → Dashboard ohne Module (weil kein State-Change mehr triggert)

## Lösung

Die Funktion `deriveAreaFromPath` muss `null` zurückgeben, wenn der Pfad `/portal` ist (Dashboard). Dadurch bleibt `activeArea = null` nach dem Home-Klick erhalten und die ModuleTabs werden nicht angezeigt.

## Änderungen

### 1. `src/manifests/areaConfig.ts` — `deriveAreaFromPath` erweitern

Vor der Prüfung auf Area-Pfade und Module-Routen muss explizit geprüft werden, ob wir auf dem Dashboard sind:

```typescript
export function deriveAreaFromPath(
  pathname: string, 
  moduleRouteMap: Record<string, string>
): AreaKey | null {  // <-- Return-Typ ändern auf AreaKey | null
  
  // Dashboard-Pfad = keine Area aktiv
  if (pathname === '/portal' || pathname === '/portal/') {
    return null;
  }
  
  // Area-Overview paths
  const areaMatch = pathname.match(/^\/portal\/area\/([a-z]+)/);
  if (areaMatch) { ... }
  
  // Module-Routes
  for (...) { ... }
  
  // Default: null statt 'base' (kein Fallback auf Area)
  return null;
}
```

### 2. `src/hooks/usePortalLayout.tsx` — Type-Kompatibilität

Der `useEffect` muss den `null`-Return akzeptieren (bereits korrekt typisiert als `AreaKey | null`).

Der Initial-State-Block (Zeilen 124-132) ist bereits korrekt:
```typescript
const [activeArea, setActiveAreaState] = useState<AreaKey | null>(() => {
  if (location.pathname === '/portal' || location.pathname === '/portal/') {
    return null;
  }
  ...
});
```

### 3. `src/components/portal/TopNavigation.tsx` — ModuleTabs ausblenden

Die `ModuleTabs`-Komponente muss überprüfen, ob `activeArea` existiert:

```tsx
{/* Level 2: Module Tabs - nur wenn eine Area aktiv ist */}
{activeArea && (
  <div className="border-b">
    <ModuleTabs modules={areaModules} activeModule={activeModule} />
  </div>
)}
```

Aktuell wird `ModuleTabs` immer gerendert, auch wenn `areaModules` leer ist.

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/manifests/areaConfig.ts` | Return-Typ auf `AreaKey \| null` ändern, Dashboard-Check hinzufügen, Default auf `null` |
| `src/components/portal/TopNavigation.tsx` | Conditional Rendering für Level 2 wenn `activeArea !== null` |

## Erwartetes Verhalten nach Fix

1. **Ein Klick auf Home**: 
   - `setActiveArea(null)` wird aufgerufen
   - Navigation zu `/portal`
   - `deriveAreaFromPath('/portal')` gibt `null` zurück
   - `activeArea` bleibt `null`
   - Nur Level 1 (AreaTabs) wird angezeigt, keine Area ist hervorgehoben
   - Level 2 (ModuleTabs) ist ausgeblendet
   - Dashboard "Willkommen" erscheint

2. **Kein zweiter Klick nötig** für cleanes Dashboard

## Testplan

1. Von beliebiger Modul-Seite (z.B. `/portal/stammdaten`) auf Home klicken
2. Prüfen: Nur AreaTabs sichtbar, kein Tab hervorgehoben, keine ModuleTabs
3. Prüfen: "WILLKOMMEN, THOMAS.STELZL" und Dashboard-Card werden angezeigt
4. Auf eine Area (z.B. "BASE") klicken → ModuleTabs erscheinen
5. Erneut Home klicken → sofort cleanes Dashboard
