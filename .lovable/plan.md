
# Produkt-Seed und Produktakte — Vollstaendige Umsetzung

## Ausgangslage

- **service_shop_products**: LEER (0 Eintraege)
- **pet_shop_products**: 28 Produkte (6 Ernaehrung, 6 Fressnapf, 16 Lennox Style) — muessen migriert werden
- **Zone 2 Komponenten**: Bereits auf `useActiveServiceProducts()` umgestellt — zeigen aktuell leere Zustaende
- **service_shop_config**: 12 Eintraege korrekt vorhanden

## Teil 1: Produktakte (Metadata-Schema pro Shop)

Jeder Shop hat unterschiedliche Felder (BMW braucht `power`, `fuel`, `configLink`; Boote brauchen `length`, `guests`, `highlights`). Aktuell landen diese unstrukturiert im `metadata` JSONB-Feld.

**Loesung:** Ein `metadata_schema` Feld in `service_shop_config` definiert pro Shop-Key, welche Zusatzfelder erwartet werden. Das ist die "Produktakte" — eine Vorlage, die dem Zone-1-Benutzer zeigt, welche Felder er ausfuellen muss.

### Migration: metadata_schema zu service_shop_config hinzufuegen

```sql
ALTER TABLE service_shop_config ADD COLUMN metadata_schema JSONB;
```

Dann pro Shop-Key das Schema befuellen, z.B.:

| shop_key | metadata_schema (Felder) |
|----------|------------------------|
| `amazon` | `[]` (Standard-Felder reichen) |
| `bueroshop24` | `[]` |
| `miete24` | `[{key: "term", label: "Laufzeit", type: "text"}, {key: "monthly_rate", label: "Monatsrate", type: "text"}]` |
| `smart-home` | `[{key: "resolution", label: "Aufloesung", type: "text"}, {key: "connectivity", label: "Konnektivitaet", type: "text"}]` |
| `bmw-fokus` | `[{key: "brand", label: "Marke", type: "select", options: ["BMW","MINI"]}, {key: "code", label: "Modellcode", type: "text"}, {key: "power", label: "Leistung", type: "text"}, {key: "fuel", label: "Antrieb", type: "select", options: ["Benzin","Diesel","Elektro","Hybrid"]}, {key: "term", label: "Laufzeit", type: "text"}, {key: "kmPerYear", label: "KM/Jahr", type: "text"}, {key: "upe", label: "UPE", type: "text"}, {key: "configLink", label: "Konfigurator-Link", type: "url"}]` |
| `miete24-autos` | `[{key: "fuel", label: "Antrieb", type: "text"}, {key: "transmission", label: "Getriebe", type: "text"}]` |
| `boote` | `[{key: "type", label: "Bootstyp", type: "text"}, {key: "length", label: "Laenge", type: "text"}, {key: "guests", label: "Max. Gaeste", type: "text"}, {key: "location", label: "Standort", type: "text"}, {key: "highlights", label: "Highlights", type: "tags"}]` |
| `privatjet` | `[{key: "manufacturer", label: "Hersteller", type: "text"}, {key: "passengers", label: "Passagiere", type: "text"}, {key: "range", label: "Reichweite", type: "text"}, {key: "typicalRoute", label: "Typische Route", type: "text"}]` |
| `pet-ernaehrung` | `[]` |
| `pet-tracker` | `[{key: "target", label: "Zielgruppe", type: "text"}, {key: "weight", label: "Gewicht", type: "text"}, {key: "variant", label: "Variante", type: "select", options: ["Mini","Standard","XL"]}]` |
| `pet-style` | `[]` |
| `pet-fressnapf` | `[]` |

### ServiceDeskProductCRUD erweitern

Das CRUD-Formular in Zone 1 liest das `metadata_schema` aus `service_shop_config` und rendert die Zusatzfelder dynamisch:

- Neuer Hook: `useServiceShopConfig(shopKey)` — laedt Config inkl. Schema
- Dialog zeigt Standard-Felder (Name, Preis, Bild, Link, Affiliate) PLUS dynamische Felder aus dem Schema
- Beim Speichern werden die dynamischen Felder in das `metadata` JSONB geschrieben

## Teil 2: Produkt-Seed — Alle Shops befuellen

### 2a. Pet-Shop Migration (pet_shop_products -> service_shop_products)

28 bestehende Produkte kopieren mit korrektem `shop_key`-Mapping:

| Quell-Kategorie | Ziel shop_key | Anzahl |
|-----------------|---------------|--------|
| `ernaehrung` | `pet-ernaehrung` | 6 |
| `fressnapf` | `pet-fressnapf` | 6 |
| `lennox_style` | `pet-style` | 16 |

### 2b. Lennox Tracker (aus PetsShop.tsx hardcoded -> DB)

