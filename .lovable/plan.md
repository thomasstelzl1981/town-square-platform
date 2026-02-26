

## Miete24 Autos Upgrade: 6 Legacy → 9 professionelle Eintraege

### Ist-Zustand
- 6 Eintraege mit `shop_key = 'miete24-autos'` (VW ID.3, Cupra Born, Fiat 500e, BMW 320i, Mercedes A 250e, Tesla Model 3)
- Keine `metadata`, keine `image_url`, keine `sub_category`, kein `affiliate_tag`
- `sort_order` flach 1–6

### Soll-Zustand (9 Eintraege)

| # | sub_category | badge | Name | sort_order | price_cents |
|---|-------------|-------|------|------------|-------------|
| 1 | SUV | Entry | Opel Frontera Electric | 10 | 25900 |
| 2 | SUV | Mid | MG HS 1.5 T PHEV | 20 | 33900 |
| 3 | SUV | Premium | Mercedes-Benz GLE 450 d 4MATIC | 30 | 85900 |
| 4 | Mittelklasse | Entry | Toyota Corolla Touring Sports 1.8 Hybrid | 110 | 31900 |
| 5 | Mittelklasse | Mid | BYD Seal 6 DM-i Touring | 120 | 27900 |
| 6 | Mittelklasse | Premium | Audi S3 Limousine TFSI quattro | 130 | 54900 |
| 7 | Sport | Entry | Fiat 500C 1.0 Hybrid | 210 | 20900 |
| 8 | Sport | Mid | Audi S3 Limousine (Sport) | 220 | 54900 |
| 9 | Sport | Premium | BMW Z4 M40i | 230 | 68900 |

### Feld-Mapping (User-Input → Schema)

- `title` → `name`
- `price` → `price_label` (vollstaendig mit "inkl. MwSt."), `price_cents` (Monatsrate in Cent)
- `image` → `image_url`
- `link` → `external_url`
- `vendor` → `affiliate_network = 'miete24'`, `affiliate_tag = 'miete24-autos'`
- `tag` → Split in `sub_category` (SUV/Mittelklasse/Sport) und `badge` (Entry/Mid/Premium)
- `badges` → `metadata.badges` Array
- Zusaetzlich: `metadata.fuel`, `metadata.vendor`, `metadata.color` aus Titel extrahiert

### UI-Anpassung: CarsAngebote.tsx

Die aktuelle Miete24-Sektion zeigt ein flaches Grid. Upgrade:

1. **Gruppierung nach `sub_category`** — 3 Sektionen: SUV, Mittelklasse, Sport (jeweils mit Ueberschrift)
2. **Badges aus metadata.badges** anzeigen statt nur fuel/transmission
3. **Bestehende Karten-Struktur beibehalten** — nur Badges und Gruppierung erweitern

### Umsetzungsschritte

| # | Aktion | Detail |
|---|--------|--------|
| 1 | DB: DELETE | `DELETE FROM service_shop_products WHERE shop_key = 'miete24-autos'` (6 Legacy-Rows) |
| 2 | DB: INSERT | 9 neue Rows mit `shop_key = 'miete24-autos'`, Bildern, Metadata |
| 3 | UI: CarsAngebote.tsx | Miete24-Sektion: Gruppierung nach `sub_category`, Badge-Rendering aus metadata |

