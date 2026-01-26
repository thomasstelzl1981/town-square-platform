# System of a Town — Modul-Blueprint

> **Datum**: 2026-01-25  
> **Version**: 2.0 (10 Module)  
> **Status**: FROZEN  
> **Zweck**: Verbindliches Gerüst für Zone 1 (Admin) und Zone 2 (User Portal mit 10 Modulen)

---

## Übersicht

| Zone | Zweck | Anzahl Bereiche | Anzahl Routen |
|------|-------|-----------------|---------------|
| **Zone 1** | Admin-Portal (Steuerzentrale) | 11 Sektionen | ~18 Routen |
| **Zone 2** | User-Portal (10 Module) | 10 Module | 50 Routen (10×5) |
| **Zone 3** | Websites (Kaufi, Landingpages) | 2 Bereiche | ~10 Routen |

---

## BREAKING CHANGE: 10 Module (nicht mehr 9)

**Datum:** 2026-01-25

Die Zone 2 wird von 9 auf 10 Module erweitert:
- **NEU:** MOD-08 "Investment-Suche / Ankauf"
- **VERSCHOBEN:** MOD-08 → MOD-09 "Vertriebspartner"
- **VERSCHOBEN:** MOD-09 → MOD-10 "Leadgenerierung"

---

## Zone 2 — 10 Module (FROZEN)

### Modulübersicht

| MOD | Name | Typ | Sichtbarkeit | Route-Prefix | Spec-Status |
|-----|------|-----|--------------|--------------|-------------|
| 01 | Stammdaten | Core | Alle | `/portal/stammdaten` | SPEC |
| 02 | KI Office | Core | Alle | `/portal/office` | SPEC |
| 03 | DMS | Core | Alle | `/portal/dms` | SPEC |
| 04 | Immobilien | Core | Alle | `/portal/immobilien` | SPEC |
| 05 | MSV | Freemium | Alle | `/portal/msv` | SPEC |
| 06 | Verkauf | Standard | Alle | `/portal/verkauf` | COMPLETE |
| 07 | Finanzierung | Standard | Alle | `/portal/finanzierung` | SPEC |
| 08 | Investment-Suche | Standard | Alle | `/portal/investments` | **NEW** COMPLETE |
| 09 | Vertriebspartner | Addon | Partner | `/portal/vertriebspartner` | COMPLETE |
| 10 | Leadgenerierung | Addon | Partner | `/portal/leads` | PLACEHOLDER |

### Sichtbarkeitsregeln (FROZEN)

| Nutzertyp | Sichtbare Module |
|-----------|------------------|
| Standard-User (Client) | MOD-01 bis MOD-08 |
| Partner (sales_partner) | MOD-01 bis MOD-10 |
| Platform Admin | Alle via Oversight |

---

## Modul-Details

### MOD-01: Stammdaten (`/portal/stammdaten`)

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/stammdaten` | Dashboard | Übersicht |
| `/portal/stammdaten/kontakte` | Kontakte | Kontakt-CRUD |
| `/portal/stammdaten/organisation` | Organisation | Tenant-Einstellungen |
| `/portal/stammdaten/team` | Team | Mitglieder |
| `/portal/stammdaten/einstellungen` | Einstellungen | Profil, Präferenzen |

### MOD-02: KI Office (`/portal/office`)

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/office` | Dashboard | Übersicht |
| `/portal/office/chat` | Chat | KI-Assistent |
| `/portal/office/briefe` | Briefe | Brief-Generator |
| `/portal/office/vorlagen` | Vorlagen | Templates |
| `/portal/office/historie` | Historie | Kommunikations-Log |

### MOD-03: DMS (`/portal/dms`)

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/dms` | Dashboard | Übersicht |
| `/portal/dms/dokumente` | Dokumente | Alle Dokumente |
| `/portal/dms/eingang` | Eingang | Inbound (Caya) |
| `/portal/dms/freigaben` | Freigaben | Data Rooms |
| `/portal/dms/archiv` | Archiv | Archivierte Docs |

### MOD-04: Immobilien (`/portal/immobilien`)

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/immobilien` | Dashboard | Portfolio-Übersicht |
| `/portal/immobilien/objekte` | Objekte | Property-Liste |
| `/portal/immobilien/einheiten` | Einheiten | Units |
| `/portal/immobilien/finanzierung` | Finanzierung | Kredite pro Property |
| `/portal/immobilien/dokumente` | Dokumente | Property-Dokumente |

### MOD-05: MSV (`/portal/msv`)

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/msv` | Dashboard | MSV-Übersicht |
| `/portal/msv/mietvertraege` | Mietverträge | Lease-CRUD |
| `/portal/msv/mieter` | Mieter | Mieter-Kontakte |
| `/portal/msv/zahlungen` | Zahlungen | Mieteingänge |
| `/portal/msv/kommunikation` | Kommunikation | Mieter-Korrespondenz |

### MOD-06: Verkauf (`/portal/verkauf`)

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/verkauf` | Dashboard | Sales-KPIs |
| `/portal/verkauf/objekte` | Objekte | Listing-Liste |
| `/portal/verkauf/aktivitaeten` | Aktivitäten | Timeline |
| `/portal/verkauf/anfragen` | Anfragen | Inquiry-Management |
| `/portal/verkauf/vorgaenge` | Vorgänge | Reservations + Transactions |

**Publishing Channels:** Kaufi, Scout24, Kleinanzeigen, Partner-Netzwerk

