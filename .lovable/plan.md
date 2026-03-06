

# Datenraum nach Objekteingang verschieben + Upload aus Tools entfernen

## Änderungen

### 1. `ObjekteingangList.tsx` — Datenraum unten anfügen
- `AcqDataRoom` importieren aus `./components`
- Als Collapsible-Section ganz unten nach der Tabelle einfügen (gleiche Collapsible-Pattern wie in AkquiseTools)
- FolderOpen Icon, Titel "Datenraum", Hint "Akquise-Dokumente und Exposés"

### 2. `AkquiseTools.tsx` — Datenraum + Upload entfernen
- Kompletten Datenraum-Collapsible-Block (Zeilen 65-87) entfernen
- Kompletten Exposé-Upload-Collapsible-Block (Zeilen 41-63) entfernen
- Imports bereinigen: `AcqDataRoom`, `ExposeDragDropUploader`, `FolderOpen`, `Upload` entfernen
- State-Variablen `dataRoomOpen` und `exposeUploadOpen` entfernen

### 3. Prüfung AcqDataRoom → Storage-Verlinkung
Die Komponente liest korrekt aus dem `acq-documents` Bucket unter `{tenant_id}/` mit Supabase Storage API. Downloads laufen direkt über `supabase.storage.from('acq-documents').download()`. Die Verlinkung zum DMS-Storage ist korrekt — der Bucket `acq-documents` ist der registrierte Storage-Bucket für MOD-12 laut `storageManifest`.

### Dateien
| Datei | Aktion |
|-------|--------|
| `ObjekteingangList.tsx` | + Import AcqDataRoom, + Collapsible am Ende |
| `AkquiseTools.tsx` | − Datenraum-Block, − Upload-Block, − unused imports/state |

