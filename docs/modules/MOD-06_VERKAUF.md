# MOD-06 — VERKAUF (Sales & Listings)

**Version:** v2.2.0  
**Status:** ACTIVE  
**Letzte Aktualisierung:** 2026-02-06  
**Zone:** 2 (User Portal)  
**Route-Prefix:** `/portal/verkauf`  
**Typ:** Standard-Modul (alle Tenants)  
**Abhängig von:** MOD-04 (Properties), MOD-01 (Contacts), MOD-03 (DMS), Backbone (Consents, Audit)

> **Audit-Status:** 85% Complete  
> **Letzte Prüfung:** 2026-02-06

---

## 0) AUDIT-ZUSAMMENFASSUNG (2026-02-06)

### Completion Status: 85%

| Bereich | Status | Details |
|---------|--------|---------|
| Datenbank-Struktur | ✅ 100% | 9 Tabellen mit RLS |
| Exposé-Detail | ✅ 100% | Scout24-Style, SSOT-konform |
| DMS-Bildergalerie | ✅ 100% | Neu implementiert |
| View Tracking | ✅ 100% | listing_views mit Session-Deduplizierung |
| Location Map | ✅ 100% | Google Maps Integration vorbereitet |
| Reporting | ✅ 95% | Echtzeit-Views aus DB |
| Anfragen-Tab | ✅ 100% | Inquiry Management |
| Publishing Workflow | ✅ 90% | Partner + Kaufy funktionsfähig |
| Reservierungen | ⚠️ 60% | UI-Grundstruktur vorhanden |
| Transaktionen | ⚠️ 50% | Basis-Struktur, Workflow pending |

### SSOT-Konsistenz mit Golden Path

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Objektdaten aus MOD-04 | ✅ | properties, units (READ-ONLY) |
| AfA-Daten aus MOD-04 | ✅ | property_accounting (READ-ONLY) |
| Bilder aus MOD-03 DMS | ✅ | document_links → documents |
| Listing-spezifische Daten | ✅ | title, description, asking_price (WRITE) |
| Partner-First Workflow | ✅ | Kaufy erst nach Partner-Freigabe |

### Implementierte Komponenten

| Komponente | Datei | Status |
|------------|-------|--------|
| ExposeDetail | `src/pages/portal/verkauf/ExposeDetail.tsx` | ✅ PRODUCTION |
| ExposeImageGallery | `src/components/verkauf/ExposeImageGallery.tsx` | ✅ NEW |
| ExposeLocationMap | `src/components/verkauf/ExposeLocationMap.tsx` | ✅ NEW |
| useViewTracking | `src/hooks/useViewTracking.ts` | ✅ NEW |
| AnfragenTab | `src/pages/portal/verkauf/AnfragenTab.tsx` | ✅ NEW |
| ReportingTab | `src/pages/portal/verkauf/ReportingTab.tsx` | ✅ UPDATED |

---

## 1) MODULDEFINITION

### 1.1 Ziel

MOD-06 „Verkauf" ist das operative Modul für den Immobilienverkauf aus **Eigentümersicht**. Es transformiert Properties (MOD-04) in verkaufsfähige Listings und verwaltet den gesamten Sales-Lifecycle bis zur Transaktion.

**Kernfunktion:** Veröffentlichung von Objekten über 4 Kanäle + Management des gesamten Verkaufsprozesses.

### 1.2 SSOT-Prinzip (BINDING)

| Datenbereich | SSOT | MOD-06 Zugriff |
|--------------|------|----------------|
| Objektstammdaten | MOD-04 | READ-ONLY |
| Einheiten-Daten | MOD-04 | READ-ONLY |
| AfA/Accounting | MOD-04 | READ-ONLY |
| Bilder/Dokumente | MOD-03 DMS | READ-ONLY (via document_links) |
| Verkaufs-Texte | MOD-06 | WRITE (title, description) |
| Preise/Provisionen | MOD-06 | WRITE (asking_price, commission_rate) |
| Publications | MOD-06 | WRITE |

