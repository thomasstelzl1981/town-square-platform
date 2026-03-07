

# Plan: AkquiseCalc Engine-Anpassung + Exposé-Viewer + Kalkulationsfluss + Valuation-Integration

## Zusammenfassung

Der Akquise-Manager (MOD-12) wird so erweitert, dass:
1. PDF-Exposés im Posteingang direkt anklickbar und anschaubar sind (inline Viewer)
2. Aus dem Exposé-Detail heraus das Kalkulationstool gestartet wird, mit sauber extrahierten Objektdaten
3. Die Kalkulation (Bestand/Aufteiler) über die bestehende AkquiseCalc-Engine läuft (mit Hygiene-Fixes)
4. Nach der Kalkulation die SoT Valuation Engine (aus MOD-04) als Bewertungsschritt angeboten wird

## Freeze-Status — Benötigte Freigaben

| Bereich | Status | Aktion nötig |
|---------|--------|-------------|
| **ENG-AKQUISE** (`src/engines/akquiseCalc/*`) | FROZEN | **UNFREEZE ENG-AKQUISE** erforderlich |
| **MOD-12** (`src/pages/portal/akquise-manager/*`) | FROZEN | **UNFREEZE MOD-12** erforderlich |
| ENG-VALUATION | OFFEN | Kann bearbeitet werden |
| `useValuationCase.ts` (shared hook) | nicht modul-gebunden | Kann bearbeitet werden |

Ohne UNFREEZE ENG-AKQUISE und UNFREEZE MOD-12 kann ich nicht implementieren.

---

## Phase 1: Exposé im Posteingang anklickbar + Viewer

**Ist-Zustand:** Im `ObjekteingangList.tsx` gibt es bereits einen "PDF"-Button pro Zeile, der eine Signed URL öffnet (`handleExposeClick`). Das funktioniert, öffnet aber ein neues Browser-Tab.

**Soll:**
- Klick auf eine Tabellenzeile navigiert bereits zur `ObjekteingangDetail`-Seite — das funktioniert schon (`navigate(/portal/akquise-manager/objekteingang/${offer.id})`)
- In `ObjekteingangDetail.tsx` ist der Datenraum (`EntityStorageTree`) vorhanden, aus dem PDFs abrufbar sind
- **Neu:** Einen eingebetteten PDF-Viewer (iframe mit Signed URL) als Collapsible-Section in der Detail-Seite ergänzen, damit das Exposé direkt inline anschaubar ist, ohne Tab-Wechsel
- Der Viewer lädt automatisch das erste `expose`-Dokument aus `acq_offer_documents`

**Dateien:**
- `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` — Inline-PDF-Viewer-Section ergänzen

## Phase 2: AkquiseCalc Engine — Hygiene-Fixes

**Bereits gut:**
- Engine ist SSOT-zentralisiert in `engine.ts` + `spec.ts`
- Alle 5 Consumer nutzen Engine-Funktionen
- Tests in `engine.test.ts` vorhanden

**Fixes:**
1. **`maintenancePercent` wird nicht verwendet** in `calcBestandFull` — muss in die monatliche Ausgabenrechnung einfließen (Instandhaltungsrücklage). Die UI (`BestandCalculation.tsx`) berechnet es separat inline — das muss in die Engine wandern
2. **`maxFinancing` Magic Number** — `(yearlyRent * 0.8 / 5) * 100` dokumentieren als Heuristik: "80% der Jahresmiete als tragbare Annuität bei 5% Gesamtzins"
3. **`as any` in `useAcqOffers.ts`** (Zeile 190, 63) — Type-Casts durch korrekte Partial-Types ersetzen
4. **Fail-State-Härtung:** Division durch 0 in `calcSensitivity` wenn `y = 0` (bei `targetYield + delta = 0`) — Guard ergänzen

**Dateien:**
- `src/engines/akquiseCalc/engine.ts` — maintenancePercent einbauen, Sensitivity-Guard
- `src/engines/akquiseCalc/spec.ts` — Kommentar für maxFinancing-Heuristik
- `src/engines/akquiseCalc/engine.test.ts` — Testfälle für Randfälle ergänzen

## Phase 3: Kalkulation direkt aus Exposé-Daten starten

