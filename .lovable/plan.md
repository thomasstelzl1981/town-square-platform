
# Storage Extraction Engine (ENG-STOREX)

## Uebersicht

Eine neue Engine, die den gesamten Dokumentenbestand eines Mandanten (eigene Uploads oder externer Datenraum) analysiert und fuer Armstrong durchsuchbar macht. Drei Phasen: Scan, Extract, Index.

---

## Phase 1: Scan und Kostenvoranschlag

Bevor extrahiert wird, scannt die Engine den Storage-Bestand und erstellt einen Kostenvoranschlag:

```text
Datenraum-Analyse fuer "Mustermann Immobilien"
───────────────────────────────────────────────
  Dokumente gesamt:       847
  Bereits extrahiert:       0
  Noch zu verarbeiten:    847

  Geschaetzte Kosten:     847 Credits (211,75 EUR)
  Geschaetzte Dauer:      ~45 Minuten

  [ Extraktion starten ]  [ Abbrechen ]
```

**Technisch:**
- Neue Edge Function: `sot-storage-extractor`
- Action `scan`: Zaehlt Dateien in `storage_nodes` fuer den Tenant, prueft welche bereits in `document_chunks` vorhanden sind
- Gibt Kostenvoranschlag zurueck (Anzahl × 1 Credit)

---

## Phase 2: Batch-Extraktion mit Job-Queue

Da Edge Functions ein 60-Sekunden-Timeout haben, kann ein Bulk-Job nicht in einem Call laufen. Stattdessen:

### Architektur

```text
User klickt "Starten"
       |
       v
[extraction_jobs] Tabelle      ← Neuer Job mit status='pending'
       |
       v
sot-storage-extractor          ← Verarbeitet 10-20 Docs pro Call
(action: process-batch)           Signed URL → Gemini → Chunks
       |
       v
document_chunks                ← Extrahierter Text wird gespeichert
       |
       v
sot-embedding-pipeline         ← Embeddings generieren (optional, separater Pass)
       |
       v
[extraction_jobs] updated      ← Progress: 127/847 verarbeitet
```

### Job-Tabelle: `extraction_jobs`

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK organizations |
| status | text | pending, running, paused, completed, failed |
| total_files | int | Gesamtanzahl |
| processed_files | int | Bereits verarbeitet |
| failed_files | int | Fehlgeschlagen |
| credits_used | int | Verbrauchte Credits |
| started_at | timestamptz | Start |
| completed_at | timestamptz | Ende |
| error_log | jsonb | Fehlerdetails |

### Batch-Verarbeitung

Jeder Call der Edge Function verarbeitet einen Batch von 10-20 Dokumenten:

1. Naechsten Batch unverarbeiteter Dateien aus `storage_nodes` laden
2. Fuer jede Datei: Signed URL generieren → Gemini Vision aufrufen → Text chunken
3. Chunks in `document_chunks` speichern
4. Job-Fortschritt updaten
5. Wenn noch Dateien uebrig: Client triggert naechsten Batch-Call

Der Client pollt den Job-Status und zeigt einen Fortschrittsbalken.

---

## Phase 3: Live-Fortschritt im Armstrong-Panel

Die neue ThinkingSteps-Komponente (bereits gebaut) wird wiederverwendet:

```text
Armstrong arbeitet...
  [ok] Datenraum gescannt (847 Dokumente)
  [ok] Kostenvoranschlag: 847 Credits
  [ok] Batch 1/85 verarbeitet (10 Dokumente)
  [..] Batch 2/85 wird verarbeitet...
  [ ] Embedding-Index erstellen
  [ ] Hybrid-Suche aktivieren
```

---

## Technische Aenderungen

### Neue Dateien

| Datei | Beschreibung |
|-------|-------------|
| `supabase/functions/sot-storage-extractor/index.ts` | Edge Function: scan, process-batch, status, cancel |

### Neue DB-Objekte (Migration)

| Objekt | Beschreibung |
|--------|-------------|
| `extraction_jobs` Tabelle | Job-Queue mit Fortschritt |
| RLS Policies | Tenant-Isolation wie ueblich |
| Index `(tenant_id, status)` | Performance |

### Bestehende Dateien (Aenderungen)

| Datei | Aenderung |
|-------|-----------|
| `spec/current/06_engines/ENGINE_REGISTRY.md` | ENG-STOREX registrieren |
| `src/manifests/armstrongManifest.ts` | Action `ARM.DMS.STORAGE_EXTRACTION` registrieren |
| `supabase/functions/sot-armstrong-advisor/index.ts` | Intent-Erkennung fuer "Datenraum analysieren" |
| `src/components/portal/ArmstrongContainer.tsx` | Fortschrittsanzeige fuer laufende Extraktionsjobs |

### Edge Function: `sot-storage-extractor`

**Actions:**

1. **scan**: Zaehlt Dateien, prueft bereits extrahierte, gibt Kostenvoranschlag zurueck
2. **start**: Erstellt Job in `extraction_jobs`, prueft Credit-Preflight fuer Gesamtbetrag
3. **process-batch**: Verarbeitet naechste 10-20 Dateien, deducted Credits pro Datei
4. **status**: Gibt aktuellen Jobfortschritt zurueck
5. **cancel**: Pausiert/stoppt laufenden Job

---

## Credit-Modell

| Service | Credits | EUR |
|---------|---------|-----|
| Scan und Voranschlag | 0 (Free) | 0 |
| Extraktion pro Dokument | 1 | 0,25 |
| Embedding-Index (optional) | 0 (inklusive) | 0 |

Marge: Gemini-Kosten ca. 0,01-0,03 EUR pro Call → 8-25x Marge bei 0,25 EUR/Credit.

### Bulk-Rabatte (spaeter)

Koennen ueber die Credit-Tabelle abgebildet werden:
- Ab 500 Docs: 0,8 Credits/Doc
- Ab 2.000 Docs: 0,6 Credits/Doc

---

## Voraussetzungen (bereits erfuellt)

- Lovable AI Gateway (Gemini 3 Flash) -- vorhanden
- `document_chunks` Tabelle mit TSVector -- vorhanden
- `sot-embedding-pipeline` fuer Vektoren -- vorhanden
- `sot-credit-preflight` fuer Abrechnung -- vorhanden
- `sot-document-parser` als Referenz-Pattern -- vorhanden

Keine externen APIs wie Structured.io noetig. Der gesamte Stack ist intern abbildbar.

---

## Umsetzungsreihenfolge

1. Migration: `extraction_jobs` Tabelle + RLS
2. Edge Function: `sot-storage-extractor` (scan + start + process-batch + status)
3. Armstrong-Integration: Intent "Datenraum analysieren" + Fortschrittsanzeige
4. Engine Registry: ENG-STOREX eintragen
5. Test: End-to-End mit Testdokumenten
