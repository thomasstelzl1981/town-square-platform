

# Fix: documents_extraction_status_check Constraint Violation

## Problem
`useImageSlotUpload.ts` setzt `extraction_status: 'none'` beim documents-Insert. Der CHECK Constraint erlaubt nur: `pending`, `processing`, `done`, `failed`, `skipped`.

## Fix
In `src/hooks/useImageSlotUpload.ts` den Wert `'none'` durch `'skipped'` ersetzen (Zeile im documents-Insert). Bilder brauchen keine AI-Extraktion, daher ist `skipped` semantisch korrekt.

Eine Zeile, eine Datei.

