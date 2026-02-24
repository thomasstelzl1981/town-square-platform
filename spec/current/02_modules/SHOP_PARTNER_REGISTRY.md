# Shop & Partner Registry — SSOT

**Version:** 1.0  
**Stand:** 2026-02-24  
**Zuständig:** Zone 1 Service Desk (`/admin/service-desk`)

---

## Übersicht: Alle 17 Shop-Bereiche

| #  | Modul  | Shop                | Partner              | Anbindung    | Netzwerk             | Integration Code | Status        |
|----|--------|---------------------|----------------------|--------------|----------------------|------------------|---------------|
|  1 | MOD-16 | Amazon Business     | Amazon.de            | API          | Amazon PartnerNet    | AMAZON_PAAPI     | pending_setup |
|  2 | MOD-16 | Büroshop24          | Büroshop24.de        | AFFILIATE    | ADCELL               | BUEROSHOP24      | pending_setup |
|  3 | MOD-16 | Miete24 (IT)        | Miete24.com          | API          | Miete24 PartnerHub   | MIETE24          | pending_setup |
|  4 | MOD-16 | Smart Home          | Reolink              | AFFILIATE    | Reolink/FlexOffers   | REOLINK          | pending_setup |
|  5 | MOD-17 | BMW Fokusmodelle    | Helming & Sohn       | SCRAPING     | Direktpartner        | HELMING          | pending_setup |
|  6 | MOD-17 | Miete24 (Autos)     | Miete24.com          | API          | Miete24 PartnerHub   | MIETE24          | pending_setup |
|  7 | MOD-17 | Boote               | Haller Experiences   | SCRAPING     | Direktpartner        | HALLER           | pending_setup |
|  8 | MOD-17 | Privatjet           | NetJets              | SCRAPING     | Direktpartner        | NETJETS          | pending_setup |
|  9 | MOD-15 | Bücher              | Amazon.de            | API          | Amazon PartnerNet    | AMAZON_PAAPI     | pending_setup |
| 10 | MOD-15 | Fortbildungen       | Udemy                | AFFILIATE    | Impact Network       | IMPACT_AFFILIATE | pending_setup |
| 11 | MOD-15 | Vorträge            | Eventbrite           | API          | Eventbrite API       | EVENTBRITE_API   | pending_setup |
| 12 | MOD-15 | Kurse               | Udemy/Coursera       | AFFILIATE    | Impact Network       | IMPACT_AFFILIATE | pending_setup |
| 13 | MOD-19 | Enpal               | Enpal GmbH           | VERMITTLUNG  | ADCELL               | ENPAL            | pending_setup |
| 14 | MOD-05 | Ernährung           | Lakefields           | DIREKT       | Händlervertrag       | LAKEFIELDS       | pending_setup |
| 15 | MOD-05 | Lennox Tracker      | Lennox (Eigenmarke)  | DIREKT       | Eigenprodukt         | —                | intern        |
| 16 | MOD-05 | Lennox Style        | Lennox (Eigenmarke)  | DIREKT       | Eigenprodukt         | —                | intern        |
| 17 | MOD-05 | Fressnapf           | Fressnapf/zooplus    | AFFILIATE    | AWIN                 | —                | offen         |

---

## Anbindungsformen

| Modell       | Beschreibung                                                        | Datenhaltung                       | Bestellung        |
|-------------|---------------------------------------------------------------------|------------------------------------|--------------------|
| **API**      | Produkte automatisch über Partner-API synchronisiert                | `service_shop_products` (API-Sync) | Beim Partner       |
| **AFFILIATE**| Produkte in Zone 1 angelegt, Klick leitet auf Partner-Shop weiter   | `service_shop_products` (manuell)  | Beim Partner       |
| **DIREKT**   | Eigene oder exklusive Partner-Produkte, Bestellung auf Plattform    | `service_shop_products` (manuell)  | Auf der Plattform  |
| **SCRAPING** | Produktdaten per Web Scraping eingeholt, in Zone 1 aufbereitet      | `service_shop_products` (Scraping) | Beim Partner       |
| **VERMITTLUNG** | Lead-Generierung, Nutzer wird an Partner vermittelt              | Kein Produktkatalog                | Lead an Partner    |

