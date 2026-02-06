# MOD-01 — STAMMDATEN (Master Data & Account Settings)

**Version:** 2.0  
**Status:** ACTIVE  
**Datum:** 2026-02-06  
**Zone:** 2 (User Portal)  
**Route-Prefix:** `/portal/stammdaten`

---

## 1. Executive Summary

MOD-01 "Stammdaten" ist das zentrale Modul für Benutzer- und Organisationsverwaltung. Es umfasst:

- **Profil**: Persönliche Daten, Adresse, Kontakt, steuerliche Daten
- **Verträge**: Zentrale Übersicht aller Vereinbarungen (AGB, Mandate, Provisionen)
- **Abrechnung**: Billing, Credits, Rechnungen, Pläne
- **Sicherheit**: Passwort, 2FA, Sessions, Audit

Dieses Modul ist für ALLE Tenant-Typen verfügbar (`client`, `partner`, `subpartner`) und bildet die Grundlage für Identität und Abrechnung.

---

## 2. Route-Struktur (4-Tile-Pattern)

| # | Name | Route | Beschreibung |
|---|------|-------|--------------|
| 0 | How It Works | `/portal/stammdaten` | Landingpage mit Erklärung |
| 1 | Profil | `/portal/stammdaten/profil` | Persönliche Daten, Avatar, Adresse, Kontakt |
| 2 | Verträge | `/portal/stammdaten/vertraege` | **NEU:** Zentrale Vertragsübersicht |
| 3 | Abrechnung | `/portal/stammdaten/abrechnung` | Billing, Credits, Invoices, Plans |
| 4 | Sicherheit | `/portal/stammdaten/sicherheit` | Passwort, 2FA, Sessions, Audit |

### Legacy-Redirects

| Alte Route | Ziel | Grund |
|------------|------|-------|
| `/portal/stammdaten/firma` | `/portal/stammdaten/vertraege` | Umstrukturiert |
| `/portal/stammdaten/personen` | `/portal/stammdaten/profil` | Altlast entfernt |

---

## 3. Screen Specifications

### 3.1 How It Works (`/portal/stammdaten`)

**Purpose**: Landingpage mit Erklärung der Modulstruktur

**Content (aus moduleContents.ts)**:
- One-Liner: "Alles, was Ihr Konto 'fähig macht' – einmal sauber einrichten, überall profitieren."
- Benefits: Daten-Vorbefüllung, zentrale Vertragsübersicht, transparente Abrechnung
- CTA: "Vervollständigen Sie Ihr Profil – das beschleunigt alle Prozesse."
- 4 Sub-Tiles mit Icons und Links

### 3.2 Profil (`/portal/stammdaten/profil`)

**Purpose**: Persönliche Benutzerdaten verwalten

**Sections (Cards)**:

**A) Persönliche Daten**
- Avatar (Upload via Storage)
- Vorname, Nachname, Anzeigename
- E-Mail (read-only, Login-Identität)

**B) Adresse**
- Straße, Hausnummer
- PLZ, Stadt, Land

**C) Kontaktdaten**
- Telefon Festnetz
- Telefon Mobil
- WhatsApp

**D) Steuerliche Daten**
- Steuernummer
- Steuer-ID

**Datenquelle**: `profiles` (Core)

### 3.3 Verträge (`/portal/stammdaten/vertraege`)

**Purpose**: Zentrale Übersicht aller abgeschlossenen Vereinbarungen

**Aggregierte Datenquellen**:

| Quelle | Vertragstyp | Icon |
|--------|-------------|------|
| `user_consents` + `agreement_templates` | AGB, Datenschutz, SCHUFA | FileText, Shield, FileCheck |
| `finance_mandates` | Finanzierungsbeauftragung | Landmark |
| `listings` (mit `sales_mandate_consent_id`) | Verkaufsmandate | Tag |
| `commissions` (mit `agreement_consent_id`) | Provisionsvereinbarungen | Coins |
| `acq_mandates` | Suchaufträge (Akquise) | FileCheck |

**UI-Struktur**:
- Chronologisch sortierte Liste
- Jeder Eintrag: Icon, Titel, Beschreibung, Datum, Status-Badge
- "Öffnen" Button mit Deep-Link zum jeweiligen Modul (falls verfügbar)
- Info-Card mit Erklärung der Vertragstypen

**Status-Mapping**:
- `accepted` / `active` / `approved` → grün (default)
- `pending` / `draft` → grau (secondary)
- `rejected` / `cancelled` → rot (destructive)

### 3.4 Abrechnung (`/portal/stammdaten/abrechnung`)

**Purpose**: Billing, Credits, Zahlungen

**Sections**:

**A) Aktueller Plan**
- Plan-Name, Features, Preis
- Status-Badge (active, cancelled, etc.)
- Nächste Abrechnung
- Credits-Balance

**B) Rechnungen**
- DataTable mit: Rechnungsnr., Datum, Betrag, Status, PDF-Download
- Status-Varianten: paid (grün), pending (gelb), overdue (rot), cancelled (grau)

**Datenquellen**: `plans`, `subscriptions`, `invoices` (Billing Backbone)

