# SYSTEM CHECK BACKLOG — 2026-02-25 (Rev. 2)

> **Erstellt:** 2026-02-25 11:31 UTC  
> **Aktualisiert:** 2026-02-25 12:00 UTC  
> **Prüfer:** AI System Audit  
> **Status:** ANALYSE ABGESCHLOSSEN — Reparaturplan erstellt

---

## 1. TENANT-ÜBERSICHT (5 Tenants)

| # | Tenant | ID | Mode | Org-Type | Members | Properties | Contacts | Listings | Storage Nodes | Tiles | Status |
|---|--------|----|------|----------|---------|------------|----------|----------|---------------|-------|--------|
| 1 | System of a Town (Golden) | `a0000000-...0001` | reference | internal | 1 | 0 | 0 | 0 | 0 | 23 | ✅ CLEAN |
| 2 | Demo | `c3123104-...7ece` | demo | client | 2 | 3 | 5 | 3 | 236 | 22 | ✅ BESTÜCKT |
| 3 | bernhard.marchner | `80746f1a-...78fdf0` | production | client | 1 | 0 | 0 | 0 | 26 | 23 | ✅ CLEAN |
| 4 | Lennox (Robyn) | `eac1778a-...9505` | production | partner | 1 | 0 | 0 | 0 | 32 | 16 | ✅ CLEAN |
| 5 | UNITYS GmbH (Ralph) | `406f5f7a-...db72` | production | client | 1 | 0 | 0 | 14 docs | 468 | 21 | ⚠️ PRÜFEN |

### Tenant-Detail: Demo (`c3123104`)

| Entity | Count | Details |
|--------|-------|---------|
| Properties | 3 | BER-01, MUC-01, HH-01 — alle `sale_enabled=true`, `status=active` ✅ |
| Units | 3 | WE-01 pro Property ✅ |
| Contacts | 5 | Mustermann, Bergmann, Hoffmann, Weber ✅ |
| Listings | 3 | Alle `active` mit korrekten Preisen (349k, 520k, 210k) ✅ |
| Listing Publications | 6 | 3×partner_network + 3×kaufy, alle `active` ✅ |
| Leases | 3 | Alle `active` (1150€, 1580€, 770€) ✅ |
| Finance Requests | 2 | 1× `ready` (Kauf, BER-01), 1× `draft` (Umschuldung) ✅ |
| Property Features | 6 | kaufy + website_visibility ✅ |
| Commissions | 0 | Noch keine Demo-Provisionen |
| Leads | 0 | Noch keine Demo-Leads |

### Tenant-Detail: UNITYS (`406f5f7a`)

| Entity | Count | Anmerkung |
|--------|-------|-----------|
| Documents | 14 | Hochgeladene Dateien via Magic Intake ✅ |
| Storage Nodes | 468 | DMS-Ordnerstruktur (auto-generiert bei Signup) ✅ |
| Tiles | 21 | ⚠️ Fehlt 1 Tile — super_manager sollte 22 haben |
| Properties/Contacts/Listings | 0 | Korrekt leer für neuen Account ✅ |

---

## 2. USER/PROFILE-ÜBERSICHT (5 User)

| # | User | E-Mail | Rolle | Membership Role | Tenant | Status |
|---|------|--------|-------|-----------------|--------|--------|
| 1 | Thomas Stelzl | thomas.stelzl@systemofadown.com | platform_admin, akquise_manager | platform_admin (2 Tenants) | Golden + Demo | ✅ |
| 2 | Max Mustermann | demo@systemofatown.com | — | org_admin | Demo | ✅ |
| 3 | Bernhard Marchner | bernhard.marchner@systemofatown.com | super_user | org_admin | Marchner | ✅ |
| 4 | Robyn | robyn@lennoxandfriends.app | — | pet_manager | Lennox | ✅ |
| 5 | Ralph Reinhold | rr@unitys.com | — | super_manager | UNITYS | ⚠️ user_roles fehlt |

---

## 3. DATENINTEGRITÄT