### 1.3 Marken-Hinweis (FROZEN)

| Element | Kontext | Bedeutung |
|---------|---------|-----------|
| **Kaufy** | Publishing-Channel | Kaufy ist die Zone-3-Marktplatz-MARKE, nicht ein Modul |
| **Kaufy** | Im Wizard | "Auf Kaufy veröffentlichen" ist Channel-Name |
| **Kaufy** | Im Code | `channel = 'kaufy'` |

### 1.4 Nutzerrollen

| Rolle | Zugang | Beschreibung |
|-------|--------|--------------|
| org_admin | Full | Listings erstellen, aktivieren, Deals abschließen |
| internal_ops | Write | Listings bearbeiten, Anfragen bearbeiten |
| sales_partner | Read | Nur Partner-sichtbare Listings (via MOD-09) |

### 1.5 Scope IN (testbar)

- Listing aus Property erstellen (mit SALES_MANDATE Consent)
- Listing-Lifecycle: draft → review → active → reserved → sold/withdrawn
- **4 Publishing-Kanäle:** Kaufy (Zone 3), Scout24, Kleinanzeigen, Partner-Netzwerk
- Partner-Visibility Flags setzen
- Inquiry Management (Anfragen erfassen, zuordnen)
- Reservation Workflow
- Transaction Documentation (Notartermin, BNL)
- DMS-Integration für Verkaufsunterlagen
- **View Tracking** für Reporting

### 1.6 Scope OUT (Nicht-Ziele)

- Partner-Pipeline Management (→ MOD-09)
- Commission Berechnung/Auszahlung (→ MOD-09)
- Financing Package Creation (→ MOD-07)
- Lead-Generierung/Ads (→ MOD-10)

### 1.7 Source of Truth Matrix

| Domäne | SoT-Modul | Andere Module |
|--------|-----------|---------------|
| Listings | **MOD-06** | MOD-08: Read-only |
| listing_publications | **MOD-06** | — |
| listing_views | **MOD-06** | — |
| listing_partner_terms | **MOD-06** | MOD-08: Read |
| Inquiries | **MOD-06** | — |
| Reservations | **MOD-06** | MOD-08: Status-Read |
| Transactions | **MOD-06** | — |
| Properties | MOD-04 | MOD-06: Read-only |
| Partner Pipelines | MOD-08 | MOD-06: — |

---

## 2) ROUTE-STRUKTUR (SoT App.tsx)

| Route | UI-Label | Screen | Beschreibung |
|-------|----------|--------|--------------|
| `/portal/verkauf` | Dashboard | VerkaufDashboard | KPIs, Pipeline-Overview, Alerts |
| `/portal/verkauf/objekte` | Objekte | VerkaufObjekte | Listing-Liste mit Filtern |
| `/portal/verkauf/objekte/expose/:unitId` | Exposé | ExposeDetail | **NEU:** Verkaufsexposé |
| `/portal/verkauf/aktivitaeten` | Aktivitäten | VerkaufAktivitaeten | Timeline, Logs |
| `/portal/verkauf/anfragen` | Anfragen | AnfragenTab | **NEU:** Inquiry Management |
| `/portal/verkauf/vorgaenge` | Vorgänge | VerkaufVorgaenge | Reservations + Transactions |
| `/portal/verkauf/reporting` | Reporting | ReportingTab | View-Statistiken |

---

## 3) EXPOSÉ-DETAIL (Scout24-Style)

