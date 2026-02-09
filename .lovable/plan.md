

# Fix: Investment Parameter Panel nicht sticky im Kaufy2026 Exposé

## Problem

Das Investment-Slider-Panel in der rechten Spalte des Kaufy2026 Exposé (`/kaufy2026/immobilien/:publicId`) bleibt beim Scrollen nicht an seiner Position fixiert ("sticky"), obwohl `sticky top-20` gesetzt ist.

## Ursache

Nach Analyse des Codes und visueller Überprüfung im Browser:

1. **`overflow: hidden` auf Parent-Container** - In `zone3-theme.css` (Zeile 256):
   ```css
   .kaufy2026-container {
     ...
     overflow: hidden;  /* ← BLOCKIERT sticky! */
   }
   ```
   
   Sticky-Positionierung funktioniert nur, wenn **alle Eltern** bis zum Viewport `overflow: visible` (oder `auto` für Scrollbereiche) haben. `overflow: hidden` auf einem Ancestor unterbricht die sticky-Berechnung.

2. **Der Page-Header ist `sticky top-0`** - Der Exposé-Header hat `sticky top-0 z-10`, während das Panel `sticky top-20` hat. Das sollte funktionieren, aber nur wenn overflow korrekt gesetzt ist.

## Lösung

Zwei Änderungen sind erforderlich:

### 1. CSS-Fix: `overflow: clip` statt `overflow: hidden`

In `src/styles/zone3-theme.css` muss `overflow: hidden` durch `overflow: clip` ersetzt werden:

```css
.kaufy2026-container {
  max-width: 1400px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow-x: clip;        /* Horizontal clippen für border-radius */
  overflow-y: visible;     /* Vertikal visible für sticky! */
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}
```

**Warum `clip` statt `hidden`?**
- `overflow: clip` respektiert `border-radius` (wie hidden)
- `overflow: clip` blockiert **nicht** das sticky-Verhalten
- `overflow-y: visible` erlaubt sticky-Elementen, sich am Viewport zu orientieren

### 2. Expose-Layout: Top-Wert anpassen

Der Header im Exposé ist ca. 56px hoch (py-4 = 32px + Content). Der sticky-Wert sollte entsprechend sein:

```tsx
// In Kaufy2026Expose.tsx
<div className="sticky top-24 space-y-6">  {/* 96px = Header + Buffer */}
```

## Geänderte Dateien

| # | Datei | Änderung |
|---|-------|----------|
| 1 | `src/styles/zone3-theme.css` | `overflow: hidden` → `overflow-x: clip; overflow-y: visible;` |
| 2 | `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx` | `top-20` → `top-24` für besseren Abstand |

## Detaillierte Änderungen

### Datei 1: `src/styles/zone3-theme.css`

**Zeilen 247-256 (vorher):**
```css
.kaufy2026-container {
  max-width: 1400px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}
```

**Zeilen 247-257 (nachher):**
```css
.kaufy2026-container {
  max-width: 1400px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow-x: clip;      /* Horizontal für border-radius */
  overflow-y: visible;   /* Vertikal für sticky-Support */
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}
```

### Datei 2: `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx`

**Zeile 356 (vorher):**
```tsx
<div className="sticky top-20 space-y-6">
```

**Zeile 356 (nachher):**
```tsx
<div className="sticky top-24 space-y-6">
```

## Visuelle Erwartung

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  [Header: Zurück zur Suche]                             [Merken][Teilen]│
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   ┌───────────────────────┐│
│  │                                         │   │ Investment Parameter  ││
│  │  [Bildergalerie]                        │   │                       ││
│  │                                         │   │ Einkommen: [____]     ││
│  ├─────────────────────────────────────────┤   │ Eigenkapital: [____]  ││
│  │  Objekttitel · Preis                    │   │ ...                   ││
│  │  Key Facts                              │   │                       ││  ← Beim Scrollen
│  ├─────────────────────────────────────────┤   │ [Berechnen]           ││  ← BLEIBT
│  │                                         │   └───────────────────────┘│  ← SICHTBAR
│  │  [MasterGraph - 40 Jahre]               │                            │
│  │                                         │                            │
│  ├─────────────────────────────────────────┤                            │
│  │  [Haushaltsrechnung]                    │                            │
│  │                                         │                            │
│  └─────────────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | Seite `/kaufy2026/immobilien/:id` öffnen | Panel rechts sichtbar |
| 2 | Nach unten scrollen (500px+) | Panel bleibt sichtbar unter Header |
| 3 | Ganz nach unten scrollen | Panel scrollt mit sobald es den Footer erreicht |
| 4 | Border-radius Container | Bleibt erhalten (keine Ecken-Überläufe) |
| 5 | Mobile-Ansicht | Panel ausgeblendet (`hidden lg:block`) |

