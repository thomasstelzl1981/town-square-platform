
# Investment Tab: Personen-Widgets mit Depot-Status

## Was sich aendert

Oberhalb des Depot-Inhalts wird ein **WidgetGrid** mit einer Kachel pro Haushaltsperson eingefuegt. Jede Person ist klickbar. Die ausgewaehlte Person bestimmt, welcher Inhalt darunter angezeigt wird:

- **Hat Depot** (Demo: Hauptperson): Widget mit Primary-Glow, Depotwert als Subtitle. Klick zeigt das Portfolio darunter.
- **Kein Depot**: Widget ohne Glow (Standard-Card). Klick zeigt den Eroeffnungs-Wizard darunter.

Es gibt **kein leeres "Neu eroeffnen" Widget** — nur die tatsaechlich angelegten Personen erscheinen.

## Visueller Aufbau

```text
+--------------------------------------------------+
| ModulePageHeader: "Investment"                    |
+--------------------------------------------------+
| WidgetGrid (4-col)                               |
| +----------+ +----------+ +----------+           |
| | Max       | | Lisa     | | Kind 1   |           |
| | Mustermann| | Muster   | | Muster   |           |
| | 29.431 EUR| | Kein     | | Kein     |           |
| | [GLOW]    | | Depot    | | Depot    |           |
| +----------+ +----------+ +----------+           |
+--------------------------------------------------+
| (Inhalt der gewaehlten Person)                    |
| -> Max: Portfolio, Chart, Positionen ...          |
| -> Lisa: Depot-Eroeffnungs-Wizard                |
+--------------------------------------------------+
```

## Technische Umsetzung

### Datei: `src/pages/portal/finanzanalyse/InvestmentTab.tsx`

1. **Household Persons laden**: Query auf `household_persons` (gleicher Pattern wie FMUebersichtTab und VorsorgedokumenteTab)
2. **State**: `selectedPersonId` — default auf die Hauptperson (is_primary oder erstes Ergebnis)
3. **Depot-Status pro Person**: `useDemoDepot` wird erweitert um einen `personId`-Parameter. Im Demo-Modus hat nur die Hauptperson ein aktives Depot; alle anderen haben Status `'none'`
4. **WidgetGrid mit WidgetCell**: Pro Person eine Kachel mit Avatar-Icon, Name, und entweder Depotwert oder "Kein Depot"
5. **Glow**: Aktive Depots erhalten `getActiveWidgetGlow('primary')` (Primary Blue fuer Finanzen)
6. **Selektion**: Klick auf Widget setzt `selectedPersonId`, ein Ring-Indikator (`ring-2 ring-primary`) zeigt die Auswahl

### Datei: `src/hooks/useDemoDepot.ts`

- Erweitern um optionalen `personId` Parameter
- localStorage-Key wird `depot_status_{personId}` statt global
- Demo: Hauptperson hat `'active'`, alle anderen `'none'`
- `resetDepot` setzt alle zurueck

### Keine neuen Dateien noetig

Alle Aenderungen betreffen nur die zwei bestehenden Dateien. Die Depot-Komponenten (Portfolio, Wizard etc.) bleiben unveraendert.
