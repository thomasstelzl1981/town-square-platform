
# Pet Shop: Widget "Ernaehrung" mit Lakefields-Shop

## Uebersicht

Das erste Widget im PetsShop wird von "Unser Shop" zu **"Ernaehrung"** umbenannt. Beim Klick wird ein Shop-Layout angezeigt, das dem bestehenden Muster aus `ShopTab.tsx` (Amazon, OTTO, Miete24) folgt: Header mit Gradient, Suchleiste, Kategorie-Badges und Produkt-Grid.

## Aenderungen an `src/pages/portal/pets/PetsShop.tsx`

### 1. Widget-Definition umbenennen

```
key: 'shop' → Titel aendern von "Unser Shop" zu "Ernaehrung"
Beschreibung: "Lakefields — Naturbelassenes Hundefutter"
Icon: bleibt Store (oder UtensilsCrossed fuer Ernaehrung)
```

### 2. Bisherigen Katalog-Inhalt ersetzen

Der aktuelle `activeWidget === 'shop'`-Block (der Services aus der DB laedt) wird ersetzt durch ein **statisches Shop-Layout** im ShopTab-Stil:

**Header-Card** (Gradient-Banner):
- Name: "Lakefields"
- Tagline: "Hochwertiges und naturbelassenes Hundefutter"
- Beschreibung: "Nassfutter, Trockenfutter, Snacks und Ergaenzungsfuttermittel — aus nachhaltiger Produktion in Deutschland."
- Gradient: `from-amber-500/20 to-amber-600/5` (warme Farbe passend zur Marke)
- Button "Shop oeffnen" → oeffnet `https://www.lakefields.de/Hundefutter/`

**Suchleiste + Kategorie-Badges:**
- Kategorien: Nassfutter, Trockenfutter, Snacks, Ergaenzungsfuttermittel, Welpenfutter, Best-Seller

**Produkt-Grid** (6 Produkte mit echten Lakefields-Daten):

| Produkt | Preis | Bild-URL (CDN) |
|---|---|---|
| Nassfutter-Menue Wild (400g) | 3,89 EUR | `lakefields.b-cdn.net/.../nassfutter-wild-adult-...` |
| Nassfutter-Menue Rind (400g) | 3,69 EUR | `lakefields.b-cdn.net/.../nassfutter-rind-adult-...` |
| Nassfutter-Menue Lamm (400g) | 3,89 EUR | `lakefields.b-cdn.net/.../nassfutter-lamm-adult-...` |
| Nassfutter-Menue Huhn (400g) | 3,69 EUR | `lakefields.b-cdn.net/.../nassfutter-huhn-adult-...` |
| Nassfutter-Menue Pferd (400g) | 4,29 EUR | `lakefields.b-cdn.net/.../nassfutter-pferd-adult-...` |
| Nassfutter-Menue Rind Welpe (400g) | 3,69 EUR | `lakefields.b-cdn.net/.../nassfutter-rind-welpe-...` |

Jede Produktkarte zeigt:
- Produktbild (aspect-square, object-cover)
- Produktname (line-clamp-2)
- Preis in amber-Akzentfarbe
- Badge "Neu" fuer Pferd-Variante
- Klick oeffnet Produktseite auf lakefields.de in neuem Tab

**Integration-Accordion** (wie bei ShopTab):
- Felder: Partner-ID, API Key
- Status: "Nicht verbunden"

### 3. Bestehenden Booking-Dialog beibehalten

Der Booking-Dialog bleibt im Code (wird von keinem Lakefields-Produkt ausgeloest), falls andere Widgets ihn zukuenftig nutzen.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/pets/PetsShop.tsx` | Widget-Titel aendern, Shop-Inhalt durch Lakefields-Layout ersetzen |

Keine DB-Migration noetig — rein statische UI-Aenderung.
