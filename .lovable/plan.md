
# Design-Überarbeitung: iOS-Style, Planeten-Armstrong und Glass UI

## Übersicht

Basierend auf den Referenzbildern (abstrakte Planeten mit Farbverläufen, Textur und 3D-Wirkung) sowie der Anforderung nach iOS/iPhone-Design wird dieses Konzept folgende Bereiche abdecken:

1. **Armstrong Planet-Design** (Collapsed State)
2. **iOS Glass-Buttons** (iPhone/Sonos-Style)
3. **Abgerundete Eingabefelder** (Kachel-Optik)
4. **Icon-Konzept** (Area Navigation)
5. **Radius-System** (Mehr Rundung)

---

## 1. Armstrong als Planet (Collapsed State)

Das aktuelle Design zeigt Armstrong als rechteckige Karte mit Header. Im minimierten Zustand soll Armstrong stattdessen als **atmosphärischer Planet** erscheinen — inspiriert von den Referenzbildern.

### Technische Umsetzung

**Neuer Collapsed State in `ArmstrongContainer.tsx`:**

| Eigenschaft | Aktuell | Neu (Planet) |
|-------------|---------|--------------|
| Form | Rechteck (w-64) | Kreis (w-16 h-16) |
| Inhalt | Header + Text + Input | Nur Planet-Grafik |
| Interaktion | Komplettes Panel | Klick expandiert |
| Drag | Grip-Handle | Gesamte Fläche |

### CSS Planet-Gradient

Ein CSS-only Planet mit atmosphärischen Layern, passend zum CI (Cyan/Blau für Light, Violett/Dunkelblau für Dark):

```css
/* Light Mode Planet (Armstrong) */
.armstrong-planet {
  background:
    /* Atmosphärische Schicht */
    radial-gradient(circle at 30% 25%, 
      hsla(195 90% 85% / 0.9) 0%, 
      hsla(200 80% 70% / 0.6) 25%, 
      transparent 50%
    ),
    /* Kern-Glow */
    radial-gradient(circle at 70% 70%, 
      hsla(210 60% 65% / 0.7) 0%, 
      transparent 40%
    ),
    /* Basis-Farbe */
    radial-gradient(circle, 
      hsl(200 75% 60%) 0%, 
      hsl(215 70% 45%) 100%
    );
  box-shadow: 
    inset -8px -8px 20px hsla(210 60% 30% / 0.4),
    inset 4px 4px 15px hsla(195 80% 90% / 0.5),
    0 0 30px hsla(200 90% 60% / 0.3);
}

/* Dark Mode Planet */
.dark .armstrong-planet {
  background:
    radial-gradient(circle at 25% 20%, 
      hsla(275 45% 35% / 0.8) 0%, 
      hsla(250 40% 25% / 0.5) 30%, 
      transparent 50%
    ),
    radial-gradient(circle at 75% 75%, 
      hsla(210 50% 30% / 0.6) 0%, 
      transparent 45%
    ),
    radial-gradient(circle, 
      hsl(250 40% 25%) 0%, 
      hsl(275 35% 15%) 100%
    );
  box-shadow: 
    inset -6px -6px 18px hsla(275 30% 10% / 0.6),
    inset 3px 3px 12px hsla(275 50% 50% / 0.3),
    0 0 40px hsla(275 45% 40% / 0.25);
}
```

### UI-Struktur (Collapsed)

```text
┌─────────────────────────────────┐
│  ●  (60px Planet, zentriert)    │
│                                  │
│     Armstrong                    │
│     (Text darunter optional)    │
└─────────────────────────────────┘
```

Beim Klick oder Tap expandiert zu vollem Chat-Panel.

---

## 2. iOS Glass-Buttons

Apple-typische Buttons mit:
- **Hoher Transparenz** (50-70%)
- **Backdrop-blur** (10-16px)
- **Inset-Schatten** (leicht eingedrückt)
- **Subtiler Border** (1px weiß/dunkel mit geringer Opazität)

### Neue Button-Varianten

**Datei:** `src/components/ui/button.tsx`

Neue Variant `glass` hinzufügen:

