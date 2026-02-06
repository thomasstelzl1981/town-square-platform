# Golden Path: Finanzierung (MOD-07 + MOD-11)

**Version:** 1.0  
**Status:** ACTIVE  
**Date:** 2026-02-06

---

## Übersicht

Der Finanzierungs-Golden-Path beschreibt den vollständigen Workflow von der Selbstauskunft des Kunden bis zur Bank-Einreichung durch den Finanzierungsmanager.

**Kritische Trennung:**
- **MOD-07 (Kunde):** Nur Datenerfassung — KEINE Bank-API!
- **Zone 1 (FutureRoom):** Nur Triage + Zuweisung
- **MOD-11 (Manager):** Bank-Übergabe via E-Mail oder Europace API

---

## Architektur

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           FINANZIERUNG GOLDEN PATH                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ZONE 2: MOD-07 (Kunde)              ZONE 1: FutureRoom (Admin)     ZONE 2: MOD-11 (Manager)│
│  ═══════════════════════             ══════════════════════════     ═════════════════════════│
│                                                                                             │
│  ┌─────────────────────┐                                                                    │
│  │ 1. SELBSTAUSKUNFT   │    Nur Datenerfassung                                              │
│  │    9 Sektionen      │    ─────────────────►  KEINE Übergabe an Banken!                   │
│  │    (Antragsteller   │                        KEIN Europace/BaufiSmart!                   │
│  │     1 + optional 2) │                                                                    │
│  └─────────┬───────────┘                                                                    │
│            │                                                                                │
│            ▼                                                                                │
│  ┌─────────────────────┐                                                                    │
│  │ 2. DOKUMENTE        │    DMS-Checkliste                                                  │
│  │    (Bonitäts-       │    für Bankunterlagen                                              │
│  │     unterlagen)     │                                                                    │
│  └─────────┬───────────┘                                                                    │
│            │                                                                                │
│            ▼                                                                                │
│  ┌─────────────────────┐                                                                    │
│  │ 3. ANFRAGE          │    Objektdaten                                                     │
│  │    (Finanzierungs-  │    + Kostenaufstellung                                             │
│  │     vorhaben)       │    + Finanzierungsplan                                             │
│  └─────────┬───────────┘                                                                    │
│            │                                                                                │
│            │  status = 'submitted'                                                          │
│            ▼                                                                                │
│  ┌─────────────────────┐   ┌─────────────────────────┐                                      │
│  │ 4. STATUS           │──►│ FutureRoom INBOX        │                                      │
│  │    (Einreichung)    │   │ Triage + Delegation     │                                      │
│  └─────────────────────┘   └───────────┬─────────────┘                                      │
│                                        │                                                    │
│       ◄──────────────────────────────  │  status = 'assigned'                               │
│       Benachrichtigung                 ▼                                                    │
│                            ┌─────────────────────────┐   ┌─────────────────────────────────┐│
│                            │ FutureRoom ZUWEISUNG    │──►│ MOD-11 FINANZIERUNGSMANAGER     ││
│                            │ Manager auswählen       │   │                                 ││
│                            └─────────────────────────┘   │ ┌─────────────────────────────┐ ││
│                                                          │ │ Dashboard                   │ ││
│                                                          │ │ Fälle                       │ ││
│                                                          │ │ Kommunikation               │ ││
│                                                          │ │ Status                      │ ││
│                                                          │ └─────────────────────────────┘ ││
│                                                          │                                 ││
│                                                          │ ┌─────────────────────────────┐ ││
│                                                          │ │ EINREICHEN AN BANK          │ ││
│                                                          │ │ • E-Mail + Datenraum-Link   │ ││
│                                                          │ │ • ODER Europace API         │ ││
│                                                          │ │   (NUR HIER!)               │ ││
│                                                          │ └─────────────────────────────┘ ││
│                                                          └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Modul-Verantwortlichkeiten

