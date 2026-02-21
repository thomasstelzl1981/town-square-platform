

# MOD-21: KI-Browser — Vollstaendige Planungsspezifikation

## Machbarkeitsbewertung

### JA, technisch moeglich — mit Phasenmodell

Das Konzept ist architektonisch vollstaendig manifest-konform planbar. Die zentrale Infrastruktur-Einschraenkung (kein Playwright in Edge Functions) wird durch ein 3-Phasen-Modell geloest.

| Phase | Umfang | Infrastruktur | Kosten/Session |
|-------|--------|--------------|----------------|
| Phase 1 (MVP) | Modul-Shell + fetch-basierte Recherche + KI-Analyse | Nur Edge Functions | 1-2 Credits |
| Phase 2 | Externer Browser-API-Dienst (Browserbase/Browserless) | Edge Function als Proxy | 4-12 Credits |
| Phase 3 | Eigener Playwright-Server + WebRTC-Streaming | VPS/Container (ausserhalb Lovable) | Hosting + Credits |

---

## 1. SSOT-Inventur (Repo-Abgleich)

### Freier Modul-Slot
- **MOD-21** ist nicht belegt (MOD-00 bis MOD-20 + MOD-22 existieren)
- `modules_freeze.json` enthaelt keinen MOD-21-Eintrag — muss neu angelegt werden

### Manifest-Einhak-Punkte

| Datei | Aktion | Details |
|-------|--------|---------|
| `src/manifests/routesManifest.ts` | Neuer `MOD-21` Block in `zone2Portal.modules` | 5 Tiles: uebersicht, session, quellen, vorlagen, policies |
| `src/manifests/areaConfig.ts` | MOD-21 in `base`-Area einfuegen | Neben MOD-03, MOD-01, ARMSTRONG, INTAKE |
| `src/manifests/armstrongManifest.ts` | 10 neue Actions hinzufuegen | ARM.BROWSER.* Namespace |
| `spec/current/00_frozen/modules_freeze.json` | MOD-21 Eintrag mit `frozen: false` | Neues Modul, nicht eingefroren |
| `src/config/storageManifest.ts` | MOD_21 Eintrag | Private Bucket-Pfade fuer Artifacts |
| `src/config/demoDataRegistry.ts` | Kein Eintrag noetig | KI-Browser hat keine Demo-Daten (Live-Sessions) |
| `spec/current/06_engines/ENGINE_REGISTRY.md` | Neuer Eintrag ENG-KIBROWSER | Data/AI Engine (Edge Function) |
| `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md` | Neuer Eintrag GP-BROWSER-SESSION | Session-Lifecycle |

---

## 2. Routes-Manifest-Eintrag

```text
"MOD-21": {
  name: "KI-Browser",
  base: "ki-browser",
  icon: "Globe",
  display_order: 21,
  visibility: {
    default: false,
    org_types: ["client", "partner"],
    requires_activation: true,
  },
  tiles: [
    { path: "uebersicht", component: "KiBrowserUebersicht", title: "Uebersicht", default: true },
    { path: "session", component: "KiBrowserSession", title: "Session" },
    { path: "quellen", component: "KiBrowserQuellen", title: "Quellen & Belege" },
    { path: "vorlagen", component: "KiBrowserVorlagen", title: "Vorlagen" },
    { path: "policies", component: "KiBrowserPolicies", title: "Policies" },
  ],
}
```

**Route**: `/portal/ki-browser/uebersicht` (default), `/portal/ki-browser/session`, etc.

---

## 3. Armstrong Actions (10 neue)

Alle im Namespace `ARM.BROWSER.*`, Zone Z2, Modul MOD-21.

| Action Code | title_de | risk_level | execution_mode | cost_model | cost_hint_cents |
|------------|----------|------------|----------------|------------|-----------------|
| `ARM.BROWSER.START_SESSION` | Browser-Session starten | medium | execute_with_confirmation | metered | 25 |
| `ARM.BROWSER.OPEN_URL` | URL oeffnen | low | execute | free | 0 |
| `ARM.BROWSER.SEARCH` | Web-Suche ausfuehren | medium | execute_with_confirmation | metered | 5 |
| `ARM.BROWSER.CLICK` | Element anklicken | medium | execute_with_confirmation | free | 0 |
| `ARM.BROWSER.TYPE` | Text eingeben | high | execute_with_confirmation | free | 0 |
| `ARM.BROWSER.SCROLL` | Seite scrollen | low | execute | free | 0 |
| `ARM.BROWSER.EXTRACT` | Inhalte extrahieren | medium | execute_with_confirmation | metered | 25 |
| `ARM.BROWSER.SCREENSHOT` | Screenshot erstellen | low | execute | free | 0 |
| `ARM.BROWSER.SUMMARIZE` | Ergebnisse zusammenfassen | medium | execute_with_confirmation | metered | 25 |
| `ARM.BROWSER.END_SESSION` | Session beenden | low | execute | free | 0 |

