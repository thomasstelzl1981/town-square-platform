

# MOD-13 Armstrong Actions: Vollstandige Erweiterung

## Befund

MOD-13 hat aktuell nur **5 registrierte Actions** im Manifest:

| Code | Status |
|------|--------|
| `ARM.MOD13.CREATE_DEV_PROJECT` | registriert |
| `ARM.MOD13.EXPLAIN_MODULE` | registriert |
| `ARM.MOD13.CALCULATE_AUFTEILER` | registriert |
| `ARM.MOD13.GENERATE_SALES_REPORT` | registriert |
| `ARM.MOD13.DRAFT_RESERVATION` | registriert |

**Problem:** Die `ArmstrongChipBar` referenziert **8 zusatzliche Action-Codes**, die im Manifest NICHT existieren (Geister-Actions). Ausserdem fehlen entscheidende Lifecycle-Actions fur den kompletten 7-Phasen Golden Path.

---

## Fehlende Actions (16 Stuck in 3 Kategorien)

### Kategorie A: Intake-Begleitung (8 Actions — ChipBar-Ghosts fixen)

Diese Codes sind bereits in `ArmstrongChipBar.tsx` verdrahtet, aber im Manifest nicht registriert:

| # | Code | Titel | Modus | Kosten |
|---|------|-------|-------|--------|
| 1 | `ARM.MOD13.EXPLAIN_UPLOAD_FORMATS` | Upload-Formate erklaren | readonly | free |
| 2 | `ARM.MOD13.SHOW_EXAMPLE` | Beispiel-Expose zeigen | readonly | free |
| 3 | `ARM.MOD13.EXPLAIN_ANALYSIS_TIME` | Analysedauer erklaren | readonly | free |
| 4 | `ARM.MOD13.REVIEW_UNITS` | Einheiten prufen | readonly | free |
| 5 | `ARM.MOD13.EXPLAIN_TERMS` | Fachbegriffe erklaren | readonly | free |
| 6 | `ARM.MOD13.VALIDATE_DATA` | Daten-Plausibilitat | readonly | metered (5ct) |
| 7 | `ARM.MOD13.CREATE_PROPERTY_FILES` | Immobilienakten erstellen | execute_with_confirmation | metered (10ct) |
| 8 | `ARM.MOD13.START_DISTRIBUTION` | Vertrieb starten | execute_with_confirmation | metered (10ct) |

### Kategorie B: Lifecycle-Actions (5 Actions — Golden Path Phasen)

Fur den 7-Phasen-Flow fehlende Steuerungs-Actions:

| # | Code | Titel | Modus | Kosten |
|---|------|-------|-------|--------|
| 9 | `ARM.MOD13.PHASE_CHANGE` | Projektphase wechseln | execute_with_confirmation | free |
| 10 | `ARM.MOD13.PUBLISH_LISTINGS` | Listings veroffentlichen | execute_with_confirmation | metered (10ct) |
| 11 | `ARM.MOD13.GENERATE_PROJECT_LP` | Projekt-Landingpage erstellen | execute_with_confirmation | metered (250ct) |
| 12 | `ARM.MOD13.ANALYZE_INVEST` | Investment-Analyse starten | readonly | free |
| 13 | `ARM.MOD13.PROJECT_SUMMARY` | Projekt-Zusammenfassung | readonly | metered (5ct) |

### Kategorie C: Dossier-Hilfe (3 Actions)

| # | Code | Titel | Modus | Kosten |
|---|------|-------|-------|--------|
| 14 | `ARM.MOD13.EXPLAIN_UNIT` | Einheit erklaren | readonly | free |
| 15 | `ARM.MOD13.UPLOAD_PROJECT_DOC` | Projektdokument hochladen | execute_with_confirmation | free |
| 16 | `ARM.MOD13.DATA_QUALITY_CHECK` | Datenqualitat prufen | readonly | metered (5ct) |

---

## Implementierungsschritte

### Schritt 1: armstrongManifest.ts — 16 Actions registrieren

Alle 16 Actions werden nach dem bestehenden MOD-13-Block (nach Zeile 3555) eingefugt, mit vollstandigem V2-Schema (zones, risk_level, execution_mode, data_scopes, side_effects, cost_model, api_contract).

### Schritt 2: TOP_30_MVP_ACTION_CODES erweitern

