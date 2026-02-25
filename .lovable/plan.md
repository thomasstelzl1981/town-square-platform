

## Analyse: Drei Engines, ein Problem — Systemweite Diagnose

### IST-Zustand: Drei separate Implementierungen

Nach vollständiger Analyse des Codes gibt es aktuell **drei unabhängige Implementierungen** der gleichen Kernlogik — und keine davon ruft die andere auf:

```text
┌─────────────────────────────────┐
│ sot-document-parser (710 Zeilen)│  ← Zentraler Parser, 10 Modi
│ • Eigene MODE_CONFIGS (Kopie!)  │  ← Manifest ist dupliziert, nicht importiert
│ • Eigene extractCsvFromPdf()    │  ← CSV-Logik inline, Z.380-426
│ • Eigene uint8ToBase64()        │  ← Hilfsfunktion dupliziert
│ • Kein XLSX-Parsing             │  ← Kann keine Excel-Dateien verarbeiten
│ • Gibt JSON zurück              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ sot-project-intake (1045 Zeilen)│  ← Nur MOD-13
│ • Eigene Tool-Definitions       │  ← Komplett eigene AI-Prompts
│ • Eigene CSV-Strategie          │  ← CSV-Prompt inline, Z.603-616
│ • Eigene XLSX-Parsing           │  ← SheetJS + Fuzzy-Mapping, Z.479-575
│ • Eigene Column-Patterns        │  ← Regex-Map dupliziert, Z.491-501 + Z.661-671
│ • Eigene uint8ToBase64()        │  ← Hilfsfunktion nochmal dupliziert
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ sot-pdf-to-csv (166 Zeilen)     │  ← Eigenständige Function
│ • Eigene CSV-Prompt             │  ← Nochmal derselbe Prompt
│ • Eigene uint8ToBase64()        │  ← Zum dritten Mal dupliziert
│ • Wird von NIEMANDEM aufgerufen │  ← Weder document-parser noch project-intake
└─────────────────────────────────┘
```

### Konkrete Probleme

**1. Code-Duplizierung:**
- Der CSV-Extraction-Prompt existiert dreimal (identischer Text)
- `uint8ToBase64()` existiert dreimal
- Die Fuzzy-Column-Mapping-Regex existiert zweimal in `sot-project-intake` (Z.491 und Z.661)
- Das ParserManifest existiert zweimal: einmal in `src/config/parserManifest.ts` (Client, 340 Zeilen) und als Kopie in `sot-document-parser` (Z.44-213)

**2. Feature-Divergenz:**
- `sot-project-intake` kann XLSX + CSV + PDF verarbeiten
- `sot-document-parser` kann nur PDF + Bilder + Text — kein XLSX
- `sot-pdf-to-csv` wird gar nicht benutzt

**3. Systemweites Risiko:**
Jedes Modul, das den zentralen `sot-document-parser` nutzt (MOD-04, MOD-07, MOD-11, MOD-17, MOD-19, etc.), kann keine Excel-Dateien verarbeiten. Wenn ein Nutzer eine Nebenkostenabrechnung als XLSX hochlädt, schlägt der Parser fehl.

### Betroffene Module (Zone 2)

| Modul | Nutzt welche Engine? | XLSX-Support? | CSV-Preprocessing? |
|-------|---------------------|---------------|---------------------|
| MOD-04 Immobilien | sot-document-parser | Nein | Ja (seit letztem Update) |
| MOD-07 Finanzierung | sot-document-parser | Nein | Ja |
| MOD-11 Versicherung | sot-document-parser | Nein | Ja |
| MOD-13 Projekte | sot-project-intake (eigene!) | Ja | Ja |
| MOD-17 Fahrzeuge | sot-document-parser | Nein | Nein |
| MOD-19 PV-Anlagen | sot-document-parser | Nein | Nein |
| MOD-01 Stammdaten | sot-document-parser | Nein | Nein |
| DMS Intake Center | sot-document-parser | Nein | Je nach Modus |

### SOLL-Zustand: Eine Engine, ein Flow

