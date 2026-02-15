
# MOD-04 + Investment Engine — Deep Audit Ergebnisse und Reparaturplan

## 1. Investment Engine (Edge Function) — BESTANDEN

Die Edge Function `sot-investment-engine` wurde live getestet (BER-01: 280k, 1150/Mo, 50k EK):
- Zinssatz: 4,3% (korrekt aus DB-Matrix fuer 10J/90% LTV)
- Darlehen: 230.000 EUR (280k - 50k) -- korrekt
- AfA: 4.480 EUR (280k x 80% x 2%) -- korrekt
- Steuerersparnis Jahr 1: 343 EUR -- korrekt (negativer Mietueberschuss -870 EUR)
- Ab Jahr 4 wird Steuerersparnis negativ (= Steuermehrbelastung) -- fachlich korrekt
- 40-Jahres-Projektion rechnet sauber durch, Nettovermoegen Jahr 40: 560.129 EUR

30 Zinssaetze und alle Steuerparameter sind in der DB vorhanden.

## 2. Geteilte Komponenten — BESTANDEN

Alle Module nutzen korrekt die SSOT-Komponenten aus `src/components/investment/`:
- **MOD-08 SucheTab**: `InvestmentResultTile` mit Edge-Function-Metriken
- **MOD-08 InvestmentExposePage**: `MasterGraph`, `Haushaltsrechnung`, `InvestmentSliderPanel`, `DetailTable40Jahre`, `FinanzierungSummary`
- **MOD-09 BeratungTab**: `InvestmentResultTile` (showProvision=false)
- **Zone 3 Kaufy**: `InvestmentResultTile` (linkPrefix=/website/kaufy/immobilien)
- **MOD-13 Landing Page**: `InvestmentExposeView`

## 3. Gefundene Issues

### P1 — Daten-Inkonsistenz Miete (Demo vs. DB)

| Objekt | Demo monthlyRent | DB units.current_monthly_rent | DB annual_income/12 |
|--------|-----------------|------------------------------|---------------------|
| BER-01 | **1.150** | **850** | **1.150** |
| MUC-01 | **1.580** | **1.250** | **1.580** |
| HH-01 | **750** | **580** | **750** |

**Problem:** Die Demo-Daten (`useDemoListings.ts`) verwenden `annualIncome/12` als `monthlyRent`. Die DB-Tabelle `units.current_monthly_rent` enthaelt aber niedrigere Werte. Wenn MOD-04 Immobilienakte die Simulation oeffnet, nutzt sie `unit.current_monthly_rent` (850 EUR fuer Berlin), waehrend MOD-08/09/Zone 3 die Demo-Werte (1.150 EUR) oder `properties.annual_income / 12` verwenden.

**Auswirkung:** Unterschiedliche Berechnungsergebnisse fuer dasselbe Objekt je nach Einstiegspunkt (MOD-04 vs. MOD-08).

**Fix:** DB-Werte in `units.current_monthly_rent` auf die korrekten Werte anpassen (1.150, 1.580, 750), damit SSOT gilt.

### P2 — Zwei verschiedene Berechnungs-Engines

| Kontext | Engine | Tax? | Zinssatz |
|---------|--------|------|----------|
| MOD-04 Simulation Tab | **Client-seitig** (InventoryInvestmentSimulation) | Nein | Aus DB (property_financing) |
| MOD-08/09/Zone 3 | **Edge Function** (sot-investment-engine) | Ja | Aus DB (interest_rates Matrix) |

**Problem:** Die `InventoryInvestmentSimulation` in MOD-04 rechnet eine vereinfachte Projektion OHNE Steuereffekte (keine AfA-Steuerersparnis, kein zvE). Die Edge Function beruecksichtigt Steuerersparnis, Soli, Kirchensteuer. Damit zeigt die MOD-04-Simulation andere Ergebnisse als dieselbe Immobilie in MOD-08.

**Fix (Sprint):** `InventoryInvestmentSimulation` soll ebenfalls die Edge Function nutzen oder zumindest dieselbe Berechnungslogik clientseitig abbilden.

### P3 — InvestmentExposePage: Demo-Listing public_id Mismatch

Die Demo-Listings haben `public_id: "DEMO-BER-01"` (mit Bindestrich nach DEMO), aber die DB-Listings haben `public_id: "DEMO-BER01"` (ohne Bindestrich im Code-Teil). Die InvestmentExposePage macht ein `.toUpperCase()` Vergleich, aber der Bindestrich-Unterschied koennte zu Nicht-Finden fuehren.

**Fix:** Pruefen ob die Demo-Codes konsistent sind (aktuell: Demo-Code `BER-01` erzeugt public_id `DEMO-BER-01`, DB hat `DEMO-BER01`).

## 4. Reparaturplan

### Sofort-Fixes (10 Min)

| # | Datei | Aenderung |
|---|-------|-----------|
| 1 | DB Migration | `UPDATE units SET current_monthly_rent = 1150 WHERE id = 'd0000000-...-b01'` (analog MUC=1580, HH=750) |

### Sprint-Backlog

| # | Datei | Aenderung |
|---|-------|-----------|
| 2 | InventoryInvestmentSimulation.tsx | Edge Function statt Client-Berechnung nutzen, oder Steuer-Logik ergaenzen |
| 3 | useDemoListings.ts / DB | public_id Konsistenz pruefen (DEMO-BER-01 vs DEMO-BER01) |
| 4 | PropertyDetailPage.tsx | simulationData.annualRent nutzt `unit.current_monthly_rent * 12`, sollte alternativ `property.annual_income` nutzen fuer Konsistenz |

## 5. Zusammenfassung

- **Investment Engine Edge Function**: Mathematisch korrekt, alle Formeln verifiziert
- **Geteilte Komponenten**: Konsistent ueber MOD-08, MOD-09, Zone 3 und MOD-13
- **Demo-Daten**: 3 Objekte (BER, MUC, HH) + 1 Projekt (Residenz am Stadtpark) korrekt konfiguriert
- **DB-Listings**: Alle 3 Demo-Listings sind `status: active` mit korrekten `asking_price` Werten
- **1 P1-Issue**: Miet-Inkonsistenz zwischen `units` und `useDemoListings` — behebt sich durch DB-Update
- **1 P2-Issue**: Zwei Berechnungs-Engines mit unterschiedlicher Tiefe (mit/ohne Steuer)
