

# Premium Polish: Overlay/Scrim + Modal Surface

Guter Vorschlag — die Tokens machen Overlays konsistent steuerbar, statt hardcoded `bg-black/60` in jeder Komponente. Aktuell hat Dialog `bg-black/60`, Popover/Dropdown nutzen `bg-popover/80` — das wird jetzt vereinheitlicht.

## Umsetzung (4 Dateien)

### 1. `src/index.css` — Overlay-Tokens einfügen

**Light (`:root`):**
```css
--overlay-scrim: 222 84% 4.9% / 0.35;
--overlay-surface: 0 0% 100% / 0.96;
```

**Dark (`.dark`):**
```css
--overlay-scrim: 222 47% 6% / 0.62;
--overlay-surface: 222 28% 14% / 0.92;
```

### 2. `src/components/ui/dialog.tsx`

**Overlay** (Zeile 23): `bg-black/60` → `bg-[hsl(var(--overlay-scrim))]` (behält `backdrop-blur-sm`)

**Content** (Zeile 38): `bg-background/90 backdrop-blur-lg` → `bg-[hsl(var(--overlay-surface))] backdrop-blur-lg border-border/40`

### 3. `src/components/ui/alert-dialog.tsx`

**Overlay** (Zeile 18): `bg-black/80` → `bg-[hsl(var(--overlay-scrim))]` + `backdrop-blur-sm`

**Content** (Zeile 33): `bg-background` → `bg-[hsl(var(--overlay-surface))] border-border/40`

### 4. `src/components/ui/dropdown-menu.tsx`

**Content** (Zeile 64) + **SubContent** (Zeile 47): `bg-popover/80` → `bg-[hsl(var(--overlay-surface))]` (behält `backdrop-blur-md`)

Popover (`popover.tsx`) nutzt `bg-popover` ohne Alpha — wird ebenfalls auf `bg-[hsl(var(--overlay-surface))]` umgestellt.

### Nicht betroffen
- Keine Modul-Dateien, keine Freeze-Konflikte
- Alle Änderungen in `src/components/ui/` (shared primitives)

