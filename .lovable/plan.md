

## Magic Intake System — Vollständiges Audit

### Architektur-Überblick

Das Magic Intake System besteht aus 5 Schichten, die sauber zusammenarbeiten:

```text
┌─────────────────────────────────────────────────────────────┐
│  UI LAYER                                                    │
│  IntakeEntityPicker → IntakeUploadZone → IntakeChecklistGrid│
│  (9 Kategorien)       (Dropzone, Batch)   (Live-Fortschritt)│
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  ORCHESTRIERUNG (useDocumentIntake.ts)                       │
│  1. Upload → 2. Parse → 3. Preview → 4. File → 5. Write    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  UPLOAD ENGINE (useUniversalUpload.ts)                       │
│  Phase 1: Storage → documents → document_links → storage_   │
│           nodes                                              │
│  Phase 2: sot-document-parser (optional)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  PARSER ENGINE (sot-document-parser v3.0)                    │
│  PATH A: XLSX/CSV → SheetJS (deterministisch, keine KI)      │
│  PATH B: PDF → Gemini Flash CSV → SheetJS → Gemini Vision   │
│  PATH C: Image → Gemini Vision JSON                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  SHARED TABULAR PARSER (_shared/tabular-parser.ts)           │
│  Fuzzy Column Mapping, parseGermanNumber, SheetJS-Pipeline   │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. Upload-Schritte — BESTÄTIGT KORREKT

Die 2-Phasen-Architektur ist sauber implementiert:

| Phase | Schritt | Implementierung | Status |
|-------|---------|-----------------|--------|
| 1.1 | Storage Upload | `buildStoragePath()` + `UPLOAD_BUCKET` | OK |
| 1.2 | `documents` Record | Insert mit `public_id`, `source`, `extraction_status` | OK |
| 1.3 | `document_links` Record | Insert mit `object_type`, `object_id`, `node_id` | OK |
| 1.4 | `storage_nodes` File-Node | Insert mit `parent_id`, `module_code`, `file_path` | OK |
| 2.1 | KI-Analyse | `sot-document-parser` via `storagePath` (nie base64 inline) | OK |
| 2.2 | Extraktion speichern | `extractions` Table + `documents.extraction_status` Update | OK |

Der Fallback-Mechanismus (kein `parentNodeId` → INBOX) funktioniert korrekt.

### 2. ID-Anlegungsschritte — BESTÄTIGT KORREKT

| Entity | Schritt | Mechanismus |
|--------|---------|-------------|
| `documents.id` | UUID auto-generated | Supabase `gen_random_uuid()` |
| `document_links.id` | UUID auto-generated | FK zu `documents.id` |
| `storage_nodes.id` | UUID auto-generated | Parent-Resolution via `entity_fk_column` |
| Entity-Record (z.B. `units`, `cars_vehicles`) | UUID auto-generated | Via `confirmImport()` → `writeRecords()` |

Die Entity-Folder-Resolution in `useDocumentIntake` (Zeile 78-96) nutzt korrekt `STORAGE_MANIFEST[moduleCode].entity_fk_column` um den DMS-Ordner zu finden.

### 3. Ablage im Datenraum (DMS) — BESTÄTIGT KORREKT

Der Storage-Pfad wird via `buildStoragePath()` generiert:
- Format: `{tenant_id}/{module_code}/{entity_id}/{sanitized_filename}`
- `sanitizeFileName()` ersetzt Sonderzeichen und prepended Timestamp
- Alle Uploads gehen in `UPLOAD_BUCKET` ("tenant-documents")
- `storage_nodes` File-Nodes werden korrekt unter dem Entity-Ordner oder INBOX angelegt

### 4. KI-Power — BESTÄTIGT, VOLLE POWER

| Pfad | Modell | max_tokens | Einsatz |
|------|--------|------------|---------|
| PDF CSV-Preprocessing | `google/gemini-2.5-flash` | 32,000 | Tabellen-Extraktion aus PDFs |
| AI Vision (Hauptanalyse) | `google/gemini-3-flash-preview` | 8,000-16,000 | Strukturierte Datenextraktion |
| XLSX/CSV Direct | Kein KI (SheetJS) | N/A | Deterministische Tabellen |

Die 2-Step-Pipeline fuer tabellarische PDFs ist korrekt:
1. Gemini Flash extrahiert CSV (Temp 0.0, 32k Tokens)
2. SheetJS parsed den CSV
3. Fuzzy Column Mapping ordnet Spalten zu
4. Gemini Vision verifiziert bei Bedarf (mit CSV als Kontext)

### 5. Umwandlungs-Reihenfolge PDF → CSV → Zuordnung — AUDIT

Hier ist die **kritische Prüfung** der Verarbeitungsreihenfolge:

**PATH A (XLSX/CSV-Dateien):**
```text
Datei → SheetJS direkt → Rows → Fuzzy Column Mapping → Records
```
Korrekt. Kein KI nötig.

**PATH B (PDF mit Tabellen, `preprocessPdfTables: true`):**
```text
PDF → Gemini Flash (CSV-Extraktion) → SheetJS → Rows → Fuzzy Mapping → Records
     + PDF → Gemini Vision (Verifikation mit CSV-Kontext) → JSON → Records
