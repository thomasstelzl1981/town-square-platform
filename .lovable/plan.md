

# DMS Storage — Supabase-Style Premium File Manager (Verfeinert)

## Referenz-Design (aus den 5 Supabase-Screenshots)

Die Screenshots zeigen praezise, was wir nachbauen:

1. **List View**: Saubere Tabelle mit Spalten Name | Size | Type | Created at | Last modified at. Toolbar mit `< Zurueck-Pfeil`, Breadcrumb-Pfad, dann rechts: `Views`, `Sort`, `Upload file`. KEINE Muelleimer-Icons an den Zeilen — stattdessen gar nichts oder ein 3-Punkt-Menue (`...`) das per Hover erscheint.

2. **Column View**: Miller-Spalten (macOS Finder-Stil). Links die Root-Elemente, Klick auf Ordner oeffnet naechste Spalte rechts. Ordner haben ein graues Folder-Icon, Dateien ein Typ-spezifisches Icon.

3. **File Preview**: Linke Spalte zeigt Dateiliste mit Timestamps. Rechts die Vorschau (Video/Audio/Bild Player) mit Metadaten darunter: Filename, Type + Size, Added on, Last modified, Download + Copy URL Buttons, Delete file Link.

4. **Multi Select Actions**: Spaltenbasierte Ansicht mit Checkboxen pro Ordner/Datei. Oben gruene Action-Bar: `X  4 items selected | Delete | + Move`. Gruene Checkboxen bei ausgewaehlten Items.

5. **Path Navigator**: Breadcrumb wird zu einem editierbaren Textfeld `bucket-1/cats/dogs` mit `Cancel` und `Set path` Buttons. Darunter die normale Tabelle.

## Was sich gegenueber dem letzten Plan aendert/verfeinert

### Kern-Verbesserung 1: Weg mit den Muelleimer-Icons
- **Aktuell**: Jede Dateizone hat `Download` + `Trash2` Icons direkt sichtbar — sieht haesslich aus
- **Neu**: Nur ein dezentes 3-Punkt-Menue (`MoreVertical` oder `Ellipsis`) das bei Hover erscheint, wie bei Supabase
- Das Menue oeffnet ein `DropdownMenu` mit: Herunterladen | Umbenennen | Verschieben | Loeschen
- Kein sichtbarer Muell/Download-Button in der Tabellenzeile

### Kern-Verbesserung 2: Drag & Drop Upload Zone
- Der gesamte Dateibereich ist eine Drop-Zone (bereits via `FileDropZone` implementiert)
- Visuelles Feedback beim Dragover: semi-transparentes Overlay mit Upload-Icon + "Dateien hier ablegen"
- Upload-Button in der Toolbar als primaerer CTA: `Upload file` (nicht "Hochladen" mit Plus-Icon)

### Kern-Verbesserung 3: Professionelle Typografie
- Tabellen-Header: `text-xs font-medium text-muted-foreground uppercase tracking-wider`
- Dateinamen: `text-sm font-normal` (nicht fett)
- Metadaten (Size, Type, Date): `text-sm text-muted-foreground`
- Breadcrumb-Pfad: `text-sm` mit `>` als Separator
- Statuszeile unten: `text-xs text-muted-foreground`

## Gesamt-Layout: Eine grosse Kachel

```text
┌─────────────────────────────────────────────────────────────────┐
│  Org-Name  >  Projekt-Name                                     │
│                                                                 │
│  < bucket-1  >  cats                                            │
│                                     Views   Sort   Upload file  │
│  ───────────────────────────────────────────────────────────── │
│  ☐  Name              Size        Type         Created at       │
│  ───────────────────────────────────────────────────────────── │
│     coughing-cat.png   708.96 KB   image/png    24/03/2021  ... │
│     dogs               -           -            -           ... │
│     grumpy-cat.jpg     66.57 KB    image/jpeg   24/03/2021  ... │
│     long-cat.jpg       222.47 KB   image/jpeg   24/03/2021  ... │
│                                                                 │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│  7 Elemente                                                     │
└─────────────────────────────────────────────────────────────────┘
```

Alles in **einer einzigen `rounded-2xl` Kachel** mit `bg-card border shadow-sm`.

## Die 5 View-Modi im Detail

### 1. List View (Standard) — wie Supabase Screenshot 3
- Spalten: `☐ | Name | Size | Type | Created at | ...`
- `...` ist ein `MoreVertical`-Icon das nur bei Hover sichtbar wird
- Klick auf `...` oeffnet DropdownMenu: Herunterladen | Details | Umbenennen | Verschieben | Loeschen
- Ordner und Dateien gemischt, Ordner zuerst (grauer Folder-Icon)
- Klick auf Ordner navigiert hinein (Breadcrumb aktualisiert sich)
- Sortierung per Klick auf Spaltenkoepfe (Pfeil-Indicator)
- Leerer Zustand: dezenter Hinweis mit Upload-Aufforderung