**Ist-Zustand:** `ObjekteingangDetail.tsx` zeigt bereits die Kalkulation (Zeilen 196-204) mit `BestandCalculation` und `AufteilerCalculation`, die `initialData` aus den Offer-Feldern beziehen (`effectivePrice`, `yearlyRent`, `units_count`, `area_sqm`).

**Dies funktioniert bereits korrekt**, wenn die KI-Extraktion die Felder in `acq_offers` geschrieben hat (über `useExposeUpload` → Gemini-Extraktion). Der Flow ist:

```text
Upload PDF → KI extrahiert Daten → acq_offers Felder gefüllt
→ ObjekteingangDetail liest offer → initialData an Kalkulation
→ Bestand/Aufteiler-Tabs mit Slidern → Ergebnisse
```

**Verbesserung:** Falls extrahierte Daten unvollständig sind (z.B. keine Miete extrahiert), soll eine Warnung angezeigt werden mit Hinweis, welche Felder fehlen, damit der User sie manuell nachtragen kann.

**Dateien:**
- `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` — Daten-Vollständigkeits-Check vor Kalkulation

## Phase 4: Valuation Engine als zweiten Schritt integrieren

**Ist-Zustand:** `ObjekteingangDetail.tsx` hat bereits eine "SoT Bewertung"-Section (Zeilen 159-193) mit `useValuationCase`, die `runValuation({ offerId, sourceContext: 'ACQUIARY_TOOLS' })` aufruft.

**Dies ist bereits implementiert.** Die Valuation Engine (ENG-VALUATION) wird mit `offerId` aufgerufen und nutzt die extrahierten Daten aus `acq_offers` als Input.

**Anpassung:** 
- Den Bewertungs-Button erst aktivieren, wenn die Kalkulation mindestens einmal durchgeführt/gespeichert wurde (Status `analyzed`)
- Die Kalkulations-Ergebnisse (calc_bestand/calc_aufteiler) als zusätzlichen Kontext an die Valuation Engine übergeben
- Geomap/Sprengnetter-Referenzen bereinigen: `geomap_data` Spalte in Kommentaren als "legacy" markieren, keine UI-Referenzen mehr

**Dateien:**
- `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` — Bewertungs-Button konditionieren
- `src/pages/portal/akquise-manager/components/AnalysisTab.tsx` — Legacy-Geomap-Referenzen bereinigen
- `src/pages/portal/akquise-manager/components/DeliveryTab.tsx` — Legacy-Geomap-Referenz bereinigen
- `src/hooks/useAcqOffers.ts` — Type-Hygiene (as any entfernen)

## Phase 5: Entfernung Sprengnetter/Geomap-Reste

Alle verbleibenden Referenzen auf Sprengnetter/Geomap in MOD-12-Code werden bereinigt:
- `AnalysisTab.tsx` Zeile 3: Kommentar aktualisieren
- `AnalysisTab.tsx` Zeile 182, 264: `geomap_data` Legacy-Referenzen durch Valuation-Check ersetzen
- `DeliveryTab.tsx` Zeile 273: `geomap_data` Legacy-Referenz bereinigen
- DB-Spalte `geomap_data` bleibt bestehen (keine Migration nötig), wird nur in Code als legacy markiert

---

## Technische Details

### Inline PDF-Viewer (Phase 1)
```tsx
// Neue Section in ObjekteingangDetail
<Card>
  <CardHeader>Exposé-Ansicht</CardHeader>
  <CardContent>
    <iframe src={signedUrl} className="w-full h-[600px] rounded-lg" />
  </CardContent>
</Card>
```
Die Signed URL wird über `supabase.storage.from('tenant-documents').createSignedUrl()` generiert (bereits in `handleExposeClick` vorhanden).

### maintenancePercent-Fix (Phase 2)
In `calcBestandFull`: Instandhaltungsrücklage in die Jahresausgaben einbeziehen, ähnlich wie `BestandCalculation.tsx` Zeile 199 es bereits tut, aber dort inline im UI statt in der Engine.

### Daten-Vollständigkeits-Check (Phase 3)
Pflichtfelder für Kalkulation: `price_asking`, mindestens eines von `noi_indicated`/`yield_indicated`/`monthlyRent`. Wenn fehlend: Warnbanner mit editierbaren Feldern.