3 Produktvarianten + 3 Abo-Modelle als service_shop_products anlegen:

| Name | Preis | sub_category | metadata |
|------|-------|-------------|----------|
| LENNOX Mini | 39,99 EUR | Tracker | `{variant: "Mini", target: "Kleine Hunde & Katzen bis 10 kg", weight: "25 g"}` |
| LENNOX Standard | 49,99 EUR | Tracker | `{variant: "Standard", target: "Hunde von 10-25 kg", weight: "35 g", popular: true}` |
| LENNOX XL | 59,99 EUR | Tracker | `{variant: "XL", target: "Grosse Hunde ab 25 kg", weight: "45 g"}` |
| Abo Basic | 2,99 EUR/Mo | Abo | `{features: ["Live-Ortung","Standort-Verlauf 24h","1 Geofence-Zone"]}` |
| Abo Plus | 4,99 EUR/Mo | Abo | `{features: [...], popular: true}` |
| Abo Premium | 6,99 EUR/Mo | Abo | `{features: [...]}` |

### 2c. MOD-17 Fahrzeuge — Seed-Daten

**BMW Fokusmodelle** (7 Produkte mit metadata):

| Name | Preis | metadata |
|------|-------|---------|
| BMW 118 | 269 | `{brand:"BMW", code:"F70", power:"115 kW", fuel:"Benzin", term:"36 Mon.", kmPerYear:"10.000", upe:"33.200", configLink:"https://..."}` |
| MINI Cooper | 259 | (analog) |
| BMW X1 sDrive18i | 299 | (analog) |
| BMW 220i Active Tourer | 309 | (analog) |
| BMW iX1 xDrive30 | 399 | `{fuel:"Elektro", ...}` |
| MINI Countryman S ALL4 | 379 | (analog) |
| BMW X3 M50 xDrive | 649 | (analog) |

**Miete24 Autos** (6 Produkte)
**Boote** (8 Produkte mit highlights-Array)
**Privatjet** (6 Produkte)

### 2d. MOD-16 Shops — Seed-Daten

**Amazon Business** (6 Platzhalter-Produkte)
**Bueroshop24** (6 Platzhalter-Produkte)
**Miete24 IT** (6 Platzhalter-Produkte)
**Smart Home / Reolink** (6 Kamera-Produkte)

## Teil 3: Zone 2 PetsShop.tsx — Lennox Tracker dynamisieren

Die hardcoded Produktvarianten (Zeilen 268-291) und Abo-Modelle (Zeilen 297-319) in PetsShop.tsx werden durch DB-Abfragen ersetzt:

```typescript
const { data: trackerProducts = [] } = useActiveServiceProducts('pet-tracker');
const variants = trackerProducts.filter(p => p.sub_category === 'Tracker');
const subscriptions = trackerProducts.filter(p => p.sub_category === 'Abo');
```

Die Feature-Icons und Hero-Bilder bleiben als UI-Config (kein Produktdaten).

## Teil 4: Hook fuer Shop-Config

Neuer Hook `useServiceShopConfig`:

```typescript
export function useServiceShopConfig(shopKey: string) {
  return useQuery({
    queryKey: ['service-shop-config', shopKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_shop_config')
        .select('*')
        .eq('shop_key', shopKey)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
```

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| DB-MIGRATION | `metadata_schema` Spalte zu `service_shop_config` |
| DB-INSERT | `service_shop_config` metadata_schema Updates (12 Eintraege) |
| DB-INSERT | `service_shop_products` — Migration von 28 pet_shop_products |
| DB-INSERT | `service_shop_products` — 6 Lennox Tracker Produkte/Abos |
| DB-INSERT | `service_shop_products` — 7 BMW Fokusmodelle |
| DB-INSERT | `service_shop_products` — 6 Miete24 Autos |
| DB-INSERT | `service_shop_products` — 8 Boote |
| DB-INSERT | `service_shop_products` — 6 Privatjets |
| DB-INSERT | `service_shop_products` — 6 Amazon Platzhalter |
| DB-INSERT | `service_shop_products` — 6 Bueroshop24 Platzhalter |
| DB-INSERT | `service_shop_products` — 6 Miete24 IT Platzhalter |
| DB-INSERT | `service_shop_products` — 6 Smart Home / Reolink |
| NEU | `src/hooks/useServiceShopConfig.ts` |
| EDIT | `src/pages/admin/service-desk/ServiceDeskProductCRUD.tsx` — Dynamische Metadata-Felder |
| EDIT | `src/pages/portal/pets/PetsShop.tsx` — Lennox Tracker dynamisieren |

**Gesamt: ~85 Produkte in service_shop_products, 12 Shops mit Schema-Definition**
