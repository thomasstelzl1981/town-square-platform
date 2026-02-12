
# Gesamtplan: Mobile Fullscreen-Feed fuer die komplette Zone 2

## Analyse: Aktuelle Mobile-Probleme in Zone 2

Alle 21 Module (Dashboard + 20 MODs) nutzen dieselben Basis-Bausteine, die auf Mobile suboptimal sind:
- **PageShell**: `p-4 md:p-6` — funktioniert, aber zu viel seitliches Padding auf kleinen Screens
- **ModulePageHeader**: Flex-Layout mit Titel + Actions nebeneinander — bricht auf Mobile teilweise
- **Widget-Grids**: `grid-cols-2` bis `grid-cols-5` — erzeugt kleine, unleserliche Kacheln
- **aspect-square**: Erzwingt quadratische Form auch auf Mobile — verschwendet Platz
- **Bank-Tabellen** (`grid-cols-[180px_1fr]`): Label-Spalte zu breit auf Mobile
- **Split-View**: Zwei Spalten nebeneinander — auf Mobile nicht nutzbar
- **Formular-Grids**: `grid-cols-2/3/4` fuer Eingabefelder — zu eng auf Mobile

## Strategie: 3 Shared Components aendern, alle Module profitieren

Statt alle 86+ Dateien einzeln anzufassen, werden die **zentralen Bausteine** mobile-optimiert. Dadurch erbt jedes Modul automatisch das neue Verhalten.

---

## Ebene 1: Globale Bausteine (wirken auf ALLE Module)

### 1.1 PageShell — Reduziertes Mobile-Padding

```
Vorher: p-4 md:p-6
Nachher: px-2 py-3 md:p-6
```

Minimales seitliches Padding auf Mobile fuer maximale Inhaltsbreite.

### 1.2 ModulePageHeader — Vertikales Stacking auf Mobile

```
Vorher: flex items-start justify-between gap-4 (immer horizontal)
Nachher: flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4
```

Titel und Beschreibung oben, Actions darunter als volle Breite.

### 1.3 ModuleTilePage — Fullscreen Empty States

Die Template-Komponente fuer leere Tiles bekommt Mobile-optimierte Abstände und volle Breite.

### 1.4 FormSection / FormRow — Mobile-First Stacking

Bank-Tabellen-Zeilen (`grid-cols-[180px_1fr]`) werden auf Mobile zu vertikalem Stack:

```
Vorher: grid grid-cols-[180px_1fr] (immer)
Nachher: grid grid-cols-1 md:grid-cols-[180px_1fr]
```

Label oben, Wert darunter — auf Mobile besser lesbar.

---

## Ebene 2: Dashboard (MOD-00)

### 2.1 DashboardGrid — Flex-Column statt Grid

Mobile: `flex flex-col gap-3` mit optionalem `scroll-snap-type: y proximity`.
Desktop: Grid wie bisher (unveraendert).

### 2.2 SortableWidget — Snap-Start Container

Mobile: `snap-start w-full` Wrapper ohne DnD-Attribute.

### 2.3 Alle Widget-Komponenten — Feste Mobile-Hoehen

| Widget | Mobile | Desktop |
|--------|--------|---------|
| ArmstrongGreetingCard | `h-[220px]` | `aspect-square` |
| WeatherCard | `h-[280px]` | `aspect-square` |
| EarthGlobeCard | `h-[300px]` | `aspect-square` |
| FinanceWidget | `h-[280px]` | `aspect-square` |
| NewsWidget | `h-[320px]` | `aspect-square` |
| SpaceWidget | `h-[300px]` | `aspect-square` |
| QuoteWidget | `h-[200px]` | `aspect-square` |
| RadioWidget | `h-[260px]` | `aspect-square` |
| BrandLinkWidget | `h-[180px]` | `aspect-square` |
| PVLiveWidget | `h-[240px]` | `aspect-square` |

Alle: `h-[Xpx] md:aspect-square md:h-auto`

### 2.4 PortalDashboard — Mobile Titel

```
Vorher: text-h1 text-center tracking-widest (gleich auf allen Screens)
Nachher: text-lg md:text-h1 text-center tracking-widest
```

---

## Ebene 3: Workflow-Module mit Case-Cards (MOD-11, MOD-04, MOD-12)

### 3.1 Case-Card-Grids — Vertikaler Feed auf Mobile

Alle Module, die Widget-Kacheln (FinanceCaseCard, ServiceCaseCard, MandateCaseCard) in einem Grid darstellen, werden auf Mobile zu einem vertikalen Feed:

```
Vorher: grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4
Nachher: flex flex-col gap-3 md:grid md:grid-cols-4 lg:grid-cols-5 md:gap-4
```

### 3.2 Case-Cards — Horizontales Layout auf Mobile

Statt quadratisch (aspect-square) werden die Cards auf Mobile zu breiten, flachen Karten:

