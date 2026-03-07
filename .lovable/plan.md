

# MOD-12 AkquiseManager — Vollständiger Check-up

## Audit-Ergebnis: 7 Befunde, davon 3 kritisch

---

## A. ENGINE (ENG-AKQUISE) — Prüfergebnis

### PASS: SSOT-Struktur
- `engine.ts`: 5 reine Funktionen, kein React, kein DB — korrekt
- `spec.ts`: Alle Typen und Defaults zentral — korrekt
- Alle 5 Consumer (`BestandCalculation`, `AufteilerCalculation`, `QuickCalcTool`, `useAcqOffers`, `ObjekteingangDetail`) importieren aus `@/engines/akquiseCalc/` — korrekt

### PASS: Berechnungslogik
- `maintenancePercent` und `managementCostPercent` fließen korrekt in `calcBestandFull` NOI ein (Zeile 68-70)
- Sensitivity-Guard gegen Division-durch-0 vorhanden (Zeile 311)
- `maxFinancing`-Heuristik dokumentiert (Kommentar Zeile 49)

### WARNUNG: BestandCalculation.tsx Zeile 199 — Doppelberechnung
Die UI berechnet `monthlyMaintenance` inline nochmal: `params.purchasePrice * (params.maintenancePercent || 1) / 100 / 12`. Die Engine berechnet das bereits in `yearlyData[0].noi`. Die UI-Berechnung ist **redundant aber nicht falsch**, weil sie die gleiche Formel verwendet. Trotzdem sollte sie aus dem Engine-Ergebnis bezogen werden, um Drift zu vermeiden.

### WARNUNG: Persistenz-Hooks verwenden Quick statt Full
`useRunCalcBestand` (Zeile 396) ruft `calcBestandQuick` auf, obwohl `BestandCalculation.tsx` mit `calcBestandFull` arbeitet. Das bedeutet: Die gespeicherten Ergebnisse in `acq_offers.calc_bestand` enthalten nur Quick-KPIs, nicht die 30-Jahres-Projektion. Gleiches gilt für `useRunCalcAufteiler` (Zeile 448).

---

## B. TYPE-HYGIENE — `as any` Audit

**90 `as any` Treffer in 8 Dateien** innerhalb MOD-12. Kritische Stellen:

| Datei | Zeile | Risiko | Beschreibung |
|-------|-------|--------|-------------|
| `ObjekteingangDetail.tsx` | 78 | Mittel | `{ price_counter: priceOverride } as any` — Spalte existiert möglicherweise nicht im DB-Schema |
| `ObjekteingangDetail.tsx` | 201 | Mittel | `(offer as any).price_counter` — Feld nicht im `AcqOffer` Interface |
| `ObjekteingangList.tsx` | 327 | Niedrig | `(offer as any).documents` — Feld existiert im Query, fehlt nur im Type |
| `useExposeUpload.ts` | 59, 95 | Mittel | Insert-Daten und `documents`-Table als any gecastet |
| `ExposeDragDropUploader.tsx` | 105-106, 146 | Hoch | Mehrere `as any` Casts bei DB-Inserts |
| `AcqOfferDetailSheet.tsx` | 60, 103-104, 171, 174 | Mittel | Mandate-Relation und Documents nicht typisiert |
| `AkquiseDatenbank.tsx` | 97, 104, 152 | Niedrig | Sort und Mandate-Code Zugriff |
| `PreisvorschlagDialog.tsx` | 131 | Mittel | `price_counter` als any |

---

## C. LEGACY geomap_data — Noch 3 aktive Referenzen

Die `geomap_data`-Spalte ist als `@deprecated` im Interface markiert, wird aber noch aktiv in der UI-Logik verwendet:

1. **AnalysisTab.tsx Zeile 182**: `hasValuation = offer.analysis_summary || offer.geomap_data` — geomap als Fallback für Valuation-Badge
2. **AnalysisTab.tsx Zeile 264**: `const geo = offer.geomap_data as LocationResult` — Vollständige Standortdaten-Section baut auf Legacy-Daten auf (Zeilen 329-357)
3. **DeliveryTab.tsx Zeile 273**: `hasValuation = offer.analysis_summary || offer.geomap_data` — Badge-Logik

Diese sind **funktional korrekt** (Fallback auf Legacy), aber die Standortdaten-Section in AnalysisTab (Zeilen 329-357) zeigt Legacy-Daten an, die nie mehr befüllt werden.

---

## D. PERFORMANCE-ANALYSE

### ObjekteingangList.tsx
- **Query**: Lädt bis zu 1000 Offers mit JOIN auf `acq_offer_documents` — bei vielen Offers könnte das langsam werden
- **Redundante Auth-Query**: Zeile 76-83 holt `profiles.active_tenant_id` manuell, obwohl `activeTenantId` aus `useAuth()` bereits verfügbar ist (Zeile 58)
- **Kein Pagination**: Alles wird in eine ScrollArea geladen

