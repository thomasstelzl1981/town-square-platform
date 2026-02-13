

# Fix: tile_catalog DB + zone2_modules.json synchronisieren

## Problem

Nach der Konsolidierung MOD-09/MOD-10 sind zwei Konfigurationsquellen nicht aktualisiert worden:

### 1. Datenbank: `tile_catalog` (SSOT fuer Access Control)

**MOD-09** — fehlt der neue "Leads" Sub-Tile:
- IST: 4 sub_tiles (Katalog, Beratung, Kunden, Netzwerk)
- SOLL: 5 sub_tiles (+ Leads)

**MOD-10** — hat noch die alten Leads/Selfie Ads Sub-Tiles:
- IST: 5 sub_tiles (Inbox, Meine Leads, Pipeline, Werbung, Selfie Ads Studio)
- SOLL: 1 sub_tile (Uebersicht) + Titel "Provisionen"

### 2. Audit-Artefakt: `artifacts/audit/zone2_modules.json`

Zeigt noch MOD-10 als "Leads" mit 4 alten Tiles. Muss aktualisiert werden auf den neuen Stand.

## Loesung

### Schritt 1: DB-Migration

```sql
UPDATE tile_catalog
SET sub_tiles = '[
  {"title":"Katalog","route":"/portal/vertriebspartner/katalog"},
  {"title":"Beratung","route":"/portal/vertriebspartner/beratung"},
  {"title":"Kunden","route":"/portal/vertriebspartner/kunden"},
  {"title":"Netzwerk","route":"/portal/vertriebspartner/network"},
  {"title":"Leads","route":"/portal/vertriebspartner/leads"}
]'::jsonb
WHERE tile_code = 'MOD-09';

UPDATE tile_catalog
SET title = 'Provisionen',
    sub_tiles = '[
  {"title":"Übersicht","route":"/portal/leads/uebersicht"}
]'::jsonb
WHERE tile_code = 'MOD-10';
```

### Schritt 2: zone2_modules.json aktualisieren

- MOD-09: tiles um "leads" erweitern, tile_count auf 5, exception-Kommentar "5 tiles: includes Leads tab"
- MOD-10: name auf "Provisionen", tiles auf ["uebersicht"], tile_count auf 1

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration (tile_catalog) | MOD-09 sub_tiles + MOD-10 sub_tiles/title |
| `artifacts/audit/zone2_modules.json` | MOD-09 + MOD-10 aktualisieren |

## Bereits korrekte Dateien (keine Aenderung noetig)

- `src/manifests/routesManifest.ts`
- `src/manifests/areaConfig.ts`
- `src/pages/portal/VertriebspartnerPage.tsx`
- `src/pages/portal/LeadsPage.tsx`
- `src/pages/portal/vertriebspartner/index.ts`
- `.lovable/plan.md`

