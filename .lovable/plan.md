

# Plan: Grundstücksfläche & MEA in die Immobilienakte integrieren

## Analyse

### IST-Zustand
- Die `properties`-Tabelle hat **KEINE** Spalte `plot_area_sqm` (Grundstücksfläche)
- `mea_share` existiert bereits auf der `units`-Tabelle und wird im EditableWEGBlock angezeigt — aber nur wenn `wegFlag = true`
- `mea_total` existiert auf `properties` 
- Die Valuation Engine nutzt `property.plot_area_sqm` (Zeile 122 in `engine.ts`), aber das Feld ist im DB-Schema nicht vorhanden → immer `null` → Heuristik greift (2.5× Wohnfläche bei MFH)
- Ohne echte Grundstücksfläche + MEA kann der Bodenwert nicht korrekt berechnet werden

### Wo gehören die Felder hin?

**Grundstücksfläche (`plot_area_sqm`)** → gehört auf die `properties`-Tabelle (Grundstück ist Eigenschaft der Liegenschaft, nicht der Einheit). Bei Teileigentum wird der anteilige Bodenwert über `mea_share / mea_total × plot_area_sqm × BRW` berechnet.

**MEA-Anteil (`mea_share`)** → existiert bereits auf `units`. Ist korrekt platziert (pro Einheit unterschiedlich). Wird bereits im WEG-Block angezeigt, aber **nur wenn WEG = Ja**. Problem: Auch bei Nicht-WEG-Objekten kann ein MEA relevant sein (z.B. Teileigentum).

## Änderungen

### 1. DB-Migration: `plot_area_sqm` auf `properties` hinzufügen
```sql
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS plot_area_sqm numeric DEFAULT NULL;
```

### 2. EditableLegalBlock erweitern
Die Grundstücksfläche gehört fachlich zum **Grundbuch-Block** (Block D), da das Flurstück und die Grundstücksgröße zusammengehören. Neues Feld `Grundstücksfläche (m²)` neben dem Flurstück-Feld.

Zusätzlich: MEA-Felder (Anteil + Gesamt) aus dem WEG-Block in den Legal-Block **duplizieren** oder verschieben, damit sie auch bei Nicht-WEG-Objekten (Teileigentum) sichtbar sind. Alternativ: MEA-Felder im Legal-Block nur anzeigen wenn `wegFlag = true`, aber Grundstücksfläche immer anzeigen.

### 3. Types aktualisieren
- `LegalData` in `immobilienakte.ts`: `plotAreaSqm?: number` hinzufügen
- `UnitDossierData`: `plotAreaSqm?: number` hinzufügen
- `PropertyFormData`: `plotAreaSqm?: number` hinzufügen

### 4. useUnitDossier Hook
`plotAreaSqm: property.plot_area_sqm` in den Dossier-Builder aufnehmen (Block D: Legal).

### 5. useDossierMutations Hook
`plotAreaSqm` → `plot_area_sqm` Mapping für property-Updates hinzufügen.

### 6. Valuation Engine — kein Code-Change nötig
`engine.ts` Zeile 122 liest bereits `property.plot_area_sqm` — sobald die DB-Spalte existiert und befüllt wird, fließt der echte Wert automatisch in die Bewertung.

### 7. Read-Only Blocks (IdentityBlock, CoreDataBlock)
`CoreDataBlock` um Grundstücksfläche erweitern (Anzeige im Read-Only-Modus).

## Betroffene Dateien

| # | Datei | Änderung |
|---|---|---|
| 1 | DB-Migration | `plot_area_sqm` Spalte auf `properties` |
| 2 | `src/types/immobilienakte.ts` | `plotAreaSqm` in LegalData, UnitDossierData, PropertyFormData |
| 3 | `src/components/immobilienakte/editable/EditableLegalBlock.tsx` | Grundstücksfläche-Feld + MEA-Anzeige |
| 4 | `src/hooks/useUnitDossier.ts` | plotAreaSqm mappen |
| 5 | `src/hooks/useDossierMutations.ts` | plotAreaSqm → plot_area_sqm für Speicherung |
| 6 | `src/components/immobilienakte/CoreDataBlock.tsx` | Grundstücksfläche in Read-Only anzeigen |

