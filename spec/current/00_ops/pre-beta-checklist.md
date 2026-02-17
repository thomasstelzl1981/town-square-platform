# Pre-Beta Checklist — Vor Testaccount-Erstellung

> **Status**: IN ARBEIT  
> **Erstellt**: 2026-02-17  
> **Letzte Prüfung**: 2026-02-17  
> **Ziel**: Alle P0-Punkte müssen erledigt sein, bevor externe Nutzer einen Account erhalten.

---

## Zusammenfassung

| Kategorie | P0 offen | P1 offen | Gesamt offen | Erledigt |
|-----------|----------|----------|--------------|----------|
| 1. Auth & Login | 1 | 0 | 1 | 3 |
| 2. KI Office Account-Integration | 4 | 4 | 8 | 0 |
| 3. Security | 2 | 0 | 2 | 0 |
| 4. Routing & Navigation | 3 | 3 | 6 | 2 |
| 5. Modul-Smoke-Tests | 2 | 4 | 6 | 0 |
| 6. Core Flows (E2E) | 2 | 5 | 7 | 0 |
| 7. Edge Functions | 1 | 3 | 4 | 0 |
| 8. API-Schnittstellen (extern) | 0 | 0 | 0 | 0 |
| **Gesamt** | **15** | **19** | **34** | **5** |

---

## 1. Authentifizierung & Login

| # | Aufgabe | Prio | Status | Notizen |
|---|---------|------|--------|---------|
| 1.1 | Google Login (Lovable Cloud Managed) | P0 | ✅ Aktiv | Kein eigener Key nötig |
| 1.2 | Apple Login (Lovable Cloud Managed) | P0 | ✅ Aktiv | Kein eigener Key nötig |
| 1.3 | E-Mail/Passwort Login | P0 | ✅ Aktiv | Standard-Auth |
| 1.4 | Passwort-Reset-Flow E2E testen | P0 | ⬜ Offen | TC-A03: /reset-password Seite prüfen |

---

## 2. KI Office — Account-Integration (Google, Microsoft, IMAP)

> **Blocker**: Google-Integration nutzt falsche Auth-Methode (`supabase.auth.signInWithOAuth`).  
> **Blocker**: Microsoft ist nur Platzhalter.  
> **IMAP**: Backend implementiert, E2E-Test steht aus.

### 2.1 Credentials beschaffen (User-Aufgabe)

| # | Aufgabe | Prio | Status | Anleitung |
|---|---------|------|--------|-----------|
| 2.1.1 | Google Cloud OAuth 2.0 Client | P0 | ⬜ Offen | console.cloud.google.com → Credentials |
| 2.1.2 | Google Scopes: Gmail, Calendar, People API | P0 | ⬜ Offen | APIs & Services → Library |
| 2.1.3 | Azure App Registration | P1 | ⬜ Offen | portal.azure.com → App registrations |
| 2.1.4 | Azure Scopes: Mail, Calendars, Contacts | P1 | ⬜ Offen | API permissions → Microsoft Graph |

### 2.2 Secrets speichern (User-Aufgabe)

| # | Secret | Prio | Status | Vorhanden? |
|---|--------|------|--------|------------|
| 2.2.1 | `GOOGLE_OAUTH_CLIENT_ID` | P0 | ⬜ Offen | ❌ Nicht vorhanden |
| 2.2.2 | `GOOGLE_OAUTH_CLIENT_SECRET` | P0 | ⬜ Offen | ❌ Nicht vorhanden |
| 2.2.3 | `MICROSOFT_OAUTH_CLIENT_ID` | P1 | ⬜ Offen | ❌ Nicht vorhanden |
| 2.2.4 | `MICROSOFT_OAUTH_CLIENT_SECRET` | P1 | ⬜ Offen | ❌ Nicht vorhanden |

### 2.3 Code-Änderungen (AI-Aufgabe — nach Secrets)

| # | Aufgabe | Prio | Status |
|---|---------|------|--------|
| 2.3.1 | Edge Function `sot-oauth-exchange` | P0 | ⬜ Offen |
| 2.3.2 | OAuth-Callback-Seite | P0 | ⬜ Offen |
| 2.3.3 | AccountIntegrationDialog reparieren (Google) | P0 | ⬜ Offen |
| 2.3.4 | AccountIntegrationDialog erweitern (Microsoft) | P1 | ⬜ Offen |
| 2.3.5 | Token-Refresh in sot-mail-sync | P1 | ⬜ Offen |
| 2.3.6 | Token-Refresh in sot-calendar-sync | P1 | ⬜ Offen |
| 2.3.7 | Token-Refresh in sot-contacts-sync | P1 | ⬜ Offen |
| 2.3.8 | IMAP E2E Test | P1 | ⬜ Offen |

---

## 3. Security (Linter-Ergebnisse)

| # | Aufgabe | Prio | Status | Quelle |
|---|---------|------|--------|--------|
| 3.1 | OTP Expiry verkürzen (aktuell zu lang) | P0 | ⬜ Offen | Supabase Linter WARN |
| 3.2 | Leaked Password Protection aktivieren | P0 | ⬜ Offen | Supabase Linter WARN |

