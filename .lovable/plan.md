

# Plan: Armstrong Voice-System -- Browser-TTS Fallback

## Ziel
ElevenLabs-TTS durch kostenlose Browser `speechSynthesis` API ersetzen, damit Armstrong sofort wieder sprechen kann -- ohne Credits, ohne Kosten. ElevenLabs bleibt als Premium-Option erhalten fuer spaeter.

## Was sich aendert

### 1. `src/hooks/useArmstrongVoice.ts` -- TTS Fallback einbauen

Die `speakResponse()`-Funktion bekommt eine Fallback-Kette:
1. Versuche ElevenLabs TTS (wenn Credits vorhanden)
2. Bei Fehler (502, quota_exceeded): automatisch Browser `speechSynthesis` nutzen
3. Browser-TTS spricht Deutsch (`de-DE`) mit der besten verfuegbaren Stimme

Konkret:
- Neue Hilfsfunktion `speakWithBrowser(text)` die `window.speechSynthesis.speak()` nutzt
- `speakResponse()` faengt ElevenLabs-Fehler ab und faellt auf Browser zurueck
- Kein manueller Wechsel noetig -- passiert automatisch

### 2. Sprachausgabe nur auf Wunsch (nicht automatisch)

Aktuell wird jede Armstrong-Antwort automatisch vorgelesen wenn Voice aktiv ist. Das aendern wir:
- `voice.speakResponse()` wird NUR aufgerufen wenn der User aktiv im Voice-Modus ist (Mikrofon war an)
- Neuer optionaler "Vorlesen"-Button neben Armstrong-Antworten (kleines Lautsprecher-Icon)
- So spricht Armstrong nicht mehr unerwartet los

Dateien: `ChatPanel.tsx`, `ArmstrongContainer.tsx`, `MobileHomeChatView.tsx`, `KaufyArmstrongWidget.tsx`

### 3. Keine neuen Abhaengigkeiten

- `window.speechSynthesis` ist eine Standard Web API (Chrome, Safari, Firefox, Edge)
- Deutsche Stimmen sind auf allen Plattformen verfuegbar
- Kein npm-Paket noetig

## Technische Details

### Browser speechSynthesis Implementation

```text
function speakWithBrowser(text: string):
  1. window.speechSynthesis.cancel() -- laufende Ausgabe stoppen
  2. utterance = new SpeechSynthesisUtterance(text)
  3. utterance.lang = 'de-DE'
  4. utterance.rate = 1.0
  5. utterance.pitch = 1.0
  6. Beste deutsche Stimme waehlen aus getVoices()
  7. utterance.onend -> setState isSpeaking = false
  8. window.speechSynthesis.speak(utterance)
```

### Fallback-Logik in speakResponse

```text
async speakResponse(text):
  1. Text bereinigen (Markdown entfernen)
  2. Versuche ElevenLabs fetch()
  3. Wenn response.ok -> Audio abspielen (wie bisher)
  4. Wenn Fehler (502, 401, quota) -> speakWithBrowser(text)
  5. setState isSpeaking entsprechend setzen
```

### Dateien die geaendert werden

| Datei | Aenderung |
|---|---|
| `src/hooks/useArmstrongVoice.ts` | Browser-TTS Fallback in `speakResponse()`, neue `speakWithBrowser()` Funktion |
| `src/components/chat/ChatPanel.tsx` | `speakResponse` nur bei aktivem Voice-Modus aufrufen |
| `src/components/portal/ArmstrongContainer.tsx` | Gleiche Anpassung |
| `src/components/portal/MobileHomeChatView.tsx` | Gleiche Anpassung |
| `src/components/zone3/kaufy2026/KaufyArmstrongWidget.tsx` | Gleiche Anpassung |

### Was NICHT geaendert wird
- Edge Function `elevenlabs-tts` bleibt bestehen (fuer spaeter wenn Credits aufgeladen)
- Edge Function `elevenlabs-scribe-token` bleibt bestehen
- Spracheingabe (STT) bleibt Browser-basiert (funktioniert bereits)
- Keine Datenbank-Aenderungen
- Keine neuen Abhaengigkeiten

## Ergebnis

- Armstrong kann sofort wieder sprechen -- kostenlos
- Stimme klingt etwas roboterhaft, aber funktional fuer die Beta-Phase
- Wenn ElevenLabs-Credits aufgeladen werden, wechselt das System automatisch zurueck zur Premium-Stimme
- Armstrong spricht nur noch wenn gewuenscht, nicht mehr unkontrolliert
