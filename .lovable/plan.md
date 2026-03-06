

# Refactoring-Plan: SoT Valuation Engine V9.0 — Kurzgutachten-Standard (MOD-04 only)

## Kernprobleme (Ist-Zustand)

1. **Liegenschaftszins pauschal hardcoded** (MFH=5%, ETW=3,5%) — Das Parkweg-Gutachten zeigt 2,08%, Deggendorf 2,36%. Unsere Engine liefert ~367k statt 617k Marktwert.
2. **Bodenrichtwert als grober Proxy** (5-Stufen-Score) — Parkweg: real 149 €/m² (+50% Anpassung = 223,50 €/m²), unsere Engine schätzt per Score.
3. **Kein Gemini-Lookup** für marktgerechte Liegenschaftszinsen und Bodenrichtwerte — beides kann per AI-Recherche ermittelt werden.
4. **BewertungTab redundant** als eigenständiger Menüpunkt — Bewertung gehört nur in die Immobilienakte.
5. **Vergleichsangebote** zeigen 0 €/m² — Comp-Proxy-Extraktion defekt.
6. **Google Maps Daten** (StreetView, POIs) werden zwar abgerufen, aber im Report kaum sichtbar.
7. **Report-Struktur** ist ein Investment-Report, kein professionelles Kurzgutachten nach Bankenstandard.
8. **Kein Beleihungswert** — Das wichtigste Ergebnis für Banken fehlt komplett.

---

## Referenz: Professionelles Kurzgutachten (12 Seiten)

Aus den beiden analysierten Gutachten (Parkweg MFH + Deggendorf ETW):

```text
Seite 1:  DECKBLATT — Beleihungswert + Marktwert + Gebäudeangaben
Seite 2:  GRUNDBUCH — Amtsgericht, Bestandsverzeichnis, Eigentümer
Seite 3:  BODENWERT — Grundstücksfläche × Bodenrichtwert = Bodenwert
          MODERNISIERUNG + RESTNUTZUNGSDAUER (RND berechnet)
Seite 4:  SACHWERT (Marktwert) — NHK, Indexwert, Zeitwert, Bauwert + Bodenwert
Seite 5:  SACHWERT (Beleihungswert) — mit Sicherheitsabschlag + Baunebenkosten
Seite 6:  ERTRAGSWERT (Marktwert) — Rohertrag, BWK-Detail, Reinertrag, Barwert
Seite 7:  ERTRAGSWERT (Beleihungswert) — mit 5% Liegenschaftszins (BelWertV)
Seite 8:  VERGLEICHSWERT — Vergleichspreise €/m², Nebengebäude
Seite 9:  VORSCHLAGSWERTE — Lageeinschätzung, Vergleichsmieten, Liegenschaftszins
Seite 10: WIRTSCHAFTL. KENNZAHLEN + Liegenschaftszins-Quelle
Seite 11: ERGEBNISÜBERSICHT — Bodenwert, Sachwert, Ertragswert, Vergleichswert,
          Ableitung, Ergebnis (Marktwert + Beleihungswert)
Seite 12: GEÄNDERTE WERTE — Audit-Trail
```

---

## Daten-Pipeline: Schritt-für-Schritt Reihenfolge

### Stage 0: Preflight (unverändert)
- Credit-Check (20 Credits)
- Property-ID validieren

### Stage 1: SSOT-Datensammlung (aus DB)
1. `properties` → Adresse, PLZ, Stadt, Typ, Baujahr, Fläche, Zustand, Modernisierung
2. `units` → Wohnfläche, Nutzfläche, Anzahl Einheiten, Stellplätze
3. `leases` (via units) → Kaltmiete, Mietvertragsdaten, Leerstand
4. `loans` → Bestehende Finanzierung
5. **Grundbuchdaten** aus properties (land_register_*, parcel_number etc.)

### Stage 2: AI-Recherche via Gemini (NEU)
**Schritt 2a: Liegenschaftszins-Recherche**
- Prompt an Gemini: "Aktueller Liegenschaftszinssatz für [Objekttyp] in [PLZ] [Stadt], [Bundesland], Quelle: IVD oder Gutachterausschuss. Antwort als JSON: {marktwert_zins, beleihungswert_zins, quelle, stichtag, min, max}"
- Fallback: Bisherige Pauschaltabelle als Minimum/Maximum-Korridor

