

# Design Manifest V4.0 -- Erweiterung um Storage, Tabellen, Formulare und Typografie

## Ausgangslage

Die bisherige Migration (V3.0) hat nur **Grid-Spalten und Gaps** vereinheitlicht. Die Screenshots zeigen weiterhin massive Inkonsistenzen bei den **Inhalten innerhalb der Grids**: KPI-Karten mit 3 statt 4 Spalten, unterschiedliche Card-Paddings, uneinheitliche Tabellen-Stile, verschiedene Info-Banner und fehlende Typografie-Regeln.

Zusaetzlich fehlen verbindliche Standards fuer drei kritische Bereiche:
- **Storage/Dateimanager**: Spaltenansicht mit sichtbarem Gitter und Drag-and-Drop-tauglichen Dimensionen
- **Komplexe Dateneingaben**: Das tabellarische 3-Spalten-Layout (Label | AS1 | AS2) der Selbstauskunft als Referenzstandard
- **Dossier-Formulare**: Das zeilenbasierte Label-Value-Muster der Immobilienakte

---

## Neue Manifest-Kategorien (6 Stueck)

### 1. CARD (erweitert)

Aktuell nur BASE/INTERACTIVE/BORDER. Neu:

| Konstante | Wert | Verwendung |
|---|---|---|
| CARD.KPI | `glass-card` | KPI-Zahlenkarten (via KPICard-Komponente) |
| CARD.CONTENT | `glass-card p-6 rounded-xl` | Grosse Content-Kacheln (Vermietereinheit, Bewertung, Sanierung) |
| CARD.SECTION | `glass-card p-4 rounded-xl` | Full-width Sektionskarten (Premium-Status, Automatisierung) |
| CARD.SECTION_HEADER | `px-4 py-2.5 border-b bg-muted/20` | Einheitlicher Card-Header-Bereich mit Titel + Beschreibung |

### 2. TABLE (neu)

Fuer alle Datentabellen (Mietverwaltung, Vermietung, Mieteingang etc.):

| Konstante | Wert |
|---|---|
| TABLE.WRAPPER | `glass-card rounded-xl overflow-hidden` |
| TABLE.HEADER_CELL | `text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3` |
| TABLE.BODY_CELL | `px-4 py-3 text-sm` |
| TABLE.ROW_HOVER | `hover:bg-muted/30 transition-colors` |
| TABLE.ROW_BORDER | `border-b border-border/30` |

### 3. TABULAR_FORM (neu)

Der "Bank-Stil" aus der Selbstauskunft als systemweiter Standard fuer datenintensive Formulare:

| Konstante | Wert | Referenz |
|---|---|---|
| TABULAR_FORM.LABEL_CELL | `w-[180px] border-r py-1.5 px-3 text-xs text-muted-foreground font-medium whitespace-nowrap` | ApplicantPersonFields TR |
| TABULAR_FORM.VALUE_CELL | `py-1.5 px-3 border-r` | Eingabefeld-Zelle |
| TABULAR_FORM.INPUT | `h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1` | Kompakter Inline-Input |
| TABULAR_FORM.SECTION_ROW | `bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3` | SectionHeaderRow |
| TABULAR_FORM.DUAL_HEADER | Referenz auf DualHeader-Komponente | 3-Spalten-Header |

### 4. STORAGE (neu)

Verbindliche Regeln fuer alle Dateimanager-Ansichten (DMS, Miety, Finanzierung):

| Konstante | Wert | Zweck |
|---|---|---|
| STORAGE.DEFAULT_VIEW | `columns` | Standard-Ansicht immer Spalten |
| STORAGE.COLUMN_WIDTH | `w-[260px] min-w-[260px]` | Spaltenbreite fuer Drag-and-Drop |
| STORAGE.ROW_PADDING | `px-3 py-2.5` | Zeilenhoehe fuer greifbare Drag-Targets |
| STORAGE.COLUMN_BORDER | `border-r border-border/60 dark:border-border/50` | Sichtbares Gitter |
| STORAGE.ROW_BORDER | `border-b border-border/20 dark:border-border/30` | Zeilentrenner |
| STORAGE.CONTAINER | `glass-card rounded-xl overflow-hidden` | Aeusserer Rahmen |
| STORAGE.MIN_HEIGHT | `min-h-[400px]` | Mindesthoehe fuer Drop-Zonen |

### 5. INFO_BANNER (neu)

Einheitliche Hinweis-/Premium-/Warnbanner:

| Konstante | Wert | Beispiel |
|---|---|---|
| INFO_BANNER.BASE | `rounded-xl border p-4` | Alle Banner |
| INFO_BANNER.HINT | `bg-muted/20 border-dashed border-muted-foreground/20` | "Hinweis: Vermietereinheiten..." |
| INFO_BANNER.PREMIUM | `bg-primary/5 border-primary/20` | "Automatisches Mahnwesen" |
| INFO_BANNER.WARNING | `bg-destructive/5 border-destructive/20` | Warnungen |

### 6. TYPOGRAPHY (neu)

Feste Schriftgroessen-Hierarchie:

