

# Analyse: Speichern, Sync und Stimmenauswahl im CommPro Desk

## Deine Fragen beantwortet

### 1. "Speichert das automatisch?"
Ja. Der `useBrandPhoneAssistant`-Hook hat einen **Auto-Save mit 500ms Debounce**. Jede Änderung (Slider, Preset-Auswahl etc.) wird automatisch in die Datenbank geschrieben. Du siehst oben rechts kurz "Speichern..." und dann "Gespeichert". Es gibt absichtlich keinen manuellen Speichern-Button.

### 2. "Muss man danach synchronisieren?"
Ja. Auto-Save speichert nur in die **Datenbank**. Damit ElevenLabs die neuen Einstellungen übernimmt, muss danach "Agent synchronisieren" oder "Alle synchronisieren" geklickt werden. Das ist by design zweistufig: erst alles in Ruhe konfigurieren, dann einmal synchronisieren.

### 3. "Wie kriegen wir die Stimmenauswahl hin?"
Die `VoiceSettingsCard` zeigt aktuell nur 6 Presets (Warm, Klar, etc.) und 3 Slider, aber **keine echte ElevenLabs-Stimmenauswahl** (Voice ID). Der "Voice Provider" Dropdown steht auf "Connect folgt...". Das ist der fehlende Baustein.

## Plan: Echte ElevenLabs-Stimmenauswahl einbauen

Da die `VoiceSettingsCard` in MOD-14 (frozen) liegt, erstelle ich eine **Zone-1-eigene Variante** in `src/components/admin/desks/commpro/`.

### Was gebaut wird

1. **`BrandVoiceCard.tsx`** (neue Datei in `src/components/admin/desks/commpro/`)
   - Dropdown mit den wichtigsten ElevenLabs-Stimmen (deutsche + internationale Top-Stimmen)
   - Die bestehenden Presets und Slider bleiben erhalten
   - Zusätzlich: Feld für `elevenlabs_voice_id` das bei Sync an ElevenLabs übergeben wird
   - Hinweis "Nach Änderung bitte synchronisieren" als visueller Reminder

2. **`BrandAssistantPanel.tsx`** anpassen
   - `VoiceSettingsCard` (frozen MOD-14 import) ersetzen durch die neue `BrandVoiceCard`

3. **DB-Feld prüfen**
   - Sicherstellen, dass `commpro_phone_assistants` ein Feld für die Voice-ID hat (oder im `voice_settings` JSON-Objekt speichern)

4. **Edge Function `sot-phone-agent-sync`** anpassen
   - Voice-ID aus der Config auslesen und beim Sync an ElevenLabs als `voice.voice_id` übergeben

### Stimmen-Auswahl (vorgeschlagen)

| Name | ID | Charakter |
|------|-----|-----------|
| Roger | CwhRBWXzGAHq8TQ4Fs17 | Professionell, männlich |
| Sarah | EXAVITQu4vr4xnSDxMaL | Freundlich, weiblich |
| Laura | FGY2WhTYpPnrIDTdsKH5 | Warm, weiblich |
| George | JBFqnCBsd6RMkjVDRZzb | Seriös, männlich |
| Callum | N2lVS1w4EtoT3dr4eOWO | Ruhig, männlich |
| Alice | Xb7hH8MSUJpSbSDYk0k2 | Klar, weiblich |
| Daniel | onwK4e9ZLuTAKqWW03F9 | Deutsch-optimiert, männlich |

### Nicht geändert
- `VoiceSettingsCard.tsx` (MOD-14 frozen, bleibt unberührt)
- Auto-Save-Logik (funktioniert korrekt, bleibt wie ist)
- Sync-Button-Logik (zweistufiger Prozess bleibt)

