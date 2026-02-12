
# Phase A-E: Vollstaendige Zone 2 Design-Standardisierung

## Umfang

67 Dateien nutzen noch `max-w-7xl mx-auto px-4 py-6 md:px-6` direkt statt `<PageShell>`. Davon haben ca. 40 rohe HTML-Header statt `<ModulePageHeader>`. Zusaetzlich gibt es 3 Stellen mit fehlenden Mobile-Feed-Grids und 1 Stelle mit nicht-responsivem `TableRow`.

---

## Phase A: PageShell-Migration (ca. 55 Dateien)

Ersetze alle `<div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">` durch `<PageShell>` (Import + JSX-Aenderung). Dadurch erben alle Seiten automatisch das mobile Fullscreen-Padding (`px-2 py-3 md:p-6`).

Betroffene Dateien:

**MOD-01 Stammdaten:**
- `src/pages/portal/stammdaten/ProfilTab.tsx` (Zeile 271, form-Wrapper)
- `src/pages/portal/stammdaten/AbrechnungTab.tsx` (Zeile 79)
- `src/pages/portal/stammdaten/SicherheitTab.tsx` (Zeile 79)
- `src/pages/portal/stammdaten/VertraegeTab.tsx` (Zeile 257)

**MOD-02 KI Office:**
- `src/pages/portal/office/EmailTab.tsx` (Zeile 722)
- `src/pages/portal/office/KontakteTab.tsx` (Zeile 598)
- `src/pages/portal/office/WidgetsTab.tsx` (Zeile 259)
- `src/pages/portal/office/KalenderTab.tsx` (Zeilen 171 + 318)

**MOD-03 DMS:**
- `src/pages/portal/dms/PosteingangTab.tsx` (Zeile 150)
- `src/pages/portal/dms/SortierenTab.tsx` (Zeile 283)
- `src/pages/portal/dms/EinstellungenTab.tsx` (Zeile 215)

**MOD-04 Immobilien:**
- `src/pages/portal/immobilien/PortfolioTab.tsx` (Zeile 623)
- `src/pages/portal/immobilien/KontexteTab.tsx` (Render-Section)

**MOD-05 MSV:**
- `src/pages/portal/msv/ObjekteTab.tsx` (Zeile 476)
- `src/pages/portal/msv/MieteingangTab.tsx` (Zeile 242)
- `src/pages/portal/msv/VermietungTab.tsx` (Zeile 275)
- `src/pages/portal/msv/EinstellungenTab.tsx` (Zeile 127)

**MOD-06 Verkauf:**
- `src/pages/portal/verkauf/ObjekteTab.tsx` (Render-Section)
- `src/pages/portal/verkauf/VorgaengeTab.tsx` (Zeile 292)
- `src/pages/portal/verkauf/ReportingTab.tsx` (Render-Section)
- `src/pages/portal/verkauf/AnfragenTab.tsx` (Render-Section)

**MOD-07 Finanzierung:**
- `src/pages/portal/finanzierung/AnfrageDetailPage.tsx` (Zeile 26)
- `src/pages/portal/finanzierung/SelbstauskunftTab.tsx` (Zeile 167)
- `src/pages/portal/finanzierung/AnfrageTab.tsx` (Zeile 111)

**MOD-08 Investments:**
- `src/pages/portal/investments/SucheTab.tsx` (Zeile 326)
- `src/pages/portal/investments/MandatTab.tsx` (Zeile 66)
- `src/pages/portal/investments/SimulationTab.tsx` (Zeile 150)

**MOD-09 Vertriebspartner:**
- `src/pages/portal/vertriebspartner/KatalogTab.tsx` (Zeile 337)
- `src/pages/portal/vertriebspartner/BeratungTab.tsx` (Zeile 232)
- `src/pages/portal/vertriebspartner/KundenTab.tsx` (Zeile 129)
- `src/pages/portal/vertriebspartner/NetworkTab.tsx` (Render-Section)

**MOD-10 Leads:**
- `src/pages/portal/leads/SelfieAdsPlanen.tsx` (Zeile 160)
- `src/pages/portal/leads/SelfieAdsSummary.tsx` (Zeile 68)
- `src/pages/portal/leads/SelfieAdsKampagnen.tsx` (Zeile 15)
- `src/pages/portal/leads/SelfieAdsPerformance.tsx` (Zeile 15)
- `src/pages/portal/leads/SelfieAdsAbrechnung.tsx` (Zeile 11)

**MOD-12 Akquise:**
- `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` (Zeilen 70 + 88)

