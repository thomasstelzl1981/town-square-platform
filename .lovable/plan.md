

## Status-Übersicht: Was ist schon gebaut, was fehlt?

### Bereits funktionsfähig

| Komponente | Status | Beschreibung |
|---|---|---|
| **Nummernkauf** (`sot-phone-provision`) | ✅ Fertig | DE Local mit Bundle + Address |
| **Anruf-Empfang** (`sot-phone-inbound`) | ⚠️ Nur Anrufbeantworter | Begrüßung per TwiML `<Say>` → `<Record>` (Voicemail) |
| **Post-Call** (`sot-phone-postcall`) | ✅ Fertig | LLM-Zusammenfassung, Action Items, Armstrong-Email (Zone 2) |
| **UI-Konfiguration** (`KiTelefonPage`) | ✅ Fertig | Stimme, Begrüßung, Regeln, Dokumentation |
| **Admin-Email (Zone 1)** | ❌ Fehlt | Kein Benachrichtigungs-Email an den Admin |

### Wer geht ans Telefon? — Aktueller Stand

Aktuell funktioniert das System als **intelligenter Anrufbeantworter**: Twilio spielt eine TTS-Begrüßung ab (Amazon Polly.Marlene), dann wird eine Voicemail aufgenommen. Danach erstellt die KI eine Zusammenfassung und sendet sie per E-Mail an die Armstrong-Adresse des Nutzers.

Es gibt **kein echtes KI-Gespräch** — der Anrufer kann nicht mit der KI interagieren.

### Die drei Ausbaustufen

```text
┌─────────────────────────────────────────────────────────┐
│ Stufe 1: Anrufbeantworter (AKTUELL)                     │
│ Twilio <Say> → <Record> → LLM-Summary → Email          │
│ Anrufer spricht auf Band, KI fasst zusammen             │
├─────────────────────────────────────────────────────────┤
│ Stufe 2: Twilio <Gather> + LLM Loop (NÄCHSTER SCHRITT)  │
│ Anrufer spricht → Speech-to-Text → LLM antwortet       │
│ → TTS spricht zurück → Loop bis Gespräch beendet        │
│ Latenz: ~3-5 Sek pro Antwort, aber funktional           │
├─────────────────────────────────────────────────────────┤
│ Stufe 3: ElevenLabs Conversational AI (PREMIUM/ZUKUNFT) │
│ Twilio <Stream> → WebSocket → ElevenLabs Agent          │
│ Echtzeit-Konversation, <1s Latenz, natürliche Stimme    │
└─────────────────────────────────────────────────────────┘
```

### Vorgeschlagener Plan — 3 Aufgaben

**1. Admin-Email (Zone 1) im Postcall ergänzen**

In `sot-phone-postcall/index.ts`: Nach der Armstrong-Email (Zone 2) eine zweite E-Mail an eine Admin-Adresse senden. Quelle: aus der `commpro_phone_assistants`-Tabelle das Feld `brand_key` lesen → falls vorhanden, Admin-Empfänger aus einer Konfig-Tabelle oder Konstante ziehen. Für User-Assistenten (Zone 2) geht die Admin-Kopie an eine zentrale Adresse (z.B. `info@systemofatown.com`).

**2. Stufe 2 implementieren: Echtes KI-Gespräch via Gather-Loop**

In `sot-phone-inbound/index.ts` den aktuellen `<Record>`-Ansatz durch einen `<Gather input="speech">` Loop ersetzen:

- Anrufer spricht → Twilio transkribiert per STT
- Transkript wird an neue Edge Function `sot-phone-converse` gesendet
- LLM generiert Antwort basierend auf `behavior_prompt` und Gesprächskontext
- TwiML `<Say>` spricht die Antwort → neuer `<Gather>` für nächste Runde
- Loop endet nach Stille, "Tschüss"-Erkennung, oder Max-Dauer
- Am Ende → `sot-phone-postcall` für Summary + Email

Konfiguration erfolgt komplett über die bestehende UI (Begrüßung, Regeln, Verhaltensprompt).

**3. Gesprächskontext-Speicher**

Neue Hilfstabelle oder JSON-Feld in `commpro_phone_call_sessions` für den laufenden Gesprächsverlauf (turns), damit der LLM bei jedem Gather-Callback den bisherigen Dialog kennt.

### Technische Details

**Gather-Loop Architektur:**
```text
Anrufer ruft an
  → sot-phone-inbound: TwiML <Say> Begrüßung + <Gather input="speech">
    → Twilio STT transkribiert
    → POST an sot-phone-converse mit SpeechResult + CallSid
      → Lade Gesprächsverlauf aus DB
      → LLM (gemini-2.5-flash) generiert Antwort
      → Speichere Turn in DB
      → Return TwiML: <Say> Antwort + <Gather> (nächste Runde)
    → Bei Stille/Timeout: <Say> Verabschiedung + <Hangup>
  → Twilio ruft StatusCallback → sot-phone-postcall
    → Summary + Armstrong-Email + Admin-Email
```

**Keine neuen Secrets nötig** — nutzt bestehenden Lovable AI Gateway.

**Keine UI-Änderungen nötig** — die vorhandenen Felder (Begrüßung, Verhaltensprompt, Regeln, Max-Dauer) steuern das Verhalten bereits.

