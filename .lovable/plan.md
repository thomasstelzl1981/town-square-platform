
# DMS Storage — Phasenplan zur CI-Homogenisierung

Dieser Plan wird in **6 Phasen** abgearbeitet. Nach jeder Phase wird ein Screenshot gemacht und die Funktionalitaet geprueft, bevor wir zur naechsten Phase uebergehen.

---

## Phase 1: Zentrale Helfer-Datei erstellen

**Ziel:** Eine einzige Quelle fuer Icons, Formatierung und Typen — keine Duplikate mehr in einzelnen Views.

**Neue Datei:** `src/components/dms/storageHelpers.ts`

Inhalt:
- `getFileIcon(mime?: string)` — gibt Lucide-Icon-Komponente zurueck (File, FileText, Image, FileSpreadsheet, Folder)
- `formatFileSize(bytes?: number)` — "2.3 MB" oder "—"
- `formatDate(dateStr: string)` — "10.02.2026" (nur Datum, kurz)
- `formatDateTime(dateStr: string)` — "10.02.2026, 14:30" (mit Uhrzeit, fuer Preview)
- `formatType(mime?: string)` — Kurzform: "PDF", "JPEG", "Excel", "Word"

**Pruefung:** Datei existiert, exportiert alle 5 Funktionen, keine Kompilierfehler.

---

## Phase 2: StorageToolbar homogenisieren

**Ziel:** Alle Toolbar-Buttons identisch: `variant="outline" size="sm"` mit gleicher Hoehe (`h-8`), gleicher Rundung.

**Aenderungen in `StorageToolbar.tsx`:**
1. **Sort-Button:** Von `Select/SelectTrigger` zu `DropdownMenu` mit `Button variant="outline" size="sm"` umbauen. Label: "Sortieren" (nicht den Feldnamen anzeigen)
2. **Neuer-Ordner-Button:** Von `size="icon"` (runder `h-8 w-8`) zu `variant="outline" size="sm"` mit Icon + Text "Ordner" — oder: in den Upload-Button als DropdownMenu integrieren (Upload-Button wird Split-Button: "Hochladen" + Dropdown mit "Datei hochladen" + "Neuer Ordner")
3. **Upload-Button:** Von `variant="default"` (gefuellt) zu `variant="outline" size="sm"` — gleicher Style wie alle anderen

**Ergebnis-Layout:**
```text
[< ] Alle Dokumente / ...    [Ansicht v]  [Sortieren v]  [Hochladen v]
```

Drei identische outline-Buttons rechts. "Hochladen" ist ein DropdownMenu mit "Datei hochladen" + "Neuer Ordner".

**Pruefung nach Phase 2:**
- Screenshot: Alle 3 Buttons haben identischen Style, gleiche Hoehe
- View-Dropdown oeffnet und wechselt korrekt zwischen 5 Ansichten
- Sort-Dropdown zeigt "Name", "Groesse", "Typ", "Erstellt am" mit Richtungspfeil
- Upload-Dropdown zeigt "Datei hochladen" + "Neuer Ordner"

---

## Phase 3: Container-Styling und Farben

**Ziel:** Gedaempfte Hintergrundfarben statt hartes Schwarz/Weiss.

**Aenderungen in `StorageFileManager.tsx`:**
- Container: `bg-card` ersetzen durch `bg-muted/30 dark:bg-muted/10`
- Border: `border` zu `border border-border/40`
- Status-Bar: `border-t` zu `border-t border-border/30`
- Toolbar-Border: `border-b` zu `border-b border-border/30`

**Aenderungen in `ListView.tsx`:**
- Header: `bg-muted/30` zu `bg-muted/20`
- Zeilen-Borders: `border-border/50` zu `border-border/30`
- Hover: `hover:bg-muted/50` zu `hover:bg-muted/30`

**Gleiche subtile Farben in `ColumnView.tsx`, `PreviewView.tsx`, `MultiSelectView.tsx`.**

**Pruefung nach Phase 3:**
- Screenshot im Light Mode: Leicht graeullicher Hintergrund, nicht reinweiss
- Screenshot im Dark Mode: Dunkelgrau, nicht schwarz
- Alle Borders subtiler, weniger kontrastreich

---

## Phase 4: Views auf zentrale Helfer umstellen + "Elemente" entfernen

**Ziel:** Alle Views nutzen `storageHelpers.ts`, keine duplizierten Funktionen mehr. Ueberflüssige "X Elemente"-Anzeigen weg.

**Aenderungen:**

1. **`ListView.tsx`**: Eigene `getFileIcon`, `formatFileSize`, `formatDate`, `formatType`, `formatShortType` Funktionen loeschen. Stattdessen aus `storageHelpers.ts` importieren. Typ-Spalte zeigt `formatType(mime)` (Kurzform wie "PDF").

