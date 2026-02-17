

## Beta-Readiness Kompletttest — Testplan und Backlog-Erstellung

### Ausgangslage

Nach Durchsicht des gesamten Codes, der Manifeste, Engines, Auth-Flows, Router und Validatoren ergibt sich folgendes Bild:

- **23 Zone-2-Module** (MOD-00 bis MOD-22) mit jeweils 3-8 Tiles
- **7 registrierte Golden Paths** (MOD-04, MOD-07, MOD-08, MOD-13, GP-VERMIETUNG, GP-LEAD, GP-FINANCE-Z3)
- **15 Golden Path Prozesse** in der Prozess-Registry
- **~100 Edge Functions** (sot-*)
- **4 Zone-3-Websites** (Kaufy, FutureRoom, SoT, Acquiary)
- **Zone 1 Admin** mit ~50 Routen
- **1 aktiver Console-Error**: GP-FINANCE-Z3 Step "assign_manager" fehlt `on_error`
- **Auth**: Password-Login + OTP vorhanden, Reset-Password-Page existiert, ABER kein "Passwort vergessen"-Link auf der Login-Seite

---

### Gefundene Probleme (vor Testbeginn)

| ID | Prio | Bereich | Problem |
|----|------|---------|---------|
| BUG-001 | P0 | Auth | Kein "Passwort vergessen"-Link auf `/auth` — User haben keine Moeglichkeit, ein Reset auszuloesen |
| BUG-002 | P0 | GoldenPath | Console Error: GP-FINANCE-Z3 Step "assign_manager" hat kein `on_error` definiert |
| BUG-003 | P1 | Manifest | `specialRoutes` in routesManifest.ts listet `/auth/reset-password` nicht (Route existiert nur in App.tsx) |
| BUG-004 | P1 | Auth | Kein Signup-Flow auf `/auth` — nur Login. Fuer Beta-Tester muss entweder Signup aktiviert oder Test-User-Creation per Admin sichergestellt werden |

---

### Umsetzungsplan: Backlog-Datei + Fixes

#### 1. Backlog-Datei erstellen: `spec/audit/beta_readiness_backlog.json`

Strukturierte JSON-Datei mit allen Testfaellen, gruppiert nach Phasen:

**Phase A: Auth und Access Control (P0)**
- TC-A01: Login mit Passwort (Erfolg + Fehler)
- TC-A02: Login mit OTP (Erfolg + Fehler + Resend)
- TC-A03: Passwort vergessen Flow (Link auf Login-Seite -> E-Mail -> Reset-Page)
- TC-A04: Session Persistence (Tab schliessen, neu oeffnen)
- TC-A05: Token Refresh (Access Token abgelaufen, Refresh Token gueltig)
- TC-A06: Logout (Session-Clear, Redirect zu /auth)
- TC-A07: Unauth-Zugriff auf /portal (Redirect zu /auth)
- TC-A08: Unauth-Zugriff auf /admin (Redirect zu /auth)
- TC-A09: Zone-1-Zugriff als Non-Admin (Redirect zu /portal)
- TC-A10: Tenant-Isolation (User A sieht keine Daten von Tenant B)
- TC-A11: Platform-Admin Bypass (Zugriff auf alle Tenants)
- TC-A12: Test-User erstellen via sot-create-test-user Edge Function

**Phase B: Routing und Manifest (P0)**
- TC-B01: Alle 23 Zone-2-Module laden ohne Console Errors
- TC-B02: Alle Zone-1-Admin-Routen laden (50+ Routen)
- TC-B03: Alle 4 Zone-3-Websites laden (Kaufy, FutureRoom, SoT, Acquiary)
- TC-B04: Legacy Redirects funktionieren (18 Redirects)
- TC-B05: 404-Seite fuer unbekannte Routen
- TC-B06: Deep-Link-Verhalten (direkter URL-Aufruf einer Modul-Seite)
- TC-B07: tile_catalog Sync mit routesManifest (DEV-Validator)

**Phase C: Module Smoke Tests (P1)**
- Fuer jedes der 23 Module: Seite laedt, keine Console Errors, Default-Tile wird angezeigt
- Empty States vorhanden (CTA + Erklaerung)
- Demo-Widgets sichtbar und mit DEMO-Badge markiert

