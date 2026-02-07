
# Plan: Logo-Fix, Navigation-Hohe reduzieren und D-DIN Schriftart

## Teil 1: Logo-Problem - Anleitung zur Uberarbeitung

### Aktueller Zustand
Die PNG-Dateien haben einen weissen Hintergrund, der im Dark Mode als Rechteck sichtbar ist.

### Empfehlung fur Logo-Bearbeitung

| Anforderung | Beschreibung |
|-------------|--------------|
| **Format** | PNG mit Alpha-Kanal (Transparenz) |
| **Hintergrund** | Komplett durchsichtig (Schachbrettmuster in Photoshop/Figma) |
| **Variante Dark Mode** | Weisse/helle Logo-Grafik auf transparentem Hintergrund |
| **Variante Light Mode** | Dunkle Logo-Grafik auf transparentem Hintergrund |
| **Grosse** | Min. 400px breit fur scharfe Darstellung bei allen Grossen |
| **Inhalt** | Nur Symbol/Icon, kein Text (oder Text separat) |

### Bearbeitungsschritte (Photoshop/Figma/GIMP)

1. **Hintergrund entfernen:**
   - In Photoshop: Zauberstab auf weissen Hintergrund > Loschen
   - In Figma: Hintergrund-Rechteck loschen
   - Online: remove.bg oder photopea.com

2. **Zwei Varianten exportieren:**
   - `armstrong_logo_dark.png` - Fur Dark Mode (helles Logo auf transparent)
   - `armstrong_logo_light.png` - Fur Light Mode (dunkles Logo auf transparent)

3. **Als PNG-24 mit Transparenz exportieren** (nicht JPEG!)

### Mono-Variante als Fallback
Falls das Logo komplex ist, konnte eine einfarbige Version besser funktionieren:
- `armstrong_logo_mono_white.png` fur Dark Mode (100% weiss)
- Diese Datei existiert bereits im Ordner

**Code-Anderung:** Falls gewunscht, kann ich die AppLogo-Komponente auf die Mono-Versionen umstellen, bis neue transparente Logos bereit sind.

---

## Teil 2: Navigation schmaler machen (ohne Schriftgrosse zu andern)

### Aktuelle Hohen

| Komponente | Zeile | Aktuell | Neu |
|------------|-------|---------|-----|
| **AreaTabs** (Level 1) | Zeile 24 | `py-2` (16px) | `py-1` (8px) |
| **ModuleTabs** (Level 2) | Zeile 81 | `py-2` (16px) | `py-1` (8px) |
| **SubTabs** (Level 3) | Zeile 25 | `py-2` (16px) | `py-1` (8px) |

### Anderungen

**Datei: `src/components/portal/AreaTabs.tsx`**
```tsx
// Zeile 24: py-2 -> py-1
<div className="flex items-center justify-center gap-1 px-4 py-1">

// Zeile 34: Button padding reduzieren
'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
```

**Datei: `src/components/portal/ModuleTabs.tsx`**
```tsx
// Zeile 81: py-2 -> py-1
<div className="flex items-center justify-center gap-1 px-4 py-1 overflow-x-auto scrollbar-none">

// Zeile 95: Button padding reduzieren
'flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
```

**Datei: `src/components/portal/SubTabs.tsx`**
```tsx
// Zeile 25: py-2 -> py-1
<div className="flex items-center justify-center gap-1 px-4 py-1 overflow-x-auto scrollbar-none bg-background/50">

// Zeile 35: py-1.5 -> py-1
'px-3 py-1 rounded-md text-sm transition-all whitespace-nowrap',
```

### Vorher/Nachher

