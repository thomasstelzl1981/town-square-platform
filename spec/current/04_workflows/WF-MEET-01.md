# SPEC: Meeting Recorder Widget (WF-MEET-01)

## Zusammenfassung

Ein permanentes System-Widget im Dashboard, das physische Tisch-Meetings live transkribiert
(ohne Audio-Speicherung), nach Beendigung per KI zusammenfasst und als Aufgaben-Widget auf
das Dashboard legt. Das Ergebnis kann per E-Mail versendet oder im Kontakt-Konversationsverlauf
archiviert werden.

## Widget-Zustaende

```
idle → consent → recording → countdown (3 min) → processing → ready
```

- **idle**: CTA "Meeting starten"
- **consent**: Datenschutz-Hinweis + Checkbox + Titel-Eingabe
- **recording**: Unsichtbare Transkription, Puls-Animation, Timer
- **countdown**: Nach Stop oder 90 min, 3-Minuten-Timer mit Weiter/Stopp
- **processing**: KI-Zusammenfassung via `sot-meeting-summarize`
- **ready**: Task-Widget erstellt, Drawer oeffnbar

## Datenmodell

- `meeting_sessions` — Session-Metadaten, Status, STT-Engine
- `meeting_transcript_chunks` — Einzelne Transkript-Fragmente
- `meeting_outputs` — Summary, Action Items, Entscheidungen, Offene Punkte
- `contact_conversations` — Archivierung im Kontakt-Konversationsverlauf

## STT-Strategie

- Primary: ElevenLabs Scribe v2 Realtime (WebSocket)
- Fallback: Browser SpeechRecognition API (de-DE)
- Automatische Umschaltung bei Fehler

## Edge Functions

- `sot-meeting-summarize` — KI-Zusammenfassung via Lovable AI
- `sot-meeting-send` — E-Mail via Resend + Kontakt-Konversation

## Armstrong Action

- `ARM.MOD00.START_MEETING_RECORDER` — Triggert Meeting-Flow
