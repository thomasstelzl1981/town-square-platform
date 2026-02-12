
# Redesign: Sanierung und Akquise-Manager nach dem Finanzierungsmanager-Muster

## Analyse: Was macht den FM-Flow so gut?

Der Finanzierungsmanager hat ein bewaehrtes 3-Stufen-Muster:

1. **Dashboard** mit Widget-Kacheln (FinanceCaseCard) fuer aktive Faelle, Visitenkarte, Zins-Ticker, BrandWidgets
2. **Faelle-Liste** als Tabelle mit Filter-Chips, Suche, Status-Badges, "Naechste Aktion"
3. **Fall-Detail** als durchgehende Akte (vertikaler Flow ohne Tabs) mit Split-View, Stepper, Status-Aktionen
4. **Einreichung** als eigener Reiter mit Case-Widget-Auswahl oben und darunter die 4 Kacheln (Expose, Bankauswahl, Status, Europace)

Kernprinzipien:
- Widget-Kacheln (aspect-square) als visuelle Einstiegspunkte
- Durchgehende Akte statt Tab-basierter Fragmentierung
- Stepper zeigt visuell den Workflow-Fortschritt
- Bank-Tabellen-Design (Label|Wert) fuer alle Datenfelder
- Split-View fuer komplexe Bearbeitungen
- PageShell + ModulePageHeader fuer CI-Konsistenz

---

## Teil 1: Sanierung (MOD-04) — Redesign

### Ist-Zustand (Probleme)
- Alles in einer einzigen `SanierungTab.tsx` gepresst
- Workflow laeuft innerhalb eines Collapsible pro Case — eng, unuebersichtlich
- Kein Dashboard, keine Widget-Kacheln
- Kein eigener Detail-View — alles inline
- Stepper ist eine Sidebar innerhalb des Collapsible statt eines visuellen Headers
- Kein "Vergabe"-Reiter analog zur Einreichung

### Neues Konzept: 3-Seiten-Architektur (wie FM)

**Seite 1: Sanierung Dashboard** (`/portal/immobilien/sanierung`)
- ModulePageHeader: "SANIERUNG" + Beschreibung + Button "Sanierung starten"
- Widget-Kacheln (aspect-square, grid) fuer aktive Vorgaenge — analog zu FinanceCaseCard:
  - Icon (Kategorie-Icon), Titel, Tender-ID, Objekt-Adresse, Status-Badge, Kostenschaetzung
  - Klick navigiert zur Detail-Seite
- Leerer Zustand: Grosses HardHat-Icon + "Erste Sanierung starten"

**Seite 2: Sanierung Detail** (`/portal/immobilien/sanierung/:caseId`)
- Eigene Route statt Inline-Collapsible
- Header: Zurueck-Button + Titel + Tender-ID + Status-Badge + Aktions-Buttons
- **Visueller Stepper** im Header (horizontal, wie CaseStepper im FM):
  - Schritt 1: Leistungsumfang
  - Schritt 2: Dienstleister
  - Schritt 3: Ausschreibung
  - Schritt 4: Angebote & Vergabe
- Darunter: Durchgehende Akte (vertikaler Flow, keine Tabs):
  - Kurzbeschreibung (Bank-Tabelle: Objekt, Kategorie, Titel, Budget, Erstellt am)
  - Leistungsumfang (ScopeDefinitionPanel)
  - Dienstleister-Suche (ProviderSearchPanel)
  - Ausschreibungsentwurf (TenderDraftPanel)
  - Angebotsvergleich (OfferComparisonPanel)
- Split-View Toggle (lg+): Links Akte, Rechts Dokumente/Uploads

**Seite 3: Vergabe** (`/portal/immobilien/sanierung/vergabe`)
- Analog zu FM Einreichung
- Oben: Widget-Kacheln fuer Vorgaenge im Status "under_review" oder "awarded"
- Darunter bei Auswahl:
  - Kachel 1: Angebotsvergleichs-Zusammenfassung
  - Kachel 2: Auftragsvergabe (Dienstleister auswaehlen, Auftragsbestaetigung per E-Mail)
  - Kachel 3: Status-Tracking (in_progress, completed)

### Routing-Aenderung

Aktuell: `/portal/immobilien/sanierung` zeigt alles in einer Seite.
Neu: Sub-Routing innerhalb der SanierungTab:
- `/portal/immobilien/sanierung` — Dashboard
- `/portal/immobilien/sanierung/:caseId` — Detail-Akte
- `/portal/immobilien/sanierung/vergabe` — Vergabe-Reiter

---

## Teil 2: Akquise-Manager (MOD-12) — Redesign

### Ist-Zustand (Probleme)
- Dashboard zeigt nur Mandats-Karten (keine Widget-Kacheln)
- BrandWidgets werden statisch oben gerendert (soll jetzt ueber System-Widgets laufen)
- Mandats-Detail nutzt 5-Tab-Layout (Sourcing, Outreach, Eingang, Analyse, Delivery) — fragmentiert
- Objekteingang-Detail nutzt 6-Tab-Layout — noch fragmentierter
- Kein visueller Stepper fuer den Golden Path
- Kein durchgehender Akte-Flow
- Mandats-Liste ist minimal (nur Code + Badge)

### Neues Konzept: FM-Muster uebertragen

**Dashboard** (`/portal/akquise-manager/dashboard`)
- ModulePageHeader: "AKQUISE-MANAGER" + Beschreibung + "Neues Mandat"-Button
- BrandWidgets entfernen (laufen jetzt ueber System-Widgets im Haupt-Dashboard)
- Widget-Kacheln (aspect-square) fuer aktive Mandate:
  - Mandat-Code, Client-Name (wenn sichtbar), Asset-Fokus, Preisspanne, Status-Badge, Offer-Count
  - Klick navigiert zum Mandats-Detail
