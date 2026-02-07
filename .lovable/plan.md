
# Armstrong Orb — Copper/Bronze Metallic Redesign

## Design-Referenz

Basierend auf dem hochgeladenen Bild:
- Glänzender metallischer Orb mit **Kupfer/Bronze-Tönen**
- Charakteristisches "Lächeln": Eine geschwungene Highlight-Linie in der unteren Hälfte
- Kleiner Glanz-Punkt oben für 3D-Tiefe
- Weicher Halo-Glow um den Orb

## CSS-Änderungen (`src/index.css`)

### Neue Farbpalette — Kupfer/Bronze Metallisch

```text
Farben:
├── armstrong-orb-copper: Warmer Kupferton (25 75% 45%)
├── armstrong-orb-bronze: Tieferer Bronze (20 65% 35%)  
├── armstrong-orb-gold-accent: Goldener Highlight (40 80% 60%)
├── armstrong-orb-shadow: Dunkler Schatten (15 50% 20%)
├── armstrong-orb-glow: Warmer Kupfer-Glow (25 60% 50%)
```

### Orb-Gradient mit "Lächeln"-Effekt

```text
Aufbau:
1. Oberer Glanz-Punkt (kleiner weißer Kreis oben-links)
2. "Lächeln"-Highlight (geschwungene helle Linie unten-mitte)
3. Haupt-Kupfer-Gradient (hell oben → dunkel unten)
4. Tiefenschatten (dunkler am Rand)
```

### Glow-Effekt

```text
box-shadow:
├── Innerer Ring: Kupfer-Glow 
├── Mittlerer Halo: Warmer Schein
├── Äußerer Schatten: Tiefe
```

## ArmstrongContainer.tsx — Komplettes Refactoring

### Entfernen

- Input-Feld
- Send-Button, Attach-Button
- Komplexes Multi-Bereich Layout
- Wolken/Earth Overlays

### Neue Collapsed State Struktur

```tsx
<div 
  ref={containerRef}
  className="armstrong-orb armstrong-orb-glow"
  style={{ left: position.x, top: position.y, position: 'fixed' }}
  onMouseDown={handleDragStart}
  onDragOver={handleFileDragOver}
  onDrop={handleFileDrop}
  onClick={handleOrbClick}
>
  {/* "Lächeln" Highlight via CSS */}
  
  {/* Oberer Glanz */}
  <div className="absolute top-3 left-4 w-6 h-6 rounded-full bg-white/50 blur-sm" />
  
  {/* Zentraler Mikrofon-Button */}
  <button 
    onClick={handleMicClick}
    className="h-14 w-14 rounded-full ..."
  >
    <Mic />
  </button>
  
  {/* File Drop Indicator */}
  {isFileDragOver && <Upload icon overlay />}
</div>
```

### 4 Interaktions-Funktionen

| Aktion | Handler | Ergebnis |
|--------|---------|----------|
| Klick Mikrofon | `onClick` + `stopPropagation` | Voice-Session starten |
| Klick auf Orb | `onClick` | `toggleArmstrongExpanded()` |
| Drag auf Orb | `useDraggable` Hook | Position im Browser verschieben |
| Datei auf Orb | `onDrop` | Expand + "Was soll ich damit tun?" |

### Drag-Integration

```typescript
const { 
  position, 
  isDragging, 
  dragHandleProps 
} = useDraggable({
  storageKey: 'armstrong-orb-position',
  containerSize: { width: 160, height: 160 },
  boundaryPadding: 20,
  disabled: isMobile || voice.isListening,
});
```

### File-Drop Handling

```typescript
const [droppedFile, setDroppedFile] = useState<File | null>(null);
const [isFileDragOver, setIsFileDragOver] = useState(false);

const handleFileDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsFileDragOver(false);
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    setDroppedFile(files[0]);
    toggleArmstrongExpanded();
    // ChatPanel erhält Datei als Kontext
  }
};
```

## Dateien

### Geänderte Dateien

| Datei | Änderungen |
|-------|------------|
| `src/index.css` | Kupfer/Bronze Orb-Design statt Earth, "Lächeln"-Highlight |
| `src/components/portal/ArmstrongContainer.tsx` | Minimalistischer Orb + Drag + File-Drop |

## Erwartetes Ergebnis

Ein eleganter Armstrong-Orb:

**Visuell:**
- Kupfer/Bronze metallischer Glanz
- Charakteristisches "Lächeln" (geschwungene Highlight-Linie)
- Kleiner Glanz-Punkt oben-links
- Warmer Halo-Glow

**Funktionen:**
1. Mikrofon (Mitte) → Spracheingabe ohne Expand
2. Klick → Expand für Textchat
3. Drag → Positionierung im Browser
4. File-Drop → Expand + Datei-Kontext
