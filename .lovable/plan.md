

# Bugfix-Plan: Bewertungsergebnis wird nicht angezeigt

## Root Cause

Die Edge Function V9.0 versucht, `gemini_research` und `beleihungswert` in die Tabelle `valuation_results` zu speichern — aber diese Spalten existieren nicht. Supabase lehnt den INSERT ab (unbekannte Spalten). Deshalb:

1. Kein Ergebnis in `valuation_results` gespeichert
2. `fetchResult` → `action: get` liefert `results: null`
3. `valueBand` ist null → `ValuationReportReader` gibt `null` zurück
4. UI zeigt leere Seite mit nur "Zurück"-Button

Zusätzliche Probleme:
- **Alte Bewertungen nicht löschbar** — keine Delete-Funktion vorhanden
- **forwardRef-Warnung** — `ValuationReportReader` ist eine Funktionskomponente, wird aber mit ref aufgerufen
- **Kein Fallback bei Status 'final' ohne resultData** — UI-Deadlock

## Fixes

### 1. DB-Migration: Fehlende Spalten hinzufügen
```sql
ALTER TABLE public.valuation_results 
  ADD COLUMN IF NOT EXISTS gemini_research jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS beleihungswert jsonb DEFAULT NULL;
```

### 2. Alte Bewertungen löschen können
In `PropertyValuationTab.tsx`:
- Lösch-Button pro Bewertung in der Liste (Trash-Icon)
- Löscht `valuation_results`, `valuation_inputs`, `valuation_reports` und `valuation_cases` (in dieser Reihenfolge, child-first)
- Query invalidieren nach Löschung

### 3. Robusterer Fallback in PropertyValuationTab
Wenn `showPipeline === true`, Status weder `idle`/`running` ist, und `resultData` null:
- Fehlermeldung anzeigen + "Erneut versuchen"-Button statt leerer Seite

### 4. Edge Function: try/catch um INSERT
Falls der INSERT trotz Migration fehlschlägt, den Fehler abfangen und die Daten trotzdem über `runSummary` zurückgeben (graceful degradation).

### 5. forwardRef-Warnung beheben
Unwahrscheinlich kritisch, aber falls irgendwo ein `ref` an `ValuationReportReader` weitergegeben wird, diesen entfernen.

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| DB-Migration | 2 Spalten zu `valuation_results` hinzufügen |
| `src/components/immobilien/detail/PropertyValuationTab.tsx` | Delete-Funktion + Fallback-State |
| `supabase/functions/sot-valuation-engine/index.ts` | try/catch um Results-INSERT |

