
# Demo-Daten Korrektur und Tab-Erweiterung: Vorsorge vs. Investment

## Phase 1: Demo-Daten Kategorie-Anpassung

### Problem
Die zwei Fonds-Sparplaene (DWS Riester-Rente und Vanguard ETF-Sparplan) sind aktuell unter `DEMO_VORSORGE` eingeordnet. Logisch gehoeren sie als Investment-Sparplaene in die Investment-Kategorie.

### Loesung: Neues DB-Feld `category`

Eine neue Spalte `category` in `vorsorge_contracts` trennt sauber:

| Wert | Bedeutung | Beispiele |
|---|---|---|
| `vorsorge` (Default) | Renten-/Altersvorsorge | Ruerup, bAV, Versorgungswerk |
| `investment` | Investment-Sparplaene | ETF-Sparplan, Fonds-Sparplan |

**SQL Migration:**
- `ALTER TABLE vorsorge_contracts ADD COLUMN category text NOT NULL DEFAULT 'vorsorge';`
- `ALTER TABLE vorsorge_contracts ADD COLUMN current_balance numeric DEFAULT NULL;`
- `ALTER TABLE vorsorge_contracts ADD COLUMN balance_date date DEFAULT NULL;`

### Demo-Daten Update (`src/engines/demoData/data.ts` + `spec.ts`)

Das `DemoVorsorgeContract` Interface erhaelt ein neues Feld `category`:
- Ruerup (ID_VS_RUERUP): `category: 'vorsorge'` -- bleibt
- bAV (ID_VS_BAV): `category: 'vorsorge'` -- bleibt
- DWS Riester (ID_VS_RIESTER): `category: 'investment'` -- verschoben
- Vanguard ETF (ID_VS_ETF): `category: 'investment'` -- verschoben

Zusaetzlich erhaelt jeder Demo-Vertrag realistische Guthaben-Werte:
- Ruerup: 21.000 EUR (seit 2019, 250/mtl.)
- bAV: 14.400 EUR (seit 2020, 200/mtl.)
- DWS Fonds-Sparplan: 15.600 EUR (seit 2018, 162/mtl.)
- Vanguard ETF: 16.200 EUR (seit 2021, 300/mtl.)

Die DB-geseedeten Eintraege werden per UPDATE-Statement korrigiert.

---

## Phase 2: Tab-Erweiterung (Guthaben + Datum)

### VorsorgeTab (`src/pages/portal/finanzanalyse/VorsorgeTab.tsx`)

Aenderungen:
1. **Filter**: Nur `category = 'vorsorge'` anzeigen (oder `category IS NULL`)
2. **Neue Felder** im Formular:
   - "Aktuelles Guthaben (EUR)" -- numerisch
   - "Stand per" -- Datumsfeld
3. **Widget-Karte**: Guthaben + Datum in der Zusammenfassung anzeigen
4. **Mutations**: `current_balance` und `balance_date` in create/update aufnehmen

### InvestmentTab (`src/pages/portal/finanzanalyse/InvestmentTab.tsx`)

Aenderungen:
1. **Neue Sektion** unterhalb der Depot-Verwaltung: "Investment-Sparplaene"
2. **Query**: `vorsorge_contracts` mit `category = 'investment'` laden
3. **WidgetGrid** mit denselben CI-Kacheln wie VorsorgeTab
4. **Formular-Felder** identisch: Anbieter, Vertragsnummer, Beitrag, Intervall, Person, Guthaben, Stand-Datum
5. **CRUD-Operationen**: Anlegen/Bearbeiten/Loeschen von Investment-Sparplaenen

### Finanzuebersicht-Engine (`src/engines/finanzuebersicht/engine.ts`)

Die bestehende `isInvestmentContract()`-Funktion wird durch das neue `category`-Feld ersetzt:
- Vorher: Heuristik basierend auf contract_type String-Matching
- Nachher: Direkte Abfrage `category === 'investment'`

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| SQL Migration | 3 neue Spalten: `category`, `current_balance`, `balance_date` |
| `src/engines/demoData/spec.ts` | `DemoVorsorgeContract` um `category`, `currentBalance`, `balanceDate` erweitern |
| `src/engines/demoData/data.ts` | Kategorien und Guthaben-Werte fuer alle 4 Demo-Vertraege setzen |
| `src/pages/portal/finanzanalyse/VorsorgeTab.tsx` | Filter + 2 neue Formularfelder + Widget-Anzeige |
| `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | Neue Sektion "Investment-Sparplaene" mit CRUD |
| `src/engines/finanzuebersicht/engine.ts` | `isInvestmentContract()` auf `category`-Feld umstellen |
| `src/hooks/useFinanzmanagerData.ts` | create/update Mutations um neue Felder erweitern |
