

# Plan: Graphite + Electric Blue — Finalisierungs-Patchset

## Scope

3 Bereiche in **einer einzigen Datei** (`src/index.css`) plus ein Hinweis zu den Leak Points.

---

## A) Light Atmosphere neutralisieren (Zeilen 334-342)

Layer 5 ("Intensiver Himmelsblau-Gradient") ersetzen durch neutralen Frost-Verlauf:

```css
/* Layer 5: Neutraler Frost-Gradient (kein Himmelsblau) */
radial-gradient(
  ellipse 160% 120% at 50% -40%,
  hsl(210 12% 96%) 0%,
  hsl(210 10% 97%) 35%,
  hsl(210 8% 98%) 70%,
  hsl(210 6% 99%) 100%
)
```

## B) Dark: 47%-Saettigung auf 20% reduzieren

| Variable | Zeile | Alt | Neu |
|---|---|---|---|
| `--card-glass` | 159 | `222 47% 6% / 0.7` | `222 20% 6% / 0.7` |
| `--surface-glass` | 160 | `222 47% 5% / 0.6` | `222 20% 5% / 0.6` |
| `--sidebar-background` | 187 | `222 47% 5%` | `222 20% 5%` |

## C) Light: Feintuning (2 Werte)

| Variable | Zeile | Alt | Neu |
|---|---|---|---|
| `--ambient-horizon` | 132 | `220 40% 75%` | `220 15% 80%` |
| `--ring` | 75 | `var(--accent-primary)` | `217 91% 56%` |

## D) Leak Points — FROZEN

Die 3 Komponenten-Dateien mit hardcoded Violett/Blau sind alle in **eingefrorenen Modulen**:

- `LeadManagerProjekte.tsx` → **MOD-10 (frozen)**
- `VersicherungenTile.tsx` → **MOD-20 (frozen)**
- `Wissensbasis.tsx` → **MOD-14 (frozen)**

Diese koennen erst bearbeitet werden, wenn du explizit `UNFREEZE MOD-10`, `UNFREEZE MOD-20`, `UNFREEZE MOD-14` sagst. Der CSS-Patch (A-C) wirkt trotzdem sofort auf 95% der UI.

---

## Zusammenfassung

| Datei | Aenderung |
|---|---|
| `src/index.css` | 6 Zeilen-Aenderungen: Atmosphere Layer 5, 3× Dark Glass/Sidebar, ambient-horizon, ring |

Keine Backend-Aenderungen. Keine neuen Dateien. Reine CSS-Korrektur.

