

# Bewertung: Status-Farben Light/Dark differenzieren

Dieser Patch behebt exakt **Pain Point #3** aus dem Audit: Status-Farben sind aktuell identisch in Light und Dark Mode.

## Was die Änderungen bewirken

**Light Mode** — Sättigung und Helligkeit werden **reduziert**:
- Weniger grell auf weissem/hellem Background
- Bessere Lesbarkeit von Status-Badges und Dots
- Success: 71%/45% → 45%/38% (ruhiger, weniger neon)
- Warn: 92%/50% → 85%/45% (weniger blendend)
- Error: 84%/60% → 75%/52% (kräftig aber nicht aggressiv)
- Info: 89%/48% → 80%/42% (weniger grell)

**Dark Mode** — Sättigung leicht reduziert, Helligkeit **angehoben**:
- Besserer Kontrast auf dunklem Background
- Success: 71%/45% → 55%/45% (gleiche Helligkeit, weniger neon)
- Warn: 92%/50% → 80%/52% (etwas heller, weniger gesättigt)
- Error: 84%/60% → 70%/56% (etwas gedämpft)
- Info: 89%/48% → 75%/50% (etwas heller)

## Betroffene Komponenten (keine Code-Änderungen nötig)

Alle nutzen `hsl(var(--status-*))` via Tailwind — greifen automatisch die neuen Werte:
- `StatusBadge` / `StatusDot` (src/components/shared/StatusBadge.tsx)
- `StatusIndicator` (src/components/immobilienakte/)
- KPI-Cards, Dashboard-Widgets, Tabellen-Badges

## Umsetzung

8 Zeilen in `src/index.css` ändern — 4 in `:root`, 4 in `.dark`. Keine weiteren Dateien betroffen.

