

## Bestandsaufnahme

**Shared UI-Schicht (nicht frozen, frei editierbar):**
- `src/components/dms/views/ColumnView.tsx` — Column-Browser, hat bereits inline file-actions (Download/Preview/Delete), aber Ordner haben nur FileRowMenu (3-Punkte)
- `src/components/dms/views/ListView.tsx` — Listenansicht, Klick = navigate/preview, keine Selektion-basierte Action-Bar
- `src/components/dms/FileRowMenu.tsx` — 3-Punkte-Kontextmenü (sekundär)
- `src/components/dms/BulkActionBar.tsx` — Bulk-Actions bei Checkbox-Selektion (nur StorageFileManager)
- `src/components/dms/StorageFileManager.tsx` — Orchestrator für MOD-03 DMS
- `src/components/shared/EntityStorageTree.tsx` — Orchestrator für RecordCard-Datenräume (MOD-04, MOD-07 etc.)

**Module-Seiten (alle frozen, werden NICHT angefasst):**
- MOD-03: StorageTab, PosteingangTab — nutzen StorageFileManager
- MOD-04: DatenraumTab — nutzt EntityStorageTree
- MOD-07: FinanceDocumentsManager — nutzt StorageFileManager

Da alle Änderungen in der shared Schicht (`src/components/dms/*`, `src/components/shared/*`) erfolgen, sind keine Module-Unfreezes nötig.

---

## Plan

### 1. Neue Shared-Komponente: `SelectionActionBar`

**Datei:** `src/components/dms/SelectionActionBar.tsx`

Zeigt kontextabhängige Aktionen für ein einzelnes selektiertes Element:

- **Datei selektiert:** Buttons "Öffnen" | "Download" | "Löschen"
- **Ordner selektiert:** Buttons "Neuer Unterordner" | "Löschen"
- Zeigt den Namen des selektierten Elements
- Erscheint als schmale Bar oberhalb des Content-Bereichs (gleicher Stil wie BulkActionBar)
- Enthält X-Button zum Aufheben der Selektion

### 2. ColumnView erweitern

- **Selektions-State nach oben heben:** `selectedItem` (FileManagerItem | null) als Prop oder interner State, der an den Parent kommuniziert wird
- Ordner-Klick = Navigation UND Selektion (wie bisher), aber zusätzlich wird der Ordner als "aktiv selektiertes Element" gemeldet
- Datei-Klick = Selektion (wie bisher)
- **Ordner-Inline-Actions:** Neben dem FileRowMenu auch sichtbare Trash-/FolderPlus-Icons anzeigen (analog zu Dateien)
- Neuer Callback: `onSelectedItemChange(item: FileManagerItem | null)` — meldet Selektion an Parent

### 3. ListView erweitern

- **Single-Click auf Datei:** Setzt Selektion (statt sofort Preview). Datei wird visuell markiert (bg-primary/10 ring-1 — gleich wie ColumnView)
- **Single-Click auf Ordner:** Navigation bleibt, aber Ordner wird als selektiert gemeldet
- **Double-Click auf Datei:** Primäraktion (Preview/Download) — wie bisher
- Neuer Callback: `onSelectItem(item: FileManagerItem | null)` — meldet Selektion an Parent

### 4. StorageFileManager: Selection-State + ActionBar integrieren

- Neuer State: `selectedItem: FileManagerItem | null`
- `SelectionActionBar` wird zwischen Toolbar/BulkActionBar und Content eingebaut
- Wenn `selectedItem` gesetzt: ActionBar sichtbar
- Klick in leere Fläche oder Ordnerwechsel → `setSelectedItem(null)`
- Nach Löschen → `setSelectedItem(null)`

### 5. EntityStorageTree: Selection-State + ActionBar integrieren

- Neuer State: `selectedItem: FileManagerItem | null`
- `SelectionActionBar` wird oberhalb der ColumnView eingebaut
- ColumnView meldet Selektion über neuen Callback
- Gleiche Logik: leere Fläche / Ordnerwechsel / Löschen → Reset

### 6. Keyboard-Shortcuts

In `StorageFileManager` und `EntityStorageTree` (oder als Shared-Hook `useStorageKeyboard`):

- **Delete / Backspace:** Wenn `selectedItem` gesetzt → Bestätigungsdialog → Löschen
- **Enter:** Wenn Datei selektiert → Primäraktion (Download/Preview)
- **Escape:** Selektion aufheben

Implementation: `useEffect` mit `keydown`-Listener auf dem Container-Div (tabIndex={0}).

### 7. Bestätigungsdialog

Aktuell wird `confirm()` (Browser-native) verwendet. Das bleibt so — es ist systemweit konsistent und funktioniert. Kein AlertDialog-Umbau nötig.

### 8. Mobile/Touch

- ListView-Mobile hat bereits sichtbare FileRowMenu-Buttons pro Zeile
- SelectionActionBar erscheint auch auf Mobile bei selektiertem Element
- Touch-Tap = Single-Click = Selektion (keine Double-Click-Abhängigkeit für Löschen)

---

## Nicht angefasst

- Upload-Core, Delete-RPCs, Datenmodell, Storage-Struktur
- Module-spezifische Dateien (alle frozen)
- FileRowMenu bleibt als sekundäre Option bestehen

## Betroffene Dateien

| Datei | Aktion |
|---|---|
| `src/components/dms/SelectionActionBar.tsx` | NEU — Shared Action-Bar |
| `src/components/dms/views/ColumnView.tsx` | Ordner-Inline-Actions, selectedItem-Callback |
| `src/components/dms/views/ListView.tsx` | Single-Click=Select, Double-Click=Action, selectedItem-Callback |
| `src/components/dms/StorageFileManager.tsx` | selectedItem State, ActionBar, Keyboard |
| `src/components/shared/EntityStorageTree.tsx` | selectedItem State, ActionBar, Keyboard |

## Testmatrix

| Test | Erwartung |
|---|---|
| Datei single-click | Visuell markiert, ActionBar erscheint mit Öffnen/Download/Löschen |
| Datei double-click | Primäraktion (Download/Preview) |
| Datei löschen (ActionBar) | Bestätigungsdialog → RPC delete_storage_file → Selektion reset |
| Ordner single-click | Navigation + ActionBar mit Unterordner/Löschen |
| Ordner löschen (ActionBar) | Bestätigungsdialog → RPC delete_storage_folder → Fehlermeldung bei Guards |
| Delete-Taste | Bestätigungsdialog für selektiertes Element |
| Enter-Taste | Primäraktion für selektierte Datei |
| Escape-Taste | Selektion aufgehoben, ActionBar verschwindet |
| Leere Fläche klicken | Selektion aufgehoben |
| Ordnerwechsel | Datei-Selektion wird zurückgesetzt |

