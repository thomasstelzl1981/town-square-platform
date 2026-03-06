

# Armstrong Workspace (MOD-00) — Komplett-Audit & Dokumentation

## Architektur-Übersicht

Der Armstrong Workspace ist ein 3-Spalten Command Center mit projektbasierter Chat-Isolation, SSE-Streaming, Voice I/O, Dokumentenanalyse und einem Action-Katalog mit 60+ registrierten Aktionen.

```text
┌──────────────┬──────────────────────────────┬──────────────┐
│ Projects     │        Chat Column           │   Context    │
│ Sidebar      │                              │   Panel      │
│              │  ┌────────────────────────┐   │              │
│ • Projekt A  │  │  WorkspaceChatHeader   │   │ Aktiver      │
│ • Projekt B  │  ├────────────────────────┤   │ Kontext      │
│ • Neuer Chat │  │                        │   │ (Modul,      │
│              │  │  Messages + Onboarding │   │  Entity)     │
│              │  │  + ArmstrongOrb        │   │              │
│              │  │  + MessageRenderer     │   │ Projekt-     │
│              │  │  + ActionCard          │   │ Info         │
│              │  │  + DraftBox            │   │              │
│              │  │  + EmailDraftBox       │   │ Entity       │
│              │  │  + ResultBox           │   │ Linker       │
│              │  │  + BlockedBox          │   │              │
│              │  │                        │   │ Aufgaben     │
│              │  ├────────────────────────┤   │ (CRUD)       │
│              │  │  ChipBar (Quick Acts)  │   │              │
│              │  ├────────────────────────┤   │ Memory       │
│              │  │  ChatInput + / Picker  │   │ Snippets     │
│              │  │  + Doc Upload + Voice  │   │ (CRUD)       │
│              │  └────────────────────────┘   │              │
└──────────────┴──────────────────────────────┴──────────────┘
```

---

## 1. Fähigkeiten-Matrix

### KI-Chat (EXPLAIN Intent)
| Funktion | Status | Verdrahtung |
|----------|--------|-------------|
| Freitext-Chat (Deutsch) | **Funktional** | Lovable AI Gateway → Gemini 2.5 Pro, SSE-Streaming |
| Konversationsgedächtnis | **Funktional** | Letzte 10 Nachrichten im Prompt, DB-Persistenz via `armstrong_chat_sessions` |
| Knowledge Base Retrieval | **Funktional** | ILIKE-Suche in `armstrong_knowledge_items`, Modul-Kategorie-Fallback |
| DMS Document Search (RAG) | **Funktional** | ILIKE-Suche in `document_chunks` bei Dokument-Keywords, On-Demand Deep-Upgrade |
| Entity-Awareness | **Funktional** | Lädt Property/Mandate/Finance-Case Daten aus DB in Prompt |
| Projekt-Memory | **Funktional** | `memory_snippets`, `task_list`, `linked_entities` fließen in System-Prompt |
| Datenmodus-Toggle | **Funktional** | `useMyData` Toggle: Tenant-Daten vs. General Knowledge |
| Global Assist (alle Module) | **Funktional** | EXPLAIN/DRAFT Intents in ALLEN 20 Modulen erlaubt |

### Dokument-Upload & Analyse
| Funktion | Status | Verdrahtung |
|----------|--------|-------------|
| Upload (40+ Formate, 50MB) | **Funktional** | Storage → `sot-document-parser` → Text-Extraktion |
| PDF-Analyse | **Funktional** | Gemini 2.5 Pro Vision |
| XLSX/CSV-Parsing | **Funktional** | SheetJS (deterministic, 0 Credits) |
| Bild-Analyse (JPG/PNG) | **Funktional** | Gemini Vision |
| Audio-Transkription | **Funktional** | Unterstützte Formate: MP3, WAV, M4A, OGG |
| Magic Intake (Auto-Detect) | **Funktional** | `detectDocumentIntent()` erkennt Dokumenttyp → schlägt passende Aktion vor |

### Magic Intake Actions (Dokument → Datensatz)
| Action | Modul | Status |
|--------|-------|--------|
| Immobilie aus Dokument | MOD-04 | **Implementiert** |
| Finanzierungsfall anlegen | MOD-11 | **Implementiert** |
| Finanzdaten erfassen | MOD-18 | **Implementiert** |
| Fahrzeug anlegen | MOD-17 | **Implementiert** |
| Akquise-Mandat anlegen | MOD-12 | **Implementiert** |
| PV-Anlage anlegen | MOD-19 | **Implementiert** |
| Selbstauskunft befüllen | MOD-07 | **Implementiert** |
| Mietvertrag anlegen | MOD-20 | **Implementiert** |
| Suchmandat anlegen | MOD-08 | **Implementiert** |
| Kontakt/Stammdaten anlegen | MOD-01 | **Implementiert** |
| Verkaufsinserat anlegen | MOD-06 | **Implementiert** |
| Partnerprofil anlegen | MOD-09 | **Implementiert** |

