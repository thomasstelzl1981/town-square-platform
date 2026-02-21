

# Demo-Daten erweitern: Verkaufs-Workflow (MOD-04 → MOD-06/08/09 → Kaufy)

## Ziel

Einen vollstaendigen Verkaufs-Workflow fuer **eine** Demo-Immobilie (Berlin, BER-01) als CSV-basierte Demo-Daten hinzufuegen. Dadurch wird die komplette Kette `sale_enabled → property_features → listings → listing_publications` aktiviert und die Module MOD-06, MOD-08 und MOD-09 sowie Kaufy zeigen reale Daten.

## Welche Immobilie?

**BER-01** (Berlin, Schadowstr. 42) — Marktwert 340.000 EUR, Kaufpreis 280.000 EUR. Diese Immobilie erhaelt `sale_enabled = true` und einen aktiven Verkaufsauftrag.

---

## Aenderungen im Detail

### 1. CSV: `demo_properties.csv` anpassen

Neue Spalte `sale_enabled` hinzufuegen. BER-01 bekommt `true`, die anderen beiden bleiben `false`.

```text
...;sale_enabled
...;true       (BER-01)
...;false      (MUC-01)
...;false      (HH-01)
```

### 2. Neue CSV: `public/demo-data/demo_property_features.csv`

```text
id;property_id;feature_code;status;config
d0000000-0000-4000-a000-000000000f01;d0000000-0000-4000-a000-000000000001;kaufy;active;{}
d0000000-0000-4000-a000-000000000f02;d0000000-0000-4000-a000-000000000001;website_visibility;active;{}
```

### 3. Neue CSV: `public/demo-data/demo_listings.csv`

Ein aktives Listing fuer BER-01:

```text
id;property_id;title;description;asking_price;commission_rate;status;partner_visibility;public_id;min_price
d0000000-0000-4000-a000-000000000l01;d0000000-0000-4000-a000-000000000001;Altbau-ETW Berlin Mitte;Charmante 62qm Altbauwohnung in bester Lage nahe Unter den Linden;349000;3.57;active;partner_network;demo-listing-ber-01;320000
```

### 4. Neue CSV: `public/demo-data/demo_listing_publications.csv`

Zwei Publikationen (Partner-Netzwerk + Kaufy):

```text
id;listing_id;channel;status
d0000000-0000-4000-a000-000000000p01;d0000000-0000-4000-a000-000000000l01;partner_network;active
d0000000-0000-4000-a000-000000000p02;d0000000-0000-4000-a000-000000000l01;kaufy;active
```

### 5. Seed Engine (`useDemoSeedEngine.ts`)

Neue Phase zwischen Property-Accounting und Phase 3 einfuegen:

```text
Phase 2.5: Sales Workflow
```

- `sale_enabled` wird bereits ueber die CSV-Property-Daten gesetzt (Spalte hinzugefuegt)
- `seedFromCSV('demo_property_features.csv', 'property_features', tenantId)`
- `seedFromCSV('demo_listings.csv', 'listings', tenantId)`
- `seedFromCSV('demo_listing_publications.csv', 'listing_publications', tenantId)`
- Registrierung in `registerEntities()` fuer alle drei neuen Entity-Typen
- EXPECTED-Map um 3 Eintraege erweitern: `property_features: 2, listings: 1, listing_publications: 2`

### 6. Cleanup (`useDemoCleanup.ts`)

Drei neue Entity-Typen in CLEANUP_ORDER einfuegen — VOR `property_accounting` (Leaf-Entities):

```text
'listing_publications',   // Kind von listings
'listings',               // Kind von properties
'property_features',      // Kind von properties
```

### 7. Registrierungen

| Datei | Aenderung |
|-------|-----------|
| `src/config/demoDataRegistry.ts` | 3 neue CSV-Eintraege (property_features, listings, listing_publications) |
| `public/demo-data/demo_manifest.json` | 3 neue Entities hinzufuegen |
| `DEMO_SEED_BACKLOG.md` | 3 neue Zeilen in der Entity-Checkliste |
| `src/hooks/useDemoSeedEngine.ts` | BOOLEAN_KEYS um `sale_enabled` erweitern |

### 8. Keine DB-Migration noetig

Die Tabellen `property_features`, `listings` und `listing_publications` existieren bereits mit korrekten Spalten und RLS-Policies.

---

## Technische Details

### ID-Schema (Demo-Range `d0000000-*`)

| Entity | ID-Pattern |
|--------|-----------|
| property_features | `d0000000-...-000000000f01/f02` |
| listings | `d0000000-...-000000000l01` |
| listing_publications | `d0000000-...-000000000p01/p02` |

### Seed-Reihenfolge (FK-sicher)

```text
properties (mit sale_enabled=true)
  → property_features (FK: property_id)
    → listings (FK: property_id)
      → listing_publications (FK: listing_id)
```

### Cleanup-Reihenfolge (Children first)

```text
listing_publications → listings → property_features → ... → properties
```

### Betroffene Module nach Seed

| Modul | Erwartetes Ergebnis |
|-------|-------------------|
| MOD-04 (Immobilien) | BER-01 zeigt sale_enabled=true, Verkaufs-Tab aktiv |
| MOD-06 (Verkauf) | 1 aktives Listing sichtbar |
| MOD-08 (Investments) | BER-01 im Partner-Netzwerk auffindbar |
| MOD-09 (Vertriebspartner) | 1 Listing im Netzwerk |
| Kaufy (Zone 3) | BER-01 oeffentlich sichtbar via v_public_listings |

