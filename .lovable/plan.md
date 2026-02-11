

# Bewertung-Tab: Neuaufbau mit 2-Widget-Layout

## Ueberblick

Die Seite wird komplett umstrukturiert zu einem cleanen 2-Spalten-Widget-Layout. Entfernt werden: Credits-Karte, Workflow-Leiste, Laufende Jobs, Sprengnetter-Hinweis unten. Stattdessen ein professionelles Layout mit ModulePageHeader (CI-konform) und zwei Widgets nebeneinander.

## Neuer Aufbau

### 1. ModulePageHeader (CI-konform)
- Titel: "BEWERTUNG" (uppercase, wie ueberall)
- Beschreibung: "Marktwertermittlung via Sprengnetter — professionelle Gutachten fuer Ihre Liegenschaften. Waehlen Sie ein Objekt aus, starten Sie die Bewertung und erhalten Sie Ihr Gutachten als PDF."

### 2. Zwei Widgets nebeneinander (grid grid-cols-1 lg:grid-cols-2)

**Linkes Widget: "Bewertbare Objekte"**
- WidgetHeader mit TrendingUp-Icon
- Tabelle mit den Immobilien (Code, Adresse, Typ, aktueller Verkehrswert)
- Button "Bewerten" pro Zeile (disabled bis API angebunden)
- Leerzustand: Platzhalter-Text "Keine Objekte vorhanden"
- Mehr Objektdaten sichtbar als bisher (property_type, Baujahr etc.)

**Rechtes Widget: "Gutachten"**
- WidgetHeader mit FileText-Icon
- Liste abgeschlossener Bewertungen als kompakte Karten
- Jede Karte zeigt: Objekt-Code, Bewertungsdatum, Verkehrswert, PDF-Icon
- PDF-Vorschau als kleine anklickbare Kachel (Platzhalter-Darstellung mit FileText-Icon und "PDF" Badge)
- Leerzustand: Gestrichelter Rahmen mit "Noch keine Gutachten vorhanden — starten Sie eine Bewertung"

### 3. Entfernte Elemente
- Credits-Karte (komplett weg)
- Workflow-Visualisierung (komplett weg)
- Laufende Jobs-Karte (komplett weg)
- Sprengnetter-Hinweis unten (komplett weg)

## Technische Aenderungen

### Datei: `src/pages/portal/immobilien/BewertungTab.tsx`

Kompletter Neuaufbau des Return-Blocks:

- Import `WidgetHeader` aus `@/components/shared/WidgetHeader`
- Entfernen der Imports fuer `Coins`, `Clock`, `AlertCircle`, `ArrowRight`, `ExternalLink`
- Entfernen von `WORKFLOW_STEPS` Konstante
- Entfernen von `pendingValuations` Variable
- Layout: `PageShell` > `ModulePageHeader` > `div grid grid-cols-1 lg:grid-cols-2 gap-6`
  - Links: Card mit WidgetHeader + Objekttabelle (erweitert um property_type)
  - Rechts: Card mit WidgetHeader + Gutachten-Liste oder Leerzustand mit PDF-Platzhalter-Kacheln

Keine Datenbank-Aenderungen noetig. Eine Datei wird bearbeitet.