- Darunter: Pending-Mandate als Aktions-Karten (wie bisher, aber kompakter)
- Eigene Mandats-Kacheln neben den Zugewiesenen

**Mandats-Detail** (`/portal/akquise-manager/mandate/:mandateId`)
- Header: Zurueck + Code + Status-Badge + Client-Info + Suchkriterien
- **Visueller Stepper** (horizontal):
  - Phase 1: Gate/Annahme
  - Phase 2: Sourcing & Outreach
  - Phase 3: Objekteingang & Analyse
  - Phase 4: Delivery/Praesentation
- Durchgehende Akte (vertikaler Flow, KEINE Tabs):
  - TermsGate (wenn noetig, ganz oben)
  - Suchprofil-Zusammenfassung (Bank-Tabellen-Design)
  - Sourcing-Bereich (PortalSearch, PropertyResearch inline)
  - Outreach-Bereich (E-Mail-Versand)
  - Objekteingang (Liste der Offers als Kompakt-Karten)
  - Analyse-Bereich (Bestand/Aufteiler Kalkulationen)
- Split-View Toggle: Links Mandats-Akte, Rechts Objekteingang-Detail

**Objekteingang-Detail** (`/portal/akquise-manager/objekteingang/:offerId`)
- Header: Zurueck + Titel + Status-Select + Aktions-Buttons
- **Visueller Stepper**:
  - Schritt 1: Erfassung (Objektdaten)
  - Schritt 2: Analyse (Kalkulation)
  - Schritt 3: Bewertung (Interesse/Absage/Preisvorschlag)
  - Schritt 4: Delivery (Praesentation an Investor)
- Durchgehende Akte statt 6 Tabs:
  - Kurzbeschreibung (Bank-Tabelle: KPIs in einer kompakten Tabelle statt 5 separate Cards)
  - Objektdaten (Basis, Lage, Investment — als Label|Wert Zeilen)
  - Kalkulation (Bestand/Aufteiler direkt inline, Sub-Toggle)
  - Quelle (E-Mail-Viewer)
  - Dokumente (Dateiliste)
  - Aktivitaeten (Log)

**Faelle-/Pipeline-Uebersicht** (`/portal/akquise-manager/objekteingang`)
- Filter-Chips (wie FM Faelle): Alle, Eingegangen, In Analyse, Analysiert, Praesentiert
- Tabellen-Design statt grosse Karten (wie FMFaelle)
- Spalten: Titel, Adresse, Preis, Status, Mandat, Naechste Aktion, Alter

---

## Teil 3: Gemeinsame Komponenten

### Neue Komponente: `ServiceCaseCard` (Widget-Kachel fuer Sanierung)
- Analog zu `FinanceCaseCard`
- aspect-square, Glass-Card, Kategorie-Icon, Titel, Status-Badge, Kosten

### Neue Komponente: `MandateCaseCard` (Widget-Kachel fuer Akquise)
- Analog zu `FinanceCaseCard`
- aspect-square, Glass-Card, Briefcase-Icon, Code, Status, Offer-Count

### Neue Komponente: `SanierungStepper` / `AkquiseStepper`
- Horizontal, analog zu `CaseStepper`
- Zeigt visuell den Fortschritt im Golden Path

---

## Technische Aenderungen

### Neue Dateien

| Datei | Inhalt |
|---|---|
| `src/components/sanierung/ServiceCaseCard.tsx` | Widget-Kachel fuer Sanierungsvorgaenge |
| `src/components/sanierung/SanierungStepper.tsx` | Horizontaler Stepper |
| `src/components/sanierung/SanierungDetail.tsx` | Durchgehende Akte (vertikaler Flow) |
| `src/components/sanierung/SanierungVergabe.tsx` | Vergabe-Reiter (analog FM Einreichung) |
| `src/components/akquise/MandateCaseCard.tsx` | Widget-Kachel fuer Mandate |
| `src/components/akquise/AkquiseStepper.tsx` | Horizontaler Stepper |

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/immobilien/SanierungTab.tsx` | Komplett umgebaut: Dashboard + Sub-Routing zu Detail/Vergabe |
| `src/pages/portal/AkquiseManagerPage.tsx` | Dashboard: BrandWidgets entfernen, Widget-Kacheln. Mandats-Detail: Tabs durch vertikalen Flow ersetzen, Stepper hinzufuegen. Objekteingang-Liste: Tabellen-Format |
| `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` | 6 Tabs durch durchgehende Akte ersetzen, Stepper hinzufuegen, Metadata-Bar durch Bank-Tabelle ersetzen |
| `src/pages/portal/akquise-manager/ObjekteingangList.tsx` | Karten-Design durch Tabellen-Design ersetzen, Filter-Chips hinzufuegen |
| `src/pages/portal/ImmobilienPage.tsx` | Route fuer `/sanierung/:caseId` und `/sanierung/vergabe` hinzufuegen |

### Keine Datenbank-Aenderungen noetig

Die bestehenden Tabellen und Status-Flows bleiben unveraendert. Es handelt sich um ein reines UI-Redesign.

---

## Zusammenfassung der Designprinzipien

Alle drei Module (FM, Sanierung, Akquise) folgen dann dem gleichen Muster:

1. **Dashboard** mit Widget-Kacheln + Modul-spezifischen Tools
2. **Faelle-/Pipeline-Liste** als kompakte Tabelle mit Filter-Chips
3. **Detail-Akte** als durchgehender vertikaler Flow (keine Tabs) mit Stepper und Split-View
4. **Einreichung/Vergabe** als eigener Reiter mit Case-Widget-Auswahl + Aktions-Kacheln