### 3.1 Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Header: [←] Verkaufsexposé | [Objekt-Adresse] | [Status] [Speichern] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────┐  ┌─────────────────────────┐ │
│  │ HAUPTBEREICH (2/3)            │  │ SIDEBAR (1/3)           │ │
│  │                               │  │                         │ │
│  │ ┌───────────────────────────┐ │  │ Freigabe-Card           │ │
│  │ │ Bildergalerie (DMS)       │ │  │ - Checklist             │ │
│  │ │ - Hauptbild               │ │  │ - [Verkaufsauftrag]     │ │
│  │ │ - 4 Thumbnails            │ │  │                         │ │
│  │ │ - Lightbox                │ │  │ Partner-Netzwerk        │ │
│  │ └───────────────────────────┘ │  │ - [Freigabe starten]    │ │
│  │                               │  │                         │ │
│  │ ┌───────────────────────────┐ │  │ Kaufy-Marktplatz        │ │
│  │ │ Location Map (Google)     │ │  │ - [Switch]              │ │
│  │ └───────────────────────────┘ │  │                         │ │
│  │                               │  │ Scout24 (Phase 2)       │ │
│  │ Key Facts Bar                 │  │                         │ │
│  │ [Preis] [m²] [Zimmer] [Rendite] │ │ Kennzahlen-Karte       │ │
│  │                               │  │                         │ │
│  │ Tabs:                         │  └─────────────────────────┘ │
│  │ [Verkauf] [Objekt] [Rendite] [Energie] │                    │
│  │                               │                              │
│  └──────────────────────────────┘                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Tab-Inhalte

| Tab | Inhalt | Editierbar |
|-----|--------|------------|
| **Verkaufsdaten** | Titel, Beschreibung, Preis, Provision | ✅ JA |
| **Objektdaten** | Grunddaten, Baujahr, Adresse | ❌ NEIN (MOD-04) |
| **Rendite & AfA** | Mietrendite, AfA-Modell, AfA-Satz | ❌ NEIN (MOD-04) |
| **Energie** | Heizungsart, Energieträger, Effizienzklasse | ❌ NEIN (MOD-04) |

### 3.3 KI-Beschreibung

- Button "Mit KI generieren" ruft `sot-expose-description` Edge Function
- Beschreibung kann manuell bearbeitet und gespeichert werden
- Berücksichtigt automatisch: Objektdaten, Lage, Renditepotenzial

### 3.4 Bildergalerie (DMS-Integration)

- Lädt Bilder aus `document_links` mit `object_type='property'`
- Zeigt Signed URLs mit 1h TTL
- Lightbox für Vollbildansicht
- Bei 0 Bildern: Platzhalter mit Link zur Immobilienakte

### 3.5 Location Map

- Zeigt Stadt/PLZ als Platzhalter (Datenschutz)
- Bei aktiven Listings: Exakte Adresse
- Google Maps Embed (kostenlos) oder Link zu Maps

---

## 4) VIEW TRACKING

### 4.1 Tabelle: listing_views

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | uuid | PK |
| listing_id | uuid | FK listings |
| tenant_id | uuid | FK organizations |
| viewer_session | text | Session-ID für Deduplizierung |
| viewer_ip_hash | text | Anonymisierter Hash |
| source | text | 'portal', 'kaufy', 'partner' |
| referrer | text | Ursprungsseite |
| viewed_at | timestamptz | Zeitstempel |

### 4.2 Tracking-Hook

```typescript
// src/hooks/useViewTracking.ts
useViewTracking({
  listingId: listing?.id,
  tenantId: listing?.tenant_id,
  source: 'portal', // oder 'kaufy', 'partner'
  enabled: listing?.status !== 'draft'
});
```

### 4.3 Deduplizierung

- Pro Session wird nur 1 View gezählt
- Session-ID in sessionStorage
- Tracking nur für non-draft Listings

---

## 5) PUBLISHING-KANÄLE (4 Channels)

### 5.1 Übersicht

| Kanal | Kosten | Gate/Agreements | Zielgruppe |
|-------|--------|-----------------|------------|
| **Kaufy** (mit y) | Kostenlos | SALES_MANDATE + PARTNER_RELEASE | Öffentlich (Zone 3) |
| **Immobilienscout24** | Bezahlt (Credits) | SCOUT24_CREDITS | Öffentlich |
| **eBay Kleinanzeigen** | Link-Eintrag | — | Öffentlich (extern) |
| **Partner-Netzwerk** | Kostenlos | PARTNER_RELEASE + SYSTEM_FEE | Finanzvertrieb |

### 5.2 Partner-First-Regel (BINDING)

