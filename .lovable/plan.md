
# Armstrong AI-Assistent Überarbeitung

## Übersicht

Diese Überarbeitung transformiert Armstrong in einen professionelleren KI-Co-Piloten mit:
- Neuem visuellen Design (Erde statt abstrakte Planeten-Ästhetik, cleanes Pergament-Panel)
- Vollständiger Spracheingabe/Ausgabe (OpenAI Realtime API)
- **Task-Kacheln auf dem Dashboard** (nicht im Chatbot) für Freigabe-Workflows
- Erweitertem Aktions-Manifest für alle Kommunikationskanäle

---

## Phase 1: Visuelles Redesign Armstrong ✅ ERLEDIGT

### 1.1 Collapsed State — Planet Erde ✅

**Vorher**: Abstrakte Gold-Blau-Purple Planeten-Textur
**Jetzt**: Stilisierte Erde mit Blau/Grün-Tönen und Kontinenten-Andeutung

Implementierte CSS-Änderungen:
- `--armstrong-earth-ocean`: Tiefblau für Ozeane
- `--armstrong-earth-land`: Grün für Kontinente
- `--armstrong-earth-gradient`: Mehrschichtiger Gradient mit Wolken
- `armstrong-earth-glow`: Blaue Atmosphären-Glow (Ozon-Effekt)

### 1.2 Expanded State — Pergament/Clean Design ✅

**Vorher**: Glassmorphism mit Gold→Blue Header-Gradient
**Jetzt**: Cleanes weißes Design im Light Mode, dezenter Header

Implementierte Änderungen:
- `armstrong-glass-light`: Weißer Hintergrund (Pergament-Stil)
- `armstrong-header-clean`: Schlichter Header ohne bunten Gradient
- Globe-Icon statt Bot-Icon für konsistentes Erde-Thema

---

## Phase 2: Spracheingabe/-ausgabe (OpenAI Realtime)

### 2.1 Architektur

```text
┌─────────────────┐     WebSocket     ┌──────────────────────┐
│  Browser        │◄─────────────────►│  sot-armstrong-voice │
│  (Mic/Speaker)  │                   │  Edge Function       │
└─────────────────┘                   └──────────┬───────────┘
                                                 │
                                                 ▼ WebSocket
                                      ┌──────────────────────┐
                                      │  OpenAI Realtime API │
                                      │  (gpt-4o-realtime)   │
                                      └──────────────────────┘
```

### 2.2 Neue Edge Function: `sot-armstrong-voice`

**Standort**: `supabase/functions/sot-armstrong-voice/index.ts`

**Funktionen**:
- WebSocket-Proxy zum OpenAI Realtime API
- Server-VAD (Voice Activity Detection)
- Session-Management mit Armstrong-Kontext
- Audio-Format: PCM16 @ 24kHz

### 2.3 Frontend Voice-Integration

**Neue Komponenten**:
- `src/components/armstrong/VoiceButton.tsx` — Mikrofon-Toggle mit Puls-Animation
- `src/hooks/useArmstrongVoice.ts` — WebSocket-Management, Audio-Recording/Playback

**Integration**:
- Mikrofon-Symbol prominent in der Eingabezeile (ChatPanel und ArmstrongContainer)
- Visuelle Feedback während Spracherkennung (Wellen-Animation)
- Audio-Playback für Armstrong-Antworten (optional aktivierbar)

---

## Phase 3: Task-Kacheln auf dem Dashboard

### 3.1 Konzept

Wenn Armstrong Aufgaben plant, die:
- **Credits verbrauchen** (metered actions)
- **Nach außen kommunizieren** (Briefe, E-Mails, Faxe, Tickets)
- **Schreibende Aktionen** ausführen

...dann erscheinen diese als **Kacheln auf dem Portal Dashboard** (nicht im Chatbot).
Diese Kacheln sind im gleichen Grid wie Begrüßung, Wetter und Globus.

### 3.2 Dashboard Layout mit Pending Tasks

```text
+--------------------------------+--------------------------------+--------------------------------+
|     🤖 ARMSTRONG GREETING      |    ☀️ WEATHER WIDGET           |     🌍 EARTH GLOBE             |
+--------------------------------+--------------------------------+--------------------------------+
|     📨 PENDING TASK 1          |     📄 PENDING TASK 2          |     📧 PENDING TASK 3          |
|     Brief an Mustermann        |     Exposé generieren          |     E-Mail an Bank             |
|     [Vorschau] [Freigeben]     |     [Vorschau] [Freigeben]     |     [Vorschau] [Freigeben]     |
+--------------------------------+--------------------------------+--------------------------------+
```

### 3.3 Neue Dashboard-Komponente: `PendingTaskCard`

**Standort**: `src/components/dashboard/PendingTaskCard.tsx`

