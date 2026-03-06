

# ENG-VALUATION — Forensische Analyse & Korrekturplan

## Diagnose: Was genau schiefgelaufen ist

Ich habe das PDF, die DB-Daten (Case `3b960189`), den Edge-Function-Code und alle Mapper forensisch geprüft. Das Ergebnis ist **keine Premium-Frage** — es gibt **7 harte technische Bugs**, die das Gutachten auf Datenbankebene bereits ruinieren.

### Die 7 konkreten Bugs (mit DB-Beweis)

```text
┌─────────────────────────────────────────────────────────────────┐
│ BUG #1: Geocoding nutzt nur "Parkweg" ohne Stadt/PLZ           │
│ → location_analysis.available = FALSE                          │
│ → Keine Karten, kein Score, keine POIs, keine Reachability     │
│                                                                │
│ BUG #2: PCT() in pdfCiKit multipliziert NICHT ×100             │
│ → PCT(0.038) = "0,0 %" statt "3,8 %"                          │
│ → Alle Zins/Tilgung/LTV-Werte im PDF zeigen "0,0 %"           │
│                                                                │
│ BUG #3: Comp-Suche liefert 0 Treffer                           │
│ → comp_postings: [], comp_stats.available: false               │
│ → 35% Methodengewicht fällt komplett weg                       │
│                                                                │
│ BUG #4: Sachwert nutzt flat 2.500 €/m² statt spec.ts-Cluster  │
│ → spec.ts definiert HERSTELLKOSTEN_CLUSTERS nach Baujahr       │
│ → Edge Function ignoriert das und nutzt Konstantenwert         │
│                                                                │
│ BUG #5: Kein Bodenwert im Ertragswert                          │
│ → Ertragswert = NOI / cap_rate (vereinfachte DCF-Formel)       │
│ → Fehlt: Bodenwert (Bodenrichtwert × Grundstücksfläche)        │
│                                                                │
│ BUG #6: Gewichts-Umverteilung fehlt                            │
│ → Wenn Comps ausfallen: 35% Gewicht verschwindet einfach       │
│ → Verbleibende Methoden teilen sich die Last nicht auf          │
│                                                                │
│ BUG #7: LienProxy-Mapper liest falsches Feld                   │
│ → DB: market_value_band.p50 → Mapper: market_value_p50 → 0    │
│ → PDF zeigt "Marktwert P50: 0 €"                               │
└─────────────────────────────────────────────────────────────────┘
```

### Auswirkung auf den Wert

**Gemini-Referenz: ~707.000 €** vs. **Unser P50: 440.825 €** (−38%)

Warum:
- Ertragswert 460.000 € — plausibel, aber ohne Bodenwert zu niedrig
- Sachwert 259.727 € — viel zu niedrig (flat 2.500 €/m², 48% AfA)
- Comp Proxy: 0 € — komplett ausgefallen
- Gewichtung: 0.5×0.85 (Ertrag) + 0.15×0.3 (Sach) = eff. Gewicht nur 0.47, stark Ertrag-lastig

### DB-Beweis

| Feld | Wert in DB | Problem |
|------|-----------|---------|
| `lat` / `lng` | `null` | Geocoding lieferte nichts |
| `location_analysis.available` | `false` | Kein Standortblock |
| `comp_postings` | `[]` | 0 Comps |
| `comp_stats.available` | `false` | Kein Vergleich |
| `financing[0].interest_rate` | `0.038` ✓ | Korrekt in DB, Anzeige kaputt |
| `lien_proxy.market_value_band.p50` | `440825` | Mapper liest falsches Feld |

---

## Korrekturplan (6 Fixes)

### Voraussetzung: UNFREEZE INFRA-edge_functions

Alle Fixes außer #2 betreffen die Edge Function.

### Fix #1 — Geocoding-Adresse korrekt zusammenbauen

**Datei:** `supabase/functions/sot-valuation-engine/index.ts` (Zeile 744)

**Ist:** `const address = snapshot.address || snapshot.city || "";`
**Soll:** `const address = [snapshot.address, snapshot.postal_code, snapshot.city].filter(Boolean).join(', ');`

Damit wird "Parkweg, 94315 Straubing" an Google gesendet statt nur "Parkweg".

### Fix #2 — PCT-Funktion in pdfCiKit ×100 multiplizieren

**Datei:** `src/lib/pdf/pdfCiKit.ts` (Zeile 455-456)

**Ist:** `v.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'`
**Soll:** `(v * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'`

Das behebt: Zins, Tilgung, LTV — alle Prozentangaben im gesamten PDF.

### Fix #3 — Comp-Suche robuster machen

**Datei:** `supabase/functions/sot-valuation-engine/index.ts` (Stage 3)

Probleme:
1. Suchquery "MFH kaufen Straubing ca. 200m²" ist zu spezifisch für Firecrawl
2. Kein Fallback wenn 0 Treffer
3. Kein Apify-Fallback obwohl Token konfiguriert

Plan:
- Primärsuche: `"Mehrfamilienhaus kaufen ${city}"` (ohne m²-Filter)
- Wenn 0 Treffer: Relaxed-Suche: `"Haus kaufen ${city}"` 
- Wenn immer noch 0: Apify IS24-Scraper als Fallback (Token ist da)
- Mindestens die Portal-URLs direkt scrapen (immobilienscout24.de/Suche/de/bayern/straubing/...)