```text
Vorher (3 Zeilen a ca. 44px = 132px):
+--------------------------------------------------+
|   Base   Missions   Operations   Services        | <- 44px
+--------------------------------------------------+
|   Stammdaten   Objekte   Module3   Module4       | <- 44px
+--------------------------------------------------+
|   Ubersicht   Kontakte   Dokumente   Finanzen    | <- 44px
+--------------------------------------------------+

Nachher (3 Zeilen a ca. 32px = 96px):
+--------------------------------------------------+
|   Base   Missions   Operations   Services        | <- 32px
+--------------------------------------------------+
|   Stammdaten   Objekte   Module3   Module4       | <- 32px
+--------------------------------------------------+
|   Ubersicht   Kontakte   Dokumente   Finanzen    | <- 32px
+--------------------------------------------------+
```

**Ersparnis:** ~36px vertikal (ca. 27% weniger Hohe)

---

## Teil 3: D-DIN Schriftart integrieren

### Uber D-DIN
- Frei verfugbar unter SIL Open Font License (OFL)
- Von Datto/Monotype erstellt
- Verfugbar auf: Font Squirrel, CDNFonts
- **Einschrankung:** Nur 2 Gewichte (Regular, Bold) + 1 Italic

### Implementierung

**Schritt 1: Font-Dateien herunterladen**
- Von https://www.fontsquirrel.com/fonts/d-din
- Benotigten Formate: WOFF2, WOFF (fur Web-Optimierung)

**Schritt 2: Font-Ordner erstellen**
```
src/assets/fonts/
├── D-DIN.woff2
├── D-DIN.woff
├── D-DIN-Bold.woff2
├── D-DIN-Bold.woff
├── D-DIN-Italic.woff2 (optional)
└── D-DIN-Italic.woff (optional)
```

**Schritt 3: CSS @font-face in `src/index.css` hinzufugen**
```css
/* D-DIN Font Family */
@font-face {
  font-family: 'D-DIN';
  src: url('./assets/fonts/D-DIN.woff2') format('woff2'),
       url('./assets/fonts/D-DIN.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'D-DIN';
  src: url('./assets/fonts/D-DIN-Bold.woff2') format('woff2'),
       url('./assets/fonts/D-DIN-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

**Schritt 4: Tailwind Config anpassen (`tailwind.config.ts`)**
```ts
theme: {
  extend: {
    fontFamily: {
      sans: ['D-DIN', 'system-ui', 'sans-serif'],
      display: ['D-DIN', 'system-ui', 'sans-serif'],
    },
  },
}
```

**Schritt 5: Body-Style anpassen (`src/index.css`)**
```css
body {
  @apply bg-background text-foreground antialiased;
  font-family: 'D-DIN', system-ui, sans-serif;
}
```

### Hinweis zur Limitierung
D-DIN hat nur Regular (400) und Bold (700). Fur Zwischen-Gewichte (300, 500, 600) gibt es keinen echten Font - der Browser interpoliert dann, was weniger scharf aussieht.

**Alternative:** Falls mehr Gewichte benotigt werden, ware "Barlow" (Google Fonts) eine gute Alternative mit ahnlichem Look und 9 Gewichten.

---

## Zusammenfassung der Dateiänderungen

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `src/components/portal/AreaTabs.tsx` | MODIFY | Padding reduzieren (py-2 zu py-1) |
| `src/components/portal/ModuleTabs.tsx` | MODIFY | Padding reduzieren (py-2 zu py-1) |
| `src/components/portal/SubTabs.tsx` | MODIFY | Padding reduzieren (py-2 zu py-1) |
| `src/index.css` | MODIFY | @font-face fur D-DIN hinzufugen |
| `tailwind.config.ts` | MODIFY | fontFamily erweitern |
| `src/assets/fonts/` | CREATE | D-DIN Font-Dateien (mussen extern bereitgestellt werden) |

---

## Nachste Schritte (von Ihnen)

1. **Logo:** Neue transparente PNGs erstellen und hochladen
2. **Font:** D-DIN Font-Dateien (WOFF/WOFF2) bereitstellen oder bestatigen, dass ich sie von Font Squirrel integrieren soll

Soll ich mit Teil 2 (Navigation schmaler) und Teil 3 (D-DIN vorbereiten) beginnen, wahrend Sie die Logos uberarbeiten?
