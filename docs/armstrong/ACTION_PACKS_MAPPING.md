# Armstrong Action Packs Mapping

**Version:** 1.0  
**Datum:** 2026-02-08  
**Status:** IMPLEMENTIERT (Phase 6 Content Blueprints)

---

## Übersicht

Dieses Dokument definiert die Pack-Struktur für alle Armstrong Actions und die MVP-Priorisierung.

| Pack | Beschreibung | Actions (bestehend) | Actions (neu) |
|------|--------------|---------------------|---------------|
| A | Core Explain/Assist | 4 | 2 |
| B | Dashboard Widgets | 6 | 1 |
| C | DMS Intelligence | 4 | 1 |
| D | Immobilien Dossier Assist | 7 | 2 |
| E | Finanzierung Assist | 4 | 0 |
| F | Investment & Mandate | 4 | 0 |
| G | Leads & Campaigns (Backlog) | 0 | 5 |
| H | Knowledge Research | 1 | 2 |

**Gesamt:** 37 bestehend + 8 neu = 45 Actions

---

## Pack A — Core Explain/Assist (Global)

| # | Action Code | Status | execution_mode | cost_model | credits_estimate | cost_hint_cents |
|---|-------------|--------|----------------|------------|------------------|-----------------|
| 1 | ARM.GLOBAL.EXPLAIN_TERM | ✅ Bestehend | readonly | free | 0 | 0 |
| 2 | ARM.GLOBAL.FAQ | ✅ Bestehend | readonly | free | 0 | 0 |
| 3 | ARM.GLOBAL.HOW_IT_WORKS | ✅ Bestehend | readonly | free | 0 | 0 |
| 4 | ARM.GLOBAL.WEB_SEARCH | ✅ Bestehend | execute_with_confirmation | metered | 6 | 300 |
| 5 | ARM.GLOBAL.SUMMARIZE_TEXT | 🆕 Neu | readonly | metered | 2 | 100 |
| 6 | ARM.GLOBAL.DRAFT_MESSAGE | 🆕 Neu | draft_only | metered | 2 | 100 |

---

## Pack B — MOD-00 Dashboard Widgets

| # | Action Code | Status | execution_mode | cost_model | credits_estimate | cost_hint_cents |
|---|-------------|--------|----------------|------------|------------------|-----------------|
| 1 | ARM.MOD00.CREATE_TASK | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 2 | ARM.MOD00.CREATE_REMINDER | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 3 | ARM.MOD00.CREATE_NOTE | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 4 | ARM.MOD00.CREATE_IDEA | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 5 | ARM.MOD00.CREATE_PROJECT | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 6 | ARM.MOD00.CREATE_RESEARCH | ✅ Bestehend | execute_with_confirmation | metered | 5 | 250 |
| 7 | ARM.MOD00.ARCHIVE_WIDGET | 🆕 Neu | execute_with_confirmation | free | 0 | 0 |

---

## Pack C — MOD-03 DMS Intelligence

| # | Action Code | Status | execution_mode | cost_model | credits_estimate | cost_hint_cents |
|---|-------------|--------|----------------|------------|------------------|-----------------|
| 1 | ARM.MOD03.SEARCH_DOC | ✅ Bestehend | readonly | free | 0 | 0 |
| 2 | ARM.MOD03.EXPLAIN_UPLOAD | ✅ Bestehend | readonly | free | 0 | 0 |
| 3 | ARM.MOD03.LINK_DOC | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 4 | ARM.MOD03.EXTRACT_DOC | ✅ Bestehend | execute_with_confirmation | metered | 10 | 500 |
| 5 | ARM.MOD03.DOC_CONFIDENCE_REVIEW_ASSIST | 🆕 Neu | readonly | metered | 2 | 100 |

---

## Pack D — MOD-04 Immobilien Dossier Assist

| # | Action Code | Status | execution_mode | cost_model | credits_estimate | cost_hint_cents |
|---|-------------|--------|----------------|------------|------------------|-----------------|
| 1 | ARM.MOD04.EXPLAIN_MODULE | ✅ Bestehend | readonly | free | 0 | 0 |
| 2 | ARM.MOD04.VALIDATE_PROPERTY | ✅ Bestehend | readonly | metered | 2 | 100 |
| 3 | ARM.MOD04.CREATE_PROPERTY | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 4 | ARM.MOD04.CREATE_UNIT | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 5 | ARM.MOD04.CALCULATE_KPI | ✅ Bestehend | readonly | metered | 2 | 100 |
| 6 | ARM.MOD04.LINK_DOCUMENTS | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 7 | ARM.MOD04.DATA_QUALITY_CHECK | ✅ Bestehend | readonly | free | 0 | 0 |
| 8 | ARM.MOD04.SUGGEST_DOCUMENTS_CHECKLIST | 🆕 Neu | readonly | metered | 2 | 100 |
| 9 | ARM.MOD04.GENERATE_EXPOSE_DRAFT | 🆕 Neu | draft_only | metered | 3 | 150 |

