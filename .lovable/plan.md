

# CI-Erweiterung: Aktive Widgets mit farbigem Glow

## Analyse: Wo werden WidgetGrids in Zone 2 verwendet?

Insgesamt nutzen **25+ Dateien** in Zone 2 das `WidgetGrid` + `WidgetCell` Pattern. Hier die vollstaendige Uebersicht:

| Modul | Datei(en) | Widget-Typen |
|-------|-----------|-------------|
| MOD-04 Portfolio | `PortfolioTab.tsx` | Kontext-Widgets (Vermietereinheiten), CTA "Neue Einheit" |
| MOD-04 Sanierung | `SanierungTab.tsx` | Demo, Sanierungs-Cases, CTA |
| MOD-07 Privatkredit | `ConsumerLoanWidgets.tsx` | Demo, Antraege, CTA |
| MOD-08 Suche/Katalog | `KatalogTab.tsx` | Media-Widgets (Praesentationen) |
| MOD-08 Simulation | `SimulationTab.tsx` | Demo |
| MOD-08 Mandat | `MandatTab.tsx` | Demo, Mandate, CTA |
| MOD-09 Beratung | `BeratungTab.tsx` | Media-Widgets (Praesentationen) |
| MOD-10 Finanzierung | `FinanceRequestWidgets.tsx`, `StatusTab.tsx` | Demo, Antraege, CTA |
| MOD-11 FM | `FMDashboard.tsx`, `FMFinanzierungsakte.tsx` | Demo, Faelle, CTA, Mandate |
| MOD-12 AM | `AkquiseDashboard.tsx`, `ObjekteingangList.tsx`, `AkquiseMandateDetail.tsx` | Mandate, CTA, Objekteingang |
| MOD-13 Projekte | `ProjekteDashboard.tsx`, `LandingPageTab.tsx` | Demo, Projekte, CTA |
| MOD-14 CommunicationPro | `SerienEmailsPage.tsx`, `ResearchTab.tsx` | Demo, Orders, CTA |
| MOD-15 Services | `BestellungenTab.tsx` | Orders, CTA |
| Leads | `LeadsDashboard.tsx` | Lead-Cards |
| Cars/Fuhrpark | `CarsAutos.tsx`, `CarsFahrzeuge.tsx` | Fahrzeug-Widgets |

## Aktueller Zustand

- **Demo-Widgets**: Haben bereits einen eigenen Glow (smaragdgruen, via `DEMO_WIDGET.CARD`)
- **CTA-Widgets** ("Neu anlegen"): Nutzen `border-dashed` — kein Glow (korrekt, bleiben so)
- **Leere/Platzhalter-Widgets**: `border-dashed opacity-50` — kein Glow (korrekt)
- **Aktive Widgets** (mit Inhalt/Funktion): Haben aktuell **keinen Glow** — nur `glass-card` + `hover:shadow-lg`
- **Media-Widgets**: Haben bereits einen Primary-Glow (`hover:shadow-primary/20`)

## Loesung: `ACTIVE_WIDGET` Token im Design Manifest

### Prinzip

Ein neues `ACTIVE_WIDGET` Design-Token im `designManifest.ts` definiert verschiedene Glow-Farben. Jedes Modul waehlt eine Farbe, sodass innerhalb einer Ansicht **keine Farbe doppelt** vorkommt.

### Farbpalette (8 Glow-Varianten)

```text
Farbe         | Verwendung (Beispiel)
------------- | ---------------------
primary/blue  | Finanzierung, FM-Faelle
emerald       | (reserviert fuer Demo-Widgets — nicht verwenden)
amber         | Projekte, Portfolio-Kontexte
cyan          | AkquiseManager-Mandate
violet        | CommunicationPro, Serien-E-Mails
rose          | Leads
orange        | Sanierung, Privatkredit
teal          | Services, Bestellungen
```

### Technisches Design-Token

Neuer Export in `designManifest.ts`:

```text
ACTIVE_WIDGET = {
  // Varianten — jede erzeugt einen subtilen Glow via border + shadow + top-shimmer
  primary:  border-primary/30 shadow-[0_0_15px_-3px] shadow-primary/15 + shimmer-stripe
  amber:    border-amber-400/30 shadow-amber-400/15 + shimmer
  cyan:     border-cyan-400/30 shadow-cyan-400/15 + shimmer
  violet:   border-violet-400/30 shadow-violet-400/15 + shimmer
  rose:     border-rose-400/30 shadow-rose-400/15 + shimmer
  orange:   border-orange-400/30 shadow-orange-400/15 + shimmer
  teal:     border-teal-400/30 shadow-teal-400/15 + shimmer
}
```

Jede Variante besteht aus:
1. **Border-Tint**: `border-{color}/30` (subtil sichtbar)
2. **Box-Shadow-Glow**: `shadow-[0_0_15px_-3px] shadow-{color}/15` (weiches Leuchten)
3. **Shimmer-Stripe** am oberen Rand: `before:bg-gradient-to-r from-{color}/40 via-{color}/60 to-{color}/40`

