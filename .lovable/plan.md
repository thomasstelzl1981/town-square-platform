

# Umbenennung der Manager-Module (ohne Bindestrich)

## IST-Zustand: Manager-Area Module

| Code | Aktueller Name | Aktueller `base` (Route) |
|------|---------------|--------------------------|
| MOD-13 | Projekte | `projekte` |
| MOD-09 | Vertriebspartner | `vertriebspartner` |
| MOD-11 | Finanzierungsmanager | `finanzierungsmanager` |
| MOD-12 | Akquise-Manager | `akquise-manager` |
| MOD-10 | Abrechnung | `leads` |

## SOLL-Zustand: Einheitliche "...manager"-Benennung

| Code | Neuer Name | Route (unveraendert) |
|------|-----------|---------------------|
| MOD-13 | **Projektmanager** | `projekte` (bleibt) |
| MOD-09 | **Vertriebsmanager** | `vertriebspartner` (bleibt) |
| MOD-11 | Finanzierungsmanager | `finanzierungsmanager` (bleibt, war schon korrekt) |
| MOD-12 | **Akquisemanager** | `akquise-manager` (bleibt, nur Display-Name ohne Bindestrich) |
| MOD-10 | **Leadmanager** | `leads` (bleibt) |

**Wichtig:** Nur die Display-Namen (Labels) aendern sich. Routen, Dateinamen und Komponenten-Namen bleiben unveraendert — kein Breaking Change.

---

## Betroffene Stellen

### 1. routesManifest.ts (SSOT fuer Namen)

| Zeile | Alt | Neu |
|-------|-----|-----|
| 332 | `name: "Vertriebspartner"` | `name: "Vertriebsmanager"` |
| 356 | `name: "Abrechnung"` | `name: "Leadmanager"` |
| 396 | `name: "Akquise-Manager"` | `name: "Akquisemanager"` |
| 415 | `name: "Projekte"` | `name: "Projektmanager"` |

MOD-11 bleibt unveraendert ("Finanzierungsmanager" ist bereits korrekt).

### 2. tile_catalog (Datenbank)

3 UPDATE-Statements:

```sql
UPDATE tile_catalog SET title = 'Vertriebsmanager' WHERE tile_code = 'MOD-09';
UPDATE tile_catalog SET title = 'Leadmanager' WHERE tile_code = 'MOD-10';
UPDATE tile_catalog SET title = 'Projektmanager' WHERE tile_code = 'MOD-13';
```

(MOD-12 muss ebenfalls geprueft werden — aktuell steht dort vermutlich "Akquise-Manager".)

### 3. ModulePageHeader-Titel in Seitenkomponenten

| Datei | Alt | Neu |
|-------|-----|-----|
| `ProjekteDashboard.tsx` | `title="PROJEKTE"` | `title="PROJEKTMANAGER"` |
| `AkquiseDashboard.tsx` | `title="AKQUISE-MANAGER"` | `title="AKQUISEMANAGER"` |
| Vertriebspartner-Tabs (KatalogTab, BeratungTab, KundenTab, etc.) | ggf. Referenzen | Pruefen und anpassen |
| `ProvisionenUebersicht.tsx` | Pruefen | `title="LEADMANAGER"` |

### 4. TermsGatePanel.tsx (Rollen-Labels)

```
akquise_manager: 'Akquise-Manager' → 'Akquisemanager'
vertriebspartner: 'Vertriebspartner' → 'Vertriebsmanager'
```

### 5. goldenPathProcesses.ts

```
moduleName: 'Akquise Manager' → 'Akquisemanager'
```

### 6. Sonstige String-Referenzen

- `CommissionApproval.tsx`: `vertriebspartner: 'Vertriebsp.'` bleibt (Kurzform)
- `sotWebsiteModules.ts`: Kommentare aktualisieren
- `demoDataManifest.ts`: Pruefen auf Display-Strings

---

## Was sich NICHT aendert

- **Routen**: Alle URL-Pfade (`/portal/vertriebspartner`, `/portal/leads`, `/portal/projekte`, `/portal/akquise-manager`) bleiben identisch
- **Dateinamen**: `VertriebspartnerPage.tsx`, `LeadsPage.tsx`, `ProjektePage.tsx`, `AkquiseManagerPage.tsx` bleiben
- **Komponenten-Namen**: Alle React-Komponenten behalten ihre Namen
- **Datenbank-Tabellen**: Keine Schema-Aenderungen
- **Immobilienakte / Stammdaten**: Nicht betroffen

## Umsetzungsschritte

| Schritt | Beschreibung |
|---------|-------------|
| 1 | **DB-Migration**: `tile_catalog` Titel fuer MOD-09, MOD-10, MOD-12, MOD-13 aktualisieren |
| 2 | **routesManifest.ts**: 4 `name`-Felder aendern |
| 3 | **ModulePageHeader**: Titel in Dashboard-/Uebersichts-Komponenten anpassen |
| 4 | **TermsGatePanel.tsx**: Rollen-Labels aktualisieren |
| 5 | **goldenPathProcesses.ts**: moduleName-Strings anpassen |
| 6 | **Kommentare/Docs**: Referenzen in Kommentaren bereinigen |