| Check | Ergebnis | Details |
|-------|----------|---------|
| Orphaned Properties | ✅ 0 | |
| Orphaned Contacts | ✅ 0 | |
| Orphaned Units | ✅ 0 | |
| Orphaned Listings | ✅ 0 | |
| Orphaned Leases | ✅ 0 | |
| Orphaned Storage Nodes | ✅ 0 | |
| Orphaned Documents | ✅ 0 | |
| Cross-Tenant Leaks | ✅ KEINE | |

---

## 4. BEFUNDE — ALLE (Prio-sortiert)

### ~~BUG-001: Kaufy Zone-3 Website 404~~ → **FALSE POSITIVE (geschlossen)**
- **Status:** ✅ KEIN BUG
- **Erklärung:** Route `/website/kaufy` funktioniert korrekt. PIN-Gate (2710) → Hero → SearchBar → Footer alle sichtbar und funktional. Die Route `/kaufy` existiert nicht direkt — der Zugang erfolgt über:
  - Preview: `/website/kaufy` (intern)
  - Produktion: `www.kaufy.immo` → Domain-Map → `/website/kaufy`
  - Legacy: `/kaufy2026` → Redirect auf `/website/kaufy`
- **Kaufy-Routing-Dokumentation:**
  - `domainMap.ts`: `kaufy.immo` → `{ siteKey: 'kaufy', base: '/website/kaufy' }`
  - `routesManifest.ts`: Zone 3 `kaufy` → base `/website/kaufy`, 7 Routen
  - Legacy-Redirect: `/kaufy2026` → `/website/kaufy` (ZBC-R08)

### ~~BUG-002: Immomanager Katalog zeigt 0 Objekte für externe Tenants~~ → **GEFIXT**
- **Status:** ✅ GEFIXT (2026-02-25 12:15)
- **Fix:** Cross-Tenant RLS Policies für `listing_publications`, `listings` und `properties` erstellt. RESTRICTIVE Policies um partner_network/kaufy Ausnahmen erweitert. KatalogTab Query um `property_id` Feld ergänzt.
- **Verifiziert:** Ralph Reinhold (UNITYS) sieht jetzt 3 Objekte im Katalog (Berlin, München, Hamburg)

### ~~BUG-003: UNITYS hat nur 21 statt 22 Tiles~~ → **FALSE POSITIVE (geschlossen)**
- **Status:** ✅ KEIN BUG
- **Erklärung:** `super_manager` hat by design 21 Module (14 BASE_TILES + 7 ROLE_EXTRA_TILES). MOD-22 (Pet Manager) ist exklusiv für `pet_manager`. Dies ist korrekt per `rolesMatrix.ts` SSOT.

---

## 5. GOLDEN PATH VALIDATOR FEHLER (DEV-ONLY, 27 Fehler gesamt)

### Kategorie A: Route-Mismatches (7 Fehler)
| # | GP | Step | Route | Problem |
|---|-----|------|-------|---------|
| GP-RM-01 | MOD-08 | `research_outbound` | `/portal/akquise-manager/:mandateId` | Route nicht im Manifest |
| GP-RM-02 | MOD-08 | `analysis_reporting` | `/portal/akquise-manager/:mandateId` | Route nicht im Manifest |
| GP-RM-03 | MOD-13 | `create_project` | `/portal/projekte` | Route nicht im Manifest |
| GP-RM-04 | ZONE-3 | `convert_lead` | `/portal/partner/:partnerId` | Route nicht im Manifest |
| GP-RM-05 | ZONE-1 | `submit_application` | `/portal/stammdaten` | Route nicht im Manifest |
| GP-RM-06 | GP-FINANCE-Z3 | `manager_processing` | `/portal/finanzierung-manager/:mandateId` | Route nicht im Manifest |
| GP-RM-07 | GP-PET | `provider_confirmation` + `first_booking` | `/portal/petmanager` + `/portal/petmanager/kalender` | Route nicht im Manifest |

