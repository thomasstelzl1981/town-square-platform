
# Fix: "Vorschau-Struktur ansehen" Button mit sichtbarem Feedback

## Problem

Der Button scrollt zwar korrekt zum Zielbereich, aber:
1. Wenn der Bereich schon fast sichtbar ist, faellt der Scroll kaum auf
2. Es gibt kein visuelles Feedback (kein Highlight, kein Pulse), das zeigt "hier ist der Bereich"

## Loesung

Eine kurze Highlight-Animation auf den "Website-Struktur"-Bereich, die nach dem Scroll abgespielt wird:

### Aenderung in `LandingPageBuilder.tsx`

1. **State hinzufuegen**: `const [highlighted, setHighlighted] = useState(false)`

2. **Button onClick erweitern**: Nach dem `scrollIntoView` wird `highlighted` fuer 1.5 Sekunden auf `true` gesetzt

3. **CSS-Klasse auf den Zielbereich**: Wenn `highlighted === true`, bekommt der `div#tab-outline-section` eine `ring-2 ring-primary/50 bg-primary/5 rounded-xl transition-all duration-500` Klasse, die nach 1.5s wieder entfernt wird

### Konkret

```text
// Button onClick (Zeile 176-178):
onClick={() => {
  const el = document.getElementById('tab-outline-section');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setHighlighted(true);
  setTimeout(() => setHighlighted(false), 1500);
}}

// Zielbereich (Zeile 188):
<div
  id="tab-outline-section"
  className={cn(
    'space-y-4 p-4 rounded-xl transition-all duration-500',
    highlighted && 'ring-2 ring-primary/50 bg-primary/5'
  )}
>
```

### Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/components/projekte/landing-page/LandingPageBuilder.tsx` | State + Highlight-Animation + cn-Import ergaenzen |

Minimaler Eingriff, maximale Wirkung: Der Nutzer sieht sofort, wohin gescrollt wurde.