```tsx
glass: cn(
  "bg-white/50 dark:bg-white/10",
  "backdrop-blur-md",
  "border border-white/30 dark:border-white/10",
  "shadow-[inset_0_1px_0_hsla(0,0%,100%,0.2),0_1px_3px_hsla(0,0%,0%,0.1)]",
  "hover:bg-white/60 dark:hover:bg-white/15",
  "text-foreground"
)
```

### Icon-Button (Kreisförmig)

Für Navigation-Icons im iOS-Stil:

```tsx
// Neue Size-Variante
"icon-round": "h-12 w-12 rounded-full"
```

---

## 3. Eingabefelder als Kacheln

iOS-typische Eingabefelder:
- **Größerer Radius** (16-20px → 1rem-1.25rem)
- **Weicher Hintergrund** (leicht getönt)
- **Subtiler innerer Schatten**
- **Kein harter Border-Focus**, sondern sanfter Glow

### Input-Komponente Update

**Datei:** `src/components/ui/input.tsx`

```tsx
// Aktuell
"rounded-md border border-input bg-background"

// Neu (iOS-Style)
"rounded-2xl border-0 bg-muted/60 dark:bg-muted/40"
"backdrop-blur-sm"
"shadow-[inset_0_2px_4px_hsla(0,0%,0%,0.05)]"
"focus-visible:ring-2 focus-visible:ring-primary/30"
"placeholder:text-muted-foreground/60"
```

---

## 4. Icon-Konzept für Navigation

Die aktuellen Icons (Home, Layers, Target, Settings, Grid) sind funktional, aber nicht konsistent im ORBITAL-Theme.

### Vorschlag: Monochrome, gerundete Icons

| Bereich | Aktuell | Neu (Vorschlag) |
|---------|---------|-----------------|
| Home | `Home` | `CircleDot` (Zentrum/Ursprung) |
| Base | `Layers` | `Database` oder `Hexagon` |
| Missions | `Target` | `Rocket` oder `Compass` |
| Operations | `Settings` | `Cog` oder `Wrench` |
| Services | `Grid` | `Grid3x3` oder `LayoutGrid` |

### iOS-Style Tab-Bar

Icons mit Punkt-Indikator statt Unterstreichung:

```text
   ◉        ○        ○        ○        ○
  Home    Base   Missions  Ops   Services
```

---

## 5. Radius-System Überarbeitung

iOS nutzt konsequent größere Radien.

### Aktuell vs. Neu

| Token | Aktuell | Neu |
|-------|---------|-----|
| `--radius-sm` | 0.5rem (8px) | 0.75rem (12px) |
| `--radius` | 0.75rem (12px) | 1rem (16px) |
| `--radius-lg` | 1rem (16px) | 1.25rem (20px) |
| NEU: `--radius-xl` | — | 1.5rem (24px) |
| NEU: `--radius-full` | — | 9999px |

### Anwendung

| Element | Radius |
|---------|--------|
| Cards | `--radius-lg` (20px) |
| Buttons (normal) | `--radius` (16px) |
| Buttons (icon) | `--radius-full` |
| Inputs | `--radius-lg` (20px) |
| Bottom Nav | `--radius-xl` oben |

---

## 6. Mobile Bottom Nav: iOS Tab-Bar-Style

### Aktuelle Struktur

```text
┌──────────────────────────────────┐
│  Home │ Base │ Miss │ Ops │ Serv │
└──────────────────────────────────┘
```

### Neuer iOS-Style

- **Pillenförmige Aktiv-Anzeige** statt Farbwechsel
- **Größere Touch-Targets** (48x48px)
- **Glassmorphism-Hintergrund**
- **Schwebende Optik** (Abstand vom Rand)

```text
     ┌──────────────────────────┐
     │ ○   ●   ○   ○   ○      │
     │ Hm  Bs  Ms  Op  Sv      │
     └──────────────────────────┘
        (floating, rounded corners)
```

---

## Konkrete Datei-Änderungen

### Datei 1: `src/index.css`

**Zeilen 72-75 (Radius-System):**
```css
--radius: 1rem;       /* 16px */
--radius-sm: 0.75rem; /* 12px */
--radius-lg: 1.25rem; /* 20px */
--radius-xl: 1.5rem;  /* 24px */
--radius-full: 9999px;
```

