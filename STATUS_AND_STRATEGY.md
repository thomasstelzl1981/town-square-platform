# System of a Town — Status, Zielbild & Strategie

> **Datum**: 2026-01-21  
> **Version**: 3.0 — Verbindliche Referenz  
> **Zweck**: Copy/Paste-fähige Dokumentation für IST, SOLL und Umsetzungsstrategie

---

## 1. KERN-ZIELBILD

Eine Plattform mit **drei Kern-Usabilities** in EINEM System:

| # | Usability | Beschreibung |
|---|-----------|--------------|
| 1 | **Miety** (Vermieter) | Mietverwaltung, MSV-Mandate, Mieter-Kommunikation |
| 2 | **Kaufy** (Verkäufer) | Verkaufsmandat, Listings, Transaktionen, Provisionierung |
| 3 | **Vertriebspartner** | Deal-Pipeline, Beratungsprozess, Investment-Matching, Provision |

**Plus Backbone-Systeme:**
- Finanzierungsvorbereitung → Handoff an "Future Room" (extern) + Status-Rückfluss
- Vertrags-/Consent-Backbone (Mandate, Provisionsvereinbarungen, Datenfreigaben)
- Posteingang/Dokumenteneingang (Caya + Upload + Routing)
- Payment/Billing (Monetarisierung, Subscriptions, Rechnungen)
- Stammdaten/Onboarding (Profil, Firma, Bankdaten, Sicherheit)

**Zone 3 (Websites):**
- **Kaufy Website**: Digitaler Vertriebspartner – öffentliche/halb-öffentliche Listings, Investment-Suche, KI-Berater
- **Meety Website**: Marketing/Onboarding (geringer Aufwand)

---

## 2. IST-STATUS (verifiziert, 21.01.2026)

### 2.1 Datenbank-Foundation

| Bereich | Tabellen | Status |
|---------|----------|--------|
| **Core Foundation** | `organizations`, `profiles`, `memberships`, `org_delegations`, `audit_events` | 🟢 Stabil |
| **Tile-System** | `tile_catalog`, `tenant_tile_activation` | 🟢 Stabil |
| **Referenzmodul Immobilien** | `properties`, `units`, `property_features`, `property_financing` | 🟢 Stabil |
| **Dokumente/Access** | `documents`, `access_grants` | 🟢 Stabil |
| **Vermietung** | `leases`, `renter_invites` | 🟢 Stabil |
| **Kontakte** | `contacts` | 🟢 Stabil |

**Enums (produktiv):**
- `org_type`: internal, partner, sub_partner, client, renter
- `membership_role`: platform_admin, org_admin, internal_ops, sales_partner, renter_user
- `delegation_status`: active, revoked, expired

**RLS-Funktionen:**
- `is_platform_admin()` ✅
- `is_parent_access_blocked()` ✅

**Gesamt: 16 Tabellen produktiv**

**Fehlende Backbone-Tabellen:**
- ❌ `profile_extensions`, `bank_accounts` (Stammdaten)
- ❌ `plans`, `subscriptions`, `invoices`, `payment_methods` (Billing)
- ❌ `partner_pipelines`, `partner_watchlists`, `investment_profiles`, `commissions` (Vertriebspartner)
- ❌ `finance_packages`, `self_disclosures`, `finance_documents`, `finance_status_log` (Finanzierung)
- ❌ `agreement_templates`, `user_consents` (Agreements)
- ❌ `inbound_items`, `inbound_routing_rules`, `document_assignments` (Posteingang)

---

### 2.2 Zone 1 — Admin-Portal (11 Seiten implementiert)

| Sektion | Route | Status | Details |
|---------|-------|--------|---------|
| Dashboard | `/admin` | 🟢 Nutzbar | Session-Context + Stats |
| Organizations | `/admin/organizations` | 🟢 Nutzbar | CRUD + Hierarchie |
| Organization Detail | `/admin/organizations/:id` | 🟡 Teilfunktional | Read + Member-Liste |
| Users & Memberships | `/admin/users` | 🟡 Teilfunktional | List + Create, **Edit/Delete fehlt** |
| Delegations | `/admin/delegations` | 🟡 Teilfunktional | Create + Revoke, **Scope-Picker fehlt** |
| Master Contacts | `/admin/contacts` | 🟢 Nutzbar | CRUD vollständig |
| Tile Catalog | `/admin/tiles` | 🟢 Nutzbar | Catalog + Tenant-Activation |
| Oversight | `/admin/oversight` | 🟡 Teilfunktional | KPIs, **Drill-Down fehlt** |
| Integrations | `/admin/integrations` | 🔴 Scaffold | Placeholder |
| Communication Hub | `/admin/communication` | 🔴 Scaffold | Placeholder |
| Support | `/admin/support` | 🔴 Scaffold | Placeholder |

