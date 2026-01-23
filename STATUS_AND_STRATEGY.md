# System of a Town — Status, Zielbild & Strategie

> **Datum**: 2026-01-23  
> **Version**: 4.0 — Fundament-Phase abgeschlossen  
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
- Posteingang/DMS (Caya + Resend Inbound + Upload + Routing)
- Payment/Billing (in Stammdaten integriert)
- Stammdaten/Onboarding (Profil, Firma, Abrechnung, Sicherheit)
- Leadgenerierung (Managed Meta-Ads über SOT-Account)

**Zone 3 (Websites):**
- **KAUFY.IO**: Digitaler Vertriebspartner – öffentliche Listings, Investment-Suche, KI-Berater
- **MIETY.de**: Marketing/Onboarding für digitale Mietverwaltung

---

## 2. 3-ZONEN-ARCHITEKTUR (verbindlich)

| Zone | Bezeichnung | Zweck | Isolation |
|------|-------------|-------|-----------|
| **Zone 1** | Admin Portal | Plattform-Governance, Tenant-Management, Oversight | Eigenständig, KEINE Zone-2-Abhängigkeiten |
| **Zone 2** | Superuser-Portale | Produktmodule für Kunden, Partner, Eigentümer | 9 Module × 4 Unterpunkte (45 Routes) |
| **Zone 3** | Websites | Öffentliche Landingpages, KI-Berater, Lead-Capture | Read-Only auf `is_public_listing` |

**Strikte Trennung:**
- Zone 1 und Zone 2 teilen KEINE Module, UI-Komponenten oder Logik
- Kommunikation (KI Office) ≠ Dokumente (DMS/Posteingang)
- System-Mails (Resend) ≠ Persönliche Mailbox (IMAP/Exchange/Gmail)

---

## 3. ID-SYSTEM (ADR-036, verbindlich)

### Dreischichtiges Hybrid-Modell

| Schicht | Feld | Format | Zweck |
|---------|------|--------|-------|
| 1. Intern | `id` | UUID | Primary Key, DB-Joins, RLS |
| 2. Extern | `public_id` | `SOT-{PREFIX}-{BASE32}` | URLs, PDFs, Support, APIs |
| 3. Hierarchie | `materialized_path` | `/<uuid>/<uuid>/` | Strukturvertrieb, Org-Baum |

### Entity Prefixes (verbindlich)

| Entität | Prefix | Beispiel | Kapazität |
|---------|--------|----------|-----------|
| Tenant/Organization | `T` | `SOT-T-7HK29` | 33.5M |
| Vertriebspartner | `V` | `SOT-V-8XK29` | 33.5M |
| Kunde/Contact | `K` | `SOT-K-3MN12` | 33.5M |
| Immobilie (Objekt) | `I` | `SOT-I-9PQ45` | 33.5M |
| Einheit (Unit) | `E` | `SOT-E-2RS67` | 33.5M |
| Lead | `L` | `SOT-L-4TU89` | 33.5M |
| Integration/API | `X` | `SOT-X-1VW01` | 33.5M |
| Dokument | `D` | `SOT-D-5AB23` | 33.5M |
| Finanzpaket | `F` | `SOT-F-6CD34` | 33.5M |

**Technische Spezifikation:**
- Base32 = Crockford-Encoding (0-9, A-Z ohne I/L/O/U)
- 5-stellig = 32^5 = 33.554.432 IDs pro Prefix
- Kollisionsfrei durch PostgreSQL SEQUENCE
- Case-insensitive, URL-safe, typo-resistant

---

## 4. IST-STATUS (verifiziert, 23.01.2026)

### 4.1 Datenbank-Foundation

| Bereich | Tabellen | Status |
|---------|----------|--------|
| **Core Foundation** | `organizations`, `profiles`, `memberships`, `org_delegations`, `audit_events` | 🟢 Stabil |
| **Tile-System** | `tile_catalog`, `tenant_tile_activation` | 🟢 Stabil |
| **Immobilien** | `properties`, `units`, `property_features`, `property_financing` | 🟢 Stabil |
| **Dokumente/Access** | `documents`, `access_grants` | 🟢 Stabil |
| **Vermietung** | `leases`, `renter_invites` | 🟢 Stabil |
| **Kontakte** | `contacts` | 🟢 Stabil |
| **Billing** | `plans`, `subscriptions`, `invoices` | 🟢 Stabil |
| **Agreements** | `agreement_templates`, `user_consents` | 🟢 Stabil |
| **Posteingang** | `inbound_items`, `inbound_routing_rules` | 🟢 Stabil |
| **Sales Partner** | `partner_pipelines`, `investment_profiles`, `commissions` | 🟢 Stabil |
| **Financing** | `finance_packages`, `self_disclosures`, `finance_documents` | 🟢 Stabil |

**Gesamt: 28 Tabellen produktiv**

**Fehlende Spalten (für ID-System):**
- ❌ `public_id` auf allen relevanten Tabellen

### 4.2 Zone 1 — Admin-Portal

