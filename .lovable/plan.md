

# Outbound-E-Mail-Umstellung: User-Account statt Resend

## Ueberblick

5 Edge Functions (Kategorie A) werden so umgebaut, dass E-Mails ueber das verbundene Mail-Konto des Users (Google, Microsoft, IMAP/SMTP) versendet werden — mit Resend als Fallback, falls kein Konto verbunden ist.

Die Infrastruktur existiert bereits vollstaendig in `sot-mail-send`. Die Aufgabe ist, diese Logik in die 5 Funktionen zu integrieren.

---

## Betroffene Functions

| # | Function | Frontend-Aufruf |
|---|----------|----------------|
| 1 | `sot-acq-outbound` | `src/hooks/useAcqOutbound.ts` |
| 2 | `sot-renovation-outbound` | `TenderDraftPanel.tsx` |
| 3 | `sot-serien-email-send` | `src/hooks/useMailCampaigns.ts` |
| 4 | `sot-meeting-send` | `MeetingResultDrawer.tsx` |
| 5 | `sot-msv-rent-report` | manuell / Cron |

---

## Architektur-Ansatz: Shared Helper statt Function-zu-Function-Calls

Statt dass jede Function intern `sot-mail-send` per HTTP aufruft (langsam, Auth-Overhead), wird eine **gemeinsame Hilfsfunktion** `_shared/userMailSend.ts` erstellt, die die Send-Logik aus `sot-mail-send` kapselt:

```text
supabase/functions/
  _shared/
    userMailSend.ts    <-- NEU: Shared send logic (SMTP/Gmail/Graph + Resend fallback)
    ledger.ts          (existiert bereits)
  sot-acq-outbound/
  sot-renovation-outbound/
  sot-serien-email-send/
  sot-meeting-send/
  sot-msv-rent-report/
```

### Shared Helper: `_shared/userMailSend.ts`

Exportiert eine Funktion:

```text
sendViaUserAccountOrResend({
  supabase,           // Service-Role Client
  userId,             // Auth User ID
  to: string[],
  subject: string,
  bodyHtml?: string,
  bodyText?: string,
  replyTo?: string,
  resendFrom?: string,  // Fallback-Absender fuer Resend (z.B. "Armstrong <no-reply@systemofatown.de>")
}) => { method: 'user_account' | 'resend' | 'skipped', messageId?: string }
```

**Logik:**
1. `mail_accounts` nach `user_id` abfragen, `is_default = true` oder erste aktive
2. Wenn Account gefunden: Sende per Google/Microsoft/SMTP (Logik aus `sot-mail-send` extrahiert)
3. Wenn kein Account: Fallback auf Resend (wie bisher)
4. Wenn kein Resend-Key: Status `skipped`

---

## Aenderungen pro Function

### 1. `sot-acq-outbound`
- Import `sendViaUserAccountOrResend`
- Auth-Header auswerten (fehlt aktuell! — nutzt nur Service-Role)
- Im Send-Loop: `sendViaUserAccountOrResend()` statt direktem Resend-Aufruf
- `acq_outbound_messages.sent_via` neues Feld: `'user_account'` oder `'resend'`

### 2. `sot-renovation-outbound`
- Auth-Header wird bereits ausgewertet (User-ID vorhanden)
- Resend-Block ersetzen durch `sendViaUserAccountOrResend()`
- Outbound-Identity-Logik kann entfallen (wird durch User-Account ersetzt)

### 3. `sot-serien-email-send`
- Auth-Header wird bereits ausgewertet
- Im Recipient-Loop: `sendViaUserAccountOrResend()` statt Resend
- Outbound-Identity als Fallback beibehalten
- **Achtung**: Throttling beibehalten (Rate-Limits der User-Mailserver)

### 4. `sot-meeting-send`
- Auth fehlt aktuell komplett — `user_id` aus `session.user_id` nutzen
- Resend-Block ersetzen durch `sendViaUserAccountOrResend()`

### 5. `sot-msv-rent-report`
- Ist Cron-basiert, kein User-Kontext
- **Optionaler** `accountId`-Parameter fuer manuellen Trigger
- Bei Cron: Resend bleibt (kein User eingeloggt)
- Bei manuellem Trigger mit `accountId`: User-Account nutzen

---

## Frontend-Aenderungen

### Alle betroffenen Hooks/Komponenten:

Vor dem Senden wird geprueft, ob der User ein verbundenes Mail-Konto hat. Falls ja, wird dies dem User angezeigt:

**Neuer Shared Hook: `useUserMailAccount.ts`**
- Fragt `mail_accounts` ab: gibt es ein aktives, default-Konto?
- Gibt zurueck: `{ hasAccount: boolean, accountEmail: string | null, accountId: string | null }`

**UI-Anpassung in den 4 Frontend-Aufrufstellen:**
- Kleiner Hinweis-Text vor dem Senden:
  - Wenn Account verbunden: "E-Mail wird ueber **max@gmail.com** versendet"
  - Wenn nicht: "E-Mail wird ueber System-Adresse versendet. Verbinde dein E-Mail-Konto in den Einstellungen fuer persoenlichen Versand."
- Kein zusaetzlicher Button noetig — die Logik ist automatisch

---

## Datenbank-Aenderung

Eine kleine Migration:

```text
ALTER TABLE acq_outbound_messages ADD COLUMN IF NOT EXISTS sent_via TEXT DEFAULT 'resend';
```

Damit kann spaeter nachvollzogen werden, ob eine E-Mail ueber den User-Account oder Resend ging.

---

## Zusammenfassung der Dateien

| Datei | Aktion |
|-------|--------|
| `supabase/functions/_shared/userMailSend.ts` | **NEU** — Shared Send-Logik |
| `supabase/functions/sot-acq-outbound/index.ts` | Umbau auf userMailSend |
| `supabase/functions/sot-renovation-outbound/index.ts` | Umbau auf userMailSend |
| `supabase/functions/sot-serien-email-send/index.ts` | Umbau auf userMailSend |
| `supabase/functions/sot-meeting-send/index.ts` | Umbau auf userMailSend + Auth |
| `supabase/functions/sot-msv-rent-report/index.ts` | Optionaler accountId-Support |
| `src/hooks/useUserMailAccount.ts` | **NEU** — Shared Hook |
| `src/hooks/useAcqOutbound.ts` | Info-Text Integration |
| `src/components/portal/immobilien/sanierung/tender/TenderDraftPanel.tsx` | Info-Text Integration |
| `src/components/dashboard/MeetingResultDrawer.tsx` | Info-Text Integration |
| `src/hooks/useMailCampaigns.ts` | Info-Text Integration |
| SQL-Migration | `sent_via`-Spalte |

