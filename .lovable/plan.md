

# SPEC: Meeting Recorder Widget (WF-MEET-01)

## Zusammenfassung

Ein permanentes System-Widget im Dashboard, das physische Tisch-Meetings live transkribiert (ohne Audio-Speicherung), nach Beendigung per KI zusammenfasst und als Aufgaben-Widget auf das Dashboard legt. Das Ergebnis kann per E-Mail versendet oder im Kontakt-Konversationsverlauf archiviert werden.

---

## Widget-Verhalten (Zustaende)

```text
+-------+     Klick      +----------+     Mikrofon     +-----------+
| idle  | ------------->  | consent  | --------------> | recording |
+-------+                 +----------+                  +-----------+
                                                            |
                                              Stop / 90min Auto-Stop
                                                            |
                                                     +------------+
                                                     | countdown  |  (3 Min Timer)
                                                     +------------+
                                                      /          \
                                            Weitermachen        Stopp
                                                /                  \
                                        +-----------+        +------------+
                                        | recording |        | processing |
                                        +-----------+        +------------+
                                                                   |
                                                              KI-Summary
                                                                   |
                                                              +---------+
                                                              |  ready  |
                                                              +---------+
                                                                   |
                                                          Task-Widget erstellt
```

### Zustandslogik

- **idle**: Kachel zeigt "Meeting Recorder" + CTA "Meeting starten"
- **consent**: Datenschutz-Hinweis: "Es wird kein Audio gespeichert, nur Text. Alle Teilnehmer muessen einverstanden sein." Checkbox + Bestaetigen
- **recording**: Unsichtbare Transkription im Hintergrund. Kachel zeigt Puls-Animation + Laufzeit-Timer. Kein sichtbarer Transkript-Ticker (laeuft unsichtbar)
- **countdown**: Nach Stop oder nach 90 Minuten erscheint ein 3-Minuten-Countdown mit zwei Buttons: "Weitermachen" (zurueck zu recording) oder "Endgueltig stoppen" (weiter zu processing)
- **processing**: Spinner + "Zusammenfassung wird erstellt..."
- **ready**: Hinweis "Protokoll erstellt" + neues Task-Widget erscheint im Dashboard-Grid

### 90-Minuten-Limit

- Nach 90 Minuten wird automatisch der Countdown-Zustand ausgeloest (nicht sofortiger Stopp)
- Der Countdown laeuft 3 Minuten. Danach wird automatisch gestoppt

---

## Datenmodell (3 neue Tabellen)

### `meeting_sessions`

| Spalte | Typ | Default | Beschreibung |
|--------|-----|---------|-------------|
| id | uuid | gen_random_uuid() | PK |
| tenant_id | uuid | FK tenants | Mandant |
| user_id | uuid | auth.uid() | Ersteller |
| title | text | 'Meeting' | Titel (editierbar) |
| started_at | timestamptz | | Startzeit |
| ended_at | timestamptz | | Endzeit |
| consent_confirmed | boolean | false | Einwilligung |
| status | text | 'idle' | idle, recording, processing, ready, sent, archived |
| stt_engine_used | text | | elevenlabs, browser, hybrid |
| total_duration_sec | integer | | Gesamtdauer in Sekunden |
| created_at | timestamptz | now() | |

RLS: tenant_id = auth.jwt()->tenant_id, user_id = auth.uid()
Realtime: JA

### `meeting_transcript_chunks`

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid | PK |
| session_id | uuid FK | Gehoert zu Session |
| seq | integer | Reihenfolge |
| text | text | Transkript-Text |
| engine_source | text | elevenlabs oder browser |
| created_at | timestamptz | |

RLS: via session_id -> meeting_sessions.tenant_id
Realtime: NEIN (nur intern genutzt)

### `meeting_outputs`

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid | PK |
| session_id | uuid FK | Gehoert zu Session |
| summary_md | text | Zusammenfassung (Markdown) |
| action_items_json | jsonb | Aufgabenliste |
| decisions_json | jsonb | Entscheidungen |
| open_questions_json | jsonb | Offene Punkte |
| created_at | timestamptz | |

RLS: via session_id -> meeting_sessions.tenant_id

---

## Ergebnis-Workflow: Task-Widget + Drawer

### Nach Abschluss der KI-Zusammenfassung:

1. System erstellt einen Eintrag in `task_widgets` mit type `meeting_protocol`, verknuepft ueber `parameters.session_id`
2. Widget erscheint via Realtime im Dashboard-Grid (existierender useTaskWidgets-Mechanismus)
3. Klick auf das Widget oeffnet einen **Drawer** mit:
   - Zusammenfassung (Markdown)
   - Aufgabenliste
   - Entscheidungen
   - Offene Punkte
4. Im Drawer: zwei Aktionen:
   - **"Transkript speichern"**: Archiviert die Session (status -> archived)
   - **"Per E-Mail senden"**: Oeffnet Empfaenger-Auswahl

### Empfaenger-Auswahl:

