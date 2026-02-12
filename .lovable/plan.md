
# Reparaturplan: Kaufy Zone 3 Website

## Diagnose

Die Kaufy-Webseite hat mehrere schwerwiegende Design-Probleme. Anhand der Screenshots und der Browser-Analyse wurden folgende Fehler identifiziert:

### Problem 1: Hero-Bereich komplett kaputt
- Der Hero-Text ("Die KI-Plattform fuer Kapitalanlageimmobilien") ist fast unsichtbar
- Die Such-Karte schwebt NICHT innerhalb des Hero-Bildes, sondern wird darunter geschoben
- Der "Kostenlos registrieren"-Button erscheint als unstyled Button unterhalb des Bildes
- Das Hero-Bild hat keine abgerundeten Ecken und keinen Rand (60px Margin fehlt)

**Ursache:** Die `kaufy2026-hero-wrapper` CSS-Klasse hat `overflow: visible`, aber der uebergeordnete `kaufy2026-container` hat `overflow-x: clip`. Dies schneidet die absolute Positionierung der Overlay-Elemente ab. Zusaetzlich fehlt ein expliziter `z-index` auf dem Overlay, sodass das Bild die Text-Elemente ueberdeckt.

### Problem 2: Search-Bar Labels unsichtbar
- Die Labels "Einkommen (zvE)" und "Eigenkapital" sind kaum sichtbar
- Die Input-Felder zeigen native Browser-Spinner statt des Custom-Stylings

**Ursache:** Dark Mode (`defaultTheme: "dark"`) ist aktiv. Die Kaufy-Seite verwendet zwar hardcoded helle Farben, aber die shadcn/ui `<Input>`-Komponente nutzt CSS-Variablen (`bg-background`), die im Dark Mode dunkle Werte erhalten. Die Custom-CSS-Klasse `kaufy2026-inline-input` wird von den Dark-Mode-Overrides der globalen Stile ueberschrieben.

### Problem 3: Veraltete Links
- PerspektivenKarten-Links zeigen noch auf `/kaufy2026/vermieter` etc.
- Korrekt waere `/website/kaufy/vermieter` (ZBC Migration)

### Problem 4: Accordion Dark Mode
- Die Accordion-Komponente nutzt shadcn-UI-Defaults, die im Dark Mode falsche Farben zeigen

---

## Reparaturplan (3 Schritte)

### Schritt 1: Dark Mode fuer Zone 3 deaktivieren
Die Kaufy-Website ist eine Light-Mode-only Webseite. Der Layout-Wrapper muss die Dark-Mode-Klasse explizit ueberschreiben.

**Datei:** `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx`
- Dem aeusseren `<div>` die Klasse `light` hinzufuegen UND ein `data-theme="light"` Attribut setzen
- Alternativ: Die CSS-Variablen direkt im Container zuruecksetzen auf Light-Mode-Werte

### Schritt 2: Hero-CSS reparieren

**Datei:** `src/styles/zone3-theme.css`
- `kaufy2026-hero-overlay`: Expliziten `z-index: 2` hinzufuegen
- `kaufy2026-hero-image`: `z-index: 1` setzen, damit das Overlay darueber liegt
- `kaufy2026-search-card`: `z-index: 3` sicherstellen
- `kaufy2026-container`: `overflow-x` von `clip` auf `hidden` aendern, oder den Hero-Bereich aus dem Clip-Kontext herausnehmen

### Schritt 3: Veraltete Links korrigieren

**Datei:** `src/components/zone3/kaufy2026/PerspektivenKarten.tsx`
- `/kaufy2026/vermieter` zu `/website/kaufy/vermieter`
- `/kaufy2026/verkaeufer` zu `/website/kaufy/verkaeufer`
- `/kaufy2026/vertrieb` zu `/website/kaufy/vertrieb`

---

## Technische Details

### Dark-Mode-Fix (Schritt 1)
Der ThemeProvider setzt `defaultTheme="dark"`, was die `<html>`-Klasse `dark` hinzufuegt. Dies beeinflusst alle Tailwind-`dark:`-Varianten und CSS-Variablen. Die Kaufy-Seite muss in einem `className="light"` Container laufen, der die Light-Mode CSS-Variablen erzwingt:

```text
<div className="min-h-screen bg-[hsl(210,40%,97%)] light" style={lightModeVars}>
```

Dabei werden die CSS-Variablen (`--background`, `--foreground`, `--card`, etc.) explizit auf ihre Light-Mode-Werte gesetzt, damit alle shadcn/ui-Komponenten (Button, Input, Accordion) korrekt hell rendern.

### Hero Z-Index Reparatur (Schritt 2)
```text
.kaufy2026-hero-image    { z-index: 1; position: relative; }
.kaufy2026-hero-overlay  { z-index: 2; }
.kaufy2026-search-card   { z-index: 3; }
```

### Link-Migration (Schritt 3)
Einfaches Suchen-und-Ersetzen von `/kaufy2026/` zu `/website/kaufy/` in den Komponenten-Dateien.
