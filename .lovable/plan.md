

## Komplett-Check: MOD-13 Landing Page System — Audit-Ergebnis

### Gesamtstatus: 5 Probleme gefunden, 12 Punkte sauber

---

### ROUTE-CHECK

| Route | Manifest | Router | Komponente | Status |
|---|---|---|---|---|
| `/portal/projekte/landing-page` | ✅ routesManifest Z2 MOD-13 tile | ✅ ManifestRouter | ✅ LandingPageTab.tsx | OK |
| `/website/projekt/:slug` | ✅ routesManifest `project-landing` | ✅ zone3ComponentMaps | ✅ ProjectLandingHome.tsx | OK |
| `/website/projekt/:slug/objekt` | ✅ routesManifest | ✅ zone3ComponentMaps | ✅ ProjectLandingObjekt.tsx | OK |
| `/website/projekt/:slug/beratung` | ✅ routesManifest | ✅ zone3ComponentMaps | ✅ ProjectLandingBeratung.tsx | OK |
| `/website/projekt/:slug/einheit/:unitId` | ✅ routesManifest | ✅ zone3ComponentMaps | ✅ ProjectLandingExpose.tsx | OK |
| `/website/projekt/:slug/impressum` | ✅ routesManifest | ✅ zone3ComponentMaps (lazy) | ✅ ProjectLandingImpressum.tsx | OK |
| `/website/projekt/:slug/datenschutz` | ✅ routesManifest | ✅ zone3ComponentMaps (lazy) | ✅ ProjectLandingDatenschutz.tsx | OK |
| `/admin/projekt-desk` | ✅ routesManifest Z1 | ✅ ProjektDesk.tsx | ✅ | OK |
| `/admin/projekt-desk/landing-pages` | ✅ routesManifest Z1 | ✅ LandingPagesTab in ProjektDesk | ✅ | **PROBLEM** |

### MANIFEST-CHECK

| Manifest | Status | Detail |
|---|---|---|
| `routesManifest.ts` — Z2 MOD-13 tiles | ✅ | 7 Tiles inkl. `landing-page` |
| `routesManifest.ts` — Z3 `project-landing` | ✅ | 6 Routen registriert |
| `routesManifest.ts` — Z1 `projekt-desk` | ✅ | 4 Tabs inkl. `landing-pages` |
| `ManifestRouter.tsx` — Lazy imports | ✅ | Alle 6 Komponenten importiert |
| `ManifestRouter.tsx` — zone3LayoutMap | ✅ | `ProjectLandingLayout` registriert |
| `ManifestRouter.tsx` — zone3ComponentMaps | ✅ | `project-landing` Key mit 6 Komponenten |
| `index.ts` exports | ✅ | Alle 7 Komponenten exportiert |

### DB-CHECK

| Pruefpunkt | Status | Detail |
|---|---|---|
| `landing_pages` Tabelle | ✅ | 27 Spalten, alle neuen Spalten vorhanden (highlights_json, advisor_ids, footer_*, imprint_text, privacy_text, custom_domain, domain_status) |
| RLS Policies | ✅ | 5 Policies: Admin-ALL, Org-INSERT, Org-SELECT, Org-UPDATE, Public-SELECT (active/preview) |
| Daten vorhanden | ⚠️ | 0 Zeilen — noch keine Landing Page erstellt (erwartet, da wir gerade testen wollen) |

### HOOK-CHECK

| Hook | Status | Detail |
|---|---|---|
| `useLandingPage.ts` | ✅ | 7 Funktionen: CRUD + generateSlug + publish + book + lock/unlock |
| `useLandingPageByProject` | ✅ | Korrekte Query, queryKey stimmt |
| `useCreateLandingPage` | ✅ | Insert mit `created_by` |
| `usePublishLandingPage` | ✅ | Status → preview + 36h Expiry |
| `useBookLandingPage` | ✅ | Status → active (permanent) |

---

### GEFUNDENE PROBLEME

#### Problem 1: Zone 1 ProjektDesk filtert nach nicht-existierender Spalte `entity_type`

**Datei:** `src/pages/admin/desks/ProjektDesk.tsx` Zeile 69 und 309

```typescript
.eq('entity_type', 'dev_project')  // ← Diese Spalte existiert NICHT in landing_pages!
```

Die `landing_pages`-Tabelle hat keine Spalte `entity_type`. Der Query schlaegt still fehl (Supabase ignoriert unbekannte Filter bei `as any`). Das bedeutet: Der Zone 1 Projekt Desk zeigt NIEMALS Landing Pages an, auch wenn welche existieren.

**Fix:** Filter entfernen — alle `landing_pages` sind per Definition Projekt-Landing-Pages (die Tabelle hat `project_id` als FK). Alternativ: Kein Filter noetig, da jede Landing Page einem `dev_project` zugeordnet ist.

#### Problem 2: Zone 1 LandingPagesTab referenziert falsche Felder

**Datei:** `src/pages/admin/desks/ProjektDesk.tsx` Zeile 351

