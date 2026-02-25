

## Plan: PDF-CSV-Preprocessing systemweit in die Document Parser Engine integrieren

### Ausgangslage

Aktuell gibt es zwei getrennte Implementierungen:

```text
sot-project-intake (MOD-13)     sot-document-parser (alle Module)
  │                                │
  ├─ XLSX: SheetJS direkt          ├─ PDF → Gemini → JSON (max 8000 tokens)
  ├─ PDF → Gemini → CSV → SheetJS  ├─ Kein CSV-Preprocessing
  └─ Eigene Parsing-Logik          └─ Eigene Parsing-Logik
```

Die CSV-Strategie existiert nur in MOD-13. Der zentrale `sot-document-parser` sendet PDFs direkt an Gemini und erwartet JSON zurueck — mit demselben Token-Limit-Problem bei tabellarischen Dokumenten (Kontoauszuege, Versicherungslisten, Nebenkostenabrechnungen, etc.).

### Was geaendert wird

**Die bestehende `sot-pdf-to-csv` Edge Function wird zum zentralen Preprocessing-Baustein.** Der `sot-document-parser` erhaelt eine optionale Vorverarbeitungsstufe fuer tabellarische PDFs.

```text
NEU — Zweistufig mit CSV-Preprocessing:

  PDF Upload
    │
    ▼
  sot-document-parser
    │
    ├─ Schritt 0: Ist das PDF tabellarisch? (Heuristik + Manifest-Flag)
    │   ├─ JA → sot-pdf-to-csv aufrufen → CSV als Textkontext anhängen
    │   └─ NEIN → Standard Vision-Pipeline (Personalausweis, Fahrzeugschein, etc.)
    │
    ├─ Schritt 1: Gemini mit strukturiertem Prompt (wie bisher)
    │   Aber jetzt mit CSV-Text statt nur Bild → deutlich praeziser
    │
    └─ Schritt 2: Validierung + Response
```

### Konkrete Aenderungen

#### 1. ParserManifest erweitern (`src/config/parserManifest.ts`)
- Neues Feld `preprocessPdfTables: boolean` pro ParserProfile
- `true` fuer: `immobilie`, `finanzierung`, `versicherung`, `vorsorge` (Dokumente mit Tabellen)
- `false` fuer: `fahrzeugschein`, `person`, `haustier`, `kontakt`, `pv_anlage` (Formular/Freitext-Dokumente)

#### 2. `sot-document-parser` anpassen (`supabase/functions/sot-document-parser/index.ts`)
- Bei PDF-Dateien: `preprocessPdfTables`-Flag aus dem Manifest pruefen
- Wenn `true`: Intern `sot-pdf-to-csv`-Logik ausfuehren (CSV-Extraktion via Gemini Flash)
- Den extrahierten CSV-Text als zusaetzlichen Kontext an den Haupt-AI-Call uebergeben
- **Kein** separater HTTP-Call zu `sot-pdf-to-csv` noetig — die Logik wird inline integriert (gleicher Prompt, gleiche Aufbereitung)
- `max_tokens` von 8000 auf 16000 erhoehen fuer tabellarische Dokumente

#### 3. `sot-pdf-to-csv` bleibt als eigenstaendige Edge Function bestehen
- Weiterhin einzeln aufrufbar fuer Module mit eigenem Intake (MOD-13)
- Keine Aenderung an der Function selbst

#### 4. `sot-project-intake` aufraeumen (optional)
- Die duplizierte CSV-Prompt-Logik (Zeilen 603-616) kann durch einen Aufruf an `sot-pdf-to-csv` ersetzt werden
- Reduziert Code-Duplizierung

### Welche Module profitieren sofort

| Modul | Dokumente mit Tabellen | Verbesserung |
|-------|----------------------|--------------|
| MOD-04 Immobilien | Nebenkostenabrechnungen, Mieterlisten | Alle Positionen statt nur erste 10 |
| MOD-07 Finanzierung | Tilgungsplaene, Konditionen | Vollstaendige Zeilenextraktion |
| MOD-11 Versicherung | Policeninhalte mit Leistungstabellen | Praezisere Deckungssummen |
| MOD-13 Projekte | Preislisten (bereits funktional) | Konsistenz mit zentraler Engine |
| MOD-18 Finanzanalyse | Kontoauszuege, BWA-Tabellen | Alle Buchungszeilen |

### Was NICHT geaendert wird

- Keine Aenderung am Frontend/UI — nur Backend-Logik
- Keine neuen Tabellen oder RLS-Policies
- Keine neuen API-Keys oder Secrets
- Kein Freeze-Konflikt — Edge Functions liegen ausserhalb der Modul-Pfade
- `sot-pdf-to-csv` bleibt unveraendert

### Technische Details

**Entscheidungslogik im Document Parser:**
```text
if (contentType === 'application/pdf' && modeConfig.preprocessPdfTables) {
  // 1. CSV-Extraktion via Gemini Flash (schnell, günstig)
  // 2. CSV-Text als zusätzlichen Kontext an Haupt-Prompt
  // 3. Gemini kann nun Tabellendaten aus Text lesen statt aus Bild raten
}
```

**Kosten-Impakt:** Ein zusaetzlicher Gemini Flash Call pro tabellarischem PDF (~0.001 EUR). Der Haupt-Call wird dafuer praeziser und braucht weniger Retries.

