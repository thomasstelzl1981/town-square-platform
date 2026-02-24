

# Fix: `documents_source_check` Constraint-Verletzung

## Ursache

In `ProjekteDashboard.tsx` wird `source: 'project_intake'` uebergeben (Zeilen 288, 347, 352). Die Datenbank-CHECK-Constraint erlaubt aber nur diese Werte:

```
'upload', 'resend', 'caya', 'dropbox', 'onedrive', 'gdrive', 'import', 'email'
```

`'project_intake'` ist nicht dabei.

## Loesung

Zwei Aenderungen:

| # | Aenderung | Ort |
|---|-----------|-----|
| 1 | CHECK-Constraint erweitern um `'project_intake'` | DB-Migration |
| 2 | TypeScript-Type `DocumentSource` erweitern | `src/types/document-schemas.ts` |

### 1. DB-Migration

```sql
ALTER TABLE public.documents DROP CONSTRAINT documents_source_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_source_check 
  CHECK (source = ANY (ARRAY[
    'upload','resend','caya','dropbox','onedrive','gdrive','import','email','project_intake'
  ]));
```

### 2. TypeScript-Type

In `src/types/document-schemas.ts`, Zeile 97:

```typescript
// Vorher:
export type DocumentSource = 'upload' | 'resend' | 'caya' | 'dropbox' | 'onedrive' | 'gdrive' | 'import';

// Nachher:
export type DocumentSource = 'upload' | 'resend' | 'caya' | 'dropbox' | 'onedrive' | 'gdrive' | 'import' | 'email' | 'project_intake';
```

Kein Modul-Unfreeze noetig — `document-schemas.ts` liegt in `src/types/` (kein Modul-Pfad), und die DB-Migration ist ausserhalb jeder Modul-Zuordnung.

