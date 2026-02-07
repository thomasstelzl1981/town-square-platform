
# Synchronisierungs-Plan: KI-Office Widgets & MOD-00 Dashboard

## Analyse-Ergebnis

Ich habe eine vollständige Codebase-Analyse durchgeführt und folgende Inkonsistenzen gefunden:

### ❌ Probleme gefunden

| # | Datei | Problem | Priorität |
|---|-------|---------|-----------|
| 1 | `src/manifests/routesManifest.ts` | MOD-02 hat nur 4 Tiles, "Widgets" fehlt | **KRITISCH** |
| 2 | `src/components/portal/HowItWorks/moduleContents.ts` | MOD-02 subTiles hat nur 4 Einträge | **KRITISCH** |
| 3 | `src/pages/portal/office/index.ts` | `WidgetsTab` wird nicht exportiert | MITTEL |
| 4 | Datenbank `tile_catalog` | MOD-02 sub_tiles Array hat nur 4 Einträge | **KRITISCH** |
| 5 | `src/manifests/routesManifest.ts` | MOD-00 Dashboard ist nicht als Modul definiert | NIEDRIG |

### ✅ Bereits korrekt

| Datei | Status |
|-------|--------|
| `manifests/tile_catalog.yaml` | ✅ 5 Sub-Tiles inkl. Widgets |
| `spec/current/02_modules/mod-02_ki-office.md` | ✅ 5 Tabs dokumentiert |
| `spec/current/02_modules/mod-00_dashboard.md` | ✅ Spec vorhanden |
| `src/pages/portal/OfficePage.tsx` | ✅ Route `/widgets` vorhanden |
| `src/pages/portal/office/WidgetsTab.tsx` | ✅ Komponente existiert |
| `src/manifests/armstrongManifest.ts` | ✅ MOD-00 Actions vorhanden |

---

## Umsetzungsplan

### Phase 1: Code-Synchronisation (Navigation sichtbar machen)

#### 1.1 routesManifest.ts — MOD-02 Widgets Tile hinzufügen

**Datei:** `src/manifests/routesManifest.ts`

```typescript
// Zeile 168-180 ändern:
"MOD-02": {
  name: "KI Office",
  base: "office",
  icon: "Sparkles",
  display_order: 2,
  visibility: { default: true, org_types: ["client", "partner"] },
  tiles: [
    { path: "email", component: "EmailTab", title: "E-Mail" },
    { path: "brief", component: "BriefTab", title: "Brief" },
    { path: "kontakte", component: "KontakteTab", title: "Kontakte" },
    { path: "kalender", component: "KalenderTab", title: "Kalender" },
    { path: "widgets", component: "WidgetsTab", title: "Widgets" },  // NEU
  ],
},
```

#### 1.2 moduleContents.ts — MOD-02 subTiles erweitern

**Datei:** `src/components/portal/HowItWorks/moduleContents.ts`

```typescript
// Bei MOD-02 (ca. Zeile 89-94) ändern:
subTiles: [
  { title: 'E-Mail', route: '/portal/office/email', icon: Mail },
  { title: 'Brief', route: '/portal/office/brief', icon: FileText },
  { title: 'Kontakte', route: '/portal/office/kontakte', icon: Users },
  { title: 'Kalender', route: '/portal/office/kalender', icon: Calendar },
  { title: 'Widgets', route: '/portal/office/widgets', icon: Layers },  // NEU
],
```

Import `Layers` aus lucide-react hinzufügen.

#### 1.3 office/index.ts — Export hinzufügen

**Datei:** `src/pages/portal/office/index.ts`

```typescript
export { EmailTab } from './EmailTab';
export { BriefTab } from './BriefTab';
export { KontakteTab } from './KontakteTab';
export { KalenderTab } from './KalenderTab';
export { WidgetsTab } from './WidgetsTab';  // NEU
```

---

### Phase 2: Datenbank-Synchronisation

#### 2.1 tile_catalog UPDATE für MOD-02

```sql
UPDATE tile_catalog 
SET sub_tiles = '[
  {"route": "/portal/office/email", "title": "E-Mail"},
  {"route": "/portal/office/brief", "title": "Brief"},
  {"route": "/portal/office/kontakte", "title": "Kontakte"},
  {"route": "/portal/office/kalender", "title": "Kalender"},
  {"route": "/portal/office/widgets", "title": "Widgets"}
]'::jsonb
WHERE tile_code = 'MOD-02';
```

#### 2.2 MOD-00 Dashboard in tile_catalog (optional)

```sql
INSERT INTO tile_catalog (
  tile_code, title, description, icon_key, zone, 
  display_order, is_active, main_tile_route, main_tile_title, sub_tiles
) VALUES (
  'MOD-00', 
  'Dashboard', 
  'Widget-basierte Startseite mit Drag & Drop',
  'layout-dashboard',
  2,
  0,
  true,
  '/portal',
  'Dashboard',
  '[]'::jsonb
);
```

---

### Phase 3: Konsistenz-Checks

#### 3.1 Prüfung aller SSOT-Quellen

Nach der Implementierung müssen folgende Dateien synchron sein:

| Quelle | MOD-02 Tiles | MOD-00 |
|--------|--------------|--------|
| `routesManifest.ts` | 5 Tiles | Dashboard-Route |
| `moduleContents.ts` | 5 subTiles | — |
| `tile_catalog.yaml` | 5 sub_tiles | MOD-00 Eintrag |
| `tile_catalog` (DB) | 5 sub_tiles | MOD-00 Row |
| `mod-02_ki-office.md` | 5 Tabs | — |

---

## Zusammenfassung: Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/manifests/routesManifest.ts` | MOD-02 Widgets Tile hinzufügen |
| `src/components/portal/HowItWorks/moduleContents.ts` | Widgets zu subTiles, Layers Import |
| `src/pages/portal/office/index.ts` | WidgetsTab Export |
| Datenbank `tile_catalog` | MOD-02 sub_tiles UPDATE |
| Datenbank `tile_catalog` | MOD-00 INSERT (optional) |

---

## Nach Umsetzung: Erwartetes Ergebnis

Navigation in KI-Office zeigt 5 Tabs:
```
[E-Mail] [Brief] [Kontakte] [Kalender] [Widgets]
```

Der "Widgets"-Tab öffnet `/portal/office/widgets` und zeigt das Archiv erledigter Armstrong-Widgets.
