

# MOD-12 Objektdaten-Seite — UI-Restructuring

## Ziel
Die ObjekteingangDetail-Seite wird zu einem klaren 3-Sektionen-Layout umgebaut:
1. **Objektkopf** (oben): Alle Stammdaten + Ankaufskosten-Aufschlüsselung + Quelle/Datenraum
2. **Kalkulationskerne** (Mitte): Schieberegler → Finanzierung → Ergebnis (Bestand oder Aufteiler)
3. **Bewertung & Aktivitäten** (unten): SoT Bewertung, Aktivitäten, KI-Extraktion

## Änderungen im Detail

### 1. ExposePdfViewer entfernen
- Die `ExposePdfViewer`-Komponente in `ObjekteingangDetail.tsx` (Zeilen 102-167) wird komplett entfernt
- Der Aufruf in Zeile 243 entfällt
- PDFs sind weiterhin über den Datenraum-Tree einsehbar

### 2. Neue Sektion: Ankaufskostenübersicht (ObjektAnkaufskosten)
Neue Komponente `src/components/akquise/objekteingang/ObjektAnkaufskosten.tsx`:
- **Grunderwerbsteuer nach Bundesland**: PLZ-basierte Ableitung des Bundeslandes aus der Offer-PLZ, mit einer statischen Mapping-Tabelle (PLZ-Bereiche → Bundesland → GrESt-Satz). Alternativ Dropdown zur manuellen Auswahl.
- **Notarkosten**: Fix 2,0 % des Kaufpreises
- **Maklerprovision**: Aus `provider_contact` / manuellem Input (Standard: 3,57 %)
- **Aufschlüsselung**: Kaufpreis + GrESt + Notar + Makler = Gesamtinvestition
- Wird in `ObjekteingangDetail.tsx` direkt unter der KPI-Row und Basisdaten eingefügt

### 3. Erweiterung ObjektBasisdaten
Die bestehende `ObjektBasisdaten`-Komponente wird erweitert um:
- **Anbieter/Quelle**: `provider_name` und `provider_contact` aus dem Offer anzeigen
- **Quelltyp**: Badge für `source_type` (Upload, E-Mail, Portal-Scrape etc.)
- Die E-Mail/Quelle-Section und der Datenraum-Tree werden in die obere Sektion integriert (statt als separater Block unten)

### 4. Bestand/Aufteiler-Kalkulationen homogenisieren
Die `ancillaryCostPercent`-Schieberegler in beiden Kalkulationskomponenten werden durch die konkrete Aufschlüsselung aus der oberen Sektion gespeist:
- Die `initialData`-Props für `BestandCalculation` und `AufteilerCalculation` erhalten ein neues Feld `ancillaryCostPercent` das aus der Ankaufskostenübersicht berechnet wird (GrESt + Notar + Makler)
- Die QuickAnalysisBanner bleibt als Schnellübersicht am Anfang der Kalkulations-Sektion

### 5. Neues Layout der Seite (von oben nach unten)

```text
┌─────────────────────────────────────────┐
│ Header (Titel, Status, Action-Buttons)  │
│ Stepper (Erfassung→Analyse→Bewertung)   │
├─────────────────────────────────────────┤
│ KPI-Row (Preis, Einheiten, Fläche, Ren) │
├──────────────────┬──────────────────────┤
│ Basisdaten       │ Lage + Anbieter      │
├──────────────────┴──────────────────────┤
│ Ankaufskostenübersicht                  │
│ KP + GrESt(BL) + Notar + Makler = Total│
├──────────────────┬──────────────────────┤
│ E-Mail / Quelle  │ Datenraum (Tree)     │
├──────────────────┴──────────────────────┤
│ Completeness Check (falls Daten fehlen) │
├─────────────────────────────────────────┤
│ Schnellanalyse (mit Preiseditor)        │
│ Tabs: Bestand | Aufteiler               │
│   → Schieberegler                       │
│   → Finanzierungsübersicht              │
│   → Monatl. Wirtschaftlichkeit / Kosten │
│   → Charts + KPI-Ergebnis              │
├─────────────────────────────────────────┤
│ SoT Bewertung                           │
├─────────────────────────────────────────┤
│ Aktivitäten                             │
├─────────────────────────────────────────┤
│ KI-Extraktion (Collapsible)             │
└─────────────────────────────────────────┘
```

## Technische Details

### GrESt-Mapping (Bundesland aus PLZ)
Statisches Mapping in der neuen Komponente oder in `spec.ts` der Engine:
```typescript
const GREST_RATES: Record<string, number> = {
  'BW': 5.0, 'BY': 3.5, 'BE': 6.0, 'BB': 6.5, 'HB': 5.0,
  'HH': 5.5, 'HE': 6.0, 'MV': 6.0, 'NI': 5.0, 'NW': 6.5,
  'RP': 5.0, 'SL': 6.5, 'SN': 3.5, 'ST': 5.0, 'SH': 6.5, 'TH': 5.0,
};
```
PLZ-basierte Ableitung mit einer Lookup-Funktion (PLZ-Prefix → Bundesland). Alternativ: Dropdown falls PLZ nicht eindeutig zuordenbar.

### Betroffene Dateien
1. **`ObjekteingangDetail.tsx`** — Layout-Umstrukturierung, ExposePdfViewer-Entfernung
2. **Neue Datei: `ObjektAnkaufskosten.tsx`** — Ankaufskostenübersicht mit GrESt/Notar/Makler
3. **`ObjektBasisdaten.tsx`** — Erweitert um Anbieter-Info
4. **`BestandCalculation.tsx`** — `ancillaryCostPercent` aus initialData statt Hardcode
5. **`AufteilerCalculation.tsx`** — Gleiche Anpassung
6. **`spec.ts`** (Engine) — GrESt-Raten und PLZ-Mapping als Konstanten (da Geschäftslogik)

### Engine-Logik: Keine Änderung
Die Berechnungsfunktionen `calcBestandFull` und `calcAufteilerFull` bleiben unverändert. Nur die UI-Darstellung und die Vorbelegung der `ancillaryCostPercent` ändern sich.

