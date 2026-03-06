

# IST-Analyse vs. SOLL-Analyse: ValuationReportReader V9.0

## IST-Zustand (Was der Nutzer sieht)

Die aktuelle Anzeige zeigt **5 Kacheln** statt der geplanten 12 Sektionen. Die Ursache ist ein **dreifaches Key-Mismatch** zwischen Edge Function Output und ValuationReportReader:

### Problem 1: Method-Key Mismatch
Die Edge Function speichert `method: "ertragswert"`, aber der Reader sucht nach `method: "ertrag"` (Zeile 157):
```text
Edge Function:   { method: "ertragswert", value: 380503, params: { annual_rent: 17447, cap_rate: 0.035, ... } }
Reader sucht:    getMethodParams(methods, 'ertrag')  → findet NICHTS → alle Werte "–"
```

### Problem 2: Param-Key Mismatch (snake_case vs. camelCase)
Selbst wenn der Method-Key stimmen würde — der Reader erwartet camelCase, die Engine liefert snake_case:
```text
Engine liefert:              Reader erwartet:
─────────────────────────    ─────────────────────
annual_rent                  netColdRentYearly
cap_rate                     liegenschaftszins
bewirtschaftung_abzug        bewirtschaftungAbzug
bewirtschaftung_rate         bewirtschaftungRate
ertragswert_gebaeude         ertragswertGebaeude
bodenwert_source             bodenwertSource
base_cost_sqm                nhkPerSqm
```
**Ergebnis:** Sektion 4 (Bodenwert) zeigt "0 €", Sektion 5 (Ertragswert) zeigt Nullwerte, Liegenschaftszins zeigt 5%.

### Problem 3: geminiResearch Sub-Keys nicht gemappt
Der `useValuationCase` Hook gibt `geminiResearch` korrekt weiter, aber die Unter-Objekte bleiben in snake_case:
```text
DB/Hook:                         Reader erwartet:
─────────────────────────        ─────────────────────
bodenrichtwert_eur_sqm           bodenrichtwertEurSqm
marktwert_zins                   marktwertZins
miete_min/median/max             mieteMin/Median/Max
art_der_nutzung                  artDerNutzung
```
**Ergebnis:** Sektion 9 (Vorschlagswerte) zeigt "–" überall, obwohl Gemini BRW=180 €/m², LZ=3.5%, VM=8.5 €/m² geliefert hat.

### Problem 4: RND zeigt "0 Jahre" statt Berechnung
Der Reader sucht `ertragParams.gesamtnutzungsdauer`, `ertragParams.alter`, `ertragParams.modernisierungsbonus` — aber die Engine speichert nur `restnutzungsdauer` als Zahl im params-Objekt. Die GND/Alter-Felder werden nicht gespeichert.

### Problem 5: Beleihungswert-Sektion fehlt `bwkBelwertv`
Der Reader zeigt `fmtEur2(beleihungswert.bwkBelwertv || 0)` → Die Engine speichert diesen Wert nicht im `beleihungswertResult`-Objekt.

### Zusammenfassung IST
Von den 12 geplanten Sektionen werden nur 5 sichtbar:
1. ✅ Deckblatt (Marktwert-KPI funktioniert — p50 wird korrekt gelesen)
2. ❌ Grundbuch (nur wenn legalTitle befüllt — funktioniert bedingt)
3. ✅ Standortanalyse (Google Maps funktioniert — eigene Datenstruktur)
4. ❌ Bodenwert & RND → zeigt "0 €" und "– Jahre"
5. ❌ Ertragswert MWT → Jahresmiete "0", Liegenschaftszins "5%", BWK "0"
6. ❌ Ertragswert BWT → BWK fehlt
7. ❌ Sachwert → NHK "–", BPI "–"
8. ✅ Vergleichswert (eigene Comp-Datenstruktur — funktioniert)
9. ❌ Vorschlagswerte → alle "–"
10. ✅ Kennzahlen (Financing-Scenarios funktionieren)
11. ❌ Ergebnisübersicht → keine Gewichtungstabelle sichtbar
12. ✅ Rechtliche Hinweise (statisch — funktioniert immer)

