

# Armstrong Chatbot Redesign — Compact, Minimalist, Lovable-Style

## Ziel

Der Armstrong Chatbot wird von einem riesigen Bottom-Sheet/Panel zu einem kompakten, modernen Floating-Widget umgebaut. Inspiriert vom Lovable-Editor-Chat: klein, minimalistisch, mit lebendiger Arbeitsanimation.

## Aktuelle Probleme

- **Zu gross**: 70-80vh Bottom-Sheet oder volle Seitenleiste
- **Zu viel Text/Labels**: Header, Context-Badge, Upload-Zone, ChipBar — alles sichtbar
- **Keine Sprachausgabe-Steuerung**: TTS (speakResponse) existiert im Hook, aber kein Button in der UI
- **Keine Spracheingabe sichtbar**: VoiceButton ist vorhanden, aber nur als kleines Icon ohne klare Affordance
- **Statische Ladeanzeige**: Nur ein Spinner mit "Armstrong denkt nach..." — keine Schrittanzeige

## Neues Design-Konzept

```text
+------------------------------------------+
|  [Armstrong-Orb]  Armstrong    [_] [X]   |  <- Minimal header, kein Context-Badge
|------------------------------------------|
|                                          |
|   (Message-Bereich, kompakt)             |  <- Max ~280px Hoehe
|   User: ...                              |
|   Armstrong: ... [Vorlesen-Icon]         |  <- Inline read-aloud Button
|                                          |
|   [===== Arbeitsanimation =====]         |  <- Orbital/Pulse Animation + Schritt-Text
|   "Kontext laden..."                     |
|                                          |
|------------------------------------------|
|  [Chips: nur 2-3, horizontal scroll]    |  <- Minimal, nur wenn leer
|------------------------------------------|
|  [Mic] [Clip] [_______________] [Send]   |  <- Clean Input, Voice prominent
+------------------------------------------+

Groesse: ~380px breit x ~420px hoch (= 2 Widget-Hoehen)
Position: fixed bottom-right (Desktop), bottom-sheet (Mobile)
```

## Aenderungen im Detail

### 1. Neues kompaktes Layout (ChatPanel.tsx)

**Position "compact" hinzufuegen** als neuer Default fuer Zone 2:
- Breite: 380px
- Hoehe: 420px (max-h-[420px])
- Position: fixed bottom-20 right-5 (ueber der MobileBottomBar)
- Rounded-2xl mit subtle shadow

**Header minimalisieren**:
- Nur: animiertes Orb-Icon + "Armstrong" + Minimize + Close
- Kein Context-Badge (nur als Tooltip)
- Kein "Online/Denkt nach" Text — stattdessen Orb-Farbe aendert sich

**Upload-Zone entfernen** aus dem sichtbaren Bereich:
- Nur noch Paperclip-Button im Input (bereits vorhanden)
- Kein separater "Upload (DMS)" Bereich

**ChipBar nur bei leerem Chat** anzeigen, max 3 Chips, horizontal

### 2. Lovable-Style Arbeitsanimation (neu: ArmstrongOrb.tsx)

Neue Komponente `src/components/chat/ArmstrongOrb.tsx`:
- **Idle**: Statischer Gradient-Orb (blau-gruen, 24px)
- **Thinking**: Orb dreht sich (CSS rotate animation), pulsiert
- **Working**: Orbitalring dreht sich um den Orb + Schritt-Label darunter
- **Error**: Orb wird rot, shake-Animation
- **Speaking**: Orb "atmet" (scale-Animation)

Die ThinkingSteps werden IN die Message integriert statt separat:
- Waehrend Armstrong arbeitet, erscheint ein kompakter Bereich mit dem Orb + aktuellem Schritt
- z.B. "Kontext laden..." → "Antwort formulieren..." → fertig

### 3. Voice Input/Output UI-Verbesserung

**Spracheingabe (STT)**:
- VoiceButton bleibt links im Input, aber groesser und prominenter
- Bei aktivem Listening: Input-Bereich wird zum Transcript-Display
- Pulsierender Ring um den gesamten Input-Bereich

**Sprachausgabe (TTS) — NEU**:
- Jede Assistant-Message bekommt ein kleines Volume2-Icon (rechts oben in der Bubble)
- Klick ruft `voice.speakResponse(message.content)` auf
- Waehrend Sprechen: Icon pulsiert, Klick stoppt

### 4. ArmstrongSheet.tsx anpassen

- Desktop: Nutzt neues "compact" Layout (kein Sheet mehr)
- Mobile: Bleibt als bottom-sheet, aber mit reduzierter Hoehe (50vh statt 80vh)

### 5. MessageRenderer.tsx — Inline TTS Button

- Jede Assistant-Message: kleines Lautsprecher-Icon hinzufuegen
- Klick → `speakResponse(content)` (muss als Prop durchgereicht werden)

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| src/components/chat/ArmstrongOrb.tsx | NEU — Animierter Status-Orb |
| src/components/chat/ChatPanel.tsx | Compact-Layout, Header minimal, Upload-Zone entfernt, Orb integriert |
| src/components/chat/MessageRenderer.tsx | TTS-Button pro Assistant-Message |
| src/components/portal/ArmstrongSheet.tsx | Compact statt 80vh Sheet |
| src/components/chat/ArmstrongChipBar.tsx | Max 3 Chips, nur bei leerem Chat |

## Frozen-Module Check

- ChatPanel.tsx: src/components/chat/ — NICHT in einem Modul-Pfad, frei editierbar
- ArmstrongOrb.tsx: src/components/chat/ — frei editierbar
- MessageRenderer.tsx: src/components/chat/ — frei editierbar
- ArmstrongSheet.tsx: src/components/portal/ — kein Modul-Pfad, frei editierbar
- ArmstrongChipBar.tsx: src/components/chat/ — frei editierbar (NICHT src/components/office/)

Kein Modul-Freeze betroffen.

## Technische Details

### ArmstrongOrb CSS Animationen (Tailwind keyframes)

```text
orb-spin:      rotate 0 -> 360deg, 2s linear infinite
orb-breathe:   scale 1 -> 1.15 -> 1, 2s ease-in-out infinite
orb-orbit:     rotate ring um Zentrum, 1.5s linear infinite
orb-shake:     translateX -2px -> 2px -> 0, 0.3s
```

### Voice Output Flow

```text
User klickt Volume2-Icon auf Message
  → MessageRenderer ruft onSpeak(content) auf
  → ChatPanel leitet an voice.speakResponse(content) weiter
  → useArmstrongVoice spricht Text via ElevenLabs/Browser-Fallback
  → Waehrend Sprechen: VoiceButton zeigt Volume2 + pulse
  → Klick auf VoiceButton waehrend Sprechen → voice.stopSpeaking()
```

