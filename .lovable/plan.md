

# MOD-13: Preisliste mit Wohnungsliste + Dokumenten-Kachel (verfeinert)

## Verfeinerung gegenueber dem letzten Plan

Die Spalte **Objekt-ID** (SOT-BE-*) wird als erste Spalte in die Wohnungsliste aufgenommen. Diese ID ist die interne Einheiten-ID, die per DB-Trigger automatisch bei jeder Unit-Anlage erzeugt wird. Sie ist der Schluessel fuer das Verkaufsexpose und den DMS-Ordner jeder Wohnung.

---

## Spalten der Wohnungsliste (UnitPreislisteTable)

| # | Spalte | Feld | Beschreibung |
|---|--------|------|-------------|
| 1 | **Objekt-ID** | `public_id` (SOT-BE-*) | Interne Einheiten-ID, verlinkt zur Wohnungsakte |
| 2 | WE-Nr | `unit_number` | Wohnungsnummer (WE-001 etc.) |
| 3 | Typ | `rooms` | Zimmeranzahl (1-Zi, 2-Zi etc.) |
| 4 | Etage | `floor` | Stockwerk |
| 5 | Flaeche m2 | `living_area` | Wohnflaeche |
| 6 | Jahresnetto-Kaltmiete | `current_rent * 12` | EUR/Jahr |
| 7 | Nicht umlagef. NK | `non_recoverable_costs` | Monatlich, EUR |
| 8 | Mietrendite | `(Jahresnetto / Verkaufspreis) * 100` | Individuell pro WE |
| 9 | Verkaufspreis | `sale_price` | Listenpreis EUR |
| 10 | Provision EUR | `sale_price * provision_rate` | Provision pro WE |
| 11 | EUR/m2 | `sale_price / living_area` | Quadratmeterpreis |
| 12 | Status | `reservation_status` | Ampel-Badge (frei/reserviert/verkauft) |

- **Summenzeile**: Summen fuer Flaeche, Jahresnetto, NK, Provision, Verkaufspreis + Durchschnitt Mietrendite + Durchschnitt EUR/m2
- **Klick auf Zeile**: Navigiert zu `/portal/projekte/{projectId}/einheit/{unitId}` (Verkaufsexpose)

---

## Alle Aenderungen

### 1. Projekt-Widget doppelt so breit

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`
- ProjectCard bekommt `col-span-2` im Grid

### 2. Demo-Daten erweitern

**Datei:** `src/components/projekte/demoProjectData.ts`
- `DEMO_UNITS` erhaelt zusaetzlich:
  - `public_id`: Simulierte IDs (SOT-BE-DEMO0001 bis SOT-BE-DEMO0024)
  - `annual_net_rent`: Jahresnetto-Kaltmiete
  - `non_recoverable_costs`: Nicht umlagefaehige NK (variiert 12-25 EUR/Monat)
  - `yield_percent`: Individuelle Rendite (3.6% bis 4.4%)
  - `price_per_sqm`: EUR/m2

### 3. Neue Preisliste-Tabelle

**Neue Datei:** `src/components/projekte/UnitPreislisteTable.tsx`
- Alle 12 Spalten wie oben definiert
- Objekt-ID als erste Spalte, monospace-Font, klickbar
- Summenzeile am Ende
- `isDemo` Prop fuer gedaempfte Darstellung
- Zeilen-Klick navigiert zur Unit-Detailseite

### 4. Dokumenten-Kachel

**Neue Datei:** `src/components/projekte/ProjectDMSWidget.tsx`
- DMS-Ordnerbaum aus `storage_nodes`
- Zwei Bereiche: Allgemein (Projektordner) + Einheiten (je WE)
- Drag-and-Drop via `FileDropZone`
- Im Demo-Modus: Statischer Placeholder-Baum

### 5. PortfolioTab Layout

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`
- ProjectCard mit `col-span-2`
- `UnitPreislisteTable` ersetzt `ProjectPortfolioTable`
- `ProjectDMSWidget` als eigene Kachel darunter

---

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Erstellen | `src/components/projekte/UnitPreislisteTable.tsx` |
| Erstellen | `src/components/projekte/ProjectDMSWidget.tsx` |
| Aendern | `src/components/projekte/demoProjectData.ts` |
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` |

## Risiko

Niedrig. Additive Aenderungen, keine bestehende Logik wird entfernt.

