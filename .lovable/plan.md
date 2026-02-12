
# Storage-Design-Standard: Spaltenansicht als Default, bessere Gitterstruktur und MOD-07 Angleichung

## Zusammenfassung

Drei zusammenhaengende Massnahmen fuer ein konsistentes Storage-Erlebnis im gesamten System:

1. **Default-Ansicht auf "Spalten" (columns)** umstellen — systemweit
2. **Gitterstruktur optisch verstaerken** — sichtbarere Trennlinien in Dark und Light Mode
3. **MOD-07 Dokumente-Tab** visuell an MOD-11 Finanzierungsakte angleichen (gleicher Look, gleiche Aufteilung)

---

## Teil 1: Default-Ansicht auf Spalten umstellen

### Aenderung in `StorageFileManager.tsx`

Zeile 102: `useState<ViewMode>('list')` aendern zu `useState<ViewMode>('columns')`

Damit wird ueberall im System, wo `StorageFileManager` eingesetzt wird (DMS, Miety, etc.), die Spaltenansicht als Startansicht geladen.

---

## Teil 2: Spaltenbreite konsistent und groessere Zeilenhoehe

### Aenderung in `ColumnView.tsx`

| Aenderung | Aktuell | Neu |
|---|---|---|
| Spaltenbreite | `w-[220px] min-w-[220px]` | `w-[260px] min-w-[260px]` |
| Zeilenhoehe | `py-1.5` | `py-2.5` |
| Icon-Groesse | `h-4 w-4` | `h-5 w-5` |
| Text-Groesse | `text-sm` | `text-sm` (bleibt) |

Die groesseren Zeilen erleichtern Drag-and-Drop-Operationen deutlich.

### Aenderung in `ListView.tsx`

| Aenderung | Aktuell | Neu |
|---|---|---|
| Zeilenhoehe Desktop | `py-2` | `py-3` |
| Icon-Groesse | `h-4 w-4` | `h-5 w-5` |

---

## Teil 3: Gitterstruktur besser sichtbar machen

### Aenderung in `ColumnView.tsx`

Die Spalten-Trennlinie (`border-r border-border/30`) wird verstaerkt:
- **Light Mode:** `border-r border-border/60` (dunkler/blauer)
- **Dark Mode:** `dark:border-border/50` (heller)

Die Zeilen-Trennlinien werden ebenfalls sichtbarer. Jede Zeile erhaelt einen unteren Border:
- `border-b border-border/20 dark:border-border/30`

### Aenderung in `ListView.tsx`

Die bestehenden `border-b border-border/30` werden verstaerkt:
- Header: `border-b border-border/50 dark:border-border/40`
- Zeilen: `border-b border-border/40 dark:border-border/30`

### Aenderung in `StorageFileManager.tsx`

Der aeussere Container erhaelt deutlichere Grenzen:
- Aktuell: `border border-border/40`
- Neu: `border border-border/60 dark:border-border/40`

---

## Teil 4: MOD-07 Dokumente-Tab an MOD-11 angleichen

### Problem

MOD-07 `DokumenteTab` nutzt aktuell `FinanceDocumentsManager` — ein eigenes Layout mit Tree-Panel links und Checklist rechts, das sich grundlegend vom MOD-11 / DMS `StorageFileManager` unterscheidet.

### Loesung

`FinanceDocumentsManager.tsx` wird so umgebaut, dass es den gleichen `StorageFileManager` wie MOD-03 (DMS) nutzt. Da der Tenant bereits existiert und der DMS-Baum (inkl. MOD_07 Root-Ordner) schon erzeugt ist, wird dieser direkt verwendet.

**Layout MOD-07 Dokumente (neu):**

```text
+------------------------------------------+
| Dokumentenstatus (Progress-Bar + Badges) |
+------------------------------------------+
| StorageFileManager                       |
| (identischer Look wie DMS/MOD-11)        |
| Default: Spaltenansicht                  |
| Vorgefiltert auf MOD_07 Unterordner      |
+------------------------------------------+
```

**Konkrete Aenderungen:**
- `FinanceDocumentsManager.tsx` importiert und nutzt `StorageFileManager` statt der eigenen Tree+Checklist Kombination
- Der Dokumentenstatus-Header (Progress-Bar) bleibt als Uebersicht erhalten
- Die Daten werden aus `storage_nodes` gefiltert auf `module_code = 'MOD_07'`
- Der bestehende `FinanceStorageTree` und `DocumentChecklistPanel` werden als sekundaere Referenz beibehalten, aber die Hauptansicht ist jetzt der `StorageFileManager`

---

## Technische Aenderungen

| Datei | Aenderung |
|---|---|
| `src/components/dms/StorageFileManager.tsx` | Default ViewMode von `'list'` auf `'columns'` aendern; Container-Border verstaerken |
| `src/components/dms/views/ColumnView.tsx` | Spaltenbreite 260px; Zeilenhoehe py-2.5; Icon h-5; Border verstaerken; Zeilen-Trennlinien hinzufuegen |
| `src/components/dms/views/ListView.tsx` | Zeilenhoehe py-3; Icon h-5; Border verstaerken |
| `src/components/finanzierung/FinanceDocumentsManager.tsx` | Umbau auf `StorageFileManager` mit MOD_07-Filter; Dokumentenstatus-Header beibehalten |
