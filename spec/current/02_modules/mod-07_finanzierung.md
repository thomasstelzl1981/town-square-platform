# MOD-07: Finanzierung (Customer Finance Preparation)

**Version:** 2.1.0  
**Zone:** 2 (Portal)  
**Status:** FROZEN  
**Last Updated:** 2026-02-03

---

## Übersicht

MOD-07 ist das Vorbereitungsmodul für Finanzierungsanfragen. Kunden erfassen hier ihre Selbstauskunft, laden Dokumente hoch und reichen die Anfrage ein.

**SoT-Regel:** MOD-07 ist Source of Truth (SoT) **NUR bis zur Einreichung**. Danach übernimmt Zone 1 FutureRoom.

---

## Routes (FROZEN)

| Pfad | Component | Beschreibung |
|------|-----------|--------------|
| `/portal/finanzierung` | Index | Redirect zu `how-it-works` |
| `/portal/finanzierung/selbstauskunft` | SelbstauskunftTab | Selbstauskunft-Formular |
| `/portal/finanzierung/dokumente` | DokumenteTab | Dokument-Upload (DMS-Links) |
| `/portal/finanzierung/anfrage` | AnfrageTab | Objekt-Auswahl + Einreichung |
| `/portal/finanzierung/status` | StatusTab | Status-Übersicht (read-only nach Submit) |
| `/portal/finanzierung/anfrage/:requestId` | AnfrageDetailPage | Detail-Ansicht |

---

## Status-Machine (FROZEN)

```
draft → collecting → ready → submitted → [Zone 1 übernimmt]
```

| Status | Beschreibung | Editierbar? |
|--------|--------------|-------------|
| `draft` | Neu erstellt, keine Daten | ✅ Ja |
| `collecting` | Selbstauskunft in Bearbeitung | ✅ Ja |
| `ready` | Alle Pflichtfelder + Dokumente vorhanden | ✅ Ja |
| `submitted` | An Zone 1 eingereicht | ❌ Nein |
| `assigned` | Manager zugewiesen (von Zone 1) | ❌ Nein |
| `in_processing` | Manager bearbeitet (von MOD-11) | ❌ Nein |
| `needs_customer_action` | Kunde muss nachliefern | ⚠️ Nur Dokumente |
| `completed` | Abgeschlossen | ❌ Nein |
| `rejected` | Abgelehnt | ❌ Nein |

---

## Datenmodell

### finance_requests (Haupt-Container)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primary Key |
| `tenant_id` | UUID | Mandant |
| `public_id` | string | Human-readable ID (FIN-XXXXX) |
| `status` | enum | Status-Machine |
| `object_source` | enum | `mod04_property`, `custom` |
| `property_id` | UUID? | Referenz zu MOD-04 |
| `custom_object_data` | JSON? | Manuell erfasste Objektdaten |
| `storage_folder_id` | UUID? | DMS-Ordner für diese Anfrage |
| `created_by` | UUID | User der den Antrag erstellt hat |
| `submitted_at` | timestamp? | Einreichungszeitpunkt |

### applicant_profiles (Selbstauskunft)

Verknüpft über `finance_request_id`.

---

## Selbstauskunft: Sektionen (FROZEN)

Die Selbstauskunft besteht aus **8 Sektionen** in definierter Reihenfolge:

### 1. Identität (identity)
| Feld | Label | Pflicht | Typ |
|------|-------|---------|-----|
| `first_name` | Vorname | ✅ | string |
| `last_name` | Nachname | ✅ | string |
| `birth_date` | Geburtsdatum | ✅ | date |
| `birth_place` | Geburtsort | ❌ | string |
| `nationality` | Staatsangehörigkeit | ❌ | string |
| `marital_status` | Familienstand | ✅ | enum |
| `address_street` | Straße + Nr. | ✅ | string |
| `address_postal_code` | PLZ | ✅ | string |
| `address_city` | Stadt | ✅ | string |
| `phone` | Telefon | ✅ | string |
| `email` | E-Mail | ✅ | string |
| `id_document_type` | Ausweisart | ✅ | enum (PA/RP) |
| `id_document_number` | Ausweisnummer | ✅ | string |
| `id_document_valid_until` | Gültig bis | ✅ | date |
| `tax_id` | Steuer-ID | ✅ | string |
| `iban` | IBAN | ✅ | string |

