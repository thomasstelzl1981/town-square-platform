
# Konsolidierung: Vermietereinheit in Portfolio integrieren

## Analyse-Ergebnis

**PortfolioTab** hat bereits eine horizontale Kontext-Auswahl-Leiste (Zeilen 628-681) mit Kacheln fuer "Alle" und jeden Kontext. Diese Kacheln sind aber reine Filter-Buttons ohne CRUD-Funktionalitaet.

**KontexteTab** (923 Zeilen) bietet die vollstaendige Verwaltung:
- Kontext-Karten mit Anzeige (Steuer, Eigentuemer, Adresse, GF)
- Inline-Bearbeitung (Formular direkt in der Karte)
- Neuanlage (CreateContextDialog)
- Objekt-Zuordnung (PropertyContextAssigner)

## Konsolidierungsstrategie

Die bestehende Kontext-Auswahl-Leiste im Portfolio wird erweitert um einen "Verwalten"-Button. Dieser oeffnet ein Collapsible/Accordion-Panel direkt unter der Leiste, das die vollen KontexteTab-Karten mit Bearbeitungs- und Zuordnungsfunktion zeigt. Die separate Route `/portal/immobilien/kontexte` wird als Redirect auf `/portal/immobilien/portfolio` erhalten.

## Betroffene Dateien

### Code-Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Kontext-Verwaltung (CRUD) aus KontexteTab integrieren: "Verwalten"-Button in der Kontext-Leiste, Collapsible-Bereich mit den Kontext-Karten (View + Edit + Create + Assign) |
| `src/pages/portal/immobilien/KontexteTab.tsx` | Logik in wiederverwendbare Komponente extrahieren (`ContextManager`) und in PortfolioTab einbetten. Datei bleibt als Redirect-Wrapper |
| `src/pages/portal/ImmobilienPage.tsx` | Route `kontexte` aendern zu Redirect auf `portfolio` |
| `src/pages/portal/immobilien/index.ts` | KontexteTab Export entfernen oder auf Redirect anpassen |

### Manifest & Config

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | MOD-04 tiles: "kontexte" Eintrag entfernen → 4 tiles (portfolio, sanierung, bewertung, verwaltung). Kommentar Zeile 9 anpassen: "4 tiles" statt "5 tiles" |
| `src/manifests/areaConfig.ts` | Keine Aenderung (referenziert Module, nicht einzelne Tiles) |

### Datenbank

```sql
-- MOD-04: Vermietereinheit Sub-Tile entfernen
UPDATE tile_catalog SET sub_tiles = '[
  {"title":"Portfolio","route":"/portal/immobilien/portfolio"},
  {"title":"Sanierung","route":"/portal/immobilien/sanierung"},
  {"title":"Bewertung","route":"/portal/immobilien/bewertung"},
  {"title":"Verwaltung","route":"/portal/immobilien/verwaltung"}
]'::jsonb WHERE tile_code = 'MOD-04';
```

### HowItWorks & Presentation

| Datei | Aenderung |
|---|---|
| `src/components/portal/HowItWorks/moduleContents.ts` | MOD-04 subTiles: "Kontexte" Eintrag entfernen. whatYouDo: "Vermieter-Kontexte organisieren" umformulieren zu "Vermietereinheiten im Portfolio verwalten" |

### Audit & Spec-Dateien

| Datei | Aenderung |
|---|---|
| `artifacts/audit/zone2_modules.json` | MOD-04: tiles auf `["portfolio", "sanierung", "bewertung", "verwaltung"]`, tile_count auf 4, exception entfernen |
| `spec/current/02_modules/mod-04_immobilien.md` | Sekundaere Route `/portal/immobilien/kontexte` als Redirect dokumentieren. Nav-Tiles aktualisieren (Kontexte entfernen). Dossier-Beschreibung: "Kontexte werden im Portfolio verwaltet" |
| `spec/current/00_frozen/AUDIT_PASS_2026-02-02.txt` | MOD-04 Zeile: "kontexte" aus Tile-Auflistung entfernen |
| `spec/current/00_frozen/AUDIT_MARKER_2026-02-02_v2.md` | MOD-04 Zeile anpassen |
| `spec/current/00_frozen/DEVELOPMENT_GOVERNANCE.md` | MOD-04 Beschreibung: "Kontexte" durch "Sanierung, Bewertung" ersetzen |
| `docs/modules/MOD-04_IMMOBILIEN.md` | Menuepunkt "Stammdaten / Kontexte" entfernen, Route-Tabelle aktualisieren, Screen-Spec 6.1 als "integriert in Portfolio" markieren |

## Umsetzungsreihenfolge

1. **Komponente extrahieren**: Kontext-CRUD-Logik aus KontexteTab in eine wiederverwendbare `ContextManager`-Komponente extrahieren (Karten-Ansicht, Edit-Modus, Create-Dialog, Zuordnung)
2. **PortfolioTab erweitern**: "Verwalten"-Button neben der Kontext-Leiste. Klick oeffnet/schliesst ein Collapsible-Panel mit den `ContextManager`-Karten direkt unter der Auswahl-Leiste
3. **KontexteTab auf Redirect reduzieren**: Route `/portal/immobilien/kontexte` leitet auf `/portal/immobilien/portfolio` um
4. **Manifest aktualisieren**: routesManifest.ts — "kontexte" Tile entfernen
5. **DB-Migration**: tile_catalog MOD-04 sub_tiles aktualisieren
6. **moduleContents.ts**: Kontexte-SubTile entfernen
7. **Audit-Artefakte + Specs**: Dokumentation synchronisieren

## Was bleibt erhalten

- **Volle CRUD-Funktionalitaet** fuer Vermietereinheiten — nur der Zugang aendert sich (kein eigener Menuepunkt mehr, sondern im Portfolio eingebettet)
- **Route `/portal/immobilien/kontexte`** bleibt als Redirect erreichbar (Backward-Compatibility)
- **Alle DB-Tabellen** (`landlord_contexts`, `context_property_assignment`, `context_members`) bleiben unveraendert
- **Kontext-Filter** in der Portfolio-Tabelle funktioniert wie bisher
