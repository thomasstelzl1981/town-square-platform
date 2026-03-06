

# Phase 2a Fix-Plan: Premium PDF zeigt leere Daten + alte Buttons entfernen

## Problem-Analyse

Zwei konkrete Probleme:

### 1. PDF zeigt "–" bei allen Objektdaten (Adresse, Objektart, Baujahr, etc.)
**Ursache gefunden:** In `useValuationCase.ts` (Zeile 358-480) wird `fetchResult` aufgerufen und mappt alle Ergebnisdaten — aber der `snapshot` (Property-Daten wie Adresse, Fläche, Baujahr) wird **nie in `resultData` gespeichert**. Die Daten kommen vom Edge Function als `inputs.snapshot`, werden aber ignoriert.

In `PropertyValuationTab.tsx` (Zeile 183) wird dann ein Fallback-Objekt mit lauter `null`-Werten übergeben:
```
snapshot: r.snapshot || { address: '', city: '', ... }
```
Da `r.snapshot` undefined ist, greift der Fallback → PDF zeigt überall "–".

**Fix:** In `useValuationCase.ts` den `snapshot` aus `inputs.snapshot` mappen und in `resultData` speichern. Kein neuer DB-Call nötig — die Daten sind bereits in der Edge-Function-Response enthalten.

### 2. Alte PDF-Buttons am Seitenende ("Diese Ansicht als PDF speichern" / "Als PDF exportieren")
**Ursache:** In `PropertyDetailPage.tsx` (Zeile 181) steht noch:
```tsx
<PdfExportFooter contentRef={contentRef} documentTitle={...} moduleName="MOD-04 Immobilien" />
```
Das ist der alte Browser-Print-Export (Typ A), der eine minderwertige Druckversion erzeugt. Seit V10 haben wir den Premium-jsPDF-Export im ValuationTab. Die alten Buttons verwirren und liefern das falsche Ergebnis.

**Fix:** `PdfExportFooter` und `usePdfContentRef` aus `PropertyDetailPage.tsx` entfernen.

---

## Konkrete Änderungen

| Datei | Änderung |
|-------|----------|
| `src/hooks/useValuationCase.ts` | `snapshot: inputs.snapshot` zum `mappedResult` hinzufügen (1 Zeile) |
| `src/components/immobilien/detail/PropertyValuationTab.tsx` | Fallback-Snapshot entfernen, direkt `r.snapshot` nutzen |
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | `PdfExportFooter`, `usePdfContentRef` Import + Verwendung entfernen |

Kein neues Gutachten nötig — das bestehende Gutachten enthält bereits alle Daten. Der PDF-Button oben in der Leiste wird danach korrekt befüllte PDFs erzeugen.

