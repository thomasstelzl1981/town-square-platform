
# Mobile CI/UX Redesign -- Erweiterter Plan mit Immo-Suche und Backlog

## Ubersicht

Dieser Plan erweitert die bestehende Mobile-Analyse um eine prominente Immobilien-Suchfunktion und erstellt eine strukturierte Backlog-Datei zur systematischen Umsetzung aller Optimierungen.

---

## 1. Immo-Suche: Mobile-First Redesign (NEU)

### IST-Zustand
Die Investment-Suche (MOD-08 SucheTab) nutzt ein Desktop-optimiertes 4-Spalten-Grid mit umfangreichen Suchformularen. Die `InvestmentResultTile` hat ein T-Konto-Layout (Einnahmen/Ausgaben) das auf Mobile zu klein wird. Es gibt keine mobile Erkennung (`useIsMobile`) in den Investment-Komponenten.

### SOLL-Zustand: Prominente Mobile-Suche

**A) Suchformular -- Mobile-Optimierung:**
- Zwei grosse Eingabefelder (Eigenkapital + zVE) untereinander statt nebeneinander
- Grosser, prominenter "Suchen"-Button (full-width, Primary)
- "Klassische Suche" als Sekundar-Toggle darunter
- Erweiterte Filter als Collapsible (default zugeklappt)

**B) InvestmentResultTile -- Mobile-Variante:**
- Auf Mobile: 1-Spalten-Layout (volle Breite, keine Grid-Spalten)
- Grosseres Bild (aspect-[4/3] statt [16/9]) fur bessere visuelle Wirkung
- T-Konto bleibt erhalten (2-Spalten-Vergleich funktioniert auch mobil)
- Monatsbelastung-Footer wird visuell vergroessert (text-lg statt text-base)
- Swipe-Geste: Optional horizontal swipebar zwischen Ergebnissen

**C) Suchergebnis-Darstellung:**
- Ergebnis-Counter prominent oben ("12 Objekte gefunden")
- Sortier-Dropdown (Preis, Rendite, Monatsbelastung) direkt sichtbar
- Endlos-Scroll statt Pagination fur App-Feeling
- Pull-to-Refresh fur Aktualisierung

### Betroffene Dateien:
- `src/pages/portal/investments/SucheTab.tsx` -- Mobile-responsive Suchformular
- `src/components/investment/InvestmentResultTile.tsx` -- Mobile-Variante mit grosserem Bild
- `src/pages/portal/investments/InvestmentExposePage.tsx` -- Mobile Expose-Ansicht

---

## 2. Werbe-Widgets und KI Office ausblenden

- `AreaPromoCard` auf Mobile per `useIsMobile()` ausblenden
- MOD-02 (KI Office) aus der mobilen Navigation entfernen via `MOBILE_HIDDEN_MODULES` Config
- Weitere Desktop-Only Module (MOD-09, MOD-10, MOD-11, MOD-12, MOD-14) auf Mobile ausblenden

---

## 3. Chart-Mobiloptimierung

- Neuer `MobileChartWrapper` der grosse Recharts-Charts auf Mobile durch kompakte KPI-Karten ersetzt
- Betroffene Komponenten: AufteilerCalculation, BestandCalculation

---

## 4. PWA-Setup

- `vite-plugin-pwa` installieren und konfigurieren
- Web-Manifest mit App-Name, Icons, Theme-Color
- Service Worker mit `navigateFallbackDenylist: [/^\/~oauth/]`
- Install-Prompt-Seite unter `/install`
- Mobile Meta-Tags in `index.html`

---

## 5. Scroll-Stabilitat und App-Feeling

- `overflow-x: hidden` auf allen Mobile-Containern
- `overscroll-behavior-y: contain` gegen Bounce-Effekte
- `-webkit-overflow-scrolling: touch` fur nativen Scroll
- Touch-optimierte Tap-Targets (min. 44px)

---

## 6. Backlog-Datei

Es wird eine neue Datei `spec/audit/mobile_ux_backlog.json` erstellt mit folgendem Aufbau:

```text
Schema: MOBILE-UX-V1.0
Phasen:

PHASE 1 - Quick Wins (Prio HIGH)
  MUX-001: mobileConfig.ts erstellen (MOBILE_HIDDEN_MODULES)
  MUX-002: AreaPromoCard auf Mobile ausblenden
  MUX-003: MOD-02 und Partner-Module auf Mobile ausblenden

PHASE 2 - Immo-Suche Mobile-First (Prio HIGH)
  MUX-010: SucheTab mobile-responsive Suchformular
  MUX-011: InvestmentResultTile Mobile-Variante (grosseres Bild, 1-Spalte)
  MUX-012: Ergebnis-Sortierung und Counter auf Mobile
  MUX-013: InvestmentExposePage mobile Anpassung
  MUX-014: Pull-to-Refresh und Endlos-Scroll

PHASE 3 - Grafiken und Charts (Prio MEDIUM)
  MUX-020: MobileChartWrapper Komponente erstellen
  MUX-021: AufteilerCalculation mobil optimieren
  MUX-022: BestandCalculation mobil optimieren

PHASE 4 - PWA (Prio MEDIUM)
  MUX-030: vite-plugin-pwa installieren und konfigurieren
  MUX-031: Web-Manifest und Icons
  MUX-032: Install-Prompt-Seite (/install)
  MUX-033: Mobile Meta-Tags in index.html

PHASE 5 - App-Feeling und Stabilitat (Prio HIGH)
  MUX-040: overflow-x hidden auf Mobile-Containern
  MUX-041: Touch-optimierte Tap-Targets (44px min)
  MUX-042: Scroll-Bounce deaktivieren
  MUX-043: PortalLayout Mobile-Stabilitat
```

---

## Technische Details

### Neue Dateien:
1. `spec/audit/mobile_ux_backlog.json` -- Backlog fur alle Mobile-Optimierungen
2. `src/config/mobileConfig.ts` -- Zentrale Mobile-Governance (Hidden Modules, Feature-Flags)
3. `src/components/shared/MobileChartWrapper.tsx` -- Chart-Adapter fur Mobile
4. `src/pages/Install.tsx` -- PWA Install-Prompt

### Geanderte Dateien:
1. `src/pages/portal/investments/SucheTab.tsx` -- Mobile-responsive Suchformular mit `useIsMobile()`
2. `src/components/investment/InvestmentResultTile.tsx` -- Mobile-Variante (grosseres Bild, groessere Typo)
3. `src/pages/portal/AreaOverviewPage.tsx` -- Promo-Filter + Modul-Filter
4. `vite.config.ts` -- PWA-Plugin
5. `index.html` -- PWA Meta-Tags
6. `src/index.css` -- Mobile Scroll-Stabilitat
7. Chart-Komponenten (AufteilerCalculation, BestandCalculation) -- MobileChartWrapper

### Reihenfolge:
Phase 1 und 5 zuerst (Stabilitat + Quick Wins), dann Phase 2 (Immo-Suche als Kern-Feature), dann Phase 3 und 4 parallel.
