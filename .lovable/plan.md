

## Fix: Doppelte Investment-Depots in Demodaten entfernen

### Problem

Im Investment-Tab werden 4 Kacheln angezeigt statt 2:

| Nr | Quelle | Tabelle | Person |
|----|--------|---------|--------|
| 1 | Vanguard ETF-Sparplan | `vorsorge_contracts` (category=investment) | Max |
| 2 | DWS Fonds-Sparplan | `vorsorge_contracts` (category=investment) | Lisa |
| 3 | ETF-Depot Scalable Capital | `finapi_depot_accounts` | Max |
| 4 | Fonds-Depot DWS | `finapi_depot_accounts` | Lisa |

Kacheln 1+2 (gruene Demo-Badges) sind die korrekten Demodaten aus der CSV.
Kacheln 3+4 (ohne Demo-Badge, daher nicht gruen) sind Duplikate, die separat ueber `seedInvestmentDepots` in die `finapi_depot_accounts`-Tabelle geschrieben werden.

Die `finapi_depot_accounts`-Tabelle ist fuer echte FinAPI-Bank-Anbindungen gedacht, nicht fuer Demo-Sparplaene. Die Demo-Investment-Daten gehoeren ausschliesslich in `vorsorge_contracts`.

### Loesung

Die gesamte `seedInvestmentDepots`-Funktion und ihre Aufrufe entfernen. Die 2 vorsorge_contracts mit `category='investment'` bleiben als einzige Quelle.

### Aenderungen

**Datei 1: `src/hooks/useDemoSeedEngine.ts`**

| Nr | Was |
|----|-----|
| 1 | `seedInvestmentDepots`-Funktion komplett entfernen (Zeilen 383-449) |
| 2 | Aufruf `seed('finapi_depot_accounts', ...)` entfernen (Zeile 1069) |
| 3 | Target-Counts aktualisieren: `finapi_depot_accounts: 0, finapi_depot_positions: 0` entfernen (Zeile 1097) |

**Datei 2: `src/hooks/useDemoCleanup.ts`**

| Nr | Was |
|----|-----|
| 4 | `finapi_depot_positions` und `finapi_depot_accounts` aus der Cleanup-Liste entfernen (Zeilen 41-42) |

**Datenbank: Bestehende Demo-Eintraege bereinigen**

Die bereits geseedeten Eintraege muessen geloescht werden:
- `finapi_depot_positions` mit IDs `d0000000-0000-4000-a000-00000000071*` und `d0000000-0000-4000-a000-00000000072*`
- `finapi_depot_accounts` mit IDs `d0000000-0000-4000-a000-000000000701` und `d0000000-0000-4000-a000-000000000702`
- `test_data_registry`-Eintraege fuer beide Entity-Types

Das geschieht am einfachsten ueber einen erneuten Demo-Cleanup im Admin-Panel, oder manuell per SQL.

### Ergebnis

Nach dem Fix:
- Investment-Tab zeigt nur noch 2 Kacheln (die gruenen Demo-Sparplaene)
- FinAPI-Depot-Bereich bleibt leer bis ein Nutzer eine echte Bank anbindet
- Demo-Seed und -Cleanup sind konsistent

### Was NICHT geaendert wird

- `vorsorge_contracts` CSV (bleibt mit den 2 Investment-Eintraegen)
- `finapi_depot_accounts`/`finapi_depot_positions` Tabellen-Schema (bleiben fuer echte Anbindungen)
- Frontend-Code in InvestmentTab.tsx (zeigt korrekt an, was in der DB ist)

