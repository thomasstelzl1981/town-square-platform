

# MOD-11 Finanzierungsmanager — Tile-Restore

## Problem

Die Manifest-Konfiguration von MOD-11 wurde versehentlich geaendert: Die operativen Workflow-Tiles (Dashboard, Finanzierungsakte, Einreichung, Provisionen, Archiv) wurden in `dynamic_routes` verschoben und durch persoenliche Finanzmanagement-Tiles (Uebersicht/Investment/Sachversicherungen/Vorsorge/Abonnements) ersetzt. Diese gehoeren zu MOD-18 (Finanzen), nicht zu MOD-11.

Alle Code-Dateien sind vollstaendig erhalten — es muss nur die Manifest-Konfiguration und der Router zurueckgesetzt werden.

## Aenderungen

### 1. `src/manifests/routesManifest.ts` — MOD-11 Tiles zuruecksetzen

Aktuelle (falsche) Tiles:
```
tiles: [
  { path: "dashboard", component: "FMUebersichtTab", title: "Uebersicht", default: true },
  { path: "investment", component: "FMInvestmentTab", title: "Investment" },
  { path: "sachversicherungen", component: "FMSachversicherungenTab", title: "Sachversicherungen" },
  { path: "vorsorge", component: "FMVorsorgeTab", title: "Vorsorgevertraege" },
  { path: "abonnements", component: "FMAbonnementsTab", title: "Abonnements" },
  { path: "landing-page", component: "FMLandingPage", title: "Landing Page" },
]
```

Korrekte (alte) Tiles:
```
tiles: [
  { path: "dashboard", component: "FMDashboard", title: "Dashboard", default: true },
  { path: "finanzierungsakte", component: "FMFinanzierungsakte", title: "Finanzierungsakte" },
  { path: "einreichung", component: "FMEinreichung", title: "Einreichung" },
  { path: "provisionen", component: "FMProvisionen", title: "Provisionen" },
  { path: "archiv", component: "FMArchiv", title: "Archiv" },
  { path: "landing-page", component: "FMLandingPage", title: "Landing Page" },
]
```

Die persoenlichen Finanz-Tiles (FMUebersichtTab, FMInvestmentTab, etc.) werden in `dynamic_routes` verschoben, damit sie weiterhin erreichbar bleiben, aber nicht mehr als Hauptnavigation erscheinen.

### 2. `src/pages/portal/FinanzierungsmanagerPage.tsx` — Router anpassen

Die Route-Reihenfolge muss die operativen Seiten als Haupt-Tiles widerspiegeln:
- `dashboard` zeigt wieder `FMDashboard` (mit Cases, Mandaten, Visitenkarte, Zins-Ticker)
- `finanzierungsakte` zeigt `FMFinanzierungsakte` (Magic Intake, Split-View, Kaufy-Suche)
- `einreichung` zeigt `FMEinreichung` (Mail Manager, Europace, Bank-Submission)
- `provisionen` zeigt `FMProvisionen` (Tippgeber-Vereinbarung, Provisionshistorie)
- `archiv` zeigt `FMArchiv` (abgeschlossene Faelle)

Die persoenlichen Finanz-Tabs (uebersicht, investment, sachversicherungen, vorsorge, abonnements) bleiben als untergeordnete Routes erreichbar.

### 3. Keine Datei-Loeschungen

Alle Dateien bleiben erhalten:
- FMDashboard.tsx (531 Zeilen, operativer Dashboard mit Cases + Visitenkarte)
- FMFinanzierungsakte.tsx (619 Zeilen, Magic Intake + Split-View + Kaufy)
- FMEinreichung.tsx (851 Zeilen, Mail Manager + Europace + Bank-Submission)
- FMProvisionen.tsx (219 Zeilen, Tippgeber-Vereinbarung + Provisionshistorie)
- FMArchiv.tsx (63 Zeilen, abgeschlossene Faelle)
- FMLandingPage.tsx (24 Zeilen, Landing Page Builder Stub)
- FMUebersichtTab.tsx, FMInvestmentTab.tsx, etc. (bleiben als dynamic_routes)

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | MOD-11 tiles: 6 operative Tiles wiederherstellen |
| `src/pages/portal/FinanzierungsmanagerPage.tsx` | Router: dashboard → FMDashboard, Tile-Routes anpassen |

## Ergebnis

Nach dem Restore zeigt MOD-11 wieder die 6 operativen Tiles:
1. **Dashboard** — Faelle in Bearbeitung, Finanzierungsmandate, Visitenkarte, Zins-Ticker
2. **Finanzierungsakte** — Neue Akte anlegen (Magic Intake, Kaufy-Suche, Split-View)
3. **Einreichung** — Mail Manager, Europace-Anbindung, Bank-Submission
4. **Provisionen** — Tippgeber-Vereinbarung (25% SoT), Provisionshistorie
5. **Archiv** — Abgeschlossene/eingereichte Faelle
6. **Landing Page** — Finanzberater-Landing Page Builder

