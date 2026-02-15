

# Recherche-Modul Zone 2 — CI-Redesign und Live-Fortschrittsanzeige

## Probleme (Ist-Zustand)

1. **3 zusaetzliche Widgets sichtbar**: Die WidgetGrid zeigt Demo-Widget + echte Orders + CTA nebeneinander — entspricht nicht dem Golden Path Standard (nur Demo + CTA bei leerem Zustand).
2. **Demo-Version laesst sich nicht oeffnen**: Der Demo-Click setzt `activeOrderId = '__demo__'`, aber die Demo-Inline-Ansicht zeigt nur eine statische Tabelle ohne den beeindruckenden Flow.
3. **Neuer Auftrag zeigt nur Teildarstellung**: Der 6-Section InlineFlow ist zu formular-lastig und zeigt beim Running-State nur einen Spinner + Text.
4. **Kein visueller "Wow"-Effekt**: Es fehlt eine animierte Fortschrittsanzeige, die zeigt, dass aktiv Kontakte generiert werden.

## Loesung

### 1. WidgetGrid bereinigen — Golden Path CI

- Demo-Widget bleibt an Position 0 (DEMO_WIDGET CI mit smaragdgruenem Shimmer)
- CTA-Widget ("Neuer Rechercheauftrag") an Position 1
- Echte Orders dahinter, aber nur als kompakte Kacheln
- Keine ueberfluessigen Widgets

### 2. Demo-Flow: Beeindruckende animierte Recherche-Simulation

Wenn der User auf das Demo-Widget klickt, oeffnet sich unterhalb des Grids ein **animierter Live-Flow**, der eine Recherche simuliert:

- **Phase 1 — Initialisierung** (2s): Glasige Karte mit pulsierendem Radar-Icon, Text "Recherche wird vorbereitet..."
- **Phase 2 — Suche laeuft** (8s): 
  - Kreisfoermiger Fortschritts-Ring (wie ein Radar-Sweep) mit Prozentanzeige
  - Darunter ein horizontaler Fortschrittsbalken (0% bis 100%)
  - Timer der mitlaeuft (vergangene Zeit)
  - Provider-Status-Zeilen (Firecrawl: "Crawling...", dann "12 Seiten analysiert")
  - Kontakte erscheinen animiert einer nach dem anderen in einer Liste (fade-in + slide-up)
  - Jeder neue Kontakt hat eine kurze Einblend-Animation
  - Counter: "7 / 37 Kontakte gefunden" steigt live an
- **Phase 3 — Abgeschlossen** (nach 10s): 
  - Fortschrittsring faerbt sich gruen, Haekchen erscheint
  - Vollstaendige Ergebnistabelle wird eingeblendet
  - CTA-Buttons: "Excel-Export" und "Ins Kontaktbuch"

### 3. Echte Running-State-Ansicht (fuer reale Auftraege)

Der bisherige Spinner wird durch dieselbe Fortschrittsanzeige ersetzt:
- Kreisfoermiger Progress-Ring mit Prozent (`results_count / max_results * 100`)
- Horizontaler Balken
- Live-Counter: Treffer, Credits verbraucht, vergangene Zeit
- Kontakte erscheinen via Realtime-Subscription animiert

### 4. Neue Komponente: `ResearchLiveProgress.tsx`

Zentrale Komponente fuer den beeindruckenden Fortschritts-Flow:
- Wiederverwendbar fuer Demo-Simulation und echten Running-State
- Kreisfoermiger SVG-Fortschrittsring (animiert)
- Provider-Status-Zeilen mit Pulse-Animation
- Kontakt-Liste mit gestaffelter Einblend-Animation
- Glasiges, dunkles Card-Design passend zum CI

## Technische Aenderungen

### Neue Datei: `src/pages/portal/communication-pro/recherche/ResearchLiveProgress.tsx`
- SVG-basierter kreisfoermiger Fortschrittsring (stroke-dasharray Animation)
- Horizontaler Progress-Bar darunter
- Timer-Anzeige (elapsed time)
- Provider-Status-Grid (Icon + Label + Status-Text + Pulse-Dot)
- Kontakt-Feed: Liste mit staggered fade-in (CSS transition + delay)
- Props: `progress` (0-100), `contactsFound`, `maxContacts`, `providerStatus`, `contacts[]`, `isComplete`

### Neue Datei: `src/pages/portal/communication-pro/recherche/ResearchDemoSimulation.tsx`
- Verwendet `ResearchLiveProgress` mit einem `useEffect`-Timer
- Simuliert alle 300ms einen neuen Kontakt aus `DEMO_RESULTS`
- Durchlaeuft Phase 1 -> 2 -> 3 automatisch
- Am Ende zeigt es die vollstaendige Demo-Tabelle

### Geaendert: `ResearchTab.tsx`
- WidgetGrid: Nur Demo-Widget (Pos 0) + CTA (Pos 1) + echte Orders
- Demo-Click oeffnet `ResearchDemoSimulation` statt der statischen Tabelle
- Running-Orders zeigen `ResearchLiveProgress` statt Spinner
- Beibehaltung von ModulePageHeader, Golden Path Standard

### Geaendert: `ResearchOrderInlineFlow.tsx`
- Running-State (Section zwischen Consent und Ergebnisse) nutzt `ResearchLiveProgress`
- Kontakte werden via `useResearchResults` live geladen und animiert angezeigt
- Kein isolierter Spinner mehr

### Unveraendert
- `useResearchOrders.ts` — Logik bleibt
- `ResearchResultsTable.tsx` — wird weiterhin fuer fertige Ergebnisse verwendet
- `ResearchOrderWidget.tsx` — Kachel-Design bleibt

