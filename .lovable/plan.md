
## Mobile-Fixes: Acquiary Header + Kaufy Hero & Suche

### 1. Acquiary: Doppeltes Menue im Header (P0)

**Problem:** In `AcquiaryLayout.tsx` Zeile 58 steht:
```text
<nav className="aq-nav hidden md:flex">
```
Die Tailwind-Klasse `hidden` setzt `display: none`, aber die CSS-Klasse `.aq-nav` in `acquiary-premium.css` Zeile 96 setzt `display: flex` — das ueberschreibt `hidden` wegen CSS-Spezifitaet. Ergebnis: Auf Mobile sind sowohl die Desktop-Nav-Links als auch der Hamburger-Button sichtbar.

**Fix:** In `acquiary-premium.css` die `.aq-nav`-Regel um eine Media Query erweitern:

```text
.aq-nav {
  display: none;  /* Mobile: versteckt (Hamburger uebernimmt) */
  align-items: center;
  gap: 0.25rem;
}

@media (min-width: 768px) {
  .aq-nav {
    display: flex;  /* Desktop: sichtbar */
  }
}
```

Damit wird die Tailwind-Klasse nicht mehr ueberschrieben und nur ab `md` (768px) angezeigt.

---

### 2. Kaufy: Hero-Bild abgeschnitten / nicht responsive (P1)

**Problem:** In `Kaufy2026Hero.tsx` hat der Hero-Wrapper feste Desktop-Werte:
- `width: calc(100% - 120px)` (60px Margin links + rechts)
- `margin: 60px 60px 0`
- `height: 620`
- `padding: 40px 60px` im Overlay

Auf Mobile wird dadurch das Bild stark zusammengedrueckt, der Text wird abgeschnitten ("Die KI-Pla... Kapitalan...").

**Fix:** Responsive Werte im `heroStyles`-Objekt in `Kaufy2026Hero.tsx`:

| Property | Desktop (aktuell) | Mobile (neu) |
|----------|-------------------|--------------|
| wrapper width | `calc(100% - 120px)` | `calc(100% - 24px)` |
| wrapper margin | `60px 60px 0` | `12px 12px 0` |
| wrapper height | `620` | `auto`, min-height `400` |
| wrapper borderRadius | `20` | `16` |
| overlay padding | `40px 60px` | `24px 20px` |
| title fontSize | `3rem` | `1.75rem` |

Da die Komponente inline Styles nutzt (bewusste Architektur-Entscheidung AUD-001), wird ein `useIsMobile()`-Hook verwendet, um zwischen Mobile/Desktop-Werten zu wechseln. Alternativ koennen CSS Media Queries mit einer CSS-Klasse statt inline Styles verwendet werden — aber das wuerde das AUD-001-Pattern brechen. Besser: Conditional Style-Objekte basierend auf Viewport.

---

### 3. Kaufy: Such-Leiste auf Mobile (P2)

**Problem:** In `Kaufy2026SearchBar.tsx`:
- Die Eingabefelder ("Einkommen (zvE)" und "Eigenkapital") haben `flex: 1` und werden auf Mobile zu schmal — Labels und Werte laufen ineinander
- Die Such-Buttons (Pfeil, Chevron) werden an den rechten Rand gedrueckt und teils abgeschnitten
- Der `searchFloat`-Container hat `width: 85%` und `margin: -60px auto 0` — auf Mobile rutscht er zu hoch

**Fix:**
- `Kaufy2026SearchBar.tsx`: Auf Mobile die Inputs vertikal stapeln (`flex-direction: column` statt `row`) 
- Labels ueber den Input-Feldern statt daneben
- Such-Button volle Breite auf Mobile
- `Kaufy2026Hero.tsx` `searchFloat`: Auf Mobile `width: 95%` und `margin: -40px auto 0`

---

### Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/styles/acquiary-premium.css` | `.aq-nav` auf `display: none` + Media Query `md:flex` |
| `src/components/zone3/kaufy2026/Kaufy2026Hero.tsx` | Responsive Hero-Dimensionen fuer Mobile |
| `src/components/zone3/kaufy2026/Kaufy2026SearchBar.tsx` | Vertikales Stacking der Input-Felder auf Mobile |

### Betroffene Module

Alle drei Dateien liegen ausserhalb der Modul-Pfade (Zone 3 / shared styles) — keine Freeze-Pruefung noetig.
