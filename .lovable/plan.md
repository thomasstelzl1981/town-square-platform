

# Armstrong Workspace — Machbarkeitsanalyse

## Kurzbewertung

**Umsetzbarkeit: JA — zu ca. 85% mit bestehender Infrastruktur realisierbar.**

Die beschriebene Vision ist kein Neuland. Ihr habt bereits die meisten Bausteine gebaut. Was fehlt, ist hauptsaechlich die **UI-Schicht** (Workspace-Layout) und eine **Projects-Entitaet** als Datenmodell. Die KI-Orchestrierung, das Billing, die Action-Governance und die Tenant-Isolation existieren bereits produktionsreif.

---

## Was bereits existiert (Bestandsaufnahme)

| Baustein | Status | Wo |
|---|---|---|
| Action-Katalog (200+ Actions) | Produktionsreif | `armstrongManifest.ts` (4.789 Zeilen, V2) |
| Intent Classification (EXPLAIN/DRAFT/ACTION) | Produktionsreif | `sot-armstrong-advisor` (4.446 Zeilen) |
| Confirm-Gate (Plan → Preview → Confirm → Execute) | Produktionsreif | `useArmstrongAdvisor.ts` mit `PendingAction`, `CONFIRM_REQUIRED` |
| Tool Cards im Chat (SuggestedActions, ActionCard, DraftContent) | Vorhanden | `src/components/chat/ActionCard.tsx`, `SuggestedActions.tsx` |
| Credit-Preflight + Billing | Produktionsreif | `rpc_credit_preflight` in 12+ Edge Functions, `armstrong_billing_events` |
| Token-Tracking + Audit | Produktionsreif | `armstrong_action_runs` (action_code, tokens, cost, duration) |
| Chat-Persistenz | Produktionsreif | `armstrong_chat_sessions` (tenant-isoliert, RLS, 90-day retention) |
| Tenant-Isolation | Produktionsreif | RESTRICTIVE RLS auf allen Tabellen |
| Streaming (SSE) | Produktionsreif | Lovable AI Gateway, Gemini 2.5 Pro |
| Knowledge Retrieval | Produktionsreif | `armstrong_knowledge_items`, KB-Search in Advisor |
| Kontextuelle Entity-Awareness | Vorhanden | `useArmstrongContext`, Entity-Injection in Prompts |
| Voice Input | Vorhanden | `VoiceButton`, `useArmstrongVoice` |

---

## Was fehlt (Gap-Analyse)

### 1. Armstrong Projects (Neue Entitaet) — MITTLERER AUFWAND

Neue DB-Tabelle `armstrong_projects` mit:
- `id`, `user_id`, `tenant_id`, `title`, `goal`, `status`
- `linked_entities` (JSONB: property_ids, contact_ids, deal_ids)
- `memory_snippets` (JSONB: Entscheidungen, Annahmen)
- `task_list` (JSONB oder eigene Sub-Tabelle)

Plus: RLS, Seed, CRUD-Hook. Geschaetzter Aufwand: **2-3 Sprints**.

### 2. Workspace-UI (3-Spalten-Layout) — GROSSER AUFWAND

Das ist der Hauptaufwand. Aktuell ist Armstrong ein **kompakter Floating-Chat** (`ArmstrongSheet.tsx`, `ChatPanel.tsx`). Das Zielbild ist ein **Full-Page Workspace** im Dashboard.

Benoetigt:
- Linke Spalte: Project-Liste + Thread-Liste + Quick Buttons
- Mitte: Chat (vorhanden, muss nur aus dem Sheet in eine Page umziehen)
- Rechte Spalte: Kontext-Panel (Entity-Details, Quellen, Memory, letzte Actions)

Geschaetzter Aufwand: **3-4 Sprints** (UI-intensiv, aber keine neue Backend-Logik).

### 3. Slash-Command Tool Picker — KLEINER AUFWAND

`/` im Composer oeffnet eine gefilterte Action-Suche. Die Daten kommen aus `armstrongManifest.ts` (bereits strukturiert mit Modulen, Zonen, Tags). Geschaetzter Aufwand: **1 Sprint**.