**MOD-13 Projekte:**
- `src/pages/portal/projekte/ProjekteDashboard.tsx` (Zeile 158)
- `src/pages/portal/projekte/PortfolioTab.tsx` (Zeile 194)
- `src/pages/portal/projekte/MarketingTab.tsx` (Zeile 59)
- `src/pages/portal/projekte/LandingPageTab.tsx` (Zeile 88)
- `src/pages/portal/projekte/KontexteTab.tsx` (Render-Section)

**MOD-14 Communication Pro:**
- `src/pages/portal/communication-pro/SerienEmailsPage.tsx` (Zeile 93)
- `src/pages/portal/communication-pro/social/AuditPage.tsx` (Zeilen 115 + 197)
- `src/pages/portal/communication-pro/social/CalendarPage.tsx` (Zeile 107)
- `src/pages/portal/communication-pro/social/CreatePage.tsx` (Zeilen 207 + 283)
- `src/pages/portal/communication-pro/social/InspirationPage.tsx` (Zeile 161)

**MOD-16 Shops:**
- `src/pages/portal/ServicesPage.tsx` (Zeilen 123 + 388 — ShopTab und BestellungenTab)

**MOD-17 Cars:**
- `src/components/portal/cars/CarsFahrzeuge.tsx` (Zeile 158)
- `src/components/portal/cars/CarsVersicherungen.tsx` (Zeile 157)
- `src/components/portal/cars/CarsFahrtenbuch.tsx` (Zeile 173)
- `src/components/portal/cars/CarsAngebote.tsx` (Zeile 267)

**MOD-19 PV:**
- `src/pages/portal/photovoltaik/AnlagenTab.tsx` (Zeile 64)
- `src/pages/portal/photovoltaik/MonitoringTab.tsx` (Zeile 64)
- `src/pages/portal/photovoltaik/DokumenteTab.tsx` (Zeile 32)
- `src/pages/portal/photovoltaik/EinstellungenTab.tsx` (Zeile 13)

**MOD-20 Miety:**
- `src/pages/portal/miety/MietyHomeDossier.tsx` (Zeile 68)

**Sonstige:**
- `src/pages/portal/stub/ModuleStubPage.tsx` (Zeile 20)
- `src/pages/portal/AreaOverviewPage.tsx` (Zeile 65)

---

## Phase B: ModulePageHeader-Migration (ca. 35 Dateien)

Ersetze alle rohen Header-Bloecke wie:
```
<div>
  <h1 className="text-2xl font-bold tracking-tight uppercase">TITEL</h1>
  <p className="text-muted-foreground mt-1">Beschreibung</p>
</div>
```
durch:
```
<ModulePageHeader title="Titel" description="Beschreibung" />
```

Betroffene Dateien (nur die ohne ModulePageHeader):

- `ProfilTab.tsx` — "STAMMDATEN"
- `AbrechnungTab.tsx` — "ABRECHNUNG"
- `SicherheitTab.tsx` — "SICHERHEIT"
- `VertraegeTab.tsx` — "VERTRAEGE"
- `EmailTab.tsx` — "E-MAIL"
- `KontakteTab.tsx` — "KONTAKTE"
- `WidgetsTab.tsx` — "WIDGETS"
- `PosteingangTab.tsx` — "POSTEINGANG"
- `SortierenTab.tsx` — "SORTIEREN"
- `EinstellungenTab.tsx` (DMS) — Header-Bereich
- `EinstellungenTab.tsx` (MSV) — "EINSTELLUNGEN"
- `VorgaengeTab.tsx` — "VORGAENGE"
- `ReportingTab.tsx` — Header-Bereich
- `AnfragenTab.tsx` — Header-Bereich
- `SucheTab.tsx` — "INVESTMENT-SUCHE"
- `MandatTab.tsx` — Header-Bereich
- `SimulationTab.tsx` — "SIMULATION"
- `KatalogTab.tsx` — Header-Bereich
- `BeratungTab.tsx` — Header-Bereich
- `KundenTab.tsx` — wird geprueft
- `SelfieAdsPlanen.tsx` — "KAMPAGNE PLANEN"
- `SelfieAdsKampagnen.tsx` — Header-Bereich
- `SelfieAdsPerformance.tsx` — "PERFORMANCE"
- `SelfieAdsAbrechnung.tsx` — "ABRECHNUNG"
- `ProjekteDashboard.tsx` — "PROJEKTE"
- `PortfolioTab.tsx` (Projekte) — Header-Bereich
- `MarketingTab.tsx` — Header-Bereich
- `LandingPageTab.tsx` — "LANDING PAGE"
- `SerienEmailsPage.tsx` — Header-Bereich
- `AuditPage.tsx` — "PERSOENLICHKEITS-AUDIT"
- `CalendarPage.tsx` — "KALENDER & PLANUNG"
- `CreatePage.tsx` — Header-Bereich
- `InspirationPage.tsx` — Header-Bereich
- `ServicesPage.tsx` — "SHOPS" + Bestellungen-Header
- `CarsFahrzeuge.tsx` — "FAHRZEUGE"
- `AnlagenTab.tsx` — "ANLAGEN"

