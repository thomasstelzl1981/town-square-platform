# MOD-12 — AKQUISE-MANAGER (Acquisition Manager Workbench)

**Version:** v2.0.0  
**Status:** ACTIVE  
**Datum:** 2026-02-07  
**Zone:** 2 (User Portal — Partner)  
**Typ:** ROLE-GATED (requires akquise_manager)  
**Route-Prefix:** `/portal/akquise-manager`  
**Abhängig von:** Zone 1 Acquiary, MOD-08 (Investoren-Mandate), MOD-02 (Kontakte)

---

## 1) MODULDEFINITION

### 1.1 Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/akquise-manager` |
| **Icon** | `Briefcase` |
| **Org-Types** | `partner` |
| **Requires Role** | `akquise_manager` |
| **Display Order** | 12 |

### 1.2 Zweck

MOD-12 „Akquise-Manager" ist die **operative Workbench** für Benutzer mit der Rolle `akquise_manager`. Es dient der professionellen Immobilienakquise für Investoren.

**Zwei Einstiegspfade:**

1. **Externe Mandate (Acquiary):** Investoren erstellen Suchmandate in MOD-08 → Zone 1 weist zu → Manager bearbeitet
2. **Eigene Mandate:** Manager erstellt Mandate direkt für eigene Kunden (Contact-First Workflow)

### 1.3 Zielnutzer / Rollen

| Rolle | Zugang | Beschreibung |
|-------|--------|--------------|
| `akquise_manager` | Full | Alle Funktionen |
| `platform_admin` | Read | Oversight (Zone 1 Acquiary) |
| `member` | None | Kein Zugang |

### 1.4 Scope IN

- Mandate annehmen und bearbeiten
- Kontakte recherchieren und anschreiben (Sourcing + Outreach)
- Objekteingänge verwalten (zentrale Inbox)
- Kalkulation durchführen (Bestand + Aufteiler)
- Objekte an Mandanten übergeben (Delivery)
- Standalone-Tools nutzen (ohne Mandat)

### 1.5 Scope OUT (Nicht-Ziele)

- ❌ Keine Kontakt-CRUD (erfolgt in MOD-02)
- ❌ Keine Finanzierungsbearbeitung (MOD-11)
- ❌ Keine Portal-Veröffentlichung (MOD-06)

---

## 2) ARCHITEKTUR-POSITION

### 2.1 Akquise-Service Golden Path

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AKQUISE-SERVICE GOLDEN PATH                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   MOD-08 (Investor)      Zone 1 (Acquiary)      MOD-12 (Manager)       │
│   ═══════════════        ═════════════════      ═══════════════        │
│   Mandat erstellen  ──►  Triage + Zuweisung ──► Annahme + Bearbeitung  │
│   Status-Ansicht         Monitoring             Sourcing, Outreach     │
│                          Manager-Pool           Delivery → Investor     │
│                                                                         │
│   SoT: draft..submitted  SoT: submitted..assigned   SoT: active+       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 SoT-Wechsel bei Annahme

```
Zone 1 (assigned) ──► Manager bestätigt Split ──► MOD-12 wird SoT
                           │
                           ├─► status = 'active'
                           ├─► split_terms_confirmed_at gesetzt
                           └─► Mandanten-Daten werden sichtbar
```

---

## 3) ROUTE-STRUKTUR (4-Tile-Pattern)

### 3.1 Haupt-Tiles

| Route | UI-Label | Komponente | Beschreibung |
|-------|----------|------------|--------------|
| `/portal/akquise-manager/dashboard` | Dashboard | AkquiseDashboard | KPIs + Mandate-Übersicht |
| `/portal/akquise-manager/mandate` | Mandate | AkquiseMandate | Alle zugewiesenen + eigene Mandate |
| `/portal/akquise-manager/objekteingang` | Objekteingang | ObjekteingangList | Zentrale Offer-Inbox |
| `/portal/akquise-manager/tools` | Tools | AkquiseTools | Standalone-Werkzeuge |

### 3.2 Dynamische Routes

| Route | Komponente | Beschreibung |
|-------|------------|--------------|
| `/portal/akquise-manager/mandate/neu` | MandatCreateFlow | Neues Mandat (Contact-First) |
| `/portal/akquise-manager/mandate/:mandateId` | AkquiseMandateDetail | 5-Tab Workbench |
| `/portal/akquise-manager/objekteingang/:offerId` | ObjekteingangDetail | Offer-Bearbeitung |

