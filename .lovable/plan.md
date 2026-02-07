
# Armstrong Design Overhaul — Professionelles, Konsistentes AI-Widget

## Zielsetzung

Armstrong soll ein eigenständiges, hochwertiges Design erhalten, das:
1. Im **Dark Mode UND Light Mode** professionell und konsistent aussieht
2. Die Farbpalette beider Modi intelligent kombiniert (wie im Referenzbild)
3. Sowohl **collapsed (Planet)** als auch **expanded (Chat)** visuell zusammenpasst
4. Die "Planetary Sphere" Identität beibehält, aber mit Tiefe und Textur

---

## Design-Konzept: "Orbital Glass"

Inspiriert vom Referenzbild (texturierter Planet mit Gold-Blau-Tönen):

### Collapsed State: "Der Planet"
- **Multi-Layer-Gradient** statt flachem 2-Farben-Verlauf
- **Goldene Highlights** (aus Light Mode: warmtöne) + **Blaue Tiefen** (aus Dark Mode: Space-Blau)
- **Subtile Noise-Textur** via CSS (pseudo-element mit grain)
- **Atmospheric Glow-Ring** statt hartem Ring
- **Größe**: 160px (etwas kompakter, eleganter)

### Expanded State: "Das Cockpit"
- **Glass-Morphism-Panel** statt hartem Farbwechsel
- **Header**: Subtle gradient der Planet-Farben (Gold→Blau), nicht der grelle Blau-Gradient
- **Body**: Halbtransparenter Glass-Hintergrund mit Blur
- **Input-Area**: Floating-Style wie iOS

---

## Technische Umsetzung

### Datei: `src/index.css`
Neue CSS-Variablen und Klassen für Armstrong:

```css
/* Armstrong Planet Colors - Mode-Unabhängig */
--armstrong-gold: 42 76% 52%;        /* Warmer Gold-Ton */
--armstrong-gold-light: 45 80% 70%;  /* Highlight Gold */
--armstrong-blue: 217 70% 45%;       /* Tiefes Space-Blau */
--armstrong-blue-deep: 230 60% 25%;  /* Dunkler Akzent */
--armstrong-purple: 275 45% 35%;     /* Nebel-Akzent */

/* Armstrong Gradients */
--armstrong-planet-gradient: radial-gradient(
  ellipse 120% 90% at 30% 20%,
  hsl(var(--armstrong-gold-light)) 0%,
  hsl(var(--armstrong-gold)) 25%,
  hsl(var(--armstrong-blue)) 55%,
  hsl(var(--armstrong-blue-deep)) 80%,
  hsl(var(--armstrong-purple)) 100%
);

/* Armstrong Glass Panel */
.armstrong-glass {
  background: hsla(222, 47%, 11%, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid hsla(217, 91%, 60%, 0.15);
}

.armstrong-glass-light {
  background: hsla(0, 0%, 100%, 0.75);
  backdrop-filter: blur(20px);
  border: 1px solid hsla(222, 47%, 11%, 0.1);
}

/* Noise Texture Overlay */
.armstrong-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: url("data:image/svg+xml,...") repeat; /* Grain pattern */
  opacity: 0.08;
  pointer-events: none;
}
```

### Datei: `src/components/portal/ArmstrongContainer.tsx`
Komplette Überarbeitung des Widgets:

**Collapsed State (Planet):**
- Größe: 160px
- Multi-Layer-Gradient als Background
- CSS-based Grain-Texture
- Doppelter Glow-Ring (innerer subtil, äußerer atmosphärisch)
- Smoother Hover-Effekt mit leichtem Pulsieren

**Expanded State (Chat Panel):**
- Glass-Hintergrund Theme-abhängig (`armstrong-glass` / `armstrong-glass-light`)
- Header: Subtiler Gradient von Gold zu Blau (nicht grelles Blau)
- Konsistente Border-Radien (20px)
- Floating Input im iOS-Style
- Schatten angepasst für beide Modi

### Datei: `src/components/chat/ChatPanel.tsx`
Anpassungen für Armstrong-Integration:

- Entfernen von `bg-sidebar` (stattdessen transparent, erbt von Container)
- Hover-States Theme-agnostisch
- Message-Bubbles mit Glass-Effekt
- Empty-State mit dezenterem Icon

---

## Farbharmonie: Dark + Light Mode kombiniert

Die Planet-Grafik im Referenzbild zeigt genau diese Kombination:
- **Gold-Töne** (Light Mode Wärme): Highlights, Atmosphäre
- **Blau-Töne** (Dark Mode Tiefe): Core, Schatten
- **Lila-Akzente**: Nebel-Atmosphäre an Rändern

Diese Palette bleibt in BEIDEN Modi identisch für Armstrong. Der Chat-Body passt sich dem aktuellen Mode an (Glass Hell / Glass Dunkel), aber der Planet selbst ist immer "Space mit goldenem Sonnenlicht".

---

## Visuelle Verbesserungen im Detail

### 1. Planet-Widget (Collapsed)

```text
┌────────────────────────────────────┐
│                                    │
│   ┌──────────────────────────┐     │
│   │    ╭─────────────────╮   │     │
│   │   ╱   Gold Highlight   ╲  │     │  ← Radial Gradient
│   │  │   ╲    ──────────   │  │     │     mit Grain-Textur
│   │  │    ╲   Blue Core    │  │     │
│   │   ╲     ╲─────────────╱  │     │
│   │    ╰──────Purple Rim──╯   │     │
│   └──────────────────────────┘     │
│        ↑ Atmospheric Glow          │
│                                    │
│   [🤖 Armstrong]                   │
│   [    Fragen...     ]             │  ← Glass-Style Input
│   [ 📎 ]      [ ➤ ]                │  ← Glass Buttons
│                                    │
└────────────────────────────────────┘
```

### 2. Chat-Panel (Expanded)

```text
┌─────────────────────────────────────┐
│ ┌─ Header: Gold→Blue Gradient ────┐ │
│ │ 🤖 Armstrong             [−][×] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ Glass Body (Theme-Adaptive) ───┐ │
│ │                                 │ │
│ │    🤖 Wie kann ich helfen?      │ │
│ │                                 │ │
│ │ ┌──────────────────────────────┐│ │
│ │ │ Message History (ScrollArea) ││ │
│ │ └──────────────────────────────┘│ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │  Nachricht eingeben... 🎤 ➤ │ │ │  ← Floating Input
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| `src/index.css` | Neue Armstrong CSS-Variablen + `.armstrong-glass`, `.armstrong-texture` Klassen |
| `src/components/portal/ArmstrongContainer.tsx` | Neues Planet-Gradient, Texture-Layer, Glass-Panel für Expanded, 160px statt 192px |
| `src/components/chat/ChatPanel.tsx` | Transparenter Hintergrund für Armstrong-Kontext, Glass-Message-Bubbles |

---

## Akzeptanzkriterien

1. **Dark Mode**: Planet-Widget und Chat-Panel sehen professionell aus mit Gold-Blau-Planet und dunklem Glass-Panel
2. **Light Mode**: Gleicher Planet, aber Chat-Body in hellem Glass-Panel (kein visueller Bruch)
3. **Collapsed → Expanded**: Transition fühlt sich nahtlos an (gleiche Farbfamilie im Header)
4. **Hover-Effekte**: Subtil, elegant, keine grellen Farbwechsel
5. **Textur**: Der Planet hat eine leichte Grain-Textur für organischen Look (wie im Referenzbild)

---

## Testplan

1. **Visueller Check Dark Mode**: Planet-Widget anzeigen, expandieren, Chat nutzen
2. **Visueller Check Light Mode**: Gleiches Szenario, prüfen auf Inkonsistenzen
3. **Mode-Toggle während Armstrong offen**: Transition smooth?
4. **Hover-States**: Alle interaktiven Elemente haben sichtbares aber dezentes Feedback
5. **Mobile**: Prüfen dass Mobile-Ansicht (BottomSheet) ebenfalls konsistent ist
