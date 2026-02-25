# DATA ENGINE BACKLOG — Document Intelligence & Datenverarbeitung

> **Version**: 2.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-25  
> **Owner**: Zone 1  

---

## 1. Engine-Übersicht

Die **Document Intelligence Engine** (ENG-DOCINT v3) verarbeitet eingehende und gespeicherte Dokumente, extrahiert strukturierte Daten und macht sie für Armstrong und alle Module verfügbar.

### Architektur-Pipeline (v3 — Konsolidiert)

```
Quellen                 → Parser                    → Index              → Verbraucher
──────────────────────────────────────────────────────────────────────────────────────────
Posteingang (Resend)    → sot-document-parser (AI)   → document_chunks    → Armstrong
Storage (eigene Files)  → sot-document-parser (AI)   → TSVector Search    → MOD-04 NK
XLSX/CSV Upload         → _shared/tabular-parser     → columnMapping+rows → MOD-13 Projekte
                          (SheetJS, deterministisch)                       → MOD-04 Immobilien
PDF mit Tabellen        → tabular-parser (PDF→CSV)   → columnMapping+rows → Alle Module
                          → Gemini Flash → SheetJS
Cloud (GDrive/Dropbox)  → [Phase 2]                  → [Phase 2: pgvec]  → MOD-18 Finanz
```

### Zwei Parsing-Pfade

| Pfad | Trigger | Methode | AI? | Kosten |
|------|---------|---------|-----|--------|
| **Path A (Direct)** | XLSX/CSV Upload | SheetJS direkt | Nein | Free |
| **Path B (AI Vision)** | PDF/Bild Upload | Gemini Flash Vision + Tool-Calling | Ja | 1 Credit |
| **Path B + CSV-Preprocessing** | PDF mit Tabellen (`preprocessPdfTables: true`) | Gemini Flash → CSV → SheetJS | Ja | 1 Credit |

### Zentrale Komponenten

| Komponente | Datei | Funktion |
|-----------|-------|----------|
| Universal Parser | `supabase/functions/sot-document-parser/index.ts` | Orchestriert Path A/B, 10+ Modi |
| Shared Tabular Parser | `supabase/functions/_shared/tabular-parser.ts` | XLSX/CSV/PDF→CSV Kernlogik |
| Parser Manifest (Client) | `src/config/parserManifest.ts` | SSOT für Modi, Felder, Ziel-Tabellen |
| Upload Hook | `src/hooks/useUniversalUpload.ts` | 2-Phasen Upload + Register + AI |
| Storage Manifest | `src/config/storageManifest.ts` | Pfad-Builder, Bucket, sanitizeFileName |

---

## 2. Phase 1 — Live (Aktueller Stand)

### 2.1 Posteingangs-Extraktion ✅

| Komponente | Status | Datei |
|-----------|--------|-------|
| Resend Inbound Webhook | ✅ Live | `supabase/functions/sot-inbound-receive/` |
| Universal Document Parser v3 | ✅ Live | `supabase/functions/sot-document-parser/` |
| Shared Tabular Parser | ✅ Live | `supabase/functions/_shared/tabular-parser.ts` |
| document_chunks Tabelle | ✅ Live | Migration vorhanden |
| TSVector Volltextsuche | ✅ Live | `search_document_chunks()` RPC |
| Auto-Sortierung (Rules) | ✅ Live | `inbox_sort_containers` + `inbox_sort_rules` |

**Billing**: 1 Credit (0,25 €) pro PDF-Dokument. XLSX/CSV-Parsing ist kostenfrei (kein AI).

### 2.2 Upload-Sanitization (systemweit) ✅

Alle Upload-Stellen nutzen `sanitizeFileName()` aus `storageManifest.ts`:

| # | Datei | Methode | Bucket |
|---|-------|---------|--------|
| 1 | `useUniversalUpload.ts` | buildStoragePath (sanitized) | tenant-documents |
| 2 | `useExposeUpload.ts` | buildStoragePath + UPLOAD_BUCKET | tenant-documents |
| 3 | `useAcqOffers.ts` | buildStoragePath + UPLOAD_BUCKET | tenant-documents |
| 4 | `TestamentVorlageInline.tsx` | sanitizeFileName direkt | documents |
| 5 | `PatientenverfuegungInlineForm.tsx` | sanitizeFileName direkt | documents |
| 6 | `ProfilTab.tsx` (Avatar + Logo) | sanitizeFileName direkt | tenant-documents |
| 7 | `Kaufy2026Verkaeufer.tsx` (Zone 3) | sanitizeFileName direkt | public-intake |

### 2.3 Storage-Extraktion (eigene Dateien) ✅

- User klickt "Dokument auslesen" im DMS → Signed URL → Gemini Vision → document_chunks
- 1 Credit/Dokument
- `supabase/functions/sot-storage-extract/`

### 2.4 RAG-Index (pgvector Embedding) ✅

- pgvector Extension aktiv
- Embedding-Pipeline: document_chunks → Gemini Embedding → 768d Vektor
- Hybrid-Suche: `hybrid_search_documents()` RPC (TSVector + Vektor)

---

## 3. Phase 2 — Roadmap

### 3.1 Cloud-Sync (Google Drive)

**Status**: Scaffold (DB-Tabellen bereit, OAuth-Flow fehlt)

**Lösung**:
1. OAuth2-Flow für Google Drive
2. Token-Management in `cloud_sync_connectors` Tabelle
3. Dateien KOPIEREN in Tenant-Storage → automatische Extraktion

**Voraussetzungen**: `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`

**Aufwand**: ~5-8 Tage

### 3.2 FinAPI Konto-Matching

**Status**: Scaffold (DB-Tabellen bereit)

**Voraussetzungen**: FinAPI Sandbox + Produktiv-Zugang, §34f-Lizenz

**Aufwand**: ~8-12 Tage

---

## 4. Entfernte Komponenten

| Komponente | Entfernt am | Grund |
|-----------|-------------|-------|
| `sot-pdf-to-csv` | 2026-02-25 | Logik konsolidiert in `sot-document-parser` v3 via `_shared/tabular-parser.ts`. Die eigenständige Edge Function wurde nie aufgerufen und duplizierte CSV-Prompt + uint8ToBase64. |

---

## 5. Credit-Modell (Data Engine)

| Service | Einheit | Credits | EUR |
|---------|---------|---------|-----|
| PDF-Extraktion (Vision) | pro PDF | 1 | 0,25 |
| XLSX/CSV-Parsing (direkt) | pro Datei | 0 | 0,00 |
| Storage-Extraktion | pro Dokument | 1 | 0,25 |
| NK-Beleg-Parsing | pro Beleg | 1 | 0,25 |
| Cloud-Sync Import | pro Datei | 1 | 0,25 |
| FinAPI Konto-Sync | pro Konto | 4 | 1,00 |

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 2.0 | 2026-02-25 | v3 Konsolidierung: Universeller Parser (XLSX/CSV/PDF), Shared Tabular Parser, sot-pdf-to-csv entfernt, Upload-Sanitization systemweit, Dokumentation aktualisiert |
| 1.0 | 2026-02-18 | Initial — Phase 1 Status + Phase 2 Backlog |