---

## 4) DATENMODELL

### 4.1 Kerntabellen

#### A) `acq_mandates`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| code | text | Public ID (ACQ-YYYY-XXXXX) |
| tenant_id | uuid FK | Ersteller-Tenant |
| created_by_user_id | uuid FK | Ersteller (Investor oder Manager) |
| client_display_name | text | Anzeigename (nach Gate sichtbar) |
| **Search Criteria** | | |
| search_area | jsonb | Region, Städte, PLZ |
| asset_focus | text[] | Objektarten (MFH, ETW, etc.) |
| price_min / price_max | numeric | Budget-Range |
| yield_target | numeric | Zielrendite |
| exclusions | text | Ausschlüsse |
| notes | text | Hinweise |
| **Workflow** | | |
| status | enum | draft, submitted_to_zone1, assigned, active, paused, closed |
| assigned_manager_user_id | uuid FK | Zugewiesener Manager |
| assigned_at | timestamptz | Zuweisungszeitpunkt |
| split_terms_confirmed_at | timestamptz | Gate-Bestätigung |
| split_terms_confirmed_by | uuid FK | Gate-User |
| **AI** | | |
| profile_text_email | text | KI-generierter E-Mail-Text |
| profile_text_long | text | KI-generiertes Langprofil |
| profile_keywords | text[] | Keywords für Matching |

#### B) `acq_offers`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| mandate_id | uuid FK | Zugehöriges Mandat |
| title | text | Objekttitel |
| address | text | Adresse |
| city | text | Stadt |
| postal_code | text | PLZ |
| **Financials** | | |
| price_asking | numeric | Angebotspreis |
| yield_indicated | numeric | Angegebene Rendite |
| area_sqm | numeric | Fläche |
| units_count | integer | Einheiten |
| **Workflow** | | |
| status | enum | new, analyzing, analyzed, presented, accepted, rejected, archived |
| source_type | text | email, manual, scrape |
| source_ref | text | Quelle (URL, E-Mail-ID) |
| **Extracted Data** | | |
| extracted_data | jsonb | KI-Extraktion |
| documents | uuid[] | DMS-Links |

#### C) `acq_mandate_events`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| mandate_id | uuid FK | → acq_mandates |
| event_type | enum | created, submitted, assigned, split_confirmed, etc. |
| actor_id | uuid FK | Handelnder User |
| payload | jsonb | Event-Details |
| created_at | timestamptz | — |

### 4.2 Status-Maschine (acq_mandates)

```
draft → submitted_to_zone1 → assigned → active → paused → closed
                                    ↘           ↗
                                      closed
```

| Status | Zone | Beschreibung |
|--------|------|--------------|
| `draft` | MOD-08/12 | Mandat wird vorbereitet |
| `submitted_to_zone1` | Zone 1 | Warte auf Zuweisung |
| `assigned` | Zone 1 | Manager zugewiesen, warte auf Annahme |
| `active` | MOD-12 | Manager bearbeitet aktiv |
| `paused` | MOD-12 | Vorübergehend pausiert |
| `closed` | MOD-12 | Abgeschlossen |

---

## 5) MANDATE-DETAIL WORKBENCH (5 Tabs)

### 5.1 Gate-Panel

Vor Freischaltung muss der Manager die Split-Terms bestätigen:

- Provisionsvereinbarung anzeigen
- Button: "Split bestätigen & Mandat annehmen"
- Nach Bestätigung: Mandanten-Daten sichtbar, Tabs freigeschaltet

### 5.2 Workbench-Tabs (nach Gate)

| Tab | Komponente | Beschreibung |
|-----|------------|--------------|
| **Sourcing** | SourcingTab | Kontaktrecherche, Makler/Eigentümer finden |
| **Outreach** | OutreachTab | E-Mail-Kampagnen, Anfragen versenden |
| **Inbound** | InboundTab | Objekt-Eingänge für dieses Mandat |
| **Analysis** | AnalysisTab | Kalkulation: Bestand + Aufteiler |
| **Delivery** | DeliveryTab | Objekte an Mandant übergeben |

---

