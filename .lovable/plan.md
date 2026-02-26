

## Pet-Shop Ernährung: Katalog-Upgrade (6 → 13 Produkte)

### Ist-Zustand
- 6 einfache Nassfutter-Einträge mit zufälligen UUIDs, ohne `metadata`, ohne `image_url`, ohne `affiliate_tag`
- Keine Kategorie-Vielfalt (nur Nassfutter Hund)

### Soll-Zustand
- 13 professionelle Lakefields-Produkte (Trockenfutter, Nassfutter, Snacks, Katzenfutter, Bundles)
- Vollständige Felder: `image_url`, `external_url`, `affiliate_tag`, `affiliate_network`, `badge`, `metadata` (JSONB)
- Saubere `sub_category`-Struktur und `sort_order`-Blöcke (1xx Entry, 2xx Mid, 3xx Premium, 4xx Katze, 5xx Bundles)

### Umsetzung

| # | Aktion | Detail |
|---|--------|--------|
| 1 | DB: DELETE alte Produkte | `DELETE FROM service_shop_products WHERE shop_key = 'pet-ernaehrung'` (6 Rows) |
| 2 | DB: INSERT neue Produkte | 13 Rows mit vollständigem Datensatz gemäß dem bereitgestellten SQL |

Keine Code-Änderungen nötig — die Zone-2 Komponente `ProductGrid` lädt bereits über `useActiveServiceProducts('pet-ernaehrung')` und rendert alle Felder (Badge, Bild, Preis, Link, Metadata).

