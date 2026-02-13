
# Objektakte CI-Verfeinerung: Farben, Ausrichtung und Schnellanalyse

## Probleme (aus Code-Analyse)

### 1. Schnellanalyse zu schmal — muss volle Breite haben
Die "Schnellanalyse"-Karte steckt aktuell INNERHALB der `DESIGN.FORM_GRID.FULL` (2-Spalten-Grid), also in einer Haelfte. Sie muss ueber die gesamte Breite (oberhalb des 2-Spalten-Grids) stehen, damit Bestand und Aufteiler auf gleicher Hoehe beginnen.

### 2. Kachel-Ausrichtung: Aufteiler startet zu hoch
Bestand hat eine "Schnellanalyse"-Karte VOR den Slidern, Aufteiler nicht. Wenn die Schnellanalyse nach oben (volle Breite) gezogen wird, starten beide Kalkulationen auf gleicher Hoehe.

### 3. Farben nicht CI-konform
Folgende Hardcoded-Farben verletzen das Design-Manifest:
- `text-green-600` → muss `text-status-success` bzw. `text-emerald-500` (Dark-Mode-sicher) werden
- `text-blue-600` → muss `text-primary` werden
- `text-amber-600` → muss `text-status-warn` werden
- `bg-green-50/50` → muss `bg-status-success/5` oder `bg-emerald-500/5` werden (Dark-Mode!)
- `bg-gradient-to-r from-primary/10 to-green-500/10` → muss `bg-primary/5 border-primary/20` (INFO_BANNER.PREMIUM) werden
- `bg-primary/5 border-primary/20` (Schnellanalyse) → OK, aber muss `DESIGN.INFO_BANNER.PREMIUM` Token nutzen
- `bg-amber-50 border-amber-200` (Hinweis-Banner in Aufteiler) → muss `DESIGN.INFO_BANNER.WARNING` werden

### 4. Cards ohne CI-Basis-Klasse
Die Karten in BestandCalculation und AufteilerCalculation nutzen nacktes `<Card>` ohne `className={DESIGN.CARD.BASE}`. Dadurch fehlt `glass-card`, `rounded-xl` und `overflow-hidden`.

### 5. Typografie ad-hoc
- `text-3xl font-bold` fuer KPI-Werte → sollte `DESIGN.TYPOGRAPHY.VALUE` oder aehnliches Token nutzen
- `text-lg`, `text-xl font-bold` fuer Card-Ueberschriften → `DESIGN.TYPOGRAPHY.CARD_TITLE`
- `text-xs text-muted-foreground` → `DESIGN.TYPOGRAPHY.HINT`

## Loesung

### Datei 1: `ObjekteingangDetail.tsx`

**ROW 4 umstrukturieren:**
- Schnellanalyse-Karte aus den Kinder-Komponenten herausnehmen und als eigene volle Breite ueber dem 2-Spalten-Grid rendern
- Neue gemeinsame "Schnellanalyse"-Karte mit den 4 KPIs: Gesamtinvestition, Max. Finanzierbarkeit, EK-Bedarf, Bruttorendite (aus Bestand) PLUS Gewinn, Marge, ROI (aus Aufteiler) → 7 KPIs in einer Zeile oder 2 Zeilen
- Alternativ (einfacher): Schnellanalyse als `prop` in BestandCalculation deaktivierbar machen (`showQuickAnalysis={false}`) und eine eigene Sektion darueber rendern

**Gewaehlter Ansatz (minimal-invasiv):**
- In `ObjekteingangDetail.tsx`: Eine eigene volle-Breite Schnellanalyse-Card vor dem FORM_GRID rendern mit den wichtigsten KPIs beider Szenarien
- In `BestandCalculation.tsx`: Schnellanalyse-Card entfernen (oder ueber `hideQuickAnalysis` Prop steuern)
- So starten beide Kalkulationen auf gleicher Hoehe

### Datei 2: `BestandCalculation.tsx`

- Neue Prop `hideQuickAnalysis?: boolean` — wenn true, wird die Schnellanalyse-Karte nicht gerendert
- Alle `text-green-600` → `text-emerald-500`
- Alle `text-blue-600` → `text-primary`
- Alle `text-amber-600` → `text-amber-500`
- Schnellanalyse-Card: `bg-primary/5 border-primary/20` → `DESIGN.INFO_BANNER.PREMIUM`
- Gradient-KPI-Card: `bg-gradient-to-r from-primary/10 to-green-500/10 border-primary/20` → `className={DESIGN.INFO_BANNER.PREMIUM}`
- Alle nackten `<Card>` → `<Card className={DESIGN.CARD.BASE}>`
- CardTitle: `text-lg` → `DESIGN.TYPOGRAPHY.CARD_TITLE`
- KPI-Werte: `text-3xl font-bold` → `text-2xl font-bold` (DESIGN.TYPOGRAPHY.VALUE)
- Labels: `text-xs text-muted-foreground` → `DESIGN.TYPOGRAPHY.HINT`
- `text-sm text-muted-foreground` → `DESIGN.TYPOGRAPHY.MUTED`
- Import DESIGN Token

### Datei 3: `AufteilerCalculation.tsx`

- Gleiche Farb-Korrekturen wie Bestand
- `text-green-600` → `text-emerald-500`
- `text-destructive` bleibt (ist bereits ein Token)
- `text-amber-600` → `text-amber-500`
- Result-Card: `border-green-500 bg-green-50/50` → `border-emerald-500/50 bg-emerald-500/5` (Dark-Mode-safe)
- Result-Card negativ: `border-destructive bg-destructive/5` → bleibt (schon korrekt)
- Hinweis-Banner: `bg-amber-50 border-amber-200` → `DESIGN.INFO_BANNER.WARNING`
- Alle nackten `<Card>` → `<Card className={DESIGN.CARD.BASE}>`
- Typography-Tokens anpassen wie bei Bestand
- Import DESIGN Token

### Datei 4: Keine weiteren Dateien betroffen

## Ergebnis

- Schnellanalyse ueber volle Breite → Bestand und Aufteiler starten auf gleicher Hoehe
- Alle Farben Dark-Mode-sicher ueber CI-Tokens
- Alle Cards mit `glass-card` Basis-Klasse
- Einheitliche Typografie ueber DESIGN-Manifest
- Kein visueller Versatz zwischen den beiden Kalkulationsspalten