---

## Service Shop Config (DB: `service_shop_config`)

| shop_key        | display_name          | affiliate_network   | model      | module |
|----------------|-----------------------|---------------------|------------|--------|
| amazon          | Amazon Business       | amazon-partnernet   | api        | MOD-16 |
| bueroshop24     | Büroshop24            | adcell              | affiliate  | MOD-16 |
| miete24         | Miete24 IT            | miete24-partnerhub  | api        | MOD-16 |
| smart-home      | Reolink Smart Home    | reolink-partner     | affiliate  | MOD-16 |
| bmw-fokus       | BMW Fokusmodelle      | direct-scraping     | scraping   | MOD-17 |
| miete24-autos   | Miete24 Auto-Abos     | miete24-partnerhub  | api        | MOD-17 |
| boote           | Haller Experiences    | direct-scraping     | scraping   | MOD-17 |
| privatjet       | NetJets Fleet         | direct-scraping     | scraping   | MOD-17 |
| pet-ernaehrung  | Lakefields            | direct-haendler     | direct     | MOD-05 |
| pet-tracker     | Lennox Tracker        | internal            | direct     | MOD-05 |
| pet-style       | Lennox Style          | internal            | direct     | MOD-05 |
| pet-fressnapf   | Fressnapf             | awin                | affiliate  | MOD-05 |

---

## Integration Registry Einträge (DB: `integration_registry`)

### Bereits vorhanden

| Code             | Name                         | Status        |
|-----------------|------------------------------|---------------|
| AMAZON_PAAPI     | Amazon Product Advertising API | pending_setup |
| IMPACT_AFFILIATE | Impact Affiliate Network     | pending_setup |
| EVENTBRITE_API   | Eventbrite API               | pending_setup |
| FIRECRAWL        | Firecrawl                    | active        |
| apify            | Apify Scraper                | active        |

### Neu angelegt (2026-02-24)

| Code        | Name                  | auth_type          | Beschreibung                                    |
|------------|----------------------|--------------------|-------------------------------------------------|
| BUEROSHOP24 | Büroshop24           | affiliate_deeplink | Bürobedarf via ADCELL, bis 9% Provision         |
| MIETE24     | Miete24 PartnerHub   | api_key            | IT-Geräte & Auto-Abo API                        |
| REOLINK     | Reolink Partner      | affiliate_deeplink | Smart Home Kameras, 6-20% Provision             |
| HELMING     | Helming und Sohn     | scraping           | BMW Großkunden-Sonderleasing, quartalsweises Scraping |
| HALLER      | Haller Experiences   | scraping           | Yacht Charter Ibiza, saisonweises Scraping      |
| NETJETS     | NetJets              | scraping           | Privatjet Fleet, halbjährliches Scraping        |
| ENPAL       | Enpal GmbH           | affiliate_deeplink | PV Lead-Vermittlung, 50€/Lead, 300€/Abschluss  |
| LAKEFIELDS  | Lakefields           | direct_contract    | Hundefutter Händlervertrag, Direktverkauf       |

---

## MOD-15 Sonderfall: Fortbildung

MOD-15 nutzt NICHT `service_shop_products`, sondern die eigene Tabelle `fortbildung_curated_items` mit eigenem CRUD in `AdminFortbildung.tsx`. Der Service Desk delegiert lediglich an diese bestehende Verwaltung.

## MOD-19 Sonderfall: Enpal

Reine Lead-Vermittlung ohne Produktkatalog. Zone 2 `EnpalTab.tsx` zeigt Informationsseite mit CTA. Provision über ADCELL.

## Offene Entscheidungen

- **Fressnapf vs zooplus:** AWIN-Affiliate, Vertragsentscheidung steht noch aus
- **Reolink:** Direktes Partnerprogramm vs FlexOffers (Provision 6-20% vs 2.4%)
