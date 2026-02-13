
# Konsolidierung: MSV nach MOD-04 + Miety nach MOD-05 Slot + KI-Telefon-Assistent

## Zusammenfassung der Aenderungen

**3 parallele Aktionen:**
1. MOD-05 (MSV/Mietverwaltung) Funktionalitaet wird in MOD-04 (Immobilien) als neuer Tab "Verwaltung" integriert
2. MOD-20 (Miety) rutscht in den Menueplatz von MOD-05 — Display-Name wird "Zuhause" (Routen bleiben `/portal/miety`)
3. MOD-05 wird umgewidmet zum "KI-Telefon-Assistent" (Routen bleiben `/portal/msv`, Platzhalter)

---

## Betroffene Dateien — Vollstaendige Analyse

### A. Manifest & Config (SSOT-Ebene)

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | MOD-04: neuer Tab "verwaltung" + dynamic_route "vermietung/:id". MOD-05: name="KI-Telefon-Assistent", icon="Phone", tiles auf 1 Platzhalter reduzieren. MOD-20: display_order von 20 auf 5 aendern (Menu-Position). Kommentar Zeile 9 aktualisieren |
| `src/manifests/areaConfig.ts` | 'missions' Array: MOD-05 durch MOD-20 ersetzen. 'base' Array: MOD-20 durch MOD-05 ersetzen. moduleLabelOverrides: MOD-05 auf "KI-Telefon-Assistent", MOD-20 auf "Zuhause" |
| `src/manifests/goldenPaths/MOD_04.ts` | Phase 3 "MOD-05 Sichtbarkeit" aktualisieren — Referenz zeigt jetzt auf MOD-04/verwaltung statt MOD-05 |
| `src/manifests/goldenPaths/GP_VERMIETUNG.ts` | moduleCode bleibt MOD-05 (historisch), aber routePattern und failure_redirect aktualisieren: `/portal/mietverwaltung` wird `/portal/immobilien/verwaltung` |

### B. Router & Component Maps

| Datei | Aenderung |
|---|---|
| `src/router/ManifestRouter.tsx` | portalModuleComponentMap: `msv` Eintrag bleibt (zeigt auf neue KI-Telefon-Platzhalter-Page). portalDynamicComponentMap: RentalExposeDetail Import-Pfad auf neuen Ort anpassen |

### C. Seiten-Dateien (Pages)

| Datei | Aenderung |
|---|---|
| `src/pages/portal/ImmobilienPage.tsx` | Neue Route "verwaltung" + "vermietung/:id" hinzufuegen |
| `src/pages/portal/immobilien/VerwaltungTab.tsx` | **NEU** — One-Pager Mietverwaltungs-Flow (konsolidiert ObjekteTab + MieteingangTab + VermietungTab Logik) |
| `src/pages/portal/immobilien/index.ts` | VerwaltungTab exportieren |
| `src/pages/portal/MSVPage.tsx` | Komplett auf KI-Telefon-Assistent Platzhalter reduzieren (1 Route: uebersicht) |
| `src/pages/portal/msv/KiTelefonUebersicht.tsx` | **NEU** — Platzhalter fuer den KI-Telefon-Assistenten |
| `src/pages/portal/msv/ObjekteTab.tsx` | Wird von VerwaltungTab referenziert oder Logik dorthin migriert |
| `src/pages/portal/msv/MieteingangTab.tsx` | Logik wird in VerwaltungTab integriert |
| `src/pages/portal/msv/VermietungTab.tsx` | Logik wird in VerwaltungTab integriert |
| `src/pages/portal/msv/EinstellungenTab.tsx` | MSV-Einstellungen wandern in Immobilien-Einstellungen oder werden Teil des VerwaltungTab |
| `src/pages/portal/msv/RentalExposeDetail.tsx` | Wird nach `src/pages/portal/immobilien/RentalExposeDetail.tsx` verschoben, Ruecklink-Pfade aktualisieren |

### D. Komponenten

| Datei | Aenderung |
|---|---|
| `src/components/msv/*.tsx` (8 Dateien) | Bleiben bestehen, werden von VerwaltungTab importiert. Interne Links (`/portal/msv/...`) muessen auf `/portal/immobilien/verwaltung` aktualisiert werden |
| `src/components/portal/HowItWorks/moduleContents.ts` | MOD-04 hint aktualisieren (MSV-Verweis entfernen). MOD-05 Eintrag auf KI-Telefon-Assistent umschreiben. Sub-Tile-Routes aktualisieren |
| `src/components/portfolio/FeaturesTab.tsx` | `msv` Feature-Config Label/Beschreibung anpassen |
| `src/components/portal/ModuleDashboard.tsx` | MOD-05 Kommentar aktualisieren |
| `src/components/presentation/MermaidDiagram.tsx` | MOD-05 Label von MSV auf KI-Telefon-Assistent aendern |
| `src/hooks/useMSVPremium.ts` | Bleibt (wird weiterhin von VerwaltungTab genutzt) |
| `src/components/shared/AddBankAccountDialog.tsx` | Keine Aenderung (nutzt msv_bank_accounts Tabelle direkt) |

### E. Datenbank (tile_catalog)

