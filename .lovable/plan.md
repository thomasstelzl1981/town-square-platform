

## Problem: Wohneinheiten-Feld ist am falschen Ort

Das Feld "Anzahl Wohneinheiten" wurde im Block **"Gebäude & Flächen"** (rechte Kachel) platziert. Der Nutzer wählt aber "Mehrfamilienhaus" im Block **"Identität und Stammdaten"** (linke Kachel) und erwartet das Feld dort — direkt unter der Objektart-Auswahl.

### Lösung

**1. `EditableIdentityBlock.tsx` — Wohneinheiten-Feld hinzufügen**
- Neue Props: `unitCountActual`, `onFieldChange` (schon vorhanden)
- Wenn `propertyType === 'MFH'`: Ein Nummernfeld "Wohneinheiten" direkt unter dem Objektart-Dropdown einblenden
- Gleiche Logik wie bisher im BuildingBlock, nur am richtigen Ort

**2. `EditableBuildingBlock.tsx` — Feld dort entfernen**
- `unitCountActual` und `propertyType` Props bleiben (für eventuelle spätere Nutzung), aber das sichtbare Eingabefeld wird aus dem Building-Block entfernt, um Duplikate zu vermeiden

**3. `EditableUnitDossierView.tsx` — Props an IdentityBlock weitergeben**
- `unitCountActual={formData.unitCountActual}` zum IdentityBlock hinzufügen (dort fehlt es noch)

### Betroffene Dateien (alle MOD-04, aktuell ungefroren)

| Datei | Änderung |
|---|---|
| `src/components/immobilienakte/editable/EditableIdentityBlock.tsx` | Wohneinheiten-Feld bei MFH anzeigen |
| `src/components/immobilienakte/editable/EditableBuildingBlock.tsx` | Wohneinheiten-Feld entfernen |
| `src/components/immobilienakte/EditableUnitDossierView.tsx` | `unitCountActual` Prop an IdentityBlock übergeben |

