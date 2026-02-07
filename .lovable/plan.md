
# Armstrong Positionierung und Drag-and-Drop Fix

## Identifizierte Probleme

### 1. Position links oben
Die gespeicherte Position aus `localStorage` ist veraltet oder ungültig. Der Hook verwendet diese statt der Default-Position "rechts unten".

### 2. Drag-and-Drop funktioniert nicht
Der `handleMouseDown` verwendet eine veraltete Position aus dem Closure. Bei jedem Render wird eine neue Funktion erstellt, aber mit veralteten Werten.

### 3. containerSize-Wechsel
Beim Wechsel zwischen collapsed (150x150) und expanded (320x500) wird die gleiche Position verwendet, was zu Sprüngen führt.

---

## Lösung

### 1. useDraggable.ts — Position-Referenz korrigieren

**Problem:** `handleMouseDown` erfasst `position` im Closure-Scope, der veraltet sein kann.

**Lösung:** Verwende `useRef` für die aktuelle Position und synchronisiere sie mit dem State:

```typescript
// Aktuelle Position in Ref für Event-Handler
const positionRef = useRef<Position>(position);
useEffect(() => {
  positionRef.current = position;
}, [position]);

// In handleMouseDown:
dragOffset.current = {
  x: e.clientX - positionRef.current.x,
  y: e.clientY - positionRef.current.y,
};
```

### 2. useDraggable.ts — Initialisierung verbessern

**Problem:** Gespeicherte Position überschreibt immer den Standard.

**Lösung:** Validiere die gespeicherte Position strenger und lösche ungültige Werte:

```typescript
const stored = loadStoredPosition(storageKey);
if (stored) {
  // Prüfe ob Position im sichtbaren Bereich ist
  const constrained = constrainPosition(...);
  
  // Wenn Position stark abweicht, verwende Default
  if (Math.abs(constrained.x - stored.x) > 50 || 
      Math.abs(constrained.y - stored.y) > 50) {
    // Gespeicherte Position war ungültig
    localStorage.removeItem(storageKey);
    return getDefaultPosition(...);
  }
  return constrained;
}
```

### 3. ArmstrongContainer.tsx — Separater Storage-Key für Expanded

**Problem:** Collapsed und Expanded teilen den gleichen Storage-Key, obwohl sie unterschiedliche Größen haben.

**Lösung:** Verwende separaten Key oder lösche die Position beim Wechsel:

```typescript
// Beim Toggle die alte Position löschen
useEffect(() => {
  // Position bei sichtbar werden zurücksetzen
  if (armstrongVisible) {
    resetPosition();
  }
}, [armstrongVisible]);
```

### 4. Einmalige localStorage-Bereinigung

Füge eine Migration hinzu, die den alten `armstrong-position` Key löscht:

```typescript
// In usePortalLayout.tsx oder ArmstrongContainer.tsx
useEffect(() => {
  localStorage.removeItem('armstrong-position');
}, []);
```

---

## Änderungen

| Datei | Änderung |
|-------|----------|
| `src/hooks/useDraggable.ts` | Position-Ref hinzufügen, Validierung verbessern |
| `src/components/portal/ArmstrongContainer.tsx` | Position beim Einblenden zurücksetzen |

---

## Technische Details

### useDraggable.ts — Neue Implementierung

```typescript
export function useDraggable(options: DraggableOptions = {}): DraggableResult {
  // ... bestehende Optionen
  
  // Ref für aktuelle Position (für Event-Handler)
  const positionRef = useRef<Position | null>(null);
  
  const [position, setPosition] = useState<Position>(() => {
    const stored = loadStoredPosition(storageKey);
    const defaultPos = getDefaultPosition(containerSize.width, containerSize.height, boundaryPadding);
    
    if (stored) {
      const constrained = constrainPosition(stored.x, stored.y, ...);
      // Nur verwenden wenn nicht zu stark abweichend
      const isValid = 
        constrained.x >= boundaryPadding && 
        constrained.y >= boundaryPadding;
      
      if (isValid) {
        positionRef.current = constrained;
        return constrained;
      }
    }
    
    positionRef.current = defaultPos;
    return defaultPos;
  });
  
  // Sync Position-Ref
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // Verwende Ref statt State
    const currentPos = positionRef.current || position;
    dragOffset.current = {
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    };
    // ... rest
  }, [disabled, containerSize, boundaryPadding, storageKey]);
  
  // ...
}
```

### ArmstrongContainer.tsx — Reset bei Visibility

```typescript
// Position beim ersten Erscheinen zurücksetzen
const hasInitialized = useRef(false);

useEffect(() => {
  if (armstrongVisible && !hasInitialized.current) {
    hasInitialized.current = true;
    // Alte Position löschen
    localStorage.removeItem('armstrong-position');
    resetPosition();
  }
}, [armstrongVisible, resetPosition]);
```

---

## Erwartetes Ergebnis

1. Armstrong erscheint beim ersten Aktivieren rechts unten
2. Drag-and-Drop funktioniert flüssig
3. Position wird korrekt gespeichert und wiederhergestellt
4. Kein Springen beim Wechsel zwischen collapsed/expanded