### 2. Column View — wie Supabase Screenshot 2
- Miller-Spalten nebeneinander, getrennt durch feine vertikale Linien
- Linke Spalte: Root-Ordner (System + Module mit Nummerierung)
- Klick auf Ordner oeffnet Inhalt in der naechsten Spalte
- Dateien werden mit Typ-Icon und Name angezeigt, Ordner mit Folder-Icon
- Horizontal scrollbar bei tiefer Verschachtelung
- Implementierung mit flexiblen `div`-Spalten (feste Breite ~200px pro Spalte)

### 3. File Preview — wie Supabase Screenshot 1
- Split-View: Links Dateiliste (schmal), Rechts Preview + Metadaten
- Linke Liste zeigt Dateinamen + Last modified Timestamps
- Aktive Datei ist gruen hervorgehoben
- Rechts: Grosses Preview (Bild direkt anzeigen, PDF-Icon fuer PDFs, Audio/Video Platzhalter)
- Darunter Metadaten: Filename, Type + Size, Added on, Last modified
- Action-Buttons: `Download` und `Copy URL` (Outline-Buttons)
- `Delete file` als roter Text-Link ganz unten

### 4. Multi Select — wie Supabase Screenshot 4
- Spaltenbasierte Ansicht wie Column View, aber mit Checkboxen
- Jede Spalte hat oben "Select all X files" Checkbox
- Ausgewaehlte Items: gruene Checkbox
- Oben: gruene Action-Bar: `X  [Anzahl] items selected | Delete | + Move`
- X-Button links zum Abbrechen der Auswahl

### 5. Path Navigator — wie Supabase Screenshot 5
- Breadcrumb-Bereich wird zu einem editierbaren Textfeld
- User kann Pfad direkt eintippen: `04_Immobilien/Musterstr_5/01_Grunddaten`
- Buttons: `Cancel` und `Set path` (gruen/primary)
- Darunter: normale Tabellenansicht des navigierten Pfads

## Toolbar-Design (innerhalb der Kachel, oberer Bereich)

```text
┌─────────────────────────────────────────────────────────────┐
│  <   bucket-1  >  cats                                      │
│                              [Views ▾]  [Sort ▾]  [Upload]  │
└─────────────────────────────────────────────────────────────┘
```

- **Zurueck-Pfeil** (`<`): Navigiert eine Ebene hoch, nur sichtbar wenn nicht auf Root
- **Breadcrumb**: Klickbare Pfad-Segmente mit `>` Separator
- **Views-Button**: Dropdown mit den 5 Ansichten (Icons + Labels)
- **Sort-Button**: Dropdown mit Sortieroptionen (Name, Size, Type, Created at, Last modified)
- **Upload file-Button**: Primary/filled, oeffnet File-Picker ODER Drag & Drop
- **Neuer Ordner**: Plus-Icon-Button neben Upload, oeffnet Inline-Input oder Dialog

## Technische Umsetzung

### Neue Dateien:

**`src/components/dms/StorageFileManager.tsx`** — Der Haupt-Container
- State: `viewMode`, `currentNodeId`, `selectedIds`, `sortBy`, `sortDir`, `isPathEditing`
- Rendert: Toolbar + aktive View + Statuszeile
- Empfaengt Daten (nodes, documents, mutations) als Props von StorageTab

**`src/components/dms/views/ListView.tsx`** — Tabellen-Ansicht
- Eigene Tabelle (kein DataTable-Wrapper) fuer volle Kontrolle
- Spalten: Checkbox | Name (Icon + Text) | Size | Type | Created at | 3-Punkt-Menue
- Hover-Effekt auf Zeilen (`hover:bg-muted/50`)
- 3-Punkt-Menue pro Zeile: `DropdownMenu` mit Herunterladen | Details | Loeschen
- Sortierung per Klick auf Spaltenkoepfe

**`src/components/dms/views/ColumnView.tsx`** — Miller-Spalten
- Flexbox mit festen Spalten (~200px breit, `border-r`)
- Jede Spalte zeigt Ordner/Dateien einer Ebene
- Klick auf Ordner oeffnet naechste Spalte
- `overflow-x-auto` fuer horizontales Scrollen

**`src/components/dms/views/PreviewView.tsx`** — Datei-Preview
- Split: Links schmale Dateiliste (Scroll), Rechts Preview-Bereich
- Bild-Preview via Signed URL (inline `<img>`)
- PDF/andere: Grosses Typ-Icon + Metadaten-Karte
- Download + Copy URL Buttons, Delete-Link

**`src/components/dms/views/MultiSelectView.tsx`** — Mehrfachauswahl
- Spaltenbasiert wie ColumnView, aber mit Checkboxen
- Gruene Action-Bar oben bei Auswahl
- "Select all" pro Spalte

**`src/components/dms/views/PathNavigatorView.tsx`** — Pfad-Navigation
- Editierbares Textfeld fuer den Pfad
- Cancel + Set path Buttons
- Darunter: ListView als Fallback-Anzeige