### Text-/Draft-Erstellung (DRAFT Intent)
| Funktion | Status | Verdrahtung |
|----------|--------|-------------|
| Brief/E-Mail/Text erstellen | **Funktional** | AI Gateway → Gemini 2.5 Pro, SSE-Streaming |
| E-Mail-Entwurf (compose) | **Funktional** | `ARM.GLOBAL.COMPOSE_EMAIL` → JSON-Output mit To/Subject/Body |
| E-Mail-Versand | **Funktional** | `ARM.GLOBAL.SEND_COMPOSED_EMAIL` → `sot-system-mail-send` |
| Draft-Copy (Clipboard) | **Funktional** | DraftBox mit Copy-Button |

### Voice I/O
| Funktion | Status | Verdrahtung |
|----------|--------|-------------|
| Push-to-Talk STT | **Funktional** | ElevenLabs Scribe primary, Browser SpeechRecognition fallback |
| TTS (Vorlesen) | **Funktional** | `elevenlabs-tts` Edge Function → Audio Blob, Browser fallback |
| Markdown-Cleaning vor TTS | **Funktional** | Strips `#`, `**`, backticks, links etc. |

### Action-Katalog (/ Slash Commands)
| Funktion | Status | Verdrahtung |
|----------|--------|-------------|
| Slash-Command Picker | **Funktional** | `SlashCommandPicker` → `armstrongManifest.ts` |
| Keyboard Navigation | **Funktional** | ↑↓ Enter Esc |
| Kontextsensitive Filterung | **Funktional** | Modul-spezifische Actions first, dann Global |
| Confirm-Gate (Bestätigung) | **Funktional** | `ActionCard` mit Bestätigen/Abbrechen |
| Risiko/Kosten-Anzeige | **Funktional** | Badge mit Execution-Mode + Cost-Hint |

### Projekt-Management
| Funktion | Status | Verdrahtung |
|----------|--------|-------------|
| Projekte CRUD | **Funktional** | `useArmstrongProjects` → `armstrong_projects` Tabelle |
| Chat-Isolation pro Projekt | **Funktional** | `project_id` Filter, In-Memory Cache + DB-Persistenz |
| Memory Snippets CRUD | **Funktional** | ContextPanel: Entscheidung/Annahme/Präferenz/Notiz |
| Task-List CRUD | **Funktional** | ContextPanel: Checkbox + Add/Delete |
| Entity Linker | **Funktional** | EntityLinker: Immobilien, Kontakte, Deals verknüpfen |
| Session Restore | **Funktional** | `loadPersistedSession()` aus `armstrong_chat_sessions` |

### Modulspezifische Readonly-Actions
| Action | Modul | Status |
|--------|-------|--------|
| Vollständigkeit prüfen | MOD-04 | **Implementiert** (DB-Query, Score-Berechnung) |
| KPIs berechnen | MOD-04 | **Implementiert** (Rendite, Cashflow aus Leases) |
| Datenqualität prüfen | MOD-04 | **Implementiert** (Validierungsregeln) |
| Selbstauskunft erklären | MOD-07 | **Implementiert** (statische Checkliste) |
| Dokument-Checkliste | MOD-07 | **Implementiert** (statische Checkliste) |
| Investment-Simulation | MOD-08 | **Implementiert** (Parametrische Berechnung) |
| Favorit analysieren | MOD-08 | **Implementiert** (Scoring) |
| Bauträgerprojekt anlegen | MOD-13 | **Implementiert** (delegiert an `sot-project-intake`) |
| Rechercheauftrag | MOD-14 | **Implementiert** (delegiert an `sot-research-engine`) |
| DMS Storage Extraction | MOD-03 | **Implementiert** (delegiert an `sot-storage-extractor`) |

---

## 2. Was Armstrong NICHT kann (Grenzen)

| Funktion | Status | Grund |
|----------|--------|-------|
| **Bilder generieren** | **Nicht implementiert** | Kein Image-Generation-Model angebunden. Edge Function nutzt nur `google/gemini-2.5-pro` (Text). Kein `gemini-2.5-flash-image` oder `gemini-3-pro-image-preview` Call. |
| **PDF-Erzeugung direkt** | **Nicht implementiert** | Armstrong kann Texte/Briefe als DRAFT erstellen, aber die PDF-Generierung läuft über die separaten `pdfCiKit`/`letterPdf` Pipelines in den jeweiligen Modulen (MOD-02 Briefgenerator, MOD-18 Finanzreport etc.). Armstrong verweist darauf, erzeugt aber selbst keine PDFs. |
| **Web-Recherche (Live Internet)** | **Teilweise** | `ARM.GLOBAL.WEB_RESEARCH` ist als Action registriert und im `MVP_EXECUTABLE_ACTIONS` Array, aber die `executeAction` Switch-Case hat **keinen** Handler dafür — fällt auf `default: "not implemented"`. **BUG.** |
| **Briefe erstellen (DIN 5008 PDF)** | **Nur Draft** | Armstrong kann Brief-Text als Markdown-Draft erstellen, aber die eigentliche DIN-5008-PDF-Generierung liegt in MOD-02 (`letterPdf.ts`). Kein direkter PDF-Export aus dem Chat. |

