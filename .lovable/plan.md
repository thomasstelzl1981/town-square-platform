# Plan: Armstrong Drag-and-Drop (Desktop Only)

## Zielsetzung
Armstrong (der AI-Assistent) soll auf Desktop-Geräten frei im Browser-Fenster positionierbar sein. Der Benutzer kann Armstrong an einem "Griff" packen und an eine beliebige Position ziehen.

## Geltungsbereich
- ✅ **Desktop**: Drag-and-Drop aktiv
- ❌ **Mobile/Tablet**: Bleibt fixiert am unteren Rand (wie in `mobile-card-first-navigation` Memory definiert)

---

## Technische Architektur

### 1. Neuer Hook: `useDraggable`

Ein wiederverwendbarer Hook für Drag-Funktionalität:

```tsx
// src/hooks/useDraggable.ts
interface DraggableOptions {
  storageKey?: string;           // localStorage Key für Persistenz
  initialPosition?: Position;    // Startposition
  boundaryPadding?: number;      // Abstand zum Viewport-Rand
  disabled?: boolean;            // Deaktiviert (z.B. auf Mobile)
}

interface DraggableResult {
  position: Position;            // Aktuelle {x, y} Position
  isDragging: boolean;           // Wird gerade gezogen?
  dragHandleProps: DragHandleProps; // Props für den Griff-Bereich
  containerProps: ContainerProps;   // Props für den Container
  resetPosition: () => void;     // Position zurücksetzen
}
```

### 2. Position State & Persistenz

| Aspekt | Lösung |
|--------|--------|
| **State** | `useState<{x: number, y: number}>` |
| **Persistenz** | `localStorage` mit Key `armstrong-position` |
| **Default** | Unten-rechts: `{ x: window.innerWidth - 340, y: window.innerHeight - 500 }` |
| **Resize-Handling** | Position anpassen wenn Fenster kleiner wird |

### 3. Boundary Constraints

Armstrong darf nicht aus dem sichtbaren Bereich verschwinden:

```tsx
const constrainPosition = (x: number, y: number) => {
  const padding = 20; // Mindestabstand zum Rand
  const containerWidth = 320;  // Armstrong Breite
  const containerHeight = 400; // Armstrong Höhe (variabel)
  
  return {
    x: Math.max(padding, Math.min(x, window.innerWidth - containerWidth - padding)),
    y: Math.max(padding, Math.min(y, window.innerHeight - containerHeight - padding))
  };
};
```

### 4. Grip Handle Design

Ein visuell erkennbarer "Anfasser" am oberen Rand von Armstrong:

```
+------------------------------------------+
|  ≡≡≡≡≡≡  ARMSTRONG  [−] [×]             |  <- Grip-Bereich (dragbar)
+------------------------------------------+
|                                          |
|  Chat-Inhalt...                          |
|                                          |
+------------------------------------------+
```

**Grip-Styling:**
- Cursor: `grab` / `grabbing`
- Visuelles Feedback: Subtile Linien oder Dots
- Hover-State: Leichte Farbänderung

---

## Dateiänderungen

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `src/hooks/useDraggable.ts` | **NEU** | Wiederverwendbarer Drag-Hook |
| `src/components/armstrong/ArmstrongContainer.tsx` | MODIFY | Draggable-Wrapper integrieren |
| `src/components/armstrong/ArmstrongHeader.tsx` | **NEU** | Header mit Grip-Handle |
| `src/components/armstrong/armstrong.css` | MODIFY | Cursor & Drag-Styles |

---

## Implementierungsdetails

### Phase 1: useDraggable Hook

```tsx
// Kernlogik
const handleMouseDown = (e: React.MouseEvent) => {
  if (disabled) return;
  
  setIsDragging(true);
  const startX = e.clientX - position.x;
  const startY = e.clientY - position.y;
  
  const handleMouseMove = (e: MouseEvent) => {
    const newPos = constrainPosition(e.clientX - startX, e.clientY - startY);
    setPosition(newPos);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    saveToStorage(position);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};
```

### Phase 2: Armstrong Integration

```tsx
// ArmstrongContainer.tsx
function ArmstrongContainer() {
  const { isMobile } = usePortalLayout();
  
  const { position, dragHandleProps, containerProps, isDragging } = useDraggable({
    storageKey: 'armstrong-position',
    disabled: isMobile, // Auf Mobile deaktiviert
    initialPosition: { x: window.innerWidth - 340, y: 100 }
  });
  
  // Mobile: Fixiert am unteren Rand
  if (isMobile) {
    return <ArmstrongMobileBar />;
  }
  
  // Desktop: Frei positionierbar
  return (
    <div 
      {...containerProps}
      style={{ 
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999
      }}
      className={cn(isDragging && 'select-none')}
    >
      <ArmstrongHeader dragHandleProps={dragHandleProps} />
      <ArmstrongChat />
    </div>
  );
}
```

### Phase 3: Header mit Grip

```tsx
// ArmstrongHeader.tsx
function ArmstrongHeader({ dragHandleProps }) {
  return (
    <div 
      {...dragHandleProps}
      className="flex items-center justify-between px-3 py-2 bg-background/80 
                 backdrop-blur border-b cursor-grab active:cursor-grabbing"
    >
      {/* Grip-Indikator */}
      <div className="flex gap-0.5">
        <div className="w-1 h-4 rounded-full bg-muted-foreground/30" />
        <div className="w-1 h-4 rounded-full bg-muted-foreground/30" />
      </div>
      
      <span className="text-sm font-medium">Armstrong</span>
      
      {/* Aktionen */}
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={onMinimize}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

---

## Benutzer-Interaktion

### Drag-Ablauf
1. Benutzer bewegt Maus über Grip-Bereich → Cursor wird `grab`
2. Benutzer klickt und hält → Cursor wird `grabbing`
3. Benutzer zieht → Armstrong folgt der Maus
4. Benutzer lässt los → Position wird in localStorage gespeichert
5. Bei Page-Reload → Position wird wiederhergestellt

### Edge Cases
- **Fenster verkleinert**: Position automatisch anpassen
- **Position außerhalb**: Zurück in sichtbaren Bereich bringen
- **Touch-Geräte**: Drag auf Tablet optional (später)

---

## Visuelles Verhalten

### Expanded State (Draggable)
```
+----------------------------------+
|  ≡≡  Armstrong           [−][×] |  <- Grip (cursor: grab)
+----------------------------------+
|                                  |
|  💬 Wie kann ich helfen?         |
|                                  |
|  [Nachricht eingeben...]         |
+----------------------------------+
```

### Collapsed State (Mini-Orb)
```
    +--------+
    |   🚀   |  <- Auch draggable
    +--------+
```

---

## Zusammenfassung

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Frei positionierbar | ✅ | ❌ |
| Grip-Handle | ✅ | ❌ |
| Position gespeichert | ✅ localStorage | ❌ |
| Fixierte Position | ❌ | ✅ (unten) |

**Geschätzte Dateien:** 4 (1 neu, 3 modifiziert)

---

## Nächste Schritte

1. **Plan genehmigen** → Ich implementiere die Änderungen
2. Alternativ: Feedback geben, falls Anpassungen gewünscht sind

Soll ich mit der Implementierung beginnen?