**Fehlende Admin-Sektionen:**
- ❌ **Billing & Plans** (`/admin/billing`)
- ❌ **Post & Documents** (`/admin/inbox`)
- ❌ **Agreements/Consents** (`/admin/agreements`)
- ❌ **Audit Log** (`/admin/audit`)

---

### 2.3 Zone 2 — User-Portal

| Komponente | Status | Details |
|------------|--------|---------|
| PortalHome | 🟢 Funktional | Tile-Grid aus `tenant_tile_activation` |
| ModulePlaceholder | 🟢 Funktional | Generischer Catch-All für alle Routen |
| PortalLayout/Shell | ❌ **Fehlt** | Kein dediziertes Layout |
| Tenant-Switcher | ❌ **Fehlt** | Nur in AdminSidebar vorhanden |

**Tile-Catalog (7 Module definiert, alle Zone 2):**

| Tile | Haupt-Route | Sub-Tiles (4) | Implementiert? |
|------|-------------|---------------|----------------|
| Immobilien | `/portal/immobilien` | Objekte, Verwaltung, Vertrieb, Dokumente | ❌ Placeholder |
| Kaufy | `/portal/kaufy` | Angebote, Reservierungen, Pipeline, Abschlüsse | ❌ Placeholder |
| Miety | `/portal/miety` | Mietverträge, Kommunikation, Anfragen, Dokumente | ❌ Placeholder |
| Dokumente | `/portal/dokumente` | Ablage, Vorlagen, Freigaben, Suche | ❌ Placeholder |
| Kommunikation | `/portal/kommunikation` | Eingang, Ausgang, Kampagnen, Vorlagen | ❌ Placeholder |
| Services | `/portal/services` | Aufgaben, Tickets, Kalender, Team | ❌ Placeholder |
| Einstellungen | `/portal/einstellungen` | Profil, Benachrichtigungen, Integrationen, Sicherheit | ❌ Placeholder |

