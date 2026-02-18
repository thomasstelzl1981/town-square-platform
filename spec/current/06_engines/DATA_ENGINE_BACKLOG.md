# DATA ENGINE BACKLOG — Document Intelligence & Datenverarbeitung

> **Version**: 1.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-18  
> **Owner**: Zone 1  

---

## 1. Engine-Übersicht

Die **Document Intelligence Engine** (ENG-DOCINT) verarbeitet eingehende und gespeicherte Dokumente, extrahiert strukturierte Daten und macht sie für Armstrong und alle Module verfügbar.

### Architektur-Pipeline

```
Quellen                 → Parser              → Index              → Verbraucher
─────────────────────────────────────────────────────────────────────────────────
Posteingang (Resend)    → sot-document-parser  → document_chunks    → Armstrong
Storage (eigene Files)  → [Phase 2]            → TSVector Search    → MOD-04 NK
Cloud (GDrive/Dropbox)  → [Phase 2]            → [Phase 2: pgvec]  → MOD-18 Finanz
FinAPI (Kontoauszüge)   → [Phase 2]            →                   → MOD-07 Finance
```

---

## 2. Phase 1 — Live (Aktueller Stand)

### 2.1 Posteingangs-Extraktion ✅

| Komponente | Status | Datei |
|-----------|--------|-------|
| Resend Inbound Webhook | ✅ Live | `supabase/functions/sot-inbound-receive/` |
| Gemini Vision Parser | ✅ Live | `supabase/functions/sot-document-parser/` |
| document_chunks Tabelle | ✅ Live | Migration vorhanden |
| TSVector Volltextsuche | ✅ Live | `search_document_chunks()` RPC |
| Auto-Sortierung (Rules) | ✅ Live | `inbox_sort_containers` + `inbox_sort_rules` |

**Billing**: 1 Credit (0,25 €) pro PDF-Dokument

### 2.2 Armstrong Dokumenten-Zugriff ✅

- Armstrong kann via Signed URL einzelne Dokumente lesen (Vision API)
- Limitierung: Max ~20 Seiten pro Anfrage (Token-Limit)
- Für längere Dokumente: Zugriff über document_chunks (Textsuche)

### 2.3 Datentyp-Erkennung ✅

- KI erkennt automatisch den Dokumententyp
- Mapping auf `doc_type_hint` im Storage-System
- Unterstützte Typen: Rechnung, Vertrag, Bescheid, Ausweis, Kontoauszug, etc.

---

## 3. Phase 2 — Roadmap

### 3.1 Storage-Extraktion (eigene Dateien)

**Problem**: Aktuell können nur Posteingangs-PDFs extrahiert werden. Dateien, die der User direkt hochlädt, werden nicht indexiert.

**Lösung**:
1. Neue Edge Function: `sot-storage-extractor`
2. Trigger: User klickt "Dokument auslesen" im DMS
3. Flow: Storage → Signed URL → Gemini Vision → document_chunks
4. Credit-Preflight vor Extraktion

**Billing**: 1 Credit pro Dokument

**Aufwand**: ~2-3 Tage Entwicklung

### 3.2 Cloud-Sync (Google Drive, Dropbox, OneDrive)

**Problem**: Externe Datenräume können nicht durchsucht oder indexiert werden.

**Lösung**:
1. OAuth2-Flow für jeden Provider (ADR-037 Zone 2)
2. Token-Management in `connectors` Tabelle (bereits vorbereitet)
3. Sync-Worker: Dateien KOPIEREN in Tenant-Storage (kein Live-Sync)
4. Nach Kopie: automatische Extraktion wie Storage-Dateien

**Voraussetzungen**:
- Google Cloud Console: OAuth Client ID
- Dropbox: App Registration
- OneDrive: Azure AD App Registration

**GDPR**: Tokens gehören dem User, jederzeit disconnectable

**Aufwand**: ~5-8 Tage pro Provider

### 3.3 End-to-End NK-Abrechnung

