

## Analyse: "Anbieter aus Exposé laden" zeigt keine Daten

### Root Cause

Die Edge-Function-Logs zeigen das eigentliche Problem:

```
[expose-diag] ❌ EMPTY RESPONSE — no tool_calls AND no content
finish_reason: "none", content_length: 0, tool_calls_count: 0, pdf_size_bytes: 18131221
```

**Die KI (Gemini 2.5 Pro) hat eine leere Antwort zurückgegeben** — kein Tool-Call, kein Text. Das 18MB-PDF hat wahrscheinlich das Timeout oder Context-Limit überschritten.

### Ablauf des Bugs

1. User klickt "Anbieter aus Exposé laden"
2. Edge Function wird aufgerufen → KI gibt leere Antwort zurück
3. `extractedData` enthält nur leere Strings (Defaults)
4. Frontend prüft `if (ext?.developer)` → leerer String ist falsy → **kein Feld wird gesetzt**
5. `markDirty()` wird nie aufgerufen → `dirty` bleibt `false`
6. **Trotzdem** feuert der Erfolgs-Toast: "Anbieter-Daten aus Exposé geladen"
7. Save-Button im Footer bleibt `disabled` (weil `dirty === false`)
8. User sieht: Erfolgs-Meldung, aber keine Daten und keinen aktiven Speichern-Button

### Fix (2 Teile)

**1. Frontend — `loadDeveloperFromExpose` in ProjectDataSheet.tsx:**
- Nach dem Extrahieren prüfen, ob **mindestens ein Feld** tatsächlich Daten enthält
- Wenn ja → Erfolgs-Toast wie bisher
- Wenn nein → Warn-Toast: "KI konnte keine Anbieter-Daten extrahieren. Bitte manuell ergänzen."
- Auch bei leerem Ergebnis `markDirty()` aufrufen, damit der Save-Button aktiv wird und der User manuell editieren + speichern kann

**2. Edge Function — Retry/Fallback bei leerer KI-Antwort:**
- Wenn `exposeStatus === 'empty'` und PDF > 15MB: In der `analyze`-Response ein Flag `aiEmpty: true` setzen
- Frontend kann dann gezielt reagieren

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/projekte/ProjectDataSheet.tsx` | `loadDeveloperFromExpose`: Prüfung ob Daten extrahiert, differenziertes Toast, Save-Button-Aktivierung |

### Code-Änderung

```typescript
// In loadDeveloperFromExpose, nach Zeile 424:
const ext = data?.extractedData || data;
let fieldsPopulated = 0;
if (ext?.developer) { setDevName(ext.developer); fieldsPopulated++; }
if (ext?.developerLegalForm) { setDevLegalForm(ext.developerLegalForm); fieldsPopulated++; }
// ... alle anderen Felder ...

if (fieldsPopulated > 0) {
  markDirty();
  toast.success('Anbieter-Daten aus Exposé geladen', { 
    description: `${fieldsPopulated} Felder befüllt. Bitte prüfen und speichern.` 
  });
} else {
  toast.warning('Keine Anbieter-Daten erkannt', { 
    description: 'Die KI konnte keine Daten extrahieren. Bitte manuell ergänzen.' 
  });
}
```

