

## Plan: Light Mode Refactoring — Warm-Neutral Light-Graphite

### Konzept
Der Light Mode wechselt von kaltem `210°`-Blaugrau zu warmem `35°`-Graphit. Kein Weiß, kein Beige — sondern ein warmer, neutraler App-Canvas wie macOS/ChatGPT Light. Die Topbar wird im Light Mode solid (kein Glass).

### Änderungen in einer Datei: `src/index.css`

**1) `:root` Token-Austausch (Zeilen 42–146)**

Alle Light-Mode-Tokens von Hue `210` auf Hue `35` (warm-neutral) umstellen:

| Token | Alt (kalt) | Neu (warm-neutral) |
|-------|-----------|-------------------|
| `--background` | `210 14% 94%` | `35 18% 95%` |
| `--surface` | `210 12% 92%` | `35 16% 93%` |
| `--surface-2` | `210 10% 90%` | `35 14% 91%` |
| `--card` | `210 10% 97% / 0.98` | `35 14% 98% / 0.98` |
| `--card-glass` | `210 10% 97% / 0.7` | `35 14% 97% / 0.7` |
| `--surface-glass` | `210 10% 95% / 0.6` | `35 14% 95% / 0.6` |
| `--popover` | `210 10% 97% / 0.98` | `35 14% 98% / 0.98` |
| `--reading-surface` | `0 0% 100% / 0.96` | `35 14% 98% / 0.98` |
| `--border` | `210 10% 80%` | `35 10% 80%` |
| `--input` | `210 10% 80%` | `35 10% 80%` |
| `--input-bg` | `210 20% 97%` | `35 16% 96%` |
| `--muted` | `210 12% 92%` | `35 14% 92%` |
| `--secondary` | `220 18% 92%` | `35 16% 92%` |
| `--accent` | `220 18% 92%` | `35 16% 92%` |
| `--table-header-bg` | `210 20% 95%` | `35 16% 94%` |
| `--table-row-hover` | `210 20% 96%` | `35 16% 95%` |
| `--sidebar-background` | `0 0% 98%` | `35 14% 96%` |
| `--sidebar-accent` | `240 4.8% 95.9%` | `35 12% 94%` |
| `--sidebar-border` | `220 13% 91%` | `35 10% 88%` |
| `--border-subtle` | `214 32% 91%` | `35 12% 88%` |
| `--overlay-surface` | `0 0% 100% / 0.96` | `35 14% 98% / 0.96` |

Ambient-Struktur auf warm-neutral anpassen:
- `--ambient-horizon: 35 10% 88%`
- Grid-Lines von `220 30%` auf `35 10%` umstellen

**2) Glass-Nav Light-Override (nach Zeile ~573)**

Neue Regel einfügen, damit die Topbar im Light Mode solid wird:

```css
:root .glass-nav {
  background: hsl(var(--surface) / 0.98);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-bottom: 1px solid hsl(var(--border) / 0.6);
}
```

Dark Mode `.glass-nav` bleibt unverändert (Glass + blur).

**3) Btn-Glass Light anpassen (Zeile ~585)**

Light `.btn-glass` von `hsla(0 0% 100%)` auf warm-neutral:
```css
.btn-glass {
  background: hsl(35 14% 98% / 0.5);
  border: 1px solid hsl(35 10% 80% / 0.3);
}
```

### Was NICHT geändert wird

- Dark Mode Tokens → bleiben komplett unverändert
- Primary/Ring/Destructive → bleiben bei Electric Blue / Red
- Text-Hierarchie → `--text-primary/secondary/dimmed` bleiben (sind farbunabhängig)
- Keine Komponenten-Dateien betroffen — alles über CSS Custom Properties

### Ergebnis

- Light = warmes App-Graphit, kein Weiß-Blitz
- Topbar = solid Chrome-Frame (wie macOS Finder Light)
- Cards/Tabellen = helle Panels auf Canvas, nicht Sticker auf Papier
- Dark Mode = 100% unverändert

