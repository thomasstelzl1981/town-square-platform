

# Plan: CI-Update auf "Graphite + Electric Blue" (Option A)

Ziel: Violett/Lila komplett aus globalen Flaechen entfernen. Electric Blue als einziger Akzent. Graphite/Ink als Basis.

## Aenderungen in `src/index.css`

### 1. Light-Mode Tokens (Zeilen 42-146) — Neue Werte

| Token | Alt | Neu |
|---|---|---|
| `--background` | `210 20% 98%` | `220 25% 98%` |
| `--foreground` | `222.2 84% 4.9%` | `222 35% 10%` |
| `--card` | `0 0% 100% / 0.92` | `0 0% 100% / 0.96` |
| `--card-foreground` | `222.2 84% 4.9%` | `222 35% 10%` |
| `--popover` | `0 0% 100%` | `0 0% 100% / 0.98` |
| `--popover-foreground` | `222.2 84% 4.9%` | `222 35% 10%` |
| `--primary` | `222.2 47.4% 11.2%` | `217 91% 56%` |
| `--primary-foreground` | `210 40% 98%` | `0 0% 100%` |
| `--secondary` | `210 40% 96.1%` | `220 18% 92%` |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | `222 35% 10%` |
| `--muted` | `210 40% 96.1%` | `220 20% 96%` |
| `--muted-foreground` | `215 14% 45%` | `220 12% 38%` |
| `--accent` | `210 40% 96.1%` | `220 18% 92%` |
| `--accent-foreground` | `222.2 47.4% 11.2%` | `222 35% 10%` |
| `--border` | `214 25% 88%` | `220 18% 86%` |
| `--input` | `214 25% 88%` | `220 18% 86%` |
| `--surface` | `0 0% 98%` | `220 20% 96%` |
| `--surface-2` | `0 0% 96%` | `220 18% 94%` |
| `--text-primary` | `222 84% 5%` | `222 35% 10%` |
| `--text-secondary` | `215 18% 40%` | `220 10% 36%` |
| `--text-dimmed` | `215 12% 55%` | `220 9% 52%` |

### 2. Dark-Mode Tokens (Zeilen 151-236) — Neue Werte

| Token | Alt | Neu |
|---|---|---|
| `--background` | `222 47% 6%` | `222 20% 8%` |
| `--foreground` | `210 35% 96%` | `210 20% 96%` |
| `--card` | `222 30% 10% / 0.85` | `222 18% 12% / 0.92` |
| `--card-foreground` | `210 40% 98%` | `210 20% 96%` |
| `--popover` | `222 35% 9%` | `222 18% 13% / 0.94` |
| `--popover-foreground` | `210 40% 98%` | `210 20% 96%` |
| `--primary-foreground` | `222 47% 6%` | `222 20% 8%` |
| `--secondary` | `222 30% 14%` | `222 14% 16%` |
| `--muted` | `222 25% 16%` | `222 14% 16%` |
| `--muted-foreground` | `215 20% 70%` | `220 10% 70%` |
| `--accent` | `222 30% 14%` | `222 14% 16%` |
| `--border` | `222 20% 22%` | `222 14% 22%` |
| `--input` | `222 25% 16%` | `222 14% 22%` |
| `--surface` | `222 30% 11%` | `222 18% 12%` |
| `--surface-2` | `222 35% 8%` | `222 16% 10%` |
| `--text-primary` | `210 35% 96%` | `210 20% 96%` |
| `--text-secondary` | `215 20% 72%` | `220 9% 72%` |
| `--text-dimmed` | `215 18% 65%` | `220 8% 62%` |

### 3. Dark Atmospheric Background (Zeilen 345-389) — Violett entfernen

Die zwei violetten Nebel-Layer (Layer 3: `hsl(275...)` und Layer 4: `hsl(250...)`) werden durch neutrale Graphite-Gradients ersetzt:

```css
/* Layer 3: VORHER violetter Nebel → NACHHER neutral graphite */
hsl(220 25% 12%) → transparent

/* Layer 4: VORHER sekundaerer violetter Nebel → NACHHER neutral graphite */  
hsl(222 20% 10%) → transparent
```

### 4. Ambient Layer deaktivieren (Zeile 242-260)

`opacity: 0` setzen oder `background-image: none`, damit keine Farbwolken durch Glass-Surfaces scheinen.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/index.css` | Light + Dark Tokens, Atmosphere-Gradients, Ambient-Layer |

Keine weiteren Dateien betroffen. Reine CSS-Token-Aenderung.

