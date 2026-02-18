
# Magic Intake: Soll-Ist-Analyse aller Zone-2-Module

## Ueberblick

Systematische Pruefung aller 20+ Zone-2-Module auf Magic-Intake-Eignung. Magic Intake = "User gibt Armstrong ein Dokument, Armstrong legt den Datensatz automatisch an."

---

## IST-Zustand: Was existiert bereits?

| Modul | Action-Code | Typ | Status |
|-------|-------------|-----|--------|
| MOD-04 Immobilien | `ARM.MOD04.MAGIC_INTAKE_PROPERTY` | Dokument → `properties` + `units` | Implementiert |
| MOD-11 Finanzmanager | `ARM.MOD11.MAGIC_INTAKE_CASE` | Dokument → `finance_requests` + `applicant_profiles` | Implementiert |
| MOD-11 Finanzmanager | `ARM.MOD11.MAGIC_INTAKE` | Formular (Name+Email) → Akte | Implementiert (MagicIntakeCard) |
| MOD-13 Projekte | `ARM.MOD13.CREATE_DEV_PROJECT` | Expose/Preisliste → `dev_projects` + `dev_project_units` | Implementiert (sot-project-intake) |
| MOD-18 Finanzanalyse | `ARM.MOD18.MAGIC_INTAKE_FINANCE` | Dokument → `insurance_contracts` + `user_subscriptions` | Implementiert |

**5 Magic Intakes existieren bereits.**

---

## SOLL: Welche Module brauchen Magic Intake?

### Tier 1 — Hoher Mehrwert, klarer Dokumentenbezug (sofort umsetzen)

#### 1. MOD-17 Fahrzeuge — `ARM.MOD17.MAGIC_INTAKE_VEHICLE`
- **Input-Dokumente:** Fahrzeugschein (Zulassungsbescheinigung Teil I), Fahrzeugbrief, Kaufvertrag
- **Ziel-Tabelle:** `cars_vehicles`
- **Mapping:**

| Parser-Feld | DB-Spalte |
|-------------|-----------|
| license_plate | license_plate |
| hsn | hsn |
| tsn | tsn |
| make | make |
| model | model |
| first_registration | first_registration_date |
| holder_name | holder_name |
| mileage | current_mileage_km |
| hu_until | hu_valid_until |
| vin | vin |

- **Aufwand:** Gering — Tabelle + Dialog existieren, nur Mapping noetig
- **Credits:** 2 (Parser + Advisor)
- **Nutzer-Vorteil:** Fahrzeugschein abfotografieren statt 9 Felder tippen

#### 2. MOD-12 Akquise-Manager — `ARM.MOD12.MAGIC_INTAKE_MANDATE`
- **Input-Dokumente:** Suchprofil-PDF, Ankaufsprofil, Investment-Criteria-Sheet
- **Ziel-Tabelle:** `acq_mandates`
- **Mapping:**

| Parser-Feld | DB-Spalte |
|-------------|-----------|
| client_name | client_display_name |
| asset_types | target_asset_types (JSONB) |
| region | target_region |
| min_price / max_price | budget_min / budget_max |
| min_yield | min_yield_pct |
| notes | notes |

- **Aufwand:** Mittel — Mandate existieren, Parser braucht spezialisierten Modus
- **Credits:** 3
- **Nutzer-Vorteil:** Investor-Briefing als PDF hochladen, Mandat wird sofort angelegt

#### 3. MOD-19 Photovoltaik — `ARM.MOD19.MAGIC_INTAKE_PLANT`
- **Input-Dokumente:** Installationsprotokoll, Anlagenzertifikat, Einspeisevertrag, Datenblatt
- **Ziel-Tabelle:** `pv_plants`
- **Mapping:**

| Parser-Feld | DB-Spalte |
|-------------|-----------|
| plant_name | name |
| capacity_kwp | capacity_kwp |
| commissioning_date | commissioning_date |
| address | address |
| module_count | module_count |
| inverter_type | inverter_model |
| annual_yield_kwh | annual_yield_kwh |
| feed_in_tariff_cents | feed_in_tariff_cents |
| bank_name | financing_bank |
| loan_amount | financing_original_amount |
| monthly_rate | financing_monthly_rate |

- **Aufwand:** Mittel — Tabelle existiert mit umfangreichen Feldern
- **Credits:** 3
- **Nutzer-Vorteil:** Installationsprotokoll hochladen statt 15+ Felder manuell eingeben

