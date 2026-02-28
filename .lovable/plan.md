

## Analyse & Korrekturbedarf

### 1. Armstrong Inbound-Email — bereits vorhanden, NICHT duplizieren

Die Armstrong-Inbound-Adresse existiert bereits als `profiles.armstrong_email` (z.B. `thomas.stelzl@neilarmstrong.space`). Sie wird automatisch beim Profil-Anlegen generiert und ist in `sot-inbound-receive` vollständig implementiert.

**Problem im aktuellen Code:** `commpro_phone_assistants.armstrong_inbound_email` ist ein redundantes Feld. Die `phone-postcall` Edge Function liest aktuell aus diesem Feld — aber es wird nirgendwo befüllt (immer `NULL`).

**Korrektur:** `phone-postcall` soll stattdessen `profiles.armstrong_email` über den `user_id` des Assistenten auslesen. Das Feld `armstrong_inbound_email` in der Assistants-Tabelle kann entfernt oder ignoriert werden.

### 2. Zone 1 — Telefon-Desk für Marken

Es gibt aktuell **keinen** Telefon- oder CommPro-Desk in Zone 1. Die `adminDeskMap` enthält Sales, Finance, Acquiary, Lead, Projekt, Pet, Service, Ncore, Otto — aber keinen Communication/Phone-Desk.

**Vorschlag:** Neuer `commpro-desk` in Zone 1 mit Sub-Tab-Navigation (wie FutureRoom-Desk):

```text
/admin/commpro-desk
├── /kaufy        — Telefonassistent für Kaufy (Premium/ElevenLabs)
├── /futureroom   — Telefonassistent für FutureRoom
├── /acquiary     — Telefonassistent für Acquiary
├── /sot          — Telefonassistent für SoT
├── /lennox       — Telefonassistent für Lennox & Friends
├── /ncore        — Telefonassistent für Ncore
└── /otto         — Telefonassistent für Otto²
```

Jeder Tab zeigt: Nummernstatus, Anrufprotokoll, Konfiguration (Begrüßung, Regeln, Stimme) — die gleiche UI wie Zone 2, aber mit `tier: 'premium'` und ElevenLabs-Optionen.

### 3. Credits — Platzhalter vorbereiten, nicht implementieren

Credit-Preflight bleibt auf der Liste. Kein funktionierendes System jetzt.

---

## Implementierungsplan (5 Schritte)

### Schritt 1: `phone-postcall` korrigieren
- Armstrong-E-Mail aus `profiles.armstrong_email` laden (JOIN über `user_id`), nicht aus `commpro_phone_assistants.armstrong_inbound_email`
- Feld `armstrong_inbound_email` aus `usePhoneAssistant.ts` Type entfernen (oder ignorieren)

### Schritt 2: `plan.md` aktualisieren
- Secrets als erledigt markieren
- DB-Migration als erledigt markieren
- Edge Functions als erledigt markieren
- UI-Erweiterung als erledigt markieren
- Neuen Punkt hinzufügen: Zone 1 CommPro-Desk

### Schritt 3: Zone 1 CommPro-Desk erstellen
- Neue Page `src/pages/admin/desks/CommProDesk.tsx`
- Sub-Tab-Navigation mit den 7 Marken (Kaufy, FutureRoom, Acquiary, SoT, Lennox, Ncore, Otto²)
- Pro Marke: Nummernstatus, Anruf-Log, Konfiguration (wiederverwendet die bestehenden Phone-Assistant-Komponenten)
- Registrierung in `adminDeskMap` als `'commpro-desk'` und in `DESK_PREFIXES`

### Schritt 4: Zone 1 Routing
- `commpro-desk` in `Zone1Router.tsx` → `adminDeskMap` eintragen
- `commpro-desk` in `DESK_PREFIXES` array eintragen
- Armstrong-Sidebar-Navigation: Eintrag für CommPro-Desk hinzufügen

### Schritt 5: Premium-Tier für Zone 1 Marken
- In der Zone 1 Desk-UI: `tier` wird auf `'premium'` gesetzt
- StatusForwardingCard zeigt ElevenLabs-Optionen wenn `tier === 'premium'`
- Die eigentliche ElevenLabs-Stream-Integration (Twilio `<Stream>` → ElevenLabs WebSocket) bleibt ein späterer Schritt