---

## SOLL-Analyse (Komplett-Fix)

### Fix 1: ValuationReportReader — Method-Key + Param-Keys korrigieren

**Datei:** `src/components/shared/valuation/ValuationReportReader.tsx`

Zeile 157: `getMethodParams(methods, 'ertrag')` → `getMethodParams(methods, 'ertragswert')`

Alle Param-Zugriffe auf die snake_case Keys der Engine umstellen:

```text
SEKTION 4 — Bodenwert:
  ertragParams.plotAreaSqm      → ertragParams.plot_area_sqm  (NEIN — nicht in params)
  → Stattdessen: bodenwert, bodenwert_source direkt aus ertragParams lesen
  → GND/Alter/Bonus: Aus ertragParams.restnutzungsdauer + Rückrechnung

SEKTION 5 — Ertragswert MWT:
  ertragParams.netColdRentYearly    → ertragParams.annual_rent
  ertragParams.verwaltung           → ertragParams.verwaltung (✓ stimmt schon)
  ertragParams.instandhaltung       → ertragParams.instandhaltung (✓ stimmt)
  ertragParams.mietausfallwagnis    → ertragParams.mietausfall
  ertragParams.nichtUmlagefaehig    → ertragParams.nichtUmlagefaehig (✓ stimmt)
  ertragParams.bewirtschaftungAbzug → ertragParams.bewirtschaftung_abzug
  ertragParams.liegenschaftszins    → ertragParams.cap_rate
  ertragParams.reinertrag           → ertragParams.reinertrag (✓ stimmt)
  ertragParams.barwertfaktor        → ertragParams.barwertfaktor (✓ stimmt)
  ertragParams.restnutzungsdauer    → ertragParams.restnutzungsdauer (✓ stimmt)

SEKTION 7 — Sachwert:
  sachwertParams.nhkPerSqm          → sachwertParams.base_cost_sqm
  sachwertParams.bpiFactor          → NICHT vorhanden → BPI_FACTOR fest anzeigen
  sachwertParams.zeitwertGebaeude   → sachwertParams.gebaeude_sachwert
```

### Fix 2: geminiResearch camelCase-Mapping im useValuationCase

**Datei:** `src/hooks/useValuationCase.ts`

Die geminiResearch-Sub-Objekte müssen in camelCase konvertiert werden (Zeilen 384–393):

```text
liegenschaftszins:
  marktwert_zins → marktwertZins
  beleihungswert_zins → beleihungswertZins
  min/max/quelle/begruendung → bleiben gleich (lowercase)

bodenrichtwert:
  bodenrichtwert_eur_sqm → bodenrichtwertEurSqm
  art_der_nutzung → artDerNutzung
  quelle/stichtag/begruendung → bleiben gleich

vergleichsmieten:
  miete_min → mieteMin
  miete_median → mieteMedian
  miete_max → mieteMax
  quelle/begruendung → bleiben gleich
```

### Fix 3: Edge Function — Fehlende Felder im Ertragswert-params ergänzen

**Datei:** `supabase/functions/sot-valuation-engine/index.ts`

Im `ertragswertResult.params` (Zeile 943) folgende Felder hinzufügen:
```text
gesamtnutzungsdauer: gnd        (z.B. 80)
alter: sachAge                   (z.B. 40)
modernisierungsbonus: 0          (kein Bonus ohne Daten)
plot_area_sqm: plotAreaSqm       (für Bodenwert-Sektion)
bodenrichtwert_eur_sqm: bodenrichtwert  (für Anzeige)
```

Im `beleihungswertResult` (Zeile 1072) folgende Felder hinzufügen:
```text
bwk_belwertv: bwkBelwertv       (BWK-Betrag für Anzeige)
reinertrag_belwertv: reinertagBW
barwertfaktor_belwertv: bwfBW
```

### Fix 4: Ergebnisübersicht-Sektion (Sektion 11) im Reader vervollständigen

