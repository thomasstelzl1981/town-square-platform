# MOD-08 — INVESTMENT-SUCHE (Vervollständigt v3.0)

**Version:** v3.0  
**Status:** ACTIVE  
**Datum:** 2026-02-06  
**Zone:** 2 (User Portal)  
**Route-Prefix:** `/portal/investments`  
**API-Range:** API-400..499  
**Edge Functions:** `sot-investment-engine` (INTERNAL-005)

---

## 1) Executive Summary

MOD-08 "Investment-Suche" ist das zentrale Modul für Investoren, die Kapitalanlage-Immobilien suchen und bewerten möchten. Es implementiert **zwei völlig unabhängige Workflows**:

| Workflow | Beschreibung | Datenfluss |
|----------|--------------|------------|
| **A: Suche & Simulation** | Selbstständige Objektsuche + Portfolio-Analyse | MOD-06 Listings → Favoriten → Simulation → MOD-07 |
| **B: Akquise-Mandat** | Suchauftrag an Akquise-Manager | MOD-08 Mandat → Zone 1 Acquiary → MOD-12 |

---

## 2) Route-Struktur (4-Tile-Pattern)

| # | Name | Route | Beschreibung |
|---|------|-------|--------------|
| 0 | How It Works | `/portal/investments` | Landingpage mit Erklärung |
| 1 | Suche | `/portal/investments/suche` | Investment-Suche mit zVE + EK |
| 2 | Favoriten | `/portal/investments/favoriten` | Gespeicherte Objekte |
| 3 | Mandat | `/portal/investments/mandat` | Suchauftrag an Zone 1 |
| 4 | Simulation | `/portal/investments/simulation` | Portfolio-Projektion |

### Dynamische Routes

| Route | Beschreibung |
|-------|--------------|
| `/portal/investments/mandat/neu` | MandatCreateWizard (5 Steps) |
| `/portal/investments/mandat/:mandateId` | MandatDetail (Status + Timeline) |

---

## 3) Workflow A: Suche & Simulation

### 3.1 Datenquelle

Objekte kommen aus MOD-06 (Verkauf) über freigegebene Listings:

```text
MOD-04 (Property)
    │
    ▼
MOD-06 (Listing + Publications)
    │
    ├─── Partner-Netzwerk freigeben → MOD-09 Katalog
    │
    └─── Kaufy freigeben → Zone 3 Marktplatz
                       → MOD-08 Suche
```

### 3.2 Suche (`/portal/investments/suche`)

**Zwei Modi (Toggle):**

| Modus | Eingabe | Berechnung |
|-------|---------|------------|
| **Investment-Suche** | zVE, Eigenkapital | `sot-investment-engine` → monatl. Belastung |
| **Klassische Suche** | Stadt, Preis, Fläche, Rendite | Direkte DB-Query |

**Erweiterte Optionen:**
- Familienstand (ledig/verheiratet)
- Kirchensteuer (ja/nein)
- Bundesland (für Kirchensteuersatz)

**Ergebnis:** Objekte mit berechneter monatlicher Belastung. Heart-Toggle speichert in `investment_favorites`.

### 3.3 Favoriten (`/portal/investments/favoriten`)

**Gespeicherte Daten pro Favorit:**
- Listing-Referenz (`listing_id`)
- Such-Parameter (`search_params`: zVE, EK, Familienstand, Kirchensteuer)
- Berechnete Belastung (`calculated_burden`)
- Nutzer-Notizen

**Aktionen:**
- Zur Simulation hinzufügen
- Anfrage stellen (→ MOD-07 Finanzierung)
- Bearbeiten (Notizen)
- Entfernen (Soft-Delete)

### 3.4 Simulation (`/portal/investments/simulation`)

**Drei Bereiche:**

**A) Aktuelles Portfolio (MOD-04 Spiegelung)**
- Aggregation aus `properties`, `units`, `loans`
- KPIs: Objekte, Verkehrswert, Restschuld, Netto-Vermögen
- EÜR: Einnahmen (Miete) vs. Ausgaben (Zins, Tilgung)

**B) Objekt hinzufügen**
- Dropdown: Aus Favoriten wählen
- Finanzierungsparameter anpassen (EK, Zins, Tilgung)

**C) Kombinierte Projektion**
- 40-Jahres-Chart (ComposedChart)
- Detailtabelle (Jahr, Miete, Zinsen, Tilgung, Restschuld, Wert, Vermögen)
- Slider: Wertsteigerung p.a. (0-5%), Mietsteigerung p.a. (0-5%)

---

## 4) Workflow B: Akquise-Mandat

### 4.1 Mandat (`/portal/investments/mandat`)

**KRITISCHE ABGRENZUNG:** Ein Mandat hat NICHTS mit den Favoriten zu tun. Es ist ein eigenständiger **Suchauftrag** an einen Akquise-Manager.

**MandatCreateWizard (5 Steps):**
1. Region (Stadt, Umkreis, Bundesländer)
2. Objektart (ETW, MFH, EFH, Gewerbe, Mixed)
3. Budget (Preis-Range, Zielrendite)
4. Details (Ausschlüsse, Hinweise)
5. Bestätigung + Einreichung

### 4.2 Status-Workflow

