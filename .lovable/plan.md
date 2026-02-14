
# Website Builder Redesign — Von "leer" zu "sofort nutzbar"

## Problem

Die aktuelle Dashboard-Seite zeigt beim Aufruf nur eine Demo-Kachel ("Muster GmbH") und ein "+"-Feld. Es fehlt jede visuelle Orientierung:
- Kein Screenshot oder Live-Preview der Demo-Website
- Kein gefuehrter Prozess (was sind die Schritte?)
- Die 5 Design-Templates werden erst sichtbar, wenn man "+Neue Website" klickt
- Der eigentliche Editor (Split-View mit Drag-and-Drop Sections + Live-Preview) ist hinter zwei Klicks versteckt
- Die Demo-Ansicht zeigt nur Formularfelder, nicht die fertige Website

## Loesung: Dashboard als visuelles Prozess-Tool

Das Dashboard wird so umgebaut, dass man **sofort** versteht, was der Website Builder kann, und **sofort** loslegen kann.

### Neues Layout (Top-to-Bottom)

```text
┌──────────────────────────────────────────────┐
│  ModulePageHeader: "Website Builder"         │
│  "Erstellen Sie Ihre Unternehmenswebsite"    │
├──────────────────────────────────────────────┤
│  TEMPLATE-GALERIE (5 Karten mit Vorschau)    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ...       │
│  │ Modern │ │Klassik │ │Minimal │            │
│  │[Vorsch]│ │[Vorsch]│ │[Vorsch]│            │
│  │"Waehle"│ │        │ │        │            │
│  └────────┘ └────────┘ └────────┘            │
├──────────────────────────────────────────────┤
│  MEINE WEBSITES (WidgetGrid)                 │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐      │
│  │ Demo     │ │ Meine    │ │ + Neue  │      │
│  │ [thumb]  │ │ [thumb]  │ │ Website │      │
│  │ "Modern" │ │ "Entwurf"│ │         │      │
│  └──────────┘ └──────────┘ └─────────┘      │
├──────────────────────────────────────────────┤
│  INLINE-DETAIL (bei Klick auf Kachel)        │
│  3-Schritte Prozessleiste:                   │
│  [1. Design] → [2. Inhalte] → [3. Online]   │
│  + Eingebettete Live-Preview der Website     │
└──────────────────────────────────────────────┘
```

---

## Detailplan

### 1. Template-Galerie als Einstieg

Oben auf dem Dashboard erscheint eine **visuelle Template-Galerie** mit den 5 bestehenden Templates. Jede Karte zeigt:
- Den Farbverlauf (preview_gradient) als grosses visuelles Element
- Template-Name und Kurzbeschreibung
- Eine stilisierte Mini-Vorschau (Hero + 2 Sections als Silhouette)
- Button "Mit diesem Template starten" → oeffnet direkt das Erstellungsformular mit vorausgewaehltem Template

### 2. Website-Kacheln mit Thumbnail-Preview

Die bestehenden WidgetCells fuer Demo und echte Websites werden erweitert:
- Statt nur Text zeigen sie eine **Mini-Vorschau** der Website (die SectionRenderer-Komponente existiert bereits — sie wird in einem kleinen Container mit `transform: scale()` eingebettet)
- Status-Badge (Demo/Entwurf/Online) bleibt
- Klick oeffnet den Inline-Detail-Bereich darunter

### 3. Inline-Detail mit Prozessleiste

Wenn eine Website ausgewaehlt wird, erscheint darunter ein **3-Schritte-Prozess**:

**Schritt 1: Design und Grunddaten**
- Template-Auswahl (bereits implementiert)
- Primaerfarbe, Schriftart, Logo (bereits implementiert)
- Firmenname, Branche, Zielgruppe (bereits implementiert)

**Schritt 2: Inhalte bearbeiten**
- **Direkt eingebetteter Section-Editor** (aktuell nur im separaten Editor erreichbar)
- KI-Generierung Button prominent platziert ("Website mit KI fuellen")
- Sections hinzufuegen/sortieren/bearbeiten
- **Live-Preview** daneben (Split-View wie im bestehenden Editor)

**Schritt 3: Veroeffentlichen**
- SEO-Einstellungen (bereits implementiert)
- Hosting-Vertrag (bereits implementiert)
- Veroeffentlichen-Button
- Versionshistorie

Die Navigation zwischen den Schritten erfolgt ueber eine **horizontale Prozessleiste** (kein Tab-System, sondern ein visueller Fortschritts-Indikator).

### 4. Demo-Website mit echten Inhalten

Die Demo-Kachel "Muster GmbH" wird so erweitert, dass sie **echte Demo-Sections** zeigt:
- Hero mit Beispiel-Headline und Hintergrundbild
- Features mit 3 Beispiel-Eintraegen
- About-Section mit Beispieltext
- Contact-Section
- Footer

Diese Demo-Sections werden als statische Daten im Frontend gehalten (wie die bestehende DEMO_WEBSITE Konstante) und via SectionRenderer dargestellt.

---

## Technische Umsetzung

### Dateien die geaendert werden:

| Datei | Aenderung |
|---|---|
| `WBDashboard.tsx` | Komplett-Redesign: Template-Galerie, Thumbnail-Preview, 3-Schritte-Prozess |
| `WBEditor.tsx` | Wird als **eingebettete Komponente** refactored, damit der Editor auch inline im Dashboard nutzbar ist (nicht nur als separate Route) |

### Dateien die neu erstellt werden:

| Datei | Zweck |
|---|---|
| `WebsiteThumbnail.tsx` | Wiederverwendbare Mini-Preview-Komponente (SectionRenderer in skaliertem Container) |
| `ProcessStepper.tsx` | Horizontale 3-Schritte-Prozessleiste (Design → Inhalte → Online) |
| `DemoSections.ts` | Statische Demo-Section-Daten fuer die Muster GmbH Vorschau |

### Bestehende Komponenten die wiederverwendet werden:

- `SectionRenderer` — Rendert Sections als Live-Preview
- `DesignSection` / `SeoSection` / `ContractSection` — Bleiben als Inline-Formulare
- `SortableSectionCard` + `ItemsArrayEditor` — Werden in den Inline-Editor integriert
- `DESIGN_TEMPLATES` — Werden fuer die Template-Galerie genutzt

### Keine DB-Aenderungen noetig

Alle Tabellen (`tenant_websites`, `website_pages`, `website_sections`, `hosting_contracts`) existieren bereits und sind funktional. Die Aenderungen sind rein UI/UX.

---

## Was sich verbessert

| Vorher | Nachher |
|---|---|
| Leere Seite mit einer Demo-Kachel | Visuelle Template-Galerie als Einstieg |
| Demo zeigt nur Formularfelder | Demo zeigt fertige Website-Vorschau |
| Editor hinter 2 Klicks versteckt | Editor inline im Dashboard integriert |
| Kein erkennbarer Prozess | 3-Schritte-Prozessleiste (Design → Inhalte → Online) |
| Keine Template-Vorschau | 5 Templates mit Farbverlauf und Beschreibung prominent sichtbar |
| Website-Kacheln nur Text | Website-Kacheln mit Mini-Preview |

## Implementierungsreihenfolge

1. `DemoSections.ts` erstellen (statische Daten)
2. `WebsiteThumbnail.tsx` erstellen (skalierte Mini-Preview)
3. `ProcessStepper.tsx` erstellen (3-Schritte-Leiste)
4. `WBDashboard.tsx` redesignen (Template-Galerie + Thumbnails + Prozess-Integration)
5. Editor-Logik aus `WBEditor.tsx` als einbettbare Komponente extrahieren