Aenderung pro Datei:
1. `import { PageShell, ModulePageHeader } from '@/components/shared'`
2. Header-Block durch `<ModulePageHeader title="..." description="..." actions={...} />` ersetzen

---

## Phase C: Mobile Feed-Grids (5 Dateien)

Restliche Grids ohne Mobile-Feed-Pattern (`flex flex-col gap-3 sm:grid`) umstellen:

1. **`AkquiseManagerPage.tsx`** (Dashboard Case-Grid, ca. Zeile 100)
   - Von: `grid grid-cols-2 md:grid-cols-4 gap-4`
   - Zu: `flex flex-col gap-3 sm:grid sm:grid-cols-2 md:grid-cols-4 sm:gap-4`

2. **`ServicesPage.tsx`** (Produkt-Grid)
   - Von: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4`
   - Zu: `flex flex-col gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-4`

3. **`KatalogTab.tsx`** (Vertriebspartner Katalog-Cards)
   - Grid auf Mobile-Feed-Pattern umstellen

4. **`AnlagenTab.tsx`** (PV-Anlagen Tabelle/Cards)
   - Tabelle wird auf Mobile zu Card-Stack

5. **`CarsFahrzeuge.tsx`** (Fahrzeug-Cards)
   - Grid auf Mobile-Feed-Pattern umstellen

---

## Phase D: TableRow-Responsiveness (3 Dateien)

Stellen mit `grid-cols-[180px_1fr]` ohne mobile Responsiveness:

1. **`AkquiseManagerPage.tsx`** Zeile 338-344 — `TableRow` Komponente
   - Von: `grid grid-cols-[180px_1fr] px-4 py-2 text-sm`
   - Zu: `flex flex-col gap-0.5 md:grid md:grid-cols-[180px_1fr] px-4 py-2 text-sm`

2. **`ObjekteingangDetail.tsx`** — aehnliche Stellen pruefen und anpassen

3. **`SanierungDetail.tsx`** — bereits umgesetzt (Verifizierung)

---

## Phase E: Workflow-Stepper (optional, 3-4 Module)

Fuer Module mit erkennbaren Workflow-Pfaden, die noch keine Stepper oder Widget-Kacheln haben:

### MOD-13 Projekte
- Projektkarten im Dashboard koennten als Widget-Kacheln (analog `ServiceCaseCard`) dargestellt werden
- Projektphasen (Planung, Vertrieb, Vermarktung, Abschluss) als horizontaler Stepper im Projekt-Detail

### MOD-17 Cars
- Fahrzeug-Cards als Widget-Kacheln (Kennzeichen, Marke, Status-Badge)
- Versicherungs-Workflow: Stepper fuer Angebot > Vergleich > Abschluss

### MOD-19 PV
- Anlagen-Dashboard: Widget-Kacheln pro Anlage (kW, Status, Live-Ertrag)
- Installations-Workflow: Stepper fuer Planung > Genehmigung > Installation > Inbetriebnahme

### MOD-08 Investments
- Mandat-Flow: Stepper fuer Suchprofil > Matching > Besichtigung > Kaufangebot

---

## Implementierungsreihenfolge

Da Phase A und B rein mechanisch sind (Suchen-und-Ersetzen), werden sie zuerst umgesetzt. Phase C und D sind gezielte CSS-Aenderungen. Phase E wird inline mit den anderen Phasen umgesetzt wo es sich anbietet.

Die Umsetzung erfolgt in Chargen von ~15 Dateien pro Nachricht, um Build-Stabilitaet zu gewaehrleisten:

1. **Charge 1**: MOD-01, MOD-02, MOD-03 (ca. 11 Dateien)
2. **Charge 2**: MOD-04, MOD-05, MOD-06, MOD-07 (ca. 12 Dateien)
3. **Charge 3**: MOD-08, MOD-09, MOD-10, MOD-12 (ca. 10 Dateien)
4. **Charge 4**: MOD-13, MOD-14, MOD-16 (ca. 10 Dateien)
5. **Charge 5**: MOD-17, MOD-19, MOD-20, Sonstige + Phase C/D/E (ca. 12 Dateien)

### Keine Datenbank-Aenderungen noetig

Reines Frontend-Refactoring. Desktop-Verhalten bleibt vollstaendig unveraendert. Alle Aenderungen sind CSS-Klassen und Import-Ersetzungen.
