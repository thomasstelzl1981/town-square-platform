
# Reparaturplan: Verbleibende Upload-Verstoesse beheben

## 2 Aenderungen

---

## Aenderung 1: FinanceUploadZone — triggerAI auf false setzen

**Datei:** `src/components/finanzierung/FinanceUploadZone.tsx`

**Problem:** Zeile 108 hat `triggerAI: true`. Das Manifest verlangt, dass der User die Datei zuerst sieht, bevor eine Analyse startet.

**Fix:** Zeile 108: `triggerAI: true` aendern zu `triggerAI: false`. Einzeilige Aenderung, kein weiterer Umbau noetig — die `UploadResultList` ist bereits vorhanden und zeigt die Datei nach Phase 1.

---

## Aenderung 2: StandaloneCalculatorPanel — auf useUniversalUpload umstellen

**Datei:** `src/pages/portal/akquise-manager/components/StandaloneCalculatorPanel.tsx`

**Problem:**
- Direkter `supabase.storage.from('acq-documents').upload()` Aufruf (R1+R5 verletzt)
- Falscher Bucket `acq-documents` statt `tenant-documents` (R2 verletzt)
- Kein `UploadResultCard` Feedback (R3 verletzt)
- Datei wird nach Extraktion geloescht — Sonderfall, aber trotzdem nicht manifest-konform

**Loesung:**
- `useUniversalUpload` importieren und nutzen
- `UploadResultCard` importieren fuer Feedback nach Upload
- `extractFromFile()` in 2 Schritte aufteilen:
  1. Upload via `universalUpload(file, { moduleCode: 'MOD_12', source: 'standalone_calc', triggerAI: false })`
  2. UploadResultCard mit Status `'uploaded'` anzeigen
  3. Extraktion via `sot-acq-offer-extract` mit dem `storagePath` aus `UploadedFileInfo`
  4. Status wechselt zu `'analyzing'` waehrend Extraktion, dann `'done'`
- Der direkte `supabase.storage.from('acq-documents')` Aufruf und das manuelle `.remove()` werden entfernt
- Da der Standalone-Calculator "keine Daten speichern" soll, bleibt die Datei im DMS als MOD_12 Dokument erhalten — das ist korrekt, denn das Dokument existiert und gehoert zum Akquise-Kontext
- `useAuth` wird fuer den Hook benoetigt (ist bereits im AuthContext verfuegbar)

**Betroffene Stellen:**
- Zeile 8-26: Imports anpassen (useUniversalUpload, UploadResultCard, useAuth hinzu; supabase-Import entfernen)
- Zeile 37-52: State erweitern um `uploadedFile: UploadedFileInfo | null`, `uploadStatus`
- Zeile 81-141: `extractFromFile()` komplett umschreiben:
  - Schritt 1: `await upload(file, { moduleCode: 'MOD_12', ... })`
  - Schritt 2: `UploadedFileInfo` aus Hook-State verwenden
  - Schritt 3: `supabase.functions.invoke('sot-acq-offer-extract', { body: { documentPath: storagePath } })`
  - Kein manuelles `.remove()` mehr
- Zeile 197-218: Upload-Zone erweitern — nach Upload `UploadResultCard` mit Status anzeigen

---

## Zusammenfassung

| Datei | Aufwand | Aenderung |
|---|---|---|
| FinanceUploadZone.tsx | 1 Zeile | `triggerAI: true` → `false` |
| StandaloneCalculatorPanel.tsx | Mittel | Kompletter Upload-Flow auf useUniversalUpload umstellen |

Nach diesen 2 Aenderungen sind **alle 11 Upload-Punkte** manifest-konform (ProfilTab Avatar/Logo bleibt als dokumentierter Sonderfall bestehen).
