
# Systemweiter CI-Audit: Breitenabgleich und Aufraeumaktion

## Referenz-Standard: KI-Office

Das KI-Office (MOD-02) verwendet durchgehend `max-w-7xl mx-auto px-4 py-6 md:px-6`. Alle Seiten ausserhalb des Dashboards, des Portals und der Investment-Engine sollen diese Breite uebernehmen.

**Ausnahmen (bleiben wie sie sind):**
- Investment-Engine (MOD-08): SucheTab, FavoritenTab, SimulationTab, MandatTab -- haben seitliche Rechner/Filter
- Projekte PortfolioTab: hat StickyCalculatorPanel an der Seite
- Immobilien PortfolioTab: hat Kontext-Selektor und breite Tabellen mit vielen Spalten
- PortalDashboard, AreaOverviewPage: Dashboard-Seiten (explizit ausgeschlossen)

---

## Ergebnis: 73 Seiten geprueft

### A) Breiten-Abweichungen (muessen auf `max-w-7xl` gebracht werden)

| # | Datei | Aktuelle Breite | Aenderung |
|---|---|---|---|
| 1 | `finanzierungsmanager/FMDashboard.tsx` | `PageShell` (max-w-5xl) | -> max-w-7xl |
| 2 | `finanzierungsmanager/FMFaelle.tsx` | `PageShell` (max-w-5xl) | -> max-w-7xl |
| 3 | `finanzierungsmanager/FMFallDetail.tsx` | `PageShell` (max-w-5xl) | -> max-w-7xl |
| 4 | `finanzierungsmanager/FMKommunikation.tsx` | `PageShell` (max-w-5xl) | -> max-w-7xl |
| 5 | `finanzierungsmanager/FMStatus.tsx` | `PageShell` (max-w-5xl) | -> max-w-7xl |
| 6 | `immobilien/BewertungTab.tsx` | `PageShell` (max-w-5xl) | -> max-w-7xl |
| 7 | `immobilien/SanierungTab.tsx` | max-w-5xl | -> max-w-7xl |
| 8 | `AkquiseManagerPage.tsx` | max-w-5xl | -> max-w-7xl |
| 9 | `communication-pro/social/OverviewPage.tsx` | max-w-4xl, kein mx-auto | -> max-w-7xl mx-auto px-4 py-6 md:px-6 |
| 10 | `communication-pro/social/AuditPage.tsx` | max-w-3xl (2x) | -> max-w-7xl mx-auto px-4 py-6 md:px-6 |
| 11 | `leads/SelfieAdsPlanen.tsx` | max-w-4xl | -> max-w-7xl |
| 12 | `leads/SelfieAdsSummary.tsx` | max-w-3xl | -> max-w-7xl |
| 13 | `akquise-manager/ObjekteingangDetail.tsx` | p-6 (kein max-w) | -> max-w-7xl mx-auto px-4 py-6 md:px-6 |
| 14 | `finanzierung/AnfrageDetailPage.tsx` | space-y-6 (kein max-w) | -> max-w-7xl mx-auto px-4 py-6 md:px-6 |
| 15 | `miety/MietyHomeDossier.tsx` | h-full flex (kein max-w) | -> max-w-7xl mx-auto wrappen |

### B) Seiten mit korrekter Breite (max-w-7xl) -- keine Aenderung noetig

| # | Datei | Status |
|---|---|---|
| 1 | `office/EmailTab.tsx` | OK |
| 2 | `office/BriefTab.tsx` | OK |
| 3 | `office/KontakteTab.tsx` | OK |
| 4 | `office/KalenderTab.tsx` | OK |
| 5 | `office/WhatsAppTab.tsx` | OK |
| 6 | `office/WidgetsTab.tsx` | OK (via TileShell) |
| 7 | `dms/StorageTab.tsx` | OK |
| 8 | `dms/SortierenTab.tsx` | OK |
| 9 | `dms/EinstellungenTab.tsx` | OK |
| 10 | `dms/PosteingangTab.tsx` | OK |
| 11 | `msv/ObjekteTab.tsx` | OK |
| 12 | `msv/MieteingangTab.tsx` | OK |
| 13 | `msv/VermietungTab.tsx` | OK |
| 14 | `msv/EinstellungenTab.tsx` | OK |
| 15 | `stammdaten/ProfilTab.tsx` | OK |
| 16 | `stammdaten/SicherheitTab.tsx` | OK |
| 17 | `stammdaten/VertraegeTab.tsx` | OK |
| 18 | `stammdaten/AbrechnungTab.tsx` | OK |
| 19 | `immobilien/KontexteTab.tsx` | OK |
| 20 | `immobilien/PortfolioTab.tsx` | OK (Ausnahme: breite Tabellen) |
| 21 | `verkauf/ObjekteTab.tsx` | OK |
| 22 | `verkauf/AnfragenTab.tsx` | OK |
| 23 | `verkauf/VorgaengeTab.tsx` | OK |
| 24 | `verkauf/ReportingTab.tsx` | OK |
| 25 | `vertriebspartner/KatalogTab.tsx` | OK |
| 26 | `vertriebspartner/NetworkTab.tsx` | OK |
| 27 | `vertriebspartner/KundenTab.tsx` | OK |
| 28 | `vertriebspartner/BeratungTab.tsx` | OK (Investment-Engine-aehnlich) |
| 29 | `projekte/ProjekteDashboard.tsx` | OK |
| 30 | `projekte/KontexteTab.tsx` | OK |
| 31 | `projekte/MarketingTab.tsx` | OK |
| 32 | `projekte/VertriebTab.tsx` | OK |
| 33 | `projekte/LandingPageTab.tsx` | OK |
| 34 | `projekte/PortfolioTab.tsx` | OK (Ausnahme: Rechner) |
| 35 | `finanzierung/AnfrageTab.tsx` | OK |
| 36 | `finanzierung/StatusTab.tsx` | OK |
| 37 | `finanzierung/SelbstauskunftTab.tsx` | OK (delegiert an Komponente) |
| 38 | `finanzierung/DokumenteTab.tsx` | OK (delegiert an Komponente) |
| 39 | `photovoltaik/AnlagenTab.tsx` | OK |
| 40 | `photovoltaik/MonitoringTab.tsx` | OK |
| 41 | `photovoltaik/DokumenteTab.tsx` | OK |
| 42 | `photovoltaik/EinstellungenTab.tsx` | OK |
| 43 | `leads/SelfieAdsStudio.tsx` | OK (via PageShell) |
| 44 | `leads/SelfieAdsKampagnen.tsx` | OK |
| 45 | `leads/SelfieAdsPerformance.tsx` | OK |
| 46 | `leads/SelfieAdsAbrechnung.tsx` | OK |
| 47 | `communication-pro/SerienEmailsPage.tsx` | OK |
| 48 | `communication-pro/social/AssetsPage.tsx` | OK |
| 49 | `communication-pro/social/CreatePage.tsx` | OK |
| 50 | `communication-pro/social/InboundPage.tsx` | OK |
| 51 | `communication-pro/recherche/ResearchTab.tsx` | OK (via Card-Wrapper) |
| 52 | `MietyPortalPage.tsx` (TileShell) | OK |
| 53 | `ServicesPage.tsx` | OK |
| 54 | `akquise-manager/ObjekteingangList.tsx` | OK |
| 55 | `CarsPage.tsx` (4 Sub-Komponenten) | OK |
| 56 | `FortbildungPage.tsx` | OK (PageShell) |
| 57 | `FinanzanalysePage.tsx` | OK (ModuleTilePage) |
| 58 | `stub/ModuleStubPage.tsx` | OK |

