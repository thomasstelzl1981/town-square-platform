
# Armstrong Workspace — Umsetzungsplan

## Ausgangslage

Das Dashboard (`PortalDashboard.tsx`) hat aktuell **2 Snap-Sektionen**:
- **Sektion 1**: "WELCOME ON BOARD" — System-Widget-Grid (Wetter, Globe, Finance, Radio, PV, etc.) via `DashboardGrid` + `SortableWidget`
- **Sektion 2**: "ARMSTRONG" — NotesWidget + TaskWidgets (Armstrong-generierte Aufgaben-Kacheln)

**Ziel**: Sektion 1 bleibt unverändert. Sektion 2 wird zum **Armstrong Workspace** — ein ChatGPT-artiger Full-Page Chat mit 3-Spalten-Layout (Desktop) bzw. Chat-only (Mobile).

---

## Architektur-Übersicht

```
Sektion 2 (Armstrong Workspace)
├── Desktop (≥768px): 3-Spalten-Layout
│   ├── Links (280px): ProjectsSidebar
│   │   ├── "Neues Projekt" Button
│   │   ├── Projects-Liste (armstrong_projects)
│   │   ├── Threads-Liste (armstrong_chat_sessions)
│   │   └── Quick Actions (Recherche, Notiz, Aufgabe)
│   ├── Mitte (flex-1): WorkspaceChat
│   │   ├── Chat-Verlauf (MessageRenderer, bestehend)
│   │   ├── Tool Cards (ActionCard, SuggestedActions, bestehend)
│   │   ├── "Mit meinen Daten arbeiten" Toggle
│   │   └── Composer (Input + Attachments + Voice + Slash-Commands)
│   └── Rechts (320px): ContextPanel
│       ├── Aktiver Kontext (Projekt/Entity)
│       ├── Quellen-Liste (DMS-Links, Datensätze)
│       ├── Letzte Actions (Status, Credits)
│       └── Memory-Snippets (editierbar)
├── Mobile (<768px): Chat-only
│   └── WorkspaceChat (full-width)
│   └── Context als Drawer (optional)
```

---

## Phase 1: Foundation (DB + Basis-UI)

