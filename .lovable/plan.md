
# Armstrong Sprachausgabe (TTS) — Konversationsmodus

## Befund

Armstrong hat aktuell:
- **STT (Spracheingabe):** ElevenLabs Scribe v2 Realtime — gerade implementiert
- **TTS (Sprachausgabe):** Komplett fehlend — `isSpeaking` existiert im State, wird aber nie auf `true` gesetzt

Der Nutzer spricht rein, bekommt Text zurueck, aber Armstrong "antwortet" nie per Stimme. Fuer ein echtes Gespraech fehlt die zweite Haelfte.

## Loesung: ElevenLabs TTS Edge Function + Auto-Speak bei Voice-Modus

### Architektur

```text
User spricht → ElevenLabs STT → Transcript → sot-armstrong-advisor → Text-Antwort
                                                                          ↓
                                                          elevenlabs-tts Edge Function
                                                                          ↓
                                                              Audio Blob → Browser Play
```

Wenn der Nutzer per **Voice** interagiert (nicht per Tastatur), wird die Armstrong-Antwort automatisch vorgelesen. Bei Text-Eingabe bleibt alles still.

### Schritt 1: Neue Edge Function `elevenlabs-tts`

Datei: `supabase/functions/elevenlabs-tts/index.ts`

- Empfaengt `{ text, voiceId? }` per POST
- Ruft ElevenLabs TTS API auf: `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream`
- Modell: `eleven_turbo_v2_5` (niedrige Latenz, ideal fuer Konversation)
- Stimme: `onwK4e9ZLuTAKqWW03F9` (Daniel — professionelle deutsche Maennerstimme)
- Gibt Audio-Blob (MP3) zurueck
- Nutzt den bereits vorhandenen `ELEVENLABS_API_KEY`

### Schritt 2: `useArmstrongVoice.ts` erweitern — TTS-Wiedergabe

Neue Funktion im Hook: `speakResponse(text: string)`

- Ruft die `elevenlabs-tts` Edge Function auf
- Empfaengt Audio-Blob
- Spielt per `new Audio(URL.createObjectURL(blob))` ab
- Setzt `isSpeaking: true` waehrend der Wiedergabe, `false` wenn fertig
- Bereinigt Object-URLs nach Abspielen

### Schritt 3: `ChatPanel.tsx` — Auto-Speak bei Voice-Modus

Neue Logik:
- Neuer State `voiceMode: boolean` — wird `true` wenn Nutzer per Voice eine Nachricht sendet
- Wenn `voiceMode === true` und eine neue Assistant-Nachricht eintrifft:
  - `voice.speakResponse(message.content)` aufrufen
  - Markdown-Syntax aus dem Text strippen vor TTS (kein `**`, `#`, etc.)
- Wenn Nutzer per Tastatur schreibt, bleibt `voiceMode = false`
- Voice-Transcript wird automatisch als Nachricht an den Advisor gesendet (bereits vorhanden, muss nur verbunden werden)

### Schritt 4: Voice-Transcript automatisch senden

Aktuell wird der Voice-Transcript nur angezeigt, aber **nicht automatisch** an den Advisor gesendet. Aenderung in `ChatPanel.tsx`:
- Wenn `voice.transcript` sich aendert und der Nutzer aufhoert zu sprechen (`isListening` wechselt von `true` auf `false`), wird der gesammelte Transcript als Nachricht gesendet
- Setzt `voiceMode = true` damit die Antwort vorgelesen wird

### Schritt 5: `ArmstrongContainer.tsx` — Orb-Modus Voice-Konversation

Im Orb-Modus (collapsed) soll eine Sprachkonversation moeglich sein, ohne den Panel zu oeffnen:
- Nutzer klickt Mic → STT laeuft → Transcript wird an Advisor gesendet
- Antwort kommt zurueck → TTS spielt ab → Armstrong "spricht"
- Der Orb zeigt waehrend TTS-Wiedergabe die `Volume2`-Animation (bereits im UI vorhanden, nur `isSpeaking` muss korrekt gesetzt werden)

## Dateien-Uebersicht

| Datei | Aktion |
|---|---|
| `supabase/functions/elevenlabs-tts/index.ts` | NEU — TTS Streaming Edge Function |
| `src/hooks/useArmstrongVoice.ts` | ERWEITERN — `speakResponse()` Funktion hinzufuegen |
| `src/components/chat/ChatPanel.tsx` | ERWEITERN — Auto-Speak + Auto-Send bei Voice-Modus |
| `src/components/portal/ArmstrongContainer.tsx` | ERWEITERN — Orb-Modus Voice-Konversation (Transcript → Advisor → TTS) |

## Konfiguration

- **Voice ID:** `onwK4e9ZLuTAKqWW03F9` (Daniel) — professionelle deutsche Stimme
- **Modell:** `eleven_turbo_v2_5` — optimiert fuer niedrige Latenz
- **Format:** MP3 Streaming (`/stream` Endpunkt)
- **Secret:** `ELEVENLABS_API_KEY` — bereits vorhanden

## Keine Datenbank-Aenderung noetig

Rein clientseitig + Edge Function. Keine neuen Tabellen oder RLS-Policies.
