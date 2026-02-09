
# DMS Storage — OneDrive-Style Dateimanager mit Modulnummerierung

## Zusammenfassung

Kompletter Umbau der Storage-Seite zu einem modernen Dateimanager im OneDrive-Stil mit:
- Modulnummern im Ordnerbaum (z.B. "03 — DMS", "04 — Immobilien")
- Alle 20 Module aus dem `STORAGE_MANIFEST` als SSOT
- Verbessertes Layout mit Toolbar, Breadcrumb-Navigation, Kontextmenue
- Drag & Drop Upload direkt in Ordner
- Detail-Panel rechts (statt Drawer)
- Bulk-Aktionen (Mehrfachauswahl, Download, Loeschen)

---

## Was sich aendert

### 1. Ordnerbaum: STORAGE_MANIFEST als SSOT + Modulnummern

Aktuell sind nur 10 Module hardcoded in `MODULE_ROOT_FOLDERS`. Neu: Alle 20 Module kommen direkt aus `STORAGE_MANIFEST`, sortiert nach `display_order`, mit Nummerierung:

```text
Alle Dokumente
Posteingang
Eigene Dateien
────────────────
01 — Stammdaten
02 — KI Office
03 — DMS
04 — Immobilien
  ├── Musterstr. 5
  │   ├── 01_Grunddaten
  │   ├── 02_Grundbuch
  │   └── ...
05 — MSV
06 — Verkauf
07 — Finanzierung
08 — Investments
09 — Vertriebspartner
10 — Leads
11 — Finanzierungsmanager
12 — Akquise-Manager
13 — Projekte
14 — Communication Pro
15 — Fortbildung
16 — Services
17 — Car-Management
18 — Finanzanalyse
19 — Photovoltaik
20 — Miety
────────────────
Zur Pruefung
Archiv
Sonstiges
Papierkorb
```

### 2. Layout: OneDrive-Stil

```text
┌─────────────────────────────────────────────────────────────┐
│ Toolbar: [Breadcrumb: DMS > Immobilien > Musterstr. 5]     │
│          [Upload] [Neuer Ordner] [Ansicht: Liste/Grid]      │
├──────────┬──────────────────────────────┬───────────────────┤
│ Ordner   │ Dateien                      │ Detail-Panel      │
│ (Tree)   │ ┌────┬──────┬────┬────┬────┐ │ (bei Auswahl)     │
│          │ │ ✓  │ Name │ Typ│Size│Date│ │                   │
│ 01 Stamm │ │ □  │ expo │PDF │2MB │3d  │ │ Dateiname.pdf     │
│ 02 KI    │ │ □  │ grun │PDF │1MB │5d  │ │ 2.3 MB            │
│ 03 DMS   │ │ □  │      │    │    │    │ │ Hochgeladen: ...  │
│ 04 Immo  │ │    │      │    │    │    │ │ [Download]        │
│  > Must  │ │    │      │    │    │    │ │ [Loeschen]        │
│ ...      │ │    │      │    │    │    │ │                   │
│ Papierko │ │    │      │    │    │    │ │                   │
└──────────┴──────────────────────────────┴───────────────────┘
```

- **Breadcrumb-Navigation**: Zeigt den aktuellen Pfad, klickbar
- **Toolbar**: Upload-Button, Neuer Ordner, Ansichtswechsel (spaeter Grid)
- **Detail-Panel**: Rechts eingeblendet bei Dateiauswahl (statt Drawer/Overlay)
- **Checkbox-Spalte**: Fuer Mehrfachauswahl + Bulk-Aktionen

### 3. Drag & Drop Zone

- Der gesamte Dateibereich ist eine Drop-Zone
- Visueller Feedback: blauer Rahmen + "Dateien hier ablegen" Overlay
- Drop laedt direkt in den aktuell gewaehlten Ordner hoch

### 4. Kontextmenue (Rechtsklick)

Auf Dateien:
- Herunterladen
- Umbenennen (spaeter)
- Verschieben (spaeter)
- Loeschen

Auf Ordner (im Tree):
- Neuer Unterordner
- Loeschen (nur wenn leer + nicht System)

### 5. Bulk-Aktionen

Bei Mehrfachauswahl erscheint eine Aktionsleiste:
- "X Dateien ausgewaehlt"
- [Herunterladen] [Loeschen]

---

## Technische Umsetzung

### Dateien (neu):
- `src/components/dms/StorageBreadcrumb.tsx` — Breadcrumb-Pfad-Navigation
- `src/components/dms/FileDetailPanel.tsx` — Rechtes Detail-Panel (ersetzt DetailDrawer)
- `src/components/dms/FileDropZone.tsx` — Drag & Drop Overlay-Wrapper
- `src/components/dms/BulkActionBar.tsx` — Aktionsleiste bei Mehrfachauswahl

### Dateien (geaendert):
- `src/pages/portal/dms/StorageTab.tsx` — Komplett neues Layout (3-Panel: Tree | Files | Detail)
- `src/components/dms/StorageFolderTree.tsx` — Modulnummern aus STORAGE_MANIFEST, alle 20 Module, Separator-Linien, Icons
- `src/config/storageManifest.ts` — Neue Hilfsfunktion `getModuleDisplayName()` die "XX — Name" zurueckgibt

### Ablauf:
1. `StorageFolderTree.tsx` anpassen: STORAGE_MANIFEST importieren, Modulnummer vor den Namen setzen, alle 20 Module anzeigen, Sortierung nach `display_order`
2. `StorageTab.tsx` umbauen: 3-Panel-Layout, Breadcrumb, Drop-Zone, Checkbox-Selection, Detail-Panel statt Drawer
3. Neue Komponenten: Breadcrumb, FileDetailPanel, FileDropZone, BulkActionBar
4. storageManifest.ts: Helper `getModuleDisplayName(moduleCode)` => `"04 — Immobilien"`

### Besonderheiten:
- `MODULE_ROOT_FOLDERS` in StorageTab.tsx wird durch `STORAGE_MANIFEST` ersetzt (SSOT)
- Die Seeding-Logik bleibt kompatibel — sie prueft weiterhin `template_id` Matches
- System-Ordner (Posteingang, Eigene Dateien, etc.) bleiben hardcoded — sie haben kein Modul
- `react-dropzone` ist bereits installiert und wird fuer die Drop-Zone genutzt