**`src/components/dms/StorageToolbar.tsx`** — Toolbar-Komponente
- Zurueck-Button, Breadcrumb, Views-Dropdown, Sort-Dropdown, Upload-Button, Neuer-Ordner-Button
- Views-Dropdown zeigt 5 Optionen mit Icons

**`src/components/dms/FileRowMenu.tsx`** — 3-Punkt-Menue pro Datei/Ordner
- `DropdownMenu` mit `MoreVertical` als Trigger
- Items: Herunterladen | Details anzeigen | Umbenennen | Verschieben | Loeschen
- Loeschen in rot (`text-destructive`)

**`src/components/dms/NewFolderDialog.tsx`** — Dialog zum Ordner anlegen
- Einfacher Dialog mit Input fuer Ordnernamen
- Erstellt `storage_nodes` Record unter aktuellem Node

### Geaenderte Dateien:

**`src/pages/portal/dms/StorageTab.tsx`** — Stark vereinfacht
- Behaelt alle Datenlogik: Queries, Mutations, Seeding
- Rendert nur noch `<StorageFileManager>` und uebergibt alles als Props
- Kein Layout-Code mehr in StorageTab selbst

**`src/components/dms/BulkActionBar.tsx`** — Styling-Upgrade
- Gruene/primary Hintergrundfarbe wie Supabase
- Weisse Schrift auf gruenem Hintergrund
- `X [Anzahl] ausgewaehlt | Loeschen | + Verschieben`

**`src/components/dms/FileDropZone.tsx`** — Bleibt, umschliesst den Manager
- Bestehendes Overlay-Design passt bereits

### Nicht mehr genutzte Dateien:

- **`StorageFolderTree.tsx`** — Separate Tree-Panel faellt weg. Navigation inline via Column View, Breadcrumb und Klick in Tabelle. Die Icon-Mappings und `getNodeIcon` Logik wird in die neuen Views uebernommen.
- **`FileDetailPanel.tsx`** — Ersetzt durch PreviewView (integriert) und FileRowMenu (Aktionen)
- **`StorageBreadcrumb.tsx`** — Ersetzt durch inline Breadcrumb im StorageToolbar (einfacher, flacher Stil)

### Design-Spezifikationen:

**Kachel-Container:**
- `rounded-2xl bg-card border shadow-sm overflow-hidden`
- Volle Hoehe: `h-[calc(100vh-12rem)]`

**Toolbar (innerhalb Kachel):**
- `px-4 py-3 border-b bg-card flex items-center gap-3`
- Zurueck-Pfeil: `Button variant="ghost" size="icon"`
- Breadcrumb: `text-sm text-muted-foreground` Segmente, letztes Segment `text-foreground font-medium`

**Tabellen-Header:**
- `px-4 py-2 bg-muted/30 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide`

**Tabellen-Zeilen:**
- `px-4 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer`
- Kein sichtbarer Button/Icon ausser dem 3-Punkt-Menue bei Hover
- 3-Punkt-Menue: `opacity-0 group-hover:opacity-100` Transition

**Ordner-Icons:**
- Graue Folder-Icons (`text-muted-foreground`) wie bei Supabase
- Dateien: Typ-spezifische Icons in `text-muted-foreground`

**Statuszeile (unten):**
- `px-4 py-2 border-t text-xs text-muted-foreground`
- "X Elemente · Y MB"

### Beibehaltene Logik (unveraendert):
- `STORAGE_MANIFEST` + `getModuleDisplayName()` + `getSortedModules()`
- System-Folder und Module-Root Seeding
- `useUniversalUpload` Hook
- Upload/Download/Delete Mutations
- `FileDropZone` Wrapper (react-dropzone)
- Alle bestehenden Queries und Interfaces

### Items-Datenstruktur (Ordner + Dateien gemischt):

```typescript
type FileManagerItem = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  mimeType?: string;
  createdAt: string;
  lastModified?: string;
  // Fuer Ordner
  nodeId?: string;
  childCount?: number;
  moduleCode?: string;
  templateId?: string;
  // Fuer Dateien
  documentId?: string;
  filePath?: string;
  publicId?: string;
};
```

### Implementierungs-Reihenfolge:
1. `FileRowMenu.tsx` — 3-Punkt-Menue (ersetzt haessliche Trash-Icons)
2. `StorageToolbar.tsx` — Toolbar mit Views/Sort/Upload/Neuer Ordner
3. `ListView.tsx` — Haupttabelle im Supabase-Stil
4. `NewFolderDialog.tsx` — Ordner-Erstellung
5. `ColumnView.tsx` — Miller-Spalten
6. `PreviewView.tsx` — Datei-Preview Split
7. `MultiSelectView.tsx` — Mehrfachauswahl mit gruener Bar
8. `PathNavigatorView.tsx` — Pfad-Editor
9. `StorageFileManager.tsx` — Container der alles verbindet
10. `StorageTab.tsx` — Vereinfacht auf Daten-Layer
11. `BulkActionBar.tsx` — Styling-Upgrade (gruen)

