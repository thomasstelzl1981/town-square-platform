# SYSTEM CHECK BACKLOG — 2026-02-25

> **Erstellt:** 2026-02-25 11:31 UTC  
> **Prüfer:** AI System Audit  
> **Status:** ANALYSE ABGESCHLOSSEN — Reparaturplan erforderlich

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
| Tiles | 21 | ⚠️ Fehlt MOD-21 (KI-Browser) — super_manager sollte 22 haben |
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

### ⚠️ PROBLEM: Ralph Reinhold hat KEINE `user_roles` Einträge
- membership_role = `super_manager` ✅
- user_roles Tabelle: LEER für diesen User
- **Impact:** Sollte keine Auswirkung haben, da Tile-Zugriff über `membership.role` gesteuert wird, nicht `user_roles`

---

## 3. DATENINTEGRITÄT

| Check | Ergebnis | Details |
|-------|----------|---------|
| Orphaned Properties | ✅ 0 | Keine Properties ohne gültigen Tenant |
| Orphaned Contacts | ✅ 0 | Keine Contacts ohne gültigen Tenant |
| Orphaned Units | ✅ 0 | |
| Orphaned Listings | ✅ 0 | |
| Orphaned Leases | ✅ 0 | |
| Orphaned Storage Nodes | ✅ 0 | |
| Orphaned Documents | ✅ 0 | |
| Cross-Tenant Leaks | ✅ KEINE | Alle Daten korrekt isoliert |

---

## 4. KRITISCHE FEHLER (PRIO 1 — Blocker)

### BUG-001: Kaufy Zone-3 Website zeigt 404
- **Route:** `/kaufy`
- **Erwartung:** Kaufy Landing Page mit 3 Demo-Listings
- **Ist:** 404 Page Not Found
- **Ursache:** Wahrscheinlich Route nicht im routesManifest oder falscher Pfad. Published URL nutzt ggf. anderen Pfad.
- **Impact:** KRITISCH — Zone-3-Website nicht erreichbar
- **Fix:** Route-Mapping prüfen (routesManifest.ts Zone 3 Sektion)

### BUG-002: Immomanager Katalog zeigt 0 Objekte für super_manager
- **Route:** `/portal/vertriebspartner/katalog`
- **User:** Ralph Reinhold (UNITYS, super_manager)
- **Erwartung:** Demo-Listings via partner_network Publications sichtbar
- **Ist:** "0 von 0 Objekten"
- **Ursache:** KatalogTab query filtert nach `tenant_id` des eigenen Tenants. Demo-Listings sind im Demo-Tenant, nicht im UNITYS-Tenant. Demo-Listings werden nur über `useDemoListings` Hook injiziert, aber dieser greift wahrscheinlich nicht für non-demo Tenants.
- **Impact:** HOCH — Manager sehen keinen Objektkatalog
- **Fix:** Demo-Listing-Injection auch für Partner-Tenants aktivieren ODER cross-tenant listing_publications Query

---

## 5. GOLDEN PATH VALIDATOR FEHLER (PRIO 2 — Governance)

Aus den Console Logs (devValidator.ts):

| # | Fehler | Workflow | Step | Typ |
|---|--------|----------|------|-----|
| GP-001 | Ledger-Event nicht in Whitelist | GP-PET | `booking_payment` | `pet.booking.payment.failed` |
| GP-002 | Route-Mismatch | ZONE-1 (Manager Lifecycle) | `submit_application` | Route `/portal/stammdaten` nicht im Manifest |
| GP-003 | FAIL-STATE MISSING (on_timeout) | GP-COMMISSION | `lead_received` | Kein on_timeout definiert |
| GP-004 | FAIL-STATE MISSING (on_timeout) | ZONE-1 | `first_client_assigned` | Kein on_timeout definiert |
| GP-005 | FAIL-STATE MISSING (on_timeout) | ZONE-1 | `submit_application` | Kein on_timeout definiert |
| GP-006 | FAIL-STATE MISSING (on_error) | GP-COMMISSION | `system_fee_paid` | Kein on_error definiert |
| GP-007 | FAIL-STATE MISSING (on_error) | GP-COMMISSION | `lead_assigned` | Kein on_error definiert |
| GP-008 | FAIL-STATE MISSING (on_error) | GP-COMMISSION | `lead_received` | Kein on_error definiert |
| GP-009 | FAIL-STATE MISSING (on_timeout) | ZONE-1 | `client_request_received` | Kein on_timeout definiert |
| GP-010 | FAIL-STATE MISSING (on_error) | ZONE-1 | `first_client_assigned` | Kein on_error definiert |

