

## BMW Fokusmodelle Seed: 7 alte → 7 neue Produkte (Upgrade)

### Ist-Zustand
- 7 Eintraege fuer `shop_key = 'bmw-fokus'` vorhanden
- Keine `sub_category`, kein `metadata`, keine `image_url`, keine `affiliate_tag`/`affiliate_network`
- `sort_order` ist 1-7 (flach, ohne Kategorie-Logik)

### Soll-Zustand
- 7 professionelle Eintraege (3 MINI Entry + 2 BMW Mid + 1 BMW Premium + 1 MINI Premium)
- Vollstaendige Felder: `image_url`, `external_url`, `affiliate_tag = 'bmw-fokus'`, `affiliate_network = 'partner-offer'`
- Klare `sub_category`-Struktur: MINI (Entry 10-30), BMW (Mid 110-120), BMW/MINI (Premium 210-220)
- Detailliertes `metadata` JSONB (Leistung, Kraftstoff, Laufzeit, km/Jahr, UPE, Leasinggeber, Gueltigkeitszeitraum)
- Korrekte `badge`-Zuordnung: Entry / Standard / Premium

### SQL-Pruefung

Das bereitgestellte SQL ist vollstaendig kompatibel mit dem `service_shop_products`-Schema:
- Alle 15 Spalten sind korrekt befuellt
- `price_cents` enthaelt Monatsrate in Cent (korrekt)
- `metadata` ist valides JSON mit konsistenter Struktur
- `shop_key = 'bmw-fokus'` passt zum bestehenden SubTab in `ServiceDeskFahrzeuge`

### Umsetzung

| # | Aktion | Detail |
|---|--------|--------|
| 1 | DB: DELETE | `DELETE FROM service_shop_products WHERE shop_key = 'bmw-fokus'` (7 Rows) |
| 2 | DB: INSERT | 7 Rows gemaess bereitgestelltem SQL mit vollstaendigen Feldern |

Keine Code-Aenderungen noetig — `useActiveServiceProducts('bmw-fokus')` laedt automatisch.

