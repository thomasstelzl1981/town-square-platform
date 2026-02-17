

# Fehleranalyse: Armstrong Spracheingabe — Mikrofonzugriff verweigert

## Diagnose

### Kernproblem: Verlorener User-Gesture-Kontext

Browser erfordern, dass `navigator.mediaDevices.getUserMedia()` direkt aus einer Nutzeraktion (Klick) heraus aufgerufen wird. Im aktuellen Code passiert Folgendes:

```text
Button-Klick (User Gesture)
  -> toggleVoice()
    -> startListening()
      -> startElevenLabs()
        -> supabase.functions.invoke('elevenlabs-scribe-token')  // Netzwerk-Request
        -> ... wartet auf Antwort ...                             // Gesture-Kontext VERLOREN
        -> scribe.connect(token)
          -> navigator.mediaDevices.getUserMedia()                // VERWEIGERT
```

Zwischen dem Klick und dem `getUserMedia`-Aufruf liegt ein asynchroner Netzwerk-Request (Token-Abruf). Dadurch geht der "User Gesture"-Kontext verloren — der Browser blockiert den Mikrofonzugriff mit "Permission denied". Safari ist hier besonders strikt, aber auch Chrome auf HTTPS kann betroffen sein.

### Browser-Fallback ebenfalls betroffen

Wenn ElevenLabs fehlschlaegt, wird `startBrowser()` aufgerufen — aber zu diesem Zeitpunkt ist der Gesture-Kontext bereits verloren. Die Browser SpeechRecognition API benoetigt ebenfalls eine aktive User Gesture.

### ElevenLabs-Infrastruktur: OK

- `ELEVENLABS_API_KEY` ist konfiguriert
- `elevenlabs-scribe-token` Edge Function liefert erfolgreich Tokens zurueck (getestet, Status 200)
- `elevenlabs-tts` Edge Function ist korrekt implementiert
- WebSocket-URL und Konfiguration sind korrekt

---

## Loesung

### Strategie: Mikrofon SOFORT bei Klick anfordern, Token PARALLEL laden

Der `getUserMedia`-Aufruf wird direkt beim Button-Klick ausgefuehrt — noch bevor der Token-Request startet. Der Microphone-Stream wird zwischengespeichert und spaeter an die ElevenLabs-WebSocket-Verbindung uebergeben.

### Aenderungen in `src/hooks/useArmstrongVoice.ts`

1. **`startListening()` neu strukturieren:**
   - Schritt 1 (sofort im Gesture-Kontext): `navigator.mediaDevices.getUserMedia()` ausfuehren und Stream speichern
   - Schritt 2 (async, parallel moeglich): Token von `elevenlabs-scribe-token` abrufen
   - Schritt 3: Stream + Token an `ElevenLabsScribeConnection` uebergeben

2. **`ElevenLabsScribeConnection.connect()` refactoren:**
   - Neuen Parameter `stream: MediaStream` akzeptieren statt `getUserMedia` selbst aufzurufen
   - Der Stream wird von aussen uebergeben (bereits genehmigt)

3. **`startBrowser()` ebenfalls anpassen:**
   - Akzeptiert optional einen bereits vorhandenen MediaStream
   - Falls ElevenLabs fehlschlaegt und der Stream schon existiert, wird er fuer den Browser-Fallback wiederverwendet
   - Browser SpeechRecognition braucht den Stream zwar nicht direkt, aber die Mikrofonberechtigung ist durch den vorherigen `getUserMedia`-Aufruf bereits erteilt

4. **Fehlerbehandlung verbessern:**
   - Wenn `getUserMedia` fehlschlaegt: Klare Fehlermeldung "Bitte Mikrofonzugriff in den Browser-Einstellungen erlauben"
   - Wenn Token-Abruf fehlschlaegt aber Mikrofon OK: Automatischer Fallback auf Browser-STT mit bereits erteilter Berechtigung

### Pseudocode der neuen Logik

```text
startListening():
  1. stream = await getUserMedia({ audio: ... })     // SOFORT im Gesture
  2. try:
       token = await fetchScribeToken()              // Async, Gesture egal
       scribe.connect(token, stream)                 // Stream uebergeben
     catch:
       startBrowser()                                // Berechtigung existiert bereits
```

### Keine weiteren Dateien betroffen

- `VoiceButton.tsx`: Keine Aenderung noetig (ruft nur `onToggle` auf)
- `ArmstrongContainer.tsx`: Keine Aenderung noetig
- Edge Functions: Keine Aenderung noetig (funktionieren korrekt)
- `ChatPanel.tsx`, `MobileBottomBar.tsx`: Keine Aenderung noetig

