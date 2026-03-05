

# Armstrong Workspace — Vollständige Systemanalyse Zone 2

## Architektur-Übersicht (Ist-Zustand)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    ARMSTRONG WORKSPACE (Zone 2)                      │
├──────────────┬───────────────────────┬──────────────────────────────┤
│ ProjectsSidebar │    Chat Column       │     ContextPanel            │
│ ─ Projekte     │ ─ Orb (4 States)     │ ─ Aktiver Kontext           │
│ ─ Freier Chat  │ ─ SSE Streaming      │ ─ Projekt-Info              │
│ ─ CRUD         │ ─ Voice (PTT+TTS)    │ ─ EntityLinker              │
│                │ ─ Doc Upload (50MB)  │ ─ Task-Liste CRUD           │
│                │ ─ Slash-Commands     │ ─ Memory Snippets CRUD      │
│                │ ─ Data-Mode Toggle   │ ─ Dashboard Fallback        │
└──────────────┴───────────────────────┴──────────────────────────────┘
        │                   │                        │
        ▼                   ▼                        ▼
  armstrong_projects   sot-armstrong-advisor    Lokaler State
  (DB: CRUD)           (Edge: 4541 Zeilen)     (kein DB-Read)
                            │
                     ┌──────┴──────┐
                     │  LÜCKE #1   │
                     │ Kein Zugriff│
                     │ auf Project │
                     │ Memory/Tasks│
                     └─────────────┘
