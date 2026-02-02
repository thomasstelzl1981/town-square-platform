# MOD-18: Finanzanalyse

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/finanzanalyse` |
| **Icon** | `LineChart` |
| **Org-Types** | `client` |
| **Default Visible** | Ja |
| **Display Order** | 18 |

## Beschreibung

Das Finanzanalyse-Modul bietet umfassende Finanzberichte und Szenario-Analysen für Immobilien-Portfolios, Cashflow-Prognosen und Investitionsentscheidungen.

## Tiles (4-Tile-Pattern)

### 1. Dashboard
- **Route:** `/portal/finanzanalyse/dashboard`
- **Beschreibung:** Finanz-Übersicht
- **Metriken:**
  - Portfolio-Wert
  - Mieteinnahmen (YTD)
  - Cashflow-Trend
  - Rendite-KPIs

### 2. Reports
- **Route:** `/portal/finanzanalyse/reports`
- **Beschreibung:** Finanzberichte
- **Report-Typen:**
  - Gewinn- & Verlustrechnung
  - Cashflow-Statement
  - Vermögensaufstellung
  - Steuer-Vorschau

### 3. Szenarien
- **Route:** `/portal/finanzanalyse/szenarien`
- **Beschreibung:** Was-wäre-wenn Analysen
- **Funktionen:**
  - Zins-Sensitivität
  - Mietentwicklung
  - Verkaufs-Szenarien
  - Sanierungs-ROI

### 4. Einstellungen
- **Route:** `/portal/finanzanalyse/einstellungen`
- **Beschreibung:** Analyse-Parameter
- **Funktionen:**
  - Steuersätze
  - Inflationsannahmen
  - Benchmark-Definitionen

## Datenmodell

### Datenquellen
- `properties` — Objektdaten aus MOD-04
- `leases` — Mietverhältnisse aus MOD-05
- `property_loans` — Finanzierungen
- `bank_transactions` — Zahlungen

### Berechnete Werte
- Investment-Engine für 40-Jahres-Projektion
- Steuerberechnung inkl. AfA
- Cashflow-Modellierung

## Integration

### Abhängigkeiten
- **MOD-04 (Immobilien):** Objektdaten
- **MOD-05 (MSV):** Mieteinnahmen
- **MOD-08 (Investments):** Investment-Engine