**Problem**: NK-Belege müssen manuell erfasst werden.

**Lösung**:
1. Parser-Mode `parseMode: 'nk_beleg'` in sot-document-parser
2. Strukturierte Extraktion: Versorger, Betrag, Zeitraum, Kostenkategorie
3. Auto-Matching: Beleg → Property → NK-Position
4. Bestätigung durch User vor Buchung

**Billing**: Inkl. in Standard-Extraktionsgebühr (1 Credit)

**Aufwand**: ~3-4 Tage

### 3.4 FinAPI Konto-Matching

**Problem**: Kontoauszüge müssen manuell kategorisiert werden.

**Lösung**:
1. FinAPI-Anbindung (Bank-Connect via PSD2)
2. Transaktionen importieren → `msv_bank_transactions`
3. Auto-Matching: Transaktion ↔ Vertrag (Miete, Darlehen, Versicherung)
4. Armstrong unterstützt bei unklaren Zuordnungen

**Voraussetzungen**:
- FinAPI Sandbox + Produktiv-Zugang
- §34f-Lizenz für Bank-Zugriff

**Billing**: 4 Credits pro Konto-Sync

**Aufwand**: ~8-12 Tage

### 3.5 RAG-Index (Embedding/pgvector)

**Problem**: TSVector findet nur exakte Worttreffer. Semantische Suche fehlt.

**Lösung**:
1. pgvector Extension aktivieren
2. Embedding-Pipeline: document_chunks → OpenAI/Gemini Embedding → Vektor
3. Ähnlichkeitssuche: Armstrong nutzt Vektoren für Kontext-Retrieval
4. Hybrid: TSVector + Vektor-Suche kombiniert

**Voraussetzungen**:
- pgvector Extension
- Embedding API (Gemini oder OpenAI)

**Billing**: Einmalig beim Indexieren, dann Free für Suche

**Aufwand**: ~5-6 Tage

---

## 4. Priorisierungs-Matrix

| Feature | Impact | Aufwand | Priorität | Sprint |
|---------|--------|---------|-----------|--------|
| Storage-Extraktion | Hoch | 2-3 Tage | P1 | Nächster |
| NK-Beleg-Parsing | Hoch | 3-4 Tage | P1 | Nächster |
| Cloud-Sync (GDrive) | Mittel | 5-8 Tage | P2 | Q2/2026 |
| FinAPI Matching | Hoch | 8-12 Tage | P2 | Q2/2026 |
| RAG-Index | Mittel | 5-6 Tage | P3 | Q3/2026 |
| Cloud-Sync (Dropbox) | Niedrig | 5-8 Tage | P3 | Q3/2026 |

---

## 5. Credit-Modell (Data Engine)

| Service | Einheit | Credits | EUR |
|---------|---------|---------|-----|
| Posteingang PDF-Extraktion | pro PDF | 1 | 0,25 |
| Storage-Extraktion (Phase 2) | pro Dokument | 1 | 0,25 |
| NK-Beleg-Parsing | pro Beleg | 1 | 0,25 |
| Cloud-Sync Import | pro Datei | 1 | 0,25 |
| FinAPI Konto-Sync | pro Konto | 4 | 1,00 |
| Auto-Matching (Doc→Vertrag) | pro Match | 2 | 0,50 |

---

## 6. Technische Abhängigkeiten

```
ENG-DOCINT Dependencies:
├── Lovable AI (Gemini Vision)     — Phase 1 ✅
├── Supabase Storage               — Phase 1 ✅
├── document_chunks + TSVector     — Phase 1 ✅
├── Credit-Preflight System        — Phase 1 🔜 (benötigt tenant_credit_balance)
├── OAuth2 Token Management        — Phase 2
├── pgvector Extension             — Phase 2
├── FinAPI SDK                     — Phase 2
└── Stripe (Credit Top-Up)         — Phase 2
```

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-02-18 | Initial — Phase 1 Status + Phase 2 Backlog |