### 4. Memory-System (3 Schichten) — MITTLERER AUFWAND

- **Session Memory**: Existiert (`armstrong_chat_sessions`)
- **Project Memory**: Neue Spalte/Tabelle fuer Snippets (siehe Punkt 1)
- **Knowledge Retrieval**: Existiert (`armstrong_knowledge_items`)

Was fehlt: UI zum Anzeigen/Editieren/Loeschen von Memory-Snippets. Aufwand: **1-2 Sprints**.

### 5. "Mit meinen Daten arbeiten" Toggle — KLEINER AUFWAND

Ein Boolean-Switch im Composer, der den Context-Modus steuert (General vs. Tenant-Data). Der Advisor unterstuetzt bereits beide Modi (globale Erklaerungen vs. Entity-gebundene Arbeit). Aufwand: **0.5 Sprint**.

---

## Abrechenbarkeit / Token-Messung

**Vollstaendig geloest.** Die Infrastruktur ist produktionsreif:

1. **Credit-Preflight**: Jede Action prueft VOR Ausfuehrung, ob genug Credits vorhanden sind (`rpc_credit_preflight`)
2. **Billing-Events**: Nach Ausfuehrung wird ein `armstrong_billing_events` Eintrag erzeugt (action_code, credits, org_id)
3. **Action-Runs**: Jede Ausfuehrung wird in `armstrong_action_runs` protokolliert (duration_ms, tokens, status)
4. **Credit-Topup**: Stripe-Integration existiert (`sot-credit-webhook` → `rpc_credit_topup`)
5. **Credit-Preisliste**: Jede Action im Manifest hat `credit_cost` definiert

Fuer den "General Chat"-Modus (reine Gespraeche ohne Actions) muesste ein neuer Abrechnungsmodus definiert werden — z.B. 1 Credit pro 10 Nachrichten oder ein Flat-Token-Metering. Das ist aber eine **Business-Entscheidung**, technisch trivial umsetzbar.

---

## Risiken und Einschraenkungen

| Risiko | Schwere | Mitigation |
|---|---|---|
| Token-Kosten bei langen Projekten mit viel Context | Mittel | Tool-First statt Prompt-Dump (bereits euer Prinzip) |
| UI-Komplexitaet des 3-Spalten-Layouts auf Mobile | Mittel | Responsive: Mobile = nur Chat, Kontext als Drawer |
| Langzeit-Memory vs. DSGVO/Loeschpflicht | Niedrig | Explizites Memory mit Sichtbarkeit + Loeschfunktion |
| Rate Limits bei intensiver Nutzung | Niedrig | Bereits gehandhabt (429/402 Handling in allen Edge Functions) |

---

## Empfohlene Umsetzungsreihenfolge

```text
Phase 1 (2 Sprints): Foundation
├── armstrong_projects Tabelle + CRUD
├── Dashboard-Sektion "Armstrong Workspace" (zunächst 1-Spalte: Chat only)
└── Chat aus Sheet in Page-Kontext verschieben

Phase 2 (2 Sprints): Workspace-Layout
├── 3-Spalten-Layout (Desktop)
├── Linke Spalte: Projects + Threads
└── Rechte Spalte: Kontext + Quellen

Phase 3 (2 Sprints): Intelligence
├── Slash-Command Tool Picker
├── Project Memory (Snippets, editierbar)
└── "Mit meinen Daten arbeiten" Toggle

Phase 4 (1 Sprint): Polish
├── Mobile-Responsive (Chat-only + Drawer)
├── Empty States + Onboarding
└── General-Chat Billing-Modell
```

## Fazit

Das Zielbild ist **realistisch und schrittweise umsetzbar**. Die schwerste Arbeit (Orchestrierung, Billing, Tenant-Isolation, Action-Katalog) ist bereits erledigt. Der Hauptaufwand liegt in der **UI-Transformation** vom kompakten Chat-Widget zum Full-Page Workspace. Alle Token-Kosten sind messbar und abrechenbar ueber das bestehende Credit-System.

