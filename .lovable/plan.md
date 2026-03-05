

# Audit: SLC-Kette (MOD-13 → MOD-08 → MOD-09 → Zone 3 Kaufy) — Rechner, Bilder, Buttons

## Zusammenfassung der Befunde

### 1. Investment Engine — Alle Module nutzen dieselbe Engine ✅

Alle vier Kontexte rufen `sot-investment-engine` über denselben Hook `useInvestmentEngine` auf:

| Kontext | Hook | Engine-Call |
|---------|------|-------------|
| MOD-13 InvestEngine Tab | `useInvestmentEngine` direkt | ✅ `sot-investment-engine` |
| MOD-13 Expose | `useProjectUnitExpose` → `useInvestmentEngine` | ✅ |
| MOD-08 Expose | `useExposeListing` → `useInvestmentEngine` | ✅ |
| MOD-09 Expose | `useExposeListing` → `useInvestmentEngine` | ✅ |
| Zone 3 Kaufy | `useExposeListing` → `useInvestmentEngine` | ✅ |
| Zone 3 ProjectLanding | `useProjectUnitExpose` → `useInvestmentEngine` | ✅ |

**Ergebnis: Identische Engine. Kein Duplikat.**

---

### 2. AfA + Gebäudeanteil — INKONSISTENZ GEFUNDEN ⚠️

**Problem:** Die AfA-Parameter kommen aus **zwei verschiedenen Quellen**, je nach Pfad:

**Pfad A — MOD-13 (Projekte):** `useProjectUnitExpose` und `InvestEngineTab`
- Liest `afa_model`, `land_share_percent`, `afa_rate_percent` direkt aus `dev_projects`
- Diese Werte werden im Projekt-Datenblatt gepflegt
- ✅ Korrekt: Projekt-spezifische Werte

**Pfad B — MOD-08, MOD-09, Kaufy:** `useExposeListing`
- Liest AfA-Overrides aus `property_accounting` (Zeile 177-188)
- Lookup: `property_accounting.property_id = listing.property_id`
- **Problem:** Wenn für das Listing keine `property_accounting`-Einträge existieren, fallen die Werte auf **Defaults** zurück (`buildingShare: 0.8`, `afaModel: 'linear'`)
- Diese Defaults stimmen möglicherweise **NICHT** mit den Projekt-Datenblatt-Werten überein

**Konkretes Szenario:** Ein Projekt hat `afa_model: '7b'` und `land_share_percent: 15` im Datenblatt. Wenn über MOD-13 → Vertrieb Listings erstellt werden, aber kein `property_accounting`-Eintrag angelegt wird, zeigen MOD-08/09/Kaufy die falschen AfA-Werte (linear statt 7b, 80% statt 85% Gebäudeanteil).

**Fix:** `useExposeListing` muss einen Fallback auf `dev_projects`-Daten implementieren, wenn das Listing aus einem Projekt stammt. Alternativ: Die `CreatePropertyFromUnits`-Funktion muss zwingend `property_accounting` befüllen.

---

### 3. Bilder in MOD-08 / MOD-09 — DEFEKT ⚠️

**Problem:** Die `ExposeImageGallery` sucht Bilder über:
```
document_links WHERE object_type = 'property' AND object_id = propertyId
```

**Für Projekt-Units:** `useProjectUnitExpose` setzt `property_id: unit.property_id || unit.id`. Wenn `unit.property_id` `null` ist (Einheit hat noch keine verknüpfte Property), wird `unit.id` verwendet — aber es gibt keine `document_links` mit `object_id = unit.id`.

**Für Listings (MOD-08/09/Kaufy):** `useExposeListing` nutzt `listing.property_id` aus der `listings`-Tabelle. Die Bilder werden nur gefunden, wenn:
1. Das Listing eine korrekte `property_id` hat
2. Für diese Property `document_links` mit `object_type = 'property'` existieren

**Wahrscheinliche Ursache:** Wenn Listings über `CreatePropertyFromUnits` aus Projekt-Einheiten erstellt werden, werden die Bilder möglicherweise nicht als `document_links` für die neue Property migriert. Die Bilder liegen wahrscheinlich als `document_links` mit `object_type = 'project'` oder `object_type = 'dev_project_unit'` vor.

**Fix:** Entweder:
- a) `ExposeImageGallery` erweitern: Fallback-Query auf `document_links WHERE object_type = 'project' AND object_id = projectId`
- b) `CreatePropertyFromUnits` fixen: Bilder beim Erstellen der Property als `document_links` kopieren
- c) Beide Ansätze kombinieren

---

### 4. Speichern-Button MOD-13 Preisliste ✅

Die `savePreisliste`-Mutation (PortfolioTab.tsx, Zeile 242-290) ist korrekt implementiert:
- Sammelt Price- und Status-Overrides
- Schreibt per `supabase.from('dev_project_units').update()` in die DB
- Invalidiert den Query-Cache nach Erfolg
- Button ist jetzt immer sichtbar (unser Fix) mit `disabled={!hasUnsavedChanges}`

---

### 5. Analyse-Button MOD-13 InvestEngine ✅

Der "Berechnen"-Button (InvestEngineTab.tsx, Zeile 103-152) ist korrekt:
- Iteriert über alle Units des Projekts
- Ruft für jede Unit `calculate()` mit Projekt-spezifischen AfA-Werten auf
- Setzt `invest_engine_analyzed: true` Flag in `dev_projects`
- Caching der Ergebnisse in `metricsCache`

---

## Implementierungsplan

### Fix 1: AfA-Konsistenz in `useExposeListing` (KRITISCH)

**Datei:** `src/hooks/useExposeListing.ts`

Wenn `property_accounting` keine Daten liefert, prüfen ob das Listing aus einem Projekt stammt (über `dev_project_units` → `dev_projects`) und die AfA-Werte von dort laden.

Konkret: Nach dem `accountingData`-Query (Zeile 177-188) einen weiteren Fallback-Query einbauen, der über die `listings`-Tabelle → `properties` → `dev_project_units` → `dev_projects` die Projekt-Werte holt.

### Fix 2: Bilder für Projekt-Listings (KRITISCH)

**Datei:** `src/components/investment/ExposeImageGallery.tsx`

Erweitern um:
- Neuen optionalen Prop `projectId?: string`
- Wenn keine Bilder über `property`-Links gefunden werden, Fallback-Query: `document_links WHERE object_type = 'project' AND object_id = projectId`

**Dateien:** `src/hooks/useExposeListing.ts` + `src/hooks/useProjectUnitExpose.ts`
- `projectId` aus der Datenquelle durchreichen an `ExposeListingData`
- `InvestmentExposeView` muss `projectId` an `ExposeImageGallery` weitergeben

### Betroffene Module (Freeze-Check)
- `src/components/investment/*` → INFRA (muss geprüft werden in `infra_freeze.json`)
- `src/hooks/useExposeListing.ts` → Shared Hook, kein Modul-Pfad → frei editierbar
- `src/hooks/useProjectUnitExpose.ts` → Shared Hook → frei editierbar

### Nicht betroffen (funktioniert korrekt)
- Speichern-Button MOD-13 ✅
- Analyse-Button MOD-13 ✅
- Engine-Konsistenz (alle nutzen `sot-investment-engine`) ✅

