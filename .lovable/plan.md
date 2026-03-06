

## Befund

Die Datei **„ZL003_GBA Straubing Gem. Straubing Blatt 25819 Parkweg 17.pdf"** (1,02 MB) existiert als:

| Ebene | ID | Status |
|---|---|---|
| `documents` | `6d58d8d4-2db6-476c-9807-e08c79933f30` | aktiv (deleted_at = NULL) |
| `document_links` | `5d7a866b-73bc-4808-ab35-f77e1c707f7a` | **node_id = NULL** (broken) |
| Storage-Blob | `029647c3.../MOD_04/451e0542.../1772823132779_ZL003_GBA...pdf` | vorhanden |
| `storage_nodes` | — | **kein Eintrag** |

Die Datei hat keinen `storage_node` und keinen Ordner-Verweis → sie ist ein "Geist-Dokument", das keinem Ordner zugeordnet ist und daher unsichtbar im Datenraum erscheint, aber den Speicherplatz belegt.

Der `delete_storage_file`-RPC kann sie **nicht** löschen, weil er über `storage_nodes` sucht und dafür kein Eintrag existiert.

## Plan: Geist-Datei bereinigen

Eine einzige DB-Migration mit 3 Schritten:

1. **`document_links` löschen** — `DELETE FROM document_links WHERE id = '5d7a866b-...'`
2. **`documents` soft-delete** — `UPDATE documents SET deleted_at = now() WHERE id = '6d58d8d4-...'`
3. **Storage-Blob entfernen** — über `supabase.storage.from('tenant-documents').remove(...)` im Client, oder als zusätzlicher Cleanup-Hinweis

Da es keinen `storage_node` gibt, sind nur 2 DB-Operationen nötig. Den Blob lösche ich separat via Code.

## Zusätzlich

Danach ist der Datenraum von Parkweg 17 sauber und du kannst den Grundbuchauszug in den richtigen Ordner hochladen.

