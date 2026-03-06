

# ENG-VALUATION — Komplette Engine-Überarbeitung: IST/SOLL-Plan

## Kernproblem

Es gibt **zwei getrennte Berechnungspfade**, die nicht synchron sind:
1. **Edge Function** (`supabase/functions/sot-valuation-engine/index.ts`) — der tatsächlich produktive Code
2. **Client Engine** (`src/engines/valuation/engine.ts`) — nie aufgerufen, theoretisch korrektere Logik

Die Edge Function enthält vereinfachte Formeln, die zu systematischer Unterbewertung führen (~38% unter Markt).

---

## IST/SOLL pro Berechnungskomponente

### 1. Ertragswert

| Aspekt | IST (Edge Function) | SOLL (ImmoWertV-konform) |
|--------|---------------------|--------------------------|
| Formel | `NOI / cap_rate + bodenwert` | `(Reinertrag − Bodenertrag) × Barwertfaktor + Bodenwert` |
| Bewirtschaftung | Pauschal 25% | Differenziert: Verwaltung 5% + Instandhaltung 12€/m²/a + Mietausfall 2% + Nicht-umlagefähig 3% |
| Liegenschaftszins | Flat 4,5% | Dynamisch nach Objektart: MFH 5%, ETW 3,5%, EFH 3%, Gewerbe 6% |
| Barwertfaktor | **Fehlt komplett** | `(1 − (1+i)^(−n)) / i` mit Restnutzungsdauer |
| Restnutzungsdauer | Nicht berechnet | `max(10, Gesamtnutzungsdauer − Alter)`, GND je Typ (MFH=80, EFH=80, ETW=80) |
| Bodenwert-Abzug | Additiv (korrekt) | Reinertrag minus Bodenertrag, dann Vervielfältiger, dann Bodenwert addieren |

**Auswirkung:** Ohne Barwertfaktor wird der Ertragswert bei kurzer Restnutzungsdauer massiv überschätzt und bei langer unterschätzt. Die pauschale 25% Bewirtschaftung ist für MFH zu hoch.

### 2. Sachwert

| Aspekt | IST (Edge Function) | SOLL |
|--------|---------------------|------|
| Herstellkosten-Basis | 1.100–2.400 €/m² (6 Cluster) | Cluster erweitern + differenzieren nach Objekttyp |
| BPI-Faktor | 1,38 (fix) | Korrekt für 2010→2026, aber Cluster-Basisjahre nicht konsistent |
| AfA-Maximum | 50% (0,01/a) | 70% max (engine.ts hat 70%, Edge hat 50% — Divergenz!) |
| Bodenwert | Nur wenn `plot_area_sqm > 0` | **Heuristik wenn fehlt:** MFH→`living_area * 1.5`, EFH→`living_area * 3`, ETW→`living_area * 0.3` |
| Bodenrichtwert-Proxy | 180/280/400 €/m² (3 Stufen) | 5 Stufen: 120/200/300/400/550 nach Lage-Score + Stadtgröße |
| Marktanpassungsfaktor | **Fehlt** | Sachwert-Marktanpassung ×1,0–1,3 je nach Lage/Nachfrage |

**Auswirkung:** Parkweg-Case: plot_area_sqm = null → Bodenwert = 0 → Sachwert viel zu niedrig. AfA-Cap bei 50% statt 70% macht bei Altbauten einen Unterschied.

### 3. Comp-Proxy

| Aspekt | IST | SOLL |
|--------|-----|------|
| Suchstrategie | 2 Queries (MFH + Haus) | 3+ Queries: spezifisch → breit → direkte Portal-URLs |
| price_per_sqm | Verlässt sich auf AI-Extraktion | **Post-Processing Pflicht:** Wenn AI kein price_per_sqm liefert aber price + area vorhanden → berechnen |
| Deduplication | Keine | URL-basierte Deduplizierung |
| Plausibilitätsfilter | `price > 0` | Preisfilter: 500–15.000 €/m², Flächenfilter: ±50% vom Zielobjekt |
| Gewichtung bei Ausfall | Umverteilung vorhanden | Korrekt implementiert (75/25) |

### 4. Bodenwert (Querschnitt)

| Aspekt | IST | SOLL |
|--------|-----|------|
| plot_area_sqm fehlt | Bodenwert = 0 | **Heuristik-Fallback nach Objekttyp** |
| Bodenrichtwert-Proxy | 3 Stufen, nur nach Location-Score | 5 Stufen, zusätzlich Einwohnerzahl/Stadtgröße als Proxy |
| Wenn Location-Score = 0 | 180 €/m² (zu niedrig für Mittelstadt) | Mindestens 200 €/m² als Floor, Stadt-Erkennung |