```
Mobile: flex-row Layout (Icon links, Infos rechts, volle Breite, h-auto)
Desktop: aspect-square (wie bisher)
```

Betrifft:
- `FinanceCaseCard` (MOD-11)
- `ServiceCaseCard` (MOD-04 Sanierung)
- `MandateCaseCard` (MOD-12)

### 3.3 Stepper — Kompakt auf Mobile

CaseStepper, SanierungStepper, AkquiseStepper:

```
Vorher: Horizontale Schritte mit Text (immer)
Nachher Mobile: Nur Icons/Nummern + aktueller Schritt-Name, kompakter Abstand
Desktop: Wie bisher
```

### 3.4 Split-View — Automatisch deaktiviert auf Mobile

Split-View-Toggles werden auf Mobile ausgeblendet. Inhalte werden vertikal gestapelt statt nebeneinander.

```
Vorher: grid grid-cols-2 (wenn splitView aktiv, auch auf Mobile)
Nachher: grid grid-cols-1 lg:grid-cols-2 (Split nur auf lg+)
```

Betrifft: FMFallDetail, SanierungDetail, Akquise MandateDetail, PropertyDetailPage

---

## Ebene 4: Formular-Module (MOD-01, MOD-07, MOD-11 Selbstauskunft)

### 4.1 Bank-Tabellen-Rows — Vertikales Stacking

```
Vorher: grid grid-cols-[180px_1fr] (immer)
Nachher: flex flex-col gap-0.5 md:grid md:grid-cols-[180px_1fr]
```

Auf Mobile: Label als kleine Ueberschrift, Wert darunter in voller Breite.

### 4.2 Formular-Grids — Einspaltig auf Mobile

Ueberall wo `grid-cols-2`, `grid-cols-3`, `grid-cols-4` fuer Eingabefelder verwendet wird:

```
Vorher: grid grid-cols-2 gap-2 (oder 3/4)
Nachher: grid grid-cols-1 md:grid-cols-2 gap-2 (bzw. md:grid-cols-3/4)
```

---

## Ebene 5: Tabellen-Module (MOD-11 Faelle, MOD-12 Objekteingang, MOD-06 Vorgaenge)

### 5.1 Daten-Tabellen — Card-Stack auf Mobile

Desktop-Tabellen mit vielen Spalten sind auf Mobile unlesbar. Loesung: Auf Mobile werden Tabellenzeilen zu gestapelten Cards:

```
Mobile: Jede Zeile wird zu einer Card (Titel gross, Metadata klein, Status-Badge, Action-Button)
Desktop: Table wie bisher
```

Dies betrifft:
- FMFaelle (Finanzierungsfaelle-Tabelle)
- ObjekteingangList (Akquise-Pipeline)
- VorgaengeTab (Verkauf)
- MieteingangTab (MSV)

### 5.2 Filter-Chips — Horizontal Scrollbar auf Mobile

```
Vorher: flex flex-wrap gap-2 (bricht in mehrere Zeilen)
Nachher: flex overflow-x-auto gap-2 pb-2 scrollbar-none md:flex-wrap
```

Horizontales Wischen fuer Filter ist akzeptabel (kleine, gezielte Geste), das Haupt-Scrolling bleibt vertikal.

---

## Ebene 6: Spezialmodule

### 6.1 MOD-20 Miety — Zuhause-Kacheln als Feed

Die 3 Kacheln (Adresse, Street View, Satellite) im `grid-cols-3`:

```
Vorher: grid grid-cols-1 sm:grid-cols-3 gap-4 (mit aspect-square)
Nachher: flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4
         Mobile: h-[200px] statt aspect-square
```

### 6.2 MOD-13 Projekte — Preis-/Einheitenliste

Preislisten-Tabellen bekommen dasselbe Card-Stack-Pattern auf Mobile.

### 6.3 MOD-03 DMS — Storage-Spaltenansicht

Die Spaltenansicht (260px Spalten) wird auf Mobile zu einer einspaltigen Liste mit Breadcrumb-Navigation statt Nebeneinander-Spalten.

### 6.4 MOD-02 KI-Office — Tabs bleiben

Die Tab-Navigation (E-Mail, Brief, Kontakte, Kalender, Widgets) funktioniert auf Mobile als horizontaler Scroll-Tab-Bar — hier kein Aenderungsbedarf.

### 6.5 MOD-09/10/14 — ModuleTilePage erbt automatisch

Module die ausschliesslich ModuleTilePage nutzen (Leads, Vertriebspartner, Communication Pro Sub-Tiles) erben die Verbesserungen automatisch ueber die Komponente.

---

## Zusammenfassung: Geaenderte Dateien

### Globale Bausteine (wirken auf alle Module)

| Datei | Aenderung |
|---|---|
| `src/components/shared/PageShell.tsx` | Mobile Padding: `px-2 py-3 md:p-6` |
| `src/components/shared/ModulePageHeader.tsx` | Mobile: `flex-col`, Actions volle Breite |
| `src/components/shared/ModuleTilePage.tsx` | Mobile: Vollbreite, weniger Padding |

