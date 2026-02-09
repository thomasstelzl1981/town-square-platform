

# Upload-Architektur: 2-Phasen-Contract

## Status: Implementiert ✅

Die Upload-Architektur folgt einem verbindlichen 2-Phasen-Modell, das in `storageManifest.ts` und `useUniversalUpload.ts` dokumentiert ist.

### Phase 1 — Upload + Registrierung (immer)
1. Datei → Supabase Storage (`tenant-documents` Bucket)
2. `documents` Record erstellen
3. `document_links` erstellen (wenn Kontext vorhanden)
4. `storage_nodes` File-Node erstellen
5. **Status: `uploaded`** — User sieht die Datei sofort (Name, Größe, Vorschau-Link)

### Phase 2 — KI-Analyse (optional)
6. `sot-document-parser` aufrufen (nur `storagePath`, nie Dateiinhalt)
7. Extraktionsergebnisse speichern
8. **Status: `done`**

### Regeln
- **Jeder Upload** nutzt `useUniversalUpload`
- **Kein** base64 an Edge Functions
- **Alle** Pfade über `buildStoragePath()`
- **UploadResultCard** für visuelles Feedback
- **useSmartUpload** ist deprecated (Re-Export)

### Betroffene Dateien
- `src/hooks/useUniversalUpload.ts` — Hook
- `src/config/storageManifest.ts` — Contract-Dokumentation
- `src/components/shared/UploadResultCard.tsx` — UI-Komponente
- `src/components/finanzierung/FinanceUploadZone.tsx` — Integriert
- `src/pages/portal/dms/StorageTab.tsx` — Integriert

### Vorherige Cleanup-Migration
- 140 → ~97 Storage-Nodes (Duplikate entfernt)
- UNIQUE Constraints auf Root- und Kind-Nodes
- Alle Entities (Leipzig, Porsche, BMW, Menden) intakt
