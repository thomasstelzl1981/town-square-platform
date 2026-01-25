# MOD-04 — Field Mapping (Spec ↔ DB)

> **Version**: 1.0  
> **Datum**: 2026-01-25  
> **Zweck**: Mapping zwischen Spec-Feldnamen (DE) und DB-Spaltennamen (EN)

---

## 1. Immobilienliste — 13 Spalten

| # | Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|---|----------------|----------------|--------|--------|
| 1 | ID | `code` | `properties.code` | ✅ Existiert |
| 2 | Art | `property_type` | `properties.property_type` | ✅ Existiert |
| 3 | Ort | `city` | `properties.city` | ✅ Existiert |
| 4 | Straße / Hausnummer | `address` | `properties.address` | ✅ Existiert |
| 5 | Größe | `total_area_sqm` | `properties.total_area_sqm` | ✅ Existiert |
| 6 | Nutzung | `usage_type` | `properties.usage_type` | ✅ Existiert |
| 7 | Einnahmen | `annual_income` | `properties.annual_income` | ✅ Existiert |
| 8 | Verkehrswert | `market_value` | `properties.market_value` | ✅ Existiert |
| 9 | Restschuld | `current_balance` | `property_financing.current_balance` | ✅ Existiert |
| 10 | Rate | `monthly_rate` | `property_financing.monthly_rate` | ✅ Existiert |
| 11 | Warmmiete | `current_monthly_rent` | `units.current_monthly_rent` (aggregiert) | ✅ Existiert |
| 12 | NK-Vorauszahlung | `utility_prepayment` | `properties.utility_prepayment` | ⚠️ **NEU** |
| 13 | Hausgeld | `management_fee` | `properties.management_fee` | ✅ Existiert |

---

## 2. Exposé — Stammdaten

| Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|----------------|----------------|--------|--------|
| Code | `code` | `properties` | ✅ Existiert |
| Art | `property_type` | `properties` | ✅ Existiert |
| Postleitzahl | `postal_code` | `properties` | ✅ Existiert |
| Ort | `city` | `properties` | ✅ Existiert |
| Straße / Hausnummer | `address` | `properties` | ✅ Existiert |
| BJ (Baujahr) | `year_built` | `properties` | ✅ Existiert |
| Sanierungsjahr | `renovation_year` | `properties` | ✅ Existiert |
| Größe | `total_area_sqm` | `properties` | ✅ Existiert |
| Nutzung | `usage_type` | `properties` | ✅ Existiert |
| Beschreibung | `description` | `properties` | ✅ Existiert |

---

## 3. Exposé — Grundbuch

| Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|----------------|----------------|--------|--------|
| Grundbuch von | `land_register_court` | `properties` | ✅ Existiert |
| Grundbuchblatt | `land_register_sheet` | `properties` | ✅ Existiert |
| Band | `land_register_volume` | `properties` | ✅ Existiert |
| Flurstück | `parcel_number` | `properties` | ✅ Existiert |
| TE-Nummer | `unit_ownership_nr` | `properties` | ✅ Existiert |

---

## 4. Exposé — Transaktion

| Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|----------------|----------------|--------|--------|
| Notartermin | `notary_date` | `properties` | ✅ Existiert |
| BNL (Besitzübergang) | `bnl_date` | `properties` | ✅ Existiert |
| Kaufpreis | `purchase_price` | `properties` | ✅ Existiert |

---

## 5. Exposé — Finanzierung

| Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|----------------|----------------|--------|--------|
| Darlehensnr. | `loan_number` | `property_financing` | ✅ Existiert |
| Urspr. Darlehen | `original_amount` | `property_financing` | ✅ Existiert |
| Restschuld | `current_balance` | `property_financing` | ✅ Existiert |
| Zins | `interest_rate` | `property_financing` | ✅ Existiert |
| Zinsbindung | `fixed_until` | `property_financing` | ✅ Existiert |
| Bank | `bank_name` | `property_financing` | ✅ Existiert |
| Rate | `monthly_rate` | `property_financing` | ✅ Existiert |
| Zinsbelastung ca. | `annual_interest` | `property_financing` | ✅ Existiert |

