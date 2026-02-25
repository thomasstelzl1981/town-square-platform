

## Konsolidierter Reparaturplan — 4 Frontend-Bugs in PortfolioTab

### Aktuelle DB-Lage (verifiziert)

| Datenpunkt | Status | Wert |
|---|---|---|
| Projekt `bbbf6f6f` | ✅ existiert | Menden Living |
| Units | ✅ 72 Stueck | project_id korrekt |
| purchase_price | ✅ | 11.730.863 |
| total_sale_target | ✅ | 14.077.035 |
| intake_data.construction_year | ✅ | 1980 |
| intake_data.modernization_status | ✅ | "gepflegt / modernisiert" |
| intake_data.reviewed_data.totalArea | ✅ | 6120.51 |
| storage_nodes (Ordner) | ✅ 443 | module_code = MOD-13 |
| storage_nodes (Dateien) | ✅ 2 | Expose + Preisliste mit storage_path + mime_type |

**Erkenntnis: Backend ist komplett korrekt. Alle 4 Bugs sind rein im Frontend.**

---

### BUG 1 — selectedProjectId bleibt leer (PortfolioTab.tsx Z.51)

**Problem:** `useState` wertet den Initialwert nur einmal aus. Beim ersten Render ist `portfolioRows = []`, daher bleibt `selectedProjectId = ''` fuer immer. Die Units-Query (Z.88 `enabled: !!selectedProjectId`) laeuft nie.

**Fix:** `useEffect` nach Z.51 einfuegen:
```typescript
useEffect(() => {
  if (portfolioRows.length > 0 && !selectedProjectId) {
    setSelectedProjectId(portfolioRows[0].id);
  }
}, [portfolioRows]);
```

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

---

### BUG 2 — Kalkulator-Defaults werden nie aktualisiert (PortfolioTab.tsx Z.92-96)

**Problem:** `investmentCosts` und `totalSaleTarget` werden beim ersten Render initialisiert, wenn `selectedProject` noch `null` ist. Danach werden die `useState`-Werte nie aktualisiert → Kalkulator zeigt Default 4.800.000 statt 11.730.863.

**Fix:** `useEffect` nach Z.102 einfuegen:
```typescript
useEffect(() => {
  if (selectedProject) {
    setInvestmentCosts(selectedProject.purchase_price || 0);
    setTotalSaleTarget(selectedProject.total_sale_target || 0);
  }
}, [selectedProject?.id]);
```

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

---

### BUG 3 — ProjectDMSWidget bekommt keine projectId (PortfolioTab.tsx Z.293-297)

**Problem:** Das Widget wird ohne `projectId` Prop aufgerufen. Es hat keine Moeglichkeit, die richtigen Storage-Nodes (Expose, Preisliste) aus der DB zu laden. Die 2 Dateien sind korrekt registriert, aber das Widget weiss nicht, welches Projekt es anzeigen soll.

**Fix Teil A — PortfolioTab Z.293:**
```typescript
<ProjectDMSWidget
  projectId={selectedProject?.id}
  projectName={selectedProject?.name || 'Projekt'}
  units={baseUnits}
  isDemo={isSelectedDemo}
/>
```

**Fix Teil B — ProjectDMSWidget.tsx:**
- Interface erweitern: `projectId?: string`
- Storage-Query hinzufuegen die `storage_nodes` mit `entity_id = projectId` und `node_type = 'file'` abfragt
- Dateien im entsprechenden Ordner anzeigen (Expose in 01_Expose, Preisliste in 02_Preisliste)
- Status-Bar: echte Dateianzahl statt hardcoded "0 Dateien"

**Dateien:** `src/pages/portal/projekte/PortfolioTab.tsx`, `src/components/projekte/ProjectDMSWidget.tsx`

---

### BUG 4 — intake_data Feld-Mapping falsch (ProjectOverviewCard.tsx Z.76)

**Problem:** Z.76 sucht `intake_data.total_area_sqm` — dieses Feld existiert nicht. Die Gesamtflaeche liegt in `intake_data.reviewed_data.totalArea` (verifiziert: 6120.51).

**Fix:** Z.76 ersetzen:
```typescript
const reviewedData = intakeData?.reviewed_data as Record<string, unknown> | null;
const totalAreaSqm = typeof intakeData?.total_area_sqm === 'number'
  ? intakeData.total_area_sqm
  : typeof reviewedData?.totalArea === 'number'
    ? reviewedData.totalArea
    : null;
```

**Datei:** `src/components/projekte/ProjectOverviewCard.tsx`

---

### Betroffene Dateien

| Datei | Bug | Aenderung |
|---|---|---|
| `src/pages/portal/projekte/PortfolioTab.tsx` | 1, 2, 3 | 2x useEffect + projectId Prop an DMS Widget |
| `src/components/projekte/ProjectDMSWidget.tsx` | 3 | projectId Prop + Storage-Query + Datei-Anzeige |
| `src/components/projekte/ProjectOverviewCard.tsx` | 4 | Fallback auf reviewed_data.totalArea |

---

### Virtueller Test

Nach Implementierung:
1. User oeffnet `/portal/projekte/projekte`
2. `portfolioRows` laedt async → `useEffect` setzt `selectedProjectId = 'bbbf6f6f-...'`
3. Units-Query feuert mit `enabled: true` → 72 Units laden
4. `selectedProject` wird gefunden → zweiter `useEffect` setzt `investmentCosts = 11.730.863`, `totalSaleTarget = 14.077.035`
5. `ProjectOverviewCard` liest `construction_year: 1980`, `totalArea: 6120.51` aus intake_data
6. `ProjectDMSWidget` erhaelt `projectId`, queried `storage_nodes` → findet 2 Dateien (Expose + Preisliste)
7. Kalkulator zeigt echte Werte statt Defaults

---

### Freeze-Check

MOD-13: `frozen: false` — Alle Aenderungen erlaubt

### Aufwand

~10 Minuten. Kein Backend-Aenderung noetig. Kein Projekt-Loeschen noetig — die Daten sind bereits korrekt in der DB.

