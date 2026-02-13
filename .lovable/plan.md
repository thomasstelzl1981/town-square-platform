

# Reparaturplan: Portfolio Demo-Akte, Alt-Daten-Bereinigung & Demo-Widget-Styling

## Problemanalyse

### 1. Demo-Akte fehlt
Das Demo-Widget "Vermietereinheit Berlin" zeigt beim Klick nur ein einfaches Inline-Detail mit 4 StatCards und einer Mini-Tabelle (3 Zeilen). Es fehlt die vollstaendige **Immobilienakte** (UnitDossierView) mit allen Bloecken (Identity, CoreData, Tenancy, NK/WEG, Finanzierung, Legal, Investment KPIs, Dokumente). Stattdessen navigiert der Klick auf eine echte Unit zur echten `PropertyDetailPage`, die Daten aus der DB laedt.

### 2. Alt-Daten in der Datenbank
Folgende Seed-Daten existieren und sollen entfernt werden:
- **Property "Leipzig"**: `id=00000000-0000-4000-a000-000000000001`, code `DEMO-001`, Blochmannstrasse Leipzig
- **Landlord Context "Familie Mustermann"**: `id=00000000-0000-4000-a000-000000000110`, context_type PRIVATE

### 3. Demo-Widgets ohne visuelle Unterscheidung
Alle Demo-Widgets nutzen aktuell nur ein kleines "Demo"-Badge, sind aber optisch identisch zu echten Widgets.

---

## Loesung

### Phase 1: Demo-Immobilienakte mit hartcodierten Daten (PortfolioTab.tsx)

Das Inline-Detail fuer `selectedDemoId === '__demo__'` wird ersetzt durch eine vollstaendige `UnitDossierView` mit hartcodierten Demo-Daten:

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

- Import `UnitDossierView` aus `@/components/immobilienakte`
- Erstelle ein `DEMO_DOSSIER_DATA` Objekt vom Typ `UnitDossierData` mit realistischen, fiktiven Berliner Daten:
  - Unit "WE-B01", Schadowstr. 12, 10117 Berlin
  - 3 Einheiten, Baujahr 1912, Zentralheizung/Gas
  - Mieter "Schmidt", 850 EUR kalt, 1.150 EUR warm
  - WEG mit MEA 125/1000, Hausgeld 380 EUR
  - Finanzierung: Sparkasse Berlin, 520.000 EUR Restschuld, 2,8%
  - Investment KPIs: Kaufpreis 750k, Verkehrswert 850k, 3,95% Bruttorendite
  - Dokumente: 8 Positionen (mix aus complete/missing/review)
- Rendere `<UnitDossierView data={DEMO_DOSSIER_DATA} />` anstelle der aktuellen StatCards + Mini-Tabelle

### Phase 2: Glasig-gruenes Demo-Widget-Styling

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx` (und analog in allen anderen Modulen mit Demo-Widgets)

CSS-Klassen fuer Demo-Widgets:
```text
bg-emerald-50/40 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-800/40
```
Plus ein gruener Shimmer/Gradient am oberen Rand:
```text
before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-emerald-300/60 before:via-emerald-400/40 before:to-emerald-300/60 before:rounded-t-xl
```

Betroffene Dateien (alle Demo-Widgets):
- `src/pages/portal/immobilien/PortfolioTab.tsx`
- `src/pages/portal/immobilien/SanierungTab.tsx`
- `src/components/finanzierung/FinanceRequestWidgets.tsx`
- `src/components/privatkredit/ConsumerLoanWidgets.tsx`
- `src/pages/portal/investments/SimulationTab.tsx`
- `src/pages/portal/investments/MandatTab.tsx`
- `src/pages/portal/finanzierungsmanager/FMDashboard.tsx`
- `src/pages/portal/akquise-manager/AkquiseMandate.tsx`
- `src/pages/portal/projekte/ProjekteDashboard.tsx`
- `src/pages/portal/photovoltaik/AnlagenTab.tsx`
- `src/pages/portal/communication-pro/SerienEmailsPage.tsx`
- `src/components/portal/cars/CarsFahrzeuge.tsx`

Optionale Zentralisierung: Eine Shared-Konstante `DEMO_WIDGET_CLASSES` im `designManifest.ts` anlegen, damit alle Module einheitlich stylen.

### Phase 3: Alt-Daten loeschen (DB-Migration)

**SQL-Migration** (nach Fertigstellung von Phase 1+2):

```text
-- Reihenfolge beachten wegen Foreign Keys:
1. DELETE FROM document_links WHERE property_id = '00000000-...-000000000001'
2. DELETE FROM leases WHERE property_id (via unit)
3. DELETE FROM loans WHERE property_id = '...'
4. DELETE FROM units WHERE property_id = '...'
5. DELETE FROM context_property_assignment WHERE property_id = '...' OR context_id = '...-110'
6. DELETE FROM properties WHERE id = '00000000-...-000000000001'
7. DELETE FROM landlord_contexts WHERE id = '00000000-...-000000000110'
```

Vor der Migration wird geprueft, ob weitere abhaengige Tabellen referenziert werden (property_accounting, property_valuations, etc.).

---

## Technische Details

### Neue Konstanten
- `DEMO_DOSSIER_DATA: UnitDossierData` — hartcodierte Demo-Akte fuer Berlin
- `DESIGN.DEMO_WIDGET` — zentrales Styling-Token in designManifest.ts

### Geaenderte Dateien
1. `src/config/designManifest.ts` — neuer DEMO_WIDGET Token
2. `src/pages/portal/immobilien/PortfolioTab.tsx` — Demo-Akte + Styling
3. 11 weitere Modul-Dateien — Demo-Widget-Styling anpassen
4. 1 DB-Migration — Alt-Daten loeschen

### Reihenfolge
1. Design-Manifest erweitern (DEMO_WIDGET Token)
2. Portfolio Demo-Akte implementieren + gruenes Styling
3. Gruenes Styling auf alle 12 Module ausrollen
4. DB-Migration: Leipzig-Property + Familie Mustermann loeschen

