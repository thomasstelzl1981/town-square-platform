
# Kaufy Website: Investment-Suche Eingabemaske reparieren

## Problem

Die Suchleiste auf der Kaufy-Homepage ist optisch zerstoert. Die Eingabefelder (Einkommen, Eigenkapital) haben keine sichtbaren Containergrenzen, Labels und Werte laufen ineinander, und die Karten-Struktur ist nicht erkennbar. Die Ursache liegt in einem Konflikt zwischen der CSS-Klasse `.kaufy2026-search-card` (die `position: absolute` setzt) und den Inline-Styles, die das ueberschreiben sollen.

Konkret:
- Die CSS-Klasse setzt `position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%)` — obwohl diese als "Legacy" kommentiert ist
- Die Inline-Styles im JSX ueberschreiben `position`, `bottom`, `left` und `transform`, aber die CSS-Klasse behaelt andere Eigenschaften bei (border-radius, padding, box-shadow)
- Die `.kaufy2026-inline-input` Container (weisse Box mit Label + Input + Waehrungszeichen) rendern optisch nicht korrekt — die Felder wirken "nackt" ohne sichtbare Begrenzung
- Spinner-Pfeile bei Number-Inputs sind sichtbar (obwohl CSS sie verstecken sollte)

## Loesung

### Schritt 1: CSS bereinigen — Legacy-Position entfernen

In `src/styles/zone3-theme.css` die `.kaufy2026-search-card` Klasse von `position: absolute` auf `position: relative` aendern und die Legacy-Positionierung entfernen. Die Klasse wird dann rein fuer das visuelle Styling (Hintergrund, Schatten, Abrundung, Padding) verwendet.

### Schritt 2: Inline-Style Overrides entfernen

In `Kaufy2026SearchBar.tsx` (Zeile 76) die Inline-Styles `position: 'relative', bottom: 'auto', left: 'auto', transform: 'none'` entfernen, da die CSS-Klasse diese nicht mehr benoetigt. Nur `width: '100%'` und `background` bleiben.

### Schritt 3: Input-Container Styling sicherstellen

Die `.kaufy2026-inline-input` CSS-Klasse pruefen und sicherstellen, dass:
- Weisser Hintergrund sichtbar ist (`background: #ffffff`)
- Abgerundete Ecken (`border-radius: 8px`)
- Padding korrekt (`8px 12px`)
- Input-Spinner ausgeblendet werden (via `-moz-appearance: textfield` ergaenzen)

### Schritt 4: MOD-08 und MOD-09 Vergleich

Die Portal-Suchformulare (MOD-08 SucheTab, MOD-09 BeratungTab) verwenden korrekt die Shadcn `Card`, `Input`, `Label` und `Select` Komponenten. Diese sind nicht betroffen — der Fehler liegt ausschliesslich in der Zone 3 Kaufy SearchBar.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/styles/zone3-theme.css` | `.kaufy2026-search-card`: absolute -> relative, Legacy-Positionierung entfernen, Mobile-Media-Query anpassen |
| `src/components/zone3/kaufy2026/Kaufy2026SearchBar.tsx` | Inline-Style-Overrides bereinigen, nur visuell relevante Styles behalten |

## Nicht betroffen

- MOD-08 SucheTab (verwendet Shadcn Card + Input — funktioniert korrekt)
- MOD-09 BeratungTab/KatalogTab (verwendet PartnerSearchForm — funktioniert korrekt)
- MOD-04 Verwaltung (separate Pruefung bei naechstem Login-Test)