| Modul | Zone | Funktion | Bank-Übergabe |
|-------|------|----------|---------------|
| **MOD-07** | Zone 2 | Datenerfassung durch Kunden | ❌ NEIN |
| **FutureRoom** | Zone 1 | Triage + Delegation | ❌ NEIN |
| **MOD-11** | Zone 2 | Operatives Processing | ✅ JA |

---

## Datenmodell

### Kerntabellen

| Tabelle | Modul | Zweck |
|---------|-------|-------|
| `applicant_profiles` | MOD-07 | Persönliche Selbstauskunft |
| `applicant_liabilities` | MOD-07 | Verbindlichkeiten (1:N) |
| `finance_requests` | MOD-07 | Finanzierungsanfragen mit Objektdaten |
| `finance_mandates` | Zone 1 | Zuweisungen an Manager |
| `future_room_cases` | MOD-11 | Bearbeitete Fälle |

### Datentrennung

| Datentyp | Speicherort | Editierbar in |
|----------|-------------|---------------|
| Personendaten | `applicant_profiles` | MOD-07 Selbstauskunft |
| Haushaltsdaten | `applicant_profiles` | MOD-07 Selbstauskunft |
| Beschäftigungsdaten | `applicant_profiles` | MOD-07 Selbstauskunft |
| Einnahmen/Ausgaben | `applicant_profiles` | MOD-07 Selbstauskunft |
| Vermögen | `applicant_profiles` + MOD-04 (read-only) | MOD-07 Selbstauskunft |
| Verbindlichkeiten | `applicant_liabilities` | MOD-07 Selbstauskunft |
| **Objektdaten** | `finance_requests` | MOD-07 Anfrage |
| **Kostenaufstellung** | `finance_requests` | MOD-07 Anfrage |
| **Finanzierungsplan** | `finance_requests` | MOD-07 Anfrage |
| Bank-Einreichung | `future_room_cases` | MOD-11 |

---

## MOD-07: Selbstauskunft (9 Sektionen)

Basierend auf PDF-Vorlage `selbstauskunft.pdf`:

### Sektion 1: Angaben zur Person

| Feld | DB-Spalte | Pflicht |
|------|-----------|---------|
| Anrede | `salutation` | ✓ |
| Vorname | `first_name` | ✓ |
| Nachname | `last_name` | ✓ |
| Geburtsname | `birth_name` | |
| Geburtsdatum | `birth_date` | ✓ |
| Geburtsort | `birth_place` | |
| Geburtsland | `birth_country` | |
| Staatsangehörigkeit | `nationality` | ✓ |
| Straße, Nr. | `address_street` | ✓ |
| PLZ | `address_postal_code` | ✓ |
| Ort | `address_city` | ✓ |
| Wohnhaft seit | `address_since` | |
| Vorherige Adresse | `previous_address_*` | |
| Telefon | `phone`, `phone_mobile` | ✓ |
| E-Mail | `email` | ✓ |
| Steuer-IdNr | `tax_id` | |

**Besonderheit:** Antragsteller 1 + optional Antragsteller 2 (Tabs)

### Sektion 2: Haushalt

| Feld | DB-Spalte |
|------|-----------|
| Familienstand | `marital_status` |
| Gütertrennung | `property_separation` |
| Anzahl Kinder | `children_count` |
| Geburtsdaten Kinder | `children_birth_dates` |

### Sektion 3: Beschäftigung

**Switch:** "Angestellt" ↔ "Selbstständig"

**Bei Angestellt:**
| Feld | DB-Spalte |
|------|-----------|
| Arbeitgeber | `employer_name` |
| Beschäftigt seit | `employed_since` |
| Vertragsart | `contract_type` |
| Probezeit bis | `probation_until` |
| Gehalt netto | `net_income_monthly` |
| Zahlungen/Jahr | `salary_payments_per_year` |

**Bei Selbstständig:**
| Feld | DB-Spalte |
|------|-----------|
| Firma | `company_name` |
| Branche | `industry` |
| Selbstständig seit | `self_employed_since` |
| Umsatz | `annual_revenue` |
| Gewinn | `annual_profit` |

### Sektion 4: Bankverbindung

