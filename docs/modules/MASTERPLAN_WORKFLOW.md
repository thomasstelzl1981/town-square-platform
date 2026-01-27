# MASTERPLAN V4.0 - ZENTRALER WORKFLOW

## Executive Summary

Der zentrale Workflow des Systems verbindet alle Module über einen klaren Datenfluss:

```
MOD-04 (Properties) → MOD-03 (DMS) → MOD-06 (Listings) → Zone 3 / MOD-09
```

## Investment-Berechnung (Master-Kreis)

### 7 interaktive Slider

| # | Parameter | Bereich | Default |
|---|-----------|---------|---------|
| 1 | Eigenkapital | 10.000 - 50% des Kaufpreises | 50.000 € |
| 2 | Tilgungsrate | 1% - 5% | 2% |
| 3 | Wertsteigerung p.a. | 0% - 5% | 2% |
| 4 | Mietentwicklung p.a. | 0% - 5% | 1,5% |
| 5 | zvE (zu versteuerndes Einkommen) | 20.000 - 250.000 € | 60.000 € |
| 6 | Kirchensteuer | Ja/Nein + Bundesland | Nein |
| 7 | Splitting/Veranlagung | Einzeln/Verheiratet | Einzeln |

### Visualisierungen

1. **Master-Graph**: 40-Jahres-Projektion mit:
   - Immobilienwert (Fläche)
   - Nettovermögen (Fläche)
   - Restschuld (gestrichelte Linie)

2. **Haushaltsrechnung**: Detaillierte Einnahmen-Ausgaben-Rechnung:
   - + Mieteinnahmen
   - − Darlehensrate (Zins + Tilgung)
   - − Verwaltung
   - + Steuerersparnis
   - = **NETTO-BELASTUNG** (Highlight)

3. **40-Jahres-Detailtabelle**: Collapsible Table mit Jahr-für-Jahr-Breakdown

## Verwendung der Komponenten

| Komponente | Zone 2 | Zone 3 |
|------------|--------|--------|
| `InvestmentSliderPanel` | MOD-04, MOD-06, MOD-09 | Kaufy Exposé |
| `MasterGraph` | MOD-04 Portfolio, MOD-06 Exposé | Kaufy Exposé |
| `Haushaltsrechnung` | MOD-04, MOD-06, MOD-09 Beratung | Kaufy Exposé |
| `InvestmentSearchCard` | MOD-08, MOD-09 | Kaufy Immobilien |
| `DetailTable40Jahre` | MOD-04, MOD-06 | Kaufy Exposé |

## Testdaten-Management

### Excel-Import (Zone 1 Admin)

**Pfad:** `/admin/tiles` → Tab "Testdaten"

**Sheets:**
1. `Properties`: code, property_type, address, city, postal_code, total_area_sqm, construction_year, market_value
2. `Units`: property_code, unit_number, area_sqm, current_monthly_rent, usage_type
3. `Contacts`: first_name, last_name, email, phone, company
4. `Leases`: property_code, unit_number, contact_email, monthly_rent, start_date
5. `Listings`: property_code, title, asking_price, description, commission_rate

### Cascading Delete

Die Funktion `delete_test_batch(batch_id)` löscht in korrekter Reihenfolge:

1. listing_publications
2. listing_partner_terms
3. listings
4. leases
5. document_links
6. documents
7. units
8. storage_nodes
9. contacts
10. properties
11. test_data_registry

## View: v_public_listings

```sql
SELECT 
  l.id AS listing_id,
  l.public_id,
  l.title,
  l.asking_price,
  p.address,
  p.city,
  p.total_area_sqm,
  (SELECT COUNT(*) FROM units WHERE property_id = p.id) AS unit_count,
  (SELECT SUM(current_monthly_rent) FROM units WHERE property_id = p.id) AS monthly_rent_total,
  lp.published_at,
  lpt.partner_commission_rate
FROM listings l
JOIN properties p ON l.property_id = p.id
JOIN listing_publications lp ON l.id = lp.listing_id
LEFT JOIN listing_partner_terms lpt ON l.id = lpt.listing_id
WHERE lp.status = 'published' AND l.status = 'active';
```

## Consent-Gates

| Consent | Zweck | Pflicht für |
|---------|-------|-------------|
| `SALES_MANDATE` | Verkaufsauftrag erteilen | Listing-Erstellung |
| `PARTNER_RELEASE` | Partner-Netzwerk-Freigabe | Partner Publishing |
| `SYSTEM_SUCCESS_FEE_2000` | 2.000€ Erfolgsgebühr | Partner Publishing |

## Publishing-Kanäle

| Kanal | Ziel | Consent erforderlich |
|-------|------|---------------------|
| `kaufy` | Zone 3 Marketplace | SALES_MANDATE |
| `partner_network` | MOD-09 Objektkatalog | PARTNER_RELEASE + SYSTEM_SUCCESS_FEE_2000 |
| `immoscout` | ImmobilienScout24 (API) | SALES_MANDATE |

---

*Dieses Dokument beschreibt den zentralen Workflow des Masterplan v4.0*
