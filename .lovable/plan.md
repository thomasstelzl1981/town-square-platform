

## Bug-Analyse: Bilder-Upload in MOD-13 schlägt fehl

### Root Cause (gefunden)

**DB-Constraint-Verletzung:** Der Code in `ProjectDataSheet.tsx` übergibt `entityType: 'projekt'` (deutsch), aber der CHECK-Constraint auf `document_links.object_type` erlaubt nur `'project'` (englisch).

```
CHECK (object_type = ANY (ARRAY['property','unit','contact','finance_case',
  'service_case','vehicle','insurance','lease','profil','project',
  'pet_provider','postservice_delivery','inbound_email','finance_request']))
```

In MOD-01 (ProfilTab) funktioniert der Upload, weil dort `entityType: 'profil'` übergeben wird — ein gültiger Wert. In MOD-13 scheitert der `document_links` INSERT an Zeile 120-129 des Hooks, weil `'projekt'` kein erlaubter Wert ist.

### Fix (1 Zeile)

**Datei:** `src/components/projekte/ProjectDataSheet.tsx`, Zeile 157

| Vorher | Nachher |
|--------|---------|
| `entityType: 'projekt'` | `entityType: 'project'` |

Zusätzlich muss der `loadSlotImages`-Aufruf (Zeile 261) ebenfalls `'project'` statt `'projekt'` verwenden — aber der nutzt bereits den Wert `'projekt'` als Parameter. Beide Stellen anpassen.

### Zweites Problem: Slot-Höhe zu niedrig

Die `IMAGE_SLOT.HEIGHT` in `designManifest.ts` ist auf **140px** gesetzt. Für Projekt-/Immobilienbilder ist das zu flach. 

**Fix:** Höhe auf **180px** erhöhen (Zeile 333 in `designManifest.ts`).

### Zusammenfassung

| # | Datei | Änderung |
|---|-------|----------|
| 1 | `ProjectDataSheet.tsx` Z.157 | `'projekt'` → `'project'` |
| 2 | `ProjectDataSheet.tsx` Z.261 | `loadSlotImages(projectId, 'projekt')` → `'project'` |
| 3 | `designManifest.ts` Z.333 | `HEIGHT: 140` → `HEIGHT: 180` |