### MOD-07: Finanzierung (`/portal/finanzierung`)

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/finanzierung` | Dashboard | Finanzierungs-Übersicht |
| `/portal/finanzierung/pakete` | Pakete | Finance Packages |
| `/portal/finanzierung/dokumente` | Dokumente | Unterlagen-Sammlung |
| `/portal/finanzierung/handoff` | Handoff | Export zu Future Room |
| `/portal/finanzierung/status` | Status | Tracking |

### MOD-08: Investment-Suche (`/portal/investments`) — NEU

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/investments` | Dashboard | Investment-KPIs |
| `/portal/investments/suche` | Suche | Multi-Source-Suche |
| `/portal/investments/favoriten` | Favoriten | Watchlist (inkl. Kaufi-Sync) |
| `/portal/investments/mandat` | Mandat | Buy-Side Betreuung (Placeholder) |
| `/portal/investments/simulation` | Simulation | Portfolio-Impact |

**Sources:** SoT-Verkauf, Kaufi (Marke), Extern

### MOD-09: Vertriebspartner (`/portal/vertriebspartner`) — Addon

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/vertriebspartner` | Dashboard | Partner-KPIs |
| `/portal/vertriebspartner/pipeline` | **Objektkatalog** | Alle partner-sichtbaren Listings |
| `/portal/vertriebspartner/auswahl` | **Meine Auswahl** | Partner-Shortlist |
| `/portal/vertriebspartner/beratung` | Beratung | Investment Engine |
| `/portal/vertriebspartner/team` | **Netzwerk** | Team, Provisionen |

**Route-Label-Aliase:**
- `/pipeline` → UI: "Objektkatalog"
- `/team` → UI: "Netzwerk"

### MOD-10: Leadgenerierung (`/portal/leads`) — Addon

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/leads` | Dashboard | Lead-KPIs |
| `/portal/leads/inbox` | Inbox | Zugewiesene Leads |
| `/portal/leads/pipeline` | Pipeline | Deal-Kanban |
| `/portal/leads/sources` | Quellen | Lead-Quellen |
| `/portal/leads/reports` | Reports | Konversions-Reports |

---

## Zone 1 — Admin-Portal

### Struktur-Übersicht

```
/admin
├── Dashboard                    [Sektion 1]
├── Organizations                [Sektion 2]
│   └── :id (Detail)
├── Users & Memberships          [Sektion 3]
├── Delegations                  [Sektion 4]
├── Master Contacts              [Sektion 5]
├── Tile Catalog                 [Sektion 6]
├── Oversight                    [Sektion 7]
├── Integrations                 [Sektion 8]
├── Billing                      [Sektion 9]
├── Lead Pool                    [Sektion 10] ← NEU
├── Support Mode                 [Sektion 11]
└── Audit Log                    [Sektion 12]
```

### Sektion 10: Lead Pool (NEU)

| Funktion | Beschreibung | Priorität |
|----------|--------------|-----------|
| Eingehende Leads | Leads aus Zone 3 | P0 |
| Qualifizierung | Status-Workflow | P0 |
| Zuweisung | An Partner verteilen | P0 |
| Split-Tracking | 1/3 : 2/3 Provision | P1 |

---

## Zone 3 — Websites

### Struktur-Übersicht

```
Kaufi Marketplace
├── Home
├── Search
├── Object Detail
├── Favorites (anonym → Sync)
├── Login/Register
└── Partner-Info

Landingpages
├── SoT Marketing
├── Partner-Akquise
└── Lead Capture Forms
```

### Kaufi → SoT Sync

Favoriten aus Kaufi-Website werden bei Login in MOD-08 importiert.

---

## Markenlogik (FROZEN)

| Marke | Bedeutung | Zone |
|-------|-----------|------|
| **System of a Town (SoT)** | Verwaltungssoftware | Zone 1 + 2 |
| **Kaufi** | Marktplatz-Marke | Zone 3 + Channel in MOD-06/08 |

**Regel:** "Kaufi" ist KEIN Modulname. Es ist eine Source/Channel-Marke.

---

## API-Nummernkreise

| Range | Modul/Bereich |
|-------|---------------|
| API-001..099 | Backbone (Auth, Profiles) |
| API-100..199 | Zone 1 (Admin) |
| API-200..299 | MOD-06 Verkauf |
| API-300..399 | MOD-09 Vertriebspartner |
| API-400..499 | MOD-08 Investment-Suche |
| API-500..599 | MOD-10 Leadgenerierung |
| API-600..699 | MOD-07 Finanzierung |
| API-700..799 | MOD-04 Immobilien |
| API-800..899 | MOD-05 MSV |

---

## Dokument-Referenzen

| Dokument | Inhalt |
|----------|--------|
| `docs/modules/MOD-06_VERKAUF.md` | Verkauf Full Spec |
| `docs/modules/MOD-08_INVESTMENTS.md` | Investment-Suche Full Spec |
| `docs/modules/MOD-09_VERTRIEBSPARTNER.md` | Partner Full Spec |
| `docs/modules/MOD-10_LEADGENERIERUNG.md` | Leads Placeholder Spec |
| `docs/presentation/SYSTEM_DIAGRAM.md` | Alle Diagramme |
| `docs/architecture/ARCHITEKTUR_UPDATE_10MODULE_2026-01-25.md` | Architektur-Entscheidung |

---

*Dieses Dokument ist die verbindliche Modul-Referenz für die 10-Modul-Architektur.*