### Helper-Funktion

Eine Funktion `getActiveWidgetGlow(variant)` gibt die vollstaendige Klassenkette zurueck, damit man in den Modulen einfach schreiben kann:

```text
<Card className={cn("h-full cursor-pointer", getActiveWidgetGlow('amber'))}>
```

## Aenderungen pro Modul

| Modul | Glow-Farbe | Betroffene Widgets |
|-------|-----------|-------------------|
| MOD-04 Portfolio (`PortfolioTab.tsx`) | amber | Kontext-Widgets (Vermietereinheiten) |
| MOD-04 Sanierung (`SanierungTab.tsx`) | orange | Sanierungs-Cases |
| MOD-07 Privatkredit (`ConsumerLoanWidgets.tsx`) | orange | Kredit-Antraege |
| MOD-08 Mandat (`MandatTab.tsx`) | amber | Mandate |
| MOD-10 Finanzierung (`FinanceRequestWidgets.tsx`) | primary | Finanzierungsantraege |
| MOD-11 FM (`FMDashboard.tsx`) | primary | Aktive Faelle + Mandate |
| MOD-12 AM (`AkquiseDashboard.tsx`) | cyan | Aktive + Pending Mandate |
| MOD-12 AM (`ObjekteingangList.tsx`) | cyan | Mandate-Widgets |
| MOD-13 Projekte (`ProjekteDashboard.tsx`) | amber | Projekt-Widgets |
| MOD-13 Projekte (`LandingPageTab.tsx`) | amber | Landing-Page-Widgets |
| MOD-14 Serien-E-Mails (`SerienEmailsPage.tsx`) | violet | Kampagnen-Widgets |
| MOD-14 Recherche (`ResearchTab.tsx`) | violet | Research-Orders |
| MOD-15 Services (`BestellungenTab.tsx`) | teal | Bestell-Widgets |
| Leads | rose | Lead-Cards |
| Cars (`CarsAutos.tsx`, `CarsFahrzeuge.tsx`) | teal | Fahrzeug-Widgets |

### Was KEINEN Glow bekommt

- **Demo-Widgets**: Behalten ihren eigenen `DEMO_WIDGET.CARD` Emerald-Glow
- **CTA-Widgets** (border-dashed, "Neu anlegen"): Kein Glow — bleiben dezent
- **Leere Platzhalter** (opacity-50, border-dashed): Kein Glow
- **Bereits aktiv selektierte Widgets** (`ring-2 ring-primary`): Behalten ihren Selektions-Ring

## Dateien

### Geaenderte Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/config/designManifest.ts` | Neues `ACTIVE_WIDGET` Token mit 7 Farbvarianten + Helper-Funktion |
| `src/pages/portal/projekte/ProjekteDashboard.tsx` | Amber-Glow auf Projekt-Widgets |
| `src/pages/portal/projekte/LandingPageTab.tsx` | Amber-Glow auf Landing-Page-Widgets |
| `src/pages/portal/projekte/PortfolioTab.tsx` | Amber-Glow auf Kontext-Widgets |
| `src/pages/portal/immobilien/SanierungTab.tsx` | Orange-Glow auf Sanierungs-Cases |
| `src/pages/portal/finanzierung/StatusTab.tsx` | Primary-Glow auf Antraege |
| `src/components/finanzierung/FinanceRequestWidgets.tsx` | Primary-Glow auf Antraege |
| `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` | Primary-Glow auf Faelle |
| `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx` | Primary-Glow auf Faelle |
| `src/pages/portal/akquise-manager/AkquiseDashboard.tsx` | Cyan-Glow auf Mandate |
| `src/pages/portal/akquise-manager/ObjekteingangList.tsx` | Cyan-Glow auf Mandate |
| `src/pages/portal/akquise-manager/AkquiseMandateDetail.tsx` | Cyan-Glow auf Mandate |
| `src/pages/portal/investments/MandatTab.tsx` | Amber-Glow auf Mandate |
| `src/pages/portal/communication-pro/SerienEmailsPage.tsx` | Violet-Glow auf Kampagnen |
| `src/pages/portal/communication-pro/recherche/ResearchTab.tsx` | Violet-Glow auf Orders |
| `src/pages/portal/communication-pro/recherche/ResearchOrderWidget.tsx` | Violet-Glow auf Order-Cards |
| `src/pages/portal/services/BestellungenTab.tsx` | Teal-Glow auf Bestellungen |
| `src/components/privatkredit/ConsumerLoanWidgets.tsx` | Orange-Glow auf Antraege |
| `src/components/portal/cars/CarsAutos.tsx` | Teal-Glow auf Fahrzeuge |
| `src/components/portal/cars/CarsFahrzeuge.tsx` | Teal-Glow auf Fahrzeuge |

### Keine DB-Migration noetig

Rein visuelle Aenderung — ausschliesslich CSS-Klassen.