### K3-Konformitaet
- `execute` nur bei risk_level=low UND cost_model=free UND keine Schreibzugriffe
- TYPE ist `high` wegen Formular-Interaktion (Guardrail-kritisch)
- Alle metered Actions durchlaufen Credit-Preflight via `sot-credit-preflight`

---

## 4. Datenmodell (DB-Tabellen)

### 4.1 ki_browser_sessions

| Spalte | Typ | Constraint |
|--------|-----|-----------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| tenant_id | uuid NOT NULL | FK organizations(id), RLS-relevant |
| user_id | uuid NOT NULL | FK auth.users(id) |
| policy_profile_id | uuid | FK ki_browser_policies(id) |
| purpose | text | Freitext-Beschreibung |
| status | text NOT NULL | 'active', 'completed', 'expired', 'cancelled' |
| step_count | integer DEFAULT 0 | Zaehler |
| max_steps | integer DEFAULT 50 | Hard Limit |
| expires_at | timestamptz NOT NULL | TTL (Default: +30min) |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

### 4.2 ki_browser_steps

| Spalte | Typ | Constraint |
|--------|-----|-----------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| session_id | uuid NOT NULL | FK ki_browser_sessions(id) ON DELETE CASCADE |
| step_number | integer NOT NULL | Sequenznummer |
| kind | text NOT NULL | 'open_url', 'search', 'click', 'type', 'scroll', 'extract', 'screenshot' |
| status | text NOT NULL | 'proposed', 'approved', 'rejected', 'executed', 'failed', 'blocked' |
| risk_level | text NOT NULL | 'safe_auto', 'confirm_needed', 'blocked' |
| payload_json | jsonb DEFAULT '{}' | Action-spezifische Parameter |
| result_json | jsonb | Strukturiertes Ergebnis |
| rationale | text | Armstrong-Begruendung |
| proposed_by | text DEFAULT 'armstrong' | |
| approved_by | uuid | FK auth.users(id) |
| blocked_reason | text | Bei Guardrail-Block |
| url_before | text | URL vor Step |
| url_after | text | URL nach Step |
| duration_ms | integer | Ausfuehrungsdauer |
| created_at | timestamptz DEFAULT now() | |

### 4.3 ki_browser_artifacts

| Spalte | Typ | Constraint |
|--------|-----|-----------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| session_id | uuid NOT NULL | FK ki_browser_sessions(id) ON DELETE CASCADE |
| step_id | uuid | FK ki_browser_steps(id) |
| artifact_type | text NOT NULL | 'screenshot', 'extract_text', 'extract_links', 'extract_table', 'report', 'citation_list' |
| storage_ref | text | Pfad im Private Bucket |
| content_hash | text | SHA-256 Hash fuer Integritaet |
| meta_json | jsonb DEFAULT '{}' | URL, Titel, Timestamp, content_length |
| created_at | timestamptz DEFAULT now() | |

### 4.4 ki_browser_policies

| Spalte | Typ | Constraint |
|--------|-----|-----------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| name | text NOT NULL | z.B. 'Standard Safe Mode' |
| json_rules | jsonb NOT NULL | Regelwerk (max_steps, ttl, allowed_domains, etc.) |
| is_active | boolean DEFAULT true | |
| created_by | uuid | Zone 1 Admin |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

### 4.5 ki_browser_domain_rules

| Spalte | Typ | Constraint |
|--------|-----|-----------|
| id | uuid PK | DEFAULT gen_random_uuid() |
| policy_id | uuid NOT NULL | FK ki_browser_policies(id) |
| rule_type | text NOT NULL | 'allow' oder 'deny' |
| pattern | text NOT NULL | z.B. '*.bank.de', '127.0.0.*' |
| reason | text | |
| created_at | timestamptz DEFAULT now() | |

