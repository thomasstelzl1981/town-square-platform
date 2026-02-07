
# Armstrong Anpassungen — Auto-Open, Konsistente Farben & Planeten-Design

## Übersicht der Änderungen

### 1. Armstrong automatisch öffnen bei Login & Home-Button

**Aktuelles Verhalten:**
- Armstrong ist sichtbar (`armstrongVisible: true`), aber im collapsed Zustand (`armstrongExpanded: false`)
- Beim Klick auf den Home-Button passiert keine Änderung an Armstrong

**Neues Verhalten:**
- Beim Login (wenn Portal geladen wird) → Armstrong sichtbar UND expanded
- Beim Klick auf den Home-Button → Armstrong wieder sichtbar + expanded zeigen

**Technische Umsetzung:**
- `usePortalLayout.tsx`: Default für `armstrongExpanded` auf `true` setzen
- `SystemBar.tsx`: Im `handleHomeClick` auch `showArmstrong({ expanded: true })` aufrufen

---

### 2. Konsistente Farben im Expanded-Modus

**Aktuelles Problem:**
- Collapsed: `bg-gradient-to-br from-primary to-primary/80` (schöner Gradient)
- Expanded: `bg-card` mit `bg-muted/30` Header (neutrales Card-Design)

**Lösung:**
Der Expanded-Container und sein Header bekommen den gleichen Gradient wie der Collapsed-Zustand:

```text
Expanded State — Gleiche Farben wie Collapsed:
┌──────────────────────────────────────────┐
│ ● Armstrong          [─] [×]  │ ← Header mit Gradient
├──────────────────────────────────────────┤
│                                          │
│           Chat-Inhalt                    │
│           (weiß/transparent)             │
│                                          │
└──────────────────────────────────────────┘
```

**Technische Umsetzung:**
- Header: `bg-gradient-to-br from-primary to-primary/80` statt `bg-muted/30`
- Container: Gradient-Border oder durchgehender Gradient-Hintergrund
- Text/Icons im Header: `text-primary-foreground` statt Standard

---

### 3. Armstrong 30% größer (150px → 195px)

**Aktuelle Größe:**
- Collapsed: `h-[150px] w-[150px]`

**Neue Größe:**
- Collapsed: `h-[195px] w-[195px]` (oder `h-48 w-48` = 192px, näher an Tailwind-Standard)

Interne Elemente werden proportional angepasst:
- Bot-Icon: `h-5 w-5` (von `h-4 w-4`)
- Text: `text-xs` (von `text-[11px]`)
- Input: `h-10` (von `h-8`)
- Buttons: `h-8 w-8` (von `h-7 w-7`)

---

### 4. Planeten-Design (Tailwind, ohne komplexes Rendering)

**Ziel:** Eine planetenähnliche Erscheinung mit Tailwind-Mitteln, die zum CI passt

**Design-Konzept (inspiriert von Comet/Perplexity):**

```text
          ╭─────────────────────╮
         ╱   Outer Glow Ring    ╲
        │  ┌─────────────────┐   │
        │  │    Gradient     │   │  ← Primärer Planet-Body
        │  │   Planet Core   │   │
        │  │  (from-primary  │   │
        │  │   to-purple/blue)│  │
        │  └─────────────────┘   │
         ╲   Atmospheric Ring   ╱
          ╰─────────────────────╯
              ▒▒▒ Shadow ▒▒▒
```

**Tailwind-Implementierung:**

1. **Äußerer Glow-Ring (Atmosphäre):**
```css
ring-4 ring-primary/20 ring-offset-4 ring-offset-background
```

2. **Haupt-Body mit Multi-Color-Gradient:**
```css
bg-gradient-to-br from-primary via-primary/80 to-purple-600/60
```
oder für mehr Planeten-Feeling:
```css
bg-[radial-gradient(circle_at_30%_30%,_hsl(var(--primary))_0%,_hsl(217_91%_40%)_50%,_hsl(270_60%_25%)_100%)]
```

3. **Innerer Highlight (Lichtreflexion):**
Ein pseudo-Element oder ein absolut positioniertes div:
```css
before:absolute before:top-4 before:left-4 before:h-8 before:w-8 
before:rounded-full before:bg-white/20 before:blur-sm
```

4. **Schatten (Planet-Schatten):**
```css
shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),_0_0_48px_-12px_hsl(var(--primary)/0.4)]
```

**Beispiel-Implementierung für Collapsed-State:**

```tsx
<div className={cn(
  // Position & Größe
  'fixed right-5 bottom-5 z-[60] h-48 w-48 rounded-full',
  
  // Planeten-Gradient (von Primary zu Dunkel-Violett)
  'bg-gradient-to-br from-primary via-primary/80 to-purple-900/70',
  
  // Atmosphärischer Ring
  'ring-4 ring-primary/20',
  
  // Planeten-Schatten
  'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),_0_0_48px_-12px_hsl(217_91%_60%/0.4)]',
  
  // Hover-Effekt
  'hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5),_0_0_64px_-8px_hsl(217_91%_60%/0.5)]',
  'hover:scale-105 transition-all duration-300',
  
  // Flex-Layout für Inhalt
  'flex flex-col items-center justify-center gap-3 p-5',
  
  // Relative für Pseudo-Elemente
  'relative overflow-hidden'
)}>
  {/* Lichtreflexion oben-links */}
  <div className="absolute top-5 left-5 h-10 w-10 rounded-full bg-white/15 blur-md pointer-events-none" />
  
  {/* Atmosphären-Schimmer unten-rechts */}
  <div className="absolute bottom-3 right-3 h-6 w-6 rounded-full bg-purple-400/10 blur-sm pointer-events-none" />
  
  {/* Inhalt */}
  ...
</div>
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/hooks/usePortalLayout.tsx` | Default `armstrongExpanded` auf `true` |
| `src/components/portal/SystemBar.tsx` | `handleHomeClick` ruft `showArmstrong({ expanded: true })` auf |
| `src/components/portal/ArmstrongContainer.tsx` | Größe erhöhen, Planeten-Design, einheitliche Farben im Expanded-Modus |

