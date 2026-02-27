

## Aufräumen: Tote Dateien aus MOD-17 entfernen

### Befund

| Datei | Status | Referenziert von |
|-------|--------|-----------------|
| `CarsAutos.tsx` | **Tot** — nirgends importiert | Keine Imports gefunden |
| `VehicleCreateDialog.tsx` | **Tot** — nur von `CarsAutos.tsx` genutzt | `CarsAutos.tsx`, `index.ts` |

Die aktive Fahrzeug-Komponente ist `CarsFahrzeuge.tsx` mit Inline-Anlage (kein Dialog). Beide Dateien sind Altlasten aus dem ersten Entwurf.

### Freeze-Check
MOD-17 ist aktuell **unfrozen** — Änderung erlaubt.

### Änderungen

1. **`src/components/portal/cars/CarsAutos.tsx`** — Datei löschen
2. **`src/components/portal/cars/VehicleCreateDialog.tsx`** — Datei löschen
3. **`src/components/portal/cars/index.ts`** — Zwei Exports entfernen:
   - `export { VehicleCreateDialog } from './VehicleCreateDialog';`
   - (CarsAutos hat keinen Export in index.ts, daher nur VehicleCreateDialog)
4. **`spec/current/00_frozen/modules_freeze.json`** — MOD-17 wieder auf `frozen: true` setzen (Refreeze)

