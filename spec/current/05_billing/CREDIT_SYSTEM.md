# Credit-System — Source of Truth

**Version:** 1.0  
**Status:** DRAFT  
**Letzte Aktualisierung:** 2026-02-18  
**Governance-Referenz:** KB.SYSTEM.006 (K2)

---

## 1. Grundregel

| Eigenschaft | Wert |
|-------------|------|
| **1 Credit** | **0,25 EUR = 25 Cent** |
| Formel | `credits_estimate × 25 = cost_hint_cents` |
| Minimum | 0 Credits (Free Actions) |
| Abrechnung | Pro Action-Run / Pro Einheit |

---

## 2. Billable-Items-Register

### Kategorie A: Armstrong-Actions (KI-Interaktionen)

| Tier | Credits | EUR | Beschreibung |
|------|---------|-----|--------------|
| Free | 0 | 0,00 | Readonly, Navigation, Erklärungen, Calculator |
| Light | 1 | 0,25 | Einfache KI-Antwort, Draft, Zusammenfassung |
| Standard | 2 | 0,50 | KI + Analyse, Draft mit Kontext, Web-Suche |
| Pro | 4 | 1,00 | Komplexe KI-Analyse, Exposé-Entwurf |
| Premium | 8–12 | 2,00–3,00 | Multi-Step-Workflow, LP Generate/Publish |

### Kategorie B: Infrastruktur-Services

| Service | Einheit | Credits | EUR | Hinweis |
|---------|---------|---------|-----|---------|
| **Posteingang-Extraktion** | pro PDF | 1 | 0,25 | Automatisch bei Inbound-E-Mail mit PDF-Anhang |
| E-Mail senden (Resend) | pro E-Mail | 0 | 0,00 | Inkludiert (Fair-Use) |
| WhatsApp senden | pro Nachricht | 0 | 0,00 | Inkludiert (Fair-Use) |
| Brief senden (physisch) | pro Brief | 4 | 1,00 | Externe Druckkosten |

> **Hinweis:** Die Funktion "eigene Dateien aus Storage auslesen" (OCR/Extraktion für bereits hochgeladene Dokumente) ist **nicht implementiert** und noch nicht konzipiert. Die oben genannte Extraktion bezieht sich ausschließlich auf PDFs, die über den Posteingang (E-Mail-Inbound) eingehen.

### Kategorie C: Storage + Plattform-Abos

| Tier | Storage | Dokumente | Preis/Monat | Credits/Monat |
|------|---------|-----------|-------------|---------------|
| Free | 1 GB | 1.000 | Inkl. | 0 |
| Pro | 10 GB | 10.000 | 9,90 EUR | 40 |
| Enterprise | 100 GB | Unlim. | Individuell | Individuell |

---

## 3. Vollständige Action-Credit-Tabelle

### GLOBAL (6 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.GLOBAL.EXPLAIN_TERM | readonly | 0 | 0,00 |
| ARM.GLOBAL.FAQ | readonly | 0 | 0,00 |
| ARM.GLOBAL.HOW_IT_WORKS | readonly | 0 | 0,00 |
| ARM.GLOBAL.WEB_SEARCH | readonly | 2 | 0,50 |
| ARM.GLOBAL.SUMMARIZE_TEXT | draft_only | 1 | 0,25 |
| ARM.GLOBAL.DRAFT_MESSAGE | draft_only | 1 | 0,25 |

### MOD-00 Dashboard (10 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD00.OPEN_MODULE | execute | 0 | 0,00 |
| ARM.MOD00.CREATE_WIDGET | execute | 0 | 0,00 |
| ARM.MOD00.REMOVE_WIDGET | execute | 0 | 0,00 |
| ARM.MOD00.REORDER_WIDGETS | execute | 0 | 0,00 |
| ARM.MOD00.RESET_DASHBOARD | execute | 0 | 0,00 |
| ARM.MOD00.PRIORITIZE_INBOX | readonly | 1 | 0,25 |
| ARM.MOD00.DAILY_BRIEFING | readonly | 2 | 0,50 |
| ARM.MOD00.SHOW_KPI | readonly | 0 | 0,00 |
| ARM.MOD00.NAVIGATE_TILE | execute | 0 | 0,00 |
| ARM.MOD00.SUGGEST_ACTIONS | readonly | 0 | 0,00 |

### MOD-01 Stammdaten (3 Actions — NEU)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD01.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD01.UPDATE_PROFILE | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD01.EXPORT_DATA | execute_with_confirmation | 2 | 0,50 |