---

## Pack E — MOD-07 Finanzierung Assist

| # | Action Code | Status | execution_mode | cost_model | credits_estimate | cost_hint_cents |
|---|-------------|--------|----------------|------------|------------------|-----------------|
| 1 | ARM.MOD07.EXPLAIN_SELBSTAUSKUNFT | ✅ Bestehend | readonly | free | 0 | 0 |
| 2 | ARM.MOD07.DOC_CHECKLIST | ✅ Bestehend | readonly | free | 0 | 0 |
| 3 | ARM.MOD07.PREPARE_EXPORT | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 4 | ARM.MOD07.VALIDATE_READINESS | ✅ Bestehend | readonly | metered | 3 | 150 |

---

## Pack F — MOD-08 Investment & Mandate Assist

| # | Action Code | Status | execution_mode | cost_model | credits_estimate | cost_hint_cents |
|---|-------------|--------|----------------|------------|------------------|-----------------|
| 1 | ARM.MOD08.ANALYZE_FAVORITE | ✅ Bestehend | readonly | metered | 3 | 150 |
| 2 | ARM.MOD08.RUN_SIMULATION | ✅ Bestehend | readonly | metered | 2 | 100 |
| 3 | ARM.MOD08.CREATE_MANDATE | ✅ Bestehend | execute_with_confirmation | free | 0 | 0 |
| 4 | ARM.MOD08.WEB_RESEARCH | ✅ Bestehend | execute_with_confirmation | metered | 6 | 300 |

---

## Pack G — MOD-10 Leads & Campaigns (Backlog Phase 2)

> **Status:** Noch nicht implementiert. Definition für spätere Phase.

| # | Action Code | Status | execution_mode | cost_model | credits_estimate | cost_hint_cents |
|---|-------------|--------|----------------|------------|------------------|-----------------|
| 1 | ARM.MOD10.CREATE_LEAD | 📋 Backlog | execute_with_confirmation | free | 0 | 0 |
| 2 | ARM.MOD10.SCORE_LEAD | 📋 Backlog | readonly | metered | 2 | 100 |
| 3 | ARM.MOD10.CREATE_CAMPAIGN_DRAFT | 📋 Backlog | draft_only | metered | 4 | 200 |
| 4 | ARM.MOD10.GENERATE_AD_COPY | 📋 Backlog | draft_only | metered | 3 | 150 |
| 5 | ARM.MOD10.GENERATE_CREATIVE_BRIEF | 📋 Backlog | draft_only | premium | 8 | 400 |

---

## Pack H — Knowledge Research

| # | Action Code | Status | execution_mode | cost_model | credits_estimate | cost_hint_cents |
|---|-------------|--------|----------------|------------|------------------|-----------------|
| 1 | ARM.KB.CREATE_RESEARCH_MEMO | ✅ Bestehend | draft_only | metered | 6 | 300 |
| 2 | ARM.KB.SUGGEST_KB_ITEM_FROM_CHAT | 🆕 Neu | draft_only | metered | 2 | 100 |
| 3 | ARM.KB.BUILD_SALES_SCRIPT_VARIANTS | 🆕 Neu | draft_only | metered | 3 | 150 |

---

## TOP 30 MVP Actions

Die folgenden 30 Actions bilden das MVP-Set für Phase 6:

