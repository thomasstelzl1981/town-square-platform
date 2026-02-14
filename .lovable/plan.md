
# Migrationsplan: MOD-05 wird Website Builder, MOD-21 verschwindet

## Ausgangslage

| Aspekt | IST-Zustand | SOLL-Zustand |
|--------|-------------|--------------|
| MOD-05 | "KI-Telefon-Assistent" Platzhalter unter `/portal/msv` | **Website Builder** unter `/portal/website-builder` |
| MOD-21 | Website Builder unter `/portal/website-builder` | **Geloescht** — Code lebt weiter unter MOD-05 |
| `/portal/msv` | Redirect-Wrapper + Platzhalter-Seite | Redirect zu `/portal/immobilien/verwaltung` (Legacy) |

**Kernprinzip:** Der gesamte Website-Builder-Code bleibt funktional identisch. Es aendert sich nur der Modulcode (MOD-21 wird MOD-05) und die alte MSV-Platzhalter-Infrastruktur wird entfernt.

---

## Betroffene Schichten (5)

```text
+---------------------------+
| 1. Datenbank (tile_catalog)|  UPDATE tile_code MOD-05
+---------------------------+
| 2. Manifeste (3 Dateien)  |  routesManifest, areaConfig, armstrongManifest
+---------------------------+
| 3. Konstanten/Registries  |  rolesMatrix, moduleContents, sotWebsiteModules,
|                           |  goldenPathProcesses, demoDataManifest, bwaKontenplan
+---------------------------+
| 4. Seiten-Dateien         |  MSVPage, msv/*.tsx (Loeschkandidaten)
+---------------------------+
| 5. Kommentare/Docs        |  JSDoc-Header in WB*.tsx, spec/mod-05
+---------------------------+
```

---

## Schritt-fuer-Schritt Plan

### Schritt 1: DB-Migration — tile_catalog

MOD-05 Eintrag in `tile_catalog` aktualisieren:
- `title`: "Website Builder"
- `description`: "KI-gestuetzter Website-Baukasten"
- `icon_key`: "globe"
- `main_tile_route`: "/portal/website-builder"
- `sub_tiles`: [] (keine Sub-Tiles, hat dynamic_routes)
- `display_order`: 5 (bleibt)
- `flowchart_mermaid`: Neues Website-Builder Flowchart
- `internal_apis`: Website-Builder Edge Functions
- `external_api_refs`: []

Kein MOD-21 Eintrag existiert in der DB — nichts zu loeschen.

### Schritt 2: routesManifest.ts

**A) MOD-05 Block ersetzen:**
- Bisherig: `"MOD-05": { name: "Modul 05", base: "msv", icon: "Box", tiles: [KiTelefonUebersicht] }`
- Neu: `"MOD-05": { name: "Website Builder", base: "website-builder", icon: "Globe", display_order: 5, tiles: [], dynamic_routes: [{ path: ":websiteId/editor", ... }] }`

**B) MOD-21 Block loeschen** (Zeilen 541-551)

**C) Kommentar Zeile 9 aktualisieren** (MOD-05 ist kein 1-Tile-Placeholder mehr)

**D) Kommentar Zeile 261 aktualisieren** ("ehemals MOD-05 MSV" bleibt korrekt)

### Schritt 3: areaConfig.ts

- Services-Array: `['MOD-14', 'MOD-15', 'MOD-05', 'MOD-16']` — MOD-21 entfernen (MOD-05 bleibt an seiner Position)
- Neuen `moduleLabelOverrides` Eintrag: `'MOD-05': 'Website Builder'`

### Schritt 4: armstrongManifest.ts

- Alle 7 Armstrong-Actions: `module: 'MOD-21'` aendern zu `module: 'MOD-05'`
- Kommentar-Header: "MOD-21: WEBSITE BUILDER" zu "MOD-05: WEBSITE BUILDER"

### Schritt 5: rolesMatrix.ts

- `BASE_TILES` Array: MOD-05 bleibt bereits enthalten — keine Aenderung noetig
- `MODULES` Array: MOD-05 Eintrag umbenennen: `name: 'Website Builder'`, `description: 'KI-Website-Baukasten'`
- `ROLE_MODULE_MAP`: MOD-05 Eintrag bleibt — keine Aenderung noetig