### 2. Haushalt (household)
| Feld | Label | Pflicht | Typ |
|------|-------|---------|-----|
| `adults_count` | Erwachsene im Haushalt | ❌ | number |
| `children_count` | Anzahl Kinder | ❌ | number |
| `children_ages` | Alter der Kinder | ❌ | string |
| `child_support_obligation` | Unterhaltspflicht? | ❌ | boolean |
| `child_support_amount_monthly` | Unterhalt mtl. | ❌ | number |
| `child_benefit_monthly` | Kindergeld mtl. | ❌ | number |

### 3. Beschäftigung Privat (employment)
*Nur wenn `profile_type = 'private'`*

| Feld | Label | Pflicht | Typ |
|------|-------|---------|-----|
| `employer_name` | Arbeitgeber | ✅ | string |
| `employer_location` | Standort | ❌ | string |
| `employer_industry` | Branche | ❌ | string |
| `employment_type` | Beschäftigungsart | ✅ | enum |
| `position` | Position | ❌ | string |
| `employed_since` | Beschäftigt seit | ✅ | date |
| `probation_until` | Probezeit bis | ❌ | date |
| `net_income_monthly` | Netto-Einkommen mtl. | ✅ | number |
| `bonus_yearly` | Bonus/Jahr | ❌ | number |

### 4. Unternehmer-Erweiterung (entrepreneur)
*Nur wenn `profile_type = 'entrepreneur'`*

| Feld | Label | Pflicht | Typ |
|------|-------|---------|-----|
| `company_name` | Firmenname | ✅ | string |
| `company_legal_form` | Rechtsform | ✅ | string |
| `company_address` | Firmenadresse | ❌ | string |
| `company_founded` | Gründung | ✅ | date |
| `company_register_number` | Handelsregister | ❌ | string |
| `company_vat_id` | USt-ID | ❌ | string |
| `company_industry` | Branche | ❌ | string |
| `company_employees` | Mitarbeiterzahl | ❌ | number |
| `company_ownership_percent` | Anteil % | ❌ | number |
| `company_managing_director` | Geschäftsführer? | ❌ | boolean |

### 5. Einkommen & Ausgaben (income_expenses)
| Feld | Label | Pflicht | Typ |
|------|-------|---------|-----|
| `other_regular_income_monthly` | Sonstiges Einkommen | ❌ | number |
| `other_income_description` | Beschreibung | ❌ | string |
| `current_rent_monthly` | Aktuelle Miete | ❌ | number |
| `living_expenses_monthly` | Lebenshaltung | ❌ | number |
| `car_leasing_monthly` | KFZ-Leasing | ❌ | number |
| `health_insurance_monthly` | Krankenversicherung | ❌ | number |
| `other_fixed_costs_monthly` | Sonstige Fixkosten | ❌ | number |

### 6. Vermögen (assets)
| Feld | Label | Pflicht | Typ |
|------|-------|---------|-----|
| `bank_savings` | Bankguthaben | ❌ | number |
| `securities_value` | Wertpapiere | ❌ | number |
| `building_society_value` | Bausparverträge | ❌ | number |
| `life_insurance_value` | Lebensversicherungen | ❌ | number |
| `other_assets_value` | Sonstiges Vermögen | ❌ | number |
| `other_assets_description` | Beschreibung | ❌ | string |

### 7. Finanzierungswunsch (financing_wish)
| Feld | Label | Pflicht | Typ |
|------|-------|---------|-----|
| `purpose` | Verwendungszweck | ✅ | enum |
| `object_address` | Objektadresse | ❌ | string |
| `object_type` | Objektart | ❌ | string |
| `purchase_price` | Kaufpreis | ✅ | number |
| `ancillary_costs` | Nebenkosten | ❌ | number |
| `modernization_costs` | Modernisierung | ❌ | number |
| `planned_rent_monthly` | Geplante Miete | ❌ | number |
| `rental_status` | Vermietungsstatus | ❌ | enum |
| `equity_amount` | Eigenkapital | ✅ | number |
| `equity_source` | EK-Herkunft | ❌ | string |
| `loan_amount_requested` | Darlehenssumme | ✅ | number |
| `fixed_rate_period_years` | Zinsbindung (Jahre) | ❌ | number |
| `repayment_rate_percent` | Tilgung % | ❌ | number |
| `max_monthly_rate` | Max. Rate | ❌ | number |

