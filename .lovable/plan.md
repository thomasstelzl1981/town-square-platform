

# Fix: Upload-Enum-Fehler in MOD-12 + Upload-Filter-Audit

## Problem
Die Dateien `useExposeUpload.ts` und `ExposeDragDropUploader.tsx` verwenden `source_type: 'manual_upload'`, aber die DB-Enum `acq_offer_source` kennt nur: `inbound_email, upload, manual, portal_scrape, firecrawl`.

## Fix (2 Dateien)

### 1. `src/hooks/useExposeUpload.ts` (Zeile 49)
- `source_type: 'manual_upload'` → `source_type: 'upload'`

### 2. `src/pages/portal/akquise-manager/components/ExposeDragDropUploader.tsx` (Zeile 105)
- `source_type: 'manual_upload' as any` → `source_type: 'upload' as any`
- Bonus: Der `as any` Cast hier kann auch gleich entfernt werden, da `'upload'` ein gültiger Enum-Wert ist

## Upload-Filter-Audit (andere Module)
Alle anderen `source_type`-Zuweisungen im Codebase verwenden bereits korrekte Enum-Werte:
- `AnalysisTab.tsx`: `source_type: 'manual'` — korrekt
- `AcquiaryNeedsRouting.tsx`: `source_type: 'inbound_email'` — korrekt
- Der TypeScript-Typ `AcqOfferSource` in `useAcqOffers.ts` ist bereits korrekt definiert als `'upload'`

Nur diese 2 Stellen sind betroffen. Minimaler, gezielter Fix.

