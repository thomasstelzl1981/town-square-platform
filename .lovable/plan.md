

## MFH-Einheiten-Bewertung: Einzelwohnungs-basierte Gutachten

### Problem

Die Engine behandelt ein MFH als monolithisches Objekt: `living_area_sqm = 200m²` (Summe aller Units). Das verzerrt die Bewertung massiv:

```text
IST (falsch):                          SOLL (korrekt):
┌──────────────────────┐               ┌──────────────────────┐
│ 1× MFH, 200m²       │               │ WE-01: 55m², ETW     │
│ Comps: "MFH 200m²"  │               │ WE-02: 55m², ETW     │
│ → findet Villen,     │               │ WE-03: 90m², ETW     │
│   unsanierte Häuser  │               │ Comps: "Wohnung 55m²"│
│ → €/m² zu niedrig    │               │ → findet passende ETW│
└──────────────────────┘               │ → €/m² marktgerecht  │
                                       └──────────────────────┘
```

**Trockenlauf-Vergleich** (Parkweg 17, Bogen, BJ 1990, kernsaniert 2021):

| Szenario | Fläche | Typ für Comps | erwarteter €/m² | Gesamtwert |
|---|---|---|---|---|
| IST: 1× MFH 200m² | 200m² | "MFH kaufen Bogen" | ~1.500-2.000 | ~300-400k |
| SOLL: 3× ETW einzeln | 55+55+90m² | "Wohnung kaufen Bogen" | ~2.500-3.500 | ~500-700k |

Die Differenz entsteht, weil einzelne kernsanierte Wohnungen pro m² deutlich höher bewertet werden als ein "ganzes MFH" in ländlicher Lage.

### Lösung: Unit-aware Valuation für MFH

**Strategie:** Wenn `property_type = MFH` und `units.length > 1`, bewertet die Engine jede Einheit einzeln als ETW und aggregiert die Ergebnisse.

### Änderungen

**1. `supabase/functions/sot-valuation-engine/index.ts`**

a) `buildServerSSOTSnapshot` erweitern:
- Neues Feld `units_detail: Array<{id, area_sqm, rooms, floor, rent_cold}>` mit den Einzeldaten aller Units
- Neues Flag `mfh_multi_unit: true` wenn MFH + units > 1

b) Stage 3 (Comps): Wenn `mfh_multi_unit`:
- Statt "MFH kaufen {city}" → "Wohnung kaufen {city}" als Suchquery
- Comp-Filter: Vergleich gegen die **mittlere Einheitsgröße** (z.B. 67m²) statt Gesamtfläche
- Toleranzband auf Einheitsgröße anpassen

c) Stage 4 (Berechnung): Wenn `mfh_multi_unit`:
- Ertragswert: Bleibt unverändert (summierte Miete ist korrekt für Gesamtobjekt)
- Comp Proxy: `compStats.p50 × Gesamtfläche` — aber p50 basiert jetzt auf ETW-Comps (höherer €/m²)
- Sachwert: Bleibt unverändert (Herstellkosten sind flächenbasiert)
- Gemini-Recherche für Vergleichsmieten: Query als "Wohnung" statt "MFH"

d) Report-Daten: `units_detail` Array dem Result-Objekt hinzufügen für Darstellung im Report

**2. `src/engines/valuation/spec.ts`**

- Neues Interface `ValuationUnitDetail { id, areaSqm, rooms, floor, rentCold }`
- `ValuationResult` um `unitsDetail?: ValuationUnitDetail[]` und `mfhMultiUnit?: boolean` erweitern

**3. `src/components/shared/valuation/ValuationReportReader.tsx`**

- In Sektion 1 (Objektdaten): Wenn `mfhMultiUnit`, Einheiten-Tabelle anzeigen statt nur Gesamtfläche
- Hinweistext: "Bewertung auf Basis einzelner Wohneinheiten (ETW-Vergleich)"

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `supabase/functions/sot-valuation-engine/index.ts` | Unit-aware Snapshot, Comp-Query, Hinweis im Report |
| `src/engines/valuation/spec.ts` | UnitDetail Interface |
| `src/components/shared/valuation/ValuationReportReader.tsx` | Einheiten-Anzeige im Report |

### Nicht betroffen
- Ertragswert-Berechnung (arbeitet mit summierter Miete — korrekt für Gesamtobjekt)
- Beleihungswert (BelWertV-Berechnung bleibt identisch)
- Bodenwert (Grundstück gehört zum Gesamtobjekt)