### RLS-Policies
- Alle Tabellen: `tenant_id = get_user_tenant_id()` (Standard-Pattern)
- `ki_browser_policies` und `ki_browser_domain_rules`: SELECT fuer alle, INSERT/UPDATE/DELETE nur `platform_admin`
- Double Safety Belt: tenant_isolation_restrictive auf sessions, steps, artifacts

---

## 5. Storage

### storageManifest.ts Eintrag

```text
MOD_21: {
  module_code: 'MOD_21',
  root_name: 'KI-Browser',
  root_template_id: 'MOD_21_ROOT',
  display_order: 21,
  entity_sub_folders: [],
  required_docs: [],
  entity_fk_column: null,
  entity_table: 'ki_browser_sessions',
}
```

### Privater Bucket-Pfad
- Pattern: `{tenant_id}/MOD_21/{session_id}/{artifact_filename}`
- Bucket: `tenant-documents` (bestehend, UPLOAD_BUCKET)
- **Kein public Bucket** — Downloads nur authentifiziert ueber signed URLs

---

## 6. Ledger Events (data_event_ledger Whitelist)

| Event Type | Direction | Beschreibung |
|-----------|-----------|-------------|
| `ki_browser.session.created` | mutate | Neue Session gestartet |
| `ki_browser.session.closed` | mutate | Session geschlossen (normal/expired/cancelled) |
| `ki_browser.step.proposed` | mutate | Armstrong schlaegt Step vor |
| `ki_browser.step.approved` | mutate | User genehmigt Step |
| `ki_browser.step.rejected` | mutate | User lehnt Step ab |
| `ki_browser.step.executed` | mutate | Step ausgefuehrt |
| `ki_browser.extract.created` | mutate | Extraktion/Report erstellt |
| `ki_browser.policy.violation.blocked` | mutate | Guardrail hat blockiert |

Payload-Keys (Whitelist): `session_id`, `step_id`, `step_kind`, `risk_level`, `url`, `domain`, `blocked_reason`, `artifact_type`

**Niemals loggen**: Raw HTML, Seiteninhalt, Formularwerte, Screenshots (nur Hashes)

---

## 7. Contracts (Camunda-ready)

### 7.1 CONTRACT_KI_BROWSER_SESSION

```text
Datei: spec/current/06_api_contracts/CONTRACT_KI_BROWSER_SESSION.md

Operations:
  create_session:
    input: { requester_user_id, purpose, policy_profile_id? }
    output: { session_id, expires_at, policy_summary }
    camunda_key: ki_browser.session.create
    task_kind: service_task
    fail_states: [on_policy_missing, on_credit_insufficient, on_concurrent_limit]

  get_session_state:
    input: { session_id }
    output: { status, current_url, step_count, last_screenshot_ref, timeline[] }
    task_kind: service_task

  close_session:
    input: { session_id, reason? }
    output: { ok, summary_artifact_id? }
    camunda_key: ki_browser.session.close
    task_kind: service_task
    fail_states: [on_already_closed]

Correlation: tenant_id + session_id
```

### 7.2 CONTRACT_KI_BROWSER_STEP

```text
Datei: spec/current/06_api_contracts/CONTRACT_KI_BROWSER_STEP.md

Operations:
  propose_step:
    input: { session_id, step_kind, payload, rationale }
    output: { step_id, risk_level, requires_approval }
    camunda_key: ki_browser.step.propose
    task_kind: service_task
    fail_states: [on_session_expired, on_max_steps, on_policy_blocked]

  approve_step:
    input: { step_id, approver_user_id }
    output: { ok }
    camunda_key: ki_browser.step.approve
    task_kind: user_task

  execute_step:
    input: { step_id }
    output: { result_json, screenshot_ref?, new_url }
    camunda_key: ki_browser.step.execute
    task_kind: service_task
    fail_states: [on_timeout, on_guardrail_block, on_network_error]

  reject_step:
    input: { step_id, reason }
    output: { ok, alternative_plan? }
    camunda_key: ki_browser.step.reject
    task_kind: user_task
```

### 7.3 CONTRACT_KI_BROWSER_EXTRACT

