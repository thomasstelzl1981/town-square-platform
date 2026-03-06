

# ENG-VALUATION: Schonungslose Soll-/Ist-Analyse

---

## Executive Summary

**Ja — ENG-VALUATION ist "Core vorhanden, Produkt unvollständig".**

Der technische Kern ist erstaunlich komplett: 1.236 Zeilen Edge Function mit funktionierender 6-Stage Pipeline, 972 Zeilen client-side Engine mit SSOT-Merge/Diff, 358 Zeilen PDF-Generator mit 9 Seiten, und ein Deep Mapper im Hook. **Aber die Produktverdrahtung hat zwei klaffende Löcher**: MOD-12 wirft explizit einen Error ("wird in Phase 5 implementiert"), und der PDF-Export ist nie an einen Button im UI angebunden.

---

## Soll-/Ist-Tabelle

| # | Bereich | Soll | Ist im Repo | Ist in der UI | Abweichung | Schwere | Ursache | Korrektur |
|---|---------|------|-------------|---------------|------------|---------|---------|-----------|
| 1 | **Engine Registry** | Status "Teilweise" oder "Live", Detail-Sektion | ✅ Gerade korrigiert auf v2.0 mit Detail-Sektion | N/A | ✅ Behoben | — | War "Geplant" bis heute | Erledigt |
| 2 | **Engine Core (spec.ts)** | V6 Typen, SSOT-Final, LegalTitle, FieldSource, alle Interfaces | ✅ 672 Zeilen, V2.0.0, alle Interfaces vorhanden | N/A | Keine | — | — | — |
| 3 | **Engine Core (engine.ts)** | Deterministische Calc-Funktionen, SSOT Snapshot Builder, Merge/Diff | ✅ 972 Zeilen, Ertragswert + CompProxy + Sachwert + Financing + Stress + Lien + DSCR + Sensitivity + Merge + Diff | N/A | Keine | — | — | — |
| 4 | **Edge Function** | 6-Stage Pipeline, Google, Comps, AI, SSOT-Fetch, Report | ✅ 1.236 Zeilen, alle 6 Stages implementiert, Google Geocode/Places/Static, Firecrawl Comps, AI Extraction, SSOT-Final Mode, Credit Gate | N/A | Keine Kern-Lücke | — | — | — |
| 5 | **DB Schema** | valuation_cases, _inputs, _results, _reports | ✅ Alle 4 Tabellen existieren und werden befüllt | N/A | Keine | — | — | — |
| 6 | **MOD-04 Bewertung** | Button in PropertyValuationTab → Preflight → Run → Report anzeigen | ✅ PropertyValuationTab.tsx mit Start-Button, Preflight-View, Pipeline-View, Result-View | ✅ Button vorhanden, Pipeline läuft | Deep Mapper war defekt → **gerade gefixt** | Mittel | Contract Drift snake/camel | Erledigt (Deep Mapper) |
| 7 | **MOD-12 Akquise-Bewertung** | SoT Bewertung Button in AnalysisTab → Runs valuation → Zeigt Ergebnisse | ❌ `useRunValuation()` wirft `throw new Error('wird in Phase 5 implementiert')` (Zeile 348) | ❌ Button existiert, crasht sofort mit Toast-Error | **KOMPLETT OFFEN** | **Kritisch** | Bewusst als TODO belassen | useRunValuation verdrahten auf sot-valuation-engine |
| 8 | **MOD-12 Objekteingang** | Bewertung als Step 3 ("Bewertung") im Offer-Flow | ❌ ObjekteingangDetail hat Stepper mit "Bewertung" Step, aber KEIN Valuation-UI darin | ❌ Step "Bewertung" existiert im Stepper, zeigt aber nichts | **OFFEN** | **Kritisch** | Nie implementiert | ValuationTab in Objekteingang einbauen |
| 9 | **MOD-13 Inbox** | Draft-Bewertung aus Inbox-Upload | ❌ Kein Code gefunden der MOD_13_INBOX als sourceContext nutzt | ❌ Nicht vorhanden | **OFFEN** | Hoch | Nie angefangen | Neuer Entry Point |
| 10 | **Google Standortanalyse** | Geocode, Places (5 POI-Kategorien), Routes, Static Maps, StreetView | ✅ Geocode, Places (5 Kategorien), Static Maps (micro+macro) implementiert. ❌ Routes Matrix fehlt, ❌ StreetView fehlt | Nicht sichtbar in UI (Location-Daten werden in DB gespeichert, aber ReportReader hat keinen Location-Block) | Teilweise | Mittel | Routes/StreetView nicht priorisiert; UI zeigt Location nicht | Location-Block in ReportReader einbauen |
| 11 | **Portal-Comps** | Firecrawl Scraping, AI-Extraktion, Deduplizierung, CompStats | ✅ Firecrawl Search + AI Extraction in Stage 3 implementiert | Nicht sichtbar in UI (CompStats wird gemappt, aber ReportReader zeigt nur Zahlen, keine Comp-Liste) | Teilweise | Mittel | UI-Darstellung fehlt | CompPostings-Liste im Report zeigen |
| 12 | **12-Seiten PDF** | CI-konformes Premium-Gutachten, 12 Seiten max | ✅ ValuationPdfGenerator.ts existiert mit 9 Sektionen (Cover, Summary, Methoden, Comps, Standort, Finanzierung, Stress, Beleihung, Recht&Eigentum) | ❌ **KEIN Button** in der UI ruft generateValuationPdf auf | **OFFEN** | **Hoch** | PDF-Generator gebaut, aber nie an UI angebunden | "PDF exportieren" Button in Report-View |
| 13 | **CI / PDF Integration** | pdfCiKit Tokens, PdfConsentGate | ❌ ValuationPdfGenerator nutzt eigene Farben, nicht pdfCiKit/pdfCiTokens | N/A | Kosmetisch | Niedrig | Parallel entwickelt | CI-Tokens importieren |
| 14 | **Hook/Mapper** | Robustes snake→camel Mapping, Error Handling | ✅ Deep Mapper mit 8 Sub-Mappern, Error Toast statt Silent Reset | Funktioniert nach Fix | ✅ Gerade behoben | — | Contract Drift | Erledigt |
| 15 | **Draft→SSOT Merge** | Merge-Logik: SSOT wins, Extracted fills gaps, Diff-Review UI | ✅ Engine: mergeSnapshots + detectDiffs. ✅ Edge Function: Server-side SSOT merge + Diff-Tracking. ✅ UI: ValuationDiffReview.tsx vorhanden | Zeigt Diffs wenn vorhanden | Keine Kern-Lücke | — | — | — |
| 16 | **Legal & Title Block** | Grundbuch, WEG, Flurstück, MEA, Teilungserklärung | ✅ LegalTitleBlock in spec.ts, buildLegalTitleBlock in engine.ts, Server-side in Edge Function, ValuationLegalBlock.tsx als UI-Komponente, PDF Seite 9 | ❌ ReportReader importiert aber legalTitle-Prop wird nicht als Block gerendert (nur durchgereicht) | Teilweise | Mittel | UI-Integration unvollständig | LegalBlock in ReportReader rendern |
| 17 | **Valuation-Liste in PropertyTab** | Listet abgeschlossene Bewertungen mit Case-ID, Datum, Wert | ❌ Listet aus `property_valuations` Tabelle (alt), Engine schreibt in `valuation_cases` | ❌ Liste zeigt nichts, da falsche Tabelle abgefragt wird | **OFFEN** | **Hoch** | Struktureller Drift: 2 verschiedene Tabellen | Query auf valuation_cases umstellen |

