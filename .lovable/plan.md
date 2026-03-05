

# Analyse: KI-Telefonassistent — ElevenLabs vs. Twilio TwiML Dual-Path-Problem

## Befund

### Architektur-Übersicht: Es existieren ZWEI parallele Telefon-Pfade

```text
┌─────────────────────────────────────────────────────────────────────┐
│ PFAD A — Twilio TwiML (AKTIV auf allen Nummern)                    │
│                                                                     │
│  Anruf → sot-phone-inbound → <Say voice="Polly.Marlene">          │
│        → <Gather speech> → sot-phone-converse                      │
│        → Lovable AI Gateway (gemini-2.5-flash) → Text-Antwort      │
│        → <Say voice="Polly.Marlene"> (Amazon Polly TTS!)           │
│        → Loop bis Goodbye                                           │
│                                                                     │
│  Problem: Polly.Marlene = langsame, robotische Amazon-Stimme       │
│           Kein ElevenLabs involviert!                                │
│           Gather-Loop = langsam (STT→LLM→TTS pro Runde)            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PFAD B — ElevenLabs Conversational AI (KONFIGURIERT aber INAKTIV)   │
│                                                                     │
│  sot-phone-agent-sync → Erstellt ElevenLabs Agent (✅ korrekt)     │
│  → Stimme: Laura (FGY2WhTYpPnrIDTdsKH5)                            │
│  → LLM: gemini-2.5-flash                                           │
│  → ASR: ElevenLabs native                                          │
│  → Turn-based conversation                                         │
│                                                                     │
│  ABER: sot-phone-provision setzt VoiceUrl auf sot-phone-inbound    │
│  → Twilio ruft IMMER den TwiML-Pfad auf, nie ElevenLabs!           │
│  → Der ElevenLabs Agent existiert, wird aber nie angerufen          │
└─────────────────────────────────────────────────────────────────────┘
```

### Kernproblem

Die `sot-phone-provision` Edge Function (Zeile 320) setzt bei jedem Nummernkauf:
```
VoiceUrl: ${webhookBaseUrl}/sot-phone-inbound
```

Das bedeutet: **Alle eingehenden Anrufe gehen an `sot-phone-inbound`**, welches den alten Twilio `<Say>`/`<Gather>` Loop verwendet mit **Amazon Polly Marlene** (robotisch, langsam). Der ElevenLabs-Agent wird zwar via `sot-phone-agent-sync` erstellt und konfiguriert, aber **nie tatsächlich mit der Twilio-Nummer verbunden**.

Der `sot-phone-agent-sync` importiert die Nummer zwar in ElevenLabs (Schritt 2: `import_number`) und weist den Agent zu — aber Twilio ruft trotzdem `sot-phone-inbound` auf, weil die `VoiceUrl` nicht geändert wird.

### Symptome die der User beschreibt

1. **"Ganz langsame Begrüßung"** → Amazon Polly Marlene TTS ist langsam
2. **"Wiederholt sich"** → Der Gather-Loop wartet auf STT, holt LLM-Antwort, spricht sie mit Polly vor, wiederholt den Gather → jede Runde dauert 5-10s
3. **"Ein Gespräch findet nicht statt"** → Die Latenz zwischen Sprechen→Antwort ist so hoch (STT + LLM + TTS), dass der Anrufer auflegt oder der Timeout greift
4. **"CommPro-Desk lädt nicht"** → Muss geprüft werden (wahrscheinlich ein Runtime-Fehler)

### CommPro-Desk (Zone 1) Problem

Der `CommProDesk.tsx` selbst ist strukturell korrekt. Mögliche Ursachen:
- `useBrandKnowledge` Hook-Fehler (in `BrandAssistantPanel`)
- `OperativeDeskShell` Rendering-Problem
- Braucht Browser-Test zur Diagnose

---

## Lösungsplan

### Phase 1: ElevenLabs-Pfad aktivieren (Edge Functions)

**Ziel**: Wenn eine Nummer bei ElevenLabs importiert und einem Agent zugewiesen ist, soll ElevenLabs die Anrufe direkt verarbeiten — NICHT der TwiML-Pfad.

