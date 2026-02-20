

# Reparaturplan: Daten-Vollstaendigkeit und Korrektheit

## Ist-Zustand nach Analyse

### Entitaeten-Status (27 Punkte)

| # | Entitaet | Soll | Ist | Status | Problem |
|---|----------|------|-----|--------|---------|
| 1 | Profil | 1 | 1 | OK | |
| 2 | Kontakte | 5 | 5 | OK | |
| 3 | Landlord Context | 1 | 1 | OK | |
| 4 | Properties | 3 | 3 | OK | Aber market_value ist NULL |
| 5 | Units | 3 | 3 | OK | |
| 6 | Leases | 3 | 3 | OK | tenant_contact_id korrekt auf Klaus Bergmann |
| 7 | Loans | 3 | 3 | OK | |
| 8 | **Property Accounting** | **3** | **0** | **FEHLT** | Upsert scheitert leise |
| 9 | Bankkonten | 1 | 1 | OK | |
| 10 | Transaktionen | 100 | 100 | OK | |
| 11 | **Haushaltspersonen** | 4 | 4 | **UNVOLLST.** | Max: alle Finanzfelder NULL |
| 12 | Fahrzeuge | 2 | 2 | OK | |
| 13 | PV-Anlage | 1 | 1 | OK | |
| 14 | Versicherungen | 7 | 7 | OK | |
| 15 | KV-Vertraege | 4 | 4 | OK | |
| 16 | Vorsorge | 6 | 6 | OK | |
| 17 | Abonnements | 8 | 8 | OK | |
| 18 | Privatkredite | 2 | 2 | OK | |
| 19 | Miety Home | 1 | 1 | OK | |
| 20 | Miety Contracts | 4 | 4 | OK | |
| 21 | Acq Mandate | 1 | 1 | OK | |
| 22 | **Acq Offers** | **1** | **0** | **FEHLT** | Kein Objekteingang-Demo |
| 23 | Pet Customers | 3 | 3 | OK | |
| 24 | Pets | 5 | 5 | OK | |
| 25 | Pet Bookings | 5 | 5 | OK | |
| 26 | Depot Accounts | 2 | 2 | OK | |
| 27 | Depot Positions | 5 | 5 | OK | |
| 28 | Dev Projects | 1 | 1 | OK | |

**Ergebnis: 24 von 28 OK, 4 Punkte offen**

---

## Die 4 offenen Probleme und Reparaturen

### Problem 1: Property Accounting leer (0/3)

**Ursache:** Die `seedPropertyAccounting`-Funktion schreibt die AfA-Daten korrekt zusammen, aber die ID-Generierung nutzt `e0000000-0000-4000-a000-afa${propId.slice(-3)}001`. Der Upsert scheitert leise, vermutlich weil die generierte ID ein ungueltiges UUID-Format erzeugt (`...afa001001` ist keine gueltige Hex-Sequenz in UUID v4).

**Reparatur in `src/hooks/useDemoSeedEngine.ts`:**
- ID-Generierung auf valides UUID-Format aendern, z.B. `e0000000-0000-4000-a000-00000afa0001`, `...0002`, `...0003`
- Error-Logging verbessern, damit Upsert-Fehler sichtbar werden

### Problem 2: Max Mustermann Finanzfelder NULL

**Ursache:** Die CSV `demo_household_persons.csv` hat fuer Max (Zeile 2) LEERE Felder bei `gross_income_monthly`, `net_income_monthly`, `tax_class`. Zusaetzlich fehlen die DB-Spalten `business_income_monthly` und `pv_income_monthly` komplett in der CSV.

Die DB hat diese Spalten:
- `gross_income_monthly` -- leer in CSV
- `net_income_monthly` -- leer in CSV
- `tax_class` -- leer in CSV
- `business_income_monthly` -- nicht in CSV (existiert als DB-Spalte)
- `pv_income_monthly` -- nicht in CSV (existiert als DB-Spalte)
- `planned_retirement_date` -- nicht in CSV

**Reparatur in `public/demo-data/demo_household_persons.csv`:**

Header erweitern um: `business_income_monthly;pv_income_monthly;planned_retirement_date`

Max-Zeile befuellen:
- `gross_income_monthly`: 8500 (Selbstaendiger, IT-Berater)
- `net_income_monthly`: 5200
- `tax_class`: III (verheiratet, Alleinverdiener)
- `business_income_monthly`: 8500 (= Einkommen aus Selbstaendigkeit)
- `pv_income_monthly`: 212 (= annual_revenue 2542 / 12 aus PV-Anlage)
- `planned_retirement_date`: 2049-03-15 (Alter 67)

