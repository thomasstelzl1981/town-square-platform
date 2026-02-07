
# Armstrong Korrektur — Immer Kreis, Immer Rechts Unten

## Problem-Analyse

Nach ausführlicher Code-Analyse habe ich folgende Probleme identifiziert:

### Problem 1: Unterschiedliches Verhalten je nach Button

| Button | Aufruf | Ergebnis |
|--------|--------|----------|
| Home-Button | `showArmstrong({ expanded: true })` | Expanded-Modus (Panel) |
| Rocket-Button | `showArmstrong({ expanded: false })` | Collapsed-Modus (Kreis) |

**Gewünscht**: Armstrong soll **immer als Kreis** erscheinen, unabhängig davon, welcher Button geklickt wird.

### Problem 2: Position Links statt Rechts

Der aktuelle Code in `ArmstrongContainer.tsx` hat `right-5 bottom-5`, was korrekt ist. Dennoch zeigt der Screenshot das Widget links unten. Dies deutet auf einen **Browser-Cache** oder **Build-Synchronisation** hin.

---

## Lösung

### 1. SystemBar.tsx — Home-Button korrigieren

Der Home-Button soll Armstrong **als Kreis zeigen** (nicht expanded):

```typescript
// Zeile 49-54: handleHomeClick
const handleHomeClick = () => {
  setActiveArea(null);
  navigate('/portal');
  // KORREKTUR: expanded: false → zeigt Kreis
  showArmstrong({ expanded: false });
};
```

### 2. ArmstrongContainer.tsx — Position explizit setzen

Um sicherzustellen, dass keine CSS-Spezifitätsprobleme auftreten, werden die Positionsangaben mit `!important` oder inline-Style verstärkt:

```tsx
// Collapsed State (Zeile 153-180)
<div 
  ref={containerRef}
  className={cn(
    // Position explizit rechts unten
    'fixed z-[60] h-48 w-48 rounded-full',
    // Planeten-Design...
  )}
  style={{
    right: '1.25rem',  // = right-5 (20px)
    bottom: '1.25rem', // = bottom-5 (20px)
  }}
>
```

```tsx
// Expanded State (Zeile 95-151)
<div 
  ref={containerRef}
  className={cn(
    'fixed w-80 rounded-2xl shadow-xl z-[60] flex flex-col overflow-hidden',
    // ...
  )}
  style={{
    right: '1.25rem',
    bottom: '1.25rem',
    height: 500,
  }}
>
```

### 3. usePortalLayout.tsx — Default Expanded auf false

Der Default-Wert für `armstrongExpanded` soll `false` sein, damit Armstrong immer als Kreis startet:

```typescript
// Zeile 117-119
const [armstrongExpanded, setArmstrongExpandedState] = useState(() => {
  return getStoredValue(ARMSTRONG_EXPANDED_KEY, false); // ← false statt true
});
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/portal/SystemBar.tsx` | Home-Button: `expanded: false` |
| `src/components/portal/ArmstrongContainer.tsx` | Inline-Styles für Position |
| `src/hooks/usePortalLayout.tsx` | Default `armstrongExpanded: false` |

---

## Technische Details

### SystemBar.tsx — Zeile 49-54

```typescript
const handleHomeClick = () => {
  setActiveArea(null);
  navigate('/portal');
  // Armstrong als Kreis zeigen (nicht expanded)
  showArmstrong({ expanded: false });
};
```

### ArmstrongContainer.tsx — Collapsed State

```tsx
// COLLAPSED: Planetary Widget mit expliziten Inline-Styles
return (
  <div 
    ref={containerRef}
    className={cn(
      // Keine right/bottom Tailwind-Klassen mehr (werden durch inline ersetzt)
      'fixed z-[60] h-48 w-48 rounded-full',
      'bg-gradient-to-br from-primary via-primary/80 to-purple-900/70',
      'ring-4 ring-primary/20',
      'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),_0_0_48px_-12px_hsl(217_91%_60%/0.4)]',
      'hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5),_0_0_64px_-8px_hsl(217_91%_60%/0.5)]',
      'hover:scale-105 transition-all duration-300',
      'flex flex-col items-center justify-center gap-3 p-5',
      'relative overflow-hidden',
      isDragOver && 'ring-4 ring-white/50 scale-110'
    )}
    style={{
      right: '1.25rem',  // 20px = Tailwind right-5
      bottom: '1.25rem', // 20px = Tailwind bottom-5
    }}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    {/* ... Inhalt ... */}
  </div>
);
```

### ArmstrongContainer.tsx — Expanded State

```tsx
// EXPANDED: Chat-Panel mit expliziten Inline-Styles
if (armstrongExpanded) {
  return (
    <div 
      ref={containerRef}
      className={cn(
        'fixed w-80 rounded-2xl shadow-xl z-[60] flex flex-col overflow-hidden',
        'ring-2 ring-primary/20',
        'bg-card',
        isDragOver && 'ring-2 ring-primary ring-inset'
      )}
      style={{
        right: '1.25rem',
        bottom: '1.25rem',
        height: 500,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ... Inhalt ... */}
    </div>
  );
}
```

### usePortalLayout.tsx — Zeile 117-119

```typescript
// Armstrong expanded state — Default FALSE (immer als Kreis starten)
const [armstrongExpanded, setArmstrongExpandedState] = useState(() => {
  return getStoredValue(ARMSTRONG_EXPANDED_KEY, false);
});
```

---

## Erwartetes Ergebnis

1. **Immer Kreis**: Armstrong erscheint immer im Collapsed-Modus (Kreis/Planet), nicht im Expanded-Modus
2. **Immer Rechts Unten**: Position ist fix auf `right: 20px, bottom: 20px` durch Inline-Styles (überschreibt alles)
3. **Konsistentes Verhalten**: Egal ob Home-Button oder Rocket-Button — Armstrong erscheint immer gleich
4. **Kein Cache-Problem**: Inline-Styles haben höchste CSS-Spezifität