**Impact:** Nur in DEV sichtbar (devValidator). Keine Auswirkung auf User. Governance-Compliance nicht erfüllt.

---

## 6. REACT WARNINGS (PRIO 3 — Kosmetisch)

| # | Warning | Component | Typ |
|---|---------|-----------|-----|
| RW-001 | Function components cannot be given refs | `SocialLoginButtons > AppleIcon` | forwardRef missing |
| RW-002 | Function components cannot be given refs | `SocialLoginButtons > GoogleIcon` | forwardRef missing |
| RW-003 | Function components cannot be given refs | `App > Toaster` | forwardRef missing |
| RW-004 | Function components cannot be given refs | `Toaster > ToastProvider` | forwardRef missing |

**Impact:** Keine funktionale Auswirkung. Nur Console-Noise.

---

## 7. MANIFEST & ENGINE ANALYSE

### Modules Freeze Status

| Modul | Frozen | Anmerkung |
|-------|--------|-----------|
| MOD-00 | ✅ frozen | Production-ready |
| MOD-01 | ❌ unfrozen | Demo-Daten Route removal |
| MOD-02 | ✅ frozen | Production-ready |
| MOD-03 | ✅ frozen | Production-ready |
| MOD-04 | ✅ frozen | Production-ready |
| MOD-05 | ✅ frozen | Production-ready |
| MOD-06 | ✅ frozen | Production-ready |
| MOD-07 | ✅ frozen | Production-ready |
| MOD-08 | ❌ unfrozen | Dedup-Fix |
| MOD-09 | ❌ unfrozen | Dedup-Fix |
| MOD-10 | ✅ frozen | Production-ready |
| MOD-11 | ✅ frozen | Production-ready |
| MOD-12 | ✅ frozen | Production-ready |
| MOD-13 | ❌ unfrozen | Excel Intake |
| MOD-14 | ✅ frozen | Production-ready |
| MOD-15–22 | ✅ frozen | Production-ready |

### Engines (12 registriert in index.ts)

| Engine | Status | Anmerkung |
|--------|--------|-----------|
| ENG-AKQUISE | ✅ Live | spec.ts + engine.ts ✅ |
| ENG-FINANCE | ✅ Live | spec.ts + engine.ts ✅ |
| ENG-PROVISION | ✅ Live | spec.ts + engine.ts ✅ |
| ENG-BWA | ✅ Live | spec.ts + engine.ts + bwaDatev ✅ |
| ENG-PROJEKT | ✅ Live | spec.ts + engine.ts ✅ |
| ENG-NK | ✅ Live | Index-Export ✅ |
| ENG-DEMO | ✅ Live | Index-Export ✅ |
| ENG-FINUEB | ✅ Live | spec.ts + engine.ts ✅ |
| ENG-VORSORGE | ✅ Live | spec.ts + engine.ts ✅ |
| ENG-VVSTEUER | ✅ Live | Index-Export ✅ |
| ENG-KONTOMATCH | ✅ Live | spec.ts + engine.ts + recurring.ts ✅ |
| ENG-MKTDIR | ✅ Live | Index-Export ✅ |

### Area Config

| Area | Module | Anmerkung |
|------|--------|-----------|
| Client | MOD-18, 02, 04, 07, 06, 08 | ✅ 6 Module |
| Manager | MOD-13, 09, 11, 12, 10, 22 | ✅ 6 Module |
| Service | MOD-15, 05, 16, 17, 19, 14 | ✅ 6 Module |
| Base | MOD-03, 01, ARMSTRONG, INTAKE, MOD-21 | ✅ 5 Entries |

---

## 8. DEMO-DATEN GOVERNANCE

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| CSV SSOT vorhanden | ✅ | demo_properties.csv, demo_listings.csv, demo_listing_publications.csv, demo_property_features.csv |
| DB ↔ CSV synchron | ✅ | 3 Properties, 3 Listings, 6 Publications — Match |
| Dedup-Fix (property_id) | ✅ | Kaufy2026Home, SucheTab, KatalogTab — alle auf property_id umgestellt |
| Hardcoded Data in Modules | ✅ | Keine Violations gefunden (letzte Migration abgeschlossen) |

---

## 9. TILE-AKTIVIERUNG ANOMALIEN