Lisa-Zeile ergaenzen:
- `business_income_monthly`: (leer)
- `pv_income_monthly`: (leer)
- `planned_retirement_date`: 2052-07-22 (Alter 67)

### Problem 3: market_value NULL fuer alle Properties

**Ursache:** Die CSV `demo_properties.csv` hat keine Spalte `market_value`. Die DB-Spalte existiert aber.

**Reparatur in `public/demo-data/demo_properties.csv`:**

Spalte `market_value` hinzufuegen:
- BER-01: 340000 (Altbau Berlin, Wertzuwachs seit Kauf 2017)
- MUC-01: 520000 (Muenchen Premium-Lage, Wertzuwachs seit 2020)
- HH-01: 210000 (Hamburg Elbchaussee, Wertzuwachs seit 2019)

### Problem 4: Objekteingang (acq_offers) leer

**Ursache:** Es gibt keine CSV-Datei und keine Seed-Funktion fuer `acq_offers`. Das Akquise-Mandat (ACQ-DEMO-001) existiert, aber es fehlt ein eingegangenes Objekt, um den Objekteingang demonstrieren zu koennen.

**Reparatur:**

1. Neue CSV erstellen: `public/demo-data/demo_acq_offers.csv`
   - 1 Demo-Objekt: MFH-Angebot aus Berlin-Neukoelln
   - Verknuepft mit Mandat `e0000000-0000-4000-e000-000000000001`
   - Felder: title, address, postal_code, city, price_asking, units_count, area_sqm, year_built, yield_indicated, provider_name, status, received_at

2. Neue Funktion: `seedAcqOffers()` in `useDemoSeedEngine.ts`

3. Demo-Daten-Eintrag: `demo_manifest.json` um `acq_offers: 1` erweitern

4. Cleanup erweitern: `acq_offers` vor `acq_mandates` loeschen

---

## Zusammenfassung der Datei-Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `public/demo-data/demo_household_persons.csv` | 3 neue Spalten (business_income, pv_income, retirement_date), Max-Zeile mit Werten befuellen |
| `public/demo-data/demo_properties.csv` | Spalte market_value hinzufuegen mit realistischen Verkehrswerten |
| `public/demo-data/demo_acq_offers.csv` | NEU: 1 Demo-Objekt fuer Objekteingang |
| `src/hooks/useDemoSeedEngine.ts` | Property-Accounting ID-Fix, seedAcqOffers()-Funktion, Parsing fuer neue CSV-Spalten |
| `src/hooks/useDemoCleanup.ts` | acq_offers in Cleanup-Reihenfolge |
| `src/engines/demoData/data.ts` | acq_offers ID in ALL_DEMO_IDS |
| `public/demo-data/demo_manifest.json` | acq_offers: 1 hinzufuegen |

---

## Technische Details

### Property Accounting ID-Fix

Aktuell:
```text
id: `e0000000-0000-4000-a000-afa${propId.slice(-3)}001`
// ergibt: e0000000-0000-4000-a000-afa001001 (nicht-hex "afa" ist ungueltig)
```

Neu:
```text
id: `e0000000-0000-4000-a000-0000afa00001` (BER-01)
id: `e0000000-0000-4000-a000-0000afa00002` (MUC-01)
id: `e0000000-0000-4000-a000-0000afa00003` (HH-01)
```

### CSV-Erweiterung household_persons (Zeile Max)

```text
Header: ...;gross_income_monthly;net_income_monthly;tax_class;child_allowances;business_income_monthly;pv_income_monthly;planned_retirement_date
Max:    ...;8500;5200;III;2.0;8500;212;2049-03-15
Lisa:   ...;4200;2800;V;1.0;;;2052-07-22
```

### Neues acq_offers Demo-Objekt

```text
id: e0000000-0000-4000-e000-000000000010
mandate_id: e0000000-0000-4000-e000-000000000001
title: MFH Berlin-Neukoelln, 8 WE
address: Sonnenallee 142
postal_code: 12059
city: Berlin
price_asking: 2400000
units_count: 8
area_sqm: 640
year_built: 1912
yield_indicated: 4.8
provider_name: Engel & Voelkers Berlin
status: new
received_at: 2026-02-18
source_type: email
```

