
# Plan: MOD-18 Finanzanalyse Engine -- Vollstaendige Korrektur

## Diagnose (verfeinert)

Die Engine liest Einkommens- und Vermoegensdaten aus den falschen Quellen. Hier die vollstaendige Ist-Analyse:

### Daten in der Datenbank (vorhanden, aber nicht genutzt)

| Datenquelle | Inhalt | Status in Engine |
|---|---|---|
| `household_persons` (Max) | Netto 5.200, Business 8.500, PV 212 EUR/mtl. | NICHT GELESEN |
| `household_persons` (Lisa) | Netto 2.800, Brutto 4.200 EUR/mtl. | NICHT GELESEN |
| `finapi_depot_accounts` (2 Depots) | Scalable Capital + DWS | NICHT GELESEN |
| `finapi_depot_positions` (5 Positionen) | Gesamtwert 93.204 EUR | NICHT GELESEN |
| `vorsorge_contracts` (current_balance) | Ruuerup 21.000 + bAV 14.400 + Fonds 15.600 + ETF 16.200 = 67.200 EUR | NICHT GELESEN |
| `miety_homes` (Villa Mustermann) | market_value = NULL (sollte ~850.000 sein) | Wird gelesen, aber 0 |
| `applicant_profiles` (Einkommen) | Max: net_income 4.800, bank_savings 35.000, securities 15.000 | Wird gelesen, aber nur 1 von 2 Profilen hat Daten |
| `cars_vehicles` (2 Fahrzeuge) | Porsche 911 + BMW M5 -- kein Wertfeld vorhanden | KEIN WERTFELD |

### 6 Probleme im Detail

**Problem 1 -- Einkommen aus falscher Quelle (KRITISCH)**
Die Engine liest `applicant_profiles` (MOD-07 Finanzierungsantraege). Diese Tabelle hat nur 1 Profil mit Daten (4.800 EUR netto). Die `household_persons` haben die korrekten, aktuellen Werte: Max 5.200 + Lisa 2.800 = 8.000 EUR netto, plus 8.500 EUR Business-Einkommen, plus 212 EUR PV.

**Problem 2 -- Investment-Depots fehlen komplett**
Zwei Demo-Depots existieren mit 5 Positionen (Gesamtwert 93.204 EUR). Die Engine hat keinen Input-Typ fuer Depots und ignoriert sie komplett. Diese fehlen sowohl in der Vermoegensaufstellung als auch in der 40-Jahres-Projektion.

**Problem 3 -- Vorsorge-Rueckkaufswerte/Guthaben fehlen**
`vorsorge_contracts` hat ein `current_balance`-Feld mit Werten (67.200 EUR gesamt). Die Engine liest dieses Feld nicht und nutzt stattdessen `life_insurance_value` aus `applicant_profiles` (= NULL). Die Vermoegensposition "Rueckkaufswerte (LV)" zeigt daher 0.

**Problem 4 -- Eigenheim ohne Marktwert**
`miety_homes` hat `market_value = NULL` fuer Villa Mustermann. Der Seed muss 850.000 EUR setzen.

**Problem 5 -- Fahrzeuge fehlen in Vermoegensaufstellung**
`cars_vehicles` hat kein `estimated_value_eur`-Feld. Zwei Fahrzeuge (Porsche 911, BMW M5) mit geschaetztem Gesamtwert ca. 180.000 EUR fehlen komplett.

**Problem 6 -- Bank-/Sparguthaben kommen aus falscher Quelle**
`applicant_profiles.bank_savings` = 35.000 EUR (nur 1 Profil). Der korrekte Wert sollte alle Haushaltsmitglieder beruecksichtigen. Aktuell keine dedizierte Sparkonto-Tabelle, aber die existierenden Werte werden nicht vollstaendig aggregiert.

---

## Geplante Aenderungen

### 1. Engine Spec: `src/engines/finanzuebersicht/spec.ts`

Neue Input-Typen hinzufuegen:

```text
FUHouseholdPerson {
  id, role, first_name, last_name,
  net_income_monthly, gross_income_monthly,
  business_income_monthly, pv_income_monthly,
  child_allowances, employment_status
}

FUDepotAccount {
  id, account_name, bank_name, status
}

FUDepotPosition {
  id, depot_account_id, name, isin,
  current_value, purchase_value, profit_or_loss
}

FUVehicle {
  id, make, model, estimated_value_eur
}
```

Erweitern:
- `FUVorsorgeContract` um `current_balance?: number | null`
- `FUInput` um `householdPersons`, `depotAccounts`, `depotPositions`, `vehicles`
- `FUAssets` um `depotValue: number`, `vorsorgeBalance: number`, `vehicleValue: number`

### 2. Engine Logic: `src/engines/finanzuebersicht/engine.ts`

**calcIncome()** -- Neue Signatur:
- Primaer aus `householdPersons` lesen (Summe aller net_income_monthly, business_income_monthly, pv_income_monthly)
- Fallback auf `applicantProfiles` wenn householdPersons leer
- Kindergeld: 250 EUR pro Kind (child_allowances aus household_persons)

