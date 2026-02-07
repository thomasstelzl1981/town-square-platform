
# Armstrong Reparatur-Plan

## Problem-Zusammenfassung

Armstrong zeigt inkonsistentes Verhalten mit State-Synchronisationsproblemen zwischen den Toggle-Buttons und der tatsächlichen Sichtbarkeit.

---

## Identifizierte Fehler

### 1. TypeScript-Fehler: `setActiveArea(null)`

**Datei:** `src/components/portal/SystemBar.tsx` Zeile 50

```typescript
// FEHLER: null ist kein gültiger AreaKey
setActiveArea(null);
```

Der `setActiveArea` erwartet `AreaKey` ('base' | 'missions' | 'operations' | 'services'), nicht `null`. Dies verursacht Type-Inkonsistenzen.

### 2. Logik-Fehler in `showArmstrong`

**Datei:** `src/hooks/usePortalLayout.tsx` Zeile 196

```typescript
if (expanded !== undefined) {  // IMMER true, da default = false
  setArmstrongExpandedState(expanded);
```

Die Bedingung ist immer true, was zu unbeabsichtigtem State-Override führt.

### 3. Fehlende Migration-Bereinigung bei State-Wechsel

Die Migration v3 (Zeile 84-91) löscht gespeicherte Werte, aber danach werden sie sofort wieder gesetzt, was zu Race-Conditions führen kann.

---

## Reparatur-Schritte

### Schritt 1: `setActiveArea` Type-Fix

**Datei:** `src/hooks/usePortalLayout.tsx`

- Option A: State-Typ auf `AreaKey | null` erweitern
- Option B: In SystemBar `'base'` statt `null` verwenden

**Empfehlung:** Option A — ermöglicht explizites "kein Bereich ausgewählt" für Dashboard

```typescript
// hooks/usePortalLayout.tsx
const [activeArea, setActiveAreaState] = useState<AreaKey | null>(() => {
  // ...
});
```

### Schritt 2: `showArmstrong` Logik korrigieren

```typescript
const showArmstrong = useCallback((options?: { resetPosition?: boolean; expanded?: boolean }) => {
  const { resetPosition = false, expanded } = options || {};
  
  if (resetPosition) {
    localStorage.removeItem(ARMSTRONG_POSITION_KEY);
    console.log('[Armstrong] Position reset');
  }
  
  setArmstrongVisibleState(true);
  localStorage.setItem(ARMSTRONG_KEY, 'true');
  
  // NUR setzen wenn explizit übergeben
  if (expanded !== undefined) {
    setArmstrongExpandedState(expanded);
    localStorage.setItem(ARMSTRONG_EXPANDED_KEY, String(expanded));
  }
}, []);
```

Hier war der Fehler: `const { expanded = false }` setzt immer einen Default, sodass die Bedingung `if (expanded !== undefined)` immer true ist.

**Fix:** Keinen Default für `expanded` setzen.

### Schritt 3: Robustere Sichtbarkeits-Initialisierung

Sicherstellen, dass Armstrong nach Migration SICHTBAR startet:

```typescript
// Nach Migration: Explizit visible setzen
if (typeof window !== 'undefined' && !localStorage.getItem(ARMSTRONG_MIGRATION_KEY)) {
  localStorage.removeItem(ARMSTRONG_KEY);
  localStorage.removeItem(ARMSTRONG_EXPANDED_KEY);
  localStorage.removeItem(ARMSTRONG_POSITION_KEY);
  localStorage.removeItem('sot-armstrong-migrated-v2');
  
  // WICHTIG: Nach Löschen sofort den Default setzen
  localStorage.setItem(ARMSTRONG_KEY, 'true');
  localStorage.setItem(ARMSTRONG_MIGRATION_KEY, 'true');
  console.log('[Armstrong] Migration v3: Reset to visible');
}
```

### Schritt 4: Debugging-Log hinzufügen (temporär)

In `ArmstrongContainer.tsx` erweiterte Logs für Diagnose:

```typescript
useEffect(() => {
  console.log('[Armstrong] Render state:', { 
    armstrongVisible, 
    armstrongExpanded, 
    isMobile,
    position 
  });
}, [armstrongVisible, armstrongExpanded, isMobile, position]);
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/hooks/usePortalLayout.tsx` | Type-Fix für `activeArea`, `showArmstrong` Logik-Fix |
| `src/components/portal/SystemBar.tsx` | Anpassung an neuen Type (oder `'base'` statt `null`) |
| `src/manifests/areaConfig.ts` | `AreaKey` Type ggf. erweitern |

---

## Alternative: Komplett-Reset

Falls die Reparatur zu komplex wird, können wir Armstrong auf eine **einfachere Variante** zurücksetzen:

- Planet-Sphere entfernen
- Fester Button in SystemBar der immer funktioniert
- Kein Dragging, keine komplexe Position-Persistenz

Dies würde die Komplexität drastisch reduzieren und die Zuverlässigkeit erhöhen.

---

## Empfehlung

**Option 1 (Reparatur):** Die 3 identifizierten Bugs fixen — geschätzte Dauer: 15-20 Minuten

**Option 2 (Vereinfachung):** Armstrong als festes Panel rechts unten ohne Drag-Logik — einfacher, stabiler

Welche Variante bevorzugen Sie?