**Neue Utility-Klassen (nach Zeile 505):**
```css
/* iOS Glass Button Style */
.btn-glass {
  background: hsla(0 0% 100% / 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid hsla(0 0% 100% / 0.3);
  box-shadow: 
    inset 0 1px 0 hsla(0 0% 100% / 0.2),
    0 1px 3px hsla(0 0% 0% / 0.1);
}

.dark .btn-glass {
  background: hsla(0 0% 100% / 0.1);
  border-color: hsla(0 0% 100% / 0.1);
}

/* Armstrong Planet */
.armstrong-planet {
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 25%, 
      hsla(195 90% 85% / 0.9) 0%, 
      hsla(200 80% 70% / 0.6) 25%, 
      transparent 50%
    ),
    radial-gradient(circle at 70% 70%, 
      hsla(210 60% 65% / 0.7) 0%, 
      transparent 40%
    ),
    radial-gradient(circle, 
      hsl(200 75% 60%) 0%, 
      hsl(215 70% 45%) 100%
    );
  box-shadow: 
    inset -8px -8px 20px hsla(210 60% 30% / 0.4),
    inset 4px 4px 15px hsla(195 80% 90% / 0.5),
    0 0 30px hsla(200 90% 60% / 0.3);
}

.dark .armstrong-planet {
  background:
    radial-gradient(circle at 25% 20%, 
      hsla(275 45% 35% / 0.8) 0%, 
      hsla(250 40% 25% / 0.5) 30%, 
      transparent 50%
    ),
    radial-gradient(circle at 75% 75%, 
      hsla(210 50% 30% / 0.6) 0%, 
      transparent 45%
    ),
    radial-gradient(circle, 
      hsl(250 40% 25%) 0%, 
      hsl(275 35% 15%) 100%
    );
  box-shadow: 
    inset -6px -6px 18px hsla(275 30% 10% / 0.6),
    inset 3px 3px 12px hsla(275 50% 50% / 0.3),
    0 0 40px hsla(275 45% 40% / 0.25);
}

/* iOS Input Style */
.input-ios {
  background: hsl(var(--muted) / 0.6);
  border: none;
  border-radius: var(--radius-lg);
  box-shadow: inset 0 2px 4px hsla(0 0% 0% / 0.05);
}
```

### Datei 2: `src/components/ui/button.tsx`

Neue `glass` Variante hinzufügen und Default-Radius erhöhen.

### Datei 3: `src/components/ui/input.tsx`

iOS-Style mit größerem Radius und weicherem Hintergrund.

### Datei 4: `src/components/portal/ArmstrongContainer.tsx`

Collapsed State als Planet-Kreis.

### Datei 5: `src/components/portal/MobileBottomNav.tsx`

iOS Tab-Bar-Style mit schwebender Optik und Pillen-Indikator.

### Datei 6: `src/components/portal/ArmstrongPod.tsx`

Planet-Design für Mobile (kleinere Version).

### Datei 7: `src/components/ui/card.tsx`

Radius auf `rounded-2xl` erhöhen.

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| `src/index.css` | Radius-System, `.armstrong-planet`, `.btn-glass`, `.input-ios` |
| `button.tsx` | Neue Variante `glass`, größere Radien |
| `input.tsx` | iOS-Style: `rounded-2xl`, kein Border, Muted-Background |
| `card.tsx` | `rounded-2xl` statt `rounded-lg` |
| `ArmstrongContainer.tsx` | Collapsed = Planet-Kreis mit CSS-Gradient |
| `ArmstrongPod.tsx` | Planet-Design für Mobile |
| `MobileBottomNav.tsx` | Floating Pill-Style, größere Touch-Targets |

---

## Erwartetes Ergebnis

### Light Mode
- **Armstrong Planet**: Cyan-blaue Atmosphäre mit 3D-Tiefe
- **Buttons**: Glasig-transparent mit hellem Schimmer
- **Cards**: Stark abgerundete Ecken (20px)
- **Inputs**: Weiche Kacheln ohne harte Borders

### Dark Mode
- **Armstrong Planet**: Violett-blaue Nebel-Atmosphäre
- **Buttons**: Dunkles Glas mit subtiler Reflexion
- **Navigation**: Schwebende Tab-Bar mit Blur-Effekt

### Mobile (iOS-Feel)
- Große, runde Touch-Targets
- Fließende Übergänge
- Konsistente Radien
- Pillenförmige Aktiv-Indikatoren
