
# SoT-Fallback-E-Mail: Automatische vorname.nachname@systemofatown.com

## Konzept

Jeder Tenant-User erhaelt beim Signup automatisch eine persoenliche E-Mail-Adresse im Format `vorname.nachname@systemofatown.com`. Diese wird als permanente Fallback-Adresse fuer alle Outbound-E-Mails verwendet, solange (oder auch wenn) kein eigenes Mail-Konto (Gmail/Outlook/SMTP) verbunden ist.

## Architektur-Entscheidung

**Ansatz: `sot_email` Feld in `profiles`** (statt eigener `mail_accounts`-Eintrag)

Begruendung:
- Die SoT-Adresse ist **kein echtes Postfach** — kein IMAP, kein Posteingang, kein OAuth-Token
- Sie ist eine **Resend-basierte Absenderadresse** fuer Outbound-Only
- Ein `mail_accounts`-Eintrag wuerde die bestehende Logik (IMAP-Sync, Token-Refresh) verschmutzen
- Ein Feld auf `profiles` ist sauber, performant und sofort im Signup-Trigger verfuegbar

## Aenderungsplan

### 1. Migration: `sot_email` Spalte auf `profiles`

```sql
ALTER TABLE profiles ADD COLUMN sot_email TEXT;
CREATE UNIQUE INDEX idx_profiles_sot_email ON profiles(sot_email) WHERE sot_email IS NOT NULL;
```

- Eindeutiger Index verhindert Namenskollisionen
- Nullable, da Altdaten erst per Backfill befuellt werden

### 2. SQL-Funktion: `generate_sot_email(first_name, last_name, auth_email)`

Erzeugt die Adresse nach folgendem Schema:
- Basis: `vorname.nachname@systemofatown.com` (lowercase, Umlaute normalisiert: ae, oe, ue, ss)
- Bei Kollision: `vorname.nachname2@systemofatown.com`, `vorname.nachname3@systemofatown.com` usw.
- Fallback wenn kein Name: `email-prefix@systemofatown.com` (aus der Auth-E-Mail)

### 3. `handle_new_user()` Trigger erweitern

Nach dem INSERT in `profiles` wird `sot_email` sofort gesetzt:

```text
UPDATE profiles
SET sot_email = generate_sot_email(first_name, last_name, NEW.email)
WHERE id = NEW.id;
```

Damit hat jeder neue User ab Signup seine SoT-Adresse.

### 4. Backfill fuer bestehende User

```sql
UPDATE profiles
SET sot_email = generate_sot_email(
  COALESCE(first_name, split_part(email, '@', 1)),
  COALESCE(last_name, ''),
  email
)
WHERE sot_email IS NULL;
```

### 5. `userMailSend.ts` — Resend-Fallback personalisieren

Aktuell (Zeile 101):
```text
const fromAddr = resendFrom || 'Armstrong <no-reply@systemofatown.de>';
```

Neu: Vor dem Resend-Fallback wird `profiles.sot_email` und `profiles.display_name` geladen:

```text
// Lookup user's SoT email for personalized Resend fallback
const { data: profile } = await supabase
  .from('profiles')
  .select('sot_email, display_name, first_name, last_name')
  .eq('id', userId)
  .single();

const sotEmail = profile?.sot_email;
const displayName = profile?.display_name
  || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
  || 'Portal';

const fromAddr = sotEmail
  ? `${displayName} <${sotEmail}>`
  : (resendFrom || 'Armstrong <no-reply@systemofatown.de>');
```

Damit sieht der Empfaenger z.B. `Thomas Stelzl <thomas.stelzl@systemofatown.com>` statt `Armstrong <no-reply@...>`.

### 6. `sot-system-mail-send` — Identity-Fallback

In `sot-system-mail-send/index.ts` wird der bestehende Identity-Lookup (`get_active_outbound_identity`) um einen Fallback auf `profiles.sot_email` ergaenzt, falls keine explizite Outbound-Identity existiert.

### 7. UI: Anzeige im Profil / E-Mail-Einstellungen

- Im Profil-Bereich wird `sot_email` als "Ihre System-E-Mail" angezeigt (read-only)
- Hinweis: "Alle ausgehenden E-Mails werden ueber diese Adresse versendet. Sie koennen zusaetzlich Ihr eigenes E-Mail-Konto verbinden."

## Voraussetzung: Resend Domain

Die Domain `systemofatown.com` muss in Resend als verifizierte Absender-Domain eingerichtet sein (DNS: SPF, DKIM, DMARC). Basierend auf dem bestehenden Code (`noreply@systemofatown.com` in `sot-system-mail-send`) ist dies bereits der Fall.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration (neu) | `sot_email` Spalte, Unique Index, `generate_sot_email()` Funktion, Backfill |
| `handle_new_user()` Migration | Trigger um `sot_email`-Zuweisung erweitern |
| `supabase/functions/_shared/userMailSend.ts` | Resend-Fallback mit `profiles.sot_email` personalisieren |
| `supabase/functions/sot-system-mail-send/index.ts` | Identity-Fallback auf `sot_email` |
| Profil-UI (z.B. Stammdaten) | SoT-E-Mail als Read-Only anzeigen |

## Nicht betroffen

- `mail_accounts` Tabelle — bleibt fuer echte Postfaecher (Gmail, Outlook, SMTP)
- `user_outbound_identities` — bleibt fuer Brand-spezifische Identitaeten (Kaufy, FutureRoom etc.)
- Inbound-Routing — die SoT-Adresse ist rein outbound via Resend, kein Posteingang

## Zusammenfassung Ablauf

```text
Signup
  |
  v
handle_new_user()
  |-- profiles INSERT (email, display_name, ...)
  |-- UPDATE profiles SET sot_email = generate_sot_email(...)
  |
  v
User sendet E-Mail (z.B. Akquise, Serien-Mail, Meeting)
  |
  v
sendViaUserAccountOrResend()
  |-- Hat mail_accounts? --> Sende via Gmail/Outlook/SMTP
  |-- Kein Konto?
       |-- Lade profiles.sot_email
       |-- Sende via Resend mit "Max Mustermann <max.mustermann@systemofatown.com>"
```
