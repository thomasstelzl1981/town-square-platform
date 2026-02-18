

# Konten-Tab: Zwei Aktionen — Manuell (mit CSV) + FinAPI

## Konzept

Der Plus-Button wird zu einem Dropdown-Menue mit zwei Optionen:

```text
  [+] klick -->  ┌──────────────────────────────┐
                  │  Konto manuell anlegen       │
                  │  Bank anbinden (FinAPI)       │
                  └──────────────────────────────┘
```

Der manuelle Dialog bekommt zusaetzlich einen CSV/XLSX-Import-Bereich eingebaut — direkt im selben Dialog als Tab oder Toggle.

## Aenderungen

### 1. `src/pages/portal/finanzanalyse/KontenTab.tsx`

- Plus-Button wird `DropdownMenuTrigger` mit zwei Eintraegen:
  - **"Konto manuell anlegen"** — oeffnet `AddBankAccountDialog`
  - **"Bank anbinden (FinAPI)"** — loest die bestehende `connectMutation` aus
- Import: `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger`

### 2. `src/components/shared/AddBankAccountDialog.tsx` erweitern

Der bestehende Dialog erhaelt zwei Tabs (ueber Radix Tabs):

- **Tab "Einzeln"**: Bestehendes Formular (Kontobezeichnung, IBAN, Bank, Zuordnung) — unveraendert
- **Tab "CSV-Import"**: Neuer Bereich mit:
  - Drag-and-Drop Upload-Zone (nutzt bestehenden `FileUploader`)
  - Akzeptiert `.csv` und `.xlsx`
  - Erwartete Spalten: `Kontobezeichnung`, `IBAN`, `Bank`, `Zuordnung` (optional)
  - Nach Upload: Vorschau-Tabelle mit allen erkannten Zeilen
  - IBAN-Validierung pro Zeile (nutzt bestehende `validateIBAN`-Funktion im selben File)
  - Gueltige Zeilen gruen, fehlerhafte rot markiert
  - "X importieren"-Button fuer Batch-Insert in `msv_bank_accounts`
  - CSV-Parsing: Auto-Detect Semikolon/Komma als Trennzeichen
  - XLSX-Parsing: Ueber `getXlsx()` aus `src/lib/lazyXlsx.ts`

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzanalyse/KontenTab.tsx` | Plus-Button wird DropdownMenu mit 2 Optionen |
| `src/components/shared/AddBankAccountDialog.tsx` | Tabs hinzufuegen: "Einzeln" + "CSV-Import" mit Upload, Parsing und Batch-Insert |

### Keine neuen Abhaengigkeiten

- `FileUploader` existiert bereits in `src/components/shared/FileUploader.tsx`
- `xlsx` ist bereits installiert, Lazy-Loader in `src/lib/lazyXlsx.ts`
- Radix Tabs sind bereits installiert (`@radix-ui/react-tabs`)
- `validateIBAN` und `formatIBAN` existieren bereits im Dialog-File