### Kategorie B: Fehlende Fail-States (14 Fehler)
| # | GP | Step | Fehlend |
|---|-----|------|---------|
| GP-FS-01 | ZONE-3 | `capture_lead` | on_timeout |
| GP-FS-02 | GP-FINANCE-Z3 | `z3_form_submit` | on_timeout |
| GP-FS-03 | GP-FINANCE-Z3 | `bank_submission` | on_timeout |
| GP-FS-04 | GP-PET | `capture_lead` | on_timeout |
| GP-FS-05 | GP-PET | `booking_payment` | on_timeout |
| GP-FS-06 | GP-COMMISSION | `lead_received` | on_timeout + on_error |
| GP-FS-07 | GP-COMMISSION | `system_fee_paid` | on_error |
| GP-FS-08 | GP-COMMISSION | `lead_assigned` | on_error |
| GP-FS-09 | ZONE-1 | `submit_application` | on_timeout |
| GP-FS-10 | ZONE-1 | `first_client_assigned` | on_timeout + on_error |
| GP-FS-11 | ZONE-1 | `client_request_received` | on_timeout |
| GP-FS-12 | ZONE-1 | `manager_notified` | on_timeout |

### Kategorie C: Ledger-Events nicht in Whitelist (4 Fehler)
| # | GP | Event |
|---|-----|-------|
| GP-LE-01 | GP-PET | `pet.booking.requested` |
| GP-LE-02 | GP-PET | `pet.booking.provider_confirmed` |
| GP-LE-03 | GP-PET | `pet.booking.payment_received` |
| GP-LE-04 | GP-PET | `pet.booking.payment.failed` |

### Kategorie D: Guard nicht registriert (6 Warnungen)
| # | GP | Problem |
|---|-----|---------|
| GP-GR-01 | MOD-08 | Keine Route mit `goldenPath.moduleCode="MOD-08"` |
| GP-GR-02 | MOD-05 | Keine Route mit `goldenPath.moduleCode="MOD-05"` |
| GP-GR-03 | ZONE-3 | Keine Route mit `goldenPath.moduleCode="ZONE-3"` |
| GP-GR-04 | GP-FINANCE-Z3 | Keine Route mit `goldenPath.moduleCode="GP-FINANCE-Z3"` |
| GP-GR-05 | GP-PET | Keine Route mit `goldenPath.moduleCode="GP-PET"` |
| GP-GR-06 | ZONE-1 | Keine Route mit `goldenPath.moduleCode="ZONE-1"` (2× gemeldet) |

**Impact:** Nur in DEV sichtbar. Keine Auswirkung auf User. Governance-Compliance nicht erfüllt.

---

## 6. REACT WARNINGS (PRIO 3 — Kosmetisch)

| # | Warning | Component |
|---|---------|-----------|
| RW-001 | forwardRef missing | `SocialLoginButtons > AppleIcon` |
| RW-002 | forwardRef missing | `SocialLoginButtons > GoogleIcon` |
| RW-003 | forwardRef missing | `App > Toaster` |
| RW-004 | forwardRef missing | `Toaster > ToastProvider` |

---

## 7. MANIFEST & ENGINE STATUS

### Engines (12/12 ✅)
Alle registriert in `src/engines/index.ts`: ENG-AKQUISE, ENG-FINANCE, ENG-PROVISION, ENG-BWA, ENG-PROJEKT, ENG-NK, ENG-DEMO, ENG-FINUEB, ENG-VORSORGE, ENG-VVSTEUER, ENG-KONTOMATCH, ENG-MKTDIR

### Module Freeze Status
| Status | Module |
|--------|--------|
| ❌ unfrozen | MOD-01, MOD-08, MOD-09, MOD-13 |
| ✅ frozen | MOD-00, MOD-02–07, MOD-10–22 (alle anderen) |

### Zone 3 Websites (5/5 ✅)
| Site | Base | Layout | PIN-Gate | Status |
|------|------|--------|----------|--------|
| kaufy | `/website/kaufy` | Kaufy2026Layout | ✅ 2710 | ✅ Funktional |
| futureroom | `/website/futureroom` | FutureRoomLayout | ✅ | ✅ |
| sot | `/website/sot` | SotLayout | ✅ | ✅ |
| acquiary | `/website/acquiary` | AcquiaryLayout | ✅ | ✅ |
| lennox | `/website/tierservice` | LennoxLayout | ✅ | ✅ |

