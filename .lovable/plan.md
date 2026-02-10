
# Zone 2 Design-Konsistenz-Audit und Reparatur

## Analyse: Aktuelle Inkonsistenzen

Nach systematischem Screenshot und Code-Review aller 20+ Module mit ihren Sub-Tabs zeigt sich folgendes Bild:

### Identifizierte Layout-Patterns (IST-Zustand)

Es gibt aktuell **6 verschiedene Layout-Patterns** in Zone 2 -- das ist die Ursache fuer die visuelle Unruhe:

| Pattern | Wrapper | Header-Stil | Max-Width | Padding | Verwendet in |
|---------|---------|------------|-----------|---------|-------------|
| A (Gut) | `container max-w-7xl mx-auto` | UPPERCASE h1 + muted subtitle | 7xl (80rem) | `px-4 py-6` | AreaOverview, DMS Posteingang/Sortieren |
| B (Haeufig) | `div` | `text-2xl font-bold` normal | keine | `p-6 space-y-6` | Favoriten, Leads, Akquise, FM-Dashboard, Vertriebspartner, Finanzanalyse, PV, Cars, CommPro |
| C (Miety) | `container max-w-5xl` | Icon + Title + Subtitle | 5xl (64rem) | `p-4 space-y-6` | Alle Miety-Tabs |
| D (Spezial) | `div` | Kein Page-Header | keine | variabel | Profil, KI-Office (glass-card), Immobilien Portfolio |
| E (Dashboard) | `div` | `WELCOME ON BOARD` centered | keine | `p-4 md:p-6 lg:p-8` | PortalDashboard (MOD-00) |
| F (Stub) | `div p-6 max-w-2xl mx-auto` | Centered Card | 2xl | `p-6` | Nicht-implementierte Module |

### Konkrete Probleme pro Modul

**BASE Area:**
- MOD-01 Stammdaten/Profil: KEIN Page-Header, springt direkt in Widgets -- Pattern D
- MOD-01 Stammdaten/Vertraege, Abrechnung, Sicherheit: Muessen geprueft werden
- MOD-02 KI-Office: Kein Page-Header, glassmorphism-Vollflaeche -- Pattern D (KORREKT, soll so bleiben)
- MOD-03 DMS/Storage: Eigener File-Manager, kein Standard-Header -- Pattern D
- MOD-03 DMS/Posteingang: Pattern A (gut!) -- mit container + UPPERCASE
- MOD-03 DMS/Sortieren: Pattern A (gut!)
- MOD-16 Shops: Pattern B (inkonsistent)
- MOD-20 Miety: Pattern C (eigener 5xl Container, schmaeler als Rest)

**MISSIONS Area:**
- MOD-04 Immobilien/Portfolio: Pattern D -- kein Page-Header, KPI-Cards direkt
- MOD-05 MSV: Pattern B
- MOD-06 Verkauf: Pattern B
- MOD-07 Finanzierung: Formular-Vollflaeche, kein Header -- akzeptabel
- MOD-08 Investments: Pattern B -- **NICHT AENDERN** (Investment Engine soll bleiben)

**OPERATIONS Area:**
- MOD-12 Akquise-Manager: Pattern B
- MOD-11 Finanzierungsmanager: Pattern B
- MOD-13 Projekte: Pattern B
- MOD-09 Vertriebspartner: Pattern B -- **NICHT AENDERN** (Investment Engine Ansicht)
- MOD-10 Leads: Pattern B

**SERVICES Area:**
- MOD-14 CommPro: Pattern B
- MOD-15 Fortbildung: Pattern B
- MOD-17 Cars: Pattern B
- MOD-18 Finanzanalyse: Pattern B
- MOD-19 Photovoltaik: Pattern B

### Soll-Design (Referenz: Admin Dashboard + AreaOverview)

Das Ziel-Pattern basiert auf dem Admin-Dashboard-Design:

