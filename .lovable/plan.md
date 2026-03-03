

# Density-Schalter: Bewertung & Plan

## Einschätzung: Guter CRM-Move, aber pragmatischer umsetzen

Der Vorschlag ist sinnvoll — weniger Scroll bei langen Listen ist ein echter Produktivitätsgewinn. Allerdings würde ich die Umsetzung **schlanker** halten als vorgeschlagen:

**Gegen `--density-scale` als CSS-Variable:** Tailwind-Klassen wie `py-3`, `p-4`, `space-y-6` lassen sich nicht mit einer CSS-Variable skalieren — Tailwind generiert feste Utility-Klassen. Ein `calc()`-basierter Ansatz würde das gesamte System verkomplizieren.

**Stattdessen: CSS-Override auf `data-density="compact"`** — überschreibt gezielt die SSOT-relevanten Spacing-Werte über kompakte Klassen, die vom Attribut abhängen.

## Umsetzung (4 Dateien, keine Module betroffen)

### 1. `src/index.css` — Compact-Overrides via `data-density`
```css
html[data-density="compact"] .page-shell { ... }  /* reduzierte Paddings */
html[data-density="compact"] .glass-card { ... }   /* p-3 statt p-4 */
```
Gezielte Overrides für: PageShell-Spacing, Card-Padding, Table-Cell-Padding, Section-Gaps.

### 2. `src/hooks/useDensity.ts` — Neuer Hook
- Liest/schreibt `localStorage("sot-density")`
- Setzt `document.documentElement.dataset.density`
- Returns `{ density, setDensity, isCompact }`

### 3. `src/components/shared/PageShell.tsx` — Klassen-Marker
- Fügt eine CSS-Klasse `page-shell` hinzu, damit die CSS-Overrides greifen

### 4. `src/pages/portal/stammdaten/ProfilTab.tsx` (oder Settings-Bereich)
- Toggle-UI: "Kompakte Ansicht" Switch
- Nutzt `useDensity()` Hook

### Was sich ändert (Compact aktiv)
| Element | Comfortable | Compact |
|---------|------------|---------|
| PageShell padding | `p-6` | `p-4` |
| Card padding | `p-4` | `p-3` |
| Table cell | `py-3` | `py-2` |
| Section gaps | `space-y-6` | `space-y-4` |
| Widget grid gap | `gap-6` | `gap-4` |

### Was sich NICHT ändert
- Fonts, Farben, Border-Radii, Icons
- Keine Änderungen an den 23 Modulen
- Keine Änderungen am designManifest (die Werte bleiben als Default)