---

## Technische Details

### usePortalLayout.tsx

```typescript
// Zeile 116-118: Default auf TRUE ändern
const [armstrongExpanded, setArmstrongExpandedState] = useState(() => {
  return getStoredValue(ARMSTRONG_EXPANDED_KEY, true); // ← von false auf true
});
```

### SystemBar.tsx

```typescript
// Zeile 48-52: Home-Click Handler erweitern
const handleHomeClick = () => {
  setActiveArea(null);
  navigate('/portal');
  // NEU: Armstrong öffnen beim Home-Button Klick
  showArmstrong({ expanded: true });
};
```

### ArmstrongContainer.tsx — Collapsed State

```tsx
// COLLAPSED: Planeten-Widget - ca. 195px, mit Planeten-Design
return (
  <div 
    ref={containerRef}
    className={cn(
      // Position & Größe (30% größer: 150 → ~195px, nutze h-48 = 192px)
      'fixed right-5 bottom-5 z-[60] h-48 w-48 rounded-full',
      
      // Planeten-Gradient
      'bg-gradient-to-br from-primary via-primary/80 to-purple-900/70',
      
      // Atmosphärischer Ring
      'ring-4 ring-primary/20',
      
      // Planeten-Schatten
      'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),_0_0_48px_-12px_hsl(217_91%_60%/0.4)]',
      
      // Hover-Effekte
      'hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5),_0_0_64px_-8px_hsl(217_91%_60%/0.5)]',
      'hover:scale-105 transition-all duration-300',
      
      // Layout
      'flex flex-col items-center justify-center gap-3 p-5',
      'relative overflow-hidden',
      
      // Drag-Over
      isDragOver && 'ring-4 ring-white/50 scale-110'
    )}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    {/* Lichtreflexion (Planeten-Highlight) */}
    <div className="absolute top-5 left-5 h-10 w-10 rounded-full bg-white/15 blur-md pointer-events-none" />
    
    {/* Atmosphären-Schimmer */}
    <div className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-purple-400/10 blur-sm pointer-events-none" />
    
    {/* Hidden file input */}
    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
    
    {/* Bot Icon + Label (größer) */}
    <div className="flex items-center gap-2 relative z-10">
      <Bot className="h-5 w-5 text-primary-foreground/90" />
      <span className="text-xs font-medium text-primary-foreground/80">Armstrong</span>
    </div>
    
    {/* Input Field (größer) */}
    <input
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onFocus={handleInputFocus}
      onClick={(e) => e.stopPropagation()}
      placeholder="Fragen..."
      className={cn(
        'w-full h-10 rounded-full bg-white/20 border-0 relative z-10',
        'text-sm text-primary-foreground placeholder:text-primary-foreground/50',
        'px-4 text-center',
        'focus:outline-none focus:bg-white/30',
        'transition-colors'
      )}
    />
    
    {/* Upload + Send Buttons (größer) */}
    <div className="flex items-center gap-3 relative z-10">
      <button 
        onClick={handleUploadClick}
        className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        title="Datei anhängen"
      >
        <Paperclip className="h-4 w-4 text-primary-foreground/80" />
      </button>
      <button 
        onClick={handleSendClick}
        className="h-8 w-8 rounded-full bg-white/30 hover:bg-white/40 flex items-center justify-center transition-colors"
        title="Senden"
      >
        <Send className="h-4 w-4 text-primary-foreground" />
      </button>
    </div>
  </div>
);
```

### ArmstrongContainer.tsx — Expanded State (einheitliche Farben)

```tsx
// EXPANDED: Chat-Panel mit Gradient-Header
if (armstrongExpanded) {
  return (
    <div 
      ref={containerRef}
      className={cn(
        'fixed right-5 bottom-5 w-80 rounded-2xl shadow-xl z-[60] flex flex-col overflow-hidden',
        // Äußerer Ring für Konsistenz mit Planet
        'ring-2 ring-primary/20',
        'bg-card',
        isDragOver && 'ring-2 ring-primary ring-inset'
      )}
      style={{ height: 500 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header mit GLEICHEM Gradient wie Collapsed */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-br from-primary to-primary/80">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="font-medium text-sm text-primary-foreground">Armstrong</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
            onClick={toggleArmstrongExpanded}
            title="Minimieren"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
            onClick={hideArmstrong}
            title="Schließen"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Panel (bleibt neutral für Lesbarkeit) */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel 
          context={getContext()}
          position="docked"
        />
      </div>
    </div>
  );
}
```

---

## Erwartetes Ergebnis

1. **Auto-Open bei Login:** Armstrong ist beim Betreten des Portals bereits im Expanded-Modus sichtbar
2. **Auto-Open bei Home-Button:** Klick auf Home öffnet Armstrong wieder (falls geschlossen)
3. **Einheitliche Farben:** Expanded-Header hat den gleichen Gradient wie der Collapsed-Planet
4. **30% größer:** 150px → 192px (Tailwind `h-48 w-48`)
5. **Planeten-Design:** Atmosphärischer Ring, Lichtreflexion, tieferer Gradient — alles in Tailwind ohne komplexes JS-Rendering