### Schritt 6: Weitere Registries aktualisieren

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/HowItWorks/moduleContents.ts` | MOD-05 Eintrag: Titel, Beschreibung, SubTiles auf Website Builder umschreiben |
| `src/data/sotWebsiteModules.ts` | MOD-05 Eintrag: code bleibt, name/tagline auf Website Builder |
| `src/manifests/goldenPathProcesses.ts` | GP-WEBSITE: `moduleCode: 'MOD-21'` zu `'MOD-05'` |
| `src/manifests/demoDataManifest.ts` | GP-WEBSITE: `moduleCode: 'MOD-21'` zu `'MOD-05'` |
| `src/manifests/bwaKontenplan.ts` | JSDoc-Kommentar: "MOD-05 MSV" zu "MOD-04 Verwaltung" (BWA gehoert jetzt zu MOD-04) |
| `src/components/portal/ModuleDashboard.tsx` | Kommentar "MOD-05 MSV" aktualisieren |
| `src/pages/presentation/PresentationPage.tsx` | MOD-05 Eintrag: Name "Website Builder" statt "MSV" |
| `src/docs/audit-tracker.md` | MOD-05 Zeile aktualisieren |

### Schritt 7: Website-Builder JSDoc-Kommentare

Alle `MOD-21` Referenzen in den Website-Builder-Dateien auf `MOD-05` aendern:
- `src/pages/portal/WebsiteBuilderPage.tsx` (Header-Kommentar)
- `src/pages/portal/website-builder/WBDashboard.tsx`
- `src/pages/portal/website-builder/WBEditor.tsx`
- `src/pages/portal/website-builder/WBSeo.tsx`
- `src/pages/portal/website-builder/WBDesign.tsx`
- `src/shared/website-renderer/designTemplates.ts`
- `src/shared/website-renderer/types.ts`
- `src/router/ManifestRouter.tsx` (Kommentar Zeile 273)

### Schritt 8: Alte MSV-Seiten bereinigen

**Loeschen** (nicht mehr referenziert nach Schritt 2):
- `src/pages/portal/msv/KiTelefonUebersicht.tsx` — Platzhalter-Seite, wird nirgends mehr geroutet
- `src/pages/portal/msv/index.ts` — Re-Exports der alten Tabs (ObjekteTab etc. werden direkt in VerwaltungTab importiert)

**Behalten** (werden noch referenziert):
- `src/pages/portal/MSVPage.tsx` — Wird zu reinem Redirect auf `/portal/immobilien/verwaltung`
- `src/pages/portal/msv/MSVDashboard.tsx` — Wird von MSVPage importiert
- `src/pages/portal/msv/ObjekteTab.tsx` etc. — Falls noch in VerwaltungTab referenziert

**Vereinfachen:**
- `MSVPage.tsx`: Alle Routes auf einen einzigen Redirect zu `/portal/immobilien/verwaltung` reduzieren
- `MSVDashboard.tsx`: Durch einfachen Navigate-Redirect ersetzen

### Schritt 9: Spec-Dokument

- `spec/current/02_modules/mod-05_msv_contract.md` — Inhalt ersetzen durch Website-Builder-Contract oder als "DEPRECATED — moved to MOD-04 Verwaltung" markieren

### Schritt 10: Backlog aktualisieren

- `src/docs/backlog-consolidated-v8.md` um diesen Migrationsschritt ergaenzen
- Memory-Eintraege aktualisieren (MOD-21 Referenz in mod-21-website-builder-spec)

---

## Was sich NICHT aendert

- Die Route `/portal/website-builder` bleibt identisch (base-Pfad im Manifest)
- Alle Website-Builder-Komponenten (WBDashboard, WBEditor, WBSeo, WBDesign) bleiben in `src/pages/portal/website-builder/`
- Edge Functions (sot-website-ai-generate, sot-website-publish, sot-website-update-section) bleiben unveraendert
- DB-Tabellen (sot_websites, sot_website_sections, etc.) bleiben unveraendert
- Die `msv_*` Tabellen (msv_rent_payments, msv_book_values etc.) bleiben unveraendert — sie gehoeren jetzt zu MOD-04 Verwaltung

---

## Risikobewertung

| Risiko | Bewertung | Mitigation |
|--------|-----------|------------|
| Routing-Bruch | Niedrig | Route `/portal/website-builder` bleibt gleich, nur Modulcode aendert sich |
| RBAC-Bruch | Niedrig | MOD-05 ist bereits in BASE_TILES und ROLE_MODULE_MAP |
| DMS-Ordner | Keins | MOD_05 Ordner existiert bereits pro Tenant, wird jetzt fuer Website-Builder genutzt |
| Dangling Imports | Niedrig | KiTelefonUebersicht wird nur vom alten MOD-05 Manifest referenziert |

---

## Technische Details

### Dateien mit Aenderungen (gesamt: ca. 20)

| Datei | Art | Aufwand |
|-------|-----|---------|
| DB tile_catalog | UPDATE | Klein |
| src/manifests/routesManifest.ts | EDIT | Mittel |
| src/manifests/areaConfig.ts | EDIT | Klein |
| src/manifests/armstrongManifest.ts | EDIT | Klein (7x String-Replace) |
| src/constants/rolesMatrix.ts | EDIT | Klein |
| src/components/portal/HowItWorks/moduleContents.ts | EDIT | Klein |
| src/data/sotWebsiteModules.ts | EDIT | Klein |
| src/manifests/goldenPathProcesses.ts | EDIT | Klein |
| src/manifests/demoDataManifest.ts | EDIT | Klein |
| src/manifests/bwaKontenplan.ts | EDIT | Klein (Kommentar) |
| src/components/portal/ModuleDashboard.tsx | EDIT | Klein (Kommentar) |
| src/pages/presentation/PresentationPage.tsx | EDIT | Klein |
| 7x Website-Builder .tsx/.ts Dateien | EDIT | Klein (JSDoc-Kommentare) |
| src/pages/portal/MSVPage.tsx | EDIT | Klein (Vereinfachung) |
| src/pages/portal/msv/KiTelefonUebersicht.tsx | LOESCHEN | — |
| src/pages/portal/msv/index.ts | LOESCHEN | — |
| spec/current/02_modules/mod-05_msv_contract.md | EDIT | Klein |
| src/docs/backlog-consolidated-v8.md | EDIT | Klein |
| src/docs/audit-tracker.md | EDIT | Klein |