### Dashboard (MOD-00)

| Datei | Aenderung |
|---|---|
| `src/components/dashboard/DashboardGrid.tsx` | Mobile: `flex flex-col gap-3` + Snap |
| `src/components/dashboard/SortableWidget.tsx` | Mobile: `snap-start w-full` |
| `src/pages/portal/PortalDashboard.tsx` | Mobile: `px-2 py-3`, Titel kleiner |
| `src/components/dashboard/ArmstrongGreetingCard.tsx` | `h-[220px] md:aspect-square md:h-auto` |
| `src/components/dashboard/WeatherCard.tsx` | `h-[280px] md:aspect-square md:h-auto` |
| `src/components/dashboard/EarthGlobeCard.tsx` | `h-[300px] md:aspect-square md:h-auto` |
| `src/components/dashboard/widgets/FinanceWidget.tsx` | `h-[280px] md:aspect-square md:h-auto` |
| `src/components/dashboard/widgets/NewsWidget.tsx` | `h-[320px] md:aspect-square md:h-auto` |
| `src/components/dashboard/widgets/SpaceWidget.tsx` | `h-[300px] md:aspect-square md:h-auto` |
| `src/components/dashboard/widgets/QuoteWidget.tsx` | `h-[200px] md:aspect-square md:h-auto` |
| `src/components/dashboard/widgets/RadioWidget.tsx` | `h-[260px] md:aspect-square md:h-auto` |
| `src/components/dashboard/widgets/BrandLinkWidget.tsx` | `h-[180px] md:aspect-square md:h-auto` |
| `src/components/dashboard/widgets/PVLiveWidget.tsx` | `h-[240px] md:aspect-square md:h-auto` |

### Workflow-Module (MOD-04, MOD-11, MOD-12)

| Datei | Aenderung |
|---|---|
| `src/components/finanzierungsmanager/FinanceCaseCard.tsx` | Mobile: horizontale Card statt quadratisch |
| `src/components/sanierung/ServiceCaseCard.tsx` | Mobile: horizontale Card statt quadratisch |
| `src/components/akquise/MandateCaseCard.tsx` | Mobile: horizontale Card statt quadratisch |
| `src/components/finanzierungsmanager/CaseStepper.tsx` | Mobile: kompakte Icon-only Darstellung |
| `src/components/sanierung/SanierungStepper.tsx` | Mobile: kompakte Icon-only Darstellung |
| `src/components/akquise/AkquiseStepper.tsx` | Mobile: kompakte Icon-only Darstellung |
| `src/pages/portal/finanzierungsmanager/FMFallDetail.tsx` | Split-View nur auf lg+, TR-Rows responsive |
| `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` | Case-Grid als Feed auf Mobile |
| `src/components/sanierung/SanierungDetail.tsx` | Split-View nur auf lg+ |
| `src/pages/portal/immobilien/SanierungTab.tsx` | Case-Grid als Feed auf Mobile |
| `src/pages/portal/AkquiseManagerPage.tsx` | Case-Grid als Feed, Split deaktiviert |

### Tabellen-Module

| Datei | Aenderung |
|---|---|
| `src/pages/portal/finanzierungsmanager/FMFaelle.tsx` | Mobile: Card-Stack statt Tabelle |
| `src/pages/portal/akquise-manager/ObjekteingangList.tsx` | Mobile: Card-Stack statt Tabelle |

### Spezialmodule

| Datei | Aenderung |
|---|---|
| `src/pages/portal/MietyPortalPage.tsx` | Kacheln als Feed, aspect-square nur auf sm+ |
| `src/pages/portal/msv/ObjekteTab.tsx` | KPI-Cards: `grid-cols-1 sm:grid-cols-3` |
| `src/pages/portal/msv/MieteingangTab.tsx` | Tabelle als Card-Stack auf Mobile |

### Keine Datenbank-Aenderungen noetig

Reines Frontend/CSS-Redesign. Desktop bleibt vollstaendig unveraendert.

---

## Implementierungsreihenfolge

Da die globalen Bausteine (PageShell, ModulePageHeader, ModuleTilePage) auf alle Module wirken, ist die Reihenfolge:

1. **Phase 1** — Globale Bausteine (3 Dateien) — sofortige Wirkung auf alle 20+ Module
2. **Phase 2** — Dashboard Widgets (13 Dateien) — Fullscreen-Feed
3. **Phase 3** — Case-Cards + Stepper (6 Dateien) — Workflow-Module
4. **Phase 4** — Tabellen + Detail-Views (5 Dateien) — Datenintensive Module
5. **Phase 5** — Spezialmodule (3 Dateien) — Miety, MSV

Gesamtumfang: ca. 30 Dateien, davon nur CSS/Klassen-Aenderungen. Keine Logik-Aenderungen, keine neuen Abhaengigkeiten.