---

## 8. DEMO-DATEN GOVERNANCE

| Prüfpunkt | Status |
|-----------|--------|
| CSV SSOT vorhanden | ✅ |
| DB ↔ CSV synchron | ✅ |
| Dedup-Fix (property_id) | ✅ Kaufy, SucheTab, KatalogTab |
| Hardcoded Data in Modules | ✅ Keine Violations |

---

## 9. REPARATURPLAN (Priorisiert)

### PRIO 1 — Alle geschlossen ✅

| # | Ticket | Status | Beschreibung |
|---|--------|--------|-------------|
| ~~FIX-001~~ | ~~BUG-001~~ | ✅ FALSE POSITIVE | Kaufy Route funktioniert korrekt via `/website/kaufy` |
| ~~FIX-002~~ | ~~BUG-002~~ | ✅ GEFIXT | Cross-Tenant RLS Policies + KatalogTab property_id Fix |
| ~~FIX-003~~ | ~~BUG-003~~ | ✅ FALSE POSITIVE | super_manager hat 21 Module by design (rolesMatrix.ts) |

### PRIO 2 — Governance (nach Account-Erstellung möglich)

| # | Ticket | Aufwand | Beschreibung |
|---|--------|---------|-------------|
| FIX-004 | GP-FS-01–12 | 30 min | 14 fehlende Fail-States (on_timeout/on_error) in 5 Golden Paths |
| FIX-005 | GP-RM-01–07 | 20 min | 7 Route-Mismatches in Golden Path Steps korrigieren |
| FIX-006 | GP-LE-01–04 | 10 min | 4 Pet-Events zur Ledger-Whitelist hinzufügen |
| FIX-007 | GP-GR-01–06 | 15 min | 6 Golden Path Guards im Manifest registrieren |

### PRIO 3 — Kosmetisch

| # | Ticket | Aufwand | Beschreibung |
|---|--------|---------|-------------|
| FIX-008 | RW-001–004 | 15 min | forwardRef für Icons und Toaster |

### PRIO 4 — Tracking (kein Fix nötig)

| # | Item | Details |
|---|------|---------|
| TRACK-001 | Demo-Tenant hat 0 Leads | Für Demo-Showcasing gewünscht |
| TRACK-002 | Demo-Tenant hat 0 Commissions | Für Demo-Showcasing gewünscht |
| TRACK-003 | 4 Module noch unfrozen | Nach Fixes re-freezeen: MOD-01, 08, 09, 13 |

---

## 10. GESAMTBEWERTUNG

| Bereich | Status |
|---------|--------|
| Datenbank-Integrität | ✅ Keine Orphans, keine Leaks |
| Tenant-Isolation | ✅ Alle 5 Tenants sauber getrennt |
| Demo-Daten | ✅ 3 Properties, Listings, Publications konsistent |
| Engines | ✅ 12/12 registriert |
| Zone 3 Websites | ✅ Alle 5 erreichbar (inkl. Kaufy via `/website/kaufy`) |
| Golden Paths | ⚠️ 27 DEV-Validator-Fehler (keine User-Auswirkung) |
| Frontend Routing | ⚠️ KatalogTab leer für externe Tenants |
| Tile-Aktivierung | ⚠️ UNITYS -1 Tile |
| React Warnings | ⚠️ 4 forwardRef (kosmetisch) |

### KÖNNEN WIR ACCOUNTS ERSTELLEN?

**JA — mit einer Einschränkung:**
- Datenbank ist sauber und isoliert ✅
- Signup-Flow funktioniert ✅
- Module laden korrekt für eigenen Tenant ✅
- Zone 3 Websites erreichbar ✅

**Einschränkung:** FIX-002 (Katalog leer für externe Tenants) bedeutet, dass neue Partner-Manager zunächst keine Demo-Objekte im Katalog sehen. Dies ist kein Blocker für Account-Erstellung, aber beeinträchtigt die Demo-Erfahrung.

**Empfehlung:** FIX-002 + FIX-003 zuerst fixen (~35 min), dann neue Accounts erstellen.