### MOD-02 KI Office (15 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD02.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD02.SEND_EMAIL | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD02.DRAFT_LETTER | draft_only | 1 | 0,25 |
| ARM.MOD02.SEND_LETTER | execute_with_confirmation | 4 | 1,00 |
| ARM.MOD02.SEND_WHATSAPP | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD02.DRAFT_WHATSAPP_REPLY | draft_only | 1 | 0,25 |
| ARM.MOD02.SEARCH_CONTACTS | readonly | 0 | 0,00 |
| ARM.MOD02.CREATE_CONTACT | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD02.SCHEDULE_APPOINTMENT | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD02.SEARCH_EMAILS | readonly | 0 | 0,00 |
| ARM.MOD02.SUMMARIZE_THREAD | readonly | 1 | 0,25 |
| ARM.MOD02.START_VIDEOCALL | execute | 0 | 0,00 |
| ARM.MOD02.VOICE_INPUT | readonly | 0 | 0,00 |
| ARM.MOD02.CALENDAR_OVERVIEW | readonly | 0 | 0,00 |
| ARM.MOD02.CREATE_TASK | execute_with_confirmation | 0 | 0,00 |

### MOD-03 DMS (5 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD03.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD03.SEARCH_DOCUMENTS | readonly | 0 | 0,00 |
| ARM.MOD03.UPLOAD_DOCUMENT | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD03.EXTRACT_POSTEINGANG | execute | 1/PDF | 0,25 |
| ARM.MOD03.SORT_INBOX | execute | 0 | 0,00 |

### MOD-04 Immobilien (10 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD04.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD04.SEARCH_PROPERTIES | readonly | 0 | 0,00 |
| ARM.MOD04.CREATE_PROPERTY | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD04.VIEW_DOSSIER | readonly | 0 | 0,00 |
| ARM.MOD04.CALCULATE_NK | readonly | 0 | 0,00 |
| ARM.MOD04.SIMULATE_RENT_INCREASE | readonly | 0 | 0,00 |
| ARM.MOD04.DRAFT_MAHNUNG | draft_only | 1 | 0,25 |
| ARM.MOD04.GENERATE_NK_REPORT | execute_with_confirmation | 2 | 0,50 |
| ARM.MOD04.PROPERTY_VALUATION | readonly | 2 | 0,50 |
| ARM.MOD04.REQUEST_RENOVATION | execute_with_confirmation | 0 | 0,00 |

### MOD-05 Pets (3 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD05.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD05.CREATE_PET | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD05.SCHEDULE_VET | execute_with_confirmation | 0 | 0,00 |

### MOD-06 Verkauf (5 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD06.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD06.CREATE_LISTING | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD06.DRAFT_EXPOSE | draft_only | 4 | 1,00 |
| ARM.MOD06.PUBLISH_LISTING | execute_with_confirmation | 2 | 0,50 |
| ARM.MOD06.VIEW_INQUIRIES | readonly | 0 | 0,00 |

### MOD-07 Finanzierung (7 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD07.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD07.START_REQUEST | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD07.FILL_SELBSTAUSKUNFT | execute | 0 | 0,00 |
| ARM.MOD07.UPLOAD_DOCUMENTS | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD07.SUBMIT_REQUEST | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD07.CHECK_STATUS | readonly | 0 | 0,00 |
| ARM.MOD07.DATA_QUALITY_CHECK | readonly | 2 | 0,50 |

### MOD-08/09 Investment + Vertrieb (7 Actions + 41 Coach)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD08.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD08.CALCULATE_INVESTMENT | readonly | 0 | 0,00 |
| ARM.MOD08.COMPARE_OBJECTS | readonly | 0 | 0,00 |
| ARM.MOD08.VIEW_PORTFOLIO | readonly | 0 | 0,00 |
| ARM.MOD09.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD09.VIEW_PARTNER_LISTINGS | readonly | 0 | 0,00 |
| ARM.MOD09.CONTACT_PARTNER | execute_with_confirmation | 0 | 0,00 |
| ARM.COACH.* (41 Steps) | readonly | 0 | 0,00 |

### MOD-10 Leadmanager (5 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD10.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD10.VIEW_LEADS | readonly | 0 | 0,00 |
| ARM.MOD10.ASSIGN_LEAD | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD10.QUALIFY_LEAD | readonly | 1 | 0,25 |
| ARM.MOD10.EXPORT_LEADS | execute_with_confirmation | 2 | 0,50 |

### MOD-11 Finanzierungsmanager (5 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD11.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD11.VIEW_MANDATES | readonly | 0 | 0,00 |
| ARM.MOD11.ACCEPT_MANDATE | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD11.SUBMIT_TO_BANK | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD11.NOTIFY_MANAGER | execute_with_confirmation | 0 | 0,00 |

### MOD-12 Akquise-Manager (3 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD12.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD12.VIEW_OFFERS | readonly | 0 | 0,00 |
| ARM.MOD12.EVALUATE_OFFER | readonly | 2 | 0,50 |

### MOD-13 Projekte (5 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD13.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD13.CREATE_PROJECT | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD13.INTAKE_ANALYZE | execute_with_confirmation | 4 | 1,00 |
| ARM.MOD13.GENERATE_PDF | execute_with_confirmation | 2 | 0,50 |
| ARM.MOD13.PUBLISH_LISTINGS | execute_with_confirmation | 2 | 0,50 |

