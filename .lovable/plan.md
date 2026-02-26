

## Boote Shop Seed: 8 alte → 14 neue Produkte (Haller Experiences)

### Ist-Zustand
- 8 generische Boote ohne `metadata`, `image_url`, `affiliate_tag`

### Soll-Zustand
- 14 professionelle Eintraege (11 Yachten + 3 Add-ons) von Haller Experiences
- Vollstaendige Felder: `image_url`, `external_url`, `affiliate_tag`, `affiliate_network`, `badge`, `metadata` (JSONB)
- Klare `sub_category`-Struktur: Entry (10-20), Mid (110-130), Premium (210-260), Add-ons (910-930)

### Umsetzung

| # | Aktion | Detail |
|---|--------|--------|
| 1 | DB: DELETE | `DELETE FROM service_shop_products WHERE shop_key = 'boote'` (8 Rows) |
| 2 | DB: INSERT | 14 Rows gemaess bereitgestelltem SQL |

Keine Code-Aenderungen noetig — `useActiveServiceProducts('boote')` laedt automatisch.

