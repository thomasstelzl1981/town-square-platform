

# Fix: Grundstücksfläche (und weitere Felder) werden nicht gespeichert

## Root Cause

Die Datei `src/hooks/useDossierForm.ts` enthält in der Funktion `getPropertyChanges()` (Zeile 53-59) eine **hardcodierte Liste** von Property-Feldern, die beim Speichern berücksichtigt werden:

```typescript
const propertyFields = [
  'propertyType', 'category', 'propertyStatus', 'saleEnabled', 'rentalManaged',
  'vermieterKontextId', 'reportingRegime', 'street', 'houseNumber', 'postalCode',
  'city', 'locationLabel', 'locationNotes', 'description', 'latitude', 'longitude', 'buildYear',
  'usageType', 'heatingType', 'energySource', 'landRegisterCourt', 'landRegisterSheet',
  'landRegisterVolume', 'parcelNumber', 'teNumber', 'purchaseDate', 'purchasePrice',
  'marketValue', 'acquisitionCosts', 'wegFlag', 'meaTotal', 'allocationKeyDefault'
];
```

**`plotAreaSqm` fehlt in dieser Liste.** Wenn der User die Grundstücksfläche ändert, wird das Feld zwar als `dirty` markiert, aber `getPropertyChanges()` extrahiert es nie — also wird es nie an `useUpdateProperty` übergeben und nie in die DB geschrieben.

Zusätzlich fehlt in der Mapping-Sektion (Zeile 73-107) die Zeile:
```typescript
if (changes.plotAreaSqm !== undefined) mapped.plotAreaSqm = changes.plotAreaSqm;
```

Das gleiche Problem betrifft auch `totalAreaSqm` — dieses Feld steht zwar in der `propertyFields`-Liste, hat aber **kein Mapping** in der Mapped-Sektion (Zeile 73-107). Weitere fehlende Mappings: `totalAreaSqm` → `mapped.totalAreaSqm`.

## Fix

**Datei:** `src/hooks/useDossierForm.ts`

1. **Zeile 53-59**: `'plotAreaSqm'` zur `propertyFields`-Liste hinzufügen
2. **Zeile 73-107**: Mapping-Zeile hinzufügen:
   ```typescript
   if (changes.plotAreaSqm !== undefined) mapped.plotAreaSqm = changes.plotAreaSqm;
   ```

3. **Save-UX**: Im `handleSave` in `EditableUnitDossierView.tsx` bei No-Op (keine echten Changes) eine Warnung statt Erfolgsmeldung anzeigen.

## Betroffene Dateien

| # | Datei | Änderung |
|---|---|---|
| 1 | `src/hooks/useDossierForm.ts` | `plotAreaSqm` in propertyFields + Mapping |
| 2 | `src/components/immobilienakte/EditableUnitDossierView.tsx` | No-Op Save Warnung |