**Phase D: Golden Path Engine (P0)**
- TC-D01: DEV-Validator laeuft fehlerfrei (aktuell: 1 Fehler bei GP-FINANCE-Z3)
- TC-D02: GoldenPathGuard blockiert Zugriff bei fehlenden Preconditions
- TC-D03: Backbone-Validierung (keine verbotenen Cross-Zone-Directions)
- TC-D04: Ledger-Event Whitelist vollstaendig

**Phase E: Core Flows Deep Test (P1)**
- TC-E01: Immobilie erstellen (MOD-04: Portfolio -> Neu -> Akte)
- TC-E02: DMS Upload + Ordnerstruktur (MOD-03)
- TC-E03: Finanzierung Selbstauskunft ausfuellen (MOD-07)
- TC-E04: Dashboard Widgets laden (MOD-00)
- TC-E05: Stammdaten Profil bearbeiten (MOD-01)
- TC-E06: KI Office E-Mail senden (MOD-02)
- TC-E07: Finanzen Dashboard (MOD-18)
- TC-E08: Photovoltaik Anlage anlegen (MOD-19)

**Phase F: Edge Functions Spot-Check (P1)**
- TC-F01: sot-create-test-user (Auth-protected, creates verified user)
- TC-F02: sot-armstrong-advisor (AI response)
- TC-F03: sot-dms-download-url (Signed URL generation)
- TC-F04: sot-mail-send (E-Mail dispatch)

**Phase G: Zone-3 Websites (P2)**
- TC-G01: SoT Website Hero + 8 Widgets laden
- TC-G02: SoT Unterseiten (Management, Real Estate, Finance, Energy, Karriere)
- TC-G03: Kaufy Home + Expose-Seite
- TC-G04: FutureRoom Home + Login + Akte
- TC-G05: Acquiary Home + Objekt anbieten

#### 2. Sofort-Fixes (im selben Commit)

**FIX-001 (P0)**: "Passwort vergessen"-Link auf Auth-Seite hinzufuegen
- In `src/pages/Auth.tsx` einen Link unter dem Password-Feld einfuegen
- Nutzt `supabase.auth.resetPasswordForEmail()` mit Redirect zu `/auth/reset-password`
- Erfordert eine Zwischenseite oder ein erweitertes Step-Handling in Auth.tsx

**FIX-002 (P0)**: GP-FINANCE-Z3 `on_error` fuer Step "assign_manager" ergaenzen
- In `src/manifests/goldenPaths/GP_FINANCE_Z3.ts` den fehlenden Fail-State hinzufuegen
- Ledger-Event `finance.z3.manager.assignment.error` ist bereits in der Whitelist

**FIX-003 (P1)**: specialRoutes in routesManifest.ts ergaenzen
- `/auth/reset-password` als SpecialRoute eintragen (Manifest-Konsistenz)

#### 3. Dateien die erstellt/geaendert werden

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `spec/audit/beta_readiness_backlog.json` | NEU | Vollstaendiger Testplan mit ~50 Testfaellen, Prio, Akzeptanzkriterien |
| `src/pages/Auth.tsx` | AENDERN | "Passwort vergessen"-Link + Reset-Flow hinzufuegen |
| `src/manifests/goldenPaths/GP_FINANCE_Z3.ts` | AENDERN | `on_error` Fail-State fuer "assign_manager" Step |
| `src/manifests/routesManifest.ts` | AENDERN | specialRoutes um reset-password ergaenzen |

---

### Technische Details

**FIX-001 Implementierung**: Neuer Step `'forgot'` in Auth.tsx mit E-Mail-Eingabe und `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth/reset-password' })`. Link "Passwort vergessen?" unter dem Passwort-Feld.

**FIX-002 Implementierung**: In GP_FINANCE_Z3.ts beim Step mit `id: 'assign_manager'` ergaenzen:
```
on_error: {
  recovery: 'escalate_to_z1',
  ledger_event: 'finance.z3.manager.assignment.error',
  message: 'Manager-Zuweisung fehlgeschlagen',
}
```

**Backlog-Struktur**: Jeder Eintrag hat `id`, `phase`, `priority`, `title`, `steps`, `expected_result`, `status` (pending/pass/fail), `notes`.

