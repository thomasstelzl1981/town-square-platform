# Implementierungsplan: Upload-Pipeline & MOD-09 Beratung

**Status:** Phase 1-2 DONE, Phase 3 PLANUNG  
**Datum:** 2026-01-27

---

## ✅ ABGESCHLOSSEN: Teil 1 - MOD-01 Bugfixes

| Task | Status |
|------|--------|
| FirmaTab Export in index.ts | ✅ DONE |
| FirmaTab Import in StammdatenPage | ✅ DONE |
| Route `/stammdaten/firma` in App.tsx | ✅ DONE |

---

## ✅ ABGESCHLOSSEN: Teil 2 - KI-Upload-Pipeline

### 2a) Datenbank-Migration ✅

| Tabelle | Status |
|---------|--------|
| `documents` erweitert (extracted_json_path, extraction_status, source, ai_summary, detected_type) | ✅ DONE |
| `billing_usage` (Seiten-Counter pro Tenant/Monat) | ✅ DONE |
| `extractions` (Einzelne Parsing-Jobs) | ✅ DONE |
| `tenant_extraction_settings` (Auto-Extraction Einstellungen) | ✅ DONE |
| RPC `increment_billing_usage` | ✅ DONE |
| RPC `increment_lovable_ai_usage` | ✅ DONE |

### 2b) Edge Function ✅

| Function | Technologie | Status |
|----------|-------------|--------|
| `sot-document-parser` | Lovable AI (Gemini 3 Flash) | ✅ DONE |
| `config.toml` aktualisiert | — | ✅ DONE |

### 2c) Frontend-Komponenten ✅

| Komponente | Pfad | Status |
|------------|------|--------|
| `useSmartUpload` Hook | `src/hooks/useSmartUpload.ts` | ✅ DONE |
| `ImportPreview` Komponente | `src/components/shared/ImportPreview.tsx` | ✅ DONE |
| TypeScript Schemas | `src/types/document-schemas.ts` | ✅ DONE |
| Shared Index Export | `src/components/shared/index.ts` | ✅ DONE |

### 2d) Dokumentation ✅

| Dokument | Status |
|----------|--------|
| ADR-038 Storage Architecture v1.1 | ✅ DONE |
| API Numbering Catalog (INTERNAL-006, INTERNAL-007) | ✅ DONE |
| plan.md (dieses Dokument) | ✅ DONE |

---

## 🔄 PLANUNG: Teil 3 - MOD-09 Beratung

### Architektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BeratungTab - Vollständiger Beratungs-Workflow                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────────────────────┐ │
│  │  OBJEKT-AUSWAHL  │  │  INVESTMENT CALCULATOR                       │ │
│  │  ──────────────  │  │  ──────────────────────                       │ │
│  │  • Aus Katalog   │  │  • Pre-filled mit Objektdaten                │ │
│  │  • Oder manuell  │  │  • Eigenkapital editierbar                   │ │
│  │                  │  │  • Finanzierung                               │ │
│  │  KUNDE-AUSWAHL   │  │  • Steuerdaten                               │ │
│  │  ──────────────  │  │                                              │ │
│  │  • Aus Kontakten │  │  [Graph + 40-Jahre-Tabelle]                  │ │
│  │  • Oder neu      │  │                                              │ │
│  │                  │  │  [Speichern] [PDF] [Deal starten]            │ │
│  └──────────────────┘  └──────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Geplante Komponenten

| Komponente | Beschreibung | Status |
|------------|--------------|--------|
| `ObjectSelector.tsx` | Grid mit partner_visible Listings | ⏳ PLANNED |
| `CustomerSelector.tsx` | Dropdown mit Kontakten | ⏳ PLANNED |
| `SimulationActions.tsx` | Speichern, PDF, Deal starten | ⏳ PLANNED |
| `BeratungTab.tsx` Refactoring | Vollständiger Workflow | ⏳ PLANNED |

### Geplante Datenbank

| Tabelle | Beschreibung | Status |
|---------|--------------|--------|
| `investment_simulations` | Persistierte Berechnungen | ⏳ PLANNED |

### Datenfluss

```
1. Partner wählt Objekt aus Katalog (oder gibt manuell ein)
2. Partner wählt Kunden aus Kontakten (oder legt neu an)
3. Investment Calculator zeigt Berechnung
4. Partner kann Simulation speichern
5. Partner kann PDF exportieren
6. Partner kann Deal in Pipeline starten
```

---

## Storage-Architektur (v1.1)

### Zwei-Engine-Modell

| Quelle | Engine | JSON-Pfad | Kosten |
|--------|--------|-----------|--------|
| Drag & Drop | Lovable AI | `derived/{id}/metadata.json` | Inklusive |
| UI-Upload | Lovable AI | `derived/{id}/metadata.json` | Inklusive |
| Resend (E-Mail) | Unstructured.io | `derived/{id}/unstructured.json` | 0.02-0.05€/Seite |
| Caya (Post) | Unstructured.io | `derived/{id}/unstructured.json` | 0.02-0.05€/Seite |
| Cloud-Import | Unstructured.io | `derived/{id}/unstructured.json` | 0.02-0.05€/Seite |

### Billing-Tracking

| Counter | Tabelle | RPC |
|---------|---------|-----|
| Lovable AI Calls | `billing_usage.lovable_ai_calls` | `increment_lovable_ai_usage` |
| Lovable AI Tokens | `billing_usage.lovable_ai_tokens` | `increment_lovable_ai_usage` |
| Unstructured Fast | `billing_usage.extraction_pages_fast` | `increment_billing_usage` |
| Unstructured HiRes | `billing_usage.extraction_pages_hires` | `increment_billing_usage` |
| Kosten (Cents) | `billing_usage.extraction_cost_cents` | `increment_billing_usage` |

---

## Edge Functions (Aktuell)

| ID | Function | Modul | Status |
|----|----------|-------|--------|
| INTERNAL-001 | sot-letter-generate | MOD-02 | ACTIVE |
| INTERNAL-002 | sot-expose-description | MOD-04 | ACTIVE |
| INTERNAL-003 | sot-dms-upload-url | MOD-03 | ACTIVE |
| INTERNAL-004 | sot-dms-download-url | MOD-03 | ACTIVE |
| INTERNAL-005 | sot-investment-engine | MOD-08 | ACTIVE |
| INTERNAL-006 | sot-armstrong-advisor | MOD-02 | ACTIVE |
| INTERNAL-007 | sot-document-parser | MOD-03 | ACTIVE |
| API-801 | sot-msv-reminder-check | MOD-05 | ACTIVE |
| API-802 | sot-msv-rent-report | MOD-05 | ACTIVE |
| API-803 | sot-listing-publish | MOD-05 | ACTIVE |
| API-804 | sot-lead-inbox | MOD-10 | ACTIVE |
| API-701 | sot-property-crud | MOD-04 | ACTIVE |

---

## Nächste Schritte

1. ⏳ **MOD-09 Beratung Planung abschließen**
   - ObjectSelector Design
   - CustomerSelector Design
   - investment_simulations Schema
   - BeratungTab Wireframe

2. ⏳ **Nach Freigabe implementieren**
   - DB-Migration investment_simulations
   - Komponenten erstellen
   - BeratungTab refactoren

3. ⏳ **Integration testen**
   - Objekt aus Katalog wählen
   - Kunde wählen/anlegen
   - Simulation speichern
   - Deal starten