---

## Antworten auf die Verdachtsmomente

**A) Wurde primär der Core gebaut, aber nicht das fertige Produkt?**
**JA.** Der Core (spec.ts: 672 LOC, engine.ts: 972 LOC, Edge Function: 1.236 LOC, PDF: 358 LOC) ist beeindruckend vollständig. Aber von drei geplanten Entry Points (MOD-04, MOD-12, MOD-13) ist nur MOD-04 verdrahtet — und auch dort fehlt der PDF-Button und die Liste zeigt die falsche Tabelle.

**B) Ist MOD-12 im Repo noch faktisch "Phase 5 / TODO"?**
**JA.** Beweis: `src/hooks/useAcqOffers.ts`, Zeile 347-348:
```typescript
// TODO: Phase 5 — invoke sot-valuation-engine edge function
throw new Error('SoT Valuation Engine wird in Phase 5 implementiert');
```
Der Button "SoT Bewertung" in AnalysisTab.tsx existiert, ruft diese Funktion auf, und crasht sofort.

**C) Ist MOD-04 erst nachträglich von Draft-only auf SSOT-Final korrigiert worden?**
**JA.** Die Edge Function hat explizite V6.0-Marker: `// V6.0: SSOT-Final Mode`, `// V6.0: Determine source mode`, `// V6.0: Fetch SSOT data`. Die Architektur wurde in einer zweiten Welle nachgerüstet.

**D) Ist die Engine-Dokumentation / Registry statusmäßig inkonsistent?**
**WAR JA**, heute korrigiert auf v2.0 mit Detail-Sektion und Status "Teilweise".

**E) Ist der Report eher ein kompakter V5-Output statt das definierte Premium-Gutachten?**
**JEIN.** Der PDF-Generator hat 9 Sektionen und ist nah am 12-Seiten-Ziel. Aber er wird nie aufgerufen — es gibt keinen Button dafür. Und der Web-Reader (ValuationReportReader) zeigt Location und Comps nicht.

