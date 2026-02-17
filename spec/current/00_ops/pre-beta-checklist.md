# Pre-Beta Checklist — Vor Testaccount-Erstellung

> **Status**: IN ARBEIT  
> **Erstellt**: 2026-02-17  
> **Ziel**: Alle Punkte müssen erledigt sein, bevor externe Nutzer einen Account erhalten.

---

## 1. Authentifizierung & Login

| # | Aufgabe | Status | Notizen |
|---|---------|--------|---------|
| 1.1 | Google Login (Portal-Auth via Lovable Cloud) | ✅ Aktiv | Managed OAuth — kein eigener Key nötig |
| 1.2 | Apple Login (Portal-Auth via Lovable Cloud) | ✅ Aktiv | Managed OAuth — kein eigener Key nötig |
| 1.3 | E-Mail/Passwort Login | ✅ Aktiv | Standard-Auth funktioniert |
| 1.4 | Passwort-Reset-Flow testen | ⬜ Offen | /reset-password Seite prüfen |

---

## 2. KI Office — Account-Integration (Google, Microsoft, IMAP)

> **Kontext**: Nutzer sollen ihre E-Mail-, Kalender- und Kontaktkonten verbinden können.  
> **Problem**: Google-Integration nutzt falsche Auth-Methode, Microsoft ist Platzhalter.

### 2.1 Credentials beschaffen (User-Aufgabe)

| # | Aufgabe | Status | Anleitung |
|---|---------|--------|-----------|
| 2.1.1 | Google Cloud OAuth 2.0 Client erstellen | ⬜ Offen | console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client |
| 2.1.2 | Google Scopes aktivieren: Gmail API, Calendar API, People API | ⬜ Offen | APIs & Services → Library → jeweilige API aktivieren |
| 2.1.3 | Azure App Registration erstellen | ⬜ Offen | portal.azure.com → App registrations → New registration |
| 2.1.4 | Azure Scopes: Mail.ReadWrite, Calendars.ReadWrite, Contacts.Read | ⬜ Offen | API permissions → Add permission → Microsoft Graph |

### 2.2 Secrets im Backend speichern (User-Aufgabe)

| # | Secret | Status |
|---|--------|--------|
| 2.2.1 | `GOOGLE_OAUTH_CLIENT_ID` | ⬜ Offen |
| 2.2.2 | `GOOGLE_OAUTH_CLIENT_SECRET` | ⬜ Offen |
| 2.2.3 | `MICROSOFT_OAUTH_CLIENT_ID` | ⬜ Offen |
| 2.2.4 | `MICROSOFT_OAUTH_CLIENT_SECRET` | ⬜ Offen |

### 2.3 Code-Änderungen (AI-Aufgabe — nach Secrets)

| # | Aufgabe | Status | Datei |
|---|---------|--------|-------|
| 2.3.1 | Edge Function `sot-oauth-exchange` erstellen | ⬜ Offen | `supabase/functions/sot-oauth-exchange/index.ts` |
| 2.3.2 | OAuth-Callback-Seite erstellen | ⬜ Offen | `src/pages/portal/office/OAuthCallback.tsx` |
| 2.3.3 | AccountIntegrationDialog reparieren (Google) | ⬜ Offen | `AccountIntegrationDialog.tsx` |
| 2.3.4 | AccountIntegrationDialog erweitern (Microsoft) | ⬜ Offen | `AccountIntegrationDialog.tsx` |
| 2.3.5 | Token-Refresh in sot-mail-sync | ⬜ Offen | `supabase/functions/sot-mail-sync/index.ts` |
| 2.3.6 | Token-Refresh in sot-calendar-sync | ⬜ Offen | `supabase/functions/sot-calendar-sync/index.ts` |
| 2.3.7 | Token-Refresh in sot-contacts-sync | ⬜ Offen | `supabase/functions/sot-contacts-sync/index.ts` |
| 2.3.8 | Route für OAuth-Callback in OfficePage | ⬜ Offen | `src/pages/portal/OfficePage.tsx` |

---

## 3. IMAP-Integration

| # | Aufgabe | Status | Notizen |
|---|---------|--------|---------|
| 3.1 | IMAP-Verbindung End-to-End testen | ⬜ Offen | Konto hinzufügen → Sync → Senden |
| 3.2 | Fehlerbehandlung bei falschen Credentials | ⬜ Offen | UX prüfen |

---

## 4. E-Mail-Sync & Senden

| # | Aufgabe | Status | Notizen |
|---|---------|--------|---------|
| 4.1 | E-Mail-Tab: Posteingang anzeigen | ⬜ Offen | Nach Account-Verbindung |
| 4.2 | E-Mail senden (IMAP/SMTP) | ⬜ Offen | |
| 4.3 | E-Mail senden (Gmail API) | ⬜ Offen | Benötigt 2.3.x |
| 4.4 | E-Mail senden (Microsoft Graph) | ⬜ Offen | Benötigt 2.3.x |

---

## 5. Kalender-Sync

| # | Aufgabe | Status | Notizen |
|---|---------|--------|---------|
| 5.1 | Google Calendar Sync testen | ⬜ Offen | Benötigt 2.3.x |
| 5.2 | Microsoft Calendar Sync testen | ⬜ Offen | Benötigt 2.3.x |

---

## 6. Kontakte-Sync

| # | Aufgabe | Status | Notizen |
|---|---------|--------|---------|
| 6.1 | Google Contacts Sync testen | ⬜ Offen | Benötigt 2.3.x |
| 6.2 | Microsoft Contacts Sync testen | ⬜ Offen | Benötigt 2.3.x |
| 6.3 | iCloud CardDAV Sync testen | ⬜ Offen | Bereits implementiert |

---

## 7. Allgemeine Beta-Readiness

| # | Aufgabe | Status | Notizen |
|---|---------|--------|---------|
| 7.1 | Beta-Readiness-Backlog abarbeiten | ⬜ Offen | Siehe `spec/audit/beta_readiness_backlog.json` |
| 7.2 | Golden Path Engine validieren | ⬜ Offen | |
| 7.3 | RLS-Policies für Multi-Tenant prüfen | ⬜ Offen | |
| 7.4 | Onboarding-Flow für neue Nutzer testen | ⬜ Offen | |

---

## Abhängigkeiten

```
2.1 (Credentials) → 2.2 (Secrets) → 2.3 (Code) → 3-6 (Tests)
1.x (Auth) kann parallel erledigt werden
7.x (Allgemein) kann parallel erledigt werden
```

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2026-02-17 | Protokoll erstellt |
