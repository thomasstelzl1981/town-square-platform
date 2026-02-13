# MOD-04 — IMMOBILIEN (Property Portfolio SSOT)

> **Version**: 2.0.0  
> **Status**: FROZEN  
> **Datum**: 2026-02-03  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/immobilien`  
> **SSOT-Rolle**: Source of Truth für Properties, Units, Leases, Loans, WEG/NK, Documents

---

## 1. Executive Summary

MOD-04 "Immobilien" ist das **Single Source of Truth (SSOT)** für alle Objekt-, Einheiten- und Mietvertragsdaten im System.

**Downstream-Module (MOD-05 MSV, MOD-06 Verkauf) DÜRFEN KEINE eigenen Objekt-/Einheitendaten führen.** Sie lesen ausschließlich aus MOD-04 und ergänzen lediglich modulspezifische Daten (Zahlungen, Listings, etc.).

---

## 2. FROZEN RULES (Non-Negotiable)

| ID | Regel |
|----|-------|
| **R1** | MOD-04 ist SSOT für: `properties`, `units`, `leases`, `loans`, `nk_periods`, `storage_nodes`, `document_links` |
| **R2** | Kanonische Dossier-Route: `/portal/immobilien/:propertyId` (Tab "Akte" = EditableUnitDossierView) |
| **R3** | Create-Flow: EINE Route `/portal/immobilien/neu` → Redirect zu `/portal/immobilien/:propertyId` |
| **R4** | Portfolio-Liste: `/portal/immobilien/portfolio` — Eye-Action öffnet IMMER kanonisches Dossier |
| **R5** | Navigation: Nur 3 primäre Pfade: `neu`, `portfolio`, `:propertyId` |
| **R6** | DMS-Integration: Uploads via DMS (MOD-03), MOD-04 zeigt nur `document_links` |
| **R7** | Flags steuern Downstream: `sale_enabled` → MOD-06, `rental_managed` → MOD-05 |

---

## 3. Route-Struktur (BINDING)

### 3.1 Primäre Routen

| Route | Komponente | Beschreibung |
|-------|------------|--------------|
| `/portal/immobilien` | ImmobilienPage | Module Landing (How It Works) |
| `/portal/immobilien/portfolio` | PortfolioTab | Portfolio-Dashboard + Liste |
| `/portal/immobilien/neu` | CreatePropertyDialog (Modal) | Minimal-Wizard → Redirect zu Dossier |
| `/portal/immobilien/:propertyId` | PropertyDetail | **Kanonisches Dossier (Immobilienakte)** |

### 3.2 Sekundäre Routen (Redirects)

| Route | Redirect | Beschreibung |
|-------|----------|--------------|
| `/portal/immobilien/kontexte` | → `/portal/immobilien/portfolio` | Vermieter-Kontext Verwaltung (integriert in Portfolio) |

### 3.3 Legacy Redirects

| Von | Nach | Grund |
|-----|------|-------|
| `/portfolio` | `/portal/immobilien/portfolio` | Legacy URL |
| `/portfolio/new` | `/portal/immobilien/neu` | Legacy URL |
| `/portfolio/:id` | `/portal/immobilien/:id` | Legacy URL |

---

## 4. Dossier-Struktur (Immobilienakte)

Die Immobilienakte unter `/portal/immobilien/:propertyId` rendert `EditableUnitDossierView` mit 10 Funktionsblöcken:

### Block A: Identität/Zuordnung
- Unit-Code, Property-Type, Category (einzelobjekt/globalobjekt)
- Status, Flags: `sale_enabled`, `rental_managed`
- Vermieter-Kontext Assignment
- Reporting Regime (V+V / SuSa-BWA)

### Block B: Adresse
- Straße, Hausnummer, PLZ, Ort
- Geo-Koordinaten (optional)
- Lagenotizen

### Block C: Gebäude/Technik
- Baujahr, Nutzung, Flächen
- Heizung, Energieträger
- Energieausweis (Typ, Wert, Gültigkeit)
- Feature-Tags

### Block D: Recht/Grundbuch
- Grundbuch (Gericht, Blatt, Band, Flurstück)
- TE-/MEA-Nummer
- Kaufdatum, Kaufpreis, Verkehrswert
- Erwerbsnebenkosten

### Block E: Investment-KPIs (Jahreswerte p.a.)
- Jahresnettokaltmiete
- Brutto-/Nettorendite
- Cashflow vor Steuern
- Leerstands-Tage

### Block F: Mietverhältnisse (Multi-Lease Support)
- Aktueller Status: ACTIVE / VACANT / TERMINATING
- Primärer Mietvertrag (Anzeige)
- Summen bei Multi-Lease (TG, WG, etc.)
- Kaltmiete, NK-VZ, HK-VZ, Warmmiete
- Kaution, Kündigungstermine

### Block G: WEG/Nebenkosten
- MEA-Anteil, Hausgeld
- Aktuelle Periode
- Letzte Abrechnung, Saldo
- Umlageschlüssel

### Block H: Finanzierung (Darlehen)
- Bank, Darlehensnummer
- Ursprungsbetrag, Restschuld
- Zinssatz, Zinsbindung
- Annuität, Tilgungsrate
- Sondertilgungsrecht

### Block I: Buchhaltung (Minimal)
- AfA-Methode
- Kontenrahmen-Version

### Block J: Dokumente (Data Room)
- Checkliste mit Status pro Dokumenttyp
- link_status: `pending` → `needs_review` → `accepted` → `current`
- Dropzone für Uploads (via DMS)

---

## 5. Portfolio-Liste (PortfolioTab)

### 5.1 Spalten (Reihenfolge fix)

| # | Spalte | Quelle |
|---|--------|--------|
| 1 | Code | properties.code |
| 2 | Art | properties.property_type |
| 3 | Objekt (Adresse) | properties.address, city |
| 4 | Einheit | units.unit_number |
| 5 | m² | units.area_sqm |
| 6 | Mieter | leases (aggregiert) |
| 7 | Miete p.a. | annual_net_cold_rent |
| 8 | Verkehrswert | properties.market_value |
| 9 | Restschuld | property_financing.current_balance |
| 10 | Annuität p.a. | annuity_pa |
| 11 | Zins p.a. | interest_pa |
| 12 | Tilgung p.a. | amortization_pa |

### 5.2 Aktionen

- **Row Click / Eye-Icon**: Öffnet `/portal/immobilien/:propertyId`
- **Button "Neue Immobilie"**: Öffnet CreatePropertyDialog (Modal)

### 5.3 Filter

- Vermieter-Kontext (SubTabNav wenn > 1 Kontext)
- Flags: sale_enabled, rental_managed
- Property Type, City

### 5.4 Empty State

```
"Noch keine Immobilien"
CTA: "Neue Immobilie anlegen" → öffnet Modal
```

---

## 6. Create-Flow

### 6.1 Trigger

- Button in PortfolioTab: öffnet `CreatePropertyDialog` (Modal)
- **KEINE separate Route** — Modal im Portfolio

### 6.2 Minimal-Felder

| Feld | Pflicht | Default |
|------|---------|---------|
| Ort | ✅ | – |
| Adresse | ✅ | – |
| Objektart | ✅ | ETW |

### 6.3 Automatische Generierung (DB-Trigger)

Bei INSERT in `properties`:
1. `code` (Public-ID): Generiert via Trigger
2. MAIN-Unit: Automatisch erstellt
3. Storage-Ordnerstruktur: 18-Ordner Template PROPERTY_DOSSIER_V1

### 6.4 Redirect

Nach erfolgreichem INSERT → Navigate zu `/portal/immobilien/:id`

---

## 7. Document Linking (SSOT)

### 7.1 Upload-Flow

1. User lädt Dokument hoch (Dropzone in Dossier)
2. `useSmartUpload` Hook:
   - Erstellt `documents` Row (Metadaten)
   - Erstellt `document_links` Row mit:
     - `object_type: 'unit'`
     - `object_id: unitId`
     - `unit_id: unitId`
     - `link_status: 'pending'`
3. Optional: AI-Klassifikation → `doc_type` + `link_status: 'needs_review'`

### 7.2 Status-Lifecycle

```
pending → needs_review → accepted → current
                      ↘ rejected
