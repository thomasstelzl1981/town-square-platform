
# MOD-13 Landing Page Tab: Vollstaendiger Inline-Builder mit Demo-Widget

## Zusammenfassung

Der Landing Page Tab in MOD-13 wird grundlegend ueberarbeitet. Statt des aktuellen zerstueckelten Layouts (ProjectCard-Switcher oben, Builder/Preview getrennt) wird der Tab dem systemweiten Widget-Pattern folgen: **Demo-Widget (gruen, Position 0) + "Neue Website erstellen"-Widget** im WidgetGrid, darunter der vollstaendige Landing-Page-Inhalt inline aufgeklappt — komplett sichtbar von oben bis unten.

---

## Ist-Zustand (Probleme)

1. **Icons nicht in CI-Groesse**: Die Landing Page Tab-Karten nutzen ad-hoc Icon-Groessen (h-8, h-10) statt `HEADER.WIDGET_ICON_BOX` (h-9 w-9)
2. **Landing Page Builder fehlt visuell**: Es wird nur ein Erklaertext mit "Website erstellen"-Button gezeigt — kein voller Inhalt sichtbar
3. **Demo-Projekt zeigt keinen vorbefuellten Builder**: Im Demo-Modus passiert beim Klick nichts Sichtbares
4. **Kein Standard-Widget-Pattern**: Es fehlt das gruene Demo-Widget + Plus-Widget gemaess Golden Path Interaction Standard

---

## Soll-Zustand

```text
+-----------------------------------------------+
| ModulePageHeader: LANDING PAGE                 |
+-----------------------------------------------+
| WidgetGrid (2 Widgets):                        |
| +------------------+ +------------------+      |
| | DEMO (gruen)     | | + Neue Website   |      |
| | Residenz am      | |   erstellen      |      |
| | Stadtpark        | |                  |      |
| +------------------+ +------------------+      |
+-----------------------------------------------+
| Inline-Detail (volle Breite, scrollbar):       |
|                                                |
| Browser-Frame Preview mit:                     |
| - Superbar (Investment | Lage | Anbieter |     |
|   Legal)                                       |
| - Hero mit Projektdaten                        |
| - Preisliste mit allen 24 Einheiten            |
| - Klick auf Einheit -> Investment Engine       |
| - Publishing Section                           |
|                                                |
| Demo: Alles vorbefuellt mit Musterdaten        |
| Leer: Template-Struktur als Platzhalter        |
+-----------------------------------------------+
```

---

## Aenderung 1: LandingPageTab.tsx — Widget-Pattern einfuehren

Kompletter Umbau des Layouts:

- **WidgetGrid** mit 2 WidgetCells statt ProjectCard-Switcher
- **Widget 1 (Demo)**: Gruenes Demo-Widget mit `DESIGN.DEMO_WIDGET.CARD` Styling, zeigt "Residenz am Stadtpark" mit Demo-Badge, oben links gruenes Icon
- **Widget 2 (Neu)**: Gestrichelter Plus-Widget "Neue Website erstellen" (wie `ProjectCardPlaceholder`)
- Klick auf Demo-Widget: Zeigt die volle Landing Page Website inline darunter (State B mit Demo-Daten)
- Klick auf Neu-Widget: Oeffnet den URL-Dialog und startet den Generierungsprozess fuer ein echtes Projekt
- **Kein Tab-Switching mehr** zwischen Projekten — jedes Projekt hat seine eigene Kachel

---

## Aenderung 2: Demo-Widget zeigt vollen Inline-Content

Wenn das Demo-Widget ausgewaehlt ist (Standard beim Laden):

- Die komplette `LandingPageWebsite` wird inline darunter gerendert — **nicht eingeklappt**
- Alle 4 Tabs (Investment, Lage, Anbieter, Legal) sind navigierbar
- Die Preisliste zeigt alle 24 Demo-Einheiten
- Klick auf eine Einheit oeffnet den Investment-Engine-Expose (SSOT `InvestmentExposeView`)
- Browser-Frame-Chrome (URL-Bar, Traffic Lights) umgibt die Website
- Publishing-Section wird darunter angezeigt (im Demo-Modus mit Hinweis "Beispieldaten")

---

## Aenderung 3: Icon-Groessen CI-konform

In allen Landing-Page-Komponenten werden Icons auf die CI-Groessen angepasst:

| Stelle | Ist | Soll |
|--------|-----|------|
| LandingPageBuilder Sparkles-Icon | h-8 w-8 | h-5 w-5 in WIDGET_ICON_BOX (h-9 w-9) |
| LandingPageAnbieterTab Building2 | h-10 w-10 | h-5 w-5 in WIDGET_ICON_BOX |
| LandingPageProjektTab FactCard Icons | h-4 w-4 in p-2 | h-5 w-5 in WIDGET_ICON_BOX |
| LandingPageLegalTab CardTitle Icons | h-5 w-5 (ok) | Beibehalten |
| LandingPageWebsite Tab-Icons | h-4 w-4 (ok) | Beibehalten |

---

## Aenderung 4: Leeres Template fuer "Neue Website"

Wenn der Nutzer "Neue Website erstellen" klickt und kein Projekt ausgewaehlt hat:

- Zeige ein leeres Template mit Platzhaltern (graue Boxen, "Hier erscheint Ihr Projektname", etc.)
- Wenn ein echtes Projekt vorhanden: URL-Dialog oeffnen, dann Generierung starten
- Nach Generierung: Volle Website-Vorschau inline anzeigen (identisch zum Demo-Pattern)

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/projekte/LandingPageTab.tsx` | Komplett-Umbau: WidgetGrid mit Demo+Neu-Widget, Inline-Detail-Flow |
| `src/components/projekte/landing-page/LandingPageBuilder.tsx` | Icon-Groessen CI-konform anpassen |
| `src/components/projekte/landing-page/LandingPageAnbieterTab.tsx` | Building2 Icon auf CI-Groesse |
| `src/components/projekte/landing-page/LandingPageProjektTab.tsx` | FactCard Icons auf CI-Groesse |
| `src/components/projekte/landing-page/LandingPagePreview.tsx` | Keine strukturellen Aenderungen, wird weiterverwendet |
| `src/components/projekte/landing-page/LandingPageWebsite.tsx` | Keine Aenderungen |
| `src/components/projekte/landing-page/LandingPageUnitExpose.tsx` | Keine Aenderungen — nutzt bereits SSOT InvestmentExposeView |

**Keine DB-Migration noetig.**

---

## Technische Details

### Widget-Pattern (LandingPageTab.tsx)

```text
State-Machine:
- selectedId === DEMO_PROJECT_ID  -> zeige LandingPagePreview mit Demo-Daten (immer "existiert")
- selectedId === 'new'            -> zeige LandingPageBuilder (Generierung)
- selectedId === realProjectId    -> zeige Preview oder Builder je nach LP-Status
```

### Demo-Widget wird als "State B" (LP existiert) behandelt

Da das Demo-Projekt immer eine vorbefuellte Landing Page simulieren soll, wird fuer `isDemoProject` kein Builder gezeigt, sondern direkt die volle `LandingPagePreview` mit `LandingPageWebsite` — alle Tabs, alle Einheiten, Investment Engine.

### CI-Icon-Standard

Alle Widget-Icons nutzen `HEADER.WIDGET_ICON_BOX` (`h-9 w-9 rounded-xl bg-primary/10`) mit inneren Icons `h-5 w-5 text-primary`.