#### 4. MOD-07 Finanzierung (Client-Seite) — `ARM.MOD07.MAGIC_INTAKE_SELBSTAUSKUNFT`
- **Input-Dokumente:** Gehaltsabrechnungen, Rentenbescheide, Steuerbescheide
- **Ziel-Tabelle:** `self_disclosure` (Sektionen 1-7 im JSONB)
- **Mapping:**

| Parser-Feld | DB-Spalte / JSONB-Pfad |
|-------------|------------------------|
| gross_income | section_1.gross_income |
| net_income | section_1.net_income |
| employer | section_1.employer |
| employment_type | section_1.employment_type |
| existing_loans | section_3.loans[] |
| assets | section_4.assets[] |

- **Aufwand:** Mittel — Selbstauskunft-Struktur existiert, aber JSONB-Mapping ist komplex
- **Credits:** 3
- **Nutzer-Vorteil:** Gehaltsnachweis hochladen, Armstrong fuellt Selbstauskunft automatisch

---

### Tier 2 — Mittlerer Mehrwert, strukturierte Dokumente

#### 5. MOD-20 Zuhause (Miety) — `ARM.MOD20.MAGIC_INTAKE_CONTRACT`
- **Input-Dokumente:** Mietvertrag, Nebenkostenabrechnung, Versorgungsvertraege
- **Ziel-Tabellen:** `miety_contracts`, `miety_utilities`
- **Mapping:** Miethoehe, Nebenkosten, Vermieter, Kuendigungsfrist, Vertragspartner
- **Credits:** 2
- **Nutzer-Vorteil:** Mietvertrag hochladen statt Daten abtippen

#### 6. MOD-08 Immo-Suche — `ARM.MOD08.MAGIC_INTAKE_MANDATE`
- **Input-Dokumente:** Suchprofil, Investmentkriterien-PDF
- **Ziel-Tabelle:** `search_mandates`
- **Mapping:** Region, Budget, Objektart, Mindestrendite, Strategie
- **Credits:** 2
- **Nutzer-Vorteil:** Suchmandat aus schriftlichem Briefing erstellen

#### 7. MOD-01 Stammdaten — `ARM.MOD01.MAGIC_INTAKE_PROFILE`
- **Input-Dokumente:** Visitenkarte, Personalausweis, Handelsregisterauszug
- **Ziel-Tabellen:** `organizations`, `profiles`
- **Mapping:** Name, Firma, Adresse, Steuernummer, USt-ID, Handelsregisternummer
- **Credits:** 2
- **Nutzer-Vorteil:** Visitenkarte abfotografieren = Kontaktdaten sofort erfasst

---

### Tier 3 — Nischenfall, aber sinnvoll

#### 8. MOD-06 Verkauf — `ARM.MOD06.MAGIC_INTAKE_LISTING`
- **Input-Dokumente:** Expose eines Fremd-Maklers, Eigentumsnachweis
- **Ziel-Tabelle:** `sale_listings`
- **Mapping:** Objektdaten, Preis, Provision, Lage
- **Credits:** 3
- **Nutzer-Vorteil:** Fremdes Expose einlesen, eigenes Listing befuellen

#### 9. MOD-09 Vertriebspartner — `ARM.MOD09.MAGIC_INTAKE_PARTNER`
- **Input-Dokumente:** Partnerbewerbung, Lebenslauf, Zertifikate
- **Ziel-Tabelle:** `partner_profiles`
- **Mapping:** Name, Qualifikationen, Regionen, IHK-Nummer
- **Credits:** 2

---

### Kein Magic Intake sinnvoll (begruendet)

| Modul | Grund |
|-------|-------|
| MOD-02 KI Office | Kein "Anlage"-Prozess — Office ist Chat/E-Mail/Brief |
| MOD-03 DMS | Hat bereits sot-document-parser + Auto-Sortierung |
| MOD-05 MSV (Telefon) | Placeholder-Modul, keine Datenstruktur |
| MOD-10 Provisionen | Werden systemseitig generiert, kein User-Input |
| MOD-14 Communication Pro | Kampagnen werden manuell konfiguriert, kein Dokumenten-Input |
| MOD-15 Fortbildung | Kurskatalog ist admin-gepflegt, nicht user-getrieben |
| MOD-16 Services | Shop-Katalog ist admin-gepflegt |

---

## Zusammenfassung: Magic Intake Roadmap