### ObjekteingangDetail.tsx
- **ExposePdfViewer**: Signed URL mit 3600s Ablauf — gut
- **QuickAnalysisBanner**: Berechnet bei jedem Render `calcBestandQuick` + `calcAufteilerFull` — sollte in `useMemo` gewrapped sein (aktuell inline in der Render-Funktion)

### AkquiseDashboard.tsx
- **KPI-Queries**: 2 separate Count-Queries (`contact_staging`, `acq_offers`) — könnte eine einzige RPC sein, aber akzeptabel für Dashboard

---

## E. FUNKTIONSPRÜFUNG — Workflow-Integrität

### Upload-Flow: PASS
`useExposeUpload` → acq_offers insert → Storage upload → acq_offer_documents → documents → storage_nodes → AI extraction — korrekte Reihenfolge mit Rollback bei Fehler

### PDF-Viewer: PASS
`ExposePdfViewer` in ObjekteingangDetail — findet erstes PDF, Signed URL, iframe 700px — korrekt implementiert

### Kalkulation: PASS
initialData wird korrekt aus Offer-Feldern bezogen, Completeness-Check warnt bei fehlenden Feldern

### Valuation: PASS mit Einschränkung
Button korrekt konditioniert auf `hasCalcData`, aber `hasCalcData` prüft `offer.status !== 'new'` als Fallback (Zeile 211) — das bedeutet, ein Offer im Status "analyzing" würde die Bewertung freischalten, obwohl keine Kalkulation vorliegt

---

## F. FIX-PLAN (Priorisiert)

### Fix 1 (Kritisch): Persistenz-Hooks Full statt Quick
`useRunCalcBestand` soll `calcBestandFull` aufrufen (mit allen Parametern), nicht `calcBestandQuick`. So werden die gespeicherten Ergebnisse konsistent mit dem, was die UI anzeigt. Gleiches für `useRunCalcAufteiler` → `calcAufteilerFull`.

### Fix 2 (Mittel): `hasCalcData`-Logik verschärfen
Zeile 211 in ObjekteingangDetail: `offer.status !== 'new'` aus der Bedingung entfernen. Nur `calc_bestand || calc_aufteiler` als echte Prüfung verwenden.

### Fix 3 (Mittel): Redundante Maintenance-Berechnung in BestandCalculation.tsx
Zeile 199: `monthlyMaintenance` aus `calculation.yearlyData[0].noi` ableiten statt inline neu zu berechnen. Alternativ die NOI-Aufschlüsselung als separaten Output in `BestandFullResult` aufnehmen.

### Fix 4 (Mittel): Legacy geomap_data-Section entfernen
AnalysisTab.tsx Zeilen 329-357 (Standortdaten-Card): Ersetzen durch Hinweis auf SoT Bewertung. DeliveryTab.tsx Zeile 273 und AnalysisTab.tsx Zeile 182: `offer.geomap_data` aus der `hasValuation`-Logik entfernen.

### Fix 5 (Niedrig): `price_counter` in AcqOffer Interface aufnehmen
Feld zum `AcqOffer` Interface in `useAcqOffers.ts` hinzufügen, um die 3 `as any`-Casts für `price_counter` zu eliminieren.

### Fix 6 (Niedrig): ObjekteingangList redundante Auth-Query entfernen
Zeilen 76-83: `activeTenantId` aus `useAuth()` direkt verwenden statt erneut `profiles` abzufragen.

### Fix 7 (Niedrig): QuickAnalysisBanner Berechnung memoizen
Die `calcBestandQuick` + `calcAufteilerFull` Aufrufe in Zeile 79-80 in `useMemo` wrappen.

---

## Zusammenfassung

| Bereich | Status | Befunde |
|---------|--------|---------|
| Engine SSOT | PASS | Sauber zentralisiert, Guards vorhanden |
| Engine Logik | PASS | NOI korrekt, Sensitivity abgesichert |
| Persistenz | FIX NÖTIG | Quick statt Full bei Speichern |
| Type-Hygiene | FIX NÖTIG | 90x `as any`, 5 kritische Stellen |
| Legacy Cleanup | FIX NÖTIG | 3x geomap_data noch aktiv |
| Performance | OK | Kleine Optimierungen möglich |
| Upload-Flow | PASS | Korrekt mit Rollback |
| PDF-Viewer | PASS | Inline-Ansicht funktional |
| Valuation-Integration | PASS mit Fix | hasCalcData-Logik zu locker |

**Bereit für Test-Exposé** nach Umsetzung der Fixes 1-7. Fix 1 (Persistenz) ist der wichtigste, da er die gespeicherten Kalkulationsergebnisse betrifft.