| Sektion | Route | Status |
|---------|-------|--------|
| Dashboard | `/admin` | 🟢 Nutzbar |
| Organizations | `/admin/organizations` | 🟢 Nutzbar |
| Users & Memberships | `/admin/users` | 🟡 Teilfunktional |
| Delegations | `/admin/delegations` | 🟢 Nutzbar |
| Master Contacts | `/admin/contacts` | 🟢 Nutzbar |
| Tile Catalog | `/admin/tiles` | 🟢 Nutzbar |
| Oversight | `/admin/oversight` | 🟡 Teilfunktional |
| Billing | `/admin/billing` | 🟢 Nutzbar |
| Agreements | `/admin/agreements` | 🟢 Nutzbar |
| Inbox | `/admin/inbox` | 🟡 Teilfunktional |
| Audit Log | `/admin/audit` | 🟢 Nutzbar |
| Integrations | `/admin/integrations` | 🔴 Scaffold |

### 4.3 Zone 2 — User-Portal

| Komponente | Status |
|------------|--------|
| PortalHome | 🟢 Funktional |
| ModulePlaceholder | 🟢 Funktional |
| PortalLayout/Shell | ❌ **Fehlt** |
| Tenant-Switcher | ❌ **Fehlt** |
| 9-Modul-Navigation | ❌ **Fehlt** |

---

## 5. ZONE 2 — FINALES 9-MODUL-GRID (45 Routes)

### Grundregel
- Exakt **9 Module**
- Jedes Modul: **1 Dashboard + 4 Unterpunkte**
- Keine Ausnahmen

### 5.1 Modul-Matrix

| # | Modul | Code | Haupt-Route | 4 Unterpunkte |
|---|-------|------|-------------|---------------|
| 1 | **Stammdaten** | `stammdaten` | `/portal/stammdaten` | `/profil`, `/firma`, `/abrechnung`, `/sicherheit` |
| 2 | **KI Office** | `ki-office` | `/portal/ki-office` | `/email`, `/brief`, `/kontakte`, `/kalender` |
| 3 | **Posteingang (DMS)** | `posteingang` | `/portal/posteingang` | `/eingang`, `/zuordnung`, `/archiv`, `/einstellungen` |
| 4 | **Immobilien** | `immobilien` | `/portal/immobilien` | `/objekte`, `/verwaltung`, `/verkauf`, `/sanierung` |
| 5 | **Miet-Sonderverwaltung** | `msv` | `/portal/msv` | `/objekt-mieter`, `/mieteingang`, `/vermietung`, `/einstellungen` |
| 6 | **Verkauf** | `verkauf` | `/portal/verkauf` | `/objekte`, `/aktivitaeten`, `/anfragen`, `/vorgaenge` |
| 7 | **Vertriebspartner** | `vertriebspartner` | `/portal/vertriebspartner` | `/pipeline`, `/objektauswahl`, `/beratung`, `/netzwerk` |
| 8 | **Finanzierung** | `finanzierung` | `/portal/finanzierung` | `/selbstauskunft`, `/unterlagen`, `/pakete`, `/status` |
| 9 | **Leadgenerierung** | `leadgenerierung` | `/portal/leadgenerierung` | `/kampagnen`, `/studio`, `/landingpages`, `/leads` |

### 5.2 Modul-Beschreibungen

| Modul | Zweck | Besonderheiten |
|-------|-------|----------------|
| **Stammdaten** | Identitäts- und Betriebsbasis | Payment/Billing in `/abrechnung` integriert |
| **KI Office** | Operativer Arbeitsplatz | Persönliche Mail (IMAP) + KI-Briefgenerator → Systemmail |
| **Posteingang** | Dokumentenzentrale | Caya + Upload + Resend Inbound |
| **Immobilien** | Portfolio-Backbone | Source of Truth für alle Objekte/Einheiten |
| **MSV** | Vermieter-/Verwalterlogik | Mieterlisten, Mieteingänge, Automatisierungen |
| **Verkauf** | Prozessansicht für Verkäufe | Nur "verkaufsaktivierte" Objekte |
| **Vertriebspartner** | Strukturvertrieb | Pipeline, Objektauswahl, Netzwerk inkl. @kaufy.app Mail |
| **Finanzierung** | Handoff Future Room | Selbstauskunft, Unterlagen, Consent-Gates |
| **Leadgenerierung** | Managed Meta-Ads | Prepayment, Mindestbudget, 30-50% Marge |

### 5.3 Strikte Trennungen

| Bereich A | Bereich B | Regel |
|-----------|-----------|-------|
| KI Office `/email` | Posteingang `/eingang` | Kommunikation ≠ DMS |
| KI Office `/brief` → Systemmail | Persönliche Mailbox | PDF-Versand NUR über Resend |
| Immobilien `/verkauf` | Verkauf `/objekte` | Aktivierung → Sichtbarkeit |

---

## 6. INTEGRATION REGISTRY (ADR-037)

### Governance-Regeln

| Regel | Beschreibung |
|-------|--------------|
| Nur registrierte APIs | Keine "wilden" API-Keys in Code |
| Secrets in Vault/Env | Nie in DB oder Repo |
| Owner-Modul Pflicht | Jede Integration hat Verantwortlichen |
| Mandatory Audit | Alle externen Calls in `audit_events` |

