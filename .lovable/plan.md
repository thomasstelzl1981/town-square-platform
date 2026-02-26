

## Plan: Armstrong E-Mail-Assistent — Implementierungsstatus

### ✅ Teil 1: Outbound (Chat → E-Mail) — DONE
- `ARM.GLOBAL.COMPOSE_EMAIL` + `ARM.GLOBAL.SEND_COMPOSED_EMAIL` in armstrongManifest.ts registriert
- Actions in MVP_EXECUTABLE_ACTIONS + GLOBAL_ACTIONS im Advisor aufgenommen
- Intent-Erkennung für E-Mail-Keywords (e-mail schreiben, mail verfassen, etc.)
- `DraftContent.format` um `'email'` erweitert (+ email_to, email_subject, email_body_html)
- `EmailDraftBox` UI-Komponente in MessageRenderer mit An/Betreff/Body + Senden/Kopieren

### ✅ Teil 2: Armstrong-Adresse generieren — DONE
- DB: `profiles.armstrong_email` Spalte
- DB: `generate_armstrong_email()` Funktion (Umlaute, Duplikate, Normalisierung)
- DB: `trg_set_armstrong_email` Trigger (INSERT + UPDATE von first_name/last_name)
- DB: Backfill aller bestehenden User
- UI: Armstrong-Adresse readonly im ProfilTab (MOD-01 unfrozen)

### ✅ Teil 3: Inbound Task Processing — DONE
- DB: `armstrong_inbound_tasks` Tabelle (RLS, Indizes)
- `sot-inbound-receive`: Neuer `handleArmstrongInbox` Handler
- Routing: `*@neilarmstrong.space` → User-Matching via `profiles.armstrong_email`
- Task-Erstellung mit from_email, subject, body, attachments_meta
- DSGVO-Ledger-Eintrag

### 🔲 Teil 4: Task-Processor + Ergebnis-Zustellung — OFFEN
- Edge Function `sot-armstrong-task-processor` (liest pending Tasks, ruft Advisor auf)
- Ergebnis per E-Mail zurück an User
- Ergebnis im Armstrong-Chat anzeigen

### Voraussetzungen für Inbound
- Domain `neilarmstrong.space` muss bei Resend als Inbound-Domain registriert werden (MX-Records)
- Resend Webhook muss für `neilarmstrong.space` den gleichen Endpoint `sot-inbound-receive` verwenden