```
Korrekt. Die Reihenfolge ist PDF → CSV → Zuordnung.

**PATH C (PDF ohne Tabellen / Bilder):**
```text
PDF/Image → Gemini Vision → JSON → Records
```
Korrekt. Direkter Vision-Pfad fuer nicht-tabellarische Dokumente.

### 6. Abdeckung aller INTAKE-Dokumenttypen

| # | parseMode | targetTable | preprocessPdfTables | Module | Status |
|---|-----------|-------------|---------------------|--------|--------|
| 1 | `immobilie` | `units` | **true** | MOD_04 | OK |
| 2 | `finanzierung` | `finance_requests` | **true** | MOD_07 | OK |
| 3 | `versicherung` | `insurance_contracts` | **true** | MOD_11 | OK |
| 4 | `fahrzeugschein` | `cars_vehicles` | false | MOD_17 | OK |
| 5 | `pv_anlage` | `pv_plants` | false | MOD_19 | OK |
| 6 | `vorsorge` | `vorsorge_contracts` | **true** | MOD_11 | OK |
| 7 | `person` | `household_persons` | false | MOD_01 | OK |
| 8 | `haustier` | `pets` | false | MOD_05 | OK |
| 9 | `kontakt` | `contacts` | false | MOD_01 | OK |
| 10 | `allgemein` | (auto-detect) | false | (auto) | OK |

### 7. Identifizierte Schwachstellen / Verbesserungspotential

**A) `fahrzeugschein` und `pv_anlage` haben `preprocessPdfTables` NICHT aktiviert**
- Fahrzeugscheine und PV-Datenblätter enthalten oft tabellarische Daten (Feld-Wert-Paare)
- Empfehlung: `preprocessPdfTables: true` aktivieren für bessere Extraktion

**B) Doppelte Manifest-Definition**
- `parserManifest.ts` (Client) und `sot-document-parser/index.ts` (Edge Function) enthalten jeweils eigene `MODE_CONFIGS`
- Die Felder sind synchron, aber es besteht das Risiko der Drift
- Empfehlung: Langfristig eine einzige SSOT schaffen (z.B. die Edge Function liest vom Client-Manifest oder umgekehrt via shared JSON)

**C) MOD-13 Projekte und MOD-12 Akquise nutzen eigene Intake-Flows**
- Korrekt so designed (spezialisierte Tool-Calling-Flows), aber die Architektur-Entscheidung ist dokumentiert
- `sot-project-intake` nutzt die shared `tabular-parser.ts` — konsistent

**D) `kontakt`-Modus ist im Entity-Picker der IntakeTab NICHT verfügbar**
- `IntakeEntityPicker` bietet 9 Kategorien an, aber `kontakt` fehlt
- Es gibt `person` (household_persons) und `allgemein`, aber keinen separaten Kontakt-Modus
- Die Edge Function unterstützt `kontakt` aber die UI bietet ihn nicht explizit an
- Kein kritischer Bug — Kontakte können via "Sonstiges" (allgemein) erkannt werden

### 8. Gesamtbewertung

| Kriterium | Bewertung |
|-----------|-----------|
| Upload-Pipeline (2-Phasen) | **KORREKT** — Sauber implementiert |
| ID-Generierung | **KORREKT** — Alle UUIDs auto-generated |
| DMS-Ablage (storage_nodes) | **KORREKT** — Entity-Folder-Resolution funktioniert |
| KI-Power (Gemini Flash + Vision) | **VOLL AKTIV** — 2 Modelle im Einsatz |
| PDF → CSV → Zuordnung | **KORREKT** — Reihenfolge stimmt fuer alle `preprocessPdfTables: true` Modi |
| Batch-Upload (bis 10 Dateien) | **KORREKT** — Sequenzielle Verarbeitung mit Status-Tracking |
| Armstrong-Integration | **KORREKT** — Alle Module via `sot-document-parser` angebunden |
| Error Handling (429/402) | **KORREKT** — Rate Limits und Payment Errors werden abgefangen |

### Empfohlene Implementierung

1. `preprocessPdfTables: true` fuer `fahrzeugschein` und `pv_anlage` aktivieren (2 Zeilen in parserManifest.ts + 2 Zeilen in sot-document-parser/index.ts)
2. `kontakt`-Modus in `IntakeEntityPicker` CATEGORIES ergänzen (optional, da Auto-Erkennung funktioniert)
3. Langfristig: Manifest-Drift-Check zwischen Client und Edge Function (z.B. via Test)