```text
Kachel-Design:
├── Icon basierend auf Aktion (Brief, E-Mail, Fax, Ticket)
├── Titel und kurze Beschreibung
├── Kostenanzeige (falls metered)
├── Buttons: [Vorschau] [Abbrechen] [Freigeben]
└── Gleiches Card-Design wie andere Dashboard-Kacheln
```

### 3.4 State Management für Tasks

**Neuer Hook**: `src/hooks/usePendingTasks.ts`

```text
Funktionen:
├── fetchPendingTasks() — Lädt Tasks aus DB/localStorage
├── approveTask(id) — Führt Aktion aus
├── rejectTask(id) — Löscht Task
├── previewTask(id) — Öffnet Vorschau-Modal
└── Realtime-Updates wenn Armstrong neue Tasks erstellt
```

**Datenbank-Tabelle** (optional für Persistenz):
```text
pending_tasks:
├── id (UUID)
├── tenant_id
├── user_id
├── action_code (z.B. ARM.COMM.SEND_LETTER)
├── title
├── parameters (JSONB)
├── cost_estimate_cents
├── status (pending/approved/rejected)
├── created_at
└── expires_at
```

### 3.5 Integration in PortalDashboard

Das `PortalDashboard.tsx` wird erweitert um:
1. Abruf der Pending Tasks via `usePendingTasks()`
2. Dynamisches Grid das wächst wenn Tasks vorhanden
3. Tasks erscheinen als zusätzliche Kacheln unter den Hauptwidgets

---

## Phase 4: Manifest-Erweiterung für Kommunikation

### 4.1 Neue Aktions-Kategorie: COMM

```text
ARM.COMM.SEND_LETTER    — Brief versenden (Porto + Druck)
ARM.COMM.SEND_EMAIL     — E-Mail versenden
ARM.COMM.SEND_FAX       — Fax versenden
ARM.COMM.CREATE_TICKET  — Ticket erstellen
```

### 4.2 Manifest-Struktur für Tasks

Alle Aktionen mit `requires_confirmation: true` und/oder `cost_model: 'metered'` erzeugen automatisch einen Pending Task auf dem Dashboard, anstatt sofort ausgeführt zu werden.

---

## Technische Übersicht

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| `supabase/functions/sot-armstrong-voice/index.ts` | OpenAI Realtime WebSocket Proxy |
| `src/components/armstrong/VoiceButton.tsx` | Mikrofon-UI mit Puls-Animation |
| `src/components/dashboard/PendingTaskCard.tsx` | Task-Kachel für Dashboard |
| `src/hooks/useArmstrongVoice.ts` | Voice-Session Management |
| `src/hooks/usePendingTasks.ts` | Pending Tasks State + CRUD |

### Geänderte Dateien

| Datei | Änderungen |
|-------|------------|
| `src/index.css` | ✅ Neue Earth-Gradients, Pergament-Styles für Armstrong |
| `src/components/portal/ArmstrongContainer.tsx` | ✅ Erde statt Planet, Pergament-Panel, Globe-Icon |
| `src/components/chat/ChatPanel.tsx` | Mikrofon-Button prominent links |
| `src/pages/portal/PortalDashboard.tsx` | Integration der PendingTaskCard-Kacheln |
| `src/manifests/armstrongManifest.ts` | COMM-Aktionen hinzufügen |

### Secrets (bereits vorhanden)

- `OPENAI_API_KEY` — Für Realtime Voice API
- `LOVABLE_API_KEY` — Für Text-Chat (bleibt primär)

---

## Implementierungs-Reihenfolge

```text
1. Design-Overhaul Armstrong ✅ ERLEDIGT
   ├── CSS: Earth-Gradient + Pergament-Styles ✅
   ├── ArmstrongContainer: Erde-Visual, cleaner Header ✅
   └── ChatPanel: Dezenteres Design (optional)

2. Dashboard Task-System
   ├── PendingTaskCard Component
   ├── usePendingTasks Hook
   ├── DB-Tabelle pending_tasks (optional)
   └── Integration in PortalDashboard.tsx

3. Manifest-Erweiterung
   ├── COMM-Aktionen hinzufügen
   └── Task-Logik in sot-armstrong-advisor

4. Voice-System
   ├── sot-armstrong-voice Edge Function
   ├── VoiceButton Component
   ├── useArmstrongVoice Hook
   └── Audio Playback Integration
```

---

## Erwartetes Ergebnis

Nach Implementierung:

1. **Visuell**: ✅ Armstrong zeigt eine stilisierte Erde im Collapsed State und ein cleanes Pergament-Design im geöffneten Zustand
2. **Voice**: User können per Sprache mit Armstrong kommunizieren (Mikrofon prominent sichtbar)
3. **Dashboard-Tasks**: Alle kostenpflichtigen/externen Aktionen erscheinen als Kacheln auf dem Dashboard zur Freigabe
4. **Aktionen**: Vollständiges Manifest für Briefe, E-Mails, Faxe, Tickets
