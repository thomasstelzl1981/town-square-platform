

# Bewertung: Table-Token für Header & Row-Hover

## Einschätzung: Sinnvoll und konsistent

Der Vorschlag folgt exakt dem Muster von `--input-bg` — zentraler Token statt verstreuter `bg-muted/30`. Gut.

**Ein Detail:** Der `DESIGN.TABLE` wird aktuell nur von 2 Komponenten direkt referenziert (`LoanCalculator`, `BankExamplesCard`), aber das Shadcn `table.tsx` nutzt eigene Klassen (`hover:bg-muted/50` für Row, kein Header-BG). Für maximalen Effekt sollte auch `table.tsx` umgestellt werden.

## Umsetzung (3 Dateien)

### 1. `src/index.css` — Tokens einfügen
```css
/* :root */
--table-header-bg: 210 20% 95%;
--table-row-hover: 210 20% 96%;

/* .dark */
--table-header-bg: 222 25% 14%;
--table-row-hover: 222 25% 12%;
```

### 2. `src/config/designManifest.ts` — DESIGN.TABLE umstellen
- `HEADER_BG`: `bg-muted/30` → `bg-[hsl(var(--table-header-bg))]`
- `ROW_HOVER`: `hover:bg-muted/30` → `hover:bg-[hsl(var(--table-row-hover))]`

### 3. `src/components/ui/table.tsx` — Shadcn-Basis anpassen
- `TableHeader`: Header-BG-Token hinzufügen
- `TableRow`: `hover:bg-muted/50` → `hover:bg-[hsl(var(--table-row-hover))]`

Rein kosmetisch, keine Logik betroffen. Alle Stellen, die `DESIGN.TABLE.HEADER_BG` oder `DESIGN.TABLE.ROW_HOVER` nutzen, erben automatisch.

