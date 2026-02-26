

## Plan: E-Mail-Assistent fertigstellen (fehlende Teile 1-4)

### Status-Analyse

Teile 1-3 sind **teilweise** implementiert — die Registrierung (Manifest, Action-Definitionen, Intent-Erkennung, UI-Komponenten, DB-Tabellen, Inbound-Handler) existiert. Aber es fehlen kritische Verbindungsstücke:

### Fehlende Implementierungen

**A. Advisor: COMPOSE_EMAIL + SEND_COMPOSED_EMAIL Execution Handler**
- `supabase/functions/sot-armstrong-advisor/index.ts` — Im `executeAction` Switch fehlen die `case`-Handler für beide Actions
- `ARM.GLOBAL.COMPOSE_EMAIL`: Muss AI aufrufen um E-Mail-Entwurf zu generieren (To, Subject, HTML Body) basierend auf User-Instruktion + optionalem Kontakt-Lookup
- `ARM.GLOBAL.SEND_COMPOSED_EMAIL`: Muss den bestätigten Entwurf via `sot-mail-send` oder `sot-system-mail-send` versenden

**B. Frontend: onSendEmail Handler verdrahten**
- `src/components/chat/ChatPanel.tsx` (Zeile ~269): `onSendEmail` prop wird nicht an `MessageRenderer` übergeben
- `src/components/portal/ArmstrongContainer.tsx` (Zeile ~353): gleiches Problem
- `src/components/portal/MobileHomeChatView.tsx` (Zeile ~67): gleiches Problem
- `src/hooks/useArmstrongAdvisor.ts`: Braucht eine `sendEmail(draft)` Funktion die `ARM.GLOBAL.SEND_COMPOSED_EMAIL` als confirmed Action triggert

**C. Teil 4: Task-Processor Edge Function (NEU)**
- `supabase/functions/sot-armstrong-task-processor/index.ts` — Neue Edge Function
- Liest `armstrong_inbound_tasks` mit `status = 'pending'`
- Extrahiert Instruktion aus Subject + Body
- Ruft `sot-armstrong-advisor` intern auf (service-role)
- Speichert Ergebnis in `armstrong_inbound_tasks.result`
- Sendet Antwort-E-Mail an User via `sot-system-mail-send`
- Setzt Status auf `completed` oder `failed`

**D. Konfiguration**
- `supabase/config.toml`: `verify_jwt = false` für `sot-armstrong-task-processor` (wird von Cron/Webhook aufgerufen)

### Implementierungsschritte

| # | Datei | Änderung |
|---|---|---|
| 1 | `sot-armstrong-advisor/index.ts` | 2 neue `case`-Handler im `executeAction` Switch: COMPOSE_EMAIL (AI-Entwurf generieren, Draft zurückgeben) + SEND_COMPOSED_EMAIL (via sot-system-mail-send versenden) |
| 2 | `src/hooks/useArmstrongAdvisor.ts` | `sendEmail(draft)` Funktion hinzufügen die SEND_COMPOSED_EMAIL als confirmed action an den Advisor schickt |
| 3 | `src/components/chat/ChatPanel.tsx` | `onSendEmail={advisor.sendEmail}` an MessageRenderer übergeben |
| 4 | `src/components/portal/ArmstrongContainer.tsx` | `onSendEmail={advisor.sendEmail}` an MessageRenderer übergeben |
| 5 | `src/components/portal/MobileHomeChatView.tsx` | `onSendEmail={advisor.sendEmail}` an MessageRenderer übergeben |
| 6 | `supabase/functions/sot-armstrong-task-processor/index.ts` | Neue Edge Function: pending Tasks verarbeiten → Advisor aufrufen → Ergebnis per Mail zurückschicken |

### Keine DB-Änderungen nötig
Alle Tabellen und Spalten existieren bereits.

