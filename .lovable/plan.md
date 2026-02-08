
# Plan: Armstrong Chat-Integration (Phase 6F)

## Übersicht

Verbindung des ChatPanel (Zone 2) mit der `sot-armstrong-advisor` Edge Function für vollständige Chat-Funktionalität inkl. Streaming, Action-Suggestions und Confirm-Gate UI.

---

## Architektur-Analyse

### Bestehende Komponenten
- **ChatPanel** (`src/components/chat/ChatPanel.tsx`): UI-Shell vorhanden, aber ohne Backend-Anbindung
- **ArmstrongSheet** (`src/components/portal/ArmstrongSheet.tsx`): Bottom-Sheet Container
- **ArmstrongWidget** (Zone 3): Bereits funktionierende API-Integration als Referenz
- **ActionCard** (`src/components/chat/ActionCard.tsx`): Confirm-UI bereits implementiert
- **useArmstrongContext**: Kontext-Injection fertig

### Fehlende Komponenten
- **useArmstrongAdvisor Hook**: Kein Hook für API-Kommunikation vorhanden
- **Message State Management**: ChatPanel verwaltet keine echten Nachrichten
- **Action Confirmation Flow**: ActionCard nicht in ChatPanel integriert
- **Streaming Support**: Keine SSE-Verarbeitung implementiert

---

## Implementierungsplan

### 1. Hook: useArmstrongAdvisor erstellen
**Datei:** `src/hooks/useArmstrongAdvisor.ts`

**Funktionen:**
- `sendMessage(text)` → Ruft Edge Function auf
- `confirmAction(actionCode, params)` → Führt bestätigte Action aus
- `cancelAction()` → Bricht Confirm-Flow ab
- State: `messages`, `pendingAction`, `isLoading`, `suggestedActions`

**API-Kommunikation:**
```text
┌─────────────────┐       POST /sot-armstrong-advisor
│  ChatPanel      │ ─────────────────────────────────────►
│                 │       { zone, module, message, ... }
│  ◄──────────────┼───────────────────────────────────────
│                 │       { type: EXPLAIN | SUGGEST | CONFIRM_REQUIRED }
└─────────────────┘
```

### 2. ChatPanel erweitern
**Datei:** `src/components/chat/ChatPanel.tsx`

**Änderungen:**
- Integration von `useArmstrongAdvisor` Hook
- Lokales Message-State-Management
- Rendering von ActionCard bei `CONFIRM_REQUIRED`
- Suggested Actions als klickbare Chips
- Loading/Streaming-States

### 3. ArmstrongSheet aktualisieren
**Datei:** `src/components/portal/ArmstrongSheet.tsx`

**Änderungen:**
- Kontext korrekt an ChatPanel übergeben (zone, module, entity)
- Module-Mapping für MVP-Module (MOD-00, 04, 07, 08)

### 4. Response-Type Rendering
**Neue Komponenten:**

| Response Type | UI-Darstellung |
|---------------|----------------|
| `EXPLAIN` | Markdown-formatierte Antwort |
| `DRAFT` | Entwurf-Box mit Copy-Button |
| `SUGGEST_ACTIONS` | Action-Chips unter Nachricht |
| `CONFIRM_REQUIRED` | ActionCard Overlay |
| `RESULT` | Erfolgs-/Fehler-Toast + Zusammenfassung |
| `BLOCKED` | Warn-Banner mit Grund |

---

## Technische Details

### Request-Format (an Edge Function)
```typescript
{
  zone: "Z2",
  module: "MOD-04", // aus Route abgeleitet
  route: "/portal/immobilien/...",
  entity: { type: "property", id: "uuid" },
  message: "Berechne die KPIs",
  conversation: { last_messages: [...] },
  action_request: null | { action_code, confirmed, params }
}
```

### State-Machine
```text
IDLE ──► LOADING ──► RESPONSE_RECEIVED
                          │
     ┌────────────────────┼────────────────────┐
     ▼                    ▼                    ▼
  EXPLAIN              SUGGEST             CONFIRM_REQUIRED
  (show text)       (show chips)          (show ActionCard)
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                              USER_CONFIRMS           USER_CANCELS
                                    │                       │
                                    ▼                       ▼
                             EXECUTING ──► RESULT       IDLE
```

### Neue Dateien
1. `src/hooks/useArmstrongAdvisor.ts` — API-Integration Hook
2. `src/components/chat/MessageRenderer.tsx` — Response-Type-spezifisches Rendering
3. `src/components/chat/SuggestedActions.tsx` — Action-Chips Komponente

### Geänderte Dateien
1. `src/components/chat/ChatPanel.tsx` — Hook-Integration
2. `src/components/portal/ArmstrongSheet.tsx` — Kontext-Mapping

---

## Akzeptanzkriterien

- [ ] User kann Nachricht senden und erhält Antwort
- [ ] EXPLAIN-Responses werden als Markdown gerendert
- [ ] SUGGEST_ACTIONS zeigt klickbare Action-Chips
- [ ] CONFIRM_REQUIRED zeigt ActionCard mit Confirm/Cancel
- [ ] Nach Confirm wird Action ausgeführt und RESULT angezeigt
- [ ] Loading-States während API-Calls
- [ ] Kontext (Module/Entity) wird korrekt übertragen
- [ ] Nur MVP-Module (00, 04, 07, 08) aktiv

---

## Nicht enthalten (Out of Scope)
- SSE-Streaming (Phase 2)
- Persistente Chat-Historie in DB
- Voice-Integration (bereits vorhanden, bleibt unverändert)
- Credits-Abrechnung (nur Anzeige)
