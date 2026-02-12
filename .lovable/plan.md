
# Immobilienvermögen: Ja/Nein-Abfrage, Zusatzkachel und Datenbankstruktur

## Uebersicht

Der Kunde wird bei den monatlichen Einnahmen gefragt, ob Mieteinnahmen vorliegen (Ja/Nein). Bei "Ja" erscheint ein Hinweistext und weiter unten oeffnet sich eine neue Kachel "Immobilienvermoegen", in der er bis zu 3 Bestandsimmobilien mit Verbindlichkeiten erfassen kann -- analog zum Bank-PDF-Formular. Die Summe der Nettokaltmieten fliesst automatisch in die Kapitaldienstfaehigkeitsberechnung ein.

Alle Aenderungen gelten fuer MOD-07 (Kundenformular) UND MOD-11 (Manager-Ansicht) gleichermassen.

---

## 1. Einnahmen-Section: Mieteinnahmen als Ja/Nein-Trigger

**Datei:** `ApplicantPersonFields.tsx` (IncomeSection)

Aktuell ist "Mieteinnahmen" ein freies Zahlenfeld. Neu:

```text
Mieteinnahmen (bestehend)  |  [Ja ▼] / [Nein ▼]  |  [Ja ▼] / [Nein ▼]
```

- Wenn "Ja": Feld wird read-only und zeigt die automatisch berechnete Summe aus der Immobilienaufstellung
- Darunter erscheint ein Hinweistext: "Bitte befuellen Sie weiter unten die Zusatzangaben zu Ihrem Immobilienvermoegen."
- Wenn "Nein": Wert wird auf 0 gesetzt, Immobilienkachel bleibt ausgeblendet

**Neues Feld im FormData:** `has_rental_properties: boolean` (fuer AS1 und AS2)

---

## 2. Neue Datenbanktabelle: `applicant_property_assets`

Eine Kind-Tabelle zu `applicant_profiles`, die bis zu N Bestandsimmobilien speichert:

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | uuid (PK) | |
| applicant_profile_id | uuid (FK) | Verknuepfung zum Antragsteller |
| property_index | int | 1, 2, 3 (Reihenfolge) |
| property_type | text | Objektart (ETW, EFH, MFH etc.) |
| address | text | Adresse |
| living_area_sqm | numeric | Gesamte Wohnflaeche |
| rented_area_sqm | numeric | Davon vermietet |
| commercial_area_sqm | numeric | Gewerbliche Nutzflaeche |
| construction_year | int | Baujahr |
| purchase_price | numeric | Kaufpreis |
| estimated_value | numeric | Geschaetzter Wert heute |
| net_rent_monthly | numeric | Nettokaltmiete pro Monat |
| units_count | int | Anzahl Wohneinheiten |
| loan1_lender | text | Darlehensgeber 1 |
| loan1_balance | numeric | Darlehensstand aktuell |
| loan1_rate_monthly | numeric | Darlehensrate mtl. |
| loan1_interest_rate | numeric | Sollzinssatz |
| loan2_lender | text | Darlehensgeber 2 |
| loan2_balance | numeric | |
| loan2_rate_monthly | numeric | |
| loan2_interest_rate | numeric | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Zugriff ueber `applicant_profiles.tenant_id` (gleiche Policy-Logik wie bestehende Tabellen).

---

## 3. Neue Kachel: "Immobilienvermoegen"

**Neue Datei:** `src/components/finanzierung/PropertyAssetsCard.tsx`

Wird nur angezeigt, wenn `has_rental_properties = true` bei mindestens einem Antragsteller.

Layout (analog zum PDF-Formular):

```text
+--- Kachel: Immobilienvermoegen ------------------------------------------+
| [Building2] Aufstellung Ihres Immobilienvermoegens                       |
| Ergaenzende Angaben zu bestehenden Immobilien und deren Verbindlichkeiten|
+--------------------------------------------------------------------------+
| Immobilie 1                                              [Entfernen]     |
| Objektart:        [ETW ▼]                                                |
| Adresse:          [____________]                                         |
| Wohnflaeche:      [___] m²   Davon vermietet: [___] m²  Baujahr: [___]  |
| Kaufpreis:        [___] EUR  Geschaetzter Wert: [___] EUR                |
| Nettokaltmiete:   [___] EUR/Monat   Wohneinheiten: [___]                |
| --- Verbindlichkeiten ---                                                |
| Darlehen 1: Geber [____]  Stand [____] EUR  Rate [____] EUR  Zins [__]% |
| Darlehen 2: Geber [____]  Stand [____] EUR  Rate [____] EUR  Zins [__]% |
+--------------------------------------------------------------------------+
| [+ Immobilie hinzufuegen]                                                |
+--------------------------------------------------------------------------+
| Summe Nettokaltmieten: 2.850,00 EUR                                     |
| Summe Darlehensraten:  1.420,00 EUR                                     |
+--------------------------------------------------------------------------+
```

- Max. 5 Immobilien (erweiterbar)
- Summe Nettokaltmieten wird automatisch in `rental_income_monthly` zurueckgeschrieben
- Summe Darlehensraten fliesst in die Kapitaldienstberechnung ein

---

## 4. Integration in MOD-11 (FMFinanzierungsakte) und MOD-07 (SelbstauskunftFormV2)

**MOD-11** (`FMFinanzierungsakte.tsx`):
- PropertyAssetsCard wird zwischen "Einnahmen/Ausgaben"-Kachel und "Finanzierungsobjekt" eingefuegt
- Sichtbar nur wenn `has_rental_properties = true`
- Daten werden im gleichen localStorage-Key gespeichert und beim Floating Save mit persistiert

**MOD-07** (`SelbstauskunftFormV2.tsx`):
- Gleiche PropertyAssetsCard, aber mit zusaetzlichem Button: "Aus Immobilienportfolio importieren" (laedt Daten aus MOD-04 Properties)
- In MOD-11 gibt es diesen Import-Button NICHT (Manager hat kein Portfolio)

---

## 5. Berechnung: Rueckwirkung auf Kapitaldienstfaehigkeit

In `HouseholdCalculationCard.tsx` wird die CALC_MATRIX erweitert:

| Feld | Quelle | Regel |
|---|---|---|
| existingRentalIncome | Summe net_rent_monthly aus PropertyAssets | Nur wenn has_rental_properties = true |
| existingLoanPayments | Summe loan_rates aus PropertyAssets | Neue Ausgaben-Zeile in der Haushaltsrechnung |

---

## 6. Neues Feld in applicant_profiles

`has_rental_properties` (boolean, default false) wird als Spalte zur bestehenden Tabelle hinzugefuegt, damit der Ja/Nein-Status persistent gespeichert wird.

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| **DB-Migration** | Neue Tabelle `applicant_property_assets` + Spalte `has_rental_properties` in `applicant_profiles` |
| `ApplicantPersonFields.tsx` | Mieteinnahmen-Zeile: Ja/Nein-Select statt Zahlenfeld + Hinweistext |
| `PropertyAssetsCard.tsx` (NEU) | Kachel fuer Immobilienaufstellung (bis zu 5 Immobilien + Verbindlichkeiten) |
| `FMFinanzierungsakte.tsx` | PropertyAssetsCard einbinden (MOD-11) |
| `SelbstauskunftFormV2.tsx` | PropertyAssetsCard einbinden (MOD-07) + Import-Button aus MOD-04 |
| `HouseholdCalculationCard.tsx` | CALC_MATRIX um bestehende Darlehensraten erweitern |
