
# Fix: Vertriebsauftrag mit Demodaten anzeigen

## Problem

Die `SalesApprovalSection` ist zwar korrekt gebaut (Agreement-Panel, Slider, Checkboxen), aber sie wird nie sichtbar, weil:
1. `dev_projects` Tabelle ist leer
2. `VertriebTab` hat keinen Demo-Fallback (anders als z.B. `PortfolioTab`)
3. Ohne `projectId` sind alle Switches disabled — der User sieht nur graue Kacheln

## Loesung

Die `VertriebTab` bekommt denselben Demo-Modus wie die anderen Tabs: Wenn keine echten Projekte existieren, werden die Demodaten aus `demoProjectData.ts` verwendet.

### Datei 1: `src/pages/portal/projekte/VertriebTab.tsx`

- `isDemoMode` und `DEMO_PROJECT` aus `demoProjectData` importieren
- Wenn `projects.length === 0`: Demo-Projekt als Fallback verwenden
- `activeProjectId` wird `DEMO_PROJECT.id` (= `'demo-project-001'`)
- `SalesApprovalSection` bekommt die Demo-Props:
  - `projectId = DEMO_PROJECT.id`
  - `projectName = 'Residenz am Stadtpark'`
  - `projectAddress = 'Am Stadtpark 12, 80331 München'`
  - `totalUnits = 24`
  - `projectVolume = 7_200_000`
- KPI-Karten zeigen ebenfalls Demo-Werte (24 Einheiten, 0 verkauft, etc.)

### Datei 2: `src/components/projekte/SalesApprovalSection.tsx`

- `hasProject`-Check entfernen — die Komponente bekommt jetzt immer gueltige Props (entweder echt oder Demo)
- Die Switches sind bedienbar, das Agreement-Panel expandiert beim Klick
- Die `activateVertriebsauftrag`-Funktion prueft weiterhin auf echte IDs — bei Demo-IDs zeigt sie einen Toast: "Im Demo-Modus nicht verfuegbar. Erstellen Sie ein echtes Projekt."
- Der volle UI-Flow (Panel expandieren, Slider bewegen, Checkboxen setzen) funktioniert auch im Demo-Modus — nur der finale "Vertrieb aktivieren"-Klick wird abgefangen

### Ergebnis

Der User sieht sofort:
- Die 3 Feature-Switches (Vertrieb, Kaufy, Landingpage)
- Kann "Vertrieb aktivieren" klicken → Panel expandiert
- Sieht Projektdaten-Box mit "Residenz am Stadtpark", 24 WE, 7.2M EUR
- Kann Provisions-Slider bewegen (3-15%)
- Kann Checkboxen setzen
- Beim finalen Klick: Toast mit Demo-Hinweis

Keine DB-Aenderungen. Nur 2 Dateien betroffen.