```text
draft → submitted_to_zone1 → assigned → active → closed
                │
                └─► Zone 1 Acquiary (/admin/acquiary)
                        │
                        └─► MOD-12 Akquise-Manager (/portal/akquise-manager)
```

**Zone 1 Acquiary Sub-Items:**
- Inbox: Neue Mandate (status: submitted_to_zone1)
- Zuweisung: Manager zuweisen
- Mandate: Übersicht aller Mandate
- Audit: Event-Timeline
- Routing: Unzugeordnete Nachrichten

---

## 5) Datenmodell

### 5.1 investment_favorites (erweitert)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | Tenant-Isolation |
| `investment_profile_id` | UUID | FK zu investment_profiles |
| `listing_id` | UUID | FK zu listings (optional) |
| `title` | TEXT | Objekt-Titel |
| `price` | NUMERIC | Kaufpreis |
| `location` | TEXT | Stadt |
| `property_data` | JSONB | Objektdetails |
| `search_params` | JSONB | **NEU:** zVE, EK, Familienstand, Kirchensteuer |
| `calculated_burden` | NUMERIC | **NEU:** Berechnete monatl. Belastung |
| `notes` | TEXT | Nutzer-Notizen |
| `status` | TEXT | active / removed |

### 5.2 acq_mandates

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | PK |
| `tenant_id` | UUID | Tenant-Isolation |
| `code` | TEXT | Public ID (ACQ-XXXXXX) |
| `status` | TEXT | draft, submitted_to_zone1, assigned, active, paused, closed |
| `search_area` | JSONB | Region, Radius, Bundesländer |
| `asset_focus` | TEXT[] | Objektarten |
| `price_min` / `price_max` | NUMERIC | Budget-Range |
| `yield_target` | NUMERIC | Zielrendite |
| `exclusions` | TEXT | Ausschlüsse |
| `notes` | TEXT | Hinweise |
| `assigned_manager_id` | UUID | Zugewiesener Akquise-Manager |

---

## 6) API Contract

### Suche & Favoriten

| API-ID | Method | Endpoint | Auth |
|--------|--------|----------|------|
| API-410 | GET | `/investments/search` | User |
| API-420 | GET | `/investments/favorites` | User |
| API-421 | POST | `/investments/favorites` | User |
| API-422 | DELETE | `/investments/favorites/:id` | User |

### Mandat

| API-ID | Method | Endpoint | Auth |
|--------|--------|----------|------|
| API-430 | GET | `/investments/mandate` | User |
| API-431 | POST | `/investments/mandate` | User |
| API-432 | POST | `/investments/mandate/:id/submit` | User |

### Simulation

| API-ID | Method | Endpoint | Auth |
|--------|--------|----------|------|
| API-440 | GET | `/investments/simulation` | User |
| API-441 | POST | `/investments/simulation/run` | User |

---

## 7) Cross-Module Dependencies

| Modul | Abhängigkeit | Datenfluss |
|-------|--------------|------------|
| MOD-04 | `properties`, `units`, `loans` | READ (Portfolio-Aggregation) |
| MOD-06 | `listings` | READ (Suche) |
| MOD-07 | Deep-Link | WRITE (Finanzierungsanfrage) |
| Zone 1 Acquiary | `acq_mandates` | WRITE (Mandat-Einreichung) |
| MOD-12 | `acq_mandates` | READ (Manager-Zuweisung) |

---

## 8) Komponenten im Repository

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/portal/InvestmentsPage.tsx` | Haupt-Router |
| `src/pages/portal/investments/SucheTab.tsx` | Investment-Suche |
| `src/pages/portal/investments/FavoritenTab.tsx` | Favoriten-Liste |
| `src/pages/portal/investments/MandatTab.tsx` | Mandat-Übersicht |
| `src/pages/portal/investments/MandatCreateWizard.tsx` | 5-Step Wizard |
| `src/pages/portal/investments/MandatDetail.tsx` | Status + Timeline |
| `src/pages/portal/investments/SimulationTab.tsx` | Portfolio-Projektion |
| `src/hooks/useInvestmentFavorites.ts` | CRUD für Favoriten |
| `src/hooks/usePortfolioSummary.ts` | MOD-04 Aggregation |
| `src/hooks/useAcqMandate.ts` | Mandate CRUD |
| `src/components/investment/InvestmentSearchCard.tsx` | Such-Ergebniskarte |

---

## 9) Acceptance Criteria

- [x] AC1: How-It-Works mit zwei Workflows (A: Suche, B: Mandat)
- [x] AC2: Investment-Suche mit zVE + EK → monatl. Belastung
- [x] AC3: Klassische Suche funktioniert
- [x] AC4: Favoriten speichern Such-Parameter
- [x] AC5: Simulation zeigt aktuelles Portfolio + Favorit
- [x] AC6: MandatCreateWizard (5 Steps)
- [x] AC7: Mandat-Einreichung → Status submitted_to_zone1
- [x] AC8: Zone 1 Acquiary zeigt eingereichte Mandate

---

## 10) Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-01-25 | Initial Spec |
| **3.0** | **2026-02-06** | **Komplette Überarbeitung:** Zwei getrennte Workflows (Suche vs. Mandat), DB-Erweiterung search_params/calculated_burden, Zone-1 Acquiary Integration dokumentiert |

---

*Dieses Dokument ist der verbindliche Spezifikationsstand für MOD-08.*