### Naming-Konventionen

| Typ | Pattern | Beispiel |
|-----|---------|----------|
| Edge Function | `sot-{module}-{action}` | `sot-finanzierung-export` |
| Webhook | `sot-webhook-{provider}-{event}` | `sot-webhook-stripe-invoice` |
| Connector | `sot-connector-{provider}` | `sot-connector-caya` |

---

## 7. UMSETZUNGSSTRATEGIE

### Abgeschlossene Etappen

| Etappe | Scope | Status |
|--------|-------|--------|
| 1 | Admin Feature-Complete | ✅ 21.01.2026 |
| 2 | Backbone Migration (Billing, Agreements, Inbox) | ✅ 21.01.2026 |
| 3 | Sales & Financing DB + Ownership Map | ✅ 21.01.2026 |

### Offene Etappen

| Etappe | Scope | Status | Abhängigkeiten |
|--------|-------|--------|----------------|
| **4** | Portal Shell + 45-Route Skeleton | ⏳ Bereit | Fundament-Phase abgeschlossen |
| 5 | Module Migration (`/portfolio` → `/portal/immobilien`) | ⏳ Wartend | Etappe 4 |
| 6 | Iterative Modul-Entwicklung | ⏳ Wartend | Etappe 5 |
| 7 | ID-System Implementation (`public_id` Spalten) | ⏳ Wartend | Nach Etappe 4 |

### Etappe 4 — Definition of Done

- [ ] `PortalLayout.tsx`: Dediziertes Mobile-First Layout (KEIN AdminLayout)
- [ ] `PortalHeader.tsx`: Tenant-Switcher + Profile
- [ ] `PortalNav.tsx`: Bottom-Nav (Mobile) + Header-Nav (Desktop)
- [ ] `tile_catalog`: 9 Module mit je 4 Unterpunkten
- [ ] Alle 45 Routes navigierbar (Placeholder mit "Coming Soon")
- [ ] Super-User Test: Alle 9 Module sichtbar
- [ ] Keine Zone-1-Komponenten in Zone-2-Code

---

## 8. FLOWS & INTERFACES

### Kern-Flows (Cross-Module)

| Von → Nach | Interface Action | Typ |
|------------|------------------|-----|
| Vertriebspartner `/netzwerk` → Kontakte | `CreateContact` | Write |
| Vertriebspartner `/beratung` → Finanzierung | `CreateFinancePackage` | Write |
| KI Office `/brief` → Systemmail → DMS | `SendAndArchive` | Write |
| Immobilien `/verkauf` → Verkauf `/objekte` | `ActivateForSale` | Status |
| Leadgenerierung `/leads` → Kontakte | `ConvertLead` | Write |
| Posteingang `/zuordnung` → Kontextlink | `AssignDocument` | Link |

### Consent-Gates (Pflicht vor Action)

| Action | Consent-Code | Trigger |
|--------|--------------|---------|
| Commission erstellen | `SALES_MANDATE` | `commissions.INSERT` |
| Commission genehmigen | `COMMISSION_AGREEMENT` | `commissions.status → approved` |
| Finance Package exportieren | `DATA_SHARING_FUTURE_ROOM` | `finance_packages.exported_at` |

---

## 9. GOVERNANCE

- **Jede Session:** STATUS_AND_STRATEGY.md + DECISIONS.md Update
- **Keine Implementation ohne Review**
- **Neue Module:** Müssen in `tile_catalog` registriert werden
- **DB-Änderungen:** Changelog im Chat vor Ausführung
- **Cross-Module-Writes:** Nur über definierte Interface Actions

---

## 10. CHANGELOG

| Datum | Version | Änderung |
|-------|---------|----------|
| 2026-01-23 | **4.0** | **Fundament-Phase**: 9-Modul-Grid finalisiert, ID-System (ADR-036), Integration Registry (ADR-037), 3-Zonen-Architektur bestätigt |
| 2026-01-21 | 3.3 | Etappe 3 abgeschlossen: Sales & Financing DB + Properties-Erweiterung + Ownership Map + Interfaces |
| 2026-01-21 | 3.2 | Etappe 2 abgeschlossen: Backbone-Tabellen + Admin UI |
| 2026-01-21 | 3.1 | Etappe 1 abgeschlossen: Memberships, Scope-Picker, Oversight, Audit Log |
| 2026-01-21 | 3.0 | Komplette Neustrukturierung: 3-Kern-Usabilities, 6-Etappen-Plan |
| 2026-01-20 | 2.0 | Tile-Catalog, Portal-Framework |
| 2026-01-19 | 1.0 | Initiale Foundation |

---

## 11. REFERENZEN

- `DECISIONS.md` — ADR-light Decision Log (ADR-001 bis ADR-037)
- `MODULE_BLUEPRINT.md` — Detaillierte Modul-/Routenstruktur
- `MODULE_OWNERSHIP_MAP.md` — Modul-Eigentümerschaft und Zugriffsrechte
- `INTERFACES.md` — Cross-Module Interface Actions
- `ADMIN_PORTAL_CONCEPT.md` — Zone 1 Konzeptdokumentation