| Konstante | Wert | Verwendung |
|---|---|---|
| TYPOGRAPHY.PAGE_TITLE | `text-xl md:text-2xl font-bold tracking-tight uppercase` | ModulePageHeader |
| TYPOGRAPHY.SECTION_TITLE | `text-sm font-semibold uppercase tracking-wide` | Karten-Ueberschriften (PREMIUM-STATUS, AUTOMATISIERUNG) |
| TYPOGRAPHY.CARD_TITLE | `text-sm font-semibold` | Widget-/Card-Titel |
| TYPOGRAPHY.LABEL | `text-xs text-muted-foreground` | KPI-Labels, Formular-Labels |
| TYPOGRAPHY.VALUE | `text-2xl font-bold` | KPI-Werte |
| TYPOGRAPHY.BODY | `text-sm` | Standardtext |
| TYPOGRAPHY.HINT | `text-xs text-muted-foreground` | Hinweistexte |

---

## Neue und aktualisierte Shared-Komponenten

### Neue Komponenten

| Komponente | Datei | Zweck |
|---|---|---|
| `ContentCard` | `src/components/shared/ContentCard.tsx` | Wrapper fuer grosse Inhaltskacheln (ersetzt ad-hoc glass-card + p-6) |
| `SectionCard` | `src/components/shared/SectionCard.tsx` | Full-width Sektionskarten mit Icon + Titel + Beschreibung |
| `InfoBanner` | `src/components/shared/InfoBanner.tsx` | Hinweis/Premium/Warnung-Banner mit Varianten |
| `TabularFormRow` | `src/components/shared/TabularFormRow.tsx` | Wiederverwendbare Label-Value-Zeile im Bank-Stil |

### Aktualisierte Komponenten

| Komponente | Aenderung |
|---|---|
| `KPICard` | Manifest-Konstanten fuer Typografie und Icon-Box verwenden |
| `DataTable` | TABLE-Konstanten fuer Header/Zellen/Hover verwenden |
| `ListRow` | Aus LIST-Konstanten speisen statt hardcoded Klassen |
| `FormSection` | TYPOGRAPHY-Konstanten fuer Titel verwenden |

---

## Umsetzungsplan (5 Sprints)

### Sprint 1: Manifest + Komponenten
- `designManifest.ts` um 6 neue Kategorien erweitern (CARD erweitert, TABLE, TABULAR_FORM, STORAGE, INFO_BANNER, TYPOGRAPHY)
- 4 neue Shared-Komponenten erstellen (ContentCard, SectionCard, InfoBanner, TabularFormRow)
- Bestehende Shared-Komponenten aktualisieren (KPICard, DataTable, ListRow, FormSection)

### Sprint 2: MOD-01 bis MOD-05
- Immobilien: KPI 5er-Overflow auf 4er-Grid fixen, Vermietereinheit/Sanierung/Bewertung auf ContentCard
- Mietverwaltung: KPI 3er auf 4er-Grid, Tabellen auf TABLE-Standard, Info-Banner vereinheitlichen
- DMS: Storage-Konstanten in ColumnView/ListView verifizieren

### Sprint 3: MOD-06 bis MOD-10
- Finanzierung (MOD-07): TABULAR_FORM-Standard verifizieren (ist Referenz)
- Verkauf, Investment-Suche: Tabellen und Karten migrieren

### Sprint 4: MOD-11 bis MOD-20
- Manager-Module, Services, Miety: Formulare und Listen vereinheitlichen

### Sprint 5: Zone 1 + Abschluss
- Admin-Bereich migrieren
- Memory-Update mit finalem Manifest-Stand
- Backlog aktualisieren

---

## Technischer Anhang

### Erweiterte Manifest-Struktur

```text
DESIGN
  +-- CONTAINER         (besteht)
  +-- WIDGET_GRID       (besteht)
  +-- WIDGET_CELL       (besteht)
  +-- KPI_GRID          (besteht)
  +-- FORM_GRID         (besteht)
  +-- HEADER            (besteht)
  +-- CARD              (erweitert: +KPI, +CONTENT, +SECTION, +SECTION_HEADER)
  +-- TABLE             (NEU: WRAPPER, HEADER_CELL, BODY_CELL, ROW_HOVER, ROW_BORDER)
  +-- TABULAR_FORM      (NEU: LABEL_CELL, VALUE_CELL, INPUT, SECTION_ROW)
  +-- STORAGE           (NEU: DEFAULT_VIEW, COLUMN_WIDTH, ROW_PADDING, COLUMN_BORDER, ...)
  +-- INFO_BANNER       (NEU: BASE, HINT, PREMIUM, WARNING)
  +-- TYPOGRAPHY        (NEU: PAGE_TITLE, SECTION_TITLE, CARD_TITLE, LABEL, VALUE, BODY, HINT)
```

### Referenz-Patterns aus dem Code

Die Selbstauskunft (`ApplicantPersonFields.tsx`) dient als **Gold-Standard** fuer komplexe Formulare:
- 3-Spalten-Tabelle: `w-[180px]` Label | Wert AS1 | Wert AS2
- Kompakte Inputs: `h-7 border-0 bg-transparent`
- Section-Header: `bg-muted/40 uppercase tracking-wide`

Der Storage-Bereich (`ColumnView.tsx`) dient als **Gold-Standard** fuer Dateimanager:
- Spaltenbreite: `w-[260px] min-w-[260px]`
- Zeilenhoehe: `py-2.5` fuer Drag-and-Drop
- Sichtbares Gitter: `border-r border-border/60`

