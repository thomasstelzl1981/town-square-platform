

# Plan: Kernsanierung-Flag in die Immobilienakte integrieren

## Kontext

Für die korrekte Berechnung der Restnutzungsdauer (ImmoWertV §4c) ist entscheidend, ob eine Kernsanierung durchgeführt wurde. Bei Kernsanierung wird die Gesamtnutzungsdauer auf das Sanierungsjahr zurückgesetzt (typisch: 60-80 Jahre ab Sanierung statt ab Baujahr). Die DB hat bereits `renovation_year` auf `properties`, aber kein `core_renovated`-Flag. Ohne dieses Flag kann nicht unterschieden werden, ob eine Teilsanierung oder Kernsanierung vorliegt.

## Änderungen

### 1. DB-Migration: `core_renovated` auf `properties`
```sql
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS core_renovated boolean DEFAULT false;
```

### 2. Types (`src/types/immobilienakte.ts`)
- `BuildingData`: `coreRenovated?: boolean` hinzufügen
- `PropertyFormData`: `coreRenovated?: boolean` und `renovationYear?: number` hinzufügen

### 3. UI: `EditableBuildingBlock.tsx`
Neue Zeile im Grid nach den bestehenden Feldern (vor Heizung):
- **Sanierungsjahr** (number input) — mappt auf `renovation_year`
- **Kernsanierung** (Checkbox) — mappt auf `core_renovated`

Kompakte Darstellung: 2-spaltig, Checkbox + Jahr nebeneinander.

### 4. Speicher-Pipeline (3 Dateien)
- `useDossierForm.ts`: `'coreRenovated'` und `'renovationYear'` in `propertyFields` + Mapping
- `useDossierMutations.ts`: `coreRenovated → core_renovated` und `renovationYear → renovation_year`
- `useUnitDossier.ts`: Felder im Dossier-Builder mappen (SELECT ist bereits `*`)

### 5. Read-Only: `CoreDataBlock.tsx`
Kernsanierung + Sanierungsjahr anzeigen (Badge "Kernsaniert" wenn true).

## Betroffene Dateien

| # | Datei | Änderung |
|---|---|---|
| 1 | DB-Migration | `core_renovated boolean` Spalte |
| 2 | `src/types/immobilienakte.ts` | `coreRenovated` + `renovationYear` in BuildingData + PropertyFormData |
| 3 | `src/components/immobilienakte/editable/EditableBuildingBlock.tsx` | Checkbox + Jahrfeld |
| 4 | `src/hooks/useDossierForm.ts` | propertyFields + Mapping |
| 5 | `src/hooks/useDossierMutations.ts` | DB-Mapping |
| 6 | `src/hooks/useUnitDossier.ts` | Dossier-Builder Mapping |
| 7 | `src/components/immobilienakte/CoreDataBlock.tsx` | Read-Only Anzeige |
| 8 | `src/components/immobilienakte/EditableUnitDossierView.tsx` | Props durchreichen |