### C) Shared Component: PageShell muss zurueckgesetzt werden

`PageShell.tsx` wurde im letzten CI-Abgleich auf `max-w-5xl` gesetzt. Das muss zurueck auf `max-w-7xl`, da es jetzt von mehreren Modulen genutzt wird und der Standard max-w-7xl ist.

**Aenderung:** `max-w-5xl` -> `max-w-7xl` in `PageShell.tsx`

### D) Shared Component: ModuleTilePage

`ModuleTilePage.tsx` nutzt `max-w-7xl` -- korrekt, keine Aenderung.

---

## Sinnlose / Tote Kacheln und Elemente

| # | Datei | Problem | Empfehlung |
|---|---|---|---|
| 1 | `leads/SelfieAdsStudio.tsx` | Hardcoded Demo-Daten (demoKampagnen, demoLeads) die nie durch echte Daten ersetzt werden | Durch Empty-States ersetzen |
| 2 | `leads/SelfieAdsPerformance.tsx` | Komplett hardcoded Charts und Statistiken (leadsOverTime, regionData) | Durch Empty-State mit Erklaerung ersetzen |
| 3 | `leads/SelfieAdsAbrechnung.tsx` | Hardcoded demoPayments, keine DB-Anbindung | Durch Empty-State ersetzen |
| 4 | `leads/SelfieAdsKampagnen.tsx` | Hardcoded Kampagnen-Daten | Durch Empty-State ersetzen |
| 5 | `FinanzanalysePage.tsx` | 4 Stub-Tiles (Dashboard, Berichte, Szenarien, Einstellungen) -- alle zeigen nur "Keine Daten" mit console.log onClick | Entweder entfernen oder als "Coming Soon" kennzeichnen |

---

## Nicht-funktionale Wizards

| # | Datei | Problem | Empfehlung |
|---|---|---|---|
| 1 | `leads/SelfieAdsPlanen.tsx` | Wizard speichert nur in sessionStorage, kein DB-Persist, "Generieren" ist ein simulierter Timeout | Als Showcase markieren, kein echter Workflow |

---

## Zusammenfassung der Aenderungen

**15 Dateien brauchen Breiten-Korrektur:**
- 6x PageShell-Nutzer (FM-Module + BewertungTab) -- werden automatisch durch PageShell-Fix behoben
- 2x direkte max-w-5xl (SanierungTab, AkquiseManagerPage)
- 4x zu schmale Breite (OverviewPage, AuditPage, SelfieAdsPlanen, SelfieAdsSummary)
- 3x fehlende max-w Begrenzung (ObjekteingangDetail, AnfrageDetailPage, MietyHomeDossier)

**1 Shared Component:**
- PageShell.tsx: max-w-5xl -> max-w-7xl

**5 Seiten mit toten Demo-Daten** die durch Empty-States ersetzt werden sollten.

**1 nicht-funktionaler Wizard** (SelfieAdsPlanen) der nur sessionStorage nutzt.

### Technische Umsetzung

Schritt 1: `PageShell.tsx` auf `max-w-7xl` zuruecksetzen (behebt 6 Dateien automatisch)

Schritt 2: Direkte Breiten-Korrekturen in den 9 verbleibenden Dateien

Schritt 3: Demo-Daten in Leads-Modul durch Empty-States ersetzen (optional, separater Schritt)
