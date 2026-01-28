
# Reparaturplan: MOD-11 Finanzierungsmanager

## Zusammenfassung
MOD-11 ist als Code vollständig implementiert, fehlt aber im `tile_catalog` der Datenbank. Dadurch erscheint das Modul nicht in der Portal-Sidebar.

## Aufgabe 1: MOD-11 in Tile Catalog eintragen

**Ziel:** Finanzierungsmanager erscheint im Entwicklungsportal (Zone 2 Sidebar)

**Aktion:** SQL INSERT in `tile_catalog`

```sql
INSERT INTO tile_catalog (
  tile_code, 
  title, 
  description, 
  icon_key, 
  main_tile_route, 
  sub_tiles, 
  display_order, 
  is_active
)
VALUES (
  'MOD-11',
  'Finanzierungsmanager',
  'Finanzierungsanfragen bearbeiten und bei Banken einreichen',
  'landmark',
  '/portal/finanzierungsmanager',
  '[
    {"title": "So funktioniert''s", "route": "/portal/finanzierungsmanager"},
    {"title": "Selbstauskunft", "route": "/portal/finanzierungsmanager/selbstauskunft"},
    {"title": "Einreichen", "route": "/portal/finanzierungsmanager/einreichen"},
    {"title": "Status", "route": "/portal/finanzierungsmanager/status"}
  ]'::jsonb,
  11,
  true
);
```

**DoD:** MOD-11 erscheint in PortalNav Sidebar nach MOD-10

---

## Aufgabe 2: Icon-Mapping für MOD-11 in PortalNav

**Ziel:** MOD-11 zeigt korrektes Icon (Landmark) in der Navigation

**Datei:** `src/components/portal/PortalNav.tsx`

**Änderung Zeile 177-191:**
```typescript
const moduleMap: Record<string, string> = {
  'MOD-01': 'stammdaten',
  'MOD-02': 'office',
  'MOD-03': 'dms',
  'MOD-04': 'immobilien',
  'MOD-05': 'msv',
  'MOD-06': 'verkauf',
  'MOD-07': 'finanzierung',
  'MOD-08': 'investments',
  'MOD-09': 'vertriebspartner',
  'MOD-10': 'leads',
  'MOD-11': 'finanzierung',  // <-- NEU: Verwendet selbes Icon wie MOD-07
};
```

**DoD:** MOD-11 zeigt Landmark-Icon in Sidebar

---

## Aufgabe 3: MOD-07 Sub-Tiles korrigieren (optional)

**Ziel:** UI-Routen entsprechen Tile Catalog

**Problem:** Tile Catalog zeigt "Fälle, Dokumente, Export, Status" aber UI hat nur Index + Detail

**Option:** Tile Catalog UPDATE auf tatsächliche UI-Struktur:

```sql
UPDATE tile_catalog 
SET sub_tiles = '[
  {"title": "Übersicht", "route": "/portal/finanzierung"}
]'::jsonb 
WHERE tile_code = 'MOD-07';
```

**Alternativ:** Behalten wie ist, da Detail-Navigation über Zeilen-Klick funktioniert

---

## Bereits implementiert (keine Aktion nötig)

Die folgenden Punkte sind bereits korrekt:

1. **Storage-Ordner für Finance-Requests**: Trigger `create_finance_request_folders` erzeugt automatisch:
   - Privat/Identität
   - Privat/Einkommen
   - Privat/Vermögen
   - Privat/Verpflichtungen
   - Privat/Sonstiges
   - Firma/BWA-SuSa
   - Firma/Jahresabschlüsse
   - Firma/Steuern
   - Objektunterlagen

2. **Zone 1 FutureRoom**: Dashboard mit MandateInbox funktioniert

3. **MOD-11 Code**: Alle 4 Tabs sind implementiert

4. **Datenfluss**: finance_request → finance_mandate → future_room_case

---

## Technische Details

### Betroffene Dateien
- `tile_catalog` (Datenbank)
- `src/components/portal/PortalNav.tsx` (Icon-Mapping)

### Keine Änderungen nötig an
- `src/pages/portal/FinanzierungsmanagerPage.tsx` (bereits vollständig)
- `src/App.tsx` (Routen bereits vorhanden)
- Storage-Trigger (bereits implementiert)
- FutureRoom-Komponenten (bereits implementiert)

---

## Ergebnis nach Reparatur

```
Zone 2 Portal Sidebar:
├── Home
├── MOD-01 Stammdaten
├── MOD-02 KI Office
├── MOD-03 DMS
├── MOD-04 Immobilien
├── MOD-05 MSV
├── MOD-06 Verkauf
├── MOD-07 Finanzierung      ← Kundenanträge
├── MOD-08 Investments
├── MOD-09 Vertriebspartner
├── MOD-10 Leadgenerierung
└── MOD-11 Finanzierungsmanager  ← NEU SICHTBAR
```
