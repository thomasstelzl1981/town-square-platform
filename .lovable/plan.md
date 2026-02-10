
# DMS Drag & Drop — Analyse und Fix

## Ergebnis der Analyse

### Kritischer Bug: Drag & Drop Upload erstellt KEINE document_links

Der Upload-Flow bei Drag & Drop funktioniert wie folgt:

```text
FileDropZone.onDrop
  -> StorageFileManager.onUploadFiles
    -> StorageTab.handleUploadFiles
      -> uploadMutation.mutate(file)
        -> useUniversalUpload(file, { moduleCode, parentNodeId, source: 'dms' })
```

In `useUniversalUpload` (Zeile 281) wird die `document_links`-Erstellung nur ausgefuehrt, wenn `objectType` UND `objectId` gesetzt sind:

```typescript
if (documentId && objectType && objectId) {
  // document_links erstellen...
}
```

Die DMS StorageTab uebergibt aber NUR `moduleCode`, `parentNodeId` und `source` — NICHT `objectType`/`objectId`. Dadurch wird **kein `document_links`-Eintrag erstellt** und das hochgeladene Dokument ist **nicht dem Ordner zugeordnet**.

Die `documents`-Query in StorageTab laedt Dokumente ueber `document_links.node_id`. Ohne Link = Datei unsichtbar im Ordner.

### Was funktioniert

- Datei wird korrekt in den Blob-Storage (`tenant-documents` Bucket) hochgeladen
- `documents`-Eintrag wird korrekt erstellt
- Storage-Pfad folgt dem Manifest: `{tenantId}/{moduleCode}/{filename}`
- FileDropZone akzeptiert die richtigen MIME-Types (PDF, Word, Excel, Bilder)
- Drag-Overlay mit "Dateien hier ablegen" erscheint korrekt

### Was nicht funktioniert

- `document_links` wird NICHT erstellt (kein `objectType`/`objectId`)
- `storage_nodes` File-Node wird nur erstellt, wenn `effectiveParentId` existiert — aber `parentNodeId` wird als `undefined` uebergeben wenn `selectedNodeId` null ist (Root-Ebene), dann sucht der Code den `MOD_03_ROOT` Node als Fallback
- Upload auf Root-Ebene: Datei landet als File-Node unter `MOD_03_ROOT`, aber ohne `document_links` ist sie im UI unsichtbar

## Fix

### Aenderung in `useUniversalUpload.ts`

Die `document_links`-Erstellung muss AUCH erfolgen, wenn nur `parentNodeId` (= `node_id`) gesetzt ist, ohne dass `objectType`/`objectId` noetig sind. Das ist der DMS-Standard-Upload: Datei einem Ordner zuordnen, ohne spezifischen Object-Kontext.

Aenderung an der Bedingung (Zeile 281):

**Vorher:**
```typescript
if (documentId && objectType && objectId) {
  // document_links erstellen mit node_id, object_type, object_id
}
```

**Nachher:**
```typescript
if (documentId && (objectType && objectId || parentNodeId)) {
  // document_links erstellen
  // node_id = parentNodeId || null
  // object_type = objectType || null  
  // object_id = objectId || null
}
```

So wird bei DMS-Uploads (nur `parentNodeId`, kein `objectType`) trotzdem ein `document_links`-Eintrag mit `node_id` erstellt.

### Zusaetzlich: `all-documents` Query invalidieren

In `StorageTab.tsx` (Zeile 207) fehlt die Invalidierung der `all-documents` Query nach Upload:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['documents'] });
  queryClient.invalidateQueries({ queryKey: ['all-documents'] }); // <-- FEHLT
  queryClient.invalidateQueries({ queryKey: ['document-links'] });
  queryClient.invalidateQueries({ queryKey: ['storage-nodes'] });
},
```

## Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useUniversalUpload.ts` | Bedingung fuer `document_links`-Erstellung erweitern: auch bei `parentNodeId` ohne `objectType` |
| `src/pages/portal/dms/StorageTab.tsx` | `all-documents` Query-Key in `onSuccess` invalidieren |

Nach dem Fix: Screenshot-Pruefung — Datei in einen Ordner drag & droppen, dann pruefen ob sie dort erscheint.
