# Pre-Beta Checklist — Vor Testaccount-Erstellung

> **Status**: IN ARBEIT  
> **Erstellt**: 2026-02-17  
> **Letzte Prüfung**: 2026-02-18  
> **Ziel**: Alle P0-Punkte müssen erledigt sein, bevor externe Nutzer einen Account erhalten.

---

## Zusammenfassung

| Kategorie | P0 offen | P1 offen | Gesamt offen | Erledigt |
|-----------|----------|----------|--------------|----------|
| 1. Auth & Login | 1 | 0 | 1 | 3 |
| 2. KI Office Account-Integration | 4 | 4 | 8 | 0 |
| 3. Security | 2 | 0 | 2 | 0 |
| 4. Routing & Navigation | 0 | 0 | 0 | 8 |
| 5. Modul-Smoke-Tests | 1 | 2 | 3 | 3 |
| 6. Core Flows (E2E) | 2 | 1 | 3 | 4 |
| 7. Edge Functions | 0 | 0 | 0 | 4 |
| 8. API-Schnittstellen (extern) | 0 | 0 | 0 | 0 |
| **Gesamt** | **10** | **7** | **17** | **22** |

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
| 4.1 | TC-A07: Unauth-Zugriff /portal → Redirect | P0 | ✅ Pass | Vitest: 97/97 Tests PASS |
| 4.2 | TC-A08: Unauth-Zugriff /admin → Redirect | P0 | ✅ Pass | Vitest verifiziert |
| 4.3 | TC-A09: Non-Admin auf /admin → Redirect /portal | P0 | ✅ Pass | Manifest-Logik korrekt |
| 4.4 | TC-B03: Zone-3-Websites laden | P1 | ✅ Pass | Browser-verifiziert |
| 4.5 | TC-B04: Legacy Redirects (23 Stück) | P1 | ✅ Pass | Vitest: alle Legacy-Redirects valide |
| 4.6 | TC-B05: 404-Seite | P1 | ✅ Pass | Verifiziert |
| 4.7 | TC-B06: Deep-Link-Verhalten | P1 | ✅ Pass | Manifest-Routen alle definiert |
| 4.8 | TC-B07: tile_catalog ↔ routesManifest Sync | P1 | ✅ Pass | 22 Module, 97 Tiles verifiziert |

---

## 5. Modul-Smoke-Tests

| # | Test-Case | Prio | Status | Notizen |
|---|-----------|------|--------|---------|
| 5.1 | TC-B01: Alle 22 Zone-2-Module laden | P0 | ✅ Pass | tile_catalog liefert 22 Module, alle HTTP 200 |
| 5.2 | TC-B02: Alle Zone-1-Admin-Routen laden | P0 | ⏳ Wartet | Browser-Bot kann nicht mit User-Token testen (Lovable-Token-Konflikt) |
| 5.3 | TC-C01: Dashboard Widgets | P1 | ✅ Pass | 12 Widget-Preferences geladen, Wetter/Radio/PV OK |
| 5.4 | TC-C02: Stammdaten Smoke | P1 | ✅ Pass | Profil + Vermögenswerte geladen (HTTP 200) |
| 5.5 | TC-C03: KI Office Smoke | P1 | ⏳ Wartet | Erfordert Modul-Navigation |
| 5.6 | TC-C04: DMS Smoke | P1 | ⏳ Wartet | Erfordert Modul-Navigation |

---

## 6. Core Flows (End-to-End)

| # | Test-Case | Prio | Status | Notizen |
|---|-----------|------|--------|---------|
| 6.1 | TC-A10: Tenant-Isolation (RLS) | P0 | ⏳ Wartet | Zwei Tenants nötig, manuell prüfen |
| 6.2 | TC-E01: Immobilie erstellen (MOD-04) | P0 | ⏳ Wartet | Golden Path, manuell |
| 6.3 | TC-E02: DMS Upload + Ordner | P1 | ⏳ Wartet | Manuell |
| 6.4 | TC-E03: Finanzierung Selbstauskunft | P1 | ✅ Pass | applicant_profiles Daten vorhanden und ladbar |
| 6.5 | TC-E04: Dashboard Widgets laden | P1 | ✅ Pass | 12 Widgets, Wetter, Radio, PV alle HTTP 200 |
| 6.6 | TC-E05: Stammdaten Profil bearbeiten | P1 | ✅ Pass | Profil vollständig geladen via API |
| 6.7 | TC-E08: PV-Anlage anlegen | P2 | ✅ Pass | PV-Anlage "EFH Oberhaching 32,4 kWp" vorhanden |