#### 1a. `sot-phone-provision` anpassen
Nach dem Nummernkauf bei Twilio soll automatisch `sot-phone-agent-sync` mit `action: 'sync'` aufgerufen werden. Wenn der Sync erfolgreich ist (Agent + Nummer bei ElevenLabs registriert), wird die Twilio-Nummer so konfiguriert, dass ElevenLabs die Anrufe erhält.

**Aber**: ElevenLabs Conversational AI übernimmt die Nummer komplett — wenn die Nummer bei ElevenLabs importiert ist und ein Agent zugewiesen ist, routet ElevenLabs den Anruf direkt. Die `VoiceUrl` bei Twilio wird dann von ElevenLabs überschrieben.

Das bedeutet: Der `sot-phone-agent-sync` macht das BEREITS richtig — das Problem ist, dass die **Reihenfolge** falsch ist:
1. `sot-phone-provision` kauft Nummer → setzt VoiceUrl auf `sot-phone-inbound`
2. User muss manuell "Sync" klicken im CommPro-Desk
3. Erst dann wird die Nummer bei ElevenLabs importiert

**Fix**: `sot-phone-provision` muss nach dem Kauf automatisch den ElevenLabs-Sync durchführen.

#### 1b. `sot-phone-inbound` als Fallback behalten
Falls ElevenLabs down ist oder die Nummer nicht importiert werden kann, soll der TwiML-Pfad als Fallback dienen — aber mit ElevenLabs TTS statt Polly:
- `<Say>` ersetzen durch `<Play>` mit Audio von `elevenlabs-tts` Edge Function
- Oder: Streaming-TTS via `<Stream>` Twilio Media Streams

#### 1c. `sot-phone-converse` verbessern (Fallback-Pfad)
Für den Fall, dass der TwiML-Pfad genutzt wird:
- ElevenLabs TTS statt Polly.Marlene verwenden
- Turbo-Modell für schnellere Antworten

### Phase 2: CommPro-Desk reparieren + Freeze

#### 2a. Browser-Test des CommPro-Desk
- Navigiere zu `/admin/commpro-desk` und prüfe auf Fehler
- Identifiziere den genauen Fehler (Hook-Fehler, Render-Fehler, etc.)

#### 2b. Freeze für CommPro-Desk einführen
Da der CommPro-Desk unter `src/pages/admin/desks/CommProDesk.tsx` und `src/components/admin/desks/commpro/*` liegt, gehört er zu Zone 1. Der Freeze muss in `infra_freeze.json` oder einer neuen Freeze-Datei für Zone 1 Desks eingetragen werden.

### Phase 3: Freeze-Eintrag

Neuer Eintrag in `infra_freeze.json`:
```json
"commpro_desk": { 
  "frozen": true, 
  "path": "src/pages/admin/desks/CommProDesk.tsx, src/components/admin/desks/commpro/*",
  "reason": "Phone system stabilization — ElevenLabs integration fix"
}
```

---

## Betroffene Dateien

| Datei | Zone | Frozen? | Aktion |
|-------|------|---------|--------|
| `supabase/functions/sot-phone-provision/index.ts` | Infra | **Ja (edge_functions)** | Auto-Sync nach Nummernkauf |
| `supabase/functions/sot-phone-inbound/index.ts` | Infra | **Ja** | ElevenLabs TTS statt Polly |
| `supabase/functions/sot-phone-converse/index.ts` | Infra | **Ja** | ElevenLabs TTS Fallback |
| `spec/current/00_frozen/infra_freeze.json` | Spec | Nein | CommPro-Desk Freeze eintragen |

**Erforderlich**: `UNFREEZE INFRA-edge_functions` um die Edge Functions zu reparieren.

---

## Zusammenfassung

Das ElevenLabs-System ist **korrekt konfiguriert** (Agent-Sync, Knowledge Store, Voice-Settings) aber **nie aktiviert** — alle Anrufe laufen über den alten Twilio TwiML-Pfad mit Amazon Polly. Die Lösung ist:
1. Auto-Sync nach Nummernkauf (ElevenLabs übernimmt Anruf-Routing)
2. TwiML-Fallback mit ElevenLabs TTS statt Polly
3. CommPro-Desk debuggen und freezing einführen

