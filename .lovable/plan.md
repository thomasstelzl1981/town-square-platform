

# Plan: Fehlende Datenübernahme im Gutachten — Zustand, Energie, Grundbuch + Zeilen entfernen

## Root Cause

### 1. Grundbuchdaten (Sektion 2) — snake_case → camelCase Mapping fehlt

Die Edge Function liefert `legal_title` im Format:
```json
{ "land_register_court": "...", "land_register_sheet": "...", "parcel_number": "..." }
```

In `useValuationCase.ts` Zeile 411 wird das Objekt **ohne Mapping** weitergereicht:
```typescript
legalTitle: runSummary?.legal_title ?? rawSnapshot?.legal_title ?? null,
```

Die UI (`ValuationReportReader.tsx` Zeile 473) erwartet aber camelCase:
```typescript
legalTitle?.landRegisterCourt  // → undefined, weil Feld heißt land_register_court
```

### 2. Zustand & Energie (Heizung, Energieträger, Energieklasse)

Die Felder `heatingType`, `energySource`, `energyClass` sind korrekt im Snapshot-Mapping (Zeilen 389-390, 378). **Aber**: Die `properties`-Tabelle muss die Spalten `heating_type`, `energy_source` und `energy_class` tatsächlich befüllt haben. Das wurde im letzten Fix ergänzt, braucht aber ein **neu erzeugtes** Gutachten.

**Zusätzliches Problem**: Wenn die Dossier-Eingabe die Felder in `properties` nicht korrekt speichert (z.B. `energy_class` Spalte wurde gerade erst angelegt), sind die Werte noch `null` in der DB → Snapshot enthält `null` → UI zeigt "–".

### 3. Angebotspreis & Nebenkosten — sollen entfernt werden

Zeile 421-422 in `ValuationReportReader.tsx`:
```tsx
<DataRow label="Angebotspreis" ... />
<DataRow label="Nebenkosten" ... />
```

## Änderungen

### A. `src/hooks/useValuationCase.ts` — LegalTitle camelCase-Mapping hinzufügen

Zeile 411 ersetzen mit einem vollständigen Mapping:
```typescript
legalTitle: (() => {
  const lt = runSummary?.legal_title ?? rawSnapshot?.legal_title;
  if (!lt) return null;
  return {
    landRegisterCourt: lt.land_register_court ?? lt.landRegisterCourt ?? null,
    landRegisterSheet: lt.land_register_sheet ?? lt.landRegisterSheet ?? null,
    landRegisterVolume: lt.land_register_volume ?? lt.landRegisterVolume ?? null,
    parcelNumber: lt.parcel_number ?? lt.parcelNumber ?? null,
    ownershipSharePercent: lt.ownership_share_percent ?? lt.ownershipSharePercent ?? null,
    wegFlag: lt.weg_flag ?? lt.wegFlag ?? false,
    teNumber: lt.te_number ?? lt.teNumber ?? null,
    unitOwnershipNr: lt.unit_ownership_nr ?? lt.unitOwnershipNr ?? null,
    meaShare: lt.mea_share ?? lt.meaShare ?? null,
    landRegisterExtractAvailable: lt.land_register_extract_available ?? lt.landRegisterExtractAvailable ?? false,
    partitionDeclarationAvailable: lt.partition_declaration_available ?? lt.partitionDeclarationAvailable ?? false,
    encumbrancesNote: lt.encumbrances_note ?? lt.encumbrancesNote ?? '',
  };
})(),
```

### B. `src/components/shared/valuation/ValuationReportReader.tsx` — Zeilen Angebotspreis & Nebenkosten entfernen

Zeile 421-422 löschen:
```diff
- <DataRow label="Angebotspreis" value={...} />
- <DataRow label="Nebenkosten" value={...} />
```

### C. DB-Prüfung: Heizungsdaten in `properties`

Prüfen ob die Spalten `heating_type`, `energy_source` in `properties` tatsächlich Daten enthalten für die betroffene Immobilie. Falls die Immobilienakte sie zwar im UI anzeigt aber nicht persistiert, muss der Mutations-Layer (`useDossierMutations`) geprüft werden.

## Dateien

| Datei | Änderung |
|-------|----------|
| `src/hooks/useValuationCase.ts` | LegalTitle snake→camelCase Mapping |
| `src/components/shared/valuation/ValuationReportReader.tsx` | Angebotspreis + Nebenkosten Zeilen entfernen |