```text
Datei: spec/current/06_api_contracts/CONTRACT_KI_BROWSER_EXTRACT.md

Operations:
  extract:
    input: { session_id, mode: 'text'|'links'|'tables', scope: 'current_page'|'selection' }
    output: { extract_id, artifacts[] }
    camunda_key: ki_browser.extract.run
    task_kind: service_task
    fail_states: [on_empty_page, on_size_limit]

  summarize:
    input: { extract_id, format: 'report'|'table'|'facts_with_citations' }
    output: { output_markdown, citations[] }
    camunda_key: ki_browser.extract.summarize
    task_kind: service_task
    fail_states: [on_no_data, on_credit_insufficient]
```

---

## 8. Hard Guardrails (Technische Implementierung)

### Step-Klassifizierung (Policy Engine)

```text
SAFE_AUTO (keine Genehmigung):
  - open_url → Domain in Allowlist ODER *.gov, *.edu, docs.*, wiki.*
  - scroll
  - screenshot
  - end_session

CONFIRM_NEEDED (User Approval Gate):
  - open_url → Domain NICHT in Allowlist
  - search → Immer (externe API)
  - click → Immer (Seiteneffekte moeglich)
  - type → Immer (ausser Suchfeld-Heuristik)
  - extract → Immer (Daten werden gespeichert)
  - summarize → Immer (Credits)

BLOCKED (technisch gesperrt, kein Override):
  - type → input[type=password|hidden], name/id contains pass|pwd|otp|token|secret|pin
  - type → Captcha-Felder
  - click → Buttons mit text/aria: delete|loeschen|remove|entfernen|bezahlen|pay|checkout|confirm_payment
  - click → input[type=file] (Upload)
  - open_url → Domain in Denylist (Banking, Crypto, Payment)
  - open_url → Lokale IPs (127.*, 10.*, 192.168.*, 169.254.*, metadata.*)
```

### Domain-Regeln (Default Policy)

```text
DENY (hart, nicht ueberschreibbar):
  - *.bank.de, *.sparkasse.de, *.volksbank.de
  - paypal.com, stripe.com, klarna.com
  - *.binance.*, *.coinbase.*, *.kraken.*
  - 127.0.0.*, 10.*, 192.168.*, 169.254.*
  - metadata.google.internal, 169.254.169.254

ALLOW (trusted docs, auto-approve):
  - docs.*, wiki.*, developer.*, api.*
  - github.com, stackoverflow.com
  - *.gov.de, *.bund.de, gesetze-im-internet.de
  - immobilienscout24.de, immowelt.de (read-only)
```

---

## 9. UI-Komponenten (Phase 1 MVP)

### Dateistruktur

```text
src/pages/portal/ki-browser/
  KiBrowserUebersicht.tsx      — Tab 1: Erklaerung + History + Quick Start
  KiBrowserSession.tsx         — Tab 2: Split Layout (Chat + Browser View)
  KiBrowserQuellen.tsx         — Tab 3: Zitat-Liste + Export
  KiBrowserVorlagen.tsx        — Tab 4: Playbook-Vorlagen
  KiBrowserPolicies.tsx        — Tab 5: Policy-Anzeige (read-only)

src/components/ki-browser/
  SessionControlBar.tsx        — Status, TTL, URL, End Session
  StepProposalCard.tsx         — Vorgeschlagener Step + Approve/Reject
  StepTimeline.tsx             — Chronologische Step-Liste
  BrowserView.tsx              — Screenshot-Anzeige (MVP: statische Bilder)
  ExtractPanel.tsx             — Text/Links/Tabellen Extraktion
  OutputComposer.tsx           — Report-Generator (Markdown)
  CitationList.tsx             — URL + Timestamp + Hash
  PlaybookCard.tsx             — Vorlagen-Karte
  PolicyBadge.tsx              — Safe Mode / No-Credential Anzeige
  GuardrailBlockedAlert.tsx    — Blockierungs-Hinweis UI
```

### Tab 2 Session Layout (MVP)

```text
+------------------------------------------------------------+
| [Status: Aktiv] [TTL: 28:45] [URL: docs.example.com] [End] |
+-----------------------------+------------------------------+
|  Armstrong Chat             |  Browser View                |
|  +-----------------------+  |  +------------------------+  |
|  | "Ich oeffne jetzt     |  |  | [Screenshot/Fetch-     |  |
|  |  docs.example.com..." |  |  |  Ergebnis als           |  |
|  +-----------------------+  |  |  Rendered Markdown]      |  |
|                             |  |                          |  |
|  Step Proposal:             |  +------------------------+  |
|  +---------------------+   |                               |
|  | EXTRACT text         |   |                               |
|  | Risk: safe_auto      |   |                               |
|  | [Approve] [Reject]   |   |                               |
|  +---------------------+   |                               |
+-----------------------------+------------------------------+
| Step Timeline (expandable cards)                            |
| [1: open_url ✅] [2: extract ✅] [3: summarize ⏳]          |
+------------------------------------------------------------+
| Extract Panel + "Bericht generieren"                        |
+------------------------------------------------------------+
```

