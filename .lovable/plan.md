

# Fullscreen Slide Presentation Viewer

## Ziel

Beim Klick auf die Media-Widgets in MOD-08 (Suche) und MOD-09 (Beratung) oeffnet sich ein rahmenloses Fullscreen-Overlay mit einer Slideshow. Jedes der 4 Widgets startet seine eigene Praesentation mit vordefinierten Slides im CI-Design.

## Architektur

```text
MediaWidget (Klick)
      |
      v
SlideshowViewer (Fullscreen-Overlay)
      |
      +-- Slide 1..N (1920x1080 skaliert)
      |
      +-- Navigation (Pfeiltasten / Klick / Swipe)
      |
      +-- ESC / X zum Schliessen
```

## Slide-Rendering (1920x1080 Skalierung)

Alle Slides werden intern bei 1920x1080px gerendert und per CSS-Transform auf die aktuelle Viewport-Groesse skaliert. Dadurch sehen sie auf jedem Bildschirm identisch aus — wie eine echte Praesentation.

```text
Container (100vw x 100vh, schwarz)
  |
  Slide-Wrapper (1920x1080, zentriert)
    transform: scale(min(vw/1920, vh/1080))
    transform-origin: center center
```

## Slide-Inhalte (4 Praesentationen)

### Praesentation 1: Verkaufspraesentation (5 Slides)
1. Titelfolie: "System of a Town — Investment-Strategie" mit Logo und Untertitel
2. Das Problem: Warum klassische Geldanlage nicht reicht (3 Pain Points)
3. Die Loesung: Investment Engine — EK + zVE = optimiertes Ergebnis
4. So funktioniert's: 3-Schritte-Flow (Eingabe, Simulation, Beratung)
5. CTA: "Starten Sie jetzt Ihre Simulation"

### Praesentation 2: Rendite erklaert (4 Slides)
1. Titelfolie: "Rendite mit Immobilien"
2. Vergleich: Tagesgeld vs. Immobilie (Balkendiagramm-Darstellung)
3. Hebel-Effekt: Fremdkapital als Rendite-Turbo
4. Zusammenfassung mit Beispielrechnung

### Praesentation 3: Steuervorteil (4 Slides)
1. Titelfolie: "Steueroptimierung mit Immobilien"
2. AfA und Werbungskosten erklaert
3. Vorher/Nachher: Steuerlast mit und ohne Immobilie
4. CTA: "Berechnen Sie Ihren persoenlichen Vorteil"

### Praesentation 4: Verwaltung / Software (4 Slides)
1. Titelfolie: "Ihre Immobilien — digital verwaltet"
2. Feature-Ueberblick: Portfolio, DMS, Mieter, Buchhaltung
3. Screenshot-Mockup: Dashboard-Ansicht
4. CTA: "Jetzt kostenlos testen"

## Slide-Design (CI-konform)

Jede Slide nutzt das SoT-CI:
- Dunkler Hintergrund (bg-background/bg-surface-2) mit Primary-Akzenten
- Grosse Typografie (text-4xl bis text-7xl im 1920x1080 Raum)
- Primary-Glow-Elemente und Gradient-Akzente
- Minimalistische Icons aus Lucide
- Kein Branding-Ueberfluss, Clean-Look

## Fullscreen-Viewer Features

- **Oeffnung**: Overlay ueber dem Portal (fixed inset-0, z-50, schwarzer Hintergrund)
- **Navigation**: Links/Rechts-Pfeile am Rand, Tastatur (Pfeiltasten, Space, ESC)
- **Slide-Indikator**: Kleine Dots am unteren Rand (aktueller Slide hervorgehoben)
- **Schliessen**: ESC-Taste oder X-Button oben rechts
- **Keine Browser-Fullscreen-API**: Das Overlay selbst ist der "Fullscreen" — kein requestFullscreen(), da das im iframe-Kontext problematisch ist

## Technische Umsetzung

### Neue Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/components/shared/slideshow/SlideshowViewer.tsx` | Fullscreen-Overlay mit Navigation, Skalierung, Keyboard-Events |
| `src/components/shared/slideshow/ScaledSlide.tsx` | 1920x1080 Wrapper mit auto-scale |
| `src/components/shared/slideshow/slides/VerkaufspraesSlides.tsx` | 5 Slides fuer Verkaufspraesentation |
| `src/components/shared/slideshow/slides/RenditeSlides.tsx` | 4 Slides fuer Rendite-Erklaerung |
| `src/components/shared/slideshow/slides/SteuervorteilSlides.tsx` | 4 Slides fuer Steuervorteil |
| `src/components/shared/slideshow/slides/VerwaltungSlides.tsx` | 4 Slides fuer Software/Verwaltung |
| `src/components/shared/slideshow/slideData.ts` | Mapping: Widget-Type zu Slide-Set |

### Geaenderte Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/shared/MediaWidgetGrid.tsx` | State fuer aktive Praesentation, SlideshowViewer einbinden |
| `src/components/shared/MediaWidget.tsx` | Keine Aenderung noetig (onClick wird bereits durchgereicht) |

### Ablauf

1. User klickt auf ein MediaWidget (z.B. "Verkaufspraesentation")
2. `MediaWidgetGrid` setzt `activePresentation = 'verkaufspraesentation'`
3. `SlideshowViewer` oeffnet sich als fixed Overlay mit den zugehoerigen Slides
4. User navigiert mit Pfeiltasten oder Klick
5. ESC oder X schliesst den Viewer, `activePresentation = null`

## Keine DB-Migration noetig

Alle Slide-Inhalte sind fest im Code hinterlegt. Keine Datenbank-Aenderungen erforderlich.