### 1.1 DB-Tabelle `armstrong_projects`
```sql
CREATE TABLE armstrong_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Neues Projekt',
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, archived, completed
  linked_entities JSONB DEFAULT '[]',    -- [{type, id, label}]
  memory_snippets JSONB DEFAULT '[]',    -- [{key, value, created_at}]
  task_list JSONB DEFAULT '[]',          -- [{id, text, done, created_at}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: User kann nur eigene Projekte im eigenen Tenant sehen
ALTER TABLE armstrong_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own projects"
  ON armstrong_projects FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Updated-at Trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON armstrong_projects
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

### 1.2 CRUD-Hook: `useArmstrongProjects`
- Pfad: `src/hooks/useArmstrongProjects.ts`
- Funktionen: `useProjects()`, `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`
- Basiert auf `@tanstack/react-query` + Supabase SDK
- Kein frozen module betroffen (Hook liegt in `/hooks/`)

### 1.3 Workspace-Chat-Komponente (Mittel-Spalte)
- Pfad: `src/components/dashboard/workspace/WorkspaceChat.tsx`
- **Extrahiert Chat-Logik aus bestehendem `ChatPanel.tsx`** (Wiederverwendung, kein Duplikat)
- Nutzt bestehende Hooks: `useArmstrongAdvisor`, `useArmstrongVoice`, `useArmstrongDocUpload`
- Nutzt bestehende Renderer: `MessageRenderer`, `ActionCard`, `SuggestedActions`
- **Unterschied zu ChatPanel**: Kein Floating/Sheet, sondern eingebettete Full-Height-Komponente
- Kein eigener Advisor-Hook, sondern Props-basierte Komposition

### 1.4 Dashboard Sektion 2 Umbau
- In `PortalDashboard.tsx` Sektion 2: TaskWidget-Grid ersetzen durch `ArmstrongWorkspace`
- Bestehende TaskWidgets bleiben erreichbar (verschoben in Kontext-Panel oder als Tool Cards)
- NotesWidget wird Teil des Kontext-Panels (rechts)

**Deliverables Phase 1:**
- [x] `armstrong_projects` Tabelle mit RLS
- [x] `useArmstrongProjects` Hook
- [x] `WorkspaceChat` Komponente (Chat in Sektion 2, 1-Spalte zunächst)
- [x] Dashboard Sektion 2 zeigt Chat statt Widget-Grid

---

## Phase 2: 3-Spalten-Layout + Projects

### 2.1 Layout-Wrapper: `ArmstrongWorkspace`
- Pfad: `src/components/dashboard/workspace/ArmstrongWorkspace.tsx`
- Desktop: `grid grid-cols-[280px_1fr_320px]`
- Mobile: Nur `WorkspaceChat` (full-width)
- Verwendet `react-resizable-panels` (bereits installiert) für resize

### 2.2 Linke Spalte: `ProjectsSidebar`
- Pfad: `src/components/dashboard/workspace/ProjectsSidebar.tsx`
- Zeigt: Projects-Liste, Chat-Threads, Quick-Action-Buttons
- Datenquelle: `useArmstrongProjects` + bestehende `armstrong_chat_sessions`
- "Neues Projekt" → Dialog mit Titel + Ziel
- Projekt anklicken → setzt aktiven Kontext im Workspace

### 2.3 Rechte Spalte: `ContextPanel`
- Pfad: `src/components/dashboard/workspace/ContextPanel.tsx`
- Zeigt: Aktiver Kontext, Quellen, letzte Actions, Memory-Snippets
- Datenquelle: `armstrong_action_runs` (letzte Runs) + Projekt-Memory
- Deep-Links zu Entitäten (Immobilien, Kontakte, DMS)

### 2.4 Chat-Sessions mit Projekt-Verknüpfung
- `armstrong_chat_sessions` bekommt optionale Spalte `project_id` (nullable FK)
- Migration: `ALTER TABLE armstrong_chat_sessions ADD COLUMN project_id UUID REFERENCES armstrong_projects(id) ON DELETE SET NULL;`

**Deliverables Phase 2:**
- [x] `ArmstrongWorkspace` 3-Spalten-Layout
- [x] `ProjectsSidebar` mit Projects + Threads
- [x] `ContextPanel` mit Quellen + Actions + Memory
- [x] `project_id` FK auf Chat-Sessions

---

## Phase 3: Intelligence (Slash-Commands, Memory, Data-Toggle)

### 3.1 Slash-Command Tool Picker
- Pfad: `src/components/dashboard/workspace/SlashCommandPicker.tsx`
- Trigger: `/` im Composer öffnet Popover
- Datenquelle: `armstrongManifest.ts` (bereits strukturiert)
- Filter: Kontext-basiert (aktives Modul), Freitext-Suche
- Auswahl → Action-Code wird an Advisor übergeben

### 3.2 Project Memory UI
- Im `ContextPanel` (rechts): Memory-Snippets anzeigen/editieren/löschen
- CRUD direkt auf `armstrong_projects.memory_snippets` (JSONB)
- Armstrong kann per Action Memory-Snippets hinzufügen (Tool Card)

### 3.3 "Mit meinen Daten arbeiten" Toggle
- Boolean-Switch im Composer-Bereich
- Steuert `context_mode: 'general' | 'tenant'` im Advisor-Request
- Default im Portal: `tenant` (ON)
- General-Modus: Kein Entity-Injection, keine DB-Reads, nur LLM-Chat

### 3.4 General-Chat Billing
- Neuer Action-Code: `ARM.CHAT.GENERAL` (1 Credit pro Nachricht oder konfigurierbar)
- Credit-Preflight auch für General Chat
- Logging in `armstrong_action_runs` mit `action_code = 'ARM.CHAT.GENERAL'`

**Deliverables Phase 3:**
- [x] Slash-Command Picker
- [x] Memory-Snippets UI (CRUD)
- [x] Data-Toggle im Composer
- [x] General-Chat Billing-Code

---

## Phase 4: Polish + Mobile

### 4.1 Mobile-Responsive
- Mobile: Nur `WorkspaceChat` sichtbar
- Projects-Sidebar als Sheet/Drawer (Hamburger-Icon)
- Context-Panel als Bottom-Sheet (Swipe-up oder Button)

### 4.2 Empty States
- Kein Projekt: "Erstelle dein erstes Projekt" + Beispiele
- Kein Chat: Armstrong-Begrüßung + Quick-Actions
- Keine Actions: "Tippe `/` um Tools zu entdecken"

### 4.3 Onboarding
- Erstes Öffnen: Kurze Tour (3 Steps) per Tooltip-Overlay
- "Was kann Armstrong?" → Link zu `/portal/armstrong` (Capability Center)

### 4.4 TaskWidgets Migration
- Bestehende TaskWidgets werden zu Tool Cards im Chat
- ODER: Verbleiben als Widget-Row über dem Chat (konfigurierbar)
- NotesWidget → Rechte Spalte oder eigenes Project-Feature

**Deliverables Phase 4:**
- [x] Mobile Drawers für Sidebar + Context
- [x] Empty States für alle 3 Spalten
- [x] Onboarding-Tour
- [x] TaskWidget → Tool Card Migration

---

## Datei-Übersicht (Neue Dateien)

```
src/components/dashboard/workspace/
├── ArmstrongWorkspace.tsx      ← Layout-Container (3-Spalten)
├── WorkspaceChat.tsx           ← Chat-Spalte (Mitte)
├── ProjectsSidebar.tsx         ← Projects + Threads (Links)
├── ContextPanel.tsx            ← Quellen + Memory (Rechts)
├── SlashCommandPicker.tsx      ← Tool-Picker Popover
├── WorkspaceComposer.tsx       ← Input + Toggle + Attachments
└── ProjectMemoryEditor.tsx     ← Memory-Snippets CRUD

src/hooks/
├── useArmstrongProjects.ts     ← CRUD für armstrong_projects
└── (bestehend: useArmstrongAdvisor, useArmstrongVoice, etc.)
```

## Betroffene bestehende Dateien

| Datei | Änderung |
|---|---|
| `src/pages/portal/PortalDashboard.tsx` | Sektion 2: TaskGrid → `<ArmstrongWorkspace />` |
| `src/components/chat/ChatPanel.tsx` | Bleibt bestehen für ArmstrongSheet (Floating), wird nicht dupliziert |
| `src/components/portal/ArmstrongSheet.tsx` | Bleibt bestehen für kontextuelle Quick-Chats außerhalb Dashboard |

## Nicht betroffen (Freeze-sicher)

- Alle Module MOD-01 bis MOD-22 bleiben unverändert
- `armstrongManifest.ts` wird nur gelesen, nicht geschrieben
- Edge Functions bleiben unverändert
- Sektion 1 (System-Widgets) wird nicht angefasst

## Token-Abrechnung

Vollständig abgedeckt durch bestehendes System:
- **Action-basierte Chats**: `armstrong_action_runs` + `armstrong_billing_events` (bestehend)
- **General Chat**: Neuer Code `ARM.CHAT.GENERAL` mit konfigurierbarem Credit-Cost
- **Credit-Preflight**: Prüfung VOR jeder Nachricht/Action (bestehend)
- **Audit**: Jeder Vorgang in `armstrong_action_runs` protokolliert (bestehend)
