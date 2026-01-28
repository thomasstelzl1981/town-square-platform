

# VOLLSTÄNDIGER REPARATUR- UND BEREINIGUNGSPLAN

## SYSTEM OF A TOWN — MODUL FÜR MODUL AUDIT & REPARATUR

---

## 1) EXECUTIVE SUMMARY — STATUS REPORT

### Datenbank-Status (Kritische Befunde)

| Tabelle | Anzahl | Status |
|---------|--------|--------|
| `organizations` | 2 | OK (thomas.stelzl, test) |
| `properties` | 0 | LEER - Keine Immobilien |
| `units` | 0 | LEER - Keine Einheiten |
| `documents` | 0 | LEER - Keine Dokumente |
| `document_links` | 0 | LEER - Keine Verknüpfungen |
| `contacts` | 0 | LEER - Keine Kontakte |
| `leases` | 0 | LEER - Keine Mietverträge |
| `test_data_registry` | 0 | LEER - Keine Batches registriert |
| **storage_nodes** | **130** | **ORPHAN-DATEN** - Ordner ohne Immobilien! |

### Root-Cause-Analyse

**Problem:** Die 8 Immobilien wurden irgendwann gelöscht (vermutlich durch ein fehlgeschlagenes Cleanup oder einen Bug), aber die automatisch erstellten Storage-Ordner blieben zurück.

**Beweis:**
- 130 storage_nodes für Tenant `e808a01b...` (thomas.stelzl)
- Root-Ordner mit Namen: `ZL002 - Parkweg 17`, `ZL003 - Ludwig-Thoma-Str. 5`, etc.
- ABER: `properties` Tabelle = 0 Einträge
- ABER: `property_id` in storage_nodes = NULL (nicht verknüpft)

### Trigger-Status

| Trigger | Tabelle | Status |
|---------|---------|--------|
| `create_property_folder_trigger` | properties | ✅ EXISTIERT |
| `property_folder_structure` | properties | ✅ EXISTIERT (Duplikat!) |
| `create_unit_folder_trigger` | units | ✅ EXISTIERT |
| `trg_create_finance_request_folders` | finance_requests | ✅ EXISTIERT |

**Hinweis:** Es gibt ZWEI Trigger auf properties für Ordner-Erstellung - das ist ein Duplikat-Problem das bereinigt werden muss.

---

## 2) ZONE 1 DOKUMENTATION — VOLLSTÄNDIGKEITSPRÜFUNG

### Tile Catalog Status

| MOD | Titel | Sub-Tiles | Flowchart | Internal APIs | External APIs | Changelog | Status |
|-----|-------|-----------|-----------|---------------|---------------|-----------|--------|
| MOD-01 | Stammdaten | 4 | ✅ | 3 | 0 | 2 | ✅ KOMPLETT |
| MOD-02 | KI Office | 4 | ✅ | 2 | 5 | 2 | ✅ KOMPLETT |
| MOD-03 | DMS | 4 | ✅ | 4 | 1 | 2 | ✅ KOMPLETT |
| MOD-04 | Immobilien | 4 | ✅ | 3 | 4 | 3 | ✅ KOMPLETT |
| MOD-05 | MSV | 4 | ✅ | 4 | 2 | 3 | ✅ KOMPLETT |
| MOD-06 | Verkauf | 4 | ✅ | 3 | 2 | 3 | ✅ KOMPLETT |
| MOD-07 | Finanzierung | 4 | ✅ | 3 | 1 | 3 | ✅ KOMPLETT |
| MOD-08 | Investments | 4 | ✅ | 2 | 1 | 2 | ⚠️ NICHT IMPLEMENTIERT |
| MOD-09 | Vertriebspartner | 4 | ✅ | 3 | 0 | 2 | ✅ KOMPLETT |
| MOD-10 | Leads | 4 | ✅ | 2 | 1 | 2 | ⚠️ NICHT IMPLEMENTIERT |
| MOD-11 | Finanzierungsmanager | 4 | ✅ | 2 | 1 | 2 | ✅ KOMPLETT |

### Integration Registry Status