### 5. Gewichtung / Fusion

| Aspekt | IST | SOLL |
|--------|-----|------|
| 3 Methoden | 50/35/15 | Korrekt |
| 2 Methoden (ohne Comp) | 75/25 | Korrekt |
| Confidence-Multiplikator | `value × weight × confidence` | Problematisch: Sachwert mit conf 0.3 wird auf 30% skaliert, dann durch totalWeight geteilt — Ergebnis driftet stark Richtung Ertrag |
| **SOLL-Änderung** | — | Confidence als Qualitäts-Indikator nutzen, **aber nicht als Wert-Multiplikator** in der Fusion. Stattdessen: Gewicht × Confidence → normalisierte Gewichte, dann `weightedSum / normalizedTotalWeight` |

### 6. Divergenz Client-Engine vs Edge Function

| Funktion | Client `engine.ts` | Edge Function | Aktion |
|----------|-------------------|---------------|--------|
| `calculateErtragswert` | Barwertfaktor, differenzierte Bewirtschaftung | Vereinfacht (NOI/cap_rate) | Edge Function auf Client-Logik upgraden |
| `calculateSachwertProxy` | AfA max 70%, plotArea-Fallback `area*0.5` | AfA max 50%, kein Fallback | Angleichen |
| `fuseValueBand` | Normalisierte Gewichte, Spread aus Methoden-Divergenz | Confidence als Multiplikator | Edge auf Client-Logik upgraden |
| `calculateLienProxy` | 4+ Risikotreiber, dynamischer Discount | 3 fixe Faktoren | Angleichen |
| `deriveErtragswertParams` | Existiert, mit Liegenschaftszins + Bodenwert | Nicht genutzt | Logik in Edge übernehmen |

---

## Konkrete Umsetzungsschritte

### Schritt 1: Bodenwert-Heuristik (Edge Function)
**Datei:** `sot-valuation-engine/index.ts` Zeile 1025
- Wenn `plot_area_sqm` fehlt → Heuristik nach Objekttyp:
  - MFH: `living_area × 1.5`
  - EFH/DHH: `living_area × 3.0`
  - ETW: `living_area × 0.3`
  - Default: `living_area × 1.0`
- Bodenrichtwert-Proxy erweitern auf 5 Stufen + Stadt-Floor (200 €/m² minimum für Städte > 20k Einwohner)

### Schritt 2: Ertragswert auf ImmoWertV upgraden (Edge Function)
**Datei:** `sot-valuation-engine/index.ts` Zeilen 1033-1062
- Bewirtschaftung differenziert (aus `spec.ts` BEWIRTSCHAFTUNG_DEFAULTS)
- Liegenschaftszins nach Objekttyp: MFH 5%, ETW 3,5%, EFH 3%
- Restnutzungsdauer berechnen: `max(10, 80 − Alter)`
- Barwertfaktor implementieren: `(1 − (1+i)^(−n)) / i`
- Bodenertrag abziehen vor Vervielfältigung
- Formel: `(Reinertrag − Bodenzins) × Barwertfaktor + Bodenwert`

### Schritt 3: Sachwert korrigieren (Edge Function)
**Datei:** `sot-valuation-engine/index.ts` Zeilen 1080-1097
- AfA-Maximum auf 70% anheben (wie in engine.ts)
- Bodenwert aus Schritt 1 nutzen (bereits implementiert)
- Marktanpassungsfaktor: ×1.0 bis ×1.2 nach Location-Score

### Schritt 4: Comp-Suche robuster machen (Edge Function)
**Datei:** `sot-valuation-engine/index.ts` Zeilen 889-1013
- price_per_sqm Post-Processing: Wenn fehlt aber price + area vorhanden → berechnen
- Plausibilitätsfilter: 500–15.000 €/m²
- URL-Deduplication
- Dritte Suchstufe: direkte Portal-URL scrapen

### Schritt 5: Fusion/Gewichtung korrigieren (Edge Function)
**Datei:** `sot-valuation-engine/index.ts` Zeilen 1099-1145
- Confidence nicht als Wert-Multiplikator, sondern als Gewichts-Modifikator
- Normalisierte Gewichte: `w_i × conf_i / Σ(w_j × conf_j)`
- Spread aus tatsächlicher Methoden-Divergenz berechnen (wie in engine.ts)

### Schritt 6: Client-Engine synchronisieren
**Datei:** `src/engines/valuation/engine.ts`
- Herstellkosten-Cluster aktualisieren (BPI-Faktor einbauen)
- `deriveErtragswertParams`: Liegenschaftszins nach Objekttyp
- `calculateSachwertProxy`: plotArea-Fallback nach Objekttyp (statt pauschal `area * 0.5`)