| Status | Modul | Action-Code | Credits | Prioritaet |
|--------|-------|-------------|---------|------------|
| Existiert | MOD-04 Immobilien | `ARM.MOD04.MAGIC_INTAKE_PROPERTY` | 3 | -- |
| Existiert | MOD-11 Finanzmanager | `ARM.MOD11.MAGIC_INTAKE_CASE` | 3 | -- |
| Existiert | MOD-13 Projekte | `ARM.MOD13.CREATE_DEV_PROJECT` | 10 | -- |
| Existiert | MOD-18 Finanzanalyse | `ARM.MOD18.MAGIC_INTAKE_FINANCE` | 2 | -- |
| **NEU** | MOD-17 Fahrzeuge | `ARM.MOD17.MAGIC_INTAKE_VEHICLE` | 2 | Tier 1 |
| **NEU** | MOD-12 Akquise | `ARM.MOD12.MAGIC_INTAKE_MANDATE` | 3 | Tier 1 |
| **NEU** | MOD-19 Photovoltaik | `ARM.MOD19.MAGIC_INTAKE_PLANT` | 3 | Tier 1 |
| **NEU** | MOD-07 Finanzierung | `ARM.MOD07.MAGIC_INTAKE_SELBSTAUSKUNFT` | 3 | Tier 1 |
| **NEU** | MOD-20 Zuhause | `ARM.MOD20.MAGIC_INTAKE_CONTRACT` | 2 | Tier 2 |
| **NEU** | MOD-08 Immo-Suche | `ARM.MOD08.MAGIC_INTAKE_MANDATE` | 2 | Tier 2 |
| **NEU** | MOD-01 Stammdaten | `ARM.MOD01.MAGIC_INTAKE_PROFILE` | 2 | Tier 2 |
| **NEU** | MOD-06 Verkauf | `ARM.MOD06.MAGIC_INTAKE_LISTING` | 3 | Tier 3 |
| **NEU** | MOD-09 Vertriebspartner | `ARM.MOD09.MAGIC_INTAKE_PARTNER` | 2 | Tier 3 |

**Total: 4 existierend + 9 neue = 13 Magic Intakes**

---

## Technische Umsetzung

Alle 9 neuen Intakes folgen dem identischen Pattern:

1. **Manifest:** Action in `armstrongManifest.ts` registrieren (je ~20 Zeilen)
2. **Backend:** Case im `sot-armstrong-advisor` Switch hinzufuegen (je ~50 Zeilen Mapping)
3. **Frontend:** Nichts — Armstrong-Chat hat Upload + Confirm bereits

### Umsetzungsreihenfolge

**Sprint 1 (Tier 1):** MOD-17 Fahrzeuge, MOD-12 Akquise, MOD-19 PV, MOD-07 Selbstauskunft
- 4 Actions, ~200 Zeilen Backend, ~80 Zeilen Manifest
- Geschaetzt: 1 Session

**Sprint 2 (Tier 2):** MOD-20 Zuhause, MOD-08 Immo-Suche, MOD-01 Stammdaten
- 3 Actions, ~150 Zeilen Backend
- Geschaetzt: 1 Session

**Sprint 3 (Tier 3):** MOD-06 Verkauf, MOD-09 Vertriebspartner
- 2 Actions, ~100 Zeilen Backend
- Geschaetzt: 0.5 Session

### Parser-Modi

Der `sot-document-parser` benoetigt folgende neue parseModes:

| parseMode | Fuer | Extrahiert |
|-----------|------|------------|
| `vehicle_registration` | MOD-17 | Fahrzeugschein-Felder (HSN, TSN, Kennzeichen, VIN) |
| `acquisition_profile` | MOD-12 | Investment-Kriterien, Budget, Region |
| `pv_installation` | MOD-19 | Anlagenleistung, Module, Wechselrichter, Einspeisedaten |
| `salary_slip` | MOD-07 | Brutto/Netto, Arbeitgeber, Steuerklasse |
| `rental_contract` | MOD-20 | Miete, NK, Vermieter, Laufzeit |
| `search_profile` | MOD-08 | Budget, Region, Objektart, Rendite |
| `business_card` | MOD-01 | Name, Firma, Adresse, Kontaktdaten |
| `sale_expose` | MOD-06 | Objektdaten, Preis, Provision |
| `partner_cv` | MOD-09 | Qualifikationen, Regionen |

Diese werden als Prompt-Templates im Advisor definiert — der Parser selbst bleibt generisch (Gemini erhaelt das Schema als Instruction).
