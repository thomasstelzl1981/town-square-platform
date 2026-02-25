

## Plan: Probleme 1-3 beheben — TypeScript-Typen, Cache-Invalidation, as-any-Casts

**Problem 4 (Aufteiler-Kalkulation):** Bestaetigt — keine AfA noetig, Objekt ist im Umlaufvermoegen. Wird NICHT veraendert.

### Freeze-Check
- MOD-13: `frozen: false` — Aenderungen erlaubt.
- Alle betroffenen Dateien liegen in MOD-13 Pfaden oder sind shared Types.

---

### Problem 1: TypeScript-Typ `DevProject` fehlen AfA-Felder

**Datei:** `src/types/projekte.ts`

`DevProject` (Z.68-101) wird erweitert um die fehlenden DB-Felder, die bereits in der DB existieren und via `select('*')` zurueckgegeben werden:

```typescript
// Nach Zeile 100 (vor dem schliessenden }):
// AfA & Steuerliche Parameter
afa_model: string | null;
afa_rate_percent: number | null;
land_share_percent: number | null;
// Erweiterte Projektdaten (aus DataSheet / Intake)
full_description: string | null;
location_description: string | null;
construction_year: number | null;
total_area_sqm: number | null;
street: string | null;
house_number: string | null;
federal_state: string | null;
grest_rate_percent: number | null;
energy_source: string | null;
heating_type: string | null;
phase: string | null;
project_name: string | null;
intake_data: any;
invest_engine_analyzed: boolean;
```

`DevProjectUnit` (Z.127-156) wird erweitert um:

```typescript
// Nach Zeile 155 (vor dem schliessenden }):
hausgeld: number | null;
```

---

### Problem 2: Kein reaktiver Refresh nach DataSheet-Speicherung

**Datei:** `src/components/projekte/ProjectDataSheet.tsx`

Die Cache-Invalidation ist bereits vorhanden (Z.341): `queryClient.invalidateQueries({ queryKey: ['dev-projects'] })`. Das wurde in einer frueheren Iteration hinzugefuegt. **Kein weiterer Fix noetig hier.**

**Datei:** `src/components/projekte/ProjectAfaFields.tsx`

Die Cache-Invalidation ist ebenfalls bereits vorhanden (Z.68): `queryClient.invalidateQueries({ queryKey: ['dev-projects'] })`. **Kein weiterer Fix noetig hier.**

**ABER:** Der `InvestEngineTab` nutzt den Query-Key `dev_project_units_invest` fuer Units. Wenn die AfA-Werte im Projekt geaendert werden, muss der Tab die Projekt-Daten neu laden. Die Projekt-Daten kommen aus `useDevProjects()` mit Key `['dev-projects']` — das wird bereits invalidiert. Der InvestEngineTab muss aber wissen, dass er neu berechnen muss. Aktuell zeigt er die alten berechneten Werte im `metricsCache` an.

**Loesung:** Im `InvestEngineTab` den `metricsCache` zuruecksetzen wenn sich die Projekt-Daten aendern (via useEffect auf `fullProject`). Damit wird dem User signalisiert, dass er erneut auf "Berechnen" klicken muss.

---

### Problem 3: `(as any)` Casts entfernen

Nach der Typ-Erweiterung in Problem 1 koennen alle unsicheren Casts durch typsichere Zugriffe ersetzt werden:

| Datei | Zeilen | Cast | Wird zu |
|---|---|---|---|
| `InvestEngineTab.tsx` | Z.109 | `(fullProject as any).afa_model` | `fullProject.afa_model` |
| `InvestEngineTab.tsx` | Z.110 | `(fullProject as any).land_share_percent` | `fullProject.land_share_percent` |
| `InvestEngineTab.tsx` | Z.127 | `unit.hausgeld` | `unit.hausgeld` (jetzt im Typ) |
| `InvestEngineTab.tsx` | Z.292 | `(fullProject as any).afa_model` + `land_share_percent` | typsicher |
| `InvestEngineExposePage.tsx` | Z.95-96 | `(project as any).afa_model` + `land_share_percent` | typsicher |
| `InvestEngineExposePage.tsx` | Z.97 | `unit.hausgeld` | typsicher (jetzt im Typ) |
| `ProjectOverviewCard.tsx` | Z.266-268 | `(fullProject as any).afa_rate_percent/afa_model/land_share_percent` | typsicher |
| `ProjectDataSheet.tsx` | Z.334 | `updatePayload as any` | entfernen (Felder jetzt im Typ) |

---

### Zusaetzlicher Fix: metricsCache bei Projektaenderung invalidieren

**Datei:** `src/pages/portal/projekte/InvestEngineTab.tsx`

Neuer `useEffect` der den `metricsCache` leert wenn sich `fullProject` aendert:

```typescript
useEffect(() => {
  setMetricsCache({});
  setHasCalculated(false);
}, [fullProject?.afa_model, fullProject?.land_share_percent, fullProject?.afa_rate_percent]);
```

Damit sieht der User nach einer AfA-Aenderung im Datenblatt sofort, dass die Berechnung nicht mehr aktuell ist, und muss erneut auf "Berechnen" klicken.

---

### Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| `src/types/projekte.ts` | `DevProject` + 17 neue Felder, `DevProjectUnit` + 1 Feld (`hausgeld`) |
| `src/pages/portal/projekte/InvestEngineTab.tsx` | `(as any)` entfernen (4 Stellen) + metricsCache-Reset bei Projektaenderung |
| `src/pages/portal/projekte/InvestEngineExposePage.tsx` | `(as any)` entfernen (2 Stellen) |
| `src/components/projekte/ProjectOverviewCard.tsx` | `(as any)` entfernen (3 Stellen) |
| `src/components/projekte/ProjectDataSheet.tsx` | `as any` bei updatePayload entfernen |

### Was NICHT geaendert wird

| Punkt | Begruendung |
|---|---|
| Aufteiler-Kalkulation | Umlaufvermoegen — keine AfA noetig, korrekt so |
| `ProjectAfaFields.tsx` | Cache-Invalidation bereits vorhanden |
| Edge Function `sot-investment-engine` | Berechnet korrekt mit uebergebenen Inputs |
| Datenbank | Keine Schema-Aenderungen noetig — Spalten existieren bereits |