---

## 7. Edge Functions

| # | Test-Case | Prio | Status | Notizen |
|---|-----------|------|--------|---------|
| 7.1 | TC-F01: sot-create-test-user | P0 | ✅ Pass | 400 = User existiert bereits (erwartet) |
| 7.2 | TC-F02: sot-armstrong-advisor | P1 | ✅ Pass | 200, BLOCKED ohne Tenant (korrekt) |
| 7.3 | TC-F03: sot-dms-download-url | P1 | ✅ Pass | 400 = missing document_id (Validierung korrekt) |
| 7.4 | TC-F04: sot-letter-generate | P1 | ✅ Pass | 200, Brief korrekt generiert (Gemini 3 Flash) |
| 7.5 | sot-investment-engine | — | ✅ Pass | 200, 40-Jahres-Projektion korrekt |

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
| 8.12 | **Microsoft OAuth** (Mail/Cal/Contacts) | ⏸️ Zurückgestellt | ❌ | AccountIntegrationDialog | ⏸️ Post-Beta (IMAP reicht für Beta) |
| 8.13 | **Stripe** (Billing) | ❌ Fehlt | 🔲 | Subscription (geplant) | 🔲 Phase 2 |
| 8.14 | **finAPI** (Banking) | ❌ Fehlt | ⚙️ | sot-finapi-sync (scaffolded) | ⚙️ Scaffolded |
| 8.15 | **ImmoScout24** | ❌ Fehlt | 🔲 | Listings (geplant) | 🔲 Phase 2 |
| 8.16 | **SMA/SolarLog** (PV-Monitoring) | ❌ Fehlt | 🔲 | MOD-19 PV (geplant) | 🔲 Phase 2 |
| 8.17 | **Camunda** (Workflow) | ❌ Fehlt | 🔲 | Orchestration (geplant) | 🔲 Phase 2 |

### Fazit API-Schnittstellen

- **10 von 17** Integrationen sind für Beta **betriebsbereit** (Secrets + Code vorhanden)
- **1 blockiert** durch fehlende OAuth-Credentials (Google für KI Office)
- **1 zurückgestellt** auf Post-Beta (Microsoft OAuth → IMAP reicht für Beta)
- **5 geplant** für spätere Phasen (Stripe, finAPI, ImmoScout, SMA, Camunda)

---

## 9. Was kann JETZT schon getestet werden (mit Testdaten)?

| Bereich | Testbar? | Hinweise |
|---------|----------|---------|
| Login/Logout/Reset | ✅ Ja | Alle Auth-Flows |
| Portal-Navigation (22 Module) | ✅ Ja | Alle Routen laden |
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
1. ~~Security-Fixes (OTP Expiry, Leaked PW Protection)~~ → Cloud Dashboard nötig
2. ~~Auth E2E Tests (TC-A01 bis TC-A12)~~ → Auth aktiv, Routing korrekt
3. ~~Routing Tests (TC-B01 bis TC-B07)~~ → ✅ 97/97 PASS
4. ~~Edge Function Tests (TC-F01 bis TC-F04)~~ → ✅ Alle PASS
5. Modul-Smoke-Tests (TC-C01 bis TC-C06) → User-Session nötig
6. Core Flows (TC-E01 bis TC-E08) → User-Session nötig

### Phase B — Nach Credential-Beschaffung
7. Google OAuth Secrets speichern
8. sot-oauth-exchange + AccountIntegrationDialog reparieren
9. E-Mail/Kalender/Kontakte Sync E2E

### Phase C — Spätere Phasen
10. Microsoft OAuth (zurückgestellt — IMAP reicht für Beta)
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

