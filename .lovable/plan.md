
# SoT Website Ueberarbeitung: Schrift, Headline, Hintergrund & Light Mode

## 1. Header-Schriftzug: Grossbuchstaben wie Zone 2

**Problem:** Die Zone 2 SystemBar zeigt "SYSTEM OF A TOWN" in `tracking-[0.2em] font-semibold text-sm` -- weit gesperrt, markant. Die SoT-Website zeigt dagegen `text-sm font-bold tracking-widest uppercase` -- aehnlich, aber weniger praegnant und kein visueller Unterschied zum Rest.

**Loesung:** Der Website-Header bekommt den gleichen "grossen Buchstaben"-Stil wie Zone 2:
- Schriftgroesse erhoehen auf `text-base` oder `text-lg`
- Letter-spacing auf `tracking-[0.25em]` (noch weiter gesperrt)
- `font-semibold` statt `font-bold` fuer den eleganteren Look
- Optional: leichter Gradient-Effekt auf dem Text (frosted)

**Datei:** `src/pages/zone3/sot/SotLayout.tsx` (Zeilen 42-52)

---

## 2. Hero-Headline: Mehr Inhalt und Impact

**Problem:** Die Headline zeigt nur "System of a Town" als Titel plus "Der digitale Manager fuer Immobilien und private Finanzen." als H2 -- das ist fuer eine Premium-Landingpage zu wenig. Es fehlt ein Pitch, eine emotionale Ansprache.

**Loesung:** Die Hero-Section in `SotHome.tsx` wird erweitert:
- Tagline oben bleibt ("KI-gestuetzte Plattform...")
- **H1 wird zum Pitch**: "Ihr gesamtes Vermoegen. Eine Plattform." (oder aehnlich stark)
- **H2 als beschreibender Satz**: "Immobilien, Finanzen, Energie, Dokumente und KI-Assistenz -- alles zentral verwaltet, analysiert und automatisiert."
- Darunter eine kompakte Feature-Zeile mit Icons: Immobilien | Finanzen | Energie | Dokumente | KI
- Die Wortmarke "System of a Town" wandert in den Sub-Bereich oder bleibt dezent

**Datei:** `src/pages/zone3/sot/SotHome.tsx` (Zeilen 98-141)

---

## 3. Dark Mode Hintergrund: Nordlicht-Aesthetik

**Problem:** Der aktuelle Dark-Mode-Hintergrund ist fast schwarz (`hsl(222 70% 4%)`) mit nur minimalen Blau-Verlaeufen und winzigen Sternenpunkten. Wirkt kalt, leer und unfreundlich.

**Loesung:** Mehrstufiger Hintergrund mit Aurora-Borealis-Effekt:

### 3a. Basis-Atmosphaere (sot-premium.css)
Die `.sot-atmosphere` Dark-Variante bekommt zusaetzliche Farbschichten:
- Lila-Nebel oben rechts: `hsl(275 60% 25% / 0.3)`
- Rose/Magenta-Glow unten links: `hsl(340 50% 20% / 0.2)`
- Tuerkis-Akzent mittig: `hsl(180 60% 20% / 0.15)`
- Base wird etwas heller: `hsl(222 50% 8%)` statt `hsl(222 70% 4%)`

### 3b. Hintergrund in SotHome.tsx
Die festen Hintergrund-Effekte (Zeilen 76-95) werden erweitert:
- Groessere, farbigere Glow-Orbs (Lila, Rose, Tuerkis)
- Sanfter Nordlicht-Verlauf am oberen Bildschirmrand
- Mehr Sterne mit leichter Groessenvariation
- Subtile animierte Bewegung (CSS keyframes fuer langsames Pulsieren)

### 3c. CSS-Variablen (zone3-theme.css)
Dark-Mode Basis-Hintergrund aufhellen:
- `--z3-background: 222 40% 8%` (von 6% auf 8%)
- `--z3-card: 222 25% 12%` (von 10% auf 12%)
- `--z3-muted: 222 20% 18%` (von 16% auf 18%)

**Dateien:** `src/styles/sot-premium.css`, `src/pages/zone3/sot/SotHome.tsx`, `src/styles/zone3-theme.css`

---

## 4. Light Mode reparieren

**Problem:** Der Light Mode funktioniert ueberhaupt nicht. Beim Klick auf den Theme-Toggle passiert visuell nichts -- alles bleibt dunkel.

**Ursache:** Zwei zusammenwirkende Probleme:

1. **SotLayout.tsx nutzt falsche CSS-Variablen:** Das Layout verwendet `bg-background text-foreground` (shadcn/Tailwind-Variablen), aber die SoT-Theme-Klassen (`theme-sot`, `theme-sot-dark`) setzen nur `--z3-*` Variablen. Die standard `--background`/`--foreground` Variablen werden nie umgeschaltet.

2. **SotHome.tsx nutzt ebenfalls shadcn-Variablen:** Alle Tailwind-Klassen wie `bg-card/50`, `text-foreground`, `text-muted-foreground`, `border-border/30` referenzieren die Standard-Variablen, nicht die `z3-*` Variablen. Der Dark Mode funktioniert zufaellig, weil die App global auf Dark steht.

**Loesung:**

### 4a. SotLayout.tsx: Theme-Klasse korrekt anwenden
- `bg-background` ersetzen durch inline `style={{ backgroundColor: 'hsl(var(--z3-background))' }}`
- Oder: Die `theme-sot`/`theme-sot-dark` Klassen muessen auch die Standard-Variablen (`--background`, `--foreground`, etc.) setzen

### 4b. Elegantere Loesung: CSS-Variablen-Bridge in zone3-theme.css
In den `.theme-sot` und `.theme-sot-dark` Bloecken die Standard-Variablen mappen:

```css
.theme-sot {
  --background: var(--z3-background);
  --foreground: var(--z3-foreground);
  --card: var(--z3-card);
  --muted: var(--z3-muted);
  --muted-foreground: var(--z3-muted-foreground);
  --border: var(--z3-border);
  --primary: var(--z3-primary);
  --primary-foreground: var(--z3-primary-foreground);
  /* etc. */
}
```

So funktionieren sowohl die `z3-*` Klassen als auch die Standard-Tailwind-Klassen korrekt.

### 4c. Light-Mode-spezifisches Styling in SotHome.tsx
- Hintergrund-Glows im Light Mode: sanfte Pastelltoene statt dunkle Nebel
- Cards bekommen sichtbare Schatten statt nur Border
- Sterne-Overlay wird im Light Mode ausgeblendet (`dark:opacity-100 opacity-0`)

**Dateien:** `src/styles/zone3-theme.css`, `src/pages/zone3/sot/SotLayout.tsx`, `src/pages/zone3/sot/SotHome.tsx`

---

## Zusammenfassung der Datei-Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/pages/zone3/sot/SotLayout.tsx` | Header-Schriftzug vergroessern + Light/Dark Theme-Bridge |
| `src/pages/zone3/sot/SotHome.tsx` | Hero-Content erweitern, Hintergrund-Effekte aufwerten, Light-Mode-Anpassungen |
| `src/styles/zone3-theme.css` | CSS-Variablen-Bridge (z3 -> Standard), Dark-Mode-Farben aufhellen |
| `src/styles/sot-premium.css` | Dark-Atmosphaere mit Nordlicht-Farben, Aurora-Keyframes |
