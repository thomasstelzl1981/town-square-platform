

# Videocall-Verbindungsproblem: Analyse & Fix

## Root Cause (Kritischer Bug)

**Der Host und der Gast landen in unterschiedlichen LiveKit-Räumen.**

In `VideocallRoom.tsx` (Zeile 65-67) wird beim Laden eines bestehenden Calls `sot-videocall-create` aufgerufen. Diese Edge Function erstellt aber jedes Mal einen **komplett neuen** Call mit neuem Raumnamen (`sot-<random>`). Der Host bekommt also ein Token für Raum `sot-abc`, während der Gast (über die Einladung) ein Token für den originalen Raum `sot-xyz` erhält.

Zusätzliche Probleme:
1. **Token-TTL nur 10 Minuten** -- Sowohl Host- als auch Gast-Token verfallen nach 600 Sekunden. Wenn der Gast den Link nach 10 Min öffnet, ist das Host-Token bereits abgelaufen.
2. **Origin-Mismatch möglich** -- Die Einladungs-E-Mail baut den Join-Link mit `req.headers.get('origin')` auf. Auf der Published-Version (`systemofatown.lovable.app`) kann das korrekt sein, aber der Fallback ist `systemofatown.com`.

## Umsetzungsplan

### 1. Neue Edge Function: `sot-videocall-rejoin`
Erstellt ein frisches LiveKit-Token für einen **bestehenden** Call/Raum, ohne einen neuen Call anzulegen.
- Nimmt `callId` entgegen
- Prüft, dass der User Host des Calls ist
- Generiert Token für den existierenden `livekit_room_name`
- Gibt `hostToken`, `livekitUrl`, `roomName` zurück

### 2. Fix `VideocallRoom.tsx`
- Statt `sot-videocall-create` aufzurufen, `sot-videocall-rejoin` mit dem `callId` aufrufen
- Damit bekommt der Host ein Token für denselben Raum wie der Gast

### 3. Token-TTL erhöhen
- In `sot-videocall-create`, `sot-videocall-rejoin` und `sot-videocall-invite-validate`: TTL von 600s auf 7200s (2 Stunden) erhöhen
- Matching der Invite-Gültigkeit (2h laut E-Mail-Text)

### 4. Origin-Fix in `sot-videocall-invite-send`
- Published URL als primären Fallback verwenden: `https://systemofatown.lovable.app`
- Damit funktioniert der Join-Link auch wenn der Origin-Header fehlt

### Dateien
- **Neu:** `supabase/functions/sot-videocall-rejoin/index.ts`
- **Edit:** `src/pages/portal/office/VideocallRoom.tsx` (Zeile 65-67: `sot-videocall-create` → `sot-videocall-rejoin`)
- **Edit:** `supabase/functions/sot-videocall-create/index.ts` (TTL 600→7200)
- **Edit:** `supabase/functions/sot-videocall-invite-validate/index.ts` (TTL 600→7200)
- **Edit:** `supabase/functions/sot-videocall-invite-send/index.ts` (Origin-Fallback)
- **Edit:** `supabase/config.toml` (verify_jwt=false für neue Function)

Keine DB-Änderungen nötig. Keine Freeze-Verletzungen (MOD-02 Office, Infra Edge Functions nicht eingefroren).

