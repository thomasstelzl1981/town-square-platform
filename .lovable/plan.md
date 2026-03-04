

## Design-Anpassung: "Frosted App Canvas" (Light) + "Graphite Neutral" (Dark)

### Zusammenfassung

6 gezielte Änderungen in `src/index.css` — keine Komponentenänderungen nötig, da alle Werte über CSS Custom Properties fließen.

### Änderungen

**Datei: `src/index.css`**

#### 1. Light Mode: Canvas dunkler + neutraler (Zeilen 42-146)

Ersetze die Core-Background-Tokens in `:root`:

| Token | Alt | Neu |
|-------|-----|-----|
| `--background` | `220 25% 98%` | `210 14% 94%` |
| `--surface` | `220 20% 96%` | `210 12% 92%` |
| `--surface-2` | `220 18% 94%` | `210 10% 90%` |
| `--card` | `0 0% 100% / 0.96` | `210 10% 97% / 0.98` |
| `--popover` | `0 0% 100% / 0.98` | `210 10% 97% / 0.98` |
| `--border` | `220 18% 86%` | `210 10% 80%` |
| `--input` | `220 18% 86%` | `210 10% 80%` |
| `--muted` | `220 20% 96%` | `210 12% 92%` |
| `--muted-foreground` | `220 12% 38%` | `220 10% 34%` |

#### 2. Light Mode: bg-atmosphere neutral (Zeilen 306-341)

Ersetze den gesamten `:root --bg-atmosphere`-Block. Entferne alle Wolken-Layer (1-4) und den Sonnenschein-Glow. Neuer Wert:

```css
--bg-atmosphere:
  linear-gradient(
    180deg,
    hsl(210 12% 92%) 0%,
    hsl(210 10% 94%) 35%,
    hsl(210 8% 96%) 70%,
    hsl(210 6% 97%) 100%
  );
```

#### 3. Dark Mode: Graphite ent-navy-en (Zeilen 151-236)

Ersetze die Core-Dark-Tokens in `.dark`:

| Token | Alt | Neu |
|-------|-----|-----|
| `--background` | `222 20% 8%` | `220 10% 7%` |
| `--surface` | `222 18% 12%` | `220 10% 11%` |
| `--surface-2` | `222 16% 10%` | `220 10% 9%` |
| `--border` | `222 14% 22%` | `220 8% 20%` |
| `--muted` | `222 14% 16%` | `220 8% 15%` |
| `--card-glass` | `222 20% 6% / 0.7` | `220 10% 7% / 0.74` |
| `--surface-glass` | `222 20% 5% / 0.6` | `220 10% 6% / 0.64` |
| `--sidebar-background` | `222 20% 5%` | `220 10% 6%` |

#### 4. Dark Mode: bg-atmosphere ent-blauen (Zeilen 344-388)

Sättigung in allen Layern drastisch reduzieren (60%→15%, 50%→12%, 40%→10% etc.), Hue von 222-225 auf 220 vereinheitlichen. Layer 6 (Basis-Gradient) von `222 70-80%` auf `220 12-15%`.

#### 5. Ambient-Layer Tokens aktualisieren (Zeilen 129-145 + 231-236)

Light:
- `--ambient-horizon`: `220 15% 80%` → `195 12% 85%`
- `--ambient-opacity`: `0.06` → `0.03`
- `--ambient-vignette`: `0.06` → `0.03`

Dark:
- `--ambient-horizon`: `225 35% 35%` → `195 12% 28%`
- `--ambient-opacity`: `0.12` → `0.06`
- `--ambient-vignette`: `0.14` → `0.10`

#### 6. Keine Komponentenänderungen nötig

- Der Header/Topbar nutzt `glass-card` bzw. `bg-[hsl(var(--surface))]` — diese Werte werden über die Token-Änderungen automatisch neutraler.
- Die `glass-card`-Klasse (Zeile 603) referenziert `hsl(var(--card))` — bekommt durch Punkt 1 automatisch die neutralere Tint.
- Kein Lila-Leak gefunden im Code (Suche nach `violet`/`purple`/`lila` war negativ).

### Erwartetes Ergebnis

- **Light**: "Frosted App Canvas" — deutlich weniger weiß, kein Baby-Blau, Cards heben sich sauber ab
- **Dark**: "Graphite neutral" — Navy-Schleier eliminiert, bleibt Enterprise-dunkel ohne Blaustich
- **Topbar**: Wirkt durch neutralere Surface-Token automatisch als "App-Frame"

