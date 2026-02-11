
# Armstrong lernt Projekte anlegen: Neue MOD-13 Action

## Ausgangslage

- **Upload ueber Armstrong**: Funktioniert bereits. Der ChatPanel hat eine Upload-Zone (`FileUploader` + `useUniversalUpload`), die Dateien in den `tenant-documents` Bucket hochlaedt. Hochgeladene Dateien werden unterhalb des Chat-Eingabefelds als Karten angezeigt.
- **Fehlende Action**: Es gibt aktuell **keine einzige MOD-13-Action** im Armstrong Manifest. Das bedeutet, Armstrong kennt das Projekte-Modul nicht und kann dort keine Aktionen ausfuehren.
- **Bestehende Verwechslung**: `ARM.MOD00.CREATE_PROJECT` erstellt nur ein Dashboard-Widget (Projekt-Tracker), **kein** echtes Bautraegerprojekt in `dev_projects`.

## Was gebaut wird

### 1. Neue Action: `ARM.MOD13.CREATE_DEV_PROJECT`

Eine neue Action im Armstrong Manifest, die den Magic Intake Workflow ausloest:

| Feld | Wert |
|------|------|
| action_code | `ARM.MOD13.CREATE_DEV_PROJECT` |
| title_de | "Bautraegerprojekt anlegen" |
| execution_mode | `execute_with_confirmation` |
| risk_level | `high` |
| cost_model | `metered` (KI-Analyse kostet Credits) |
| cost_hint_cents | 500 (10 Credits) |
| module | `MOD-13` |
| api_contract | Edge Function `sot-project-intake` |
| data_scopes_write | `dev_projects`, `dev_project_units`, `storage_nodes` |
| side_effects | `modifies_dev_projects`, `creates_storage_tree`, `credits_consumed` |

### 2. Zweite Action: `ARM.MOD13.EXPLAIN_MODULE`

Eine readonly Erklaerung fuer das Projekte-Modul (kostenlos):

| Feld | Wert |
|------|------|
| action_code | `ARM.MOD13.EXPLAIN_MODULE` |
| title_de | "Projekte-Modul erklaeren" |
| execution_mode | `readonly` |
| cost_model | `free` |

### 3. Edge Function Erweiterung

Der `sot-armstrong-advisor` muss den neuen Action-Code erkennen und an `sot-project-intake` delegieren. Wenn ein Nutzer Armstrong sagt "Leg ein Projekt an mit diesen Dateien", passiert Folgendes:

```text
Nutzer laedt Expose + Preisliste ueber Armstrong Chat hoch
    |
    v
Nutzer sagt: "Erstelle ein Projekt aus den hochgeladenen Dateien"
    |
    v
Armstrong erkennt Intent -> ACTION
    |
    v
Schlaegt ARM.MOD13.CREATE_DEV_PROJECT vor
    |
    v
Nutzer bestaetigt (Confirm-Gate, 10 Credits)
    |
    v
Armstrong ruft sot-project-intake auf
    |
    v
Projekt + Units + Storage-Tree werden erstellt
    |
    v
Ergebnis wird im Chat angezeigt (Projekt-ID, Anzahl Einheiten)
```

### 4. MVP Module List erweitern

In `useArmstrongAdvisor.ts` muss `MOD-13` zur MVP-Liste hinzugefuegt werden, damit Armstrong im Projekte-Modul nicht nur erklaert, sondern auch Actions ausfuehren kann:

```text
const MVP_MODULES = ['MOD-00', 'MOD-04', 'MOD-07', 'MOD-08', 'MOD-13'];
```

### 5. Zone 1 Dokumentation

Die neuen Actions erscheinen automatisch im Zone 1 Actions-Katalog (`ArmstrongActions.tsx`), da dieser die `armstrongActions` aus dem Manifest liest. Keine separate Dokumentation noetig.

## Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/armstrongManifest.ts` | 2 neue Actions einfuegen: `ARM.MOD13.CREATE_DEV_PROJECT` + `ARM.MOD13.EXPLAIN_MODULE` |
| `src/hooks/useArmstrongAdvisor.ts` | `MOD-13` zu `MVP_MODULES` hinzufuegen |
| `supabase/functions/sot-armstrong-advisor/index.ts` | Action-Handler fuer `ARM.MOD13.CREATE_DEV_PROJECT` ergaenzen (delegiert an `sot-project-intake`) |

## Governance-Konformitaet

| Regel | Eingehalten |
|-------|-------------|
| K3: Confirm-Gate fuer Schreibaktionen | Ja — `execute_with_confirmation` |
| Kosten vor Ausfuehrung | Ja — 10 Credits, `cost_hint_cents: 500` |
| Audit by Default | Ja — `audit_event_type: ARM_CREATE_DEV_PROJECT` |
| Zone 1 Sichtbarkeit | Ja — automatisch ueber Manifest |
| risk_level korrekt | Ja — `high` (erstellt DB-Records + Storage-Tree) |
