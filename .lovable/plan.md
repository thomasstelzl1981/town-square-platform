

# Soll-Ist-Analyse: Spec-Dateien, Audit-Katalog und Manifest nach Manager-Modul-Aenderungen

## Zusammenfassung der bisherigen Aenderungen

In den letzten Sessions wurden folgende Aenderungen umgesetzt:

1. **MOD-09 (Immomanager):** Tile "Systemgebühr" hinzugefuegt, Titel auf "Provisionen" umbenannt
2. **MOD-12 (Akquisemanager):** Tile "Systemgebühr" hinzugefuegt (6. Tile!), Titel auf "Provisionen" umbenannt
3. **MOD-11 (Finanzierungsmanager):** Hatte bereits "Provisionen" — keine Aenderung
4. **MOD-10 (Lead Manager):** Komplett umgebaut von 6 Sub-Seiten auf Inline-Flow, Route von `/portal/provisionen` auf `/portal/lead-manager` geaendert, Name von "Provisionen" auf "Lead Manager"
5. **MOD-13 (Projektmanager):** Neuer Tile "Lead Manager" hinzugefuegt (5. Tile!), DB-Spalte `social_mandates.project_id`

---

## Soll-Ist je Datei

### 1. `artifacts/audit/zone2_modules.json`

| Modul | IST (veraltet) | SOLL (aktuell) |
|-------|----------------|----------------|
| MOD-09 | `tiles: ["katalog","beratung","kunden","network","leads"]`, tile_count: 5 | `tiles: ["katalog","beratung","kunden","network","systemgebuehr"]`, tile_count: 5, note: Tile "leads" umbenannt zu "systemgebuehr", Display-Titel "Provisionen" |
| MOD-10 | `name: "Provisionen"`, `base: "provisionen"`, `tiles: ["uebersicht"]`, tile_count: 1, note: "Legacy route /portal/leads" | `name: "Lead Manager"`, `base: "lead-manager"`, `tiles: ["inline"]`, tile_count: 1, note: "Inline-Flow. Legacy routes /portal/provisionen + /portal/leads redirect here." |
| MOD-12 | `tiles: ["dashboard","mandate","objekteingang","datenbank","tools"]`, tile_count: 5 | `tiles: ["dashboard","mandate","objekteingang","datenbank","tools","systemgebuehr"]`, tile_count: 6, note: "6. Tile 'systemgebuehr' (Display: Provisionen) hinzugefuegt" |
| MOD-13 | `tiles: ["dashboard","projekte","vertrieb","landing-page"]`, tile_count: 4 | `tiles: ["dashboard","projekte","vertrieb","landing-page","lead-manager"]`, tile_count: 5, note: "5. Tile 'lead-manager' fuer Projekt-Kampagnen" |

Ausserdem: `total_tiles` muss von 95 auf 97 aktualisiert werden (+1 MOD-12, +1 MOD-13; MOD-09 bleibt 5, MOD-10 bleibt 1).

### 2. `spec/current/02_modules/mod-09_vertriebspartner.md`

| Aspekt | IST | SOLL |
|--------|-----|------|
| Tiles-Tabelle | 5 Tiles: Katalog, Beratung, Kunden, Network, Leads | 5 Tiles: Katalog, Beratung, Kunden, Network, **Provisionen** (Route: systemgebuehr) |
| Tile-Catalog YAML | `sub_tiles: [katalog, beratung, kunden, network, leads]` | `sub_tiles: [katalog, beratung, kunden, network, systemgebuehr]` |
| Selfie Ads Abschnitt | Route: `/portal/vertriebspartner/selfie-ads` | Entfernen oder als Legacy markieren — Selfie Ads ist jetzt in MOD-10 Lead Manager konsolidiert |
| Version | 1.0.0 | 1.1.0 |
| Changelog | Nur Initial Release | + "1.1.0: Tile 'Leads' ersetzt durch 'Provisionen' (Systemgebuehr-Vereinbarung). Selfie Ads in MOD-10 konsolidiert." |

### 3. `spec/current/02_modules/mod-10_abrechnung.md`