---

## 10. Backend (Edge Function)

### Phase 1: `sot-ki-browser` Edge Function

```text
Datei: supabase/functions/sot-ki-browser/index.ts

Actions:
  create_session   → DB-Insert, Policy laden, TTL setzen
  close_session    → Status update, Cleanup
  fetch_url        → fetch() + HTML-to-text + Metadaten
  search_web       → Firecrawl/Google Search API via bestehende sot-research-engine
  extract_content  → HTML parsen, Text/Links/Tabellen extrahieren
  summarize        → Gemini Flash: Extrakte → strukturierter Report mit Zitaten
  take_screenshot  → Phase 1: N/A (nur Text). Phase 2: Browser-API Screenshot

Abhaengigkeiten:
  - sot-credit-preflight (vor metered Actions)
  - data_event_ledger (Audit)
  - tenant-documents Bucket (Artifact-Storage)
  - Lovable AI Gateway (Summarize)
```

### Phase 2 Erweiterung: Externer Browser-Dienst

```text
Neuer Secret: BROWSER_API_KEY (Browserbase/Browserless)
Neue Actions in sot-ki-browser:
  browser_open     → POST /sessions (extern)
  browser_click    → POST /sessions/{id}/actions (extern)
  browser_type     → POST /sessions/{id}/actions (extern) + Guardrail pre-check
  browser_scroll   → POST /sessions/{id}/actions (extern)
  browser_screenshot → GET /sessions/{id}/screenshot (extern) → Storage Upload
```

---

## 11. Engine Registry Eintrag

```text
| Code | Name | Typ | Modul | Status | Dateipfade | Kosten |
|------|------|-----|-------|--------|-----------|--------|
| ENG-KIBROWSER | KI-Browser Engine | Data/AI | MOD-21 | Geplant | supabase/functions/sot-ki-browser/ | 1-4 Credits/Session |
```

---

## 12. Golden Path Eintrag

```text
| ID | Modul | Prozess | Phase | Route |
|----|-------|---------|-------|-------|
| GP-BROWSER-SESSION | MOD-21 | Browser-Research-Session | planned | /portal/ki-browser/session |

Schritte:
  1. Session starten (Zweck angeben)
  2. URL oeffnen / Suche starten
  3. Ergebnisse sichten
  4. Relevante Inhalte extrahieren
  5. Bericht mit Quellen generieren
  6. Export (PDF/Markdown)
  7. Session schliessen
```

---

## 13. Zone 1 Erweiterung

### Compliance Desk: Neuer Tab "KI-Browser Oversight"

```text
Route: /admin/compliance (bestehend, interner Tab)

Funktionen:
  - Policy-Templates verwalten (CRUD auf ki_browser_policies)
  - Domain Allow/Deny Listen pflegen (ki_browser_domain_rules)
  - Retention-Einstellungen (30/90/180 Tage)
  - Session-Monitoring (aktive Sessions, Step-Logs)
  - Incident-Review (blockierte Steps, Policy-Violations)
```

---

## 14. Module Checklist (26 Punkte)