- Kontakt-Autocomplete aus `contacts`-Tabelle (Suche nach Name, E-Mail)
- ODER freie E-Mail-Eingabe
- CC/BCC optional
- Button: "Senden"

### Bei Versand an Kontakt aus Kontaktbuch:

- E-Mail wird ueber bestehende Resend-Integration gesendet
- Zusaetzlich: Eintrag in `contact_conversations` (neue Tabelle oder bestehende `acq_outbound_messages` erweitern)
- Thread-Eintrag: type = "meeting_summary", verknuepft mit session_id
- Sichtbar im Kontaktprofil unter Kommunikationsverlauf

---

## STT-Strategie (unveraendert)

Nutzt den bestehenden `ElevenLabsScribeConnection` aus `useArmstrongVoice.ts`:
- **Primary**: ElevenLabs Scribe v2 Realtime (WebSocket, VAD, de)
- **Fallback**: Browser SpeechRecognition API (de-DE)
- Automatische Umschaltung bei Fehler
- `engine_source` pro Chunk gespeichert
- `stt_engine_used` auf Session-Ebene (elevenlabs | browser | hybrid)

Fuer lange Sessions (bis 90 Min): ElevenLabs-Token muss ggf. erneuert werden (Token-Lifetime ~15 Min). Der Hook wird erweitert um automatische Token-Renewal.

---

## Backend-Funktionen (2 neue Edge Functions)

### `sot-meeting-summarize`

- Input: `{ session_id }`
- Laedt alle Transcript-Chunks der Session
- Sendet an Lovable AI (google/gemini-2.5-flash) mit strukturiertem Prompt
- Extrahiert: summary_md, action_items_json, decisions_json, open_questions_json
- Speichert in `meeting_outputs`
- Erstellt Task-Widget in `task_widgets` (type: meeting_protocol)
- Aktualisiert Session-Status auf `ready`

### `sot-meeting-send`

- Input: `{ session_id, recipients: [{ type: 'contact' | 'email', id?, email? }] }`
- Rendert Summary als E-Mail (Resend)
- Wenn contact_id: erstellt Eintrag im Kommunikationsverlauf
- Aktualisiert Session-Status auf `sent`

---

## Armstrong-Integration

### Neue Action im Manifest

```text
ARM.MOD00.START_MEETING_RECORDER
- execution_mode: execute
- cost_model: metered (1 Credit pro Meeting)
- Triggert den Meeting-Flow
```

### Armstrong-Verhalten

Armstrong begleitet den Flow nicht als Voice-Overlay, sondern das Widget selbst steuert den gesamten Prozess. Armstrong kann auf Nachfrage ("Starte ein Meeting") das Widget aktivieren.

---

## Widget-Typ Erweiterung

### `src/types/widget.ts`

- Neuer SystemWidgetType: `system_meeting_recorder`
- Neuer TaskWidgetType: `meeting_protocol` (fuer das Ergebnis-Widget)
- Neues WIDGET_CONFIG fuer beide

### `src/hooks/useWidgetPreferences.ts`

- Neuer Code: `SYS.MEET.RECORDER` in der Widget-Praeferenz-Liste

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `spec/current/04_workflows/WF-MEET-01.md` | **Neu** — SPEC-Datei |
| `src/types/widget.ts` | `system_meeting_recorder` + `meeting_protocol` Typen |
| `src/components/dashboard/MeetingRecorderWidget.tsx` | **Neu** — System-Widget mit State-Machine |
| `src/components/dashboard/MeetingCountdownOverlay.tsx` | **Neu** — 3-Min-Countdown UI |
| `src/components/dashboard/MeetingResultDrawer.tsx` | **Neu** — Ergebnis-Drawer |
| `src/hooks/useMeetingRecorder.ts` | **Neu** — Session-Lifecycle + STT-Steuerung |
| `src/pages/portal/PortalDashboard.tsx` | Widget-Rendering + Code-Mapping |
| `src/manifests/armstrongManifest.ts` | Neue Action `ARM.MOD00.START_MEETING_RECORDER` |
| `supabase/functions/sot-meeting-summarize/index.ts` | **Neu** — KI-Zusammenfassung |
| `supabase/functions/sot-meeting-send/index.ts` | **Neu** — E-Mail + Kontakt-Konversation |
| `supabase/config.toml` | 2 neue Functions |
| Migration SQL | 3 neue Tabellen + RLS + Realtime |

---

## Reihenfolge der Implementierung

1. SPEC-Datei erstellen (`spec/current/04_workflows/WF-MEET-01.md`)
2. Datenbank-Migration (3 Tabellen + RLS)
3. Widget-Typen erweitern (`widget.ts`)
4. `useMeetingRecorder` Hook
5. `MeetingRecorderWidget` + `MeetingCountdownOverlay`
6. `MeetingResultDrawer`
7. Dashboard-Integration (`PortalDashboard.tsx`)
8. Edge Functions (`sot-meeting-summarize`, `sot-meeting-send`)
9. Armstrong Action im Manifest