2. **`ColumnView.tsx`**: Eigene `getFileIcon` loeschen. Import aus `storageHelpers.ts`.

3. **`PreviewView.tsx`**: Eigene `getFileIcon`, `formatFileSize`, `formatDate` loeschen. Import aus `storageHelpers.ts`. **"X Elemente" unter Ordnern entfernen** (Zeile 106-108).

4. **`MultiSelectView.tsx`**: Eigene `getFileIcon`, `formatFileSize` loeschen. Import aus `storageHelpers.ts`. **"X Elemente" nach Ordnern entfernen** (Zeile 82-84).

5. **`StorageFileManager.tsx`**: Eigene `formatFileSize` loeschen. Import aus `storageHelpers.ts`.

**Pruefung nach Phase 4:**
- Alle 5 Views durchklicken: Icons identisch (Folder, FileText, Image, FileSpreadsheet, File)
- Keine "X Elemente" Anzeige mehr bei Ordnern in Vorschau und Auswahl
- Groessen, Typen, Daten einheitlich formatiert
- Keine Kompilierfehler

---

## Phase 5: ColumnView + PreviewView Feature-Parity (3-Punkt-Menue)

**Ziel:** Alle Views haben ein konsistentes 3-Punkt-Kontextmenue bei Hover.

**Aenderungen:**

1. **`ColumnView.tsx`:**
   - `FileRowMenu` importieren
   - Jedes Item bekommt ein hover-basiertes 3-Punkt-Menue rechts (wie ListView)
   - Neue Props: `onDownload`, `onDelete`, `onNewSubfolder` (von StorageFileManager durchgereicht)
   - Sortierung: Ordner-first, dann alphabetisch nach dem angezeigten Namen (mit Nummerierung)

2. **`PreviewView.tsx`:**
   - `FileRowMenu` in die linke Sidebar-Items einbauen
   - Hover-basiert, wie in ListView

3. **`StorageFileManager.tsx`:**
   - Neue Props an `ColumnView` durchreichen: `onDownload`, `onDelete`, `onNewSubfolder`

**Pruefung nach Phase 5:**
- Spalten-Ansicht: Hover ueber Item zeigt 3-Punkt-Menue
- Klick auf 3-Punkt-Menue oeffnet Kontextmenue mit Oeffnen/Unterordner/Download/Loeschen
- Vorschau-Ansicht: Sidebar-Items haben 3-Punkt-Menue bei Hover
- Sortierung in Column View korrekt: 01-Stammdaten vor 02-KI Office vor 03-Dokumente usw.

---

## Phase 6: Funktionstest aller Interaktionen

**Ziel:** End-to-End Pruefung aller Kernfunktionen.

**Tests:**
1. **Sortierung:** In Liste-Ansicht auf "Name" klicken — Reihenfolge muss sich umkehren (asc/desc). Nummerierung (01, 02, 03...) muss korrekt sortiert bleiben.
2. **View-Wechsel:** Alle 5 Ansichten durchschalten — keine visuellen Brueche, konsistente Icons und Farben.
3. **Navigation:** In Spalten-Ansicht auf einen Ordner klicken — rechte Spalte zeigt Unterordner/Dateien.
4. **3-Punkt-Menue:** In jeder Ansicht auf 3-Punkt-Menue klicken — Optionen erscheinen.
5. **Upload:** Upload-Dropdown oeffnen, "Datei hochladen" klicken — Datei-Dialog oeffnet sich.
6. **Neuer Ordner:** Upload-Dropdown oeffnen, "Neuer Ordner" klicken — Dialog erscheint.
7. **Drag & Drop:** Datei auf den File Manager ziehen — Drop-Zone erscheint mit Overlay.

**Screenshot-Dokumentation:** Nach jeder Ansicht ein Screenshot zur Verifikation.

---

## Zusammenfassung: Dateien pro Phase

| Phase | Dateien | Art |
|-------|---------|-----|
| 1 | `storageHelpers.ts` | Neu |
| 2 | `StorageToolbar.tsx` | Aendern |
| 3 | `StorageFileManager.tsx`, `ListView.tsx`, `ColumnView.tsx`, `PreviewView.tsx`, `MultiSelectView.tsx` | Aendern (Farben) |
| 4 | `ListView.tsx`, `ColumnView.tsx`, `PreviewView.tsx`, `MultiSelectView.tsx`, `StorageFileManager.tsx` | Aendern (Imports + Cleanup) |
| 5 | `ColumnView.tsx`, `PreviewView.tsx`, `StorageFileManager.tsx` | Aendern (Features) |
| 6 | — | Nur Tests |

**Empfehlung:** Phase 1-4 koennen in einem Schritt umgesetzt werden, da sie keine gegenseitigen Abhaengigkeiten haben und rein additive/substitutive Aenderungen sind. Phase 5 baut darauf auf. Phase 6 ist reine Verifikation.