**F) Ist die Trennung zwischen Akquise-Bewertung und Finalbewertung zu schwach?**
**JA.** Die Edge Function unterscheidet sauber (sourceMode SSOT_FINAL vs DRAFT_INTAKE). Aber MOD-12 nutzt diese Unterscheidung gar nicht, weil die Verdrahtung fehlt.

**G) Ist das Frontend-Retrieval/Mapper-Thema ein Symptom?**
**JA.** Der Deep-Mapper-Bug war nur das sichtbare Symptom. Die echten Gaps sind: fehlende Verdrahtung (MOD-12), fehlende UI-Anbindung (PDF, Location-Block, Comp-Liste), falsche Tabelle (property_valuations vs valuation_cases).

---

## Root Cause Analyse

| # | Root Cause | Auswirkung |
|---|-----------|-----------|
| 1 | **Core-first, Produkt-later** | 3.228 LOC Engine-Code, aber nur 1 von 3 Entry Points verdrahtet |
| 2 | **Phase-Planung nicht durchgezogen** | MOD-12 hat einen expliziten "Phase 5 TODO" der nie aufgelöst wurde |
| 3 | **Tabellen-Drift** | PropertyValuationTab listet `property_valuations`, Engine schreibt `valuation_cases` |
| 4 | **PDF nie angebunden** | 358 LOC PDF-Generator ohne einzigen Aufruf im UI |
| 5 | **Contract Drift** | Edge Function speichert snake_case, UI erwartet camelCase — Deep Mapper erst nachträglich gebaut |
| 6 | **ReportReader zeigt nur Zahlen** | Location-Analyse (Google), Comp-Postings-Liste, Legal-Block werden nicht gerendert |

---

## Top 10 Gaps (nach Priorität)

| Prio | Gap | Aufwand | Datei(en) |
|------|-----|---------|-----------|
| **1** | MOD-12: `useRunValuation` verdrahten (ersetzt throw Error) | Klein | `src/hooks/useAcqOffers.ts` |
| **2** | MOD-04: PropertyValuationTab Tabelle umstellen `property_valuations` → `valuation_cases` | Klein | `src/components/immobilien/detail/PropertyValuationTab.tsx` (MOD-04 frozen!) |
| **3** | PDF-Export Button im Report-View einbauen | Klein | `src/components/shared/valuation/ValuationReportReader.tsx` (frozen? shared) |
| **4** | MOD-12 Objekteingang: Bewertungs-Step mit Valuation-UI befüllen | Mittel | `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` (MOD-12 frozen!) |
| **5** | ReportReader: Location-Block einbauen (Scores, POIs, Maps) | Mittel | ValuationReportReader.tsx |
| **6** | ReportReader: Comp-Postings-Liste einbauen | Klein | ValuationReportReader.tsx |
| **7** | ReportReader: LegalBlock rendern (ValuationLegalBlock.tsx existiert bereits) | Klein | ValuationReportReader.tsx |
| **8** | PDF-Generator: pdfCiTokens importieren statt eigene Farben | Klein | ValuationPdfGenerator.ts |
| **9** | MOD-13 Inbox: Draft-Bewertungs-Entry-Point | Groß | Neuer Code |
| **10** | Google Routes Matrix + StreetView in Edge Function | Mittel | Edge Function (frozen!) |

---

## Empfohlene Korrekturreihenfolge

**Phase A — Sofort-Fixes (kein Freeze betroffen):**
1. `useRunValuation` in useAcqOffers.ts verdrahten (useValuationCase importieren, sot-valuation-engine aufrufen statt throw Error)

**Phase B — Freeze aufheben für MOD-04:**
2. PropertyValuationTab: Query auf `valuation_cases` umstellen
3. PDF-Button im Report-View

**Phase C — Freeze aufheben für shared/valuation:**
4. ReportReader: Location + Comps + Legal Block
5. PDF CI-Token Integration

**Phase D — Freeze aufheben für MOD-12:**
6. Objekteingang Bewertungs-Step

**Phase E — Neue Features:**
7. MOD-13 Entry Point
8. Google Routes + StreetView

---

## Klare Aussage

**ENG-VALUATION ist "Core vorhanden, Produkt unvollständig" — JA.**

- Core-Engine: **95% fertig** (spec, engine, Edge Function, DB, PDF-Generator)
- MOD-04 Verdrahtung: **70% fertig** (funktioniert nach Deep-Mapper-Fix, aber falsche Tabelle + kein PDF)
- MOD-12 Verdrahtung: **0% fertig** (throw Error)
- MOD-13 Verdrahtung: **0% fertig** (nicht existiert)
- Premium-Report (Web): **60% fertig** (Zahlen ja, Location/Comps/Legal nein)
- Premium-Report (PDF): **90% fertig als Code, 0% erreichbar für User** (kein Button)

Das Gesamtprodukt ist bei ca. **45% Fertigstellung**, obwohl der technische Kern bei **95%** liegt. Die Lücke ist reine Verdrahtung und UI-Anbindung.

