

## Fix: Delete-Button wird von Dropzone abgefangen

### Root Cause

In `ImageSlotGrid.tsx` ist das Hover-Overlay (mit "Löschen"-Button) **innerhalb** des `getRootProps()` Containers. React-dropzone fängt den Click auf Root-Level ab und öffnet den Datei-Dialog, bevor der Delete-Handler ausgeführt wird. `e.stopPropagation()` reicht nicht, weil die Dropzone den Click direkt am Root-Element abfängt.

### Fix

**Datei:** `src/components/shared/ImageSlotGrid.tsx`

1. Dropzone mit `noClick: true` konfigurieren — verhindert, dass Klicks automatisch den Datei-Dialog öffnen
2. Den "Hinzufügen"/"Ersetzen"-Button im Overlay öffnet den Dialog manuell via `open()` von useDropzone
3. Der "Löschen"-Button führt nun korrekt `handleDeleteCurrent` aus ohne Dropzone-Interferenz
4. Leere Slots (ohne Bild) behalten Click-to-Upload über einen manuellen `onClick={open}` Handler

### Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/components/shared/ImageSlotGrid.tsx` | `noClick: true` + manuelles `open()` für Upload-Buttons, Delete-Button funktioniert ohne Interferenz |

### Systemweit

Da `ImageSlotGrid` die einzige shared Foto-Container-Komponente ist, gilt der Fix automatisch für alle Module (MOD-01, MOD-13, MOD-22).

