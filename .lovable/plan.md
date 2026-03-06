

## Problem: `unitCountActual` fehlt in der Change-Detection

Das Feld `unitCountActual` wurde korrekt in der Mutation (`useDossierMutations.ts`) und im Loader (`useUnitDossier.ts`) implementiert, aber **nicht** in der Change-Detection-Liste von `useDossierForm.ts` registriert.

### Ursache (1 Zeile)

In `src/hooks/useDossierForm.ts`, Zeile 53-61: Die `propertyFields`-Array enthält `coreRenovated` und `renovationYear`, aber **nicht** `unitCountActual`. Dadurch wird die Änderung zwar als "dirty" markiert (Banner erscheint), aber `getPropertyChanges()` gibt `null` zurück weil das Feld nicht in der Whitelist ist.

### Fix

**`src/hooks/useDossierForm.ts`**:
1. Zeile 60: `unitCountActual` zur `propertyFields`-Array hinzufügen
2. Nach Zeile 111: Mapping hinzufügen: `if ((changes as any).unitCountActual !== undefined) (mapped as any).unitCountActual = (changes as any).unitCountActual;`

Das sind 2 Zeilen in einer einzigen Datei — kein Freeze-Problem da `useDossierForm.ts` kein Modul-Pfad ist.

