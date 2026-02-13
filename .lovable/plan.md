
# MOD-02 KI-Office: Videocalls (LiveKit Integration)

## Uebersicht

Vollstaendig integriertes Videocall-System im KI-Office mit LiveKit als Video-Engine, Resend fuer E-Mail-Einladungen und gebranded Call-UI. Gaeste treten ueber einen Token-gesicherten Link bei — alles innerhalb der Anwendung.

## Voraussetzungen: Secrets

Folgende Secrets muessen VOR der Implementierung konfiguriert sein:
- **LIVEKIT_URL** (z.B. `wss://your-app.livekit.cloud`)
- **LIVEKIT_API_KEY**
- **LIVEKIT_API_SECRET**

RESEND_API_KEY ist bereits vorhanden.

## Bestehende Infrastruktur (wird wiederverwendet)

- **`user_outbound_identities`** Tabelle + `get_active_outbound_identity()` Funktion — existiert bereits, wird fuer Absender-Identitaet in Einladungs-Mails genutzt. KEINE neue `user_system_emails` Tabelle noetig.
- **`sot-system-mail-send`** Edge Function — existiert, wird fuer Einladungs-Versand aufgerufen.
- **`livekit-client`** npm Paket — bereits installiert (via @elevenlabs/react Dependency).

## Neues npm Paket

- **`@livekit/components-react`** — React-Komponenten (LiveKitRoom, VideoTrack, ControlBar etc.)
- **`@livekit/components-styles`** — Standard-Styles

---

## Schritt 1: Datenbank-Migration

### Neue Tabellen

**`video_calls`**
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | gen_random_uuid() |
| tenant_id | uuid FK | Mandanten-Zuordnung |
| host_user_id | uuid NOT NULL | Ersteller |
| title | text | Call-Titel |
| status | text | draft, active, ended, expired |
| livekit_room_name | text UNIQUE | Raum-Identifier |
| starts_at | timestamptz | Geplanter Start |
| ends_at | timestamptz | Tatsaechliches Ende |
| expires_at | timestamptz | Ablauf (default +24h) |
| created_at | timestamptz | |

**`video_call_invites`**
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | Invite-ID (in Join-URL) |
| call_id | uuid FK | |
| invited_by_user_id | uuid | |
| invitee_email | text NOT NULL | |
| invitee_name | text | |
| status | text | sent, opened, joined, expired, revoked |
| token_hash | text NOT NULL | SHA-256 Hash des Tokens |
| sent_at | timestamptz | |
| opened_at | timestamptz | |
| joined_at | timestamptz | |
| expires_at | timestamptz | default +2h |
| created_at | timestamptz | |

**`video_call_participants`**
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| call_id | uuid FK | |
| user_id | uuid NULLABLE | Auth-User (Host) |
| email | text NULLABLE | Gast-E-Mail |
| display_name | text | |
| role | text | host, guest |
| joined_at | timestamptz | |
| left_at | timestamptz | |

### RLS Policies

- `video_calls`: Host kann eigene Calls SELECT/INSERT/UPDATE
- `video_call_invites`: Host kann eigene Invites SELECT/INSERT, Public Validate via Edge Function (service_role)
- `video_call_participants`: Host kann alle Teilnehmer sehen, Gast-Eintrag via Edge Function

---

## Schritt 2: Manifest & Routing

### routesManifest.ts — MOD-02 Erweiterung

Neuer Tile in MOD-02:
```text
{ path: "videocalls", component: "VideocallsTab", title: "Videocalls" }
```

Neue Dynamic Routes in MOD-02:
```text
{ path: "videocalls/:callId", component: "VideocallRoom", title: "Videocall", dynamic: true }
```

### Oeffentliche Join-Route (App.tsx)

Neue Special Route (public, kein Auth):
```text
/portal/office/videocalls/join/:inviteId
```
Diese Route wird in App.tsx als eigene `<Route>` definiert (vor dem ManifestRouter Catch-All), da sie public ist und keinen Auth-Guard benoetigt.

### OfficePage.tsx

Neuer Lazy-Import + Route fuer `videocalls` und `videocalls/:callId` und `videocalls/join/:inviteId`.

---

## Schritt 3: Edge Functions (4 Stueck)

### 3.1 `sot-videocall-create`
- **Input**: `{ title }` (Auth-Header)
- **Flow**:
  1. Auth validieren, User + Tenant bestimmen
  2. Room-Name generieren: `sot-{uuid-short}`
  3. INSERT in `video_calls` (status=draft)
  4. LiveKit JWT generieren (via `livekit-server-sdk` AccessToken, identity=user-email, roomJoin+roomCreate grants, TTL 10min)
  5. Return `{ callId, roomName, hostToken }`

### 3.2 `sot-videocall-invite-send`
- **Input**: `{ callId, inviteeEmail, inviteeName? }`
- **Flow**:
  1. Auth: Pruefen ob User = host_user_id
  2. Random Token generieren (32 Bytes hex)
  3. SHA-256 Hash speichern in `video_call_invites`
  4. Join-Link bauen: `{ORIGIN}/portal/office/videocalls/join/{inviteId}?t={token}`
  5. HTML-Template rendern (Logo, Headline, CTA-Button)
  6. Intern `sot-system-mail-send` aufrufen (nutzt Host-Outbound-Identity als Absender)