| Aspekt | IST | SOLL |
|--------|-----|------|
| Dateiname | `mod-10_abrechnung.md` | Umbenennen zu `mod-10_lead-manager.md` |
| Titel | "ABRECHNUNG (Commission Management)" | "LEAD MANAGER (Campaign & Lead Management)" |
| Route-Prefix | `/portal/leads` | `/portal/lead-manager` |
| SSOT-Rolle | "Source of Truth fuer Provisionsabrechnungen" | "Source of Truth fuer Lead-Kampagnen, Selfie Ads und Lead-Verwaltung" |
| FROZEN RULES R2 | Route bleibt `/portal/leads` | Route ist `/portal/lead-manager`, Legacy-Redirects fuer `/portal/leads` und `/portal/provisionen` |
| FROZEN RULES R3 | Display-Name "Abrechnung" | Display-Name "Lead Manager" |
| Tiles | 1 Tile: Uebersicht | 1 Tile: Inline-Flow (KPIs, Kampagnen, Planung, Leads — alles auf einer Seite) |
| Tile-Catalog YAML | `title: "Abrechnung"`, `main_route: "/portal/leads"` | `title: "Lead Manager"`, `main_route: "/portal/lead-manager"`, `icon: "Megaphone"` |
| Neuer Abschnitt | — | Projekt-Kampagnen: `social_mandates.project_id` fuer MOD-13 Integration |
| Edge Functions | — | `sot-social-mandate-submit` (erweitert um project_id) |
| Version | 1.2.0 | 2.0.0 |

### 4. `spec/current/02_modules/mod-12_akquise-manager.md`

| Aspekt | IST | SOLL |
|--------|-----|------|
| Tiles-Tabelle | 5 Tiles | 6 Tiles: + Provisionen (Route: systemgebuehr) |
| Tile-Catalog YAML | `sub_tiles: [dashboard, mandate, objekteingang, tools, datenbank]` | `sub_tiles: [dashboard, mandate, objekteingang, datenbank, tools, systemgebuehr]` |
| Version | 1.0.0 | 1.1.0 |
| Changelog | Nur Initial Release | + "1.1.0: Tile 'Provisionen' (Systemgebuehr-Vereinbarung) hinzugefuegt." |

### 5. `spec/current/02_modules/mod-13_projekte.md`

| Aspekt | IST | SOLL |
|--------|-----|------|
| Tiles-Tabelle | 4 Tiles: Uebersicht, Timeline, Dokumente, Einstellungen | **Achtung: Spec ist komplett veraltet!** Manifest hat: Dashboard, Projekte, Vertrieb, Landing Page, Lead Manager (5 Tiles) |
| Tile-Catalog YAML | `sub_tiles: [uebersicht, timeline, dokumente, einstellungen]` | `sub_tiles: [dashboard, projekte, vertrieb, landing-page, lead-manager]` |
| Edge Functions | 3 Functions | + `sot-social-mandate-submit` (Projekt-Kampagnen) |
| Neuer Abschnitt | — | Lead Manager: Projekt-Kampagnen, `social_mandates.project_id`, Inline-Flow |
| Version | 1.0.0 | 1.1.0 |
| Changelog | Nur Initial Release | + "1.1.0: Tile 'Lead Manager' hinzugefuegt. Tiles an Manifest angeglichen (Dashboard, Projekte, Vertrieb, Landing Page, Lead Manager)." |

### 6. `spec/current/02_modules/mod-11_finanzierungsmanager.md`

| Aspekt | IST | SOLL |
|--------|-----|------|
| Routes-Tabelle | Veraltet (dashboard, faelle, kommunikation, status) | Manifest hat: Dashboard, Finanzierungsakte, Einreichung, Provisionen, Archiv (5 Tiles) |
| Version | 2.1.0 | 2.2.0 |
| Changelog | — | + "2.2.0: Routes-Tabelle an Manifest angeglichen. Tile 'Provisionen' (Systemgebuehr) dokumentiert." |

### 7. `spec/current/02_zones.md` — Keine Aenderung noetig

Die Zone-Boundary-Contracts sind stabil. Keine strukturellen Aenderungen.

---

## Umsetzungsreihenfolge

| # | Datei | Aenderungstyp |
|---|-------|---------------|
| 1 | `artifacts/audit/zone2_modules.json` | MOD-09, MOD-10, MOD-12, MOD-13 aktualisieren, total_tiles auf 97 |
| 2 | `spec/current/02_modules/mod-10_abrechnung.md` | Komplett umschreiben und umbenennen zu `mod-10_lead-manager.md` |
| 3 | `spec/current/02_modules/mod-09_vertriebspartner.md` | Tiles-Tabelle, YAML, Changelog aktualisieren |
| 4 | `spec/current/02_modules/mod-12_akquise-manager.md` | 6. Tile dokumentieren, YAML, Changelog |
| 5 | `spec/current/02_modules/mod-13_projekte.md` | Tiles komplett an Manifest angleichen, Lead Manager dokumentieren |
| 6 | `spec/current/02_modules/mod-11_finanzierungsmanager.md` | Routes-Tabelle an Manifest angleichen |

Insgesamt: **6 Dateien** werden aktualisiert/umgeschrieben.

