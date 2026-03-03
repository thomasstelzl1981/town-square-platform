

# Ambient Background Fix: Enterprise-Clean statt Puppenhaus

## Problem

Die 3 farbigen `radial-gradient` Glows (Magenta/Blau/Lila) werden durch die Glass-Karten (alpha 0.85-0.92) "hochgezogen" → Pastell-/Wolkeneffekt → wirkt wie Puppenhaus statt Enterprise.

## Loesung

Alle farbigen Glows raus. Ersatz durch:
- Oben: ein subtiler neutraler Horizon-Gradient (kein Pink, kein Lila)
- Aussen: eine leichte Vignette fuer Tiefe
- Optional: micro-structure nur im Light Mode

## Aenderungen in `src/index.css`

### A) Light Mode Tokens (Zeilen 129-147)

Ersetzen:
```css
--ambient-warm: 300 85% 62%;       /* RAUS */
--ambient-cool: 215 95% 62%;       /* RAUS */
--ambient-purple: 270 85% 68%;     /* RAUS */
--ambient-opacity: 0.10;
```

Durch:
```css
--ambient-opacity: 0.06;
--ambient-vignette: 0.06;
--ambient-horizon: 220 40% 75%;    /* subtiles blaeuliches Tageslicht */
```

Structure bleibt wie gehabt (ist bereits gut).

### B) Dark Mode Tokens (Zeilen 233-239)

Ersetzen:
```css
--ambient-warm: 295 85% 62%;       /* RAUS */
--ambient-cool: 215 95% 62%;       /* RAUS */
--ambient-purple: 270 85% 68%;     /* RAUS */
--ambient-opacity: 0.16;
--ambient-vignette: 0.08;
```

Durch:
```css
--ambient-opacity: 0.12;
--ambient-vignette: 0.14;
--ambient-horizon: 225 35% 35%;    /* subtiles Stahlblau */
--ambient-structure: none;
```

### C) `.sot-ambient-layer` (Zeilen 252-265)

Komplett ersetzen — von 5 Gradients auf 3 (kein Farbglow):

```css
background-image:
  linear-gradient(
    180deg,
    hsl(var(--ambient-horizon) / calc(var(--ambient-opacity) * 0.9)) 0%,
    transparent 45%
  ),
  radial-gradient(
    min(1400px, 100vw) min(900px, 85vh) at 50% 50%,
    transparent 60%,
    hsl(0 0% 0% / var(--ambient-vignette)) 100%
  ),
  var(--ambient-structure);
```

## Ergebnis

- Keine farbigen Radials → kein Pastell durch Glass
- Weite/Tiefe durch Vignette + neutralen Horizon
- Enterprise-sauber, Chrome/MacPaw-kompatibel
- Waerme kommt spaeter ueber Akzentfarben (Buttons, Tabs), nicht ueber den Background