**Schritt 2b: Bodenrichtwert-Recherche**
- Prompt an Gemini: "Aktueller Bodenrichtwert für [Adresse], [PLZ] [Stadt]. Quelle: Gutachterausschuss. Antwort als JSON: {bodenrichtwert_eur_sqm, stichtag, quelle, art_der_nutzung}"
- Fallback: Bisheriger 5-Stufen-Proxy

**Schritt 2c: Vergleichsmieten-Recherche**
- Prompt an Gemini: "Durchschnittliche Kaltmiete €/m² für [Objekttyp] in [PLZ] [Stadt], Baujahr [X], Ausstattung [Y]. Antwort als JSON: {miete_min, miete_median, miete_max, quelle}"

### Stage 3: Standortanalyse (Google Maps APIs)
1. **Geocode** → Lat/Lng aus Adresse + PLZ + Stadt
2. **Places Nearby** → POIs (ÖPNV, Alltag, Familie, Gesundheit, Freizeit) mit Entfernungen
3. **Routes Matrix** → Fahrzeiten zu Hauptbahnhof, Autobahn, Flughafen
4. **Static Maps** → Mikrolage-Karte + Makrolage-Karte (als URL für Web, Base64 für PDF)
5. **StreetView** → Gebäudeansicht (als URL für Web, Base64 für PDF)
6. **Lage-Score** berechnen (0-100) aus POI-Dichte + Erreichbarkeit

### Stage 4: Vergleichsangebote (Web Scraper)
1. Firecrawl-Suche: "[Objekttyp] kaufen [Stadt] [PLZ]" auf ImmoScout24, Immowelt
2. Filter: ±20% Fläche, ±15 Jahre Baujahr, ±[Radius] km
3. Deduplizierung nach Adresse/Fläche/Preis
4. Statistik: Median, P25, P75, IQR, €/m²
5. **Fix: price_per_sqm korrekt berechnen** (price / living_area wenn 0)

### Stage 5: Deterministische Kalkulation (ImmoWertV)

**5a: Bodenwert**
- Grundstücksfläche: Aus DB (`plot_area`) ODER Gemini-Recherche ODER Heuristik (MFH: 2,5×)
- Bodenrichtwert: Aus Gemini-Recherche ODER Score-Proxy
- Bodenwert = Fläche × Bodenrichtwert

**5b: Ertragswert (Marktwert)**
- Liegenschaftszins: **Aus Gemini-Recherche** (z.B. Parkweg: 2,08%)
- RND: Gesamtnutzungsdauer − Alter + Modernisierungsbonus
- Rohertrag: Jahresmiete aus SSOT
- BWK-Einzelaufstellung: Instandhaltung (9€/m²/a), Verwaltung (250€/WE oder 5%), Mietausfallwagnis, Modernisierungsrisiko
- Reinertrag = Rohertrag − BWK
- Bodenertrag = Bodenwert × Liegenschaftszins
- Gebäude-Ertrag = (Reinertrag − Bodenertrag) × Barwertfaktor(i, RND)
- **Ertragswert = Gebäude-Barwert + Bodenwert**

**5c: Ertragswert (Beleihungswert)** (NEU)
- Liegenschaftszins: **Fest 5,0%** (BelWertV §12)
- BWK: Höhere Ansätze als Marktwert (konservativ)
- Sicherheitsabschlag: 10% auf Zeitwert
- Separate Berechnung nach BelWertV

**5d: Sachwert (Marktwert)**
- NHK 2010 × BPI-Index × BGF = Neubauwert
- Wertminderung nach Alter/RND
- + Außenanlagen (3%) + Bodenwert = Sachwert

**5e: Sachwert (Beleihungswert)** (NEU)
- Mit Regionalfaktor (BKI), Sicherheitsabschlag (10%), Baunebenkosten (18,67%)

**5f: Vergleichswert**
- Median €/m² aus Comps × Wohnfläche
- + Nebengebäude/Stellplätze
- Beleihungswert: −10% Sicherheitsabschlag

**5g: Ergebnisübersicht + Fusion**
- Marktwert: Gewichtet aus Ertragswert/Vergleichswert/Sachwert
- Beleihungswert: Konservativster Wert (typisch 60-90% vom Marktwert, begrenzt durch BelWertV-Ertragswert)

### Stage 6: Report Composer
- Web-Reader im Kurzgutachten-Format
- PDF-Export (12 Seiten, CI-A Standard)

