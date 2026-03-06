
Ziel: Vollständiges Fehlerprotokoll + Tiefenanalyse der betroffenen Bewertungsstrecke (MOD-04), inkl. Soll-Ablauf.

## 1) Kurzfazit (wichtig)
Der aktuelle Fehler ist **kein** Credit-Problem mehr.  
Die Bewertung läuft serverseitig vollständig durch (Status `final`), aber der Frontend-Flow bricht beim direkten Nachladen der Ergebnisse ab, weil API-Felder zwischen Hook/UI und Backend nicht konsistent sind.

Kernfehler:
- Backend `run` liefert `case_id` (snake_case)
- Hook liest `data.caseId` (camelCase) → `undefined`
- Danach sendet Hook `action: "get"` ohne `case_id`
- Backend antwortet korrekt mit `400 {"error":"case_id required"}`

---

## 2) Fehlerprotokoll (forensisch, mit Ist-Daten)

### A) Netzwerkprotokoll (Client)
1. `POST /functions/v1/sot-valuation-engine` (preflight)  
   - Request Body: `{"action":"preflight", ... "property_id":"451e0542-..."}`
   - Response 200: `{"success":true,"preflight":{"can_proceed":true,"credits_available":4980,...}}`

2. `POST /functions/v1/sot-valuation-engine` (run)  
   - Request Body: `{"action":"run", ... "property_id":"451e0542-..."}`
   - Response 200:  
     `{"success":true,"case_id":"effc8d52-f254-...","status":"final","stage_timings":{...}}`

3. `POST /functions/v1/sot-valuation-engine` (get)  
   - Request Body: `{"action":"get"}`  ← **ohne case_id**
   - Response 400: `{"error":"case_id required"}`

### B) Edge-Function-Log `sot-valuation-engine`
Lauf vollständig durch alle Stages:
- Stage 0 Preflight/Credits ok
- Stage 1/2/3/4/5 erfolgreich
- `Report complete`
- keine Engine-Pipeline-Exception beim Lauf selbst

### C) DB-Protokoll (Live-Daten)
Für Property `451e0542-e027-...` wurden Fälle angelegt und finalisiert:
- `effc8d52-f254-...` → `status=final`, `stage_current=5`
- `5cc6eab2-1c9f-...` → `status=final`, `stage_current=5`
Zu beiden Cases existieren:
- `valuation_inputs`
- `valuation_results`
- `valuation_reports`

=> Belegt eindeutig: Backend rechnet fertig; Abbruch passiert im Frontend-Retrieval/Mapping.

---

## 3) Betroffene Dateien + exakte Problemstellen

### 1) `src/hooks/useValuationCase.ts`
- `runValuation()` liest:
  - `const caseId = data.caseId as string;`  (**falsch**, Backend liefert `case_id`)
  - `const stageTimings = data.stageTimings || {};` (**falsch**, Backend liefert `stage_timings`)
- `fetchResult(caseId)` wird mit `undefined` aufgerufen, daher geht Request als `{"action":"get"}` raus.
- Console passt dazu: `fetchResult error: Edge Function returned a non-2xx status code`.

### 2) `supabase/functions/sot-valuation-engine/index.ts`
- `run` liefert korrekt snake_case:
  - `case_id`
  - `source_mode`
  - `stage_timings`
- `get` verlangt korrekt:
  - `case_id`, sonst 400 `"case_id required"`

=> Backend-Verhalten ist konsistent; Contract-Mismatch liegt im Client.

### 3) `src/components/immobilien/detail/PropertyValuationTab.tsx`
Zusätzlicher Integrationsbruch:
- UI erwartet `state.resultData` im Format:
  - `valueBand`, `methods`, `financing`, `stressTests`, ...
- `get` liefert aber:
  - `{ case, inputs, results, report }`
- Ohne Transform-Layer ist Reader-Datenmodell inkonsistent (auch wenn `case_id`-Bug behoben ist).

### 4) `src/components/shared/valuation/ValuationReportReader.tsx`
Erwartet stark typisierte camelCase-Struktur (z. B. `weightingTable`, `trafficLight`, `confidenceScore`), während DB/Function-Output primär snake_case/abweichende Feldnamen nutzt.  
=> Zweiter struktureller Mapping-Bug, der nach dem ersten Fix sichtbar wird.

### 5) Nebenbefund (nicht Blocker für 400)
`ValuationPipeline` Warnung: „Function components cannot be given refs … StageIcon“  
Das ist aktuell eine React-Warnung, nicht die Ursache für den Abbruch.

---

## 4) Was passieren müsste (Soll-Ablauf)

```text
Start Bewertung
  -> preflight (200)
  -> run (200, case_id vorhanden)
  -> fetch get mit exakt diesem case_id
  -> get (200, {case, inputs, results, report})
  -> Transform in UI-DTO
  -> ValuationReportReader bekommt korrekt gemappte Props
  -> Ergebnisansicht bleibt offen (kein Rückfall in Startkarte)
```

Wesentliche Soll-Regeln:
1. API-Contract eindeutig (snake_case ODER camelCase, nicht gemischt)
2. Hook muss robust beide Varianten lesen (defensiv)
3. Zentraler Mapper `Function/DB -> UI spec`
4. Fehlerpfad in UI darf nicht still zurück auf Startkarte springen

---

## 5) Umsetzungsplan (für den nächsten Implementierungsschritt)

1. **Contract-Harmonisierung im Hook**
   - `caseId = data.case_id ?? data.caseId`
   - `stageTimings = data.stage_timings ?? data.stageTimings`
   - Hard fail mit klarer Message, falls kein Case-Identifier vorhanden.

2. **Result-Mapper einführen**
   - In `useValuationCase` (oder dediziertem mapper) `get`-Payload `{case,inputs,results,report}` auf Reader-Props transformieren:
   - `value_band -> valueBand`, `valuation_methods -> methods`, `monthly_rate -> monthlyRate`, etc.

3. **UI-Flow stabilisieren**
   - Bei `fetchResult`-Fehler nicht implizit auf Startansicht zurückfallen.
   - Stattdessen Fehlermodul mit „Ergebnis erneut laden“.

4. **Persistenz-Liste konsolidieren**
   - `PropertyValuationTab` listet derzeit `property_valuations`, Engine schreibt aber `valuation_cases/*`.
   - Entweder Writer ergänzen oder List-Query auf valuation-Tabellen umstellen.

5. **Verifikation**
   - 1 kompletter Run mit Network-Check:
     - `run` enthält case_id
     - `get` enthält case_id im Request
     - UI zeigt finalen Report ohne Rücksprung
   - Danach zweiter Run (Regression gegen vorherigen 402/400-Loop).

---

## 6) Tiefenanalyse-Bewertung (Systemzustand)
- Credit-System-Fix ist wirksam (kein 402 mehr im aktuellen Lauf).
- Jetzt liegt der Fehler eindeutig in der **API-Vertragsdrift zwischen Frontend-Hook/UI und Edge-Response**.
- Zusätzlich gibt es eine **zweite Drift zwischen Ergebnisformat und Report-Reader-Typen**.
- Das erklärt exakt Ihr beobachtetes Verhalten: „arbeitet kurz, bricht dann beim ersten Punkt ab“ (eigentlich: Lauf fertig, Retrieval kaputt).
