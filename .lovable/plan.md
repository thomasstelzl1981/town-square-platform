

## Analyse: Armstrong schlägt fälschlicherweise Neuanlage statt Anreicherung vor

### Ursache (3 Stellen)

1. **System-Prompt (Zeile 482-484):** Eine pauschale "MAGIC INTAKE REGEL" sagt Armstrong, bei jedem angehängten Dokument eine Neuanlage vorzuschlagen — ohne zu prüfen, ob bereits eine aktive Entität existiert.

2. **Intent-Classifier (Zeile 1385-1392):** Keywords wie "grundstück", "immobilie + dokument" boosten `MAGIC_INTAKE_PROPERTY` mit +5, egal ob `entity.id` gesetzt ist. Es gibt keinen Gegencheck.

3. **Fehlende Aktion:** `ARM.MOD04.ENRICH_FROM_STORAGE` existiert weder im Manifest, noch im MVP_ACTIONS-Array, noch im Execution-Handler.

### Lösung (4 Schritte)

**Alle Änderungen in `supabase/functions/sot-armstrong-advisor/index.ts`** — erfordert UNFREEZE INFRA-edge_functions.

#### 1. System-Prompt: Entity-aware Magic Intake Regel

Zeile 482-485 ersetzen durch kontextbewusste Logik:

```
MAGIC INTAKE REGEL:
- Wenn ein Dokument angehängt ist UND KEINE aktive Entität existiert:
  → Prüfe ob eine Magic Intake Action passt und schlage Neuanlage vor.
- Wenn ein Dokument angehängt ist UND eine aktive Entität existiert (z.B. Immobilie):
  → KEINE Neuanlage vorschlagen!
  → Stattdessen: Daten aus dem Dokument in die bestehende Akte übernehmen (ENRICH).
  → Beispiel: "Ich sehe einen Grundbuchauszug — soll ich die Grundbuchdaten in die Akte übernehmen?"
```

#### 2. Intent-Classifier: ENRICH vor INTAKE priorisieren

In `suggestActionsForMessage()` (Zeile 1385-1392):
- **Neue Regel:** Wenn `entity.id` gesetzt ist UND `entity.type === "property"`, dann `MAGIC_INTAKE_PROPERTY` NICHT boosten, sondern stattdessen `ENRICH_FROM_STORAGE` boosten.
- Dazu muss `suggestActionsForMessage` den `entity`-Parameter erhalten (aktuell bekommt die Funktion nur `message` und `availableActions`).

#### 3. ENRICH_FROM_STORAGE als MVP-Action registrieren

In `MVP_ACTIONS[]` und `MVP_EXECUTABLE_ACTIONS[]`:
```typescript
{
  action_code: "ARM.MOD04.ENRICH_FROM_STORAGE",
  title_de: "Daten aus Dokument in Akte übernehmen",
  description_de: "Liest extrahierte Daten aus einem Dokument im Datenraum und überträgt sie in die bestehende Immobilienakte",
  zones: ["Z2"],
  module: "MOD-04",
  risk_level: "medium",
  execution_mode: "execute_with_confirmation",
  ...
}
```

#### 4. Execution-Handler: `case "ARM.MOD04.ENRICH_FROM_STORAGE"`

Neuer Case in `executeAction()`:
1. Prüfe `entity.id` + `entity.type === "property"` — Pflicht
2. Lade `document_structured_data` für diese Property (gefiltert nach `doc_category` z.B. `grundbuchauszug`)
3. Falls kein extrahierter Datensatz: Suche in `storage_nodes` nach zugeordneten Dokumenten, triggere ggf. `sot-storage-extractor`
4. Mappe extrahierte Felder → `properties`-Spalten (land_register_court, land_register_sheet, parcel_number etc.)
5. Nur NULL-Felder überschreiben (oder alle mit Preview)
6. Rückgabe: Markdown-Preview der gefundenen Daten + Bestätigungs-Gate

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `supabase/functions/sot-armstrong-advisor/index.ts` | System-Prompt, Intent-Classifier, MVP_ACTIONS, Execution-Handler |

### Voraussetzung

**UNFREEZE INFRA-edge_functions** ist erforderlich, da `supabase/functions/*` frozen ist.

### Testmatrix

| Szenario | Erwartet |
|---|---|
| Innerhalb einer Immobilie: "Lies den Grundbuchauszug aus" | Armstrong schlägt ENRICH vor, NICHT Neuanlage |
| Ohne aktive Entität: "Leg die Immobilie aus dem Kaufvertrag an" | Armstrong schlägt MAGIC_INTAKE vor |
| ENRICH bestätigt | Grundbuchdaten werden in properties geschrieben |
| ENRICH ohne extrahierte Daten | Armstrong meldet "Keine extrahierten Daten gefunden" |