```text
Nutzer lädt Datei hoch (PDF, XLSX, CSV, Bild)
         │
         ▼
┌──────────────────────────────┐
│ sot-document-parser (ZENTRAL)│
│                              │
│ Schritt 0: Format erkennen   │
│ ├─ XLSX/CSV → SheetJS direkt │ ← NEU: Deterministische Tabellen-Pipeline
│ ├─ PDF + preprocessPdfTables │
│ │   → Gemini Flash → CSV     │ ← Bestehende CSV-Preprocessing-Logik
│ │   → SheetJS parse          │
│ ├─ PDF/Bild (kein Tabellen)  │
│ │   → Gemini Vision direkt   │ ← Wie bisher (Personalausweis etc.)
│ └─ Text → direkte Analyse    │
│                              │
│ Schritt 1: Fuzzy Column Map  │ ← NEU: Zentral, wiederverwendbar
│ Schritt 2: Manifest-Prompt   │ ← Wie bisher
│ Schritt 3: Validierung       │ ← Wie bisher
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ sot-project-intake (SCHLANK) │
│ • Ruft sot-document-parser   │ ← Statt eigener Parsing-Logik
│ • Nur: Expose-Analyse (Pro)  │ ← Bleibt spezialisiert
│ • Nur: Create-Mode (DB-Ops)  │ ← Bleibt spezialisiert
│ • Preisliste → document-parser│ ← Delegiert statt dupliziert
└──────────────────────────────┘

┌──────────────────────────────┐
│ sot-pdf-to-csv (ENTFERNEN)   │
│ → Logik lebt jetzt in        │
│   sot-document-parser inline  │
└──────────────────────────────┘
```

### Implementierungsplan

#### Phase 1: `sot-document-parser` zum universellen Parser ausbauen

**1a. XLSX/CSV-Support einbauen**
- SheetJS-Import hinzufügen (`import * as XLSX from "https://esm.sh/xlsx@0.18.5"`)
- Bei XLSX/CSV-Dateien: Direkte tabellarische Extraktion ohne AI
- Fuzzy-Column-Mapping aus `sot-project-intake` übernehmen und generalisieren
- Neues Feld im Response: `columnMapping` für Review-UI

**1b. Manifest-Kopie durch generisches Config ersetzen**
- Die 170 Zeilen MODE_CONFIGS (Z.44-213) sind eine veraltete Kopie des Client-Manifests
- Durch eine schlankere Variante ersetzen, die nur die Edge-Function-relevanten Felder enthält (fields, preprocessPdfTables, targetTable)
- Sicherstellen, dass neue Parser-Modi (z.B. `akquise`, `projekt`) ohne Code-Duplizierung hinzugefügt werden können

**1c. Response-Format erweitern**
- Neues Feld `extractionMethod`: `'direct_xlsx'` | `'csv_preprocessing'` | `'ai_vision'` | `'ai_text'`
- Neues Feld `columnMapping` für tabellarische Dokumente
- Kompatibel mit bestehendem Response-Schema (kein Breaking Change)

#### Phase 2: `sot-project-intake` verschlanken

- Preislisten-Parsing (Z.464-780, ~300 Zeilen duplizierter Code) entfernen
- Stattdessen: `sot-document-parser` mit `parseMode: 'projekt_preisliste'` aufrufen
- Expose-Analyse (Gemini Pro + Tool-Calling) bleibt in `sot-project-intake` — das ist MOD-13-spezifisch
- Create-Mode bleibt unverändert

#### Phase 3: `sot-pdf-to-csv` entfernen

- Die inline `extractCsvFromPdf()` in `sot-document-parser` (Z.380-426) übernimmt diese Rolle bereits
- Edge Function löschen, aus `config.toml` entfernen

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/functions/sot-document-parser/index.ts` | XLSX/CSV-Pipeline, generalisiertes Column-Mapping, Response-Erweiterung |
| `supabase/functions/sot-project-intake/index.ts` | ~300 Zeilen Parsing-Code entfernen, stattdessen document-parser aufrufen |
| `supabase/functions/sot-pdf-to-csv/index.ts` | Löschen |
| `supabase/config.toml` | `sot-pdf-to-csv` entfernen |

### Was sich NICHT ändert

- Kein Frontend/UI-Change
- Keine neuen DB-Tabellen oder RLS-Policies
- Keine neuen API-Keys oder Secrets
- Keine Änderung an der Expose-Analyse (Gemini Pro bleibt in project-intake)
- Kein Freeze-Konflikt (Edge Functions liegen außerhalb der Modul-Pfade)

