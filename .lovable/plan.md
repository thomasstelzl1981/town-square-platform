

## Konsolidierter Reparaturplan: 4 Bugs — Bestätigt durch Claude + Lovable Analyse

---

### Zusammenfassung der Befunde

Beide Analysen (Claude extern + Lovable intern) stimmen in allen 4 Punkten überein. Hier der finale, zusammengeführte Plan:

---

### BUG 1: DMS-Datei-Linking schlägt still fehl (KRITISCH)

**Root Cause:** `storage_path` und `mime_type` Spalten existieren nicht in `storage_nodes`. Der Insert schlägt fehl, aber der `catch`-Block loggt nur und wirft nicht.

**DB-Bestätigung:** Query `SELECT column_name ... WHERE column_name IN ('storage_path','mime_type')` liefert `[]` — Spalten fehlen definitiv.

**Fix — 2 Teile:**

Teil A — DB-Migration:
```sql
ALTER TABLE storage_nodes
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;
```

Teil B — Edge Function `sot-project-intake/index.ts`, Zeilen 790-841:
Error-Check nach beiden Inserts (Exposé Z.792, Preisliste Z.827). Statt `catch` nur loggen → bei Fehler Error-Objekt prüfen und loggen mit Kontext.

---

### BUG 2: Key Facts zeigen "—" für echte Projekte (KRITISCH)

**Root Cause:** `ProjectOverviewCard.tsx` Z.73-80 liest ausschließlich aus `demoData`. Für echte Projekte ist `demoData = null` → alle Felder "—".

**Daten vorhanden:** `intake_data` JSONB-Feld in `dev_projects` enthält `construction_year`, `modernization_status`, `total_area_sqm` etc. Der Hook `useDevProjects` selektiert bereits `*` (enthält `intake_data`). PortfolioTab Z.222 übergibt `projects.find(...)` als `fullProject` — der Datenpfad ist komplett.

**Fix:** `ProjectOverviewCard.tsx` Z.72-80 ersetzen:
- `intake_data` aus `fullProject` extrahieren
- `constructionYear`, `modernizationStatus`, `totalAreaSqm` daraus lesen
- Fallback-Kaskade: `intakeData` → `demoData` → `'—'`

---

### BUG 3: `module_code: 'MOD_13'` (Underscore) statt `'MOD-13'` (Bindestrich)

**Root Cause:** 7 Stellen in der Edge Function verwenden `MOD_13` mit Underscore. Plattformstandard ist `MOD-13` mit Bindestrich (bestätigt durch Memory `dms-query-and-naming-standard`).

**Fix — 2 Teile:**

Teil A — Edge Function: Alle 7 Stellen `'MOD_13'` → `'MOD-13'` (Zeilen 700, 721, 734, 749, 762, 796, 831)

Teil B — DB-Migration für bestehende Daten:
```sql
UPDATE storage_nodes SET module_code = 'MOD-13' WHERE module_code = 'MOD_13';
```

---

### BUG 4: Units-Insert Error-Check unvollständig

**Status:** Bereits gefixt! Z.655 hat `throw new Error('Units insert failed: ' + unitsErr.message)`. Kein weiterer Handlungsbedarf.

---

### Betroffene Dateien

| Datei | Bug | Änderung |
|---|---|---|
| DB-Migration (SQL) | 1, 3 | `ADD COLUMN storage_path, mime_type` + `UPDATE module_code` |
| `supabase/functions/sot-project-intake/index.ts` | 1, 3 | Error-Check bei DMS-Linking + `MOD_13` → `MOD-13` (7 Stellen) |
| `src/components/projekte/ProjectOverviewCard.tsx` | 2 | Key Facts aus `intake_data` lesen mit Fallback auf `demoData` |

---

### Freeze-Check

- MOD-13: `frozen: false` — Alle Änderungen erlaubt

---

### Implementierungsreihenfolge

| Schritt | Aktion | Aufwand |
|---|---|---|
| 1 | DB-Migration: `storage_path` + `mime_type` + `module_code`-Korrektur | 1 min |
| 2 | Edge Function: 7× `MOD_13` → `MOD-13` + Error-Check bei DMS-Linking | 5 min |
| 3 | `ProjectOverviewCard`: Key Facts aus `intake_data` | 5 min |
| 4 | Deploy Edge Function + Verifizierung | 3 min |

**Gesamtaufwand:** ~14 Minuten

Nach diesen Fixes: Altes Projekt löschen (Cleanup Edge Function), neuen Intake durchführen, und verifizieren dass Dateien im DMS erscheinen, Metadaten korrekt angezeigt werden, und der Kalkulator die richtigen Werte zeigt.