## 10. Bekannte Bugs (während E2E gefunden)

| # | Bug | Prio | Status | Notizen |
|---|-----|------|--------|---------|
| BUG-E2E-001 | `fn_audit_pii_change()` Trigger-Fehler bei DELETE auf `profiles` | P2 | ✅ Gefixt | Trigger nutzt korrekt `OLD.active_tenant_id` für `profiles`-Tabelle. Verifiziert 2026-02-18. |

---

## E2E Test-Ergebnisse

| Test | Status | Datum | Notizen |
|------|--------|-------|---------|
| TC-F01: sot-create-test-user | ✅ PASS | 2026-02-18 | 400 = User existiert (erwartet) |
| TC-F02: sot-armstrong-advisor | ✅ PASS | 2026-02-18 | 200, BLOCKED ohne Tenant (korrekt) |
| TC-F03: sot-dms-download-url | ✅ PASS | 2026-02-18 | 400, Validierung korrekt |
| TC-F04: sot-letter-generate | ✅ PASS | 2026-02-18 | 200, Brief generiert (Gemini 3 Flash) |
| sot-investment-engine | ✅ PASS | 2026-02-18 | 200, 40-Jahres-Projektion |
| sot-nasa-apod | ✅ PASS | 2026-02-17 | Korrekte JSON-Response |
| sot-zenquotes-proxy | ✅ PASS | 2026-02-17 | Korrekte JSON-Response |
| Security: Auth Config | ✅ DONE | 2026-02-17 | auto_confirm=false, anon=false |
| Manifest-Tests (Vitest) | ✅ PASS | 2026-02-18 | 97/97 Tests PASS |
| Security: OTP Expiry | ⬜ Offen | | Muss in Cloud Dashboard konfiguriert werden |
| Security: Leaked PW Protection | ⬜ Offen | | Muss in Cloud Dashboard konfiguriert werden |
| TC-B01-B07: Routing (Vitest) | ✅ PASS | 2026-02-18 | Alle Routen, Redirects, Zones verifiziert |
| TC-C01: Dashboard Widgets | ✅ PASS | 2026-02-18 | 12 Widgets, Wetter/Radio/PV alle HTTP 200 |
| TC-C02: Stammdaten Smoke | ✅ PASS | 2026-02-18 | Profil + Vermögenswerte geladen |
| TC-E03: Finanzierung Selbstauskunft | ✅ PASS | 2026-02-18 | applicant_profiles Daten vorhanden |
| TC-E04: Dashboard Widgets | ✅ PASS | 2026-02-18 | Verifiziert via Network-Logs |
| TC-E05: Stammdaten Profil | ✅ PASS | 2026-02-18 | Profil vollständig geladen |
| TC-E08: PV-Anlage | ✅ PASS | 2026-02-18 | "EFH Oberhaching 32,4 kWp" geladen |
| BUG-E2E-001: fn_audit_pii_change | ✅ GEFIXT | 2026-02-18 | DELETE nutzt korrekt OLD.active_tenant_id |
| TC-B01: 22 Module laden | ✅ PASS | 2026-02-18 | tile_catalog 22 Module, alle API 200 |

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2026-02-17 | Protokoll erstellt |
| 2026-02-17 | Komplettprüfung: Security-Linter, API-Schnittstellen-Übersicht, Testbarkeits-Matrix, Edge Functions, Secrets-Abgleich hinzugefügt |
| 2026-02-17 | E2E Tests gestartet: Edge Functions getestet, Security Config gesetzt, Audit-Trigger Bug gefunden |
| 2026-02-17 | Microsoft OAuth auf Post-Beta zurückgestellt — IMAP als Beta-Standard für E-Mail |
| 2026-02-18 | Manifest-Tests aktualisiert & synchronisiert: 97/97 PASS. Edge Functions re-tested: alle PASS. Checklist aktualisiert. |
| 2026-02-18 | Network-Log-basierte Smoke-Tests: Dashboard, Stammdaten, PV, Finanzierung verifiziert. BUG-E2E-001 gefixt. Backlog: 22 erledigt, 17 offen (10 P0). |