---

## 4. Routing & Navigation (aus beta_readiness_backlog.json)

| # | Test-Case | Prio | Status | Notizen |
|---|-----------|------|--------|---------|
| 4.1 | TC-A07: Unauth-Zugriff /portal → Redirect | P0 | ⬜ Testen | Automatisiert: PASS (verifizieren) |
| 4.2 | TC-A08: Unauth-Zugriff /admin → Redirect | P0 | ⬜ Testen | |
| 4.3 | TC-A09: Non-Admin auf /admin → Redirect /portal | P0 | ⬜ Testen | |
| 4.4 | TC-B03: Zone-3-Websites laden | P1 | ✅ Pass | Browser-verifiziert |
| 4.5 | TC-B04: Legacy Redirects (18 Stück) | P1 | ⬜ Testen | |
| 4.6 | TC-B05: 404-Seite | P1 | ✅ Pass | Verifiziert |
| 4.7 | TC-B06: Deep-Link-Verhalten | P1 | ⬜ Testen | |
| 4.8 | TC-B07: tile_catalog ↔ routesManifest Sync | P1 | ⬜ Testen | |

---

## 5. Modul-Smoke-Tests

| # | Test-Case | Prio | Status | Notizen |
|---|-----------|------|--------|---------|
| 5.1 | TC-B01: Alle 23 Zone-2-Module laden | P0 | ⬜ Testen | Console Errors prüfen |
| 5.2 | TC-B02: Alle Zone-1-Admin-Routen laden | P0 | ⬜ Testen | 50+ Routen |
| 5.3 | TC-C01: Dashboard Widgets | P1 | ⬜ Testen | |
| 5.4 | TC-C02: Stammdaten Smoke | P1 | ⬜ Testen | |
| 5.5 | TC-C03: KI Office Smoke | P1 | ⬜ Testen | |
| 5.6 | TC-C04: DMS Smoke | P1 | ⬜ Testen | |

---

## 6. Core Flows (End-to-End)

| # | Test-Case | Prio | Status | Notizen |
|---|-----------|------|--------|---------|
| 6.1 | TC-A10: Tenant-Isolation (RLS) | P0 | ⬜ Testen | Zwei Tenants nötig |
| 6.2 | TC-E01: Immobilie erstellen (MOD-04) | P0 | ⬜ Testen | Golden Path |
| 6.3 | TC-E02: DMS Upload + Ordner | P1 | ⬜ Testen | |
| 6.4 | TC-E03: Finanzierung Selbstauskunft | P1 | ⬜ Testen | |
| 6.5 | TC-E04: Dashboard Widgets laden | P1 | ⬜ Testen | |
| 6.6 | TC-E05: Stammdaten Profil bearbeiten | P1 | ⬜ Testen | |
| 6.7 | TC-E08: PV-Anlage anlegen | P2 | ⬜ Testen | |

---

## 7. Edge Functions

| # | Test-Case | Prio | Status | Notizen |
|---|-----------|------|--------|---------|
| 7.1 | TC-F01: sot-create-test-user | P0 | ⬜ Testen | Muss funktionieren für Testaccounts |
| 7.2 | TC-F02: sot-armstrong-advisor | P1 | ⬜ Testen | KI-Antwort prüfen |
| 7.3 | TC-F03: sot-dms-download-url | P1 | ⬜ Testen | Signed URL |
| 7.4 | TC-F04: sot-mail-send | P1 | ⬜ Testen | E-Mail-Versand (Resend) |

---

## 8. API-Schnittstellen — Übersicht aller externen Integrationen

> **Status-Legende**: ✅ = Secret vorhanden & Code implementiert | ⚠️ = Secret vorhanden, Code teilweise | ❌ = Secret fehlt | 🔲 = Nicht begonnen