### 3.5 Sicherheit (`/portal/stammdaten/sicherheit`)

**Purpose**: Account-Sicherheit

**Sections**:

**A) Passwort ändern**
- Neues Passwort (min. 8 Zeichen)
- Passwort bestätigen
- Show/Hide Toggle

**B) Aktive Sitzungen**
- DataTable: Gerät, IP, Zuletzt aktiv, Status
- "Beenden" Button für nicht-aktuelle Sessions

**C) Sicherheits-Log**
- DataTable: Ereignis, Zeitpunkt, IP, Status
- Gefiltert auf sicherheitsrelevante Events

---

## 4. Datenmodell

### 4.1 Core-Tabellen

| Tabelle | Owner | Verwendung |
|---------|-------|------------|
| `profiles` | Core | Profil-Daten |
| `organizations` | Core | Tenant-Info (für Context) |
| `memberships` | Core | Rollen-Prüfung |

### 4.2 Vertrags-Tabellen (Read-Only in MOD-01)

| Tabelle | Owner | Verwendung |
|---------|-------|------------|
| `user_consents` | Backbone | AGB, Datenschutz, SCHUFA |
| `agreement_templates` | Backbone | Template-Metadaten |
| `finance_mandates` | MOD-07 | Finanzierungsbeauftragungen |
| `listings` | MOD-06 | Verkaufsmandate (via FK) |
| `commissions` | MOD-06/09 | Provisionsvereinbarungen |
| `acq_mandates` | MOD-08/12 | Suchaufträge |

### 4.3 Billing-Tabellen

| Tabelle | Owner | Verwendung |
|---------|-------|------------|
| `plans` | Billing | Verfügbare Pläne |
| `subscriptions` | Billing | Aktive Abonnements |
| `invoices` | Billing | Rechnungen |

---

## 5. Komponenten im Repository

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/portal/StammdatenPage.tsx` | Haupt-Router mit 4-Tile-Pattern |
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Profil-Formular (4 Cards) |
| `src/pages/portal/stammdaten/VertraegeTab.tsx` | Vertrags-Aggregation |
| `src/pages/portal/stammdaten/AbrechnungTab.tsx` | Billing-Übersicht |
| `src/pages/portal/stammdaten/SicherheitTab.tsx` | Passwort, Sessions, Log |
| `src/pages/portal/stammdaten/index.ts` | Exporte |

---

## 6. API Contract

### Profil (Backbone API-010..011)
- `GET profiles.select().eq('id', user.id)` → eigenes Profil
- `PATCH profiles.update()` → Profil aktualisieren

### Verträge (Aggregations-Queries)
- `user_consents.select('*, agreement_templates(*)')` → Consents
- `finance_mandates.select('*, finance_requests(public_id)')` → Finance
- `listings.select('*, properties(address, city)')` → Sales
- `commissions.select('*')` → Provisionen
- `acq_mandates.select('*')` → Suchaufträge

### Abrechnung
- `subscriptions.select('*, plans(*)')` → Aktueller Plan
- `invoices.select('*')` → Rechnungsliste

### Sicherheit
- `supabase.auth.updateUser({ password })` → Passwort ändern

---

## 7. Berechtigungen (RLS)

| Aktion | Berechtigung |
|--------|--------------|
| Eigenes Profil lesen/schreiben | Self (auth.uid() = id) |
| Consents lesen | Self (user_id = auth.uid()) |
| Finance Mandates lesen | Tenant Member |
| Listings/Commissions lesen | Tenant Member |
| Billing sehen | Tenant Member |

---

## 8. Cross-Module Dependencies

| Modul | Abhängigkeit | Datenfluss |
|-------|--------------|------------|
| Zone 1 | `tile_catalog`, `tenant_tile_activation` | Modul-Aktivierung |
| MOD-03 DMS | Storage für Avatar-Upload | WRITE |
| MOD-06 Verkauf | `listings`, `commissions` | READ |
| MOD-07 Finanzierung | `finance_mandates` | READ |
| MOD-08 Investment | `acq_mandates` | READ |
| Backbone | `user_consents`, `agreement_templates` | READ |
| Billing | `plans`, `subscriptions`, `invoices` | READ |

---

## 9. Acceptance Criteria

- [x] AC1: How-It-Works Landingpage mit 4 Sub-Tiles
- [x] AC2: Profil kann bearbeitet werden (Name, Avatar, Adresse, Kontakt)
- [x] AC3: Verträge-Tab aggregiert alle Vereinbarungen
- [x] AC4: Aktueller Plan wird angezeigt
- [x] AC5: Rechnungen werden gelistet
- [x] AC6: Passwort kann geändert werden
- [x] AC7: Sessions werden angezeigt

---

## 10. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-01-25 | Initial (mit "Firma" Tab) |
| **2.0** | **2026-02-06** | **Umstrukturierung:** "Firma" → "Verträge", "Personen" entfernt, 4-Tile-Pattern, zentrale Vertragsübersicht |

---

*Dieses Dokument ist der verbindliche Spezifikationsstand für MOD-01.*
