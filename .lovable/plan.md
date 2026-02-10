

# Armstrong Voice-Integration reparieren und aktivieren

## Was ist das Problem?

**Zone 3 (Kaufy-Website):** Das Chat-Widget hat aktuell nur Text-Eingabe. Es gibt keinen Mikrofon-Button und keine Sprachausgabe -- Voice wurde beim Einbau schlicht nicht integriert.

**Zone 2 (Portal):** Voice ist technisch eingebaut, aber nie getestet worden (keine Logs). Die Grundstruktur funktioniert, muss aber verifiziert werden.

---

## Was wird gebaut?

### 1. Voice in Zone 3 Kaufy-Widget einbauen

Die `KaufyArmstrongWidget.tsx` bekommt:

- **Mikrofon-Button** neben dem Send-Button (reuse `VoiceButton` Komponente)
- **`useArmstrongVoice` Hook** Integration (identisch wie Portal)
- **Auto-Send:** Wenn der Nutzer aufhoert zu sprechen (VAD oder Browser-Erkennung), wird der erkannte Text automatisch als Nachricht gesendet
- **Auto-TTS:** Jede Armstrong-Antwort wird automatisch vorgelesen (via `speakResponse`)
- **Stop-Button:** Waehrend Armstrong spricht, kann der Nutzer die Ausgabe stoppen

```text
+-------------------------------------------+
| [Input-Feld............]  [Mic]  [Send]   |
+-------------------------------------------+
```

Wenn Armstrong antwortet und Voice aktiv ist:
- Antwort wird gestreamt UND nach Abschluss vorgelesen
- Waehrend des Vorlesens erscheint ein kleines Lautsprecher-Icon mit Pulse-Animation

### 2. Edge Functions verifizieren und testen

Beide Edge Functions (`elevenlabs-scribe-token` und `elevenlabs-tts`) existieren und haben den API-Key. Sie muessen einmal live getestet werden, um sicherzustellen, dass sie korrekt deployed sind und antworten.

### 3. Browser-Fallback sichtbar machen

Falls ElevenLabs nicht verfuegbar ist (Token-Fehler, Rate-Limit), faellt der Hook automatisch auf die Browser Speech API zurueck. Im Kaufy-Widget wird das durch einen kleinen orangenen Punkt am Mikrofon-Icon angezeigt (wie bereits im `VoiceButton` implementiert).

---

## Technische Aenderungen

### Datei 1: `src/components/zone3/kaufy2026/KaufyArmstrongWidget.tsx`

**Aenderungen:**
- Import `useArmstrongVoice` und `VoiceButton` hinzufuegen
- Hook im Component-Body aufrufen
- Auto-Send Logik: Wenn `voice.transcript` sich aendert und `voice.isListening` false wird, Text als Nachricht senden
- Auto-TTS Logik: Nach Stream-Ende `voice.speakResponse(assistantContent)` aufrufen
- VoiceButton neben Send-Button im Input-Bereich einbauen
- Visueller Indikator wenn Armstrong spricht (Pulse am Avatar)

### Datei 2: Keine weiteren Dateien noetig

Alle anderen Komponenten (`VoiceButton`, `useArmstrongVoice`, Edge Functions) existieren bereits und sind korrekt implementiert.

---

## Verhalten nach der Aenderung

**Nutzer oeffnet Kaufy-Website:**
1. Armstrong begruesst (Text, wie bisher)
2. Nutzer klickt Mikrofon-Button -> Mikrofon aktiviert (ElevenLabs oder Browser-Fallback)
3. Nutzer spricht -> Live-Transkript erscheint im Input-Feld
4. Nutzer hoert auf -> Text wird automatisch als Nachricht gesendet
5. Armstrong antwortet (Streaming-Text) -> Nach Abschluss wird Antwort vorgelesen
6. Nutzer kann jederzeit Sprachausgabe stoppen

**Fuer Zone 2 Portal:** Keine Aenderung noetig -- funktioniert bereits, muss nur getestet werden.

---

## Implementierungsreihenfolge

1. Voice-Integration in `KaufyArmstrongWidget.tsx` einbauen
2. Edge Functions `elevenlabs-scribe-token` und `elevenlabs-tts` live testen
3. End-to-End Test: Kaufy oeffnen, Mikrofon klicken, sprechen, Antwort hoeren

