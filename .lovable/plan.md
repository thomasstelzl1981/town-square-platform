

## Maximale Qualitaet: ElevenLabs Conversational AI Agent

### Das Problem mit dem aktuellen Ansatz

Der aktuelle Flow hat systembedingte Latenz, die nicht wegoptimiert werden kann:

```text
Aktuell (Polly): ~4-6 Sekunden pro Antwort
User spricht → Twilio STT (~2s) → HTTP an Edge Function → Gemini LLM (~1-2s) → Polly TTS (inline) → Antwort
                    ↑                    ↑                       ↑
              Gather wartet auf      HTTP Round-Trip        Warten auf
              Stille (3s timeout)    nach Supabase          vollstaendige
                                                            Antwort
```

Jeder Schritt ist ein separater HTTP-Request. Das fuehlt sich wie ein Anrufbeantworter an, nicht wie ein Gespraech.

### Die Loesung: ElevenLabs Conversational AI + Twilio Native Integration

ElevenLabs bietet eine **direkte Twilio-Integration** an. Dabei wird die Twilio-Nummer in ElevenLabs importiert, und ElevenLabs uebernimmt den gesamten Call-Flow in einem einzigen WebSocket-Loop:

```text
Ziel: ~0.5-1 Sekunde Latenz
User spricht → ElevenLabs (STT + LLM + TTS in einem Stream) → Antwort
                              ↑
                    Alles in einem persistenten
                    WebSocket, kein HTTP-Overhead,
                    Streaming TTS (Antwort beginnt
                    waehrend LLM noch generiert)
```

### Was sich aendert

| Aspekt | Aktuell | Neu |
|---|---|---|
| STT | Twilio Gather (Google) | ElevenLabs Scribe |
| LLM | Gemini via Edge Function | ElevenLabs-internes LLM oder Gemini via Tool |
| TTS | Amazon Polly (robotisch) | ElevenLabs (natuerliche Stimme) |
| Latenz | ~4-6 Sekunden | ~0.5-1 Sekunde |
| Architektur | 3 Edge Functions (inbound → converse → postcall) | ElevenLabs Agent + 1 Webhook Edge Function |

### Umsetzungsplan

**1. ElevenLabs Agent erstellen (via API)**

Eine neue Edge Function `sot-phone-agent-sync` synchronisiert die Assistenten-Konfiguration aus unserer DB in einen ElevenLabs Agent:
- `behavior_prompt` → Agent System Prompt
- `first_message` → Agent First Message
- `documentation.knowledge_base` → Agent Knowledge Base
- `voice_settings` → ElevenLabs Voice Config
- Speichert die `elevenlabs_agent_id` zurueck in `commpro_phone_assistants`

**2. Twilio-Nummer in ElevenLabs importieren (via API)**

Gleiche Edge Function oder separater Aufruf:
- Nutzt `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` (bereits konfiguriert)
- Importiert `+498941433040` in ElevenLabs
- ElevenLabs konfiguriert automatisch den Twilio-Webhook um

**3. Post-Call Webhook**

ElevenLabs sendet nach jedem Gespraech einen Webhook mit dem kompletten Transkript. Eine neue (oder angepasste) Edge Function empfaengt das:
- Erstellt/aktualisiert die Call-Session in unserer DB
- Generiert Summary + Action Items (wie bisher)
- Sendet Email-Benachrichtigung (wie bisher)

**4. DB-Migration**

Neue Spalten in `commpro_phone_assistants`:
- `elevenlabs_agent_id` (text, nullable) — ElevenLabs Agent ID
- `elevenlabs_phone_number_id` (text, nullable) — ElevenLabs Phone Number ID

**5. Zone-1-UI: Agent-Konfiguration**

Ein "Sync"-Button auf der Ncore-Seite, der die Konfiguration an ElevenLabs pusht. Aenderungen an Prompt, Wissensbasis oder Stimme werden sofort synchronisiert.

### Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/sot-phone-agent-sync/index.ts` | **NEU** — Synchronisiert Assistant-Config → ElevenLabs Agent |
| `supabase/functions/sot-phone-postcall/index.ts` | Anpassen fuer ElevenLabs Webhook-Format (statt Twilio-Format) |
| DB-Migration | `elevenlabs_agent_id` + `elevenlabs_phone_number_id` Spalten |
| `sot-phone-inbound` + `sot-phone-converse` | Werden nicht mehr genutzt (ElevenLabs uebernimmt), bleiben aber als Fallback |

### Voraussetzungen

- `ELEVENLABS_API_KEY` ist bereits konfiguriert
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` sind bereits konfiguriert
- `UNFREEZE INFRA-edge_functions` fuer die Edge Function Aenderungen

### Zusammenfassung

Statt 3 Edge Functions mit HTTP-Ping-Pong uebernimmt ElevenLabs den gesamten Call-Flow. Unsere Infrastruktur reduziert sich auf: Konfiguration synchronisieren (Push) und Post-Call-Daten empfangen (Webhook). Das Ergebnis ist eine natuerliche Stimme mit Sub-Sekunden-Latenz.