```typescript
export const TOP_30_MVP_ACTION_CODES = [
  // Pack A: Core (6)
  'ARM.GLOBAL.EXPLAIN_TERM',
  'ARM.GLOBAL.FAQ',
  'ARM.GLOBAL.HOW_IT_WORKS',
  'ARM.GLOBAL.WEB_SEARCH',
  'ARM.GLOBAL.SUMMARIZE_TEXT',
  'ARM.GLOBAL.DRAFT_MESSAGE',
  
  // Pack B: Dashboard (5)
  'ARM.MOD00.CREATE_TASK',
  'ARM.MOD00.CREATE_REMINDER',
  'ARM.MOD00.CREATE_NOTE',
  'ARM.MOD00.CREATE_IDEA',
  'ARM.MOD00.CREATE_PROJECT',
  
  // Pack C: DMS (4)
  'ARM.MOD03.SEARCH_DOC',
  'ARM.MOD03.EXPLAIN_UPLOAD',
  'ARM.MOD03.LINK_DOC',
  'ARM.MOD03.EXTRACT_DOC',
  
  // Pack D: Immobilien (6)
  'ARM.MOD04.EXPLAIN_MODULE',
  'ARM.MOD04.VALIDATE_PROPERTY',
  'ARM.MOD04.CREATE_PROPERTY',
  'ARM.MOD04.CREATE_UNIT',
  'ARM.MOD04.CALCULATE_KPI',
  'ARM.MOD04.DATA_QUALITY_CHECK',
  
  // Pack E: Finanzierung (4)
  'ARM.MOD07.EXPLAIN_SELBSTAUSKUNFT',
  'ARM.MOD07.DOC_CHECKLIST',
  'ARM.MOD07.PREPARE_EXPORT',
  'ARM.MOD07.VALIDATE_READINESS',
  
  // Pack F: Investment (4)
  'ARM.MOD08.ANALYZE_FAVORITE',
  'ARM.MOD08.RUN_SIMULATION',
  'ARM.MOD08.CREATE_MANDATE',
  'ARM.MOD08.WEB_RESEARCH',
  
  // Pack H: KB (1)
  'ARM.KB.CREATE_RESEARCH_MEMO',
] as const;
```

---

## MVP Extended (Alle 45 Actions)

Das Extended-Set enthält alle 45 Actions (MVP + 8 neue + 7 bestehende):

```typescript
export const MVP_EXTENDED_ACTION_CODES = [
  ...TOP_30_MVP_ACTION_CODES,
  
  // Pack B: Zusätzliche
  'ARM.MOD00.CREATE_RESEARCH',
  'ARM.MOD00.ARCHIVE_WIDGET',
  
  // Pack C: Zusätzliche
  'ARM.MOD03.DOC_CONFIDENCE_REVIEW_ASSIST',
  
  // Pack D: Zusätzliche
  'ARM.MOD04.LINK_DOCUMENTS',
  'ARM.MOD04.SUGGEST_DOCUMENTS_CHECKLIST',
  'ARM.MOD04.GENERATE_EXPOSE_DRAFT',
  
  // Pack H: Zusätzliche
  'ARM.KB.SUGGEST_KB_ITEM_FROM_CHAT',
  'ARM.KB.BUILD_SALES_SCRIPT_VARIANTS',
  
  // Public Actions (Zone 3)
  'ARM.PUBLIC.RENDITE_RECHNER',
  'ARM.PUBLIC.TILGUNG_RECHNER',
  'ARM.PUBLIC.BELASTUNG_RECHNER',
  'ARM.PUBLIC.CONTACT_REQUEST',
  'ARM.PUBLIC.NEWSLETTER_SIGNUP',
  'ARM.PUBLIC.EXPLAIN_LISTING',
  'ARM.PUBLIC.COMPARE_LISTINGS',
  
  // MOD-02
  'ARM.MOD02.SEND_LETTER',
] as const;
```

---

## Regeln & Constraints

### K1: execution_mode Enum

Erlaubte Werte: `readonly` | `draft_only` | `execute_with_confirmation` | `execute`

- `execute` nur erlaubt wenn: `risk_level='low' AND data_scopes_write=[] AND cost_model='free'`

### K2: Credits ↔ Cents Konsistenz

- 1 Credit = 0,50 EUR = 50 Cent
- `credits_estimate * 50 = cost_hint_cents`
- Alle `free` Actions: `credits_estimate=0, cost_hint_cents=0`

### K3: Confirm Gate

- Alle `metered` und `premium` Actions benötigen `execute_with_confirmation` oder höher
- Ausnahme: `readonly` metered Actions zeigen nur Cost Estimate, kein Write

### K4: Draft Only

- `draft_only` Actions schreiben nur Entwürfe (keine SSOT-Änderungen)
- Beispiele: DRAFT_MESSAGE, GENERATE_EXPOSE_DRAFT, KB Drafts

### K5: Research Memo Review Gate

- ARM.KB.CREATE_RESEARCH_MEMO erzeugt nur `status='draft'`
- Publish nur via Zone 1 Review UI durch org_admin/platform_admin

---

## Änderungshistorie

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-02-08 | Initial Pack Mapping + MVP Definition |