### MOD-14 Communication Pro (6 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD14.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD14.SEARCH_CONTACTS | readonly | 2 | 0,50 |
| ARM.MOD14.IMPORT_CANDIDATES | execute_with_confirmation | 1/Kontakt | 0,25 |
| ARM.MOD14.VIEW_RESULTS | readonly | 0 | 0,00 |
| ARM.MOD14.RESEARCH_RUN_ORDER | execute_with_confirmation | 4 | 1,00 |
| ARM.MOD14.SOCIAL_MANDATE | execute_with_confirmation | 4 | 1,00 |

### MOD-15 Fortbildung (3 Actions — NEU)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD15.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD15.RECOMMEND_COURSE | readonly | 0 | 0,00 |
| ARM.MOD15.TRACK_PROGRESS | readonly | 0 | 0,00 |

### MOD-16 Sanierung (3 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD16.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD16.REQUEST_TENDER | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD16.VIEW_OFFERS | readonly | 0 | 0,00 |

### MOD-17 Cars (3 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD17.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD17.CREATE_VEHICLE | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD17.VIEW_DOSSIER | readonly | 0 | 0,00 |

### MOD-18 Finanzanalyse (3 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD18.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD18.VIEW_OVERVIEW | readonly | 0 | 0,00 |
| ARM.MOD18.ANALYZE_PORTFOLIO | readonly | 2 | 0,50 |

### MOD-19 Photovoltaik (2 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD19.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD19.VIEW_DASHBOARD | readonly | 0 | 0,00 |

### MOD-20 Miety/Zuhause (4 Actions — NEU)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD20.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD20.CREATE_CONTRACT | execute_with_confirmation | 0 | 0,00 |
| ARM.MOD20.ANALYZE_COSTS | readonly | 1 | 0,25 |
| ARM.MOD20.DRAFT_KUENDIGUNG | draft_only | 1 | 0,25 |

### MOD-22 Pet Manager (3 Actions — NEU)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.MOD22.EXPLAIN_MODULE | readonly | 0 | 0,00 |
| ARM.MOD22.VIEW_CLIENTS | readonly | 0 | 0,00 |
| ARM.MOD22.SCHEDULE_APPOINTMENT | execute_with_confirmation | 0 | 0,00 |

### Landing Page Builder (2 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.LP.GENERATE_LANDING_PAGE | execute_with_confirmation | 8 | 2,00 |
| ARM.LP.PUBLISH | execute_with_confirmation | 12 | 3,00 |

### KB Knowledge Base (3 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.KB.SEARCH | readonly | 0 | 0,00 |
| ARM.KB.SUGGEST_UPDATE | draft_only | 0 | 0,00 |
| ARM.KB.PUBLISH_MEMO | execute_with_confirmation | 2 | 0,50 |

### Z3 Personas (8 Actions)

| Action-Code | Execution Mode | Credits | EUR |
|-------------|---------------|---------|-----|
| ARM.Z3.SEARCH_KNOWLEDGE | readonly | 0 | 0,00 |
| ARM.Z3.EXPLAIN_LISTING | readonly | 0 | 0,00 |
| ARM.Z3.CALCULATE_FINANCING | readonly | 0 | 0,00 |
| ARM.Z3.CALCULATE_INVESTMENT | readonly | 0 | 0,00 |
| ARM.Z3.SUBMIT_LEAD | execute | 0 | 0,00 |
| ARM.Z3.NEWSLETTER_SIGNUP | execute | 0 | 0,00 |
| ARM.Z3.COMPARE_OBJECTS | readonly | 0 | 0,00 |
| ARM.Z3.CONTACT_FORM | execute | 0 | 0,00 |

---

## 4. Bilanz

| Metrik | Wert |
|--------|------|
| **1 Credit** | **0,25 EUR = 25 Cent** |
| Total Armstrong-Actions | ~133 |
| Davon Free | ~90 (68%) |
| Davon Metered | ~43 (32%) |
| Günstigste Metered Action | 1 Credit (0,25 EUR) |
| Teuerste Metered Action | 12 Credits (3,00 EUR) — LP Publish |
| Infrastruktur-Services | 3 Einträge (Posteingang-Extraktion, Brief, Storage) |

---

## 5. Nicht implementiert / Nicht geplant

| Feature | Status | Hinweis |
|---------|--------|---------|
| Storage-Dokumente auslesen (OCR) | ❌ Nicht implementiert | Konzept noch offen, keine Unstructured-Integration |
| Seitenbasierte Extraktion (pro Seite) | ❌ Nicht vorgesehen | Abrechnung pauschal pro PDF über Posteingang |
| Eigene Dateien extrahieren | ❌ Nicht diskutiert | Mögliche Zukunftsfunktion |

---

## 6. Nächste Schritte

1. **DB-Migration**: `rpc_armstrong_log_action_run` Formel auf `CEIL(p_cost_cents / 25.0)` ändern
2. **Manifest**: 13 neue Actions in `armstrongManifest.ts` einfügen
3. **Credit-Balance**: Tabelle `tenant_credit_balance` (Saldo + Top-Up)
4. **Pre-Flight**: Edge Function `sot-credit-preflight`
5. **Stripe**: Credit-Top-Up via Stripe Checkout