| Feld | DB-Spalte |
|------|-----------|
| IBAN | `iban` |
| BIC | `bic` |

### Sektion 5: Monatliche Einnahmen

| Feld | DB-Spalte |
|------|-----------|
| Nettoeinkommen | `net_income_monthly` |
| Nebentätigkeit | `side_job_income_monthly` |
| Mieteinnahmen | `rental_income_monthly` |
| Kindergeld | `child_benefit_monthly` |
| Unterhalt | `alimony_income_monthly` |
| Rente (gesetzlich) | `pension_state_monthly` |
| Rente (privat) | `pension_private_monthly` |
| Sonstiges | `other_income_monthly` |

**Vorausfüllung:** Mieteinnahmen aus MOD-04 `landlord_contexts`

### Sektion 6: Monatliche Ausgaben

| Feld | DB-Spalte |
|------|-----------|
| Aktuelle Warmmiete | `current_rent_monthly` |
| Private Krankenversicherung | `health_insurance_monthly` |
| Unterhaltsverpflichtungen | `child_support_amount_monthly` |
| Leasing | `car_leasing_monthly` |

### Sektion 7: Vermögen

| Feld | DB-Spalte | Quelle |
|------|-----------|--------|
| Bank-/Sparguthaben | `bank_savings` | Manuell |
| Wertpapiere | `securities_value` | Manuell |
| Bausparguthaben | `building_society_value` | Manuell |
| Lebensversicherung | `life_insurance_value` | Manuell |
| **Immobilienvermögen** | — | **MOD-04 (read-only)** |

**MOD-04 Integration:** Kapitalanlagen aus Portfolio werden als read-only Vermögenswerte angezeigt.

### Sektion 8: Verbindlichkeiten

**Tabelle:** `applicant_liabilities` (1:N)

| Feld | DB-Spalte |
|------|-----------|
| Art | `liability_type` |
| Gläubiger | `creditor_name` |
| Ursprungsbetrag | `original_amount` |
| Restschuld | `remaining_balance` |
| Monatsrate | `monthly_rate` |
| Zinsbindung bis | `interest_rate_fixed_until` |
| Ende | `end_date` |

**Typen:**
- `immobiliendarlehen` — Immobiliendarlehen
- `ratenkredit` — Ratenkredit
- `leasing` — Leasing
- `sonstige` — Sonstige

### Sektion 9: Erklärungen

| Feld | DB-Spalte |
|------|-----------|
| SCHUFA-Einwilligung | `schufa_consent` |
| Insolvenzverfahren | `bankruptcy_declaration` |
| Steuerrückstände | `tax_arrears_declaration` |
| Datenrichtigkeit | `data_accuracy_declaration` |

---

## MOD-07: Anfrage (4 Sektionen)

Basierend auf PDF-Vorlage `selbstauskunft_immo.pdf`:

### Sektion A: Vorhaben

| Feld | DB-Spalte | Werte |
|------|-----------|-------|
| Zweck | `purpose` | `kauf`, `neubau`, `umschuldung`, `modernisierung` |

### Sektion B: Informationen zur Immobilie

| Feld | DB-Spalte |
|------|-----------|
| Adresse | `object_address` |
| Art | `object_type` |
| Baujahr | `object_construction_year` |
| Wohnfläche | `object_living_area_sqm` |
| Grundstück | `object_land_area_sqm` |
| Ausstattung | `object_equipment_level` |
| Wohnlage | `object_location_quality` |

**Vorausfüllung:** Button "Objekt aus Portfolio" → lädt Property-Daten aus MOD-04

### Sektion C: Kostenzusammenstellung

| Feld | DB-Spalte |
|------|-----------|
| Kaufpreis | `purchase_price` |
| Modernisierung | `modernization_costs` |
| Notar/Gericht | `notary_costs` |
| Grunderwerbsteuer | `transfer_tax` |
| Makler | `broker_fee` |

**Berechnung:** Gesamtkosten = Summe aller Kosten

### Sektion D: Finanzierungsplan

