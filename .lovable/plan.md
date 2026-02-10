

# Aktualisierter Plan: Spracheingabe mit ElevenLabs + Komplettreparatur

## Aenderung gegenueber vorherigem Plan

Statt Option A (Browser Speech API) wird jetzt **direkt ElevenLabs** implementiert, da ein API-Key vorhanden ist. Die Browser Speech API bleibt als Fallback erhalten.

## Schritt 1: ElevenLabs API-Key als Secret speichern

- `ELEVENLABS_API_KEY` muss als neues Secret hinterlegt werden (aktuell nicht vorhanden)
- Danach steht der Key fuer Edge Functions zur Verfuegung

## Schritt 2: Edge Function fuer ElevenLabs STT Token

Neue Edge Function `elevenlabs-scribe-token`:
- Generiert Single-Use-Tokens fuer Realtime-Transkription
- Ruft `https://api.elevenlabs.io/v1/single-use-token/realtime_scribe` auf
- Schuetzt den API-Key serverseitig

## Schritt 3: `useArmstrongVoice.ts` komplett umschreiben

Der kaputte WebSocket-Code (430 Zeilen) wird ersetzt durch:

1. **Primaer:** ElevenLabs `useScribe` Hook (Realtime STT via `@elevenlabs/react` SDK)
   - Modell: `scribe_v2_realtime`
   - Commit-Strategie: VAD (automatische Spracherkennung)
   - Token wird von der Edge Function geholt
2. **Fallback:** Browser `SpeechRecognition` API (aus `useArmstrongVoiceBrowser.ts`)
3. Die Hook-Signatur bleibt identisch — alle 3 Consumer (`ArmstrongContainer`, `ChatPanel`, `ComposeEmailDialog`) funktionieren ohne Aenderung

Transkribierter Text wird an den bestehenden `sot-armstrong-advisor` gesendet (Text-basiert).

## Schritt 4: Wiederverwendbare `DictationButton`-Komponente

Neue Datei `src/components/shared/DictationButton.tsx`:
- Kapselt Voice-Logik (ElevenLabs primaer, Browser-Fallback)
- Props: `onTranscript(text)` Callback
- Nutzt den existierenden `VoiceButton` fuer die UI

Einbau in alle relevanten Freitext-Felder (Prioritaet HOCH zuerst):

| Komponente | Feld |
|---|---|
| `CampaignWizard.tsx` | Kampagnen-Nachricht |
| `ClaimCreateDialog.tsx` | Schadensbeschreibung |
| `ServiceCaseCreateDialog.tsx` | Kurzbeschreibung |
| `ScopeDefinitionPanel.tsx` | Sanierungsumfang |
| `TenderDraftPanel.tsx` | Zusaetzliche Hinweise |
| `DeliveryTab.tsx` | Praesentationsnotizen |
| `KontakteTab.tsx` | Kontakt-Notizen |
| `KundenTab.tsx` | Kunden-Notizen |
| `MietyPortalPage.tsx` | WhatsApp/E-Mail/Uebersetzer |

## Schritt 5: Acquiary Quicklink im Dashboard

`src/pages/admin/Dashboard.tsx` — Button "Acquiary" im Zone-3-Websites-Grid nach Future Room einfuegen.

## Schritt 6: Dokumentation in Integrations-Seite

`src/pages/admin/Integrations.tsx` — Neue Sektion "Spracheingabe (Voice)":
- Aktiver Modus: ElevenLabs Scribe v2 Realtime
- Fallback: Browser Speech API
- Tabelle aller Felder mit Voice-Integration und Status

## Technische Details

### Neue Abhaengigkeit
- `@elevenlabs/react` (npm install)

### Neue Dateien
| Datei | Beschreibung |
|---|---|
| `supabase/functions/elevenlabs-scribe-token/index.ts` | Token-Generierung |
| `src/components/shared/DictationButton.tsx` | Wiederverwendbare Diktat-Komponente |

### Geaenderte Dateien
| Datei | Aenderung |
|---|---|
| `src/hooks/useArmstrongVoice.ts` | Komplett umschreiben: ElevenLabs + Browser-Fallback |
| `src/pages/admin/Dashboard.tsx` | Acquiary-Quicklink hinzufuegen |
| `src/pages/admin/Integrations.tsx` | Voice-Dokumentationssektion |
| 9+ Textarea-Komponenten | DictationButton einbauen |

### Kein Datenbank-Aenderung noetig
Rein clientseitig + Edge Function. Keine neuen Tabellen oder RLS-Policies.

