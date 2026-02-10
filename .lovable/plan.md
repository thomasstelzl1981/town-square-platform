

# MOD-13: Musterdaten-Anzeige bei leerem State

## Ziel

Wenn keine echten Projekte vorhanden sind, wird ein vollstaendiges **Demo-Projekt mit 24 Wohnungen** in abgeschwächtem Grau angezeigt. Alle Widgets, Tabellen, Cards und der Kalkulator zeigen realistische Musterdaten. Sobald ein echtes Projekt angelegt wird (Magic Intake oder manuell), verschwinden die Musterdaten komplett.

## Demo-Projekt Definition

| Feld | Wert |
|------|------|
| Name | Residenz am Stadtpark |
| Stadt | 80331 Muenchen |
| Typ | Aufteilung |
| Einheiten | 24 WE |
| Mietrendite | 4,0% |
| Erwerbsnebenkosten (AV) | 2,0% |
| Gebaeudeanteil | 80% |
| Kaufpreis gesamt | 4.800.000 EUR |
| Verkaufsziel gesamt | 7.200.000 EUR |
| Provision | 10% |
| Zielmarge | 20% |

**24 Demo-Wohnungen** (WE-001 bis WE-024):
- Mischung aus 1-Zi (30m2), 2-Zi (55m2), 3-Zi (75m2), 4-Zi (95m2)
- Kaltmiete abgeleitet aus 4% Rendite auf anteiligen Kaufpreis
- Verkaufspreis pro WE anteilig nach Flaeche
- Alle Status "frei" (gruen)
- Provision EUR pro WE berechnet

Die Tabelle zeigt alle 24 Zeilen mit Summenzeile am Ende.

## Aenderungen

### 1. Neue Datei: Demo-Daten-Konstanten

**`src/components/projekte/demoProjectData.ts`**

Exportiert:
- `DEMO_PROJECT`: Ein `ProjectPortfolioRow`-kompatibles Objekt mit allen Feldern
- `DEMO_UNITS`: Array mit 24 Unit-Objekten (WE-Nr, Typ, Etage, Flaeche, Miete, Verkaufspreis, Provision, Status)
- `DEMO_CALC`: Kalkulationswerte (4% Rendite, 2% AV, 80% Gebaeudeanteil)
- `isDemoMode(portfolioRows)`: Helper-Funktion die `true` zurueckgibt wenn `portfolioRows.length === 0`

### 2. Dashboard (ProjekteDashboard.tsx)

- **Stats-Cards (W3):** Wenn `isDemoMode`: Demo-Werte anzeigen (24 Einheiten, 0 verkauft, 0% Quote, EUR 0 Umsatz IST) -- in `text-muted-foreground/50` Farbe
- **Projekt-Cards (W3b):** Statt `ProjectCardPlaceholder` wird eine echte `ProjectCard` mit `DEMO_PROJECT` gerendert, aber mit `opacity-50` und einem "Musterdaten"-Badge
- **Kalkulations-Preview (W4):** Demo-Werte aus `DEMO_CALC` (4% Rendite, 2% AV, 80% Gebaeudeanteil, EUR 300.000 Verkaufsziel/WE)
- **Reservierungen (W5):** Bleibt wie jetzt (0/0/24 Placeholder)

### 3. Projekte-Tab (PortfolioTab.tsx)

- Wenn `isDemoMode`:
  - **Projekt-Widgets oben:** Ein einzelner Demo-ProjectCard mit `opacity-50` + "Musterdaten"-Badge
  - **Tabelle:** `ProjectPortfolioTable` erhaelt die `DEMO_UNITS` als Rows, gerendert mit `opacity-40 pointer-events-none` CSS-Klasse
  - Die Tabelle zeigt alle 24 Zeilen + Summenzeile mit echten berechneten Summen
  - **Sticky-Kalkulator:** Erhaelt die Demo-Werte aus `DEMO_CALC`

### 4. ProjectPortfolioTable (ProjectPortfolioTable.tsx)

- Neues Prop `isDemo?: boolean`
- Wenn `isDemo`: Gesamte Tabelle erhaelt `opacity-40` und `select-none pointer-events-none` Klassen
- Der "Keine Projekte vorhanden" EmptyState bei `rows.length === 0` wird ENTFERNT (wird nie mehr getriggert, weil immer Demo-Daten uebergeben werden)
- Die Summenzeile zeigt "Musterdaten" Hinweis wenn `isDemo`

### 5. ProjectCard + StickyCalculatorPanel

- `ProjectCard`: Neues optionales Prop `isDemo?: boolean` -- rendert mit `opacity-50` und deaktiviertem onClick
- `StickyCalculatorPanel`: `isDemo` Badge ist bereits vorhanden, keine Aenderung noetig

## Verhalten beim Anlegen eines echten Projekts

Sobald `portfolioRows.length > 0` (ein echtes Projekt existiert):
- `isDemoMode()` gibt `false` zurueck
- Alle Demo-Daten verschwinden sofort
- Echte Daten werden angezeigt
- Storage-Tree und IDs werden NUR fuer echte Projekte erzeugt (kein DMS-Seeding fuer Demo)

## Betroffene Dateien

| Aktion | Datei | Aenderung |
|--------|-------|-----------|
| Erstellen | `src/components/projekte/demoProjectData.ts` | Demo-Konstanten + isDemoMode Helper |
| Aendern | `src/pages/portal/projekte/ProjekteDashboard.tsx` | Demo-Daten in W3, W3b, W4 einbinden |
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` | Demo-Daten in Widgets + Tabelle einbinden |
| Aendern | `src/components/projekte/ProjectPortfolioTable.tsx` | `isDemo` Prop, EmptyState entfernen |
| Aendern | `src/components/projekte/ProjectCard.tsx` | `isDemo` Prop fuer gedaempfte Darstellung |

## Risiko

Kein Risiko. Reine UI-Aenderung mit statischen Konstanten. Keine DB-Aenderungen, keine Logik-Aenderungen. Demo-Daten werden nie persistiert.

