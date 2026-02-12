# Mobile Deep-Test Plan (375px Viewport)

> Erstellt: 2026-02-12 | Status: Entwurf

## Testgerät-Simulation
- **Primär:** 375x812 (iPhone 13/14)
- **Sekundär:** 360x800 (Android Standard)
- **Tablet:** 768x1024 (iPad)

## Prüfmatrix

### Globale Checks (einmalig)
- [ ] PortalLayout: Sidebar collapsed, Hamburger-Menu funktional
- [ ] SubTabNav: Horizontale Pill-Navigation sticky + scrollbar
- [ ] PageShell: Padding px-2 py-3 auf Mobile
- [ ] Armstrong Floating Button: Position korrekt, nicht verdeckt

### Pro-Modul Checks (21x)

| # | Modul | Route | Scroll-Snap | Cards Stack | Table→Cards | Nav |
|---|-------|-------|-------------|-------------|-------------|-----|
| 1 | Dashboard | /portal | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 | Stammdaten | /portal/stammdaten | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | KI-Office | /portal/office | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | DMS | /portal/dokumente | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | Immobilien | /portal/immobilien | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | Verkauf | /portal/verkauf | ⬜ | ⬜ | ⬜ | ⬜ |
| 7 | Finanzierung | /portal/finanzierung | ⬜ | ⬜ | ⬜ | ⬜ |
| 8 | Investments | /portal/investments | ⬜ | ⬜ | ⬜ | ⬜ |
| 9 | Vertriebspartner | /portal/vertriebspartner | ⬜ | ⬜ | ⬜ | ⬜ |
| 10 | Leads | /portal/leads | ⬜ | ⬜ | ⬜ | ⬜ |
| 11 | FM-Manager | /portal/finanzierungsmanager | ⬜ | ⬜ | ⬜ | ⬜ |
| 12 | Akquise | /portal/akquise-manager | ⬜ | ⬜ | ⬜ | ⬜ |
| 13 | Projekte | /portal/projekte | ⬜ | ⬜ | ⬜ | ⬜ |
| 14 | Miety | /portal/miety | ⬜ | ⬜ | ⬜ | ⬜ |
| 15 | Shops | /portal/services | ⬜ | ⬜ | ⬜ | ⬜ |
| 16 | Fortbildung | /portal/fortbildung | ⬜ | ⬜ | ⬜ | ⬜ |
| 17 | Fuhrpark | /portal/fuhrpark | ⬜ | ⬜ | ⬜ | ⬜ |
| 18 | MSV | /portal/msv | ⬜ | ⬜ | ⬜ | ⬜ |
| 19 | CommPro | /portal/communication-pro | ⬜ | ⬜ | ⬜ | ⬜ |
| 20 | PV | /portal/photovoltaik | ⬜ | ⬜ | ⬜ | ⬜ |
| 21 | Finanzanalyse | /portal/finanzanalyse | ⏸️ | ⏸️ | ⏸️ | ⏸️ |

### Legende
- **Scroll-Snap:** Fullscreen-Feed-Pattern aktiv
- **Cards Stack:** Widgets/KPIs als volle Breite gestapelt
- **Table→Cards:** DataTable transformiert zu Card-Stack
- **Nav:** SubTabNav horizontal scrollbar

### Zone-3 Mobile Checks
| Seite | Route | Layout | Forms | Nav |
|-------|-------|--------|-------|-----|
| SoT Landing | / | ⬜ | — | ⬜ |
| SoT Demo | /demo | ⬜ | — | ⬜ |
| FutureRoom Start | /futureroom | ⬜ | ⬜ | ⬜ |
| FutureRoom Karriere | /futureroom/karriere | ⬜ | ⬜ | ⬜ |
| Kaufy Marktplatz | /kaufy | ⬜ | — | ⬜ |

## Ablauf
1. Browser-Tool mit 375x812 Viewport starten
2. Jedes Modul navigieren + Screenshot
3. Issues in dieser Datei dokumentieren
4. Fixes priorisieren und umsetzen
