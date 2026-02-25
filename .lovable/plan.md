

## Analyse: PDF-Tabellenextraktion im Magic Intake

### Kernproblem

Die KI (Gemini) wird aktuell gebeten, PDF-Tabellen als strukturiertes JSON via Tool-Calling zu extrahieren. Bei 72 Zeilen verliert das Modell Zeilen, weil die JSON-Struktur pro Einheit sehr viel Token-Overhead hat. Das Problem betrifft jeden Magic Intake im System, nicht nur MOD-13.

### Erkenntnis aus der Analyse

Unser eigener Document Parser hat soeben **alle 72 Einheiten fehlerfrei** aus dem PDF extrahiert. Das PDF enthalt eine saubere Tabelle. Das Problem liegt nicht am PDF, sondern an der Art, wie wir die KI einsetzen: Wir senden das PDF als Base64-Bild und bitten Gemini, alles auf einmal als verschachtelte JSON-Objekte zuruckzugeben.

### Empfohlene Losung: Zweistufiger Ansatz (keine externe API notig)

Statt einer externen PDF-zu-Excel-API nutzen wir die bereits verfugbare Lovable AI kostenlos, aber mit einer intelligenteren Strategie:

```text
AKTUELL (verliert Zeilen):
  PDF (base64 image) → Gemini → 72x JSON-Objekte via Tool-Calling → Review

NEU (zuverlassig):
  PDF (base64 image) → Gemini → rohes CSV (flat text) → SheetJS parse → Review
```

**Warum CSV statt JSON?** Eine CSV-Zeile ist ~80 Zeichen. Ein JSON-Objekt mit denselben Daten ist ~400 Zeichen. Bei 72 Einheiten spart das ~23.000 Tokens und das Modell kann die Daten sequenziell Zeile fur Zeile ausgeben, ohne verschachtelte Strukturen.

### Plan: Implementierung

#### 1. Neue Edge Function `sot-pdf-to-csv`
- Nimmt einen `storagePath` zu einem PDF entgegen
- Sendet das PDF als Base64 an Gemini (gemini-2.5-flash, gunstig + schnell)
- Prompt: "Extrahiere alle Tabellenzeilen als semikolon-getrennte CSV. Erste Zeile = Header. Keine Formatierung, kein Markdown, nur CSV."
- Gibt reinen CSV-Text zuruck
- Kann von jedem Magic Intake im System genutzt werden (MOD-04, MOD-07, MOD-11, MOD-13, etc.)

#### 2. Integration in `sot-project-intake`
- Bei PDF-Preislisten: Erst `sot-pdf-to-csv` aufrufen (oder die Logik inline)
- Das CSV dann mit SheetJS (bereits importiert) als XLSX parsen
- Ab dort greift der existierende deterministische XLSX-Parser mit Fuzzy-Column-Mapping
- Kein Tool-Calling mehr fur Preislisten-PDFs notig

#### 3. Integration in `sot-document-parser` (systemweit)
- Fur alle Parse-Modi, die Tabellendaten aus PDFs benotigen
- Optional: Preprocessing-Flag `preprocessPdfTables: true` im ParserManifest pro Modus

#### 4. Kein externer API-Key erforderlich
- Nutzt ausschliesslich Lovable AI (Gemini Flash) — bereits verfugbar, keine Kosten
- SheetJS fur CSV-Parsing — bereits als Dependency vorhanden
- Keine neuen Secrets, keine neuen Abhangigkeiten

### Technische Details

**Prompt-Strategie fur CSV-Extraktion:**
```
Extrahiere ALLE Tabellenzeilen aus diesem Dokument als semikolon-getrennte CSV.
Regeln:
- Erste Zeile = exakte Spaltenuberschriften aus dem Dokument
- Jede weitere Zeile = eine Datenzeile
- Trennzeichen: Semikolon (;)
- Zahlen: Punkt als Dezimaltrennzeichen, keine Tausenderpunkte
- Keine Markdown-Formatierung, kein Code-Block, nur roher CSV-Text
- JEDE Zeile im Dokument MUSS enthalten sein. Uberspinge KEINE Zeile.
```

**Betroffene Dateien:**
- `supabase/functions/sot-project-intake/index.ts` — PDF-Preislisten-Pfad umbauen
- Optional neue Edge Function `sot-pdf-to-csv/index.ts` — wiederverwendbar fur alle Module
- `supabase/config.toml` — ggf. neue Function registrieren

**Kein Freeze-Konflikt:** MOD-13 ist bereits unfrozen. Die Edge Functions liegen ausserhalb der Modul-Pfade.

### Alternative: Externe API (vorerst nicht empfohlen)

Die genannten APIs (ConvertAPI, PDF.co, etc.) kosten 5-50 EUR/Monat und erfordern einen API-Key. Da Gemini die Tabellen korrekt lesen kann und nur das Ausgabeformat das Problem war, ist die CSV-Strategie kostengunstiger und schneller umsetzbar. Sollte sich zeigen, dass auch CSV-Output bei sehr komplexen PDFs Zeilen verliert, konnen wir eine externe API als Fallback nachrüsten.