### Schritt 7: spec.ts erweitern
**Datei:** `src/engines/valuation/spec.ts`
- Neue Konstante: `LIEGENSCHAFTSZINS_BY_TYPE`
- Neue Konstante: `PLOT_AREA_HEURISTIC_BY_TYPE`
- Neue Konstante: `BODENRICHTWERT_STUFEN` (5 statt 3)
- Neue Konstante: `GESAMTNUTZUNGSDAUER_BY_TYPE`
- BPI_FACTOR als exportierte Konstante

---

## Erwartete Wertkorrektur (Parkweg-Case)

```text
AKTUELL (V7.1):
  Ertragswert: 460.000 € (NOI/cap_rate, kein Bodenwert)
  Sachwert:    135.000 € (flat, kein Bodenwert, AfA 50%)
  P50:         ~413.000 €

NACH ÜBERARBEITUNG:
  Bodenwert:   ~150.000 € (Heuristik: 205m² × 1.5 = 308m², × 400€/m²)
  
  Ertragswert: 
    Rohertrag:          24.120 € (2.010 × 12)
    Bewirtschaftung:    −3.780 € (differenziert: 5%+12€/m²+2%+3%)
    Reinertrag:         20.340 €
    Bodenertrag:        −7.500 € (150k × 5%)
    Gebäude-Reinertrag: 12.840 €
    Barwertfaktor:      ×14,1 (32 Jahre RND bei 5%)
    Gebäude-Ertrag:     181.044 €
    + Bodenwert:        150.000 €
    = Ertragswert:      ~331.000 €

  Hmm — das ist niedriger als vorher. Problem: Die Miete von 2.010€/mtl
  für 205m² ist nur 9,80 €/m² — unter dem Gemini-Referenzwert von 11,50-13,50.
  
  Bei Marktmiete 12€/m²:
    Rohertrag:          29.520 € (205 × 12 × 12)
    Bewirtschaftung:    −4.530 €
    Reinertrag:         24.990 €
    Bodenertrag:        −7.500 €
    Gebäude-Reinertrag: 17.490 €
    × 14,1:             246.609 €
    + 150.000:          396.609 €
    = Ertragswert:      ~397.000 €

  Sachwert:
    Herstellkosten:     1.500 × 1.38 = 2.070 €/m²
    Gebäude:            205 × 2.070 = 424.350 €
    AfA 48% (70% max):  −203.688 €
    Gebäude nach AfA:   220.662 €
    + Bodenwert:        150.000 €
    × Marktanpassung 1.1: 407.728 €
    = Sachwert:         ~408.000 €

  Comp-Proxy (wenn funktioniert):
    Median ~3.400 €/m² × 205 = 697.000 €

  Fusion (3 Methoden, 50/35/15):
    P50 = (397k×0.50 + 697k×0.35 + 408k×0.15) / 1.0
        = 198.5k + 244k + 61.2k = 503.700 €
    
  Fusion (2 Methoden ohne Comp, 75/25):
    P50 = (397k×0.75 + 408k×0.25) = 399.750 €
```

Die Berechnung zeigt: Der Barwertfaktor senkt den Ertragswert bei alten Gebäuden. Das ist mathematisch korrekt, führt aber bei kurzer Restnutzungsdauer zu niedrigeren Werten. Der **Comp-Proxy ist entscheidend** für marktgerechte Ergebnisse.

**Strategische Entscheidung nötig:** Soll der Ertragswert im vereinfachten Modus (NOI/cap_rate + Bodenwert) bleiben — was bei MFH näher am Markt liegt — oder auf die formale ImmoWertV-Methode mit Barwertfaktor umgestellt werden?

---

## Freeze-Anforderungen

- `UNFREEZE INFRA-edge_functions` — für Edge Function
- `UNFREEZE ENG-VALUATION` — für spec.ts + engine.ts (aktuell **nicht** gefroren laut engines_freeze.json)
- spec.ts/engine.ts: ENG-VALUATION ist `frozen: false` → frei editierbar

---

## Offene Entscheidung

Bevor ich implementiere, brauche ich eine Richtungsentscheidung:

**A) Vereinfachter Ertragswert** (NOI/cap_rate + Bodenwert)
- Näher am Marktpreis bei MFH
- Einfacher, robuster
- Nicht ImmoWertV-konform

**B) Formaler Ertragswert** (Barwertfaktor, differenzierte Bewirtschaftung)
- Fachlich korrekt (ImmoWertV)
- Bei kurzer Restnutzungsdauer deutlich niedrigere Werte
- Erfordert verlässliche Comp-Daten als Gegengewicht

**C) Hybrid** — Vereinfacht als Basis, Barwertfaktor nur als Plausibilitäts-Check im Report anzeigen