| # | Punkt | Status | Details |
|---|-------|--------|---------|
| 1 | routesManifest.ts | Geplant | MOD-21, 5 Tiles, base "ki-browser" |
| 2 | areaConfig.ts | Geplant | In 'base' Area einfuegen |
| 3 | armstrongManifest.ts | Geplant | 10 neue ARM.BROWSER.* Actions |
| 4 | goldenPathProcesses.ts | Geplant | GP-BROWSER-SESSION |
| 5 | demoDataRegistry.ts | N/A | Keine Demo-Daten (Live-Sessions) |
| 6 | storageManifest.ts | Geplant | MOD_21 Eintrag |
| 7 | recordCardManifest.ts | N/A | Kein DMS-Record-Card |
| 8 | systemWidgets.ts | N/A | Kein Dashboard-Widget (vorerst) |
| 9 | parserManifest.ts | N/A | Kein File-Parser |
| 10 | contextResolvers.ts | Geplant | KiBrowserContextResolver |
| 11 | GoldenPathGuard | Geplant | Session-Route wrappen |
| 12 | Engine (spec+engine) | Geplant | ENG-KIBROWSER als Edge Function |
| 13 | public/demo-data/ | N/A | Keine CSVs noetig |
| 14 | useDemoSeedEngine | N/A | |
| 15 | useDemoCleanup | N/A | |
| 16 | tile_catalog DB | Geplant | INSERT fuer MOD-21 Tiles |
| 17 | RLS Policies | Geplant | tenant_id Isolation + restrictive |
| 18 | ManifestRouter | Geplant | Lazy-Loading verifizieren |
| 19 | architectureValidator | Geplant | MOD-21 sync |
| 20 | spec/current/02_modules/ | Geplant | MOD-21 Spec-Dokument erstellen |
| 21 | modules_freeze.json | Geplant | MOD-21: frozen: false |
| 22 | ENGINE_REGISTRY.md | Geplant | ENG-KIBROWSER Eintrag |
| 23 | GOLDEN_PATH_REGISTRY.md | Geplant | GP-BROWSER-SESSION |
| 24 | RecordCardDMS | N/A | |
| 25 | Zone 1 Admin UI | Geplant | Compliance Desk Tab erweitern |
| 26 | TestDataManager | N/A | |

---

## 15. Implementationsplan (Iterationen)

### Iteration 1: Modul-Geruest (Tag 1-2)
- modules_freeze.json: MOD-21 eintragen (frozen: false)
- routesManifest.ts: MOD-21 Definition
- areaConfig.ts: MOD-21 in 'base'
- storageManifest.ts: MOD_21 Eintrag
- 5 leere Page-Komponenten erstellen
- tile_catalog DB-Insert
- Golden Path Context Resolver

### Iteration 2: Datenbank + Policies (Tag 2-3)
- 5 DB-Tabellen erstellen (Migration)
- RLS Policies (tenant_id + restrictive)
- Default-Policy seeden (Safe Mode)
- Default Domain-Rules seeden (Deny/Allow Listen)

### Iteration 3: Edge Function MVP (Tag 3-5)
- sot-ki-browser Edge Function: create/close session, fetch_url, extract, summarize
- Credit-Preflight Integration
- Ledger-Event Integration
- Guardrail-Engine (Step-Klassifizierung)

### Iteration 4: Armstrong Integration (Tag 5-6)
- 10 Actions in armstrongManifest.ts
- Action-Handler in sot-armstrong-advisor erweitern
- Tool-Definitionen fuer Armstrong Chat

### Iteration 5: UI (Tag 6-8)
- Tab 1 Uebersicht: Erklaerung + Session History
- Tab 2 Session: Split Layout, StepProposal, Timeline, ExtractPanel
- Tab 3 Quellen: CitationList + Export
- Tab 4 Vorlagen: Playbook-Cards
- Tab 5 Policies: Read-only Anzeige

### Iteration 6: Zone 1 + Spec (Tag 8-9)
- Compliance Desk Tab erweitern
- 3 Contract-Dokumente in spec/current/06_api_contracts/
- MOD-21 Spec in spec/current/02_modules/
- ENGINE_REGISTRY.md + GOLDEN_PATH_REGISTRY.md updaten

### Phase 2 (spaeter, nach API-Key):
- Browserbase/Browserless Anbindung
- Echte Screenshots + Navigation
- Click/Type mit Live-Feedback

---

## 16. Risiko-Zusammenfassung

| Risiko | Schwere | Mitigation |
|--------|---------|------------|
| Kein Playwright in Edge Functions | HOCH | Phase 1: fetch-basiert, Phase 2: externer Dienst |
| Kosten unkontrolliert | Mittel | Credit-Preflight + max_steps=50 + TTL=30min |
| Websites blockieren fetch() | Mittel | Fallback auf KI-Analyse des verfuegbaren Texts |
| DSGVO bei Artifact-Speicherung | Mittel | 30-Tage Retention, kein PII, nur Hashes im Ledger |
| Missbrauch (Scraping, SSRF) | Hoch | Domain-Denylist, IP-Blocking, Rate Limits, Step-Limit |
| Captcha-Seiten | Niedrig | Session pausieren, User-Hinweis, kein Auto-Solve |

