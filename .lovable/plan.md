

# Plan: Upload-Ziel Synchronisation + Drop-Overlay Fix

## Befund

Die Datei wurde tatsachlich hochgeladen (1 MB, Storage OK), aber:

1. **`document_links.node_id = NULL`** -- die Datei ist keinem Ordner zugeordnet
2. **`storage_nodes` file-node hat `parent_id = MOD_04_ROOT`** -- landet im Root statt im Grundbuch-Ordner
3. **Drop-Overlay leuchtet uber den gesamten Bereich** statt nur den Zielordner anzuzeigen

**Root Cause (DatenraumTab / StorageFileManager):**

In `StorageFileManager` gibt es zwei unabhangige Zustande:
- `columnPath` (intern, wird bei ColumnView-Klick aktualisiert)
- `selectedNodeId` (von DatenraumTab, wird als Upload-Ziel verwendet)

**Wenn der User im ColumnView "12_Grundbuch" anklickt**, aktualisiert `handleColumnNavigate` nur `columnPath`. `selectedNodeId` bleibt `null`. Der Upload geht daher an `parentNodeId: null` → Root-Folder.

**Gleiches Problem in EntityStorageTree:** Die `resolveTargetFolderId()`-Logik funktioniert korrekt, aber `document_links.node_id` wird NICHT aus dem resolved folder gesetzt -- der `useUniversalUpload` Hook bekommt `parentNodeId`, setzt das aber nur fur `storage_nodes`, wahrend `document_links` den selben Wert bekommt.

## Losung (3 Dateien)

### 1. `src/components/dms/StorageFileManager.tsx`

**Zeile 256-258:** `handleColumnNavigate` muss auch `onSelectNode` aufrufen, damit `selectedNodeId` synchron bleibt:

```typescript
const handleColumnNavigate = (nodeId: string, depth: number) => {
  setColumnPath(prev => [...prev.slice(0, depth), nodeId]);
  onSelectNode(nodeId); // ← SYNC selectedNodeId for upload target
};
```

### 2. `src/components/dms/FileDropZone.tsx`

Drop-Overlay verbessern: Statt generischem "Dateien hier ablegen" den Zielordner-Namen anzeigen. Dafur einen optionalen `targetFolderName`-Prop einfuhren:

```typescript
interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  targetFolderName?: string; // NEW
}
```

Im Overlay: `Dateien in "Grundbuch" ablegen` statt nur `Dateien hier ablegen`.

### 3. `src/components/shared/EntityStorageTree.tsx`

Den `targetFolderName`-Prop an `FileDropZone` weitergeben, damit der User sieht, in welchen Ordner die Datei geht.

### 4. Daten-Fix

Die bereits hochgeladene Datei (Grundbuchauszug) hat `document_links.node_id = NULL`. Nach dem Code-Fix sollte der nachste Upload korrekt zugeordnet werden. Optional: Migration um die bestehende `document_link` zu patchen (node_id auf den Grundbuch-Folder setzen).

| # | Datei | Anderung |
|---|---|---|
| 1 | `StorageFileManager.tsx` | `handleColumnNavigate` synct `onSelectNode` |
| 2 | `FileDropZone.tsx` | `targetFolderName` Prop + Overlay-Text |
| 3 | `EntityStorageTree.tsx` | `targetFolderName` an FileDropZone ubergeben |
| 4 | DB | Bestehende document_link patchen (node_id setzen) |