```typescript
page.name || page.title || '–'  // ← Beides existiert nicht! Richtig wäre: page.hero_headline
```

Die `landing_pages`-Tabelle hat weder `name` noch `title`. Das korrekte Feld ist `hero_headline`.

#### Problem 3: Zone 1 STATUS_MAP stimmt nicht mit echten Status-Werten ueberein

**Datei:** `src/pages/admin/desks/ProjektDesk.tsx` Zeile 318-322

```typescript
const STATUS_MAP = {
  published: ...,  // ← Falsch! Heißt 'active'
  draft: ...,      // ← OK
  archived: ...,   // ← Falsch! Heißt 'locked'
};
```

Die echten Status-Werte sind: `draft`, `preview`, `active`, `locked`. Der ProjektDesk hat die alten Werte `published` und `archived`.

#### Problem 4: Console Warning — Badge ref-Fehler in LandingPageTab

Die Konsole zeigt: `Function components cannot be given refs. Attempts to access this ref will fail. Check the render method of LandingPageTab.`

Das Badge im WidgetGrid erhaelt eine ref, die es nicht akzeptiert. Kein funktionaler Fehler, aber eine Warnung die bereinigt werden sollte.

#### Problem 5: Landing Page wird mit Status `draft` erstellt — Zone 3 zeigt nur `active` oder `preview`

**Datei:** `ProjectLandingLayout.tsx` Zeile 34

```typescript
.eq('status', 'active')  // ← Draft-Seiten werden NICHT angezeigt!
```

Der Flow ist: Erstellen (draft) → Publish (preview/36h) → Book (active). Aber die Vorschau im Editor (`iframe src={previewUrl}`) zeigt die Zone 3 Seite an, die nur `active`-Status akzeptiert. Das heisst: Das iframe-Preview zeigt immer "Projekt nicht gefunden" bis die Seite published/booked wurde.

**Fix:** Entweder Preview-URL bekommt einen Query-Parameter `?preview=true` der den Status-Filter umgeht, oder das iframe nutzt eine eigene Vorschau-Komponente statt der Live-Zone-3-Seite.

---

### IMPLEMENTIERUNGSPLAN

#### Schritt 1: Zone 1 ProjektDesk reparieren (ProjektDesk.tsx)
- `entity_type`-Filter entfernen (Zeile 69, 309)
- `page.name || page.title` → `page.hero_headline || page.slug` (Zeile 351)
- STATUS_MAP korrigieren: `published` → `active`, `archived` → `locked`, `preview` hinzufuegen
- Projekt-Join hinzufuegen fuer bessere Anzeige (Projektname, Stadt)

#### Schritt 2: Zone 3 Preview-Problem loesen (ProjectLandingLayout.tsx)
- Status-Filter von `.eq('status', 'active')` auf `.in('status', ['draft', 'preview', 'active'])` erweitern
- Alternativ: Preview-Token/Parameter einfuehren (sicherer, aber aufwaendiger)
- Empfehlung fuer MVP: Filter erweitern — `locked` bleibt weiterhin blockiert (Billing-Sperre), aber draft/preview/active werden angezeigt

#### Schritt 3: Console Warning bereinigen (LandingPageTab.tsx)
- Badge-Ref-Issue in WidgetGrid beheben (DESIGN.DEMO_WIDGET.BADGE ref-Weitergabe)

#### Schritt 4: Alle Zone-3-Seiten Status-Filter synchronisieren
- Gleichen Fix in `ProjectLandingHome.tsx`, `ProjectLandingObjekt.tsx`, `ProjectLandingBeratung.tsx`, `ProjectLandingExpose.tsx`, `ProjectLandingImpressum.tsx`, `ProjectLandingDatenschutz.tsx` — ueberall wo `.eq('status', 'active')` steht

### Betroffene Dateien

| # | Datei | Aenderung |
|---|---|---|
| 1 | `src/pages/admin/desks/ProjektDesk.tsx` | entity_type-Filter entfernen, Feldnamen korrigieren, STATUS_MAP aktualisieren |
| 2 | `src/pages/zone3/project-landing/ProjectLandingLayout.tsx` | Status-Filter auf draft+preview+active erweitern |
| 3 | `src/pages/zone3/project-landing/ProjectLandingHome.tsx` | Status-Filter erweitern |
| 4 | `src/pages/zone3/project-landing/ProjectLandingObjekt.tsx` | Status-Filter erweitern |
| 5 | `src/pages/zone3/project-landing/ProjectLandingBeratung.tsx` | Status-Filter erweitern |
| 6 | `src/pages/zone3/project-landing/ProjectLandingImpressum.tsx` | Status-Filter erweitern |
| 7 | `src/pages/zone3/project-landing/ProjectLandingDatenschutz.tsx` | Status-Filter erweitern (falls vorhanden) |

### Freeze-Status

- ProjektDesk.tsx → Zone 1 Admin, NICHT gefroren
- Zone 3 Dateien → NICHT gefroren
- MOD-13 → Gefroren, aber LandingPageTab muss nicht geaendert werden (Badge-Warning ist kosmetisch)

