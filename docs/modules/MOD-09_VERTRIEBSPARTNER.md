# MOD-09 — VERTRIEBSPARTNER (Sales Partners & Advisor Network)

**Version:** v2.2.0  
**Status:** IMPLEMENTED  
**Letzte Aktualisierung:** 2026-02-06  
**Zone:** 2 (User Portal)  
**Typ:** ADDON (nur für Partner-Organisationen)  
**Route-Prefix:** `/portal/vertriebspartner`  
**Abhängig von:** MOD-06 (Listings), MOD-04 (Properties), MOD-02 (Contacts), Backbone (Consents, Audit)

---

## 1) MODULDEFINITION

### 1.1 Ziel

MOD-09 „Vertriebspartner" ist das operative ADDON-Modul für Vertriebspartner (sales_partner Rolle). Es bietet ein vollständiges Partner-Cockpit:

- **Objektkatalog**: Alle für Partner freigegebenen Listings
- **Beratung**: Investment-Simulator mit Kunden-Verknüpfung
- **Kunden**: Kontakt-Management
- **Netzwerk**: Provisionen und Team-Übersicht
- **Pipeline**: Deal-Tracking

### 1.2 Nutzerrollen

| Rolle | Zugang | Beschreibung |
|-------|--------|--------------|
| sales_partner | Full | Katalog, Beratung, Pipeline, Provisionen |
| org_admin (Platform) | Oversight | Alle Pipelines, Commission Approval |
| internal_ops | Read | Unterstützung, Reporting |

### 1.3 Source of Truth

| Domäne | SoT-Modul | Andere Module |
|--------|-----------|---------------|
| Partner Deals | **MOD-09** (partner_deals) | MOD-06: Status-Read |
| Listings | MOD-06 | MOD-09: Read-only |
| Properties | MOD-04 | MOD-09: Read-only |
| Contacts | Backbone | MOD-09: Read/Write |

---

## 2) ROUTE-STRUKTUR (4-Tile-Pattern)

| Route | UI-Label | Beschreibung |
|-------|----------|--------------|
| `/portal/vertriebspartner` | How It Works | Modul-Einstieg |
| `/portal/vertriebspartner/katalog` | Katalog | Partner-sichtbare Listings |
| `/portal/vertriebspartner/beratung` | Beratung | Investment Engine + Simulation |
| `/portal/vertriebspartner/kunden` | Kunden | Kontakt-Management |
| `/portal/vertriebspartner/network` | Netzwerk | Provisionen + Team (Phase 2) |

---

## 3) SCREEN SPECIFICATIONS

### 3.1 Katalog (`/portal/vertriebspartner/katalog`)

**Datenquelle:** `listings` + `listing_publications` WHERE `channel = 'partner_network'`

**Features:**
- Profi-Filter: Stadt, Objekttyp, Preis-Range, Provision, Rendite
- Volltext-Suche
- Vormerken (♥) via `partner_listing_selections`
- Kanäle-Badges (K = Kaufy, P = Partner-Netzwerk)

**Aktionen:**
- Details anzeigen (Eye-Icon)
- Vormerken/Entfernen (Heart-Icon)
- Deal starten (Handshake-Button)

**Golden Path:** MOD-04 → MOD-06 (Listing erstellen) → Partner-Netzwerk freigeben → erscheint hier

### 3.2 Beratung (`/portal/vertriebspartner/beratung`)

**Datenquelle:** `partner_listing_selections` + `contacts`

**Features:**
- Portfolio-Übersicht der vorgemerkten Objekte
- Objekt-/Kunden-Picker
- Investment-Calculator (sot-investment-engine)
- Beratungsmaterialien (Phase 2: DMS-Integration)

**Aktionen:**
- Simulation speichern
- PDF exportieren
- Deal starten

### 3.3 Kunden (`/portal/vertriebspartner/kunden`)

**Datenquelle:** `contacts` (tenant_id Filter)

**Features:**
- Kontakt-Liste mit Suche
- Detail-Drawer mit Zeitstempeln
- Verknüpfung zu KI-Office (MOD-02) für CRUD