| Tenant | Erwartete Tiles | Aktive Tiles | Delta | Anmerkung |
|--------|----------------|--------------|-------|-----------|
| Golden (Reference) | 23 | 23 | ✅ 0 | Korrekt |
| Demo | 22+ | 22 | ⚠️ | Fehlt MOD-21 (KI-Browser). Sollte im Demo-Tenant aktiv sein? |
| Marchner | 23 | 23 | ✅ 0 | Super-User korrekt |
| Lennox | 16 | 16 | ✅ 0 | pet_manager Rolle korrekt |
| UNITYS | 22 | 21 | ⚠️ -1 | Fehlt MOD-21 oder MOD-22 |

### ⚠️ TILE-009: UNITYS hat nur 21 statt 22 Tiles
- `super_manager` sollte 22 Module (MOD-00 bis MOD-21, ohne MOD-22) haben
- Fehlende Tile muss identifiziert werden

---

## 10. REPARATURPLAN (Priorisiert)

### PRIO 1 — Blocker (vor Account-Erstellung fixen)

| # | Ticket | Aufwand | Beschreibung |
|---|--------|---------|-------------|
| FIX-001 | BUG-001 | 15 min | Kaufy Zone-3 Route `/kaufy` → 404. Route-Mapping in routesManifest.ts und App.tsx prüfen. Möglicherweise nur auf Published URL aktiv. |
| FIX-002 | BUG-002 | 30 min | KatalogTab zeigt 0 Objekte für Partner-Tenants. Demo-Listings nur für Demo-Tenant injiziert. Fix: useDemoListings auch für non-demo Tenants mit partner_network Publications. |
| FIX-003 | TILE-009 | 5 min | Fehlende Tile für UNITYS identifizieren und aktivieren. |

### PRIO 2 — Governance (nach Account-Erstellung möglich)

| # | Ticket | Aufwand | Beschreibung |
|---|--------|---------|-------------|
| FIX-004 | GP-001–010 | 30 min | Fehlende Fail-States in GP-COMMISSION, ZONE-1, GP-PET Workflows. Whitelist-Event ergänzen. |
| FIX-005 | GP-002 | 5 min | Route `/portal/stammdaten` im Manager-Lifecycle korrigieren. |

### PRIO 3 — Kosmetisch (kann warten)

| # | Ticket | Aufwand | Beschreibung |
|---|--------|---------|-------------|
| FIX-006 | RW-001–004 | 15 min | forwardRef für SocialLoginButtons Icons und Toaster hinzufügen. |

### PRIO 4 — Offene Punkte (kein Fix nötig, nur Tracking)

| # | Item | Details |
|---|------|---------|
| TRACK-001 | Demo-Tenant hat 0 Leads | Noch kein Demo-Lead angelegt. Kein Blocker, aber für Demo-Showcasing gewünscht. |
| TRACK-002 | Demo-Tenant hat 0 Commissions | Noch keine Demo-Provision. Kein Blocker. |
| TRACK-003 | MOD-01 und MOD-08/09/13 noch unfrozen | Nach Fixes re-freezeen. |

---

## 11. GESAMTBEWERTUNG

| Bereich | Status | Bewertung |
|---------|--------|-----------|
| **Datenbank-Integrität** | ✅ | Keine Orphans, keine Leaks, RLS intakt |
| **Tenant-Isolation** | ✅ | Alle 5 Tenants sauber getrennt |
| **Demo-Daten** | ✅ | 3 Properties, Listings, Publications konsistent |
| **Engines** | ✅ | 12/12 registriert und exportiert |
| **Golden Paths** | ⚠️ | 10 Validator-Fehler (Fail-States + Whitelist) |
| **Frontend Routing** | ❌ | Kaufy 404, KatalogTab leer |
| **Tile-Aktivierung** | ⚠️ | UNITYS -1 Tile |
| **React Warnings** | ⚠️ | 4 forwardRef Warnings |

### KÖNNEN WIR ACCOUNTS ERSTELLEN?

**JA, mit Einschränkungen:**
- Die Datenbank ist sauber und isoliert ✅
- Neue Accounts werden korrekt erstellt (Signup-Flow intakt) ✅  
- Module laden und funktionieren für den eigenen Tenant ✅

**ABER:** FIX-001 (Kaufy 404) und FIX-002 (Katalog leer) sollten VOR der Demo an Partner gefixt werden, da sie die Cross-Tenant-Sichtbarkeit betreffen.

**Empfehlung:** FIX-001, FIX-002, FIX-003 zuerst fixen (ca. 50 min), dann neue Accounts erstellen.
