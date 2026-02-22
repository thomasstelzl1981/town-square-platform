

## Kaufy Website Redesign — Visuelle Konsistenz aller Unterseiten

### Analyse: Was ist das Problem?

Die Startseite hat ein hochwertiges Design:
- Vollbreites Hero-Bild mit Overlay-Text und abgerundeten Ecken
- Floating Search Bar
- Elegant gestaltete Sektionen (Perspektiven-Karten, Akkordeon, Zahlen)
- Professionelle Farbpalette: dunkles hsl(220,20%,10%), Akzent hsl(210,80%,55%)

Die Unterseiten dagegen:
- **Vermieter**: Nur Text-Hero, kein Bild, generische Feature-Cards
- **Verkaeufer**: Text-Hero, lange Wizard-Sektion dominiert
- **Partner**: Text-Hero, zwei Karten, wenig visueller Reiz
- **Impressum/Datenschutz**: Text kaum lesbar (zu heller Kontrast), kein Hero

### Design-Konzept

Jede Unterseite bekommt das gleiche visuelle Muster wie die Startseite:

```text
+------------------------------------------+
|  Hero-Bild (50vh) mit Overlay-Text       |
|  Badge + Headline + Subline + CTA        |
+------------------------------------------+
|                                          |
|  Feature-Bereich (Cards / Akkordeon)     |
|                                          |
+------------------------------------------+
|  Highlight-Sektion (grauer Hintergrund)  |
|  Vorteile / Zahlen / Social Proof        |
+------------------------------------------+
|  CTA-Sektion                             |
+------------------------------------------+
```

### Schriftart

Die hochgeladene Manrope-Variable-Font wird als Referenz betrachtet, aber nicht zwingend uebernommen. Die Startseite nutzt das Standard-Tailwind-Fontstack (Inter/system). Um Konsistenz zu wahren, wird **Inter** (bereits im Projekt) als primaere Schriftart beibehalten, da die Startseite bereits darauf basiert. Falls gewuenscht, kann Manrope spaeter als Upgrade fuer alle Seiten gleichzeitig eingefuehrt werden.

### Aenderungen im Detail

---

**1. Hero-Bilder generieren (4 Stueck)**

Fuer jede Unterseite wird ein KI-generiertes Hero-Bild erstellt:

| Seite | Motiv | Datei |
|-------|-------|-------|
| Vermieter | Modernes Mehrfamilienhaus, Innenhof, warmes Licht | `src/assets/kaufy2026/vermieter-hero.jpg` (existiert, wird geprueft/ersetzt) |
| Verkaeufer | Luftaufnahme Neubauprojekt, Baugeruest, Drohnenoptik | `src/assets/kaufy2026/verkaeufer-hero.jpg` |
| Partner | Business-Meeting, Handschlag, modernes Buero | `src/assets/kaufy2026/partner-hero.jpg` |
| Impressum/Datenschutz | Gemeinsames minimalistisches Bild: Architekturdetail | Kein Hero — stattdessen gestylter Text-Header |

Alle Bilder: 1400x620px, leicht entsaettigt (grayscale(20%) brightness(0.6)), passend zum Startseiten-Stil.

---

**2. Kaufy2026Vermieter.tsx — Redesign**

Aktuell: Einfacher Text-Hero + generische Feature-Cards + Vorteile-Liste

Neu:
- Hero-Sektion: Vollbreites Bild (calc(100% - 120px), 620px Hoehe, border-radius: 20px) mit Overlay
- Badge "Fuer Vermieter" + Headline + Subline + CTA-Button (weiss auf dunklem Bild)
- Feature-Cards: Behalten den Aufbau, bekommen aber Box-Shadow wie auf der Startseite (0 4px 20px rgba(0,0,0,0.12))
- Vorteile-Sektion: Visuell aufgewertet mit Icons und besserem Spacing
- Abschluss-CTA: Dunkler Hintergrund-Block (wie ZahlenSektion)

---

**3. Kaufy2026Verkaeufer.tsx — Redesign**

Aktuell: Text-Hero + Features + How-it-works + Demo-Projekt + Wizard

Neu:
- Hero-Sektion: Vollbreites Bild mit Overlay (gleicher Stil wie Startseite)
- Features + How-it-works: Beibehalten, aber visuell mit mehr Tiefe (Shadows, Spacing)
- Demo-Projekt: Behaelt den interaktiven Charakter
- Wizard (Magic Intake): Bleibt funktional unveraendert

---

**4. Kaufy2026Vertrieb.tsx — Redesign**

Aktuell: Text-Hero + Zwei Track-Cards + Features + Formular

Neu:
- Hero-Sektion: Vollbreites Bild mit Overlay
- Track-Cards: Behalten die Zweispalten-Struktur, bekommen aber bessere Shadows und Hover-Effekte
- Features: Konsistenter Card-Stil
- Formular: Visuell eingerahmt, bleibt funktional identisch

---

**5. Zone3LegalPage.tsx — Lesbarkeitfix**

Problem: Text ist extrem blass/kaum lesbar.

Fix:
- Sicherstellen, dass `prose` Klassen korrekte Farben haben fuer den Light-Mode-Kontext
- Explizite Textfarben setzen: `text-[hsl(220,20%,10%)]` fuer Ueberschrift, `text-[hsl(220,20%,25%)]` fuer Body-Text
- Entfernen von `dark:prose-invert` (Zone 3 ist immer Light-Mode)
- Optional: kleinen Text-Hero-Header mit Badge + Seitentitel

---

**6. Gemeinsame Hero-Komponente: KaufySubpageHero**

Um Code-Duplizierung zu vermeiden, wird eine wiederverwendbare Hero-Komponente erstellt:

```text
Datei: src/components/zone3/kaufy2026/KaufySubpageHero.tsx

Props:
- backgroundImage: string (importiertes Bild)
- badge: string ("Fuer Vermieter", "Fuer Partner", etc.)
- title: string
- subtitle: string
- ctaLabel: string
- ctaHref: string
- onCtaClick?: () => void
```

Stil: Identisch mit Kaufy2026Hero — gleiche Dimensionen, gleiche Filter, gleiche Overlay-Position.

---

### Zusammenfassung der Dateien

| Datei | Aktion |
|-------|--------|
| `src/components/zone3/kaufy2026/KaufySubpageHero.tsx` | Neu — Shared Hero-Komponente |
| `src/pages/zone3/kaufy2026/Kaufy2026Vermieter.tsx` | Redesign — Hero-Bild + visuelles Upgrade |
| `src/pages/zone3/kaufy2026/Kaufy2026Verkaeufer.tsx` | Redesign — Hero-Bild + visuelles Upgrade |
| `src/pages/zone3/kaufy2026/Kaufy2026Vertrieb.tsx` | Redesign — Hero-Bild + visuelles Upgrade |
| `src/components/zone3/shared/Zone3LegalPage.tsx` | Fix — Textfarben, prose-Klassen |
| `src/assets/kaufy2026/vermieter-hero.jpg` | Pruefen/ersetzen (existiert bereits) |
| `src/assets/kaufy2026/verkaeufer-hero.jpg` | Neu — KI-generiertes Bild |
| `src/assets/kaufy2026/partner-hero.jpg` | Neu — KI-generiertes Bild |
| `src/components/zone3/kaufy2026/index.ts` | Update — Export der neuen Komponente |

### Was NICHT geaendert wird

- Startseite (Kaufy2026Home) — ist der Design-Standard
- Kaufy2026Layout — Header/Footer sind bereits konsistent
- Engine-Logik, Datenbank, Demo-Daten
- Funktionale Logik der Wizard-/Formular-Bereiche