```text
+----------------------------------------------------------+
|  [Level 3 Tabs: PROFIL  VERTRAEGE  ABRECHNUNG  ...]     |  <-- bereits vorhanden via SubTabNav
+----------------------------------------------------------+
|                                                          |
|  MODULNAME                                               |  <-- UPPERCASE, tracking-tight, font-bold
|  Beschreibung des Moduls in grau                         |  <-- text-muted-foreground, normal-case
|                                                          |  <-- ~16-24px Abstand
|  +---------------------+  +---------------------+       |
|  | Widget/Card 1       |  | Widget/Card 2       |       |
|  |                     |  |                     |        |
|  +---------------------+  +---------------------+       |
|                                                          |  <-- gap-6 zwischen Cards
|  +---------------------+  +---------------------+       |
|  | Widget/Card 3       |  | Widget/Card 4       |       |
|  +---------------------+  +---------------------+       |
+----------------------------------------------------------+
```

Abstaende:
- Page-Padding: `px-4 py-6 md:px-6` (responsive)
- Header margin-bottom: `mb-6`
- Card-Gap: `gap-6` (24px)
- Max-Width: `max-w-7xl mx-auto` (konsistent mit AreaOverview)

---

## Aenderungsplan

### Ausnahmen (NICHT AENDERN):
- **MOD-02 KI-Office**: Glassmorphism-Vollflaeche bleibt (eigenes Design-System)
- **MOD-08 Investments/Suche**: Investment Engine bleibt wie sie ist
- **MOD-09 Vertriebspartner/Beratung**: Investment Engine Ansicht bleibt
- **MOD-00 Dashboard**: "WELCOME ON BOARD" zentriert bleibt
- **MOD-03 DMS/Storage**: File-Manager hat eigenes Layout
- **MOD-07 Finanzierung/Selbstauskunft**: Scrollbares Formular bleibt

### Schritt 1: Shared PageHeader-Komponente erstellen

Neue Komponente `src/components/shared/ModulePageHeader.tsx`:
- Props: `title` (string, uppercase), `description` (string, muted)
- Optional: `actions` (ReactNode fuer Buttons rechts)
- Konsistente Abstands-Klassen eingebaut
- Export ueber `src/components/shared/index.ts`

### Schritt 2: Module-Tabs anpassen (nach Prioritaet)

**Hohe Prioritaet (am sichtbarsten):**

1. **MOD-01 Stammdaten/Profil** -- Page-Header "STAMMDATEN / Ihr persoenliches Profil" hinzufuegen, Container-Wrapper
2. **MOD-01 Stammdaten/Vertraege, Abrechnung, Sicherheit** -- Gleicher Header-Style
3. **MOD-20 Miety alle Tabs** -- max-w-5xl auf max-w-7xl angleichen, Header auf UPPERCASE
4. **MOD-16 Shops** -- Standard-Header hinzufuegen
5. **MOD-05 MSV** -- Standard-Header
6. **MOD-06 Verkauf** -- Standard-Header

**Mittlere Prioritaet:**

7. **MOD-04 Immobilien/Portfolio** -- KPI-Section behalten, aber Standard-Header darueber
8. **MOD-10 Leads alle Tabs** -- Standard-Header
9. **MOD-12 Akquise-Manager** -- Standard-Header
10. **MOD-11 Finanzierungsmanager** -- Standard-Header
11. **MOD-13 Projekte/Dashboard** -- Standard-Header (Projekte/Portfolio bleibt wie MOD-04)

**Niedrige Prioritaet:**

12. **MOD-14 CommPro** -- Standard-Header
13. **MOD-15 Fortbildung** -- Standard-Header
14. **MOD-17 Cars** -- Standard-Header
15. **MOD-18 Finanzanalyse** -- Standard-Header
16. **MOD-19 Photovoltaik** -- Standard-Header

### Schritt 3: Wrapper-Konsistenz

Alle betroffenen Tabs bekommen ein einheitliches aeusseres Wrapper-Pattern:
```tsx
<div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
  <ModulePageHeader title="MODULNAME" description="Beschreibung" />
  {/* Tab-spezifischer Inhalt */}
</div>
```

### Geschaetzter Umfang

- 1 neue Datei (ModulePageHeader)
- ca. 30-40 Tab-Dateien anpassen (Wrapper + Header einfuegen)
- Kein Datenbank- oder Backend-Eingriff

### Wichtig: Reihenfolge

Da dies ein rein visueller Refactor ist, kann alles in einem Durchgang erfolgen. Die Aenderungen sind isoliert pro Tab-Datei und haben keine Wechselwirkungen untereinander.