---

## 6. Exposé — Ertrag/Miete

| Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|----------------|----------------|--------|--------|
| Einnahmen | `annual_income` | `properties` | ✅ Existiert |
| Warmmiete | `current_monthly_rent` | `units` (aggregiert) | ✅ Existiert |
| NK-Vorauszahlung | `utility_prepayment` | `properties` | ⚠️ **NEU** |
| Hausgeld | `management_fee` | `properties` | ✅ Existiert |

### Mieter-Daten (via Lease + Contact)

| Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|----------------|----------------|--------|--------|
| Mieter | `first_name`, `last_name` | `contacts` via `leases.tenant_contact_id` | ✅ Existiert |
| Mieter seit | `tenant_since` | `leases` | ✅ Existiert |
| Mieterhöhung | `rent_increase` | `leases` | ✅ Existiert |

---

## 7. Exposé — Energie/Heizung

| Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|----------------|----------------|--------|--------|
| Energieträger | `energy_source` | `properties` | ✅ Existiert |
| Heizart | `heating_type` | `properties` | ✅ Existiert |

---

## 8. Exposé — Flags

| Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|----------------|----------------|--------|--------|
| Verkauf aktiviert | `sale_enabled` | `properties` | ⚠️ **NEU** (via `property_features`) |
| MSV aktiviert | `rental_managed` | `properties` | ⚠️ **NEU** (via `property_features`) |
| Öffentlich gelistet | `is_public_listing` | `properties` | ✅ Existiert |

**Hinweis:** Die Flags können entweder direkt auf `properties` als Spalten oder über die existierende `property_features`-Tabelle mit `feature_code` implementiert werden.

---

## 9. Einheiten (Units)

| Spec-Feld (DE) | DB-Spalte (EN) | Quelle | Status |
|----------------|----------------|--------|--------|
| Bezeichnung | `unit_number` | `units` | ✅ Existiert |
| Etage | `floor` | `units` | ✅ Existiert |
| Zimmer | `rooms` | `units` | ✅ Existiert |
| Größe | `area_sqm` | `units` | ✅ Existiert |
| Nutzung | `usage_type` | `units` | ✅ Existiert |
| Warmmiete | `current_monthly_rent` | `units` | ✅ Existiert |
| Nebenkosten | `ancillary_costs` | `units` | ✅ Existiert |

---

## 10. Fehlende DB-Spalten (Migration erforderlich)

### properties-Tabelle

| Spalte | Typ | Beschreibung | Priorität |
|--------|-----|--------------|-----------|
| `utility_prepayment` | `numeric` | NK-Vorauszahlung | Phase 1 |

### Flags-Implementierung (Entscheidung offen: Q4.13)

**Option A:** Direkte Spalten auf `properties`
```sql
ALTER TABLE properties ADD COLUMN sale_enabled boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN rental_managed boolean DEFAULT false;
```

**Option B:** Via `property_features` (existiert bereits)
```sql
-- feature_code = 'sale_enabled' oder 'msv_enabled'
-- Abfrage über JOIN
```

---

## 11. Computed Fields

| Feld | Formel | Beschreibung |
|------|--------|--------------|
| Warmmiete (aggregiert) | `SUM(units.current_monthly_rent)` | Summe aller Einheiten-Mieten |
| Restschuld (aggregiert) | `SUM(property_financing.current_balance)` | Falls mehrere Darlehen |
| Rate (aggregiert) | `SUM(property_financing.monthly_rate)` | Falls mehrere Darlehen |
| Zinsbelastung ca. | `current_balance * interest_rate / 100` | Geschätzte jährliche Zinsbelastung |

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-01-25 | Initial erstellt |