**calcAssets()** -- Erweitern:
- `depotValue`: Summe aller `finapi_depot_positions.current_value`
- `vorsorgeBalance`: Summe aller `vorsorge_contracts.current_balance` (Rueckkaufswerte/Guthaben)
- `vehicleValue`: Summe aller `cars_vehicles.estimated_value_eur`
- `totalAssets` um alle drei erweitern
- `securities` weiterhin aus applicantProfiles als Fallback

**calcProjection()** -- Erweitern:
- `cumSavings` Startwert um `depotValue` + `vorsorgeBalance` erhoehen

### 3. Daten-Hook: `src/hooks/useFinanzberichtData.ts`

Neue Queries hinzufuegen:
- `household_persons` mit Einkommensfeldern (net_income_monthly, gross_income_monthly, business_income_monthly, pv_income_monthly, child_allowances, role, employment_status)
- `finapi_depot_accounts` (id, account_name, bank_name, status) WHERE status = 'active'
- `finapi_depot_positions` (id, depot_account_id, name, isin, current_value, purchase_value, profit_or_loss) per Depot-Account
- `cars_vehicles` (id, make, model, estimated_value_eur)
- `vorsorge_contracts` erweitern um `current_balance`

Alle neuen Daten an `calcFinanzuebersicht()` uebergeben.

### 4. UI: `src/components/finanzanalyse/FinanzberichtSection.tsx`

Vermoegenssektion erweitern:
- "Investment-Depots" Zeile (Summe aller Depot-Positionen)
- "Vorsorge-Guthaben" Zeile (current_balance aus vorsorge_contracts)
- "Fahrzeuge" Zeile (geschaetzte Fahrzeugwerte)

Neue Sektion 3d: **Depot-Aufstellung** (nach Darlehensaufstellung)
- Tabelle mit Spalten: Depot | ISIN | Bezeichnung | Stueck | Aktueller Wert | +/-
- Gruppiert nach Depot-Account

### 5. Datenbank-Migration

```text
ALTER TABLE cars_vehicles ADD COLUMN estimated_value_eur NUMERIC DEFAULT NULL;
```

### 6. Demo-Daten Korrekturen

**`public/demo-data/demo_miety_homes.csv`:**
- Spalte `market_value` hinzufuegen mit Wert 850000

**`public/demo-data/demo_vehicles.csv`:**
- Spalte `estimated_value_eur` hinzufuegen: Porsche 911 = 95000, BMW M5 = 85000

**`src/hooks/useDemoSeedEngine.ts`:**
- Miety-Homes Seed: `market_value` aus CSV mappen
- Vehicles Seed: `estimated_value_eur` aus CSV mappen

---

## Erwartetes Ergebnis nach Fix

| Position | Vorher | Nachher |
|---|---|---|
| Nettoeinkommen | 4.800 EUR (1 Profil) | 8.000 EUR (Max + Lisa) |
| Business-Einkommen | 0 EUR | 8.500 EUR |
| PV-Einkuenfte | 0 EUR (nicht aus HP gelesen) | 212 EUR |
| Kindergeld | 0 EUR | 500 EUR (2 Kinder) |
| **Summe Einkommen** | **~7.500 EUR** | **~20.000 EUR** |
| Immobilienportfolio | 1.070.000 EUR | 1.070.000 EUR (bleibt) |
| Eigenheim | 0 EUR | 850.000 EUR |
| Investment-Depots | 0 EUR | 93.204 EUR |
| Vorsorge-Guthaben | 0 EUR | 67.200 EUR |
| Fahrzeuge | nicht vorhanden | 180.000 EUR |
| Bank-/Sparguthaben | 35.000 EUR | 35.000 EUR (bleibt) |
| Wertpapiere (alt) | 15.000 EUR | 15.000 EUR (bleibt, Fallback) |
| **Gesamtvermoegen** | **~1.120.000 EUR** | **~2.310.404 EUR** |

---

## Technische Details

### Dateien die geaendert werden

| Datei | Aenderung |
|---|---|
| `src/engines/finanzuebersicht/spec.ts` | 4 neue Input-Typen, FUInput + FUAssets erweitert |
| `src/engines/finanzuebersicht/engine.ts` | calcIncome + calcAssets + calcProjection ueberarbeitet |
| `src/hooks/useFinanzberichtData.ts` | 4 neue Queries, vorsorge um current_balance erweitert |
| `src/components/finanzanalyse/FinanzberichtSection.tsx` | 3 neue Vermoegenszeilen + Depot-Tabelle |
| `public/demo-data/demo_miety_homes.csv` | market_value Spalte |
| `public/demo-data/demo_vehicles.csv` | estimated_value_eur Spalte |
| `src/hooks/useDemoSeedEngine.ts` | Seed fuer market_value + estimated_value_eur |
| Datenbank-Migration | estimated_value_eur Spalte in cars_vehicles |

### Freeze-Check
MOD-18 ist NICHT eingefroren (frozen: false). Alle Dateien liegen unter `src/engines/finanzuebersicht/*`, `src/hooks/useFinanzbericht*`, `src/components/finanzanalyse/*` -- alles editierbar.

### Was NICHT geaendert wird
- Vertragsverlinkung (funktioniert)
- Investment-Tab UI (separates Feature)
- Vorsorge-Tab UI (separates Feature)
- Andere Module (alle frozen)