### Fix #4 — Sachwert: Herstellkosten-Cluster aus spec.ts nutzen

**Datei:** `supabase/functions/sot-valuation-engine/index.ts` (Stage 4, ~Zeile 1030)

**Ist:** Flat `SACHWERT_BASE_COST_SQM: 2500`
**Soll:** Cluster-Lookup nach Baujahr:
```
function getHerstellkostenSqm(yearBuilt: number): number {
  if (yearBuilt < 1950) return 1200;
  if (yearBuilt < 1970) return 1400;
  if (yearBuilt < 1990) return 1600;  // ← Parkweg 1978
  if (yearBuilt < 2010) return 2000;
  return 2600;
}
```

Plus **Baupreisindex-Korrektor** (2020→2026 ~+25%): `herstellkosten * 1.25`

Für Parkweg 1978: 1.600 × 1.25 = 2.000 €/m² → Sachwert = 199.79 × 2.000 × (1-0.48) = ~207.782 €

Und zusätzlich: **Bodenwert-Komponente** hinzufügen (wenn `plot_area_sqm` vorhanden):
- Bodenrichtwert-Proxy für Standardlagen: 300 €/m² (Stadt/gut), skalierbar
- Bodenwert = `plot_area_sqm × bodenwert_proxy`
- Gesamtsachwert = Gebäudesachwert + Bodenwert

### Fix #5 — Ertragswert um Bodenwert ergänzen

**Datei:** `supabase/functions/sot-valuation-engine/index.ts` (Stage 4, ~Zeile 985)

Der aktuelle Ertragswert ist: `NOI / cap_rate`. Das ist eine vereinfachte Income-Capitalisation.

Korrekt nach ImmoWertV:
```
Ertragswert = (NOI / Liegenschaftszins) + Bodenwert
```

Der Bodenwert muss additiv dazu. Ohne ihn fehlt bei einem MFH mit großem Grundstück ein erheblicher Wertanteil.

### Fix #6 — Gewichts-Umverteilung bei fehlenden Methoden

**Datei:** `supabase/functions/sot-valuation-engine/index.ts` (Stage 4, ~Zeile 1048)

**Ist:** Wenn comp_proxy fehlt, bleibt sein 35%-Gewicht einfach weg. Die Fusion teilt durch die Summe der vorhandenen Gewichte — aber da die Gewichte mit Confidence multipliziert werden, verzerrt das Ergebnis stark.

**Soll:** Explizite Umverteilung:
```
Wenn nur 2 Methoden: Ertrag 75%, Sachwert 25%
Wenn nur Ertrag: 100%
Wenn nur Sachwert: 100%
Alle 3: Standard-Gewichte (50/35/15)
```

### Fix #7 — LienProxy-Mapper korrigieren

**Datei:** `src/hooks/useValuationCase.ts` (Zeile 284)

**Ist:** `marketValueP50: raw.market_value_p50 ?? raw.marketValueP50 ?? raw.p50 ?? 0`
**Soll:** `marketValueP50: raw.market_value_p50 ?? raw.marketValueP50 ?? raw.market_value_band?.p50 ?? raw.p50 ?? 0`

Das DB-Feld heißt `market_value_band` (ein Objekt mit p50), nicht `market_value_p50`.

Analog `totalDiscount`:
**Ist:** `raw.total_discount ?? raw.totalDiscount ?? 0`
**Soll:** `raw.total_discount ?? raw.totalDiscount ?? raw.risk_discount ?? 0`

---

## Auswirkung auf den Wert (Prognose nach Fixes)

```text
Ertragswert:    460.000 € (bleibt)  + Bodenwert ~150.000 € = ~610.000 €
  → Gewicht 75% (da keine Comps)
  
Sachwert:       ~208.000 € (Gebäude) + ~150.000 € (Boden) = ~358.000 €
  → Gewicht 25%
  
P50 = 0.75 × 610.000 × 0.85  +  0.25 × 358.000 × 0.3
    = 388.875 + 26.850
    / (0.75 × 0.85 + 0.25 × 0.3)
    = 415.725 / 0.7125
    = ~583.000 €

Mit Comps (geschätzt ~3.400 €/m² → 679.000 €):
P50 ≈ 620.000 – 660.000 €
```

Das wäre deutlich näher am Gemini-Referenzwert (707k), aber konservativer — was für ein automatisiertes Tool korrekt ist.

---

## Reihenfolge der Umsetzung

1. **Fix #2** — PCT in pdfCiKit (kein Unfreeze nötig, `src/lib/pdf/`)
2. **Fix #7** — LienProxy-Mapper (kein Unfreeze nötig, `src/hooks/`)
3. **Fix #1** — Geocoding-Adresse (Edge Function — braucht Unfreeze)
4. **Fix #4+5** — Sachwert-Cluster + Bodenwert + Ertragswert-Bodenwert (Edge Function)
5. **Fix #6** — Gewichts-Umverteilung (Edge Function)
6. **Fix #3** — Comp-Suche robust (Edge Function)

Fixes 1-2 und 7 sind Einzeiler. Fixes 3-6 sind inhaltlich umfangreicher.

## Freeze-Anforderungen

- `UNFREEZE INFRA-edge_functions` — für Fixes 1, 3, 4, 5, 6
- `src/lib/pdf/pdfCiKit.ts` — nicht im Freeze-Scope, frei editierbar
- `src/hooks/useValuationCase.ts` — nicht im Freeze-Scope, frei editierbar

