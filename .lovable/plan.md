

# Frontend- und Backend-Tests schreiben und ausfuehren

## Ueberblick

Es gibt bereits Tests fuer 5 Engines (akquiseCalc, finanzierung, provision, bewirtschaftung, projektCalc) sowie System-Tests (demoData, routes). Vier Engines haben **keine Tests**: Vorsorgeluecke, VV-Steuer, Finanzuebersicht, NK-Abrechnung (allocationLogic). Fuer Backend-Tests werden zwei Edge Functions getestet: `sot-letter-generate` und `sot-investment-engine`.

---

## Teil 1: Frontend-Tests (Vitest)

### 1a. Vorsorgeluecke Engine Test
Datei: `src/engines/vorsorgeluecke/engine.test.ts`

Testfaelle:
- **calcAltersvorsorge**: Angestellter mit DRV-Rente, Luecke berechnen
- **calcAltersvorsorge**: Beamter mit Ruhegehalt-Berechnung aus Dienstjahren
- **calcAltersvorsorge**: Private Rentenvertraege addieren
- **calcAltersvorsorge**: Projected end value statt Hochrechnung
- **calcBuLuecke**: Angestellter mit DRV-EM-Rente
- **calcBuLuecke**: Beamter mit Dienstunfaehigkeits-Berechnung
- **calcBuLuecke**: Kombi-Vertrag mit bu_monthly_benefit
- **calcBuLuecke**: Fallback auf 35% Brutto

### 1b. VV-Steuer Engine Test
Datei: `src/engines/vvSteuer/engine.test.ts`

Testfaelle:
- **calculateAfaBasis**: Gebaeudewertanteil korrekt berechnen
- **calculateAfaAmount**: Jaehrliche AfA aus Basis + Rate
- **calculatePropertyResult**: Einnahmen-Ueberschuss-Rechnung komplett
- **buildContextSummary**: Aggregation ueber mehrere Immobilien

### 1c. Finanzuebersicht Engine Test
Datei: `src/engines/finanzuebersicht/engine.test.ts`

Testfaelle:
- **monthlyFromInterval**: Umrechnung jaehrlich/halbjaehrlich/vierteljaehrlich/monatlich
- **calcIncome**: Nettoeinkommen + Mieteinnahmen + PV + Steuervorteil
- **calcAssets**: Immobilien + Bankguthaben + Wertpapiere
- **calcLiabilities**: Portfolio-Schulden + Eigenheim + PV + Privatkredite
- **calcProjection**: 40-Jahres-Vermoegensprojektion

### 1d. NK-Abrechnung allocationLogic Test
Datei: `src/engines/nkAbrechnung/allocationLogic.test.ts`

Testfaelle:
- **calculateLeaseDaysInPeriod**: Ganzjaehrig (365/365)
- **calculateLeaseDaysInPeriod**: Unterjaehrig (Lease beginnt im Juni)
- **allocateCostItem**: Verteilung nach Flaeche (AREA_SQM)
- **allocateCostItem**: Verteilung nach MEA
- **allocateCostItem**: Verteilung nach Personenzahl
- **allocateCostItem**: Direktuebernahme wenn amountUnit vorhanden
- **calculateProratedPrepayments**: Anteilige Vorauszahlungen

---

## Teil 2: Backend-Tests (Deno)

### 2a. sot-letter-generate Test
Datei: `supabase/functions/sot-letter-generate/index.test.ts`

Testfaelle:
- CORS preflight gibt 200 zurueck
- Fehlende Pflichtfelder gibt 400 zurueck
- Erfolgreicher Aufruf mit gueltigem Payload

### 2b. sot-investment-engine Test
Datei: `supabase/functions/sot-investment-engine/index.test.ts`

Testfaelle:
- CORS preflight gibt 200 zurueck
- Erfolgreicher Aufruf mit Standard-Eingabe gibt projection zurueck

---

## Ausfuehrung

Nach dem Schreiben aller Tests:
1. Frontend-Tests mit Vitest ausfuehren (alle 4 neuen + bestehende)
2. Backend-Tests mit Deno-Test-Runner ausfuehren

## Technische Details

- Frontend: Pure functions ohne Mocks, direkte Import der Engine-Funktionen
- Backend: HTTP-Aufrufe an deployed Edge Functions mit echtem Supabase-URL + Anon-Key
- Alle Tests nutzen bestehende Patterns (describe/it/expect)
- Keine neuen Dependencies noetig