**Aktionen:**
- In Beratung öffnen
- Deal starten
- Neuer Kunde (→ MOD-02)

### 3.4 Netzwerk (`/portal/vertriebspartner/network`)

**Datenquelle:** `partner_deals` WHERE `stage = 'won'`

**Features:**
- KPIs: Abschlüsse, Gesamt, Offen, Ausgezahlt
- Provisions-Tabelle mit Status-Badges
- Team-Einladung (Phase 2)
- Kunden-Portal (Phase 2)

**Berechnung:**
```
commission_amount = deal_value × (commission_rate / 100)
status = actual_close_date > 30 Tage ? 'paid' : 'pending'
```


## 4) DATENBANK-TABELLEN

### 4.1 `partner_deals` (EXISTS)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| lead_id | uuid FK | Lead-Referenz (optional) |
| contact_id | uuid FK | Kunde |
| property_id | uuid FK | Immobilie (optional) |
| stage | enum | Pipeline-Stage |
| deal_value | numeric | Dealwert |
| commission_rate | numeric | Provisionssatz (%) |
| expected_close_date | date | Erwarteter Abschluss |
| actual_close_date | date | Tatsächlicher Abschluss |
| notes | text | Notizen |

### 4.2 `partner_listing_selections` (EXISTS)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Tenant-Isolation |
| listing_id | uuid FK | Gemerktes Listing |
| partner_user_id | uuid FK | Partner |
| notes | text | Notizen |

---

## 5) CROSS-MODULE DEPENDENCIES

| Modul | Art | Beschreibung |
|-------|-----|--------------|
| MOD-06 Verkauf | Read | listings via listing_publications |
| MOD-04 Immobilien | Read | properties (Stammdaten) |
| MOD-02 KI Office | Link | contacts CRUD |
| Zone 1 | Config | Tile Activation, requires_activation=true |

---

## 6) CONSENT & AUDIT

### Consent Gates

| Aktion | Consent Code | Pflicht |
|--------|--------------|---------|
| Commission Trigger | COMMISSION_AGREEMENT | Ja |

### Audit Events

| Event | Trigger | Payload |
|-------|---------|---------|
| deal.created | INSERT | deal_id, contact_id |
| deal.stage_changed | Stage UPDATE | deal_id, old_stage, new_stage |
| deal.won | Stage → won | deal_id, deal_value |
| listing.viewed | Partner view | listing_id, partner_id |
| selection.added | Vormerken | listing_id, partner_id |

---

## 7) HOW-IT-WORKS TEXTE

### Modul-Einstieg

**One-Liner:** "Beraten, dokumentieren, abschließen – Ihr Partner-Cockpit für Objektvertrieb."

**Benefits:**
- Vollständiger Zugriff auf alle freigegebenen Investment-Objekte
- Live-Simulationen direkt im Kundengespräch
- Provisionsansprüche transparent und auditierbar

### Unterpunkt-Beschreibungen

| Tile | Beschreibung |
|------|--------------|
| **Katalog** | Alle für Partner freigegebenen Objekte. Nutzen Sie Profi-Filter für Rendite und Provision. |
| **Beratung** | Investment-Simulator für Live-Beratung. Kombinieren Sie vorgemerkte Objekte mit Kundendaten. |
| **Kunden** | Ihre zentrale Kundenakte. Kontakte, Notizen und Simulations-Historien. |
| **Netzwerk** | Provisionen, Team-Performance und (in Phase 2) Partner-Einladungen. |
| **Pipeline** | Deal-Tracking von Lead bis Abschluss. |

---

## 8) IMPLEMENTIERUNGS-STATUS

| Bereich | Status | Details |
|---------|--------|---------|
| Katalog | ✅ 100% | DB-Query, Filter, Vormerken |
| Beratung | ✅ 90% | Calculator, Materialien Phase 2 |
| Kunden | ✅ 100% | Contacts aus DB |
| Netzwerk | ✅ 80% | Provisionen aus DB, Team Phase 2 |
| Pipeline | ✅ 100% | partner_deals Query |
| **Gesamt** | **94%** | Production-ready |

---

*Dieses Dokument ist der verbindliche Spezifikationsstand für MOD-09.*