| Code | Name | Status | Owner-Modul |
|------|------|--------|-------------|
| STRIPE | Stripe Payments | pending_setup | MOD-01 |
| CAYA | Caya DMS | pending_setup | MOD-03 |
| FUTURE_ROOM | Future Room | pending_setup | MOD-07/11 |
| scout24 | ImmoScout24 | pending_setup | MOD-05/06 |
| meta_ads | Meta Ads | pending_setup | MOD-10 |
| apify | Apify Scraper | pending_setup | MOD-08 |
| SPRENGNETTER | Sprengnetter | pending_setup | MOD-04 |
| GOOGLE_MAPS | Google Maps | pending_setup | MOD-04 |

**Bewertung:** 8 Integrationen registriert, alle `pending_setup` - korrekt für Phase 1.

---

## 3) PROBLEMATIK: ORPHAN STORAGE NODES

### Aktuelle Situation

```text
storage_nodes (130 Einträge):
├── ZL002 - Parkweg 17 (Root, property_id=NULL)
│   ├── 00_Projektdokumentation
│   ├── 01_Exposé Ankauf
│   ├── ... (17 Unterordner)
│   └── Einheiten
│       └── MAIN/WE1/WE2... (Unit-Ordner)
├── ZL003 - Ludwig-Thoma-Str. 5
├── ZL004 - Lessingstr. 8
├── ZL005 - Hubertusweg 6
├── ZL006 - Schönthal 10
├── ZL007 - Schönthal 10a
├── ZL008 - Schönthal 12
├── ZL009 - Schönthal 12a
├── Posteingang (System-Node, neu erstellt)
└── Bonitätsunterlagen (System-Node, neu erstellt)
```

**Problem:** Diese 128 Ordner (8 Properties × 16 Unterordner + Einheiten) sind **verwaist** - sie verweisen auf nichts, da die Properties gelöscht wurden.

### Bereinigungsoptionen

| Option | Beschreibung | Risiko | Empfehlung |
|--------|--------------|--------|------------|
| A) Löschen | Alle orphan storage_nodes entfernen | Gering | ✅ EMPFOHLEN |
| B) Re-Import | Excel erneut hochladen, Ordner "adoptieren" | Mittel | Komplex |
| C) Beibehalten | Ordner als Altlast ignorieren | Hoch | ❌ Nicht empfohlen |

---

## 4) MODUL-FÜR-MODUL REPARATURPLAN

### PHASE 0: BEREINIGUNG (P0 - SOFORT)

#### Task B-01: Orphan Storage Nodes löschen

```sql
-- Lösche alle storage_nodes die NICHT "Posteingang" oder "Bonitätsunterlagen" heißen
-- und keine property_id haben (also die alten ZL002-ZL009 Ordner)
DELETE FROM storage_nodes 
WHERE tenant_id = 'e808a01b-728e-4ac3-88fe-6edeeae69d6e'
  AND name NOT IN ('Posteingang', 'Bonitätsunterlagen')
  AND property_id IS NULL
  AND unit_id IS NULL;
```

**Akzeptanzkriterium:** Nach Bereinigung nur noch 2 System-Nodes pro Tenant.

#### Task B-02: Duplikat-Trigger bereinigen

```sql
-- Entferne den alten property_folder_structure Trigger
DROP TRIGGER IF EXISTS property_folder_structure ON properties;
-- Behalte nur create_property_folder_trigger
```

**Akzeptanzkriterium:** Nur ein Folder-Trigger auf properties.

---

### PHASE 1: STORAGE BLUEPRINT IMPLEMENTIERUNG

#### Task S-01: System-Nodes Erweitern

Die MOD-03 Spec definiert 8 System-Nodes. Aktuell haben wir nur 2. Ergänzen:

| Node | Zweck | Auto-Create |
|------|-------|-------------|
| Posteingang | Uploads landen hier | ✅ Existiert |
| Bonitätsunterlagen | MOD-07 Selbstauskunft | ✅ Existiert |
| Immobilien | Container für Property-Ordner | ❌ Fehlt |
| Portfolio-Unterlagen | Übergreifende Dokumente | ❌ Fehlt |
| Finanzierung | Finance-Cases | ❌ Fehlt |
| Sonstiges | Catch-all | ❌ Fehlt |
| Needs-Review | Sortier-Queue | ❌ Fehlt |
| Archiv | Gelöschte Dokumente | ❌ Fehlt |