## 6) OBJEKTEINGANG (Zentrale Inbox)

### 6.1 Liste

- Mandatsübergreifende Inbox aller eingegangenen Offers
- Filter: Status, Mandat, Suche
- KPI-Cards: Gesamt, Neu, In Analyse, Analysiert

### 6.2 Detail-Workbench

| Tab | Beschreibung |
|-----|--------------|
| **Objektdaten** | Extrahierte Daten + manuelle Ergänzung |
| **Kalkulation** | Bestand (30J Hold) + Aufteiler (Flip) |
| **Anbieter** | Kontakt-Daten, Kommunikation |
| **Quelle** | Herkunft (E-Mail, Portal, manuell) |
| **Dokumente** | DMS-Links, Exposé-Upload |
| **Aktivitäten** | Timeline |

### 6.3 Aktionen

- **Absage:** Ablehnungs-E-Mail generieren
- **Preisvorschlag:** Gegenangebot mit Checkliste
- **Interesse:** Datenraum anlegen, Benachrichtigung versenden

---

## 7) TOOLS (Standalone)

### 7.1 Beschreibung

Mandatsunabhängige Werkzeuge für Ad-hoc-Analysen:

| Tool | Beschreibung |
|------|--------------|
| **Exposé-Upload** | Drag-and-Drop mit KI-Extraktion |
| **Bestand-Kalkulator** | 30-Jahres-Projektion |
| **Aufteiler-Kalkulator** | Flip-Analyse |
| **Portal-Recherche** | ImmoScout, Kleinanzeigen Scraping |
| **Standort-Recherche** | GeoMap, Infrastruktur-Analyse |

---

## 8) HOOKS & APIs

### 8.1 Haupt-Hooks (useAcqMandate.ts)

| Hook | Beschreibung |
|------|--------------|
| `useAcqMandatesForManager` | Alle zugewiesenen Mandate |
| `useAcqMandatesPending` | Warten auf Annahme |
| `useAcqMandatesActive` | Status = active |
| `useAcqMandate` | Einzelnes Mandat |
| `useAcqMandateEvents` | Audit Trail |
| `useMyAcqMandates` | Meine erstellten |
| `useCreateAcqMandate` | Erstellen |
| `useSubmitAcqMandate` | Einreichen |
| `useAcceptAcqMandate` | Split bestätigen |
| `useUpdateAcqMandateStatus` | Status ändern |
| `usePauseAcqMandate` | Pausieren |
| `useResumeAcqMandate` | Fortsetzen |
| `useCloseAcqMandate` | Abschließen |

### 8.2 Offer-Hooks (useAcqOffers.ts)

| Hook | Beschreibung |
|------|--------------|
| `useAcqOffers` | Offers für Mandat |
| `useAcqOffer` | Einzelnes Offer |
| `useCreateAcqOffer` | Erstellen |
| `useUpdateAcqOfferStatus` | Status ändern |

---

## 9) CROSS-MODULE DEPENDENCIES

| Modul | Art | Beschreibung |
|-------|-----|--------------|
| MOD-08 (Investments) | Read | Liefert Investoren-Mandate |
| Zone 1 Acquiary | Read/Write | Mandats-Zuweisung |
| MOD-02 (KI Office) | Link | Kontakt-CRUD |
| MOD-03 (DMS) | Read/Write | Dokumente ablegen |

---

## 10) EXTERNE INTEGRATIONEN (Phase 2)

| Integration | Status | Beschreibung |
|-------------|--------|--------------|
| Apollo | 🔜 | Kontaktrecherche |
| Apify | 🔜 | Portal-Scraping |
| Firecrawl | 🔜 | Website-Kontakte |
| sot-acq-offer-extract | ✅ | Exposé-KI-Extraktion |

---

## 11) CHANGELOG

| Version | Datum | Änderung |
|---------|-------|----------|
| v1.0.0 | 2026-01-26 | Initial Spec (alte Struktur) |
| **v2.0.0** | **2026-02-07** | **Komplette Überarbeitung:** 4-Tile-Pattern (Dashboard/Mandate/Objekteingang/Tools), 5-Tab Workbench, Gate-Panel, Status-Maschine dokumentiert |

---

*Dieses Dokument ist der verbindliche Spezifikationsstand für MOD-12.*
