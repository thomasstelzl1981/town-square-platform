
# Floating "Zwischenspeichern"-Button

## Was wird geaendert

Die einzelnen "Zwischenspeichern"-Buttons in den Kacheln `FinanceObjectCard` und `FinanceRequestCard` werden entfernt. Stattdessen gibt es einen einzigen Floating-Button, der beim Scrollen immer rechts unten sichtbar bleibt und alle Formulardaten auf einmal zwischenspeichert.

## Umsetzung

### 1. Buttons aus den Kacheln entfernen

In `FinanceObjectCard.tsx` und `FinanceRequestCard.tsx` wird der jeweilige Footer-Bereich mit dem "Zwischenspeichern"-Button entfernt. Die Save-Logik (localStorage-Schreiben) bleibt intern erhalten, wird aber ueber eine neue Prop `onSave` nach aussen exponiert, damit der uebergeordnete Container den Speichern-Vorgang ausloesen kann.

**Neue Prop in beiden Komponenten:**
- `onSaveRef?: React.MutableRefObject<(() => void) | null>` — ein Ref, ueber das die Parent-Komponente die interne Save-Funktion aufrufen kann

Alternativ einfacher: Die Karten behalten ihre `handleSave`-Funktion, aber der Button wird ueber eine neue Prop `hideFooter?: boolean` ausgeblendet. Der Floating-Button in der Akte ruft dann direkt `localStorage.setItem` auf (die Keys sind bekannt).

**Gewaehlt wird der einfachste Ansatz:** Neue Prop `hideFooter?: boolean` in beiden Karten. Wenn `true`, wird der Button-Footer nicht gerendert. Die `handleSave`-Funktion wird ueber ein `ref` (useImperativeHandle) exponiert.

### 2. Floating-Button in FMFinanzierungsakte.tsx

Ein `fixed`-positionierter Button (`fixed bottom-6 right-6 z-50`) mit:
- Save-Icon + Text "Zwischenspeichern"
- Glassmorphism-Stil passend zum Design (shadow-lg, backdrop-blur)
- Klick loest die Save-Funktionen beider Karten aus (ueber Refs)
- Toast-Bestaetigungsmeldung wie bisher

### 3. MOD-07 AnfrageTab — gleiche Behandlung

Auch in `AnfrageTab.tsx` den gleichen Floating-Button einfuegen, damit das Verhalten konsistent ist.

## Technische Details

### FinanceObjectCard.tsx + FinanceRequestCard.tsx

```typescript
// Neues Interface
interface Props {
  // ... bestehende Props
  hideFooter?: boolean;
  saveRef?: React.RefObject<{ save: () => void } | null>;
}

// useImperativeHandle exponiert save()
React.useImperativeHandle(saveRef, () => ({
  save: handleSave,
}));

// Footer nur rendern wenn !hideFooter
{!readOnly && !hideFooter && (
  <div className="px-4 py-3 border-t ...">...</div>
)}
```

### FMFinanzierungsakte.tsx

```typescript
const objectCardRef = useRef<{ save: () => void }>(null);
const requestCardRef = useRef<{ save: () => void }>(null);

const handleFloatingSave = () => {
  objectCardRef.current?.save();
  requestCardRef.current?.save();
  toast.success('Daten zwischengespeichert');
};

// Am Ende der Komponente:
<Button
  onClick={handleFloatingSave}
  className="fixed bottom-6 right-6 z-50 shadow-lg gap-2"
>
  <Save className="h-4 w-4" /> Zwischenspeichern
</Button>
```

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `FinanceObjectCard.tsx` | `hideFooter` + `saveRef` Props, useImperativeHandle, forwardRef |
| `FinanceRequestCard.tsx` | `hideFooter` + `saveRef` Props, useImperativeHandle, forwardRef |
| `FMFinanzierungsakte.tsx` | Floating-Button, Refs fuer beide Karten, `hideFooter={true}` |
| `AnfrageTab.tsx` | Gleicher Floating-Button + Refs |