```sql
-- MOD-04: Verwaltung-Tab hinzufuegen
UPDATE tile_catalog SET sub_tiles = '[
  {"title":"Portfolio","route":"/portal/immobilien/portfolio"},
  {"title":"Vermietereinheit","route":"/portal/immobilien/kontexte"},
  {"title":"Sanierung","route":"/portal/immobilien/sanierung"},
  {"title":"Bewertung","route":"/portal/immobilien/bewertung"},
  {"title":"Verwaltung","route":"/portal/immobilien/verwaltung"}
]'::jsonb WHERE tile_code = 'MOD-04';

-- MOD-05: Umwidmung zu KI-Telefon-Assistent
UPDATE tile_catalog SET
  title = 'KI-Telefon-Assistent',
  sub_tiles = '[{"title":"Uebersicht","route":"/portal/msv/uebersicht"}]'::jsonb
WHERE tile_code = 'MOD-05';

-- MOD-20: Display-Name zu "Zuhause"
UPDATE tile_catalog SET title = 'Zuhause' WHERE tile_code = 'MOD-20';
```

### F. Daten-Dateien & Presentation

| Datei | Aenderung |
|---|---|
| `src/data/sotWebsiteModules.ts` | MOD-05 Eintrag: name auf "KI-Telefon-Assistent", tagline anpassen |
| `src/pages/presentation/PresentationPage.tsx` | MOD-05 Label aktualisieren |
| `src/pages/portal/AreaOverviewPage.tsx` | 'missions' Beschreibung: "Mietverwaltung" durch "Zuhause" ersetzen |

### G. Spec-Dateien & Dokumentation

| Datei | Aenderung |
|---|---|
| `docs/modules/MOD-05_MSV.md` | Archivieren oder als "Legacy" markieren, neues Dokument MOD-05_KI_TELEFON.md |
| `docs/modules/MOD-04_IMMOBILIEN.md` | Verwaltungs-Tab dokumentieren |
| `docs/modules/MOD-20_MIETY.md` | Display-Name "Zuhause" dokumentieren, Position im Menue aktualisieren |
| `spec/current/02_modules/mod-04_immobilien.md` | Cross-Module Contracts aktualisieren (MOD-05 MSV Read Contract wird interner Tab) |
| `spec/current/00_frozen/modules_freeze_paths.json` | MOD-05 Pfade auf KI-Telefon aktualisieren |
| `spec/current/00_frozen/AUDIT_PASS_2026-02-02.txt` | MOD-05 Zeile aktualisieren |
| `spec/current/00_frozen/DEVELOPMENT_GOVERNANCE.md` | MOD-05 Eintrag aktualisieren |
| `spec/current/01_platform/ACCESS_MATRIX.md` | MOD-05 Label aktualisieren |
| `spec/current/06_api_contracts/module_api_overview.md` | MOD-05 Sektion aktualisieren |
| `spec/current/06_api_contracts/INDEX.md` | Renter Invite Referenz aktualisieren |
| `artifacts/audit/zone2_modules.json` | MOD-04: 5 tiles (+ verwaltung). MOD-05: name="KI-Telefon-Assistent", tiles=["uebersicht"]. MOD-20: name="Zuhause" |

### H. Zone 3 (keine Aenderung)

Die Miety-Website (`/website/miety`) bleibt komplett unveraendert. Die Umbenennung zu "Zuhause" betrifft nur die Zone 2 Menueanzeige.

---

## Reihenfolge der Umsetzung

1. **DB-Migration**: tile_catalog Updates (MOD-04, MOD-05, MOD-20)
2. **Manifest-Updates**: routesManifest.ts, areaConfig.ts
3. **VerwaltungTab erstellen**: One-Pager mit konsolidierter MSV-Logik (Objekte + Mieteingang + Vermietung)
4. **RentalExposeDetail verschieben**: nach immobilien/
5. **ImmobilienPage.tsx**: Neue Routen (verwaltung, vermietung/:id)
6. **MSVPage.tsx**: Auf KI-Telefon-Platzhalter reduzieren
7. **ManifestRouter.tsx**: Component Map aktualisieren
8. **HowItWorks + Presentation**: Labels aktualisieren
9. **Golden Paths**: MOD_04.ts + GP_VERMIETUNG.ts Referenzen anpassen
10. **Interne Links**: Alle `/portal/msv/...` Links in msv-Komponenten auf `/portal/immobilien/verwaltung` umstellen
11. **Audit-Artefakte + Specs**: Dokumentation synchronisieren
12. **Alte MSV-Tabs loeschen**: ObjekteTab, MieteingangTab, VermietungTab, EinstellungenTab (nach Migration)

---

## Architektur-Notizen

- **Routen bleiben stabil**: `/portal/miety` und `/portal/msv` aendern sich NICHT — nur die Menu-Labels und display_order
- **DB-Tabellen bleiben**: `msv_*` Tabellen werden weiterhin genutzt (jetzt von MOD-04/verwaltung)
- **MOD-20 in Missions-Area**: Wechselt von "Base" nach "Missions" (ersetzt MOD-05 im Menueplatz)
- **MOD-05 in Base-Area**: Wechselt von "Missions" nach "Base" (als KI-Telefon-Assistent)
- **VerwaltungTab als One-Pager**: Widget-Leiste oben (KPIs: Einheiten, Mieteingang, offene Posten), darunter durchlaufender Verwaltungs-Flow
