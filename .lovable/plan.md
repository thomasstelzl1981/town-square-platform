

# Plan: Objektdaten & Grundbuch vollständig anzeigen (keine versteckten Felder)

## Problem

1. **Sektion 2 (Grundbuch)** wird nur angezeigt wenn `legalTitle` Daten hat UND `sourceMode === 'SSOT_FINAL'`. Da die meisten Grundbuchfelder im DB-Record `null` sind, verschwindet die ganze Sektion. Der User sieht nicht, was fehlt.

2. **Teilungserklärung-Badge** wird immer angezeigt, auch wenn `weg_flag = false` — bei einem nicht-aufgeteilten Objekt (MFH ohne WEG) ist das unsinnig.

3. **Objektsteckbrief (Sektion 1b)** versteckt alle Felder mit Null-Werten. Stattdessen sollen alle relevanten Felder immer sichtbar sein mit "–" als Platzhalter, damit der User sieht, was noch erfasst werden muss.

4. **Fehlende Felder im Snapshot**: `heating_type`, `energy_source`, `core_renovated`, `renovation_year`, `ownership_share_percent` sind in der DB vorhanden, aber nicht im Snapshot gemappt oder nicht im Reader angezeigt.

## Konkrete Anderungen

### 1. `ValuationReportReader.tsx` — Sektion 1b (Objektsteckbrief) aufrüsten

**Alle Felder immer anzeigen**, nicht conditional. Statt `{snapshot.yearBuilt != null && <DataRow ...>}` einfach `<DataRow label="Baujahr" value={snapshot.yearBuilt ? String(snapshot.yearBuilt) : '–'} />`.

Neue Felder hinzufügen:
- Heizungsart (`heatingType`)
- Energieträger (`energySource`)  
- Kernsaniert Ja/Nein + Jahr (`coreRenovated`, `renovationYear`)
- Eigentumsanteil (`ownershipSharePercent`)
- Kaufpreis und Ankaufsnebenkosten
- Energieausweis-Kennwert (wenn vorhanden)

Aufbau in 3 Spalten-Blöcke:
- **Lage & Identifikation**: Adresse, PLZ/Ort, Objektart, Baujahr, Code
- **Flächen & Aufteilung**: Wohnfläche, Nutzfläche, Grundstück, Zimmer, Einheiten, Stellplätze
- **Zustand & Energie**: Heizung, Energieträger, Energieklasse, Kernsaniert, Modernisierungen
- **Wirtschaftlichkeit**: Kaltmiete, Miete/m², Hausgeld, Kaufpreis, Eigentumsanteil

### 2. `ValuationReportReader.tsx` — Sektion 2 (Grundbuch) immer anzeigen

- `sourceMode === 'SSOT_FINAL'`-Guard entfernen — Grundbuch-Sektion immer sichtbar
- Alle Felder immer rendern (mit "–" bei null)
- **Teilungserklärung-Badge nur anzeigen wenn `wegFlag === true`**
- Info-Hinweis ergänzen: "Fehlende Grundbuchangaben können in der Immobilienakte ergänzt werden"

### 3. `CanonicalPropertySnapshot` erweitern (spec.ts)

Neue optionale Felder:
- `heatingType?: string`
- `energySource?: string`
- `coreRenovated?: boolean`
- `renovationYear?: number`
- `ownershipSharePercent?: number`
- `energyCertificateValue?: number`

### 4. `useValuationCase.ts` — Snapshot-Mapping erweitern

Die neuen Felder aus `inputs.snapshot` korrekt durchreichen.

## Dateien

| Datei | Anderung |
|-------|----------|
| `src/components/shared/valuation/ValuationReportReader.tsx` | Alle Felder immer sichtbar, neue Felder, Grundbuch-Guard entfernen, Teilungserklärung conditional auf WEG |
| `src/engines/valuation/spec.ts` | CanonicalPropertySnapshot erweitern |
| `src/hooks/useValuationCase.ts` | Snapshot-Mapping fur neue Felder |

Keine DB-Migration, keine Edge-Function-Anderung notig.

