

## Smart Home Shop Seed (Zone 1)

### Ist-Zustand
6 bestehende Produkte in `service_shop_products` mit `shop_key = 'smart-home'`, alte Kategorisierung (Outdoor/Indoor/Türklingel).

### Soll-Zustand
16 neue Produkte mit neuer Tier-Struktur: Entry (3), Mid (4), Premium (5), Bundles (4).

### Umsetzung

| # | Aktion | Detail |
|---|--------|--------|
| 1 | DELETE alte Produkte | `DELETE FROM service_shop_products WHERE shop_key = 'smart-home'` — entfernt die 6 bestehenden Einträge |
| 2 | INSERT neue Produkte | Die 16 Produkte aus dem bereitgestellten SQL exakt so einfügen (alle Felder inkl. metadata als JSONB) |

### Technisch
- Kein Schema-Change nötig — Tabelle `service_shop_products` hat alle Spalten (inkl. `metadata jsonb`)
- Kein Code-Change nötig — `ShopTab` liest bereits via `useActiveServiceProducts('smart-home')`
- Reine Datenoperation via Insert-Tool (DELETE + INSERT)

