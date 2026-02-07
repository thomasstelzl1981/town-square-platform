
# Armstrong Vereinfachen — Fixe Position ohne Drag-and-Drop

## Konzept

Armstrong bekommt eine **feste Position** rechts unten mit ca. 16-20px Abstand (≈1cm). Kein Drag-and-Drop mehr — der Rocket-Button in der SystemBar schaltet Armstrong einfach ein und aus.

```text
Desktop-Ansicht — Armstrong fixiert:
┌────────────────────────────────────────────────────────────────────┐
│ [Home] [Theme] ............ [🚀] [Avatar]     ← SystemBar (48px)  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                         Portal Content                             │
│                                                                    │
│                                                                    │
│                                                  ┌──────────────┐  │
│                                                  │   Armstrong  │  │
│                                                  │   (fixiert)  │  │
│                                                  └──────────────┘  │
│                                              ← 20px →         ↑    │
│                                                              20px  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Änderungen

### 1. ArmstrongContainer.tsx — Drag-and-Drop entfernen, fixe Position

**Was wird entfernt:**
- `useDraggable` Hook Import und Verwendung
- Alle `position` und `dragHandleProps` Logik
- Self-Healing Effekte für Off-Screen Detection
- `cursor-grab` / `cursor-grabbing` Styles

**Was wird hinzugefügt:**
- Feste Position mit CSS: `right: 20px` und `bottom: 20px`
- Im Expanded-Zustand auch fixiert

```typescript
// COLLAPSED: Feste Position rechts unten
<div 
  className={cn(
    'fixed z-[60] h-[150px] w-[150px] rounded-full',
    'right-5 bottom-5',  // ← Feste Position: 20px (≈1cm) Abstand
    'bg-gradient-to-br from-primary to-primary/80',
    // ... rest
  )}
>
  ...
</div>

// EXPANDED: Auch feste Position
<div 
  className={cn(
    'fixed w-80 border bg-card rounded-2xl shadow-xl z-[60]',
    'right-5 bottom-5',  // ← Gleiche feste Position
    // ... rest
  )}
  style={{ height: 500 }}
>
  ...
</div>
```

### 2. Expanded Header vereinfachen

Im expanded Zustand wird der Header-Bereich kein Drag-Handle mehr sein — nur noch Minimieren und Schließen-Buttons:

```typescript
// Header ohne Drag-Handle
<div className="flex items-center justify-between p-3 border-b bg-muted/30">
  <div className="flex items-center gap-2">
    <Bot icon />
    <span>Armstrong</span>
  </div>
  <div className="flex gap-1">
    <Button onClick={toggleArmstrongExpanded}>Minimieren</Button>
    <Button onClick={hideArmstrong}>Schließen</Button>
  </div>
</div>
```

### 3. useDraggable.ts — Optional: Aufräumen

Der Hook kann beibehalten werden (falls woanders genutzt), aber wird aus ArmstrongContainer nicht mehr importiert.

### 4. usePortalLayout.tsx — Position-Key entfernen

Der `ARMSTRONG_POSITION_KEY` wird nicht mehr gebraucht:
- Entferne Position-Reset-Logik aus `showArmstrong`, `resetArmstrong`
- Migrations-Code für Position kann bleiben (schadet nicht)

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/portal/ArmstrongContainer.tsx` | Rewrite: Feste Position, kein Drag-and-Drop |
| `src/hooks/usePortalLayout.tsx` | Position-Key-Logik entfernen (optional) |

---

## Code-Struktur nach Änderung

### ArmstrongContainer.tsx (vereinfacht)

```typescript
export function ArmstrongContainer() {
  const { armstrongVisible, armstrongExpanded, toggleArmstrongExpanded, hideArmstrong, isMobile } = usePortalLayout();
  const [isDragOver, setIsDragOver] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Kein useDraggable mehr!

  // Drag and drop für FILES bleibt (nicht für Position)
  const handleDragOver = useCallback(...);
  const handleDrop = useCallback(...);

  if (!armstrongVisible || isMobile) return null;

  // EXPANDED
  if (armstrongExpanded) {
    return (
      <div 
        className="fixed right-5 bottom-5 w-80 h-[500px] z-[60] ..."
      >
        ...
      </div>
    );
  }

  // COLLAPSED
  return (
    <div 
      className="fixed right-5 bottom-5 z-[60] h-[150px] w-[150px] rounded-full ..."
    >
      ...
    </div>
  );
}
```

---

## Toggle-Verhalten (bleibt gleich)

Der Rocket-Button in der SystemBar funktioniert weiterhin:
- **Klick wenn sichtbar** → `hideArmstrong()` — Armstrong verschwindet
- **Klick wenn versteckt** → `showArmstrong()` — Armstrong erscheint rechts unten

---

## Was wird entfernt

- `useDraggable` Import in ArmstrongContainer
- `position`, `isDragging`, `dragHandleProps`, `resetPosition` Variablen
- Self-Healing `useEffect` für Off-Screen Detection
- localStorage Position-Speicherung
- `cursor-grab` / `cursor-grabbing` Cursor-Styles
- Drag-Handle im expanded Header

---

## Was bleibt erhalten

- File Drag-and-Drop auf das Widget (Drop-Target für Dateien)
- Rocket-Button Toggle in SystemBar
- Minimieren/Maximieren Funktionalität
- X-Button zum Schließen
- Mobile InputBar + Sheet (unverändert)
- ChatPanel Funktionalität

---

## Erwartetes Ergebnis

1. Armstrong erscheint immer rechts unten (ca. 20px Abstand)
2. Kein Drag-and-Drop — Position ist fix
3. Rocket-Button schaltet Armstrong ein/aus
4. Einfacher Code, weniger Fehlerquellen
5. Zuverlässige Positionierung
