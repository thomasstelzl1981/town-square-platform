
# Vollständiger Fix-Plan: MOD-09 Vertriebspartner

## Übersicht der 5 Probleme

| # | Problem | Ursache | Priorität |
|---|---------|---------|-----------|
| 1 | Pipeline-Menüpunkt unnötig | Datei + Route noch vorhanden | P0 |
| 2 | Immobilie erscheint nicht im Katalog | Query fragt `annual_rent_income` ab, Spalte heißt `annual_income` | P0 |
| 3 | Beratung zeigt keine Objekte | Folge von Problem #2 | P0 |
| 4 | Index-Export nicht bereinigt | `PipelineTab` wird noch exportiert | P1 |
| 5 | Spec-Dokumente outdated | MOD-09 Spec enthält noch Pipeline | P1 |

---

## Lösung 1: Pipeline komplett entfernen

### 1.1 Datei löschen

```text
src/pages/portal/vertriebspartner/PipelineTab.tsx → LÖSCHEN
```

### 1.2 Export aus index.ts entfernen

**Datei:** `src/pages/portal/vertriebspartner/index.ts`

**Aktuelle Zeile 5 (zu löschen):**
```typescript
export { default as PipelineTab } from './PipelineTab';
```

**Neuer Inhalt der gesamten Datei:**
```typescript
export { default as KatalogTab } from './KatalogTab';
export { default as BeratungTab } from './BeratungTab';
export { default as KundenTab } from './KundenTab';
export { default as NetworkTab } from './NetworkTab';
```

### 1.3 Route aus Manifest entfernen

**Datei:** `src/manifests/routesManifest.ts` (Zeile 288)

**Aktuell (Zeilen 283-289):**
```typescript
tiles: [
  { path: "katalog", component: "KatalogTab", title: "Katalog" },
  { path: "beratung", component: "BeratungTab", title: "Beratung" },
  { path: "kunden", component: "KundenTab", title: "Kunden" },
  { path: "network", component: "NetworkTab", title: "Netzwerk" },
  { path: "pipeline", component: "PipelineTab", title: "Pipeline" },  // ← LÖSCHEN
],
```

**Neu:**
```typescript
tiles: [
  { path: "katalog", component: "KatalogTab", title: "Katalog" },
  { path: "beratung", component: "BeratungTab", title: "Beratung" },
  { path: "kunden", component: "KundenTab", title: "Kunden" },
  { path: "network", component: "NetworkTab", title: "Netzwerk" },
],
```

---

## Lösung 2: DB-Query fixen (Hauptursache für fehlende Immobilie)

**Datei:** `src/pages/portal/vertriebspartner/KatalogTab.tsx`

### Zeile 104: Spaltenname korrigieren

**Aktuell:**
```typescript
properties (address, city, property_type, total_area_sqm, annual_rent_income)
```

**Neu:**
```typescript
properties (address, city, property_type, total_area_sqm, annual_income)
```

### Zeile 123: Variable anpassen

**Aktuell:**
```typescript
const annualRent = props?.annual_rent_income || 0;
```

**Neu:**
```typescript
const annualRent = props?.annual_income || 0;
```

---

## Lösung 3: Spec-Dokumentation aktualisieren

**Datei:** `docs/modules/MOD-09_VERTRIEBSPARTNER.md`

### Änderung 1: Modul-Überschrift (Zeile ~44)
```markdown
## 2) ROUTE-STRUKTUR (5-Tile-Pattern)
→
## 2) ROUTE-STRUKTUR (4-Tile-Pattern)
```

### Änderung 2: Route-Tabelle — Pipeline-Zeile entfernen

### Änderung 3: Section 3.5 Pipeline komplett entfernen

---

## Zusammenfassung der Dateiänderungen

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/vertriebspartner/PipelineTab.tsx` | **LÖSCHEN** |
| `src/pages/portal/vertriebspartner/index.ts` | Zeile 5 entfernen |
| `src/manifests/routesManifest.ts` | Zeile 288 entfernen |
| `src/pages/portal/vertriebspartner/KatalogTab.tsx` | 2 Zeilen anpassen (104, 123) |
| `docs/modules/MOD-09_VERTRIEBSPARTNER.md` | Pipeline-Referenzen entfernen |

---

## Erwartetes Ergebnis

| Test | Route | Erwartetes Ergebnis |
|------|-------|---------------------|
| 1 | Navigation | Nur 4 Tiles: Katalog, Beratung, Kunden, Netzwerk |
| 2 | `/portal/vertriebspartner/katalog` | Musterimmobilie "Leipziger Straße 42" sichtbar |
| 3 | `/portal/vertriebspartner/beratung` | Musterimmobilie im Property-Grid |
| 4 | `/portal/vertriebspartner/pipeline` | 404 (Route existiert nicht mehr) |

---

## Technischer Hintergrund

### Root Cause für fehlende Immobilie
Die Supabase-Query in `KatalogTab.tsx` fragt das **nicht existierende** Feld `properties.annual_rent_income` ab. Das korrekte Feld heißt `annual_income` (entspricht dem DB-Schema). Dieser Fehler führt zu einem 400 Bad Request, wodurch keine Listings geladen werden.

### Pipeline-Entfernung
Die Pipeline war ursprünglich für Deal-Tracking gedacht, ist aber für Partner nicht relevant — Deals werden über Provisionen im "Netzwerk"-Tab abgebildet. Die Funktionalität war nie vollständig implementiert.