Die Gewichtungstabelle liest `valueBand.weightingTable` — der Hook mappt das bereits korrekt. Aber die Anzeige zeigt es nur wenn `weightingTable?.length > 0`. Das funktioniert — ABER: Es fehlt die Anzeige von Marktwert + Beleihungswert nebeneinander als Ergebnis-Highlight.

---

## Skizze SOLL: Alle 12 Sektionen nach Korrektur

```text
┌─────────────────────────────────────────────────┐
│ SEKTION 1 — DECKBLATT                           │
│ [StreetView Hero]                               │
│ ┌──────────────┐  ┌──────────────┐              │
│ │ MARKTWERT    │  │ BELEIHUNGS-  │              │
│ │  380.503 €   │  │ WERT         │              │
│ │              │  │  216.249 €   │              │
│ └──────────────┘  └──────────────┘              │
│ Konfidenz: 70% · Datenlage: 75% · LTV-Fenster  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 2 — GRUNDBUCH & EIGENTUM                │
│ (Nur bei SSOT_FINAL + legalTitle vorhanden)     │
│ Amtsgericht, Grundbuchblatt, Flurstück, ...     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 3 — STANDORTANALYSE                     │
│ [Mikrolage-Map]    [Makrolage-Map]              │
│ Score: 62/100                                   │
│ ÖPNV: 7 · Alltag: 6 · Familie: 5 · ...         │
│ POI-Tabelle + Erreichbarkeit                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 4 — BODENWERT & RND                     │
│ ┌─────────────────┐  ┌─────────────────┐       │
│ │ BODENWERT       │  │ RESTNUTZUNGSD.  │       │
│ │ Fläche: 533 m²  │  │ GND: 80 Jahre   │       │
│ │ BRW: 180 €/m²   │  │ Alter: 40 Jahre │       │
│ │ Quelle: Gemini/ │  │ Bonus: +0 Jahre │       │
│ │ BORIS Bayern    │  │                 │       │
│ │ ──────────────  │  │ ──────────────  │       │
│ │ BODENWERT:      │  │ RND: 40 Jahre   │       │
│ │ 95.940 €        │  │                 │       │
│ └─────────────────┘  └─────────────────┘       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 5 — ERTRAGSWERT (Marktwert)             │
│ Rohertrag                                       │
│   Jahresmiete (Ist): 17.447 €                   │
│ BWK                                             │
│   Verwaltung: 872 € · IH: 2.556 €              │
│   Mietausfall: 349 € · Sonstiges: 523 €        │
│   BWK Gesamt: 4.300 € (24,6%)                  │
│ Ertragsableitung                                │
│   Reinertrag: 13.147 €                          │
│   Liegenschaftszins: 3,5%                       │
│   Quelle: Gemini/IVD Süd 2024                  │
│   RND: 40 Jahre · Barwertfaktor: 21,36         │
│   ──────────────────────────────────            │
│   ERTRAGSWERT (MWT): 325.000 €                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 6 — ERTRAGSWERT (Beleihungswert)        │
│   LZ (BelWertV §12): 5,0%                      │
│   BWK (konservativ): 5.820 €                    │
│   Sicherheitsabschlag: 10%                      │
│   ──────────────────────────────────            │
│   ERTRAGSWERT (BWT): 216.249 €                  │
│   [Info-Box: BelWertV §12 Hinweis]              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 7 — SACHWERT                            │
│ ┌─────────────────┐  ┌─────────────────┐       │
│ │ MARKTWERT       │  │ BELEIHUNGSWERT  │       │
│ │ NHK: 2.208 €/m² │  │ Vor Abschlag:   │       │
│ │ BPI: 1,38       │  │ 345.000 €       │       │
│ │ Zeitwert:       │  │ Abschlag 10%:   │       │
│ │ 345.000 €       │  │ -34.500 €       │       │
│ │ ──────────────  │  │ ──────────────  │       │
│ │ SACHWERT (MWT): │  │ SACHWERT (BWT): │       │
│ │ 345.000 €       │  │ 310.500 €       │       │
│ └─────────────────┘  └─────────────────┘       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 8 — VERGLEICHSWERT                      │
│ 4 Vergleichsobjekte                             │
│ ┌─────────────────────────────────────────┐     │
│ │ # │ Objekt      │ Preis   │ Fl.  │€/m² │     │
│ │ 1 │ MFH Leiblf. │ 420.000 │ 180  │2333 │     │
│ │ 2 │ MFH Straub. │ 380.000 │ 200  │1900 │     │
│ │ ...                                    │     │
│ └─────────────────────────────────────────┘     │
│ Median: 2.100 €/m² · P25-P75: ...              │
│ VERGLEICHSWERT (MWT): 447.000 €                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 9 — VORSCHLAGSWERTE (KI-Recherche)      │
│ ┌──────────────┐┌──────────────┐┌─────────────┐│
│ │Liegensch.zins││Bodenrichtwert││Vergl.mieten ││
│ │MWT: 3,5%     ││180 €/m²      ││Min: 7,0€/m² ││
│ │Spanne: 3-4%  ││Quelle: BORIS ││Med: 8,5€/m² ││
│ │Quelle: IVD   ││Bayern (Gemini││Max: 10€/m²  ││
│ │BelWertV: 5,0%││Recherche)    ││Quelle: IS24 ││
│ └──────────────┘└──────────────┘└─────────────┘│
│ ⓘ AI-generierte Marktdaten                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 10 — WIRTSCHAFTLICHE KENNZAHLEN         │
│ [Brutto-Rendite] [Netto-Rendite] [Vervielf.]   │
│ Finanzierungsszenarien                          │
│ ┌───────────────────────────────────────────┐   │
│ │ Szenario │ LTV  │ Zins │ Rate/M │ Ampel │   │
│ │ Konserv. │ 60%  │ 3,8% │ 1.200€ │  🟢  │   │
│ │ Standard │ 75%  │ 3,5% │ 1.500€ │  🟡  │   │
│ │ Offensiv │ 90%  │ 4,0% │ 1.900€ │  🔴  │   │
│ └───────────────────────────────────────────┘   │
│ Stress-Tests: Zins+2%, Miete-10%, CapEx+20%    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 11 — ERGEBNISÜBERSICHT                  │
│ ┌───────────────────────────────────────────┐   │
│ │ Verfahren     │ Marktwert │ Beleihungsw. │   │
│ │ Ertragswert   │ 325.000 € │  216.249 €   │   │
│ │ Sachwert      │ 345.000 € │  310.500 €   │   │
│ │ Vergleichsw.  │ 447.000 € │     –        │   │
│ │───────────────│───────────│──────────────│   │
│ │ Gewicht:      │           │              │   │
│ │ Ertrag 50%    │ 162.500   │              │   │
│ │ Vergl. 35%    │ 156.450   │              │   │
│ │ Sachw. 15%    │  51.750   │              │   │
│ │═══════════════│═══════════│══════════════│   │
│ │ MARKTWERT     │ 380.503 € │              │   │
│ │ BELEIHUNGSW.  │           │  216.249 €   │   │
│ └───────────────────────────────────────────┘   │
│ Executive Summary (AI-generiert)                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SEKTION 12 — RECHTLICHE HINWEISE & AUDIT        │
│ Disclaimer: Kein §194 BauGB Gutachten           │
│ AI-Marktdaten ohne Gewähr                       │
│ Version V9.0 · Stichtag · Seite 12 von 12      │
└─────────────────────────────────────────────────┘
```

## Betroffene Dateien

| # | Datei | Änderung |
|---|---|---|
| 1 | `src/components/shared/valuation/ValuationReportReader.tsx` | Method-Key `'ertragswert'` statt `'ertrag'`, alle Param-Keys auf snake_case, fehlende Sektionen ergänzen |
| 2 | `src/hooks/useValuationCase.ts` | geminiResearch Sub-Objekte in camelCase konvertieren |
| 3 | `supabase/functions/sot-valuation-engine/index.ts` | Fehlende Felder (GND, Alter, plotAreaSqm, bwkBelwertv) in params ergänzen |

Kein DB-Schema-Change nötig — die Spalten `gemini_research` und `beleihungswert` existieren bereits.