**Kaufy-Freigabe erfordert vorherige Partner-Freigabe.**

Workflow:
1. Verkaufsauftrag erteilen (SALES_MANDATE)
2. Partner-Freigabe starten (PARTNER_RELEASE + SYSTEM_SUCCESS_FEE_2000)
3. Dann: Kaufy-Toggle verfügbar

---

## 6) REPORTING

### 6.1 KPIs (Summary Cards)

| KPI | Berechnung |
|-----|------------|
| Aktive Listings | COUNT(listings WHERE status='active') |
| Auf Kaufy | COUNT(publications WHERE channel='kaufy' AND status='active') |
| Im Partner-Netzwerk | COUNT(publications WHERE channel='partner_network' AND status='active') |
| Anfragen gesamt | COUNT(listing_inquiries) |

### 6.2 Performance-Tabelle

| Spalte | Quelle |
|--------|--------|
| Objekt | listings.title + property.address |
| Preis | listings.asking_price |
| Status | listings.status |
| Kanäle | listing_publications (Badges) |
| Views | COUNT(listing_views) |
| Anfragen | COUNT(listing_inquiries) |

---

## 7) DATENMODELL

### 7.1 Tabellen-Übersicht

| Tabelle | Owner | Status |
|---------|-------|--------|
| listings | MOD-06 | ✅ EXISTS |
| listing_publications | MOD-06 | ✅ EXISTS |
| listing_views | MOD-06 | ✅ EXISTS |
| listing_partner_terms | MOD-06 | ✅ EXISTS |
| listing_inquiries | MOD-06 | ✅ EXISTS |
| listing_activities | MOD-06 | ✅ EXISTS |
| reservations | MOD-06 | ✅ EXISTS |
| transactions | MOD-06 | ✅ EXISTS |

---

## 8) CROSS-MODULE DEPENDENCIES

### MOD-06 → MOD-04 (Properties) — READ-ONLY

| Zugriff | Tabelle | Felder |
|---------|---------|--------|
| Objektdaten | properties | address, city, property_type, year_built, etc. |
| Einheiten | units | area_sqm, current_monthly_rent |
| AfA-Daten | property_accounting | afa_rate_percent, afa_method, building_share_percent |

### MOD-06 → MOD-03 (DMS) — READ-ONLY

| Zugriff | Tabelle | Filter |
|---------|---------|--------|
| Bilder | document_links → documents | object_type='property', mime_type LIKE 'image/%' |

### MOD-06 → MOD-09 (Vertriebspartner)

| Trigger | Effect |
|---------|--------|
| finance_distribution_enabled=true | Listing in MOD-09 Objektkatalog |
| partner_commission_rate gesetzt | Rate sichtbar in Katalog |

### MOD-06 → Zone 3 (Kaufy)

| Trigger | Effect |
|---------|--------|
| publication.kaufy.status='active' | Listing auf kaufy.de sichtbar |
| View auf Zone 3 | INSERT in listing_views mit source='kaufy' |

---

## 9) NÄCHSTE SCHRITTE

| Prio | Aufgabe | Status |
|------|---------|--------|
| P0 | View Tracking in Zone 3 implementieren | ⏳ PENDING |
| P1 | Reservierungs-Workflow vervollständigen | ⏳ PENDING |
| P1 | Transaktions-Meilensteine | ⏳ PENDING |
| P2 | Scout24 API Integration | ⏳ PLANNED |
| P2 | Kleinanzeigen Link-Tracking | ⏳ PLANNED |

---

## 10) CHANGELOG

| Version | Datum | Änderung |
|---------|-------|----------|
| 2.0.0 | 2026-01-25 | Initial vollständige Spec |
| 2.1.0 | 2026-01-25 | MOD-08 → MOD-09 Referenzen |
| **2.2.0** | **2026-02-06** | **Audit durchgeführt**: ExposeDetail refactored (SSOT), DMS-Bildergalerie, View Tracking, Location Map, AnfragenTab, Routing-Fix |

---

*Dieses Dokument ist der verbindliche Spezifikationsstand für MOD-06.*