| Feld | DB-Spalte |
|------|-----------|
| Eigenkapital | `equity_amount` |
| Darlehensbetrag | `loan_amount_requested` |
| Zinsbindung | `fixed_rate_period_years` |
| Tilgung | `repayment_rate_percent` |
| Max. Monatsrate | `max_monthly_rate` |

---

## Status-Flow

```
┌──────────┐    ┌───────────┐    ┌─────────────┐    ┌──────────┐    ┌───────────┐
│  draft   │───►│ complete  │───►│  submitted  │───►│ assigned │───►│ in_review │
└──────────┘    └───────────┘    └─────────────┘    └──────────┘    └───────────┘
                                        │                                  │
                                        │                                  ▼
                                        │                          ┌───────────────┐
                                        │                          │ bank_submitted │
                                        │                          └───────────────┘
                                        │                                  │
                                        ▼                                  ▼
                                 ┌───────────┐                     ┌───────────┐
                                 │  rejected │                     │  approved │
                                 └───────────┘                     └───────────┘
```

| Status | Zone | Beschreibung |
|--------|------|--------------|
| `draft` | MOD-07 | In Bearbeitung durch Kunden |
| `complete` | MOD-07 | Alle Pflichtfelder ausgefüllt |
| `submitted` | Zone 1 | An FutureRoom übermittelt |
| `assigned` | Zone 1 | Manager zugewiesen |
| `in_review` | MOD-11 | Manager prüft Unterlagen |
| `bank_submitted` | MOD-11 | An Bank übermittelt |
| `approved` | MOD-11 | Bank hat genehmigt |
| `rejected` | Zone 1/MOD-11 | Abgelehnt |

---

## API-Bereiche

### MOD-07: API-600..629

Nur Datenerfassung — siehe `API_NUMBERING_CATALOG.md`

### MOD-11: API-1100..1130

Bank-Übergabe via E-Mail oder Europace — siehe `API_NUMBERING_CATALOG.md`

---

## Vorausfüllung aus MOD-04

### Selbstauskunft: Vermietereinheit

```typescript
const prefillFromContext = (context: LandlordContext, member: ContextMember) => ({
  first_name: member.first_name,
  last_name: member.last_name,
  birth_date: member.birth_date,
  address_street: `${member.street} ${member.house_number}`,
  address_postal_code: member.postal_code,
  address_city: member.city,
  rental_income_monthly: context.total_rental_income_monthly,
});
```

### Anfrage: Objekt aus Portfolio

```typescript
const prefillFromProperty = (property: Property) => ({
  object_address: `${property.address}, ${property.postal_code} ${property.city}`,
  object_type: property.property_type,
  object_construction_year: property.construction_year,
  object_living_area_sqm: property.total_area_sqm,
  purchase_price: property.purchase_price,
});
```

---

## Verifizierungsprotokoll

| # | Route | Erwartung | ✓ |
|---|-------|-----------|---|
| 1 | `/portal/finanzierung` | "How It Works" erscheint | |
| 2 | Klick "Selbstauskunft" | 9 Sektionen sichtbar | |
| 3 | Antragsteller-Tabs | Tab 1 + Tab 2 (optional) | |
| 4 | Beschäftigung Switch | Angestellt ↔ Selbstständig | |
| 5 | Vorausfüllung MOD-04 | Button funktioniert | |
| 6 | Verbindlichkeiten | 1:N Tabelle editierbar | |
| 7 | Vermögen | MOD-04 Immobilien read-only | |
| 8 | `/portal/finanzierung/anfrage` | 4 Sektionen sichtbar | |
| 9 | Objekt aus Portfolio | Vorausfüllung funktioniert | |
| 10 | Einreichung | Status → `submitted` | |
| 11 | `/admin/futureroom/inbox` | Anfrage erscheint | |
| 12 | Zuweisung | Status → `assigned` | |
| 13 | `/portal/finanzierungsmanager` | Fall erscheint | |

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-02-06 | Initial — Golden Path definiert, API-Trennung MOD-07/MOD-11 |
