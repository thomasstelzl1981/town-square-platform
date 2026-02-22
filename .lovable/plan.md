

## Bugfixes & Cleanup — Post-Publish Stabilisierung

### 1. P0 Bug: `deriveYearlyRent` ohne `effectivePrice`

**Datei:** `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` (MOD-12, bereits unfrozen)

Zeile 116: `deriveYearlyRent(offer)` wird ohne den Override-Preis aufgerufen. Wenn `noi_indicated` fehlt, rechnet die Funktion mit `price_asking` statt dem Gegenvorschlag.

**Fix:** `deriveYearlyRent(offer)` aendern zu `deriveYearlyRent(offer, effectivePrice)`

Problem: `effectivePrice` wird in Zeile 115 definiert und `yearlyRent` in Zeile 116 — die Reihenfolge ist korrekt, der Parameter fehlt nur.

---

### 2. TypeScript Cleanup: `as any` Casts in AnalysisTab.tsx

**Datei:** `src/pages/portal/akquise-manager/components/AnalysisTab.tsx` (MOD-12)

31 `as any` Casts fuer `geomapData` und `aiSummary`. Fix: Zwei lokale Interfaces definieren und die Variablen typisiert casten.

```text
interface GeoMapResult {
  avgRentPerSqm?: string | number;
  avgPricePerSqm?: string | number;
  vacancyRate?: string | number;
  populationTrend?: string;
  summary?: string;
}

interface AiSummaryResult {
  summary?: string;
  risks?: string[];
  opportunities?: string[];
}
```

Dann einmal typisiert casten statt 11x `as any`:
```text
const geo = geomapData as GeoMapResult | null;
const ai = aiSummary as AiSummaryResult | null;
```

---

### 3. PWA Meta-Tag Update

**Datei:** `index.html` (kein Modul, frei editierbar)

`apple-mobile-web-app-capable` ist deprecated. Zusaetzlich `mobile-web-app-capable` hinzufuegen (das bestehende Apple-Tag bleibt fuer aeltere iOS-Versionen).

---

### 4. Module Unfreeze: MOD-07, 08, 09, 10, 11

**Datei:** `spec/current/00_frozen/modules_freeze.json` (kein Modul, frei editierbar)

Setze `frozen: false` und `unfrozen_at: "2026-02-22"` fuer MOD-07, MOD-08, MOD-09, MOD-10, MOD-11.

---

### Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `ObjekteingangDetail.tsx` | Zeile 116: `effectivePrice` als zweiten Parameter uebergeben |
| `AnalysisTab.tsx` | 2 Interfaces hinzufuegen, 11x `as any` durch typisierte Variablen ersetzen |
| `index.html` | `mobile-web-app-capable` Meta-Tag hinzufuegen |
| `modules_freeze.json` | MOD-07/08/09/10/11 auf `frozen: false` setzen |

