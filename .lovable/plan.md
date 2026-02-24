

# Diagnose: `documents_extraction_status_check` blockiert Upload

## Ursache (eindeutig identifiziert)

In `src/hooks/useUniversalUpload.ts`, Zeile 267:

```typescript
extraction_status: triggerAI ? 'pending' : 'none',
```

Die CHECK-Constraint in der Datenbank erlaubt NUR diese Werte:
```
'pending', 'processing', 'done', 'failed', 'skipped'
```

Der Wert **`'none'`** ist NICHT erlaubt. Da der Magic Intake Auto-Upload mit `triggerAI: false` aufgerufen wird (Zeile 288 in ProjekteDashboard.tsx), wird `'none'` geschrieben → Constraint-Verletzung → Fehler.

## Zum zweiten Punkt: Fehlt ein Projekt-Anlage-Schritt?

Nein, der aktuelle Flow ist bewusst so designed:

1. Die Datei wird in den **generischen Tenant-Storage** hochgeladen (`tenant-documents` Bucket, Pfad `{tenantId}/MOD_13/...`)
2. Ein `documents`-Record wird angelegt (nur als Datei-Referenz)
3. Die KI analysiert die Dateien
4. Erst DANN wird das Projekt via `sot-project-intake` Edge Function erstellt

Das heisst: Es wird kein Projekt-Datenraum vorab benoetigt. Die Datei landet im allgemeinen Tenant-Speicher und wird erst nach Analyse einem Projekt zugeordnet. Das ist architektonisch korrekt — nur der `extraction_status`-Wert ist falsch.

## Fix

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useUniversalUpload.ts` | Zeile 267: `'none'` → `'skipped'` |

Eine einzige Zeile. `'skipped'` ist semantisch korrekt fuer "kein KI-Parsing gewuenscht" und ist in der CHECK-Constraint erlaubt.

```typescript
// Vorher:
extraction_status: triggerAI ? 'pending' : 'none',

// Nachher:
extraction_status: triggerAI ? 'pending' : 'skipped',
```

Kein Modul-Unfreeze noetig — `useUniversalUpload.ts` liegt in `src/hooks/`, ausserhalb aller Modul-Pfade.

