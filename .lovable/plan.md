

# Fix: Exposé-Upload im Standalone-Kalkulator & Exposé-Uploader

## Analyse — 3 Fehlerquellen identifiziert

### Problem 1: Bucket-Mismatch (StandaloneCalculatorPanel)
`useUniversalUpload` lädt in Bucket **`tenant-documents`** hoch. Danach ruft der Code `sot-acq-offer-extract` auf, die aber aus **`acq-documents`** liest → Datei nicht gefunden.

### Problem 2: Parameter-Mismatch (StandaloneCalculatorPanel)  
Sendet `{ documentPath, standaloneMode: true }`, aber die Edge Function erwartet `{ offerId, documentId }` und sucht ein `acq_offer_documents`-Record → "Document not found".

### Problem 3: RLS blockiert Upload (ExposeDragDropUploader)
Lädt in `acq-documents` Bucket nach `{tenant_id}/manual/` hoch. Die Storage-Policy erlaubt aber nur Pfade wo `foldername[1]` einer `acq_mandates.id` entspricht. Eine Tenant-ID ist keine Mandate-ID → Upload wird von RLS rejected.

## Lösung

### Fix A: Edge Function `sot-acq-offer-extract` — Standalone-Modus
- Neuen Code-Pfad: wenn `standaloneMode: true` + `storagePath` + `bucketName` übergeben werden, Datei direkt aus dem angegebenen Bucket lesen
- Kein DB-Lookup auf `acq_offer_documents`, kein `offerId` nötig
- Extrahierte Daten direkt als Response zurückgeben (kein DB-Update)
- **Datei:** `supabase/functions/sot-acq-offer-extract/index.ts` (Edge Functions NOT frozen)

### Fix B: StandaloneCalculatorPanel — korrekten Bucket + Parameter senden
- Upload bleibt über `useUniversalUpload` (Bucket `tenant-documents`) — das funktioniert bereits
- Edge-Function-Call anpassen: `{ standaloneMode: true, storagePath: result.storagePath, bucketName: 'tenant-documents' }`
- **Datei:** `src/pages/portal/akquise-manager/components/StandaloneCalculatorPanel.tsx` (MOD-12 UNFROZEN)

### Fix C: Storage-Policy für `acq-documents` — Tenant-Upload erlauben
- Neue INSERT-Policy: erlaubt Upload wenn `foldername[1] = tenant_id` UND User ist Mitglied des Tenants (via `tenant_memberships`)
- Das ermöglicht den `{tenant_id}/manual/` Pfad im ExposeDragDropUploader
- **Typ:** DB-Migration (neue Storage-Policy)

### Kein Change an ExposeDragDropUploader nötig
Der Upload-Pfad `{tenant_id}/manual/` ist korrekt konzipiert — nur die RLS-Policy fehlte.

## Betroffene Dateien
1. `supabase/functions/sot-acq-offer-extract/index.ts` — Standalone-Modus hinzufügen
2. `src/pages/portal/akquise-manager/components/StandaloneCalculatorPanel.tsx` — Parameter-Fix
3. DB-Migration — neue Storage-Policy auf `acq-documents` Bucket

