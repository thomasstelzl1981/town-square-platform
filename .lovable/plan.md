

# Analyse: Upload-Constraint-Probleme im gesamten System

## Aktuelle DB-Constraints

**document_links.link_status:** `linked`, `pending`, `archived`
**document_links.object_type:** `property`, `unit`, `contact`, `finance_case`, `service_case`, `vehicle`, `insurance`, `lease`, `profil`, `project`, `pet_provider`
**documents.extraction_status:** `pending`, `processing`, `done`, `failed`, `skipped`
**documents.source:** `upload`, `resend`, `caya`, `dropbox`, `onedrive`, `gdrive`, `import`, `email`, `project_intake`

## Gefundene Constraint-Verletzungen

### PROBLEM 1: `link_status: 'active'` in MOD04DocumentPicker (MOD-07)
**Datei:** `src/components/finanzierung/MOD04DocumentPicker.tsx` Zeile 130
**Wert:** `link_status: 'active'` — nicht erlaubt (erlaubt: `linked`, `pending`, `archived`)
**Fix:** Aendern auf `'linked'`

### PROBLEM 2: `link_status: 'current'` in sot-inbound-receive (Edge Function)
**Datei:** `supabase/functions/sot-inbound-receive/index.ts` Zeilen 345 + 629
**Wert:** `link_status: 'current'` — nicht erlaubt
**Fix:** Aendern auf `'linked'`

### PROBLEM 3: `object_type: 'postservice_delivery'` in sot-inbound-receive
**Datei:** `supabase/functions/sot-inbound-receive/index.ts` Zeile 343
**Wert:** nicht im Constraint erlaubt
**Fix:** Constraint erweitern um `'postservice_delivery'`, `'inbound_email'`, `'finance_request'`

### PROBLEM 4: `object_type: 'inbound_email'` in sot-inbound-receive
**Datei:** `supabase/functions/sot-inbound-receive/index.ts` Zeile 627
**Wert:** nicht im Constraint erlaubt
**Fix:** Im selben Constraint-Update wie Problem 3

### PROBLEM 5: `object_type: 'finance_request'` in MOD04DocumentPicker
**Datei:** `src/components/finanzierung/MOD04DocumentPicker.tsx` Zeile 128
**Wert:** nicht im Constraint erlaubt (wird auch in FinanceDocumentsManager + FinanceStorageTree gelesen)
**Fix:** Im selben Constraint-Update

### PROBLEM 6: `source: 'cloud_sync'` in sot-cloud-sync (Edge Function)
**Datei:** `supabase/functions/sot-cloud-sync/index.ts` Zeile 318
**Wert:** `source: 'cloud_sync'` — nicht im documents.source_check erlaubt
**Fix:** Constraint erweitern um `'cloud_sync'`

### PROBLEM 7: `extraction_status: 'completed'` in sot-nk-beleg-parse
**Datei:** `supabase/functions/sot-nk-beleg-parse/index.ts` Zeile 210
**Wert:** `'completed'` — nicht erlaubt (erlaubt: `done`)
**Fix:** Aendern auf `'done'`

## Umsetzungsplan

### Schritt 1: DB-Migration — Constraints erweitern
```sql
-- object_type erweitern
ALTER TABLE public.document_links DROP CONSTRAINT document_links_object_type_check;
ALTER TABLE public.document_links ADD CONSTRAINT document_links_object_type_check
  CHECK (object_type = ANY(ARRAY[
    'property','unit','contact','finance_case','service_case',
    'vehicle','insurance','lease','profil','project','pet_provider',
    'postservice_delivery','inbound_email','finance_request'
  ]));

-- source erweitern
ALTER TABLE public.documents DROP CONSTRAINT documents_source_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_source_check
  CHECK (source = ANY(ARRAY[
    'upload','resend','caya','dropbox','onedrive','gdrive',
    'import','email','project_intake','cloud_sync'
  ]));
```

### Schritt 2: Code-Fixes (3 Dateien)
1. `src/components/finanzierung/MOD04DocumentPicker.tsx` — `link_status: 'active'` auf `'linked'`
2. `supabase/functions/sot-inbound-receive/index.ts` — 2x `link_status: 'current'` auf `'linked'`
3. `supabase/functions/sot-nk-beleg-parse/index.ts` — `extraction_status: 'completed'` auf `'done'`

### Nicht betroffen (korrekt)
- `useUniversalUpload.ts` — nutzt `'pending'` + `'skipped'` (korrekt)
- `useImageSlotUpload.ts` — bereits repariert (`'linked'`, `'skipped'`, `'archived'`)
- `sot-cloud-sync` extraction_status `'pending'` — korrekt
- `useExposeUpload.ts` — schreibt nur in Storage, keine documents/document_links Inserts

