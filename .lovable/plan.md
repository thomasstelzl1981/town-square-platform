
# Fix: Mobile Portal Route Crash

## Problem
Der `/portal` Route crasht auf Mobilgeräten mit dem Fehler "Rendered fewer hooks than expected".

## Ursache
In `SortableWidget.tsx` wird der `useSortable()` Hook **nach** einem bedingten Early Return aufgerufen. Das verletzt die React Rules of Hooks, die besagen dass Hooks immer in der gleichen Reihenfolge aufgerufen werden müssen.

**Ablauf auf Mobile:**
1. Erster Render: `isMobile = false` (initial undefined → !!undefined = false)
2. `useSortable()` wird aufgerufen → React registriert 2 Hooks
3. Nach useEffect: `isMobile = true`
4. Re-Render: Early Return → `useSortable()` wird NICHT aufgerufen
5. React erwartet 2 Hooks, findet nur 1 → **Crash**

## Lösung

### Datei: `src/components/dashboard/SortableWidget.tsx`

Alle Hooks müssen **vor** jeglichen bedingten Returns aufgerufen werden:

```typescript
export function SortableWidget({ id, children, className }: SortableWidgetProps) {
  const isMobile = useIsMobile();
  
  // IMMER useSortable aufrufen - auch auf Mobile
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isMobile }); // disabled flag nutzen!

  // Auf Mobile: Einfaches div ohne DnD-Attribute
  if (isMobile) {
    return <div className={className}>{children}</div>;
  }
  
  // Desktop: Volle DnD-Funktionalität
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50 z-50 shadow-2xl shadow-primary/20',
        !isDragging && 'cursor-grab active:cursor-grabbing',
        className
      )}
    >
      {children}
    </div>
  );
}
```

## Technische Details

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Hook-Reihenfolge | Inkonsistent (Early Return) | Konsistent (Hooks zuerst) |
| `useSortable` Aufruf | Nur Desktop | Immer (mit `disabled` Flag) |
| Mobile-Kompatibilität | ❌ Crash | ✅ Funktioniert |

## Betroffene Dateien
- `src/components/dashboard/SortableWidget.tsx` — Einzige Änderung

## Testen
Nach der Änderung:
1. `/portal` auf Desktop laden → Dashboard mit DnD sollte funktionieren
2. `/portal` auf Mobile laden → Dashboard ohne DnD sollte funktionieren
3. Browser-Größe ändern (Desktop → Mobile) → Kein Crash
