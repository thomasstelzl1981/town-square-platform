
# AfA-Implementierung vervollstaendigen + Demo-Daten mit realistischen AfA-Werten

## Teil 1: Bug-Fix — useVVSteuerData laedt neue Spalten nicht

**Problem:** Die V+V-Datenabfrage in `src/hooks/useVVSteuerData.ts` (Zeile 36) selektiert nur die alten Spalten aus `property_accounting`. Die neuen AfA-Spalten (`afa_model`, `ak_ground`, `ak_building`, `ak_ancillary`, `book_value_eur`, `book_value_date`, `cumulative_afa`, `sonder_afa_annual`, `denkmal_afa_annual`) fehlen im SELECT.

**Auswirkung:** Die V+V-Engine berechnet die AfA immer mit Fallback-Werten (0), obwohl die Daten in der DB vorhanden waeren.

**Fix:** Zeile 36 in `useVVSteuerData.ts` erweitern:

```text
property_accounting SELECT erweitern um:
  afa_model, ak_ground, ak_building, ak_ancillary,
  book_value_eur, book_value_date, cumulative_afa,
  sonder_afa_annual, denkmal_afa_annual
```

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useVVSteuerData.ts` | SELECT um 9 neue Spalten erweitern (Zeile 36) |

---

## Teil 2: Demo-Daten mit realistischen AfA-Werten befuellen

**Ist-Zustand der DB** (`property_accounting`):

| Property | Gebaeude% | Grund% | AfA-Satz | ak_ground | ak_building | ak_ancillary |
|----------|-----------|--------|----------|-----------|-------------|-------------|
| BER-01 (280.000 EUR) | 70% | 30% | 2,0% | 0 | 0 | 0 |
| MUC-01 (420.000 EUR) | 75% | 25% | 2,0% | 0 | 0 | 0 |
| HH-01 (175.000 EUR) | 65% | 35% | 2,0% | 0 | 0 | 0 |

Die AfA-Aufteilung fehlt komplett. Ohne `ak_building` / `ak_ground` greift nur der Fallback (`purchasePrice * buildingShare%`), was funktioniert, aber die neue Kachel zeigt leere Felder.

**Realistische Demo-Werte (abgeleitet aus Kaufpreis + Erwerbsnebenkosten):**

| Property | ak_ground | ak_building | ak_ancillary | AfA-Basis | AfA p.a. | Buchwert (31.12.2025) | Kum. AfA |
|----------|-----------|-------------|-------------|-----------|----------|----------------------|----------|
| BER-01 | 84.000 | 196.000 | 30.800 | 217.560 | 4.351 | 182.749 | 34.811 (8 J.) |
| MUC-01 | 105.000 | 315.000 | 46.200 | 349.650 | 6.993 | 314.006 | 35.644 (ab 06/2020, 5,5 J.) |
| HH-01 | 61.250 | 113.750 | 19.250 | 126.318 | 2.526 | 109.326 | 16.992 (ab 03/2019, ~6,75 J.) |

Diese Werte werden per UPDATE in `property_accounting` geschrieben.

**Aenderungen:**

| Aktion | Details |
|--------|---------|
| DB UPDATE | `property_accounting` fuer alle 3 Demo-Properties: `ak_ground`, `ak_building`, `ak_ancillary`, `book_value_eur`, `book_value_date`, `cumulative_afa` befuellen |

---

## Teil 3: Konzept — Demo-Daten aus dem Musterkunden ableiten

### Ist-Zustand

Demo-Daten verteilen sich aktuell auf 3 Quellen:

| Quelle | Beispiele | Steuerung |
|--------|-----------|-----------|
| DB-Seeds (property_accounting, properties, leases) | 3 Immobilien, Mietvertraege, Kontakte | Fest in der Datenbank |
| Client-seitig hardcoded (useDemoListings, demoKontoData) | Kaufy-Listings, Bankkonten, Transaktionen | GP-PORTFOLIO / GP-KONTEN Toggle |
| Engine-Daten (demoData/data.ts) | Versicherungen, Vorsorge, Abos, Fahrzeuge | Diverse GP-Toggles |

### Problem

Die Demo-Properties (BER-01 Berlin, MUC-01 Muenchen, HH-01 Hamburg) widersprechen teilweise der SSOT-Regel: Max Mustermann wohnt in Muenchen, Leopoldstrasse 42. Die Berliner und Hamburger Objekte sind als "Altlasten" markiert, aber noch aktiv.

### Konzept: Zentraler Demo-Property-Generator

Statt die AfA-Werte manuell in der DB zu pflegen, soll ein **clientseitiger Demo-Property-Provider** die vollstaendigen Immobiliendaten (inkl. AfA) aus einer einzigen Quelle liefern — analog zu `demoKontoData.ts` fuer Bankkonten.

**Schritt 1: Neue Datei `src/engines/demoData/demoPropertyData.ts`**

Enthaelt die vollstaendigen Demo-Immobiliendaten als Konstanten:
- Alle 3 Properties mit AK-Split, AfA-Modell, Buchwerten
- Abgeleitet aus dem Musterkunden Max Mustermann
- Konsistent mit den DB-Seeds (gleiche IDs)

**Schritt 2: Hook `useDemoPropertyAccounting(propertyId)`**

- Liefert AfA-Stammdaten clientseitig, wenn GP-PORTFOLIO aktiv
- Wird von `EditableAfaBlock` und `useVVSteuerData` als Fallback genutzt
- Bei echten DB-Daten (ak_building > 0) werden DB-Werte bevorzugt

**Schritt 3: Langfristig — DB-Seeds reduzieren**

Die `property_accounting`-Seeds werden langfristig durch den clientseitigen Provider ersetzt. Toggle OFF = keine Demo-Daten sichtbar, Toggle ON = vollstaendige Immobilienakte mit allen AfA-Werten.

### Reihenfolge der Implementierung

```text
1. useVVSteuerData.ts — SELECT erweitern (Bug-Fix)
2. DB UPDATE — property_accounting mit realistischen AfA-Werten befuellen
3. demoPropertyData.ts — Neue SSOT fuer Demo-Immobilien-Stammdaten (NEU)
4. useDemoPropertyAccounting — Hook fuer clientseitigen Fallback (NEU)
```

### Betroffene Dateien (Zusammenfassung)

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useVVSteuerData.ts` | SELECT um neue AfA-Spalten erweitern |
| `property_accounting` (DB) | UPDATE: realistische AfA-Werte fuer 3 Demo-Properties |
| `src/engines/demoData/demoPropertyData.ts` | NEU — Zentrale Demo-Immobilien-Stammdaten |
| `src/engines/demoData/demoPropertyData.ts` | NEU — Hook `useDemoPropertyAccounting` |