**Fix:** Migration erstellen die fehlende System-Nodes für alle Tenants erstellt.

#### Task S-02: Property-Folder Blueprint

Wenn eine Property erstellt wird, muss folgende Struktur entstehen:

```text
{Code} - {Adresse}/
├── 00_Projektdokumentation
├── 01_Exposé Ankauf
├── 02_Exposé Sonstiges
├── 03_Grundbuchauszug
├── 04_Teilungserklärung
├── 05_Grundriss
├── 06_Kurzgutachten
├── 07_Kaufvertrag
├── 08_Mietvertrag
├── 09_Rechnungen
├── 10_Wirtschaftsplan Abrechnungen Protokolle
├── 11_Fotos
├── 12_Energieausweis
├── 13_Wohngebäudeversicherung
├── 14_Sonstiges
├── 15_Darlehen und Finanzierung
├── 16_Sanierung
└── 17_Grundsteuer
```

**Status:** ✅ Trigger existiert bereits und ist korrekt konfiguriert.

#### Task S-03: Finance-Request Folder Blueprint

Wenn ein Finance-Request erstellt wird:

```text
Bonitätsunterlagen/
└── {Case-Name}/
    ├── Privat/
    │   ├── Ausweisdokumente
    │   ├── Einkommensnachweise
    │   ├── Steuerbescheide
    │   └── Kontoauszüge
    └── Firma/ (wenn relevant)
        ├── Handelsregister
        ├── BWA
        └── Jahresabschlüsse
```

**Status:** ✅ Trigger existiert bereits (`trg_create_finance_request_folders`).

---

### PHASE 2: MODUL-REPARATUREN

#### MOD-04 Immobilien — Status: ⚠️ BENÖTIGT TESTDATEN

| Komponente | Status | Aktion |
|------------|--------|--------|
| Routes | ✅ OK | 4 Sub-Tiles konfiguriert |
| PortfolioTab | ⚠️ Leer | Benötigt Properties |
| PropertyDetail | ✅ OK | Code vorhanden |
| PropertyForm | ✅ OK | Code vorhanden |
| DatenraumTab | ✅ OK | Nutzt storage_nodes korrekt |

**Blocker:** Keine Testdaten. Nach Excel-Import funktional.

#### MOD-05 MSV — Status: ⚠️ BENÖTIGT TESTDATEN

| Komponente | Status | Aktion |
|------------|--------|--------|
| Routes | ✅ OK | 4 Sub-Tiles |
| ObjekteTab | ⚠️ Leer | Benötigt Units mit Leases |
| MieteingangTab | ⚠️ Leer | Benötigt Payment-Daten |
| VermietungTab | ✅ OK | Wizard vorhanden |

**Blocker:** Keine Units, keine Leases.

#### MOD-06 Verkauf — Status: ⚠️ BENÖTIGT TESTDATEN

| Komponente | Status | Aktion |
|------------|--------|--------|
| Routes | ✅ OK | 4 Sub-Tiles via wildcard |
| ListingsTab | ⚠️ Leer | Benötigt sale_enabled Properties |
| VorgaengeTab | ⚠️ Leer | Benötigt Transaktionen |

**Blocker:** Keine Properties mit sale_enabled=true.

#### MOD-07 Finanzierung — Status: ✅ REPARIERT

| Komponente | Status | Aktion |
|------------|--------|--------|
| Routes | ✅ OK | 4 Sub-Tiles (Dashboard, Fälle, Dokumente, Einstellungen) |
| DashboardTab | ✅ Neu | KPIs und Quick Actions |
| FaelleTab | ✅ Refactored | List + Detail |
| SelbstauskunftForm | ✅ OK | 1100+ Zeilen, vollständig |
| DocumentUploadSection | ✅ OK | DOCUMENT_CATEGORIES definiert |

**Testbar nach:** Property erstellt, Finance-Request angelegt.

#### MOD-08 Investments — Status: ❌ NICHT IMPLEMENTIERT