```

## Was funktioniert

| Feature | Status | Details |
|---------|--------|---------|
| Chat-Isolation per Projekt | ✅ Client | Map-Cache im useRef, wechselt bei Projektwechsel |
| Chat-Persistenz | ✅ Backend | `armstrong_chat_sessions` mit `project_id` FK |
| SSE Streaming | ✅ EXPLAIN+DRAFT | Token-by-Token Rendering |
| Data-Mode Toggle | ✅ Frontend→Backend | `data_mode: tenant/general` im System-Prompt |
| Project CRUD | ✅ Vollständig | Titel, Ziel, Status, linked_entities, memory, tasks |
| Memory Snippets | ✅ UI-CRUD | 4 Typen: Entscheidung, Annahme, Präferenz, Notiz |
| Task-Liste | ✅ UI-CRUD | Add, toggle done, delete |
| Entity Linker | ✅ UI | Immobilien + Kontakte verknüpfen via Combobox |
| Slash-Commands | ✅ | Kontextsensitiv nach Modul, greift auf armstrongManifest |
| Voice (STT) | ✅ | ElevenLabs Scribe + Browser-Fallback via usePushToTalk |
| Voice (TTS) | ✅ | ElevenLabs via `elevenlabs-tts` + Browser-Fallback |
| Doc Upload | ✅ | 50MB, 40+ Formate, Magic Intake Detection |
| Onboarding | ✅ | Zeigt sich bei leerem Chat ohne aktives Projekt |
| 200+ Actions | ✅ | Intent-Klassifizierung → EXPLAIN/DRAFT/ACTION |
| Orb-States | ✅ | idle/thinking/working/speaking korrekt verdrahtet |

## Kritische Lücken

### LÜCKE 1 — Armstrong hat KEIN Gedächtnis (P0)

**Das Kernproblem:** Die Edge Function `sot-armstrong-advisor` liest **niemals** die `armstrong_projects`-Tabelle. 

Das bedeutet:
- **Memory Snippets** → Armstrong weiß NICHTS von gespeicherten Entscheidungen, Annahmen, Präferenzen
- **Task-Liste** → Armstrong kennt keine offenen Aufgaben des Projekts
- **Linked Entities** → Armstrong weiß nicht, welche Immobilien/Kontakte zum Projekt gehören
- **Projekt-Ziel** → Armstrong kennt nicht mal das Projektziel

Der User sieht Memory/Tasks/Entities im ContextPanel (rechte Spalte), aber die KI hat **null Zugriff** darauf. Das `project_id` wird zwar gesendet und geloggt, aber nie genutzt um Projektdaten zu laden.

**Fix:** In `sot-armstrong-advisor/index.ts` vor dem AI-Call:
1. `armstrong_projects` laden wo `id = project_id`
2. `memory_snippets`, `task_list`, `linked_entities`, `goal` in den System-Prompt injizieren
3. Optional: Linked Entity Details (Immobilien-Adresse, Kontakt-Name) nachladen

### LÜCKE 2 — Chat-Historie geht bei Page Reload verloren (P0)

Die Chat-Isolation nutzt nur einen **In-Memory Map-Cache** (`useRef<Map>`). Bei Page-Reload sind alle Nachrichten weg.

Die Sessions werden zwar in `armstrong_chat_sessions` gespeichert, aber der Frontend-Hook **liest sie nie zurück**. Es gibt keinen `loadSessionMessages(projectId)` Call.

**Fix:** In `useArmstrongAdvisor.ts`:
1. Bei Projektwechsel: `armstrong_chat_sessions` abfragen wo `project_id = X`
2. Messages aus DB laden und in den Cache setzen
3. Beim Start: letzte Session pro Projekt laden

### LÜCKE 3 — data_mode hat keine echte Auswirkung (P1)

`data_mode` wird korrekt gesendet und erscheint im System-Prompt als Text:
```
- Datenmodus: Allgemein (kein Zugriff auf Tenant-Daten)
```

Aber die Edge Function ändert ihr Verhalten **nicht**:
- Entity-Kontext wird trotzdem geladen (egal ob `general`)
- DB-Queries für Actions laufen trotzdem
- Es gibt keine Logik `if (data_mode === 'general') skip entity loading`

**Fix:** In der Edge Function: Entity-Context-Loading und DB-Queries skippen wenn `data_mode === 'general'`.

### LÜCKE 4 — Kein Wissensabruf aus DMS/StorageX (P1)

Armstrong kann Dokumente **uploaden und parsen** (via `useArmstrongDocUpload`), aber hat **keinen proaktiven Zugriff** auf bereits gespeicherte Dokumente im DMS.

Wenn ein Nutzer fragt "Was steht in meinem Mietvertrag?", kann Armstrong:
- ❌ Nicht im DMS suchen
- ❌ Nicht auf `document_chunks` zugreifen (Embedding-Suche)
- ❌ Nicht auf `tenant-documents` Storage zugreifen

Die Infrastruktur existiert (`sot-storage-extract`, `sot-embedding-pipeline`), ist aber nicht an den Advisor angebunden.

### LÜCKE 5 — Proaktive Aufgaben-Erstellung fehlt (P2)

Armstrong kann im Chat Aufgaben vorschlagen, aber **nicht selbst** in die `task_list` des Projekts schreiben. Die Actions `ARM.MOD00.CREATE_TASK` existieren, aber sie schreiben in ein separates Widget-System, nicht in `armstrong_projects.task_list`.

## Dokumentation: Wie Armstrong heute Wissen sammelt

| Wissensquelle | Zugriff | Qualität |
|---------------|---------|----------|
| System-Prompt (statisch) | ✅ Immer | Kern-Identität, Governance, Prioritäten |
| Modul-Kontext (Route) | ✅ Immer | Aktuelles Modul + Entity-Typ |
| Entity-Daten (DB-Query) | ✅ Bei Entity aktiv | Immobilien-Details, Finance-Case, etc. |
| Conversation History | ✅ Letzte 10 Msgs | In-Session Memory, geht bei Reload verloren |
| Knowledge Base (kb_items) | ✅ Falls vorhanden | Brand-spezifisches Wissen (6 Items/Brand) |
| Projekt-Memory | ❌ FEHLT | Memory Snippets werden nie gelesen |
| Projekt-Tasks | ❌ FEHLT | Task-Liste wird nie gelesen |
| Projekt-Entities | ❌ FEHLT | Linked Entities werden nie gelesen |
| DMS/Dokumente | ❌ FEHLT | Kein Retrieval aus gespeicherten Docs |
| Persisted Sessions | ❌ FEHLT (Read) | Werden geschrieben, nie geladen |

## Implementierungsplan

### Phase 1: Armstrong Gedächtnis aktivieren (P0)

**A. Projekt-Kontext in Edge Function laden**
- Datei: `supabase/functions/sot-armstrong-advisor/index.ts`
- Neue Funktion: `loadProjectContext(supabase, projectId)`
- Lädt: `armstrong_projects` → `memory_snippets`, `task_list`, `linked_entities`, `goal`
- Injiziert als `PROJEKT-KONTEXT:` Block im System-Prompt
- Für linked_entities: Nachladen der Basis-Details (Adresse, Name) aus `properties`/`contacts`

**B. Chat-Historie aus DB laden**
- Datei: `src/hooks/useArmstrongAdvisor.ts`
- Neue Funktion: `loadPersistedSession(projectId)`
- Bei Projektwechsel: `armstrong_chat_sessions` query, Messages in Cache laden
- Initiale Welcome-Message nur wenn keine persisted Session existiert

### Phase 2: data_mode enforcing (P1)

**C. General-Mode Skip-Logic**
- Datei: `supabase/functions/sot-armstrong-advisor/index.ts`
- Wenn `data_mode === 'general'`: Entity-Context-Loading skippen, keine DB-Queries für Tenant-Daten
- System-Prompt anpassen: "Du hast in diesem Modus keinen Zugriff auf Nutzerdaten"

### Phase 3: DMS-Retrieval anbinden (P2)

**D. Embedding-basierte Dokumentensuche**
- Datei: `supabase/functions/sot-armstrong-advisor/index.ts`
- Neue Funktion: `searchDocumentChunks(supabase, tenantId, query, limit)`
- Nutzt `document_chunks` Tabelle mit Embedding-Similarity-Search
- Wird bei EXPLAIN-Intent getriggert wenn Nachricht auf Dokumente referenziert

### Betroffene Dateien

| Datei | Änderung | Phase |
|-------|----------|-------|
| `supabase/functions/sot-armstrong-advisor/index.ts` | Projekt-Kontext laden, data_mode enforcing, DMS-Retrieval | 1, 2, 3 |
| `src/hooks/useArmstrongAdvisor.ts` | Chat-Sessions aus DB laden bei Projektwechsel | 1 |