### 3.3 `sot-videocall-invite-validate` (PUBLIC)
- **Input**: `{ inviteId, token }`
- **Flow**:
  1. Invite laden, Token-Hash vergleichen
  2. Ablauf pruefen (expires_at)
  3. Status pruefen (nicht already joined/revoked)
  4. LiveKit Guest-Token generieren (identity=email, roomJoin grant, TTL 10min)
  5. Invite-Status auf "joined" setzen
  6. Return `{ callId, roomName, guestToken, hostName }`

### 3.4 `sot-videocall-end`
- **Input**: `{ callId }`
- **Flow**: Auth pruefen, status=ended, ends_at=now()

### config.toml Eintraege (alle verify_jwt=false, Auth im Code)

---

## Schritt 4: Frontend-Komponenten

### 4.1 `VideocallsTab.tsx` (Uebersicht)
- Liste aller eigenen Videocalls (Tabelle: Titel, Status, Datum, Teilnehmer)
- Button "Neuen Videocall starten" → ruft `sot-videocall-create` auf → navigiert zu Call-Room
- Vergangene Calls mit Dauer und Teilnehmerzahl

### 4.2 `VideocallRoom.tsx` (Call-Raum)
- Empfaengt `callId` per URL-Param
- Laedt Call-Daten + Token (Host via create, Gast via validate)
- **LiveKit Integration**:
  ```text
  <LiveKitRoom token={token} serverUrl={livekitUrl} connect={true}>
    <VideoConference />  // oder custom Layout
  </LiveKitRoom>
  ```
- **Layout**:
  - Top Bar: Logo + Call-Titel + Status-Badge + Timer
  - Center: Video-Grid (Speaker-View)
  - Rechts: Branding-Panel (Firmenname, 3 Feature-Kacheln, Claim)
  - Bottom Bar: Runde Buttons (Mute, Camera, Screen-Share, Leave, Invite)
- **Invite-Dialog**: Modal zum Eingeben einer E-Mail → ruft `sot-videocall-invite-send` auf
- **Leave**: Host = Call beenden (sot-videocall-end), Gast = nur verlassen

### 4.3 `VideocallJoinPage.tsx` (Gast-Beitritt)
- Public Route, kein Auth noetig
- Liest `inviteId` + `token` aus URL
- Zeigt Branding-Seite: Logo, "Willkommen bei System of a Town", Call-Titel
- Button "Beitreten" → ruft `sot-videocall-invite-validate` auf → navigiert zu VideocallRoom mit guestToken
- Fehler-States: Abgelaufen, Bereits verwendet, Ungueltig

### 4.4 `VideocallBrandingPanel.tsx`
- Rechte Seitenleiste im Call
- Logo (armstrong_logo_dark/light je nach Theme)
- "Willkommen bei System of a Town"
- 3 Feature-Kacheln (Icons + Kurzbeschreibung)
- Unternehmenssatz

### 4.5 Hooks
- `useVideocalls()` — CRUD fuer video_calls (SELECT, CREATE)
- `useVideocallInvite()` — Invite senden
- `useVideocallRoom()` — Token-Management, Connect/Disconnect State

---

## Schritt 5: CI / Design

- Dunkler Videobereich (`bg-zinc-950`) mit hellem Control-Bar
- Runde Buttons (48px, `rounded-full`) mit Hover-Scale-Animation
- Status-Badges: `draft=muted`, `active=green`, `ended=gray`
- Branding-Panel: Dezent, rechts positioniert, 280px breit
- Toast-Notifications bei Join/Leave/Error
- Responsive: Auf Mobile kein Branding-Panel, nur Video + Controls

---

## Schritt 6: Security

- Invite-Tokens: 32 Bytes Zufall, nur SHA-256 Hash in DB gespeichert
- Token-Ablauf: 2 Stunden fuer Invites, 10 Minuten fuer LiveKit JWTs
- Public Validate Endpoint: Token-Hash-Vergleich + Ablaufpruefung
- Host-only Actions: Call beenden, Invites senden
- Kein Klartext-Token in DB oder Logs

---

## Zusammenfassung der neuen Dateien

| Datei | Typ |
|-------|-----|
| `supabase/migrations/xxx_videocalls.sql` | DB-Migration |
| `supabase/functions/sot-videocall-create/index.ts` | Edge Function |
| `supabase/functions/sot-videocall-invite-send/index.ts` | Edge Function |
| `supabase/functions/sot-videocall-invite-validate/index.ts` | Edge Function |
| `supabase/functions/sot-videocall-end/index.ts` | Edge Function |
| `src/pages/portal/office/VideocallsTab.tsx` | Uebersicht |
| `src/pages/portal/office/VideocallRoom.tsx` | Call-Raum |
| `src/pages/portal/office/VideocallJoinPage.tsx` | Gast-Beitritt (public) |
| `src/pages/portal/office/components/VideocallBrandingPanel.tsx` | Branding-UI |
| `src/hooks/useVideocalls.ts` | Hooks |

| Bearbeitete Dateien | Aenderung |
|---------------------|-----------|
| `src/manifests/routesManifest.ts` | Neuer Tile + Dynamic Routes |
| `src/pages/portal/OfficePage.tsx` | Neue Routes |
| `src/pages/portal/office/index.ts` | Neue Exports |
| `src/router/ManifestRouter.tsx` | Dynamic Component Map + Join-Route |
| `src/App.tsx` | Public Join Route |
| `supabase/config.toml` | 4 neue Function-Eintraege |
