# MOD-04 — IMMOBILIEN (Property Portfolio Hub)

> **Version**: 2.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-06  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/immobilien`  
> **Owner**: Kaufy / Acquiary / Futureroom  
> **API-Range**: API-700 bis API-747

> **Audit-Status:** 92% Complete  
> **Letzte Prüfung:** 2026-02-06

---

## 1. Executive Summary

MOD-04 "Immobilien" ist das Kernmodul des Systems. Es liefert:

- **Portfolio-Übersicht & Immobilienliste** (strukturierte Spalten, keine operative Mietliste)
- **Exposé / Objekt-Detail** als vollständiger Objekt-Hub (Anzeige "aller vorhandenen Informationen")
- **Integrierter Datenraum** (DMS-Ansicht) im Exposé (kein eigener Menüpunkt)
- **Sanierung/Ausschreibung** als objektbezogener End-to-End Prozess
- **Bewertung** als objektbezogener End-to-End Prozess (Job/Worker/Credits/Consent)

### Source of Truth (SoT)

MOD-04 ist die **einzige Quelle der Wahrheit** für:
- Property-Stammdaten (`properties`)
- Unit-Struktur (`units`) — aber KEINE operative Mietverwaltung
- Vermieter-Kontexte (`landlord_contexts`)

---

## 2. Architekturprinzipien (FROZEN)

| ID | Prinzip | Regel |
|----|---------|-------|
| **P1** | SoT für Stammdaten | `properties` + `units` gehören MOD-04 |
| **P2** | Objekt-Kategorien | `single` (Einzelobjekt) oder `global` (Globalobjekt mit Einheiten) |
| **P3** | Exposé = Hub | Exposé ist Objekt-Detailseite mit allen Informationen |
| **P4** | Strukturlisten-Regel | Keine operative Mieterliste — das ist MOD-05 |
| **P5** | Flag-Steuerung | `sale_enabled` → MOD-06/07, `rental_managed` → MOD-05 |
| **P6** | Vermieter-Kontext | `PRIVATE` → V+V, `BUSINESS` → SuSa/BWA |

### Modulare Eigenständigkeit

- Jedes Modul funktioniert eigenständig
- Module interagieren nur über definierte Berührungswege
- Flags, Read-Views, Links (IDs), Consent-Gates, API-Contracts

---

## 3. Menüstruktur (4 Hauptpunkte)

| # | Menüpunkt | Route | Beschreibung |
|---|-----------|-------|--------------|
| 1 | **Stammdaten / Kontexte** | `/portal/immobilien/kontexte` | Vermieter-Entity-Verwaltung |
| 2 | **Portfolio / Objekte** | `/portal/immobilien` | Dashboard + Immobilienliste |
| 3 | **Sanierung** | `/portal/immobilien/sanierung` | Globaler Einstieg + objektbezogen |
| 4 | **Bewertung** | `/portal/immobilien/bewertung` | Globaler Einstieg + objektbezogen |

---

## 4. Route-Struktur (BINDING)

### 4.1 Hauptnavigation

| Route | Beschreibung |
|-------|--------------|
| `/portal/immobilien` | Dashboard + Portfolio-Liste |
| `/portal/immobilien/new` | Objekt anlegen (Wizard) |
| `/portal/immobilien/:id` | Exposé (Objekt-Detail-Hub) |
| `/portal/immobilien/kontexte` | Vermieter-Kontexte |
| `/portal/immobilien/kontexte/:id` | Kontext-Detail |
| `/portal/immobilien/sanierung` | Sanierung (global) |
| `/portal/immobilien/:id/sanierung` | Sanierung (objektbezogen) |
| `/portal/immobilien/:id/sanierung/:case_id` | Service Case Detail |
| `/portal/immobilien/sanierung/unzugeordnet` | Unzugeordnete Angebote |
| `/portal/immobilien/bewertung` | Bewertung (global) |
| `/portal/immobilien/:id/bewertung` | Bewertung (objektbezogen) |

### 4.2 Integrierte Bereiche (keine eigene Navigation)

- **Datenraum**: Section im Exposé (`/portal/immobilien/:id`)
- **Einheiten**: Section im Exposé (Struktur-only)

---

## 5. Datenfelder (BINDING)

### 5.1 Immobilienliste — 13 Spalten (Reihenfolge fix)

| # | Feld | DB-Spalte | Quelle |
|---|------|-----------|--------|
| 1 | ID | `code` | `properties` |
| 2 | Art | `property_type` | `properties` |
| 3 | Ort | `city` | `properties` |
| 4 | Straße / Hausnummer | `address` | `properties` |
| 5 | Größe | `total_area_sqm` | `properties` |
| 6 | Nutzung | `usage_type` | `properties` |
| 7 | Einnahmen | `annual_income` | `properties` |
| 8 | Verkehrswert | `market_value` | `properties` |
| 9 | Restschuld | `current_balance` | `property_financing` |
| 10 | Rate | `monthly_rate` | `property_financing` |
| 11 | Warmmiete | `current_monthly_rent` | `units` (aggregiert) |
| 12 | NK-Vorauszahlung | `utility_prepayment` | **NEU: `properties`** |
| 13 | Hausgeld | `management_fee` | `properties` |

**Regel:** Diese Liste ist eine Portfolio-Übersicht. Keine operative Einheiten-/Mieterliste.

### 5.2 Exposé — Alle Felder

| Gruppe | Felder |
|--------|--------|
| **Stammdaten** | Code, Art, PLZ, Ort, Straße/Hausnummer, BJ, Sanierungsjahr, Größe, Nutzung |
| **Grundbuch** | Grundbuch von, Grundbuchblatt, Band, Flurstück, TE-Nummer |
| **Transaktion** | Notartermin, BNL, Kaufpreis |
| **Finanzierung** | Darlehensnr., Urspr. Darlehen, Restschuld, Zins, Zinsbindung, Bank, Rate, Zinsbelastung ca. |
| **Ertrag/Miete** | Einnahmen, Warmmiete, NK-Vorauszahlung, Mieter, Mieter seit, Mieterhöhung, Hausgeld |
| **Energie/Heizung** | Energieträger, Heizart |
| **Status** | sale_enabled, rental_managed |

---

## 6. Screen Specifications

### 6.1 Stammdaten / Vermieter-Kontexte

**Route:** `/portal/immobilien/kontexte`

**Zweck:** Verwaltung der Vermieter-/Entity-Kontexte, die Sichtbarkeit, Aggregation und Reporting-Regime steuern.

**UI (MVP):**

- **Kontext-Liste (Cards):**
  - Name, Type (PRIVATE/BUSINESS), Regime (V+V oder SuSa/BWA)
  - #Objekte, Aggregations-KPIs (optional)

- **Kontext-Detail:**
  - Stammdaten (Name, Typ, Regime — Step1 read-only nach Anlage)
  - Objektzuordnung: Liste/Picker mit Multi-Select
  - Sichtbarkeit: welche Objekte sind in diesem Kontext sichtbar

**Regeln:**
- `PRIVATE` → VV Default
- `BUSINESS` → FIBU Default
- Regime ist nach Anlage read-only

### 6.2 Portfolio Dashboard

**Route:** `/portal/immobilien`

**KPIs (im aktiven Kontext):**
- #Objekte
- Summe Verkehrswerte
- Summe Restschulden
- Summe Einnahmen
- #sale_enabled
- #rental_managed

**Alerts:**
- Fehlende Pflichtfelder (z.B. Adresse)
- Fehlende Dokumente (optional)

**Quick Actions:**
- Objekt anlegen
- DMS öffnen

### 6.3 Objekt anlegen (Wizard)

**Route:** `/portal/immobilien/new`

**Pflichtfelder:**
- `property_type` (single/global)
- Art
- PLZ, Ort, Straße/Hausnummer
- Größe, Nutzung

**Optional:**
- Kontext-Zuordnung direkt im Create

**Regeln:**
- Globalobjekt kann "ohne Einheiten" angelegt werden
- Einheiten können später ergänzt werden

### 6.4 Exposé / Objekt-Detail (Hub)

**Route:** `/portal/immobilien/:id`

**Sections (MVP):**

| # | Section | Inhalt |
|---|---------|--------|
| 1 | **Header** | Code/Art, Adresse, Status-Badges, CTAs |
| 2 | **Stammdaten** | Grunddaten des Objekts |
| 3 | **Grundbuch** | Registerinformationen |
| 4 | **Transaktion** | Kauf-/Verkaufsdaten |
| 5 | **Finanzierung** | Darlehensdetails |
| 6 | **Ertrag/Miete** | Anzeige + "In MSV öffnen" CTA |
| 7 | **Energie/Heizung** | Technische Daten |
| 8 | **Einheiten** | Struktur-Liste (falls vorhanden) |
| 9 | **Datenraum** | DMS-Integration (Section 6.5) |
| 10 | **Sanierung** | Summary + Link |
| 11 | **Bewertung** | Summary + Link |
| 12 | **Historie** | Audit-Timeline (read-only) |

**Header CTAs:**
- DMS öffnen
- MSV öffnen (wenn `rental_managed`)
- Verkauf öffnen (wenn `sale_enabled`)

### 6.5 Datenraum (DMS-Integration)

**Ort:** Section im Exposé (keine eigene Navigation)

**Default View:**
- Filter: `object_id = :property_id`
- Optional Node-Filter: `immobilien`, `finanzierung`, `portfolio_unterlagen`
- Search: FTS aus DMS

**Actions (MVP):**
- Preview/Download (signed URLs via DMS)
- Link existing docs (Picker aus DMS)
- Upload (geht an DMS, wird automatisch verlinkt)

**Deep Link:** `/portal/dms/storage?object_id=:property_id`

**Berührungsweg (strict):**
- MOD-04 besitzt KEINE Datei-Bytes
- Alles über DMS APIs und `document_links`

---

## 7. Sanierung / Ausschreibung (End-to-End)

### 7.1 Konzept

Der Sanierungsbereich dient der strukturierten Ausschreibung, Angebotsannahme, Vergabe und Dokumentation von Sanierungs-, Instandhaltungs- und Dienstleistungsmaßnahmen.

**Kernprinzipien:**
- E-Mail-basiert (Outbound + Inbound)
- EINE zentrale System-Mailadresse (Resend)
- Zuordnung über Tender-ID
- Jeder Versand erfordert User-Bestätigung

### 7.2 Service Case Lifecycle

```
draft → sent → offers_received → decision_pending → awarded → completed
                                                  ↘ cancelled