| # | Service | Secret | Code | Genutzt in | Status |
|---|---------|--------|------|------------|--------|
| 8.1 | **Resend** (E-Mail-Versand) | `RESEND_API_KEY` ✅ | ✅ | sot-mail-send, finance-document-reminder, sot-finance-manager-notify | ✅ Bereit |
| 8.2 | **OpenAI** (Armstrong KI) | `OPENAI_API_KEY` ✅ | ✅ | sot-armstrong-advisor | ✅ Bereit |
| 8.3 | **NASA APOD** (Widget) | Kein Key nötig | ✅ | sot-nasa-apod | ✅ Bereit |
| 8.4 | **ZenQuotes** (Widget) | Kein Key nötig | ✅ | sot-zenquotes-proxy | ✅ Bereit |
| 8.5 | **Google Maps** | `GOOGLE_MAPS_API_KEY` ✅ | ✅ | Immobilien-Karte, Akquise | ✅ Bereit |
| 8.6 | **LiveKit** (Videocalls) | `LIVEKIT_*` ✅ | ✅ | VideocallsTab, VideocallRoom | ✅ Bereit |
| 8.7 | **ElevenLabs** (Audio) | `ELEVENLABS_API_KEY` ✅ | ✅ | Armstrong Voice | ✅ Bereit |
| 8.8 | **Apify** (Scraping) | `APIFY_API_TOKEN` ✅ | ✅ | sot-research-engine, sot-apify-portal-job | ✅ Bereit |
| 8.9 | **Firecrawl** (Web-Extraktion) | `FIRECRAWL_API_KEY` ✅ | ✅ | sot-research-engine | ✅ Bereit |
| 8.10 | **Perplexity** (KI-Suche) | `PERPLEXITY_API_KEY` ✅ | ⚠️ | Armstrong (geplant) | ⚠️ Teilweise |
| 8.11 | **Google OAuth** (Mail/Cal/Contacts) | ❌ Fehlt | ❌ | AccountIntegrationDialog | ❌ Blockiert |
| 8.12 | **Microsoft OAuth** (Mail/Cal/Contacts) | ❌ Fehlt | ❌ | AccountIntegrationDialog | ❌ Blockiert |
| 8.13 | **Stripe** (Billing) | ❌ Fehlt | 🔲 | Subscription (geplant) | 🔲 Phase 2 |
| 8.14 | **finAPI** (Banking) | ❌ Fehlt | 🔲 | Finanzen MOD-18 (geplant) | 🔲 Phase 2 |
| 8.15 | **ImmoScout24** | ❌ Fehlt | 🔲 | Listings (geplant) | 🔲 Phase 2 |
| 8.16 | **SMA/SolarLog** (PV-Monitoring) | ❌ Fehlt | 🔲 | MOD-19 PV (geplant) | 🔲 Phase 2 |
| 8.17 | **Camunda** (Workflow) | ❌ Fehlt | 🔲 | Orchestration (geplant) | 🔲 Phase 2 |

### Fazit API-Schnittstellen

- **10 von 17** Integrationen sind für Beta **betriebsbereit** (Secrets + Code vorhanden)
- **2 blockiert** durch fehlende OAuth-Credentials (Google & Microsoft für KI Office)
- **5 geplant** für spätere Phasen (Stripe, finAPI, ImmoScout, SMA, Camunda)

---

## 9. Was kann JETZT schon getestet werden (mit Testdaten)?

| Bereich | Testbar? | Hinweise |
|---------|----------|---------|
| Login/Logout/Reset | ✅ Ja | Alle Auth-Flows |
| Portal-Navigation (23 Module) | ✅ Ja | Alle Routen laden |
| Immobilien CRUD | ✅ Ja | Mit Testdaten |
| DMS Upload/Download | ✅ Ja | Storage funktioniert |
| Kontakte CRUD | ✅ Ja | Ohne externe Sync |
| Kalender-Events CRUD | ✅ Ja | Ohne externe Sync |
| Brief-Assistent | ✅ Ja | KI-gestützt via Armstrong |
| Finanzierung Selbstauskunft | ✅ Ja | Formular + Speichern |
| Dashboard Widgets | ✅ Ja | NASA, ZenQuotes, Rechner |
| Armstrong KI-Chat | ✅ Ja | OpenAI verbunden |
| Videocalls | ✅ Ja | LiveKit verbunden |
| WhatsApp | ⚠️ Eingeschränkt | Nur Konversations-UI |
| E-Mail via IMAP | ⚠️ Testbar | Braucht echtes IMAP-Konto |
| E-Mail via Google/Microsoft | ❌ Nein | Secrets fehlen |
| Kalender/Kontakte Sync (extern) | ❌ Nein | Secrets fehlen |
| Billing/Stripe | ❌ Nein | Phase 2 |

---

## Empfohlene Reihenfolge

### Phase A — Sofort testbar (ohne neue Secrets)
1. Security-Fixes (OTP Expiry, Leaked PW Protection)
2. Auth E2E Tests (TC-A01 bis TC-A12)
3. Routing Tests (TC-B01 bis TC-B07)
4. Modul-Smoke-Tests (TC-C01 bis TC-C06)
5. Core Flows (TC-E01 bis TC-E08)
6. Edge Function Tests (TC-F01 bis TC-F04)

### Phase B — Nach Credential-Beschaffung
7. Google OAuth Secrets speichern
8. sot-oauth-exchange + AccountIntegrationDialog reparieren
9. E-Mail/Kalender/Kontakte Sync E2E

### Phase C — Spätere Phasen
10. Microsoft OAuth
11. Stripe, finAPI, ImmoScout, SMA, Camunda

---

## Abhängigkeiten

```
Phase A: Sofort machbar → Security + Auth + Smoke + Core Flows
Phase B: Google Credentials → 2.2.1/2.2.2 → 2.3.x → E-Mail/Cal/Contacts Sync
Phase C: Azure Credentials → Microsoft Integration
Phase C: Stripe Keys → Billing
```

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2026-02-17 | Protokoll erstellt |
| 2026-02-17 | Komplettprüfung: Security-Linter, API-Schnittstellen-Übersicht, Testbarkeits-Matrix, Edge Functions, Secrets-Abgleich hinzugefügt |