**Fehlende Backbone-Module (Zone 2):**
- ❌ **Stammdaten** (Onboarding/Profil)
- ❌ **Payment** (Abo/Rechnungen)
- ❌ **Posteingang** (Caya/Inbox)
- ❌ **Vertriebspartner** (KERN-Usability #3)
- ❌ **Finanzierung** (Handoff Future Room)

**Legacy-Module (außerhalb Portal-Struktur):**
- `/portfolio`, `/portfolio/new`, `/portfolio/:id` – Funktional, nutzt AdminLayout

---

### 2.4 Zone 3 — Websites

| Website | Status | Details |
|---------|--------|---------|
| Kaufy Website | ❌ **Nicht existent** | Keine Architektur, kein Routing |
| Meety Website | ❌ **Nicht existent** | Keine Architektur |

---

## 3. GAP-ANALYSE

### A) Stammdaten/Onboarding ❌ FEHLT
- Tabellen: `profile_extensions`, `bank_accounts`
- Routes: `/portal/stammdaten/*`

### B) Payment/Billing ❌ FEHLT
- Tabellen: `plans`, `subscriptions`, `invoices`, `payment_methods`
- Admin: `/admin/billing`
- Zone 2: in Einstellungen oder eigenes Modul

### C) Vertriebspartner-Modul ❌ FEHLT (KERN!)
- Tabellen: `partner_pipelines`, `partner_watchlists`, `investment_profiles`, `commissions`
- Routes: `/portal/vertriebspartner/*`

### D) Finanzierungsvorbereitung + Handoff ❌ FEHLT
- Tabellen: `finance_packages`, `self_disclosures`, `finance_documents`, `finance_status_log`
- Routes: `/portal/finanzierung/*`

### E) Agreements/Consents ❌ FEHLT
- Tabellen: `agreement_templates`, `user_consents`
- Admin: `/admin/agreements`

### F) Posteingang/Caya ❌ FEHLT
- Tabellen: `inbound_items`, `inbound_routing_rules`, `document_assignments`
- Admin: `/admin/inbox`
- Zone 2: `/portal/posteingang/*`

### G) Zone 3 Kaufy Website ❌ FEHLT
- Neues Feld: `properties.is_public_listing`
- Separate App/Routes für öffentliche Listings

---

## 4. ZIELSTRUKTUR

### 4.1 Zone 1 — Admin-Portal (15 Sektionen)

```
/admin
├── Dashboard (KPIs, Session)
├── Tenants & Access
│   ├── Organizations (Hierarchie, CRUD)
│   ├── Users & Memberships (CRUD + Role Assignment)
│   └── Delegations (Scope-Picker, History)
├── Master Data
│   └── Contacts (Registry, Import)
├── Feature Activation
│   └── Tile Catalog (Module + Tenant-Activation)
├── Billing & Plans [NEU]
│   ├── Plans (CRUD)
│   ├── Subscriptions (Tenant → Plan)
│   └── Invoices (Liste, Export)
├── Post & Documents [NEU]
│   ├── Inbound Inbox (Routing, Assignment)
│   └── Document Registry (Suche, Tags)
├── Agreements [NEU]
│   ├── Templates (CRUD)
│   └── Consent Logs (Read-Only)
├── Oversight
│   ├── Tenant Stats (Drill-Down)
│   ├── Immobilien Overview (Read-Only)
│   └── Finanzierung Status (Read-Only)
├── System
│   ├── Integrations (Config)
│   ├── Communication Hub (Templates)
│   ├── Audit Log [NEU]
│   └── Support (Tickets)
```

### 4.2 Zone 2 — Super-User Musterportal (10 Module × 5 Tiles = 50 Routes)

```
/portal
├── [1] Stammdaten [NEU]
│   ├── Main: Übersicht
│   ├── /profil, /firma, /abrechnung, /sicherheit
├── [2] Payment [NEU]
│   ├── Main: Abo-Status
│   ├── /plan, /rechnungen, /zahlungsmethode, /nutzung
├── [3] Posteingang [NEU]
│   ├── Main: Inbox
│   ├── /eingang, /zuordnung, /archiv, /einstellungen
├── [4] Immobilien
│   ├── Main: Portfolio
│   ├── /objekte, /verwaltung, /vertrieb, /dokumente
├── [5] Miety
│   ├── Main: Mieter
│   ├── /vertraege, /kommunikation, /anfragen, /dokumente
├── [6] Kaufy
│   ├── Main: Vertrieb
│   ├── /angebote, /reservierungen, /pipeline, /abschluesse
├── [7] Vertriebspartner [NEU – KERN]
│   ├── Main: Dashboard
│   ├── /pipeline, /kunden, /matching, /provisionen
├── [8] Finanzierung [NEU – KERN]
│   ├── Main: Pakete
│   ├── /selbstauskunft, /unterlagen, /anfragen, /status
├── [9] Kommunikation
│   ├── Main: Nachrichten
│   ├── /eingang, /ausgang, /kampagnen, /vorlagen
├── [10] Einstellungen
│   ├── Main: Settings
│   ├── /profil, /benachrichtigungen, /integrationen, /sicherheit
```

### 4.3 Zone 3 — Websites

```
KAUFY.IO (digitaler Vertriebspartner)
├── / (Landing)
├── /immobilien (Listings-Suche)
├── /immobilien/:slug (Detail)
├── /investment-suche (Matching)
├── /kontakt (Lead-Form)
└── /berater (KI-Assistent, Phase 2)

MEETY.IO (Marketing)
├── / (Landing)
├── /features, /preise, /kontakt
```

---

## 5. UMSETZUNGSSTRATEGIE (6 Etappen)

### Etappe 1: Admin Feature-Complete ✅ ABGESCHLOSSEN (21.01.2026)
**Scope:** Memberships CRUD, Delegations Scope-Picker, Oversight Drill-Down, Audit Log

**Umgesetzt:**
- [x] Memberships: Edit-Dialog + Delete mit Confirmation
- [x] Delegations: visueller Scope-Picker (20 Scopes, kategorisiert)
- [x] Oversight: Klickbare Tenant-Details + Immobilien-/Modul-Listen
- [x] Audit Log: Event-Viewer mit Filter (`/admin/audit`)

**Neue Dateien:**
- `src/components/admin/ScopePicker.tsx`
- `src/pages/admin/AuditLog.tsx`

---

### Etappe 2: Backbone Migration (Admin + DB)
**Scope:** DB-Schema + Admin-UI für Billing, Agreements, Inbox

**Definition of Done:**
- [ ] DB: `plans`, `subscriptions`, `invoices`
- [ ] DB: `agreement_templates`, `user_consents`
- [ ] DB: `inbound_items`, `inbound_routing_rules`
- [ ] Admin: `/admin/billing`, `/admin/agreements`, `/admin/inbox`
- [ ] RLS: Policies für alle neuen Tabellen

**Risiken:** Payment-Komplexität (Stripe) → Skeleton first  
**Abhängigkeiten:** Keine

---

### Etappe 3: Sales & Financing DB
**Scope:** DB-Schema für Vertriebspartner + Finanzierung

**Definition of Done:**
- [ ] DB: `partner_pipelines`, `partner_watchlists`, `investment_profiles`, `commissions`
- [ ] DB: `finance_packages`, `self_disclosures`, `finance_documents`, `finance_status_log`
- [ ] Properties: `is_public_listing`, `public_listing_approved_at/by`
- [ ] Enums: `finance_status`, `pipeline_stage`, `commission_status`

**Risiken:** Schema-Komplexität → Iterativ verfeinern  
**Abhängigkeiten:** Etappe 2 (Agreements für Mandate)

---

### Etappe 4: Portal Shell + 50-Route Skeleton
**Scope:** PortalLayout, Tenant-Switcher, alle Routen als Placeholder

**Definition of Done:**
- [ ] `PortalLayout.tsx`: Mobile-first Shell
- [ ] Tenant-Switcher in Header
- [ ] Tile-Catalog: 10 Module mit je 5 Tiles
- [ ] Alle 50 Routes navigierbar
- [ ] Super-User Test: Alle Tiles sichtbar

**Risiken:** Gering  
**Abhängigkeiten:** Etappe 3 (für vollständige Tile-Definitionen)

---

### Etappe 5: Module Migration
**Scope:** Legacy `/portfolio` → `/portal/immobilien`

**Definition of Done:**
- [ ] PropertyList → `/portal/immobilien`
- [ ] PropertyDetail → `/portal/immobilien/objekte/:id`
- [ ] Redirects funktional
- [ ] Legacy-Routes entfernt

**Risiken:** Breaking Changes  
**Abhängigkeiten:** Etappe 4 (PortalLayout)

---

### Etappe 6: Iterative Modul-Entwicklung
**Scope:** Funktionale Logik je Modul

**Priorität:**
1. Stammdaten (Onboarding-Flow)
2. Finanzierung (Self-Disclosure + Handoff)
3. Vertriebspartner (Pipeline + Matching)
4. Kaufy (Listings + Reservierungen)
5. Miety (Verträge + Kommunikation)
6. Posteingang (Caya-Integration)
7. Payment (Stripe-Integration)

**DoD je Modul:** CRUD + RLS + E2E-Test + Dokumentation

---

## 6. GOVERNANCE

- **Jede Session:** STATUS_AND_STRATEGY.md + DECISIONS.md Update
- **Keine Implementation ohne Review**
- **Neue Module:** Müssen in `tile_catalog` registriert werden
- **DB-Änderungen:** Changelog im Chat vor Ausführung

---

## 7. CHANGELOG

| Datum | Version | Änderung |
|-------|---------|----------|
| 2026-01-21 | 3.1 | **Etappe 1 abgeschlossen**: Memberships Edit/Delete, Scope-Picker, Oversight Drill-Downs, Audit Log |
| 2026-01-21 | 3.0 | Komplette Neustrukturierung: 3-Kern-Usabilities, 6-Etappen-Plan, 50-Route-Matrix |
| 2026-01-21 | 2.2 | Etappenplan v2, Super-User Blueprint |
| 2026-01-20 | 2.0 | Tile-Catalog, Portal-Framework |
| 2026-01-19 | 1.0 | Initiale Foundation |

---

## 8. REFERENZEN

- `DECISIONS.md` — ADR-light Decision Log (ADR-001 bis ADR-033)
- `MODULE_BLUEPRINT.md` — Detaillierte Modul-/Routenstruktur
- `ADMIN_PORTAL_CONCEPT.md` — Zone 1 Konzeptdokumentation