Pack I (Projekte) wird von 2 auf 6 Eintrage erweitert:
- `ARM.MOD13.VALIDATE_DATA` (Intake-Begleitung)
- `ARM.MOD13.PHASE_CHANGE` (Lifecycle)
- `ARM.MOD13.PUBLISH_LISTINGS` (Vertrieb)
- `ARM.MOD13.PROJECT_SUMMARY` (Reporting)

### Schritt 3: ArmstrongChipBar.tsx — Erweiterte Chips

Die MOD-13 Default-Chips (Zeile 96-99) werden um die wichtigsten Lifecycle-Actions erweitert:

```text
MOD-13 Default:  Projekt aus Dokument | Projektphase | Vertrieb starten
MOD-13 Intake:   (bleibt wie gehabt — bereits korrekt verdrahtet)
MOD-13 Detail:   Einheit erklaren | Datenqualitat | Investment-Analyse
```

### Schritt 4: useArmstrongAdvisor.ts — Kontextgruss erweitern

Die MOD-13 Welcome-Config (Zeile 193-198) wird um zusatzliche Chips fur Lifecycle erganzt:

```text
Greeting: "Projekte-Bereich. Ich begleite dich durch den gesamten Projekt-Lifecycle:"
Chips: [Projekt aus Dokument, Projektphase, Zusammenfassung, Modul erklaren]
```

### Schritt 5: Spec-Update — Knowledge Items fur Armstrong

Armstrong braucht Wissen uber die MOD-13-Prozesse, um die Actions sinnvoll ausfuhren zu konnen. Die Knowledge-Items werden uber bestehende Tabellen (`armstrong_knowledge_items`) vermittelt. Die konkreten Antwort-Templates fur die 8 Intake-Phase-Actions (EXPLAIN_UPLOAD_FORMATS, SHOW_EXAMPLE, etc.) werden als statische Responses im Advisor-Hook hinterlegt, da sie kein AI-Processing erfordern.

---

## Technische Details

### Action-Schema-Muster (Beispiel)
```typescript
{
  action_code: 'ARM.MOD13.PHASE_CHANGE',
  title_de: 'Projektphase wechseln',
  description_de: 'Wechselt die Phase eines Projekts (Planung → Bau → Vertrieb → Ubergabe)',
  zones: ['Z2'],
  module: 'MOD-13',
  risk_level: 'medium',
  execution_mode: 'execute_with_confirmation',
  requires_consent_code: null,
  roles_allowed: [],
  data_scopes_read: ['dev_projects', 'dev_project_units'],
  data_scopes_write: ['dev_projects'],
  side_effects: ['modifies_dev_projects', 'triggers_golden_path'],
  version: '1.0.0',
  cost_model: 'free',
  cost_unit: null,
  cost_hint_cents: null,
  api_contract: { type: 'internal', endpoint: null },
  ui_entrypoints: ['/portal/projekte'],
  audit_event_type: 'ARM_MOD13_PHASE_CHANGE',
  status: 'active',
}
```

### Statische Responses (Intake-Phase)
Die 3 reinen Erklarungs-Actions (`EXPLAIN_UPLOAD_FORMATS`, `SHOW_EXAMPLE`, `EXPLAIN_ANALYSIS_TIME`) erhalten direkte Text-Antworten im Advisor-Hook, ohne AI-Call. Beispiel:

- **EXPLAIN_UPLOAD_FORMATS**: "Ich akzeptiere PDF-Exposes, Excel-Preislisten (XLSX/CSV) und Bilddateien. Am besten lade Expose + Preisliste gemeinsam hoch."
- **EXPLAIN_ANALYSIS_TIME**: "Die KI-Analyse dauert ca. 15-30 Sekunden je Dokument. Bei grossen Preislisten (70+ Einheiten) kann es bis zu 60 Sekunden dauern."

### Betroffene Dateien
1. `src/manifests/armstrongManifest.ts` — 16 neue Actions + TOP30 erweitern
2. `src/components/chat/ArmstrongChipBar.tsx` — Default-Chips erweitern
3. `src/hooks/useArmstrongAdvisor.ts` — Welcome-Config + statische Responses

Keine Module-Freeze-Verletzung: Alle betroffenen Dateien liegen ausserhalb von Modul-Pfaden.