```

### 7.3 UI-Darstellung

- **DocumentChecklist**: Zeigt Status pro Dokumenttyp
- **Dropzone**: Erlaubt Drag & Drop Upload

---

## 8. Cross-Module Contracts

### 8.1 MOD-05 MSV (Read Contract)

**Liest aus MOD-04:**
- `units` + `properties` (alle Einheiten, KEIN Filter auf rental_managed)
- `leases` (für Mietverhältnisse)
- `contacts` (für Mieter-Info)

**Schreibt selbst:**
- `msv_enrollments` (Premium-Status)
- `msv_payment_reports` (Mietberichte)
- Mahnungen, Reminder

**Navigation von Dossier:**
- CTA "In MSV öffnen" → `/portal/msv` (prefiltered by propertyId)

### 8.2 MOD-06 Verkauf (Read Contract)

**Liest aus MOD-04:**
- `units` + `properties` (alle, KEIN Filter auf sale_enabled)
- Property-Details für Exposé-Generierung

**Schreibt selbst:**
- `listings` (Inserat-Payload)
- `listing_publications` (Channels: Kaufy, Partner, Scout24)
- `inquiries`, `reservations`, `transactions`

**Navigation von Dossier:**
- CTA "In Verkauf öffnen" → `/portal/verkauf/expose/:id`

---

## 9. Navigation (REQUIRED)

### 9.1 PortalNav Tiles

| Tile | Route |
|------|-------|
| Immobilien | `/portal/immobilien` |
| → Portfolio | `/portal/immobilien/portfolio` |
| → Sanierung | `/portal/immobilien/sanierung` |
| → Bewertung | `/portal/immobilien/bewertung` |
| → Verwaltung | `/portal/immobilien/verwaltung` |

> **Note:** Vermietereinheiten (Kontexte) werden im Portfolio-Tab über den "Verwalten"-Button verwaltet.

| CTA | Bedingung | Ziel |
|-----|-----------|------|
| "In MSV öffnen" | rental_managed = true | `/portal/msv?property_id=:id` |
| "In Verkauf öffnen" | sale_enabled = true | `/portal/verkauf/expose/:id` |
| "Im DMS öffnen" | immer | `/portal/dms/storage?property_id=:id` |

---

## 10. Acceptance Checks

### 10.1 Route Correctness

- [ ] `/portal/immobilien/portfolio` rendert PortfolioTab
- [ ] Eye-Action in Liste öffnet `/portal/immobilien/:propertyId`
- [ ] CreatePropertyDialog öffnet als Modal (kein /neu-Route-Load)
- [ ] Nach Create: Redirect zu `/portal/immobilien/:id`
- [ ] Legacy `/portfolio/*` Redirects funktionieren

### 10.2 SSOT Correctness

- [ ] MOD-05 ObjekteTab liest aus `units` (kein eigener Datenbestand)
- [ ] MOD-06 ObjekteTab liest aus `units` (kein eigener Datenbestand)
- [ ] Document Uploads erstellen `document_links` mit korrektem object_type

### 10.3 Smoke Test URLs

```
/portal/immobilien
/portal/immobilien/portfolio
/portal/immobilien/:propertyId (mit existierender ID)
/portal/immobilien/kontexte
/portal/msv (MOD-05 liest aus MOD-04)
/portal/verkauf (MOD-06 liest aus MOD-04)
/portfolio (Legacy Redirect)
```

---

## 11. Deprecation Notice

Die folgenden Routes/Konzepte sind **DEPRECATED**:

- `/portal/immobilien/vorlage` — Ersetzt durch Modal-Create
- Separate Create-Route `/portal/immobilien/new` — Ersetzt durch Modal
- Jegliche parallele Property-/Unit-Datenhaltung in MOD-05/MOD-06

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 2.0.0 | 2026-02-03 | Vollständige SSOT-Konsolidierung, Manifest-Alignment, Downstream-Contracts |
| 1.1 | 2026-01-25 | Initial Spec |
