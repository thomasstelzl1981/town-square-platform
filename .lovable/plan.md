

# Systemcheck Finanzanalyse (MOD-18) — Ergebnis

## 1. Einkommenslogik (Beschäftigungsstatus-Wechsel)
**Status: FUNKTIONIERT**
- `UebersichtTab.tsx` Zeilen 367-391: Angestellten-Felder (Arbeitgeber, Brutto, Netto, Steuerklasse, Kinderfreibeträge) sichtbar bei `angestellt` UND `selbstaendig`
- Zeilen 459-463: "Einkünfte aus Gewerbebetrieb" ebenfalls sichtbar bei beiden Status
- Werte bleiben beim Wechsel erhalten (kein Reset, nur lokaler State `editForms`)
- Nur bei `beamter`, `rentner`, `nicht_erwerbstaetig` werden diese Felder ausgeblendet

## 2. Sonstige Einnahmen
**Status: FUNKTIONIERT**
- UI-Feld vorhanden (Zeile 468-470)
- DB-Spalte `other_income_monthly` in `household_persons` angelegt
- Engine `calcIncome()` aggregiert Zeile 78: `otherIncome = adults.reduce(... p.other_income_monthly ...)`
- Hook `useFinanzberichtData` Zeile 49: Spalte in SELECT-Query enthalten
- FinanzberichtSection Zeile 167: Zeigt "Sonstige Einkünfte" an wenn > 0

## 3. Vertragskumulation (neue Verträge → Bericht)
**Status: FUNKTIONIERT**
- `useFinanzberichtData` lädt alle Vertragsquellen via separate React-Queries: insurance_contracts, vorsorge_contracts, private_loans, user_subscriptions, miety_contracts, pv_plants, loans
- Jede Query ist per `activeTenantId` gefiltert
- `useMemo` Dependency-Array (Zeile 302) enthält ALLE Datenquellen → jede DB-Änderung triggert Neuberechnung
- Engine `calcExpenses()` + `buildContractLists()` aggregieren korrekt

## 4. MOD-04 Immobilien-Übernahme
**Status: FUNKTIONIERT**
- `usePortfolioSummary` (Zeile 35-218) liest `units` + `properties` + `leases` + `loans` aus MOD-04
- Liefert: `totalValue`, `totalDebt`, `annualIncome`, `annualInterest`, `annualAmortization`, `avgInterestRate`
- `useFinanzberichtData` Zeile 270-277: Übergibt PortfolioSummary an Engine
- Engine `calcAssets` Zeile 230: `propertyValue = portfolioSummary.totalValue`
- Engine `calcIncome` Zeile 89: `rentalIncomePortfolio = portfolioSummary.annualIncome / 12`
- Engine `calcLiabilities` Zeile 263: `portfolioDebt = portfolioSummary.totalDebt`

## 5. Save-Feedback & Query-Invalidierung
**Status: FUNKTIONIERT**
- `updatePerson.mutate` → `onSuccess` → `toast.success('Person gespeichert')` (Zeile 183) + `invalidateQueries(['fa-persons'])` + `invalidateQueries(['fb-household-persons'])` (Zeilen 282-285)
- `createPerson` → gleiche Invalidierung (Zeilen 271-273)
- `deletePerson` → gleiche Invalidierung (Zeilen 294-296)
- `useSaveFeedback` Hook erstellt und verfügbar für weitere Module

## 6. "Konto hinzufügen" Widget
**Status: ENTFERNT**
- `KontenTab.tsx` Zeile 385-387: Nach den Konto-Kacheln kommt direkt `</WidgetGrid>`. Das redundante Widget ist weg.

## 7. FinAPI-Test
**Status: FUNKTIONIERT**
- Edge Function `sot-finapi-sync` deployed und erreichbar
- Status-Action getestet: HTTP 200, Response `{"connections": []}`
- Auth-Flow: `getUser(token)` korrekt implementiert (Zeile 162)
- Secrets `FINAPI_CLIENT_ID` + `FINAPI_CLIENT_SECRET` konfiguriert
- Sandbox-URL korrekt: `https://sandbox.finapi.io`
- Web Form 2.0 Flow (connect → poll → sync) vollständig implementiert

## 8. Defekte gefunden

### 8a. Freeze-Dateien nicht aktualisiert
`modules_freeze.json` Zeile 25: MOD-18 zeigt `"frozen": true`
`engines_freeze.json` Zeile 13: ENG-FINUEB zeigt `"frozen": true`
Beide müssten auf `false` gesetzt werden, da UNFREEZE erteilt wurde.

### 8b. `useSaveFeedback` Hook nicht integriert
Der neue Hook wurde erstellt (`src/hooks/useSaveFeedback.ts`), wird aber in MOD-18 noch nicht genutzt. Die bestehende Logik funktioniert zwar korrekt (manuelles `toast` + `invalidateQueries`), aber der Hook sollte für Konsistenz eingesetzt werden.

---

## Reparatur-Plan

### Fix 1: Freeze-Dateien aktualisieren
- `spec/current/00_frozen/modules_freeze.json` → MOD-18: `frozen: false`
- `spec/current/00_frozen/engines_freeze.json` → ENG-FINUEB: `frozen: false`

### Fix 2: (Optional) useSaveFeedback in MOD-18 einsetzen
Die bestehende Logik funktioniert. Integration des Hooks ist ein Refactoring für Konsistenz, kein Bugfix.

---

## Zusammenfassung

| Prüfpunkt | Status |
|-----------|--------|
| Einkommensfelder bei Status-Wechsel | OK |
| Sonstige Einnahmen (UI + Engine + DB) | OK |
| Vertragskumulation (neue Verträge → Bericht) | OK |
| MOD-04 Immobilien-Übernahme | OK |
| Save-Feedback + Query-Invalidierung | OK |
| Konto-Widget entfernt | OK |
| FinAPI Edge Function | OK (200, Auth funktioniert) |
| Freeze-Dateien | FIXBAR (kosmetisch) |

**Bewertung: Die Finanzanalyse ist funktional vollständig und korrekt implementiert. Es gibt keine kritischen Defekte. Nur die Freeze-Dateien müssen aktualisiert werden.**