| Komponente | Status | Aktion |
|------------|--------|--------|
| Routes | ⚠️ Placeholder | Nur leere Tabs |
| InvestmentEngine | ❌ Fehlt | Edge Function existiert, UI fehlt |
| FavoritenSync | ❌ Fehlt | Zone 3 → Zone 2 Flow |

**Scope:** Phase 2 - Nach Basis-Modulen.

#### MOD-09 Vertriebspartner — Status: ⚠️ BENÖTIGT PARTNER-ORGANISATION

| Komponente | Status | Aktion |
|------------|--------|--------|
| Routes | ✅ OK | 5 Sub-Tiles via wildcard |
| KatalogTab | ⚠️ Leer | Benötigt veröffentlichte Listings |
| PipelineTab | ⚠️ Leer | Benötigt Partner-Deals |

**Blocker:** Keine Partner-Organisation, keine Listings.

#### MOD-10 Leads — Status: ❌ NICHT IMPLEMENTIERT

| Komponente | Status | Aktion |
|------------|--------|--------|
| Routes | ⚠️ Placeholder | Nur leere Tabs |
| LeadInbox | ❌ Fehlt | Zone 3 Forms fehlen |

**Scope:** Phase 2.

#### MOD-11 Finanzierungsmanager — Status: ✅ KORREKT

| Komponente | Status | Aktion |
|------------|--------|--------|
| Routes | ✅ OK | 4 Sub-Tiles mit Tabs |
| CaseDetailTab | ✅ OK | Mandate-Verarbeitung |
| SubmitToBankTab | ✅ OK | Bank-Kontakt Auswahl |

**Keine Reparatur nötig.**

---

## 5) INTEGRATION REGISTRY — API-ZUORDNUNG

### Interne APIs (tile_api_internal)

| Tile | Endpoint | Status |
|------|----------|--------|
| MOD-01 | /profiles, /contacts, /organizations | ✅ Dokumentiert |
| MOD-02 | sot-letter-generate, /calendar_events | ✅ Dokumentiert |
| MOD-03 | sot-dms-upload-url, sot-dms-download-url, sot-document-parser | ✅ Dokumentiert |
| MOD-04 | sot-property-crud, sot-expose-description, sot-excel-ai-import | ✅ Dokumentiert |
| MOD-05 | sot-msv-reminder-check, sot-msv-rent-report, sot-listing-publish | ✅ Dokumentiert |
| MOD-06 | /listings, /inquiries, /reservations | ✅ Dokumentiert |
| MOD-07 | /finance_requests, /applicant_profiles, sot-finance-export | ✅ Dokumentiert |
| MOD-08 | sot-investment-engine | ✅ Dokumentiert |
| MOD-09 | /partner_pipeline, /commission_approvals | ✅ Dokumentiert |
| MOD-10 | sot-lead-inbox | ✅ Dokumentiert |
| MOD-11 | /finance_mandates, /future_room_cases | ✅ Dokumentiert |

### Externe APIs (tile_api_external)

| Provider | Tile | Zweck | Status |
|----------|------|-------|--------|
| RESEND | MOD-02 | E-Mail-Versand | ✅ Registriert |
| GMAIL_OAUTH | MOD-02 | Gmail-Integration | ✅ Registriert |
| MICROSOFT_OAUTH | MOD-02 | Outlook-Integration | ✅ Registriert |
| CAYA | MOD-03 | Digitaler Posteingang | ✅ Registriert |
| SPRENGNETTER | MOD-04 | Immobilienbewertung | ✅ Registriert |
| GOOGLE_MAPS | MOD-04 | Kartenansicht | ✅ Registriert |
| GOOGLE_PLACES | MOD-04 | Adress-Autocomplete | ✅ Registriert |
| SCOUT24 | MOD-05/06 | Portal-Publishing | ✅ Registriert |
| FUTURE_ROOM | MOD-07/11 | Bankenvermittlung | ✅ Registriert |
| APIFY | MOD-08 | Portal-Scraping | ✅ Registriert |

**Bewertung:** ✅ Alle APIs korrekt zugeordnet und in Zone 1 Integrations sichtbar.

---

## 6) TESTDATEN-STRATEGIE

### Option A: Excel Re-Import (Empfohlen)

