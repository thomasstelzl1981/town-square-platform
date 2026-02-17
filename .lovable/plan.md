

## Shop SSOT: Zone 1 als Produktquelle, Zone 2 + Zone 3 als Konsumenten

### Ueberblick

Alle Produkte werden kuenftig in einer zentralen DB-Tabelle `pet_shop_products` verwaltet (Zone 1 PetDeskShop). Die hardcodierten Produkt-Arrays in `PetsShop.tsx` (Zone 2) werden entfernt und durch DB-Queries ersetzt. Zone 3 (LennoxShop) liest dieselbe Tabelle.

**Wichtig:** Die LennoxStyle-Produkte (12 Stueck) werden komplett geloescht — neue Produkte werden spaeter manuell in Zone 1 angelegt. Ernaehrung (Lakefields) und Fressnapf bleiben als Daten erhalten, werden aber ebenfalls in die DB verschoben. Der LennoxTracker bleibt hardcoded (Produktinfo, kein Shop-Artikel).

### Schritt 1: DB-Migration — `pet_shop_products` Tabelle

Neue Tabelle mit RLS (platform_admin schreibt, authenticated liest):

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| category | text NOT NULL | `ernaehrung`, `lennox_tracker`, `lennox_style`, `fressnapf` |
| name | text NOT NULL | Produktname |
| description | text | Kurzbeschreibung |
| price_label | text | Anzeige-String ("3,89 EUR") |
| price_cents | integer | Maschinenlesbarer Preis |
| image_url | text | Produktbild-URL |
| external_url | text | Affiliate/Shop-Link |
| badge | text | "Neu", "Beliebt", "Exklusiv" |
| sub_category | text | "Nassfutter", "Leinen & Geschirr" etc. |
| sort_order | integer DEFAULT 0 | Sortierung |
| is_active | boolean DEFAULT true | Aktiv/Inaktiv |
| created_at / updated_at | timestamptz | Timestamps |

RLS-Policies:
- SELECT: alle authentifizierten Nutzer
- INSERT/UPDATE/DELETE: nur `is_platform_admin(auth.uid())`

### Schritt 2: Hook — `usePetShopProducts.ts`

Zentraler Hook fuer alle drei Zonen:
- `usePetShopProducts(category?)` — Lesen (mit optionalem Kategorie-Filter)
- `useCreateShopProduct()` — Mutation fuer Z1
- `useUpdateShopProduct()` — Mutation fuer Z1
- `useDeleteShopProduct()` — Mutation fuer Z1

### Schritt 3: Zone 1 — `PetDeskShop.tsx` Rewrite

Vom Platzhalter zur vollen CRUD-Oberflaeche:
- 4 Kategorie-Tabs: Ernaehrung, LennoxTracker, LennoxStyle, Fressnapf
- Produktliste pro Tab mit Name, Preis, Badge, Status
- "Produkt anlegen"-Dialog (Name, Beschreibung, Preis, Bild-URL, externer Link, Badge, Sub-Kategorie)
- Inline-Bearbeitung und Loeschen
- Aktiv/Inaktiv-Toggle

### Schritt 4: Zone 2 — `PetsShop.tsx` Umbau

Aenderungen:
- `LAKEFIELDS_PRODUCTS` Array **entfernen** → DB-Query `category = 'ernaehrung'`
- `LENNOX_STYLE_PRODUCTS` Array **entfernen** → DB-Query `category = 'lennox_style'`
- `FRESSNAPF_PRODUCTS` Array **entfernen** → DB-Query `category = 'fressnapf'`
- LennoxTracker-Sektion **bleibt hardcoded** (ist Produktinfo/Feature-Seite, keine Shop-Artikel)
- Widget-Navigation (4 Kacheln) bleibt unveraendert
- Produkt-Grid rendert generisch aus DB-Daten (image_url, name, price_label, external_url, badge)
- Wenn keine Produkte in einer Kategorie: Hinweis "Produkte werden in Kuerze hinzugefuegt"

### Schritt 5: Zone 3 — `LennoxShop.tsx` Update

- Platzhalter-Kategorien durch DB-Query ersetzen
- Nur `is_active = true` anzeigen
- Kategorien: Ernaehrung + LennoxStyle (eigene), Fressnapf (Affiliate)
- LennoxTracker als eigene Sektion (hardcoded Feature-Teaser, kein DB-Produkt)

### Schritt 6: Seed-Daten (Lakefields + Fressnapf)

Die bestehenden Lakefields-Produkte (6 Stueck) und Fressnapf-Produkte (10 Stueck) werden als INSERT-Migration in `pet_shop_products` uebernommen. **LennoxStyle wird NICHT geseeded** — leere Kategorie, wird spaeter manuell befuellt.

### Dateien-Uebersicht

| Datei | Aktion |
|-------|--------|
| DB Migration | NEU — `pet_shop_products` + RLS + Seed (Lakefields + Fressnapf) |
| `src/hooks/usePetShopProducts.ts` | NEU — CRUD Hook |
| `src/pages/admin/petmanager/PetDeskShop.tsx` | REWRITE — Z1 Produktverwaltung mit 4 Tabs + CRUD |
| `src/pages/portal/pets/PetsShop.tsx` | EDIT — Hardcoded-Arrays entfernen, DB-Query nutzen |
| `src/pages/zone3/lennox/LennoxShop.tsx` | EDIT — Produkte aus DB laden |