---

## 3. Gefundene Bugs / Verbesserungspotenzial

### BUG 1: Web-Recherche Action nicht implementiert (HIGH)
**Datei:** `supabase/functions/sot-armstrong-advisor/index.ts`
**Problem:** `ARM.GLOBAL.WEB_RESEARCH` ist in `MVP_EXECUTABLE_ACTIONS` (Zeile 538), aber der `executeAction` Switch-Case (ab Zeile 1531) hat keinen `case "ARM.GLOBAL.WEB_RESEARCH"`. Es fällt auf `default: "Action not implemented"`.

**Fix:** Einen Handler hinzufügen, der `sot-research-ai-assist` oder eine Perplexity/Firecrawl-Integration aufruft.

### BUG 2: DMS Storage Extraction Action nicht implementiert (MEDIUM)
**Problem:** `ARM.DMS.STORAGE_EXTRACTION` ist in `MVP_EXECUTABLE_ACTIONS` (Zeile 546), aber ebenfalls kein Switch-Case-Handler.

**Fix:** Handler hinzufügen, der `sot-storage-extractor` mit `action: 'bulk-scan'` aufruft.

### BUG 3: MOD-13 Phase Change und Summary Actions fehlen (LOW)
**Problem:** `ARM.MOD13.PHASE_CHANGE` und `ARM.MOD13.PROJECT_SUMMARY` sind im Welcome-Config (Zeile 217-218), aber nicht in `MVP_ACTIONS` registriert und haben keine Handler.

### Verbesserungsvorschlag 1: Bildgenerierung integrieren
Das Lovable AI Gateway unterstützt `google/gemini-2.5-flash-image` und `google/gemini-3-pro-image-preview`. Ein neuer Action-Code `ARM.GLOBAL.GENERATE_IMAGE` könnte diese Modelle nutzen.

### Verbesserungsvorschlag 2: PDF-Export aus Chat
Armstrong könnte einen "Brief als PDF exportieren" Button in der DraftBox anbieten, der den Draft-Content an die bestehende `letterPdf.ts` Pipeline weiterleitet.

---

## 4. Sicherheits- & Isolierungsstatus

| Aspekt | Status |
|--------|--------|
| Zone-2-Isolation | **OK** — Context erkennt Zone per Route, Z2 hat Tenant-Scope |
| Tenant-Isolation (RLS) | **OK** — Alle DB-Queries filtern nach `tenant_id` / `user_id` |
| Zone-3-Personas getrennt | **OK** — Eigene System-Prompts pro Website |
| Data-Mode Toggle | **OK** — `general` Mode unterdrückt Entity/DMS/Tenant-Laden |
| Confirm-Gate für Schreibaktionen | **OK** — `execute_with_confirmation` → ActionCard |
| Action-Logging | **OK** — `armstrong_action_runs` Tabelle mit Audit-Trail |
| Session-Persistenz | **OK** — `armstrong_chat_sessions` mit `project_id`-Isolation |
| Kein Cross-Zone Leak | **OK** — Z3 Armstrong hat keinen Zugriff auf Tenant-Daten |

---

## 5. Zusammenfassung: Was Armstrong heute kann

1. **Freier KI-Chat** in allen 20 Modulen (SSE-Streaming, Gemini 2.5 Pro)
2. **Dokumente analysieren** (40+ Formate, 50MB, Vision für PDFs/Bilder)
3. **Magic Intake** — 12 Dokumenttypen → automatisch Datensätze anlegen
4. **Texte/Briefe/E-Mails entwerfen** (Draft-Modus mit Copy/Send)
5. **E-Mails senden** über `sot-system-mail-send`
6. **KPIs berechnen** für Immobilien (Rendite, Cashflow)
7. **Datenqualität prüfen** für Properties
8. **Investment-Simulationen** durchführen
9. **Projekte verwalten** mit Memory, Tasks, Entity-Links
10. **Voice I/O** (Push-to-Talk STT + ElevenLabs TTS)
11. **Slash-Command Katalog** mit 60+ kontextsensitiven Aktionen
12. **DMS durchsuchen** (RAG über `document_chunks`)
13. **Knowledge Base** durchsuchen (`armstrong_knowledge_items`)
14. **Bauträgerprojekte** aus Dokumenten anlegen (MOD-13)
15. **Rechercheaufträge** erstellen (MOD-14)

**Nicht funktional:** Web-Recherche (Bug), Bildgenerierung (nicht angebunden), PDF-Export direkt aus Chat (nicht implementiert).

---

## 6. Empfohlene nächste Schritte

1. **Web-Recherche Bug fixen** — Handler für `ARM.GLOBAL.WEB_RESEARCH` in der Edge Function implementieren
2. **Bildgenerierung hinzufügen** — `gemini-3-pro-image-preview` Model anbinden
3. **PDF-Export aus Draft** — DraftBox mit "Als PDF exportieren" Button erweitern
4. **DMS Storage Extraction Handler** — Bulk-Scan Action implementieren