---

## Betroffene Dateien & Änderungen

### 1. BewertungTab entfernen (UI-Cleanup)
| Datei | Änderung |
|---|---|
| `src/manifests/routesManifest.ts` | Zeile 285: bewertung-Tile entfernen |
| `src/pages/portal/ImmobilienPage.tsx` | Route `bewertung` entfernen, BewertungTab lazy-import entfernen |
| `src/pages/portal/immobilien/BewertungTab.tsx` | Datei löschen |

### 2. Edge Function komplett neu schreiben
| Datei | Änderung |
|---|---|
| `supabase/functions/sot-valuation-engine/index.ts` | Komplettes Refactoring: Gemini-Recherche für Liegenschaftszins + Bodenrichtwert + Vergleichsmieten einbauen; Beleihungswert-Berechnung (BelWertV) hinzufügen; Sachwert-Beleihungswert hinzufügen; Comp-price_per_sqm-Fix; LocationScore korrekt an Kalkulation übergeben |

### 3. Engine Spec erweitern
| Datei | Änderung |
|---|---|
| `src/engines/valuation/spec.ts` | Neue Interfaces: `BeleihungswertResult`, `GeminiResearchResult` (Liegenschaftszins, Bodenrichtwert, Vergleichsmieten); `PLOT_AREA_HEURISTIC_BY_TYPE.MFH` = 2.5; Erweiterte `ValuationMethodResult` für Marktwert + Beleihungswert; Neue Konstanten für BelWertV (BWK-Sätze, Sicherheitsabschlag) |

### 4. Report-Reader auf Kurzgutachten-Standard umbauen
| Datei | Änderung |
|---|---|
| `src/components/shared/valuation/ValuationReportReader.tsx` | Komplettes Refactoring auf 11 Sektionen: Deckblatt (Marktwert + Beleihungswert + Gebäudeangaben), Grundbuch, Bodenwert, Sachwert MWT, Sachwert BWT, Ertragswert MWT (BWK-Detail wie im Gutachten), Ertragswert BWT, Vergleichswert, Vorschlagswerte (Gemini-Quellen), Ergebnisübersicht (Tabelle MWT/BWT), Google Maps Standortanalyse (mit StreetView-Bild, POI-Karten) |

### 5. PDF-Generator auf 12-Seiten-Gutachten umbauen
| Datei | Änderung |
|---|---|
| `src/components/shared/valuation/ValuationPdfGenerator.ts` | 12-Seiten-Struktur nach Kurzgutachten-Vorlage; Google Maps + StreetView als Base64-Bilder; BWK-Einzelaufstellung; Ergebnistabelle MWT/BWT; Alle Werte in professionellem Tabellenlayout |

### 6. Deep Mapper im Hook erweitern
| Datei | Änderung |
|---|---|
| `src/hooks/useValuationCase.ts` | Neue Felder mappen: `beleihungswert`, `ertragswertBeleihung`, `sachwertBeleihung`, `geminiResearch` (Liegenschaftszins-Quelle, Bodenrichtwert-Quelle); Location-Score-Mapping korrekt durchreichen |

### 7. PropertyValuationTab (Einstiegspunkt bleibt)
| Datei | Änderung |
|---|---|
| `src/components/immobilien/detail/PropertyValuationTab.tsx` | Minimale Anpassung: Beleihungswert in der Listenansicht anzeigen |

---

## Voraussetzungen (Unfreeze)

Folgende Freezes müssen aufgehoben werden:
- **UNFREEZE INFRA-edge_functions** — Edge Function `sot-valuation-engine`
- **UNFREEZE INFRA-manifests** — routesManifest.ts (Bewertung-Tile entfernen)
- **UNFREEZE MOD-04** — ImmobilienPage.tsx, PropertyValuationTab.tsx, PropertyTabRouter.tsx

`ENG-VALUATION` ist bereits unfrozen. `src/components/shared/valuation/*` ist nicht in einem Freeze-Pfad.

---

## Abgrenzung: MOD-13 (Projekte) — separate Engine

Die Bewertung in MOD-13 wird eine **eigene Edge Function** (`sot-project-valuation-engine`) erhalten, die auf Exposé-Daten (DRAFT_INTAKE) basiert. Diese wird in einem separaten Planungsschritt behandelt und ist **nicht Teil dieses Refactorings**.