1. Navigiere zu `/admin/tiles`
2. Öffne "Testdaten" Tab
3. Lade die Portfolio-Excel erneut hoch (8 Properties)
4. AI-Parser erkennt Spalten-Mapping
5. Preview prüfen
6. Import starten
7. Trigger erstellt automatisch Storage-Ordner

**Voraussetzung:** Orphan-Nodes zuerst bereinigen (Task B-01).

### Option B: Manuell Property erstellen

1. Navigiere zu `/portal/immobilien/portfolio`
2. Klick "Neue Immobilie"
3. Formular ausfüllen
4. Speichern → Trigger erstellt Ordner

**Vorteil:** Sofort testbar ohne Excel.
**Nachteil:** Nur 1 Property, kein vollständiges Portfolio.

---

## 7) WORKFLOW-TESTS (Nach Testdaten-Import)

### Test-Flow A: Immobilienakte (MOD-04)

```text
1. /portal/immobilien/portfolio → Property wählen
2. Property Detail öffnen → Tabs prüfen
3. Datenraum-Tab → Ordner-Struktur sichtbar?
4. Dokument hochladen → erscheint im richtigen Ordner?
```

### Test-Flow B: Vermietung (MOD-04 → MOD-05)

```text
1. Property hat Units
2. /portal/msv/objekte → Units sichtbar?
3. Mietvertrag erstellen → Lease in DB?
4. Mieteingang tracken → Payment-Buchung?
```

### Test-Flow C: Finanzierung (MOD-04 → MOD-07 → MOD-11)

```text
1. /portal/finanzierung → Neuer Fall
2. Property auswählen
3. Selbstauskunft ausfüllen
4. Dokumente verlinken
5. Einreichen → Mandat in Zone 1?
6. /portal/finanzierungsmanager → Case sichtbar?
```

### Test-Flow D: Verkauf (MOD-04 → MOD-06 → Zone 3)

```text
1. Property sale_enabled = true
2. /portal/verkauf → Listing erstellen
3. Exposé generieren
4. Partner freigeben
5. /kaufy/immobilien → Listing sichtbar?
```

---

## 8) ZUSAMMENFASSUNG — ACTION ITEMS

### Sofort (P0)

| # | Task | Owner | Zeit |
|---|------|-------|------|
| 1 | Orphan storage_nodes löschen | Migration | 5 min |
| 2 | Duplikat-Trigger entfernen | Migration | 2 min |
| 3 | System-Nodes erweitern | Migration | 10 min |

### Kurzfristig (P1)

| # | Task | Owner | Zeit |
|---|------|-------|------|
| 4 | Testdaten via Excel importieren | UI | 15 min |
| 5 | Workflow MOD-04 → MOD-05 testen | Manual | 20 min |
| 6 | Workflow MOD-07 → MOD-11 testen | Manual | 20 min |

### Mittelfristig (P2)

| # | Task | Owner | Zeit |
|---|------|-------|------|
| 7 | MOD-08 Investment Engine UI | Dev | 4h |
| 8 | MOD-10 Lead Inbox implementieren | Dev | 4h |
| 9 | Zone 3 → Zone 2 Favoriten-Sync | Dev | 2h |

---

## 9) GO/NO-GO BEWERTUNG

**GO** ✅ — Das System ist nach diesem Plan wieder testfähig.

**Begründung:**

1. **Architektur ist solide** — Alle Trigger, Tabellen, RLS existieren
2. **Dokumentation ist vollständig** — Tile Catalog, APIs, Changelogs vorhanden
3. **Problem ist isoliert** — Nur Daten-Orphans und fehlende Testdaten
4. **Fix ist minimal** — 3 SQL-Statements + 1 Excel-Upload

**Risiken:**

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|---------------------|------------|
| Excel-Parser-Bug | Gering | Preview vor Import prüfen |
| Trigger-Fehler | Gering | Nach Import Ordner-Struktur prüfen |
| RLS-Blocker | Mittel | Dev-Mode Bypass bereits aktiv |

---

## 10) NÄCHSTER SCHRITT

**Empfehlung:** Starte mit der Bereinigung (Task B-01, B-02) und teste dann den manuellen Property-Create-Flow, bevor du das Excel hochlädst. So stellst du sicher, dass die Trigger korrekt funktionieren.