```

### 7.3 Ausschreibung erstellen

**Pflichtangaben:**
- Objekt (Property) [Pflicht]
- Einheit (optional)
- Kategorie (Sanitär, Elektro, Maler, Dach, Fenster, Gutachter, Hausverwaltung, Sonstiges)
- Titel
- Beschreibung des Leistungsumfangs

**Automatisch beim Anlegen:**
- Generierung Tender-ID: `T-{PUBLIC_ID}-{DATE}-{SEQ}`
- Tender-ID enthält zwingend die Client-ID

### 7.4 Versand (Outbound)

**Prozess:**
1. Dienstleister auswählen (optional: Google Places API)
2. E-Mail-Adresse ergänzen/korrigieren
3. E-Mail als ENTWURF erzeugen
4. Versand nach User-Bestätigung

**E-Mail-Pflichtbestandteile:**
- Betreff enthält Tender-ID
- Angebot bitte als PDF
- Antwort unter Beibehaltung der Tender-ID
- Antwort an gleiche Adresse

**Anlagen (automatisch aus DMS):**
- Grundriss (Pflicht, sofern vorhanden)
- Wohnflächenberechnung (Pflicht, sofern vorhanden)
- Bilder (optional)

### 7.5 Inbound (Angebote)

**Verarbeitung:**
- EINE Inbound-Adresse (Resend)
- PDF-Anhänge als Dokumente übernommen
- Tender-ID aus Betreff/E-Mail-Text extrahieren

**Zuordnung:**
- Tender-ID eindeutig → automatisch vorgeschlagen
- Keine/keine eindeutige Zuordnung → "Unzugeordnet"-Queue

### 7.6 Vergabe

**Prozess:**
1. User wählt Angebot aus
2. System markiert als akzeptiert
3. Service Case → Status `awarded`
4. Vergabe-Mail als ENTWURF
5. Versand nach User-Bestätigung

### 7.7 Dokumentation

Alle Dokumente im DMS abgelegt und verknüpft:
- Ausschreibung
- Angebote
- Vergabe
- Optional: Sanierungs-/Vergabeübersicht als PDF

---

## 8. Bewertung (Sprengnetter)

### 8.1 Konzept

Objektbezogene Bewertung als Prozess:
1. Input-Mapping
2. Consent/Credits
3. Worker Job
4. Ergebnis + Report im DMS
5. Historie

### 8.2 Flow (MVP)

**Step 1: Start (Objektbezogen)**
- Anzeige relevanter Objektfelder
- Mapping-Screen: fehlende Felder markieren + editierbar

**Step 2: Estimate + Consent**
- Credits/Preis anzeigen
- User bestätigt Consent

**Step 3: Job erzeugen**
- Worker führt Bewertung aus (Sprengnetter Adapter)

**Step 4: Ergebnis**
- Verkehrswert/Spanne + Metadaten
- Report (PDF) im DMS verlinkt
- Historie/Versionen

### 8.3 Credit/Consent Regeln

- Bewertung niemals "silent" starten bei Kosten
- Consent muss gespeichert werden (wer/wann/was)

### 8.4 Worker/Jobs

| Attribut | Wert |
|----------|------|
| `job_type` | `valuation_request` |
| `statuses` | `queued`, `running`, `done`, `failed` |
| `retries` | Analog DMS Worker |

---

## 9. Cross-Module Berührungswege (STRICT)

### 9.1 MOD-04 ↔ MOD-03 DMS

| Direction | Methode |
|-----------|---------|
| MOD-04 → MOD-03 | `object_id` Filter/Links, signed URLs |
| MOD-04 → MOD-03 | attach/link actions via DMS APIs |

**Regel:** MOD-04 speichert KEINE Datei-Bytes.

### 9.2 MOD-04 ↔ MOD-05 MSV

| Trigger | Effect |
|---------|--------|
| `rental_managed = true` | Objekt/Einheiten erscheinen in MOD-05 |
| Deep Link | `/portal/msv?property_id=:id` |

**Regel:** MOD-04 Exposé darf Mietinfos anzeigen; operative Pflege liegt in MOD-05.

### 9.3 MOD-04 ↔ MOD-06 Verkauf / MOD-07 Vertriebspartner

| Trigger | Effect |
|---------|--------|
| `sale_enabled = true` | Sichtbarkeit/Read in MOD-06/07 |
| Consent Gate | `SALES_MANDATE` erforderlich in MOD-06 |

**Regel:** MOD-04 setzt nur das Flag, keine Partner-/Deal-Logik.

### 9.4 MOD-04 ↔ MOD-08 Finanzierung

| Trigger | Effect |
|---------|--------|
| FK Reference | `finance_packages.property_id` → `properties.id` |

**Regel:** MOD-04 = Stammdaten-Lieferant.

### 9.5 Zone 1 Oversight

Admin sieht Read-only Views:
- Immobilienstatus
- Flags
- Sanierung-Status
- Bewertung-Status

---

## 10. API Contract (MVP)

### 10.1 Portfolio

```
GET    /immobilien/properties?context_id=&filters...
POST   /immobilien/properties                     { fields... }
GET    /immobilien/properties/:id
PATCH  /immobilien/properties/:id                 { fields... }
POST   /immobilien/properties/:id/toggle-sale     { sale_enabled }
POST   /immobilien/properties/:id/toggle-rental   { rental_managed }
```

### 10.2 Units

```
GET    /immobilien/properties/:id/units
POST   /immobilien/properties/:id/units           { unit_name, groesse?, nutzung?, meta_json? }
PATCH  /immobilien/units/:unit_id
DELETE /immobilien/units/:unit_id                 (only if not referenced)
```

### 10.3 Kontexte

```
GET    /immobilien/kontexte
POST   /immobilien/kontexte                       { name, entity_type, accounting_regime }
GET    /immobilien/kontexte/:id
PATCH  /immobilien/kontexte/:id                   { name }
POST   /immobilien/kontexte/:id/assign            { property_ids[] }
POST   /immobilien/kontexte/:id/unassign          { property_ids[] }
```

### 10.4 Sanierung

```
GET    /sanierung/cases?property_id=&status=&category=
POST   /sanierung/cases                           { property_id, unit_id?, category, title, description }
GET    /sanierung/cases/:case_id
PATCH  /sanierung/cases/:case_id                  { title?, description?, status? }
POST   /sanierung/cases/:case_id/outbound/drafts/create
POST   /sanierung/cases/:case_id/outbound/send    { outbound_ids[] }
POST   /integrations/resend/inbound               (webhook)
GET    /sanierung/offers/unassigned
POST   /sanierung/offers/:offer_id/assign         { service_case_id }
POST   /sanierung/cases/:case_id/offers/:offer_id/accept
POST   /sanierung/cases/:case_id/offers/:offer_id/reject
```

### 10.5 Bewertung

```
POST   /bewertung/:property_id/estimate
POST   /bewertung/:property_id/confirm            { consent=true, provider, payload }
GET    /bewertung/:property_id/status
GET    /bewertung/:property_id/history
GET    /bewertung/queue                           (global)
POST   /bewertung/:property_id/cancel             (optional)
```

---

## 11. Berechtigungen (RLS)

| Rolle | Erlaubt |
|-------|---------|
| `org_user` | Read Portfolio, Detail, DMS |
| `org_admin` | Create, Update, Toggle Flags, Trigger Jobs |
| `platform_admin` | Oversight (Read-only) |

---

## 12. Datenmodell

### 12.1 Existierende Tabellen (DB Status)

| Tabelle | Beschreibung | DB Status |
|---------|--------------|-----------|
| `properties` | Property-Stammdaten (55+ Spalten) | ✅ EXISTS |
| `units` | Einheiten-Struktur (32 Spalten) | ✅ EXISTS |
| `landlord_contexts` | Vermieter-Kontexte (28 Spalten inkl. Steuer) | ✅ EXISTS |
| `context_property_assignment` | Kontext-Objekt-Zuordnung | ✅ EXISTS |
| `property_financing` | Legacy Finanzierungsdaten | ✅ EXISTS |
| `loans` | **SSOT** Finanzierungsdaten (23 Spalten) | ✅ EXISTS |
| `property_accounting` | AfA/SKR04 Daten (16 Spalten) | ✅ EXISTS |
| `property_valuations` | Bewertungsergebnisse | ✅ EXISTS |

### 12.2 Sanierung Tabellen (Phase 2)

| Tabelle | Beschreibung | DB Status |
|---------|--------------|-----------|
| `service_cases` | Sanierungsvorgänge (39 Spalten) | ✅ EXISTS |
| `service_case_offers` | Eingegangene Angebote | ✅ EXISTS |
| `service_case_outbound` | Versendete Ausschreibungen | ✅ EXISTS |

### 12.3 Fehlende Tabellen

| Tabelle | Beschreibung | Priorität |
|---------|--------------|-----------|
| `service_case_vendors` | Dienstleister-Pool (optional) | P2 |

Siehe: `docs/modules/MOD-04_DB_SCHEMA.md`

---

## 13. Audit Events (Pflicht)

| Event Type | Trigger |
|------------|---------|
| `property_created` | Property angelegt |
| `property_updated` | Property geändert |
| `sale_toggled` | `sale_enabled` geändert |
| `rental_toggled` | `rental_managed` geändert |
| `context_created` | Kontext angelegt |
| `context_renamed` | Kontext umbenannt |
| `property_assigned` | Objekt zu Kontext zugeordnet |
| `property_unassigned` | Zuordnung entfernt |
| `unit_created` | Einheit angelegt |
| `unit_updated` | Einheit geändert |
| `valuation_consented` | Bewertung bestätigt |
| `valuation_job_created` | Job gestartet |
| `valuation_done` | Bewertung abgeschlossen |
| `valuation_report_linked` | Report im DMS verknüpft |
| `service_case_created` | Sanierungsvorgang angelegt |
| `outbound_sent` | Ausschreibung versendet |
| `offer_received` | Angebot eingegangen |
| `offer_accepted` | Angebot akzeptiert |
| `offer_rejected` | Angebot abgelehnt |
| `award_sent` | Vergabe versendet |

---

## 14. Acceptance Criteria (MVP)

| AC | Kriterium |
|----|-----------|
| **AC1** | MOD-04 ist eigenständig nutzbar (Portfolio, Exposé, Kontexte, Sanierung, Bewertung) |
| **AC2** | Berührungswege sind strikt (nur Flags/IDs/Contracts/Consents) |
| **AC3** | Immobilienliste zeigt exakt 13 Spalten in definierter Reihenfolge |
| **AC4** | Exposé zeigt alle definierten Felder |
| **AC5** | DMS integriert: object_id-Filter, Preview/Download via signed URLs |
| **AC6** | Sanierung End-to-End: Tender-ID, Outbound, Inbound, Matching, Vergabe, DMS |
| **AC7** | Bewertung End-to-End: Estimate, Consent, Job, Result, Report-Link, Historie |

---

## 15. Offene Punkte

- ~~Q4.6: Kontext-Zuordnung~~ → ✅ context_property_assignment EXISTS
- ~~Q4.7: Sanierung End-to-End~~ → ✅ service_cases + outbound/offers + Edge Functions
- Q4.8: Bewertung-Worker (Sprengnetter API Integration) → PENDING
- Q4.9: Valuations Job Queue → PENDING (benötigt jobs Tabelle)
- Q4.10: DMS-Verknüpfung bei Sanierung → ✅ dms_folder_id in service_cases
- Q4.11: service_case_vendors Tabelle → P2 (Optional)
- Q4.12: Inbound-Webhook E-Mail-Parsing → ✅ sot-renovation-inbound-webhook EXISTS

---

## 16. Edge Functions (MOD-04)

| Function | API-ID | Status | Beschreibung |
|----------|--------|--------|--------------|
| `sot-property-crud` | API-701 | ✅ ACTIVE | Property CRUD Operations |
| `sot-expose-description` | INTERNAL-002 | ✅ ACTIVE | KI-Beschreibungsgenerator |
| `sot-places-search` | INTERNAL-009 | ✅ ACTIVE | Google Places Suche |
| `sot-renovation-outbound` | INTERNAL-010 | ✅ ACTIVE | Ausschreibungs-Versand |
| `sot-renovation-inbound-webhook` | INTERNAL-011 | ✅ ACTIVE | Inbound E-Mail-Matching |
| `sot-renovation-scope-ai` | INTERNAL-008 | ✅ ACTIVE | KI-Leistungsanalyse |
| `sot-geomap-snapshot` | — | ✅ ACTIVE | Kartenvisualisierung |

---

## 17. UI-Komponenten (Repository)

### 17.1 Pages

| Datei | Beschreibung |
|-------|--------------|
| `PortfolioTab.tsx` | Portfolio-Liste mit 13-Spalten + Investment-Simulation |
| `PropertyDetailPage.tsx` | Immobilienakte mit Tabs |
| `KontexteTab.tsx` | Vermietereinheiten-Verwaltung |
| `SanierungTab.tsx` | Sanierungsvorgänge |
| `BewertungTab.tsx` | Bewertungsübersicht |

### 17.2 Immobilienakte-Blöcke

| Komponente | Block | Beschreibung |
|------------|-------|--------------|
| `IdentityBlock.tsx` | A | ID, Code, Typ |
| `CoreDataBlock.tsx` | B+C | Adresse + Gebäude |
| `LegalBlock.tsx` | D | Grundbuch + Erwerb |
| `InvestmentKPIBlock.tsx` | E | Investment-Kennzahlen |
| `TenancyBlock.tsx` | F | Mietverhältnisse |
| `NKWEGBlock.tsx` | G | WEG/NK |
| `FinancingBlock.tsx` | H | Finanzierung |
| `InventoryInvestmentSimulation.tsx` | — | 40-Jahres-Simulation |

---

## 18. Audit-Zusammenfassung (2026-02-06)

### Completion Status: 92%

| Bereich | Status | Details |
|---------|--------|---------|
| Route-Struktur | ✅ 100% | 4-Tile-Pattern (Portfolio, Kontexte, Sanierung, Bewertung) |
| Manifest-Sync | ✅ 100% | routesManifest + moduleContents synchron |
| DB-Tabellen | ✅ 95% | Alle Kerntabellen existieren |
| RLS-Policies | ✅ 100% | Vollständig für properties, units, contexts |
| Edge Functions | ✅ 100% | 7 Edge Functions aktiv |
| Immobilienakte UI | ✅ 90% | 10-Block-Struktur implementiert |
| Investment-Simulation | ✅ 100% | 40-Jahres-Chart + Tabelle |
| Sanierung E2E | ✅ 85% | Outbound + Inbound aktiv |
| Bewertung E2E | ⚠️ 60% | UI vorhanden, Worker pending |

### Nächste Schritte (Phase 2)

1. Sprengnetter API Integration für Bewertung
2. jobs Tabelle für async Valuation Worker
3. service_case_vendors für Dienstleister-Pool (optional)

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.1 | 2026-01-25 | Initial erstellt aus Master Spec v1.1 Prompt |
| **2.0** | **2026-02-06** | **Audit-Update:** DB-Status verifiziert, Edge Functions dokumentiert, UI-Komponenten katalogisiert |

---

*Dieses Dokument ist der verbindliche Spezifikationsstand für MOD-04.*
