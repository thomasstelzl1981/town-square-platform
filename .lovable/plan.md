

## Umbau Investment-Tab: Neue Reihenfolge und Armstrong Depot Sektion

### Neue Layout-Reihenfolge

```text
+--------------------------------------------------+
| ModulePageHeader: "Investment"                    |
+--------------------------------------------------+
| 1. Personen-Widgets (WidgetGrid)                  |
|    [Max] [Lisa] [Kind 1] ...                      |
+--------------------------------------------------+
| 2. Investment-Sparplaene (bestehende Vertraege)   |
|    ModulePageHeader "Investment-Sparplaene"        |
|    WidgetGrid mit Sparplan-Kacheln + Detail-Flow   |
+--------------------------------------------------+
| 3. Armstrong Depot (NEU)                          |
|    ModulePageHeader "Armstrong Depot"              |
|    Sub: "Investieren Sie direkt aus Ihrem Portal"  |
|                                                    |
|    Info-Card mit Upvest-Vorteilen:                 |
|    - BaFin-reguliert (WpIG-Lizenz)                |
|    - Depot in Sekunden eroeffnen                   |
|    - Aktien, ETFs, Fonds, Crypto                   |
|    - Automatische Sparplaene                       |
|    - Fractional Trading (Bruchstuecke)             |
|    - Digitale Steuerreports                        |
|                                                    |
|    Personen-Depot-Status + Onboarding/Portfolio    |
+--------------------------------------------------+
```

### Aenderungen im Detail

**Datei: `src/pages/portal/finanzanalyse/InvestmentTab.tsx`**

1. **Oberer Header** bleibt "Investment" (uebergeordnet)
2. **Personen-WidgetGrid** bleibt an Position 1 (unveraendert)
3. **Investment-Sparplaene Sektion** wird von unten nach Position 2 verschoben (direkt nach Personen)
4. **Neue Sektion "Armstrong Depot"** wird als dritter Block eingefuegt:
   - `ModulePageHeader` mit Titel "Armstrong Depot" und Beschreibung
   - Eine `InfoBanner` oder `Card` mit Upvest-Vorteilen (6 Punkte mit Icons: Shield, Zap, BarChart3, PiggyBank, Puzzle, FileText)
   - Beschreibungstext basierend auf Upvest-Website:
     > "Mit dem Armstrong Depot investieren Sie direkt aus Ihrem Portal -- powered by Upvest. Die BaFin-regulierte Infrastruktur ermoeglicht sekundenschnelle Depoteroeffnung, Zugang zu Tausenden von Aktien, ETFs und Fonds, automatische Sparplaene und Fractional Trading. Ihre Wertpapiere werden sicher verwahrt, Steuerreports digital erstellt. Kein separates Bankkonto, kein Papierkram."
   - Darunter der bestehende Depot-Content (Onboarding-Wizard bzw. Portfolio-Ansicht) fuer die ausgewaehlte Person

### Technisch

- Nur eine Datei wird geaendert: `InvestmentTab.tsx`
- Die Depot-Status-Logik (Onboarding/Active) bleibt identisch, wird nur unterhalb der Armstrong-Depot-Ueberschrift platziert
- Upvest-Vorteile als kompakte 3x2 Grid-Icons innerhalb einer Card
- Verwendet bestehende Komponenten: `ModulePageHeader`, `InfoBanner`, `Card`, lucide Icons