### 8. Erklärungen (declarations)
| Feld | Label | Pflicht | Typ |
|------|-------|---------|-----|
| `schufa_consent` | SCHUFA-Einwilligung | ✅ | boolean |
| `no_insolvency` | Keine Insolvenz | ✅ | boolean |
| `no_tax_arrears` | Keine Steuerrückstände | ✅ | boolean |
| `data_correct_confirmed` | Daten korrekt | ✅ | boolean |

---

## Dokument-Kategorien (FROZEN)

4 Kategorien mit definierten Upload-Targets:

### 1. Identität (identity) - Pflicht
- Personalausweis (Vorder- + Rückseite)
- Meldebescheinigung

### 2. Einkommen (income) - Pflicht
- Gehaltsabrechnung 1 (aktuell)
- Gehaltsabrechnung 2
- Gehaltsabrechnung 3
- Arbeitsvertrag

*Bei Unternehmern zusätzlich:*
- BWA (letztes Jahr)
- Steuerbescheid
- Gesellschaftsvertrag

### 3. Vermögen (assets) - Optional
- Kontoauszug (Eigenkapitalnachweis)
- Depotauszug
- Bausparvertrag

### 4. Objektunterlagen (property) - Pflicht
- Exposé
- Grundbuchauszug
- Energieausweis
- Grundrisse

---

## DMS Storage-Tree (FROZEN)

Für jeden Kunden/Tenant wird folgende Ordnerstruktur angelegt:

```
/finanzierung/
  └── applicant_{tenant_id}/
      ├── 01_Identitaet/
      │   ├── Personalausweis
      │   └── Meldebescheinigung
      ├── 02_Einkommen/
      │   ├── Gehaltsabrechnungen
      │   ├── Arbeitsvertrag
      │   └── (BWA, Steuerbescheid bei Unternehmern)
      ├── 03_Vermoegen/
      │   ├── Kontoauszuege
      │   └── Depotauszuege
      └── 04_Objekt/
          ├── Expose
          ├── Grundbuch
          └── Energieausweis

/finanzierung/requests/{request_id}/
  └── (Anfrage-spezifische Unterlagen)
```

### Storage-Node Seeding

Bei Erstellen einer Finanzierungsanfrage:
1. Prüfe ob `/finanzierung/applicant_{tenant_id}/` existiert
2. Wenn nicht: Erstelle mit Template `FINANCE_APPLICANT_V1`
3. Erstelle `/finanzierung/requests/{request_id}/`
4. Setze `finance_requests.storage_folder_id`

---

## Integration

### MOD-03 (DMS)
- Dokumente werden über DMS verwaltet
- MOD-07 zeigt nur Referenzen (`document_links`)
- Kein eigener Blob-Storage

### MOD-04 (Immobilien)
- Objekt-Daten können aus Portfolio übernommen werden
- `object_source = 'mod04_property'` + `property_id`

### Zone 1 (FutureRoom)
- Bei Submit: `finance_mandates` Eintrag erstellt
- Status wird zu `submitted`
- SoT wechselt zu Zone 1

---

## Events & Audit

| Event | Trigger | Payload |
|-------|---------|---------|
| `finance_request.created` | Neue Anfrage | `{request_id}` |
| `applicant_profile.updated` | Selbstauskunft gespeichert | `{profile_id, section}` |
| `document.linked` | Dokument hochgeladen | `{doc_id, category}` |
| `finance_request.submitted` | Einreichung | `{request_id, mandate_id}` |

---

## Acceptance Criteria

- [x] Selbstauskunft Sektionen definiert (8 Sektionen)
- [x] Dokument-Kategorien definiert (4 Kategorien)
- [x] Storage-Tree Struktur dokumentiert
- [x] Status-Machine harmonisiert
- [ ] Selbstauskunft kann gespeichert werden (UI)
- [ ] Dokumente können hochgeladen werden (DMS-Integration)
- [ ] Einreichung sperrt Bearbeitung
- [ ] Status wird nach Einreichung von Zone 1 gespiegelt
