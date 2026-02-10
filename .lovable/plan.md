
# DMS Storage — Namenskorrektur, Nummerierung und Mobile Ansicht

## 1. Namenskorrektur im Storage Manifest (SSOT)

Die `root_name` Werte in `src/config/storageManifest.ts` weichen von den tatsaechlichen Modulnamen in `routesManifest.ts` und den Nutzerwuenschen ab. Folgende Korrekturen:

| Modul | Aktuell (falsch) | Korrekt |
|-------|-----------------|---------|
| MOD_03 | DMS | Dokumente |
| MOD_05 | MSV | Mietverwaltung |
| MOD_08 | Investments | Investment-Suche |
| MOD_14 | Communication Pro | Kommunikation Pro |

Alle anderen Namen stimmen bereits ueberein (Stammdaten, KI Office, Immobilien, Verkauf, Finanzierung, Vertriebspartner, Leads, Finanzierungsmanager, Akquise-Manager, Projekte, Fortbildung, Services, Car-Management, Finanzanalyse, Photovoltaik, Miety).

**Datei:** `src/config/storageManifest.ts` — 4 Zeilen aendern (`root_name` fuer MOD_03, MOD_05, MOD_08, MOD_14)

## 2. Nummerierung durchgaengig sichtbar machen

Die `getModuleDisplayName()` Funktion existiert bereits und erzeugt z.B. `"04 — Immobilien"`. Das Problem: Sie wird nicht ueberall genutzt.

**ColumnView** (`src/components/dms/views/ColumnView.tsx`, Zeile 72): Zeigt nur `n.name` (den rohen DB-Namen, z.B. `"Immobilien"` ohne Nummer). Muss `getModuleDisplayName()` nutzen fuer Root-Module-Nodes (erkennbar an `template_id` das auf `_ROOT` endet).

**StorageFileManager** (Zeilen 111-113, 126-128): Nutzt `getModuleDisplayName()` bereits korrekt fuer Breadcrumb und Items — das passt.

**Aenderungen:**
- `ColumnView.tsx`: Root-Spalte und nachfolgende Spalten muessen bei Modul-Root-Nodes `getModuleDisplayName(n.module_code)` verwenden statt `n.name`

## 3. Mobile Ansicht (Dropbox-Stil)

Aktuell gibt es keine mobile Optimierung. Die Tabelle mit 6 Spalten (Checkbox, Name, Size, Type, Date, Menu) ist auf Mobilgeraeten nicht nutzbar. Dropbox Mobile zeigt:

- Einfache vertikale Liste mit grossem Touch-Target
- Jede Zeile: Icon links, Name + Metadaten (Groesse, Datum) gestapelt, 3-Punkt-Menu rechts
- Kein Checkbox im Normalzustand — Long-Press aktiviert Multi-Select
- Pull-to-Refresh
- Toolbar vereinfacht: nur Zurueck-Pfeil + Ordnername + Upload-FAB (Floating Action Button)
- Kein Sort-Dropdown, kein View-Switcher auf Mobile
- FAB unten rechts fuer Upload + Neuer Ordner

**Aenderungen:**

**`StorageFileManager.tsx`**: `useIsMobile()` importieren. Bei Mobile: kein View-Switcher (immer List), vereinfachte Toolbar, FAB statt Toolbar-Buttons.

**`StorageToolbar.tsx`**: Mobile-Variante: Nur Zurueck-Pfeil + aktueller Ordnername (kein Breadcrumb-Pfad, kein View/Sort-Dropdown). Upload und Neuer Ordner werden in einen FAB ausgelagert.

**`ListView.tsx`**: Mobile-Variante der Zeilen:
- Statt 6-Spalten-Grid: `flex` Layout mit Icon, Name+Meta gestapelt, 3-Punkt-Menu
- Keine Checkbox-Spalte (Multi-Select per Long-Press oder ueber den Multi-Select View-Mode)
- Keine Size/Type/Date Spalten — stattdessen unter dem Namen als einzeilige Meta-Info: `"2.3 MB · PDF · 10.02.2026"`

**Neues Element — FAB (Floating Action Button):**
- Position: `fixed bottom-6 right-6` innerhalb des Containers
- Primaerfarbe, rund, Plus-Icon
- Klick oeffnet Radial-Menu oder Bottom-Sheet mit: "Datei hochladen" + "Neuer Ordner"

## Technische Umsetzung

### Dateien die geaendert werden:

1. **`src/config/storageManifest.ts`** — 4 `root_name` Werte korrigieren:
   - Zeile 107: `'DMS'` → `'Dokumente'`
   - Zeile 140: `'MSV'` → `'Mietverwaltung'`
   - Zeile 181: `'Investments'` → `'Investment-Suche'`
   - Zeile 252: `'Communication Pro'` → `'Kommunikation Pro'`

2. **`src/components/dms/views/ColumnView.tsx`** — Nummerierung in Miller-Spalten:
   - `getModuleDisplayName` importieren
   - Bei Root-Nodes (erkennbar an `template_id?.endsWith('_ROOT')` + `module_code`) den Display-Namen verwenden

3. **`src/components/dms/views/ListView.tsx`** — Mobile-Variante:
   - `useIsMobile()` importieren
   - Desktop: bestehendes 6-Spalten-Grid (unveraendert)
   - Mobile: Einfache Flex-Zeilen (Icon | Name+Meta | Menu), kein Header, kein Checkbox

4. **`src/components/dms/StorageToolbar.tsx`** — Mobile-Variante:
   - `useIsMobile()` importieren
   - Mobile: Nur Zurueck-Pfeil + aktueller Ordnername (letztes Breadcrumb-Segment)
   - View-Switcher, Sort, Upload, NewFolder Buttons ausblenden auf Mobile

5. **`src/components/dms/StorageFileManager.tsx`** — Mobile FAB + Anpassungen:
   - `useIsMobile()` importieren
   - Mobile: `viewMode` fest auf `'list'` setzen (kein View-Switcher)
   - FAB-Button unten rechts rendern mit Upload + Neuer Ordner Aktionen
   - Container-Hoehe auf Mobile anpassen: `h-[calc(100vh-8rem)]` statt `12rem`

### Reihenfolge:
1. storageManifest.ts — Namenskorrektur (4 Zeilen)
2. ColumnView.tsx — Nummerierung einbauen
3. ListView.tsx — Mobile-Variante
4. StorageToolbar.tsx — Mobile-Variante
5. StorageFileManager.tsx — FAB + Mobile-Logik
