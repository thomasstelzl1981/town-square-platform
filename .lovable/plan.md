

## Implementierungsplan: ARM.MOD04.ENRICH_FROM_STORAGE

UNFREEZE INFRA-edge_functions wurde bestätigt. Alle Änderungen betreffen eine einzelne Datei:

**Datei:** `supabase/functions/sot-armstrong-advisor/index.ts`

### 6 Änderungsstellen

**1. System-Prompt (Zeile 482-485) — Entity-aware Magic Intake Regel**

Ersetze die pauschale "MAGIC INTAKE REGEL" durch eine kontextbewusste Version:
- Wenn `body.entity?.id` gesetzt ist: Instruiere Armstrong, KEINE Neuanlage vorzuschlagen, sondern ENRICH
- Wenn keine Entität: Bisherige Magic Intake Regel beibehalten

**2. MVP_EXECUTABLE_ACTIONS (nach Zeile 546) — Neuen Eintrag hinzufügen**

Füge `"ARM.MOD04.ENRICH_FROM_STORAGE"` in die Liste ein (nach `ARM.DMS.STORAGE_EXTRACTION`).

**3. MVP_ACTIONS (nach Zeile 1192) — Action-Definition hinzufügen**

Neue ActionDefinition:
- action_code: `ARM.MOD04.ENRICH_FROM_STORAGE`
- title_de: "Daten aus Dokument in Akte übernehmen"
- module: MOD-04, risk_level: medium, execution_mode: execute_with_confirmation
- data_scopes_read: documents, document_structured_data, storage_nodes
- data_scopes_write: properties, units

**4. Intent-Classifier Keywords (Zeile 1270-1274) — Neue Keywords**

Neue Keywords für den ACTION-Intent:
- "grundbuch auslesen", "daten übernehmen", "akte befüllen", "enrich", "in die akte", "daten aus dokument", "grundbuchdaten", "dokument auslesen"

**5. suggestActionsForMessage (Zeile 1304-1508) — Entity-aware Boost**

- Signatur erweitern: `suggestActionsForMessage(message, availableActions, entity?)` 
- Neue ENRICH-Boost-Regel: Wenn `entity?.id` + `entity.type === "property"` + Grundbuch-/Daten-Keywords → ENRICH +10 Relevanz
- MAGIC_INTAKE_PROPERTY unterdrücken wenn `entity?.id` gesetzt: Relevanz auf 0 setzen
- Alle 3 Call-Sites (Zeilen 4688, 4753, 4807) aktualisieren um `entity` weiterzugeben

**6. Execution-Handler (vor Zeile 3373 `default:`) — Neuer Case**

Neuer `case "ARM.MOD04.ENRICH_FROM_STORAGE"`:
1. Prüfe `entity.id` + `entity.type === "property"` — Pflicht
2. Lade `document_structured_data` für diese Property (via `property_id` + `tenant_id`)
3. Falls keine Daten: Suche `storage_nodes` mit `entity_id = property_id`, triggere on-demand `sot-storage-extractor`
4. Mappe `extracted_fields` → `properties`-Update:
   - `amtsgericht` → `land_register_court`
   - `grundbuchbezirk` → `land_register_volume` (Bezirk als Band)
   - `blatt_nr` → `land_register_sheet`
   - `flurstueck` → `parcel_number`
   - `eigentuemer` → in `land_register_refs` als JSONB
   - `abteilung_ii_lasten`, `abteilung_iii_hypotheken` → in `land_register_refs` als JSONB
5. Nur NULL-Felder überschreiben (oder alle mit Preview)
6. Rückgabe: Markdown-Preview mit gefundenen Daten + Anzahl aktualisierter Felder

### Keine DB-Migration nötig

Alle Spalten (`land_register_court`, `land_register_sheet`, `land_register_volume`, `parcel_number`, `land_register_refs`) existieren bereits in der `properties`-Tabelle.

### Testmatrix

| Szenario | Erwartet |
|---|---|
| In Immobilienakte: "Lies den Grundbuchauszug aus" | Armstrong schlägt ENRICH vor, NICHT Neuanlage |
| Ohne aktive Entität: "Leg Immobilie aus Kaufvertrag an" | Armstrong schlägt MAGIC_INTAKE vor |
| ENRICH bestätigt + document_structured_data vorhanden | Grundbuchdaten in properties geschrieben |
| ENRICH bestätigt + keine extrahierten Daten | Armstrong meldet "Keine extrahierten Daten gefunden" |
| System-Prompt enthält entity.id | "ENTITY-AWARE DOKUMENTREGEL" statt "MAGIC INTAKE REGEL" |

