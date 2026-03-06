

## Analyse: Grundbuchauszug → Immobilienakte

### Was existiert bereits

1. **`sot-storage-extractor`** — Extrahiert bereits strukturierte Felder aus Grundbuchauszügen:
   - `amtsgericht`, `grundbuchbezirk`, `blatt_nr`, `eigentuemer`, `abteilung_ii_lasten`, `abteilung_iii_hypotheken`
   - Ergebnis wird in `document_structured_data` gespeichert

2. **`ARM.MOD04.MAGIC_INTAKE_PROPERTY`** — Erstellt eine *neue* Immobilie aus einem Dokument (Kaufvertrag, Exposé). Funktioniert nur für Neuanlage, NICHT für Updates.

3. **`ARM.MOD04.DATA_QUALITY_CHECK`** — Prüft Vollständigkeit, schreibt aber keine Daten.

### Was fehlt

Es gibt **keine Armstrong-Aktion**, die:
- ein Dokument aus dem Storage einer *bestehenden* Immobilie liest
- die extrahierten Felder auf die vorhandene Akte anwendet (UPDATE statt INSERT)

Das ist die fehlende Brücke: **"Lies den Grundbuchauszug aus meinem Datenraum und fülle die Grundbuchdaten in die Akte"**.

---

### Plan: Neue Aktion `ARM.MOD04.ENRICH_FROM_STORAGE`

**Zweck:** Armstrong liest ein Dokument aus dem Datenraum einer bestehenden Immobilie, extrahiert strukturierte Felder (via `sot-storage-extractor` oder `document_structured_data`), und schreibt sie in die Properties/Units-Tabellen.

#### 1. Armstrong Manifest — neue Aktion registrieren

**Datei:** `src/manifests/armstrongManifest.ts`

```
action_code: 'ARM.MOD04.ENRICH_FROM_STORAGE'
title_de: 'Daten aus Dokument in Akte übernehmen'
description_de: 'Liest ein Dokument aus dem Datenraum und überträgt extrahierte Daten in die Immobilienakte'
risk_level: 'medium'
execution_mode: 'execute_with_confirmation'
data_scopes_read: ['documents', 'document_structured_data', 'storage_nodes']
data_scopes_write: ['properties', 'units']
```

Wird auch in `TOP_30_MVP_ACTION_CODES` aufgenommen.

#### 2. Backend — Handler in `sot-armstrong-advisor`

**Datei:** `supabase/functions/sot-armstrong-advisor/index.ts`

Neuer `case "ARM.MOD04.ENRICH_FROM_STORAGE"`:

1. **Parameter:** `property_id` (Pflicht), optional `document_id` (wenn User ein bestimmtes Dokument meint)
2. **Schritt 1 — Dokument finden:**
   - Wenn `document_id` angegeben: direkt verwenden
   - Sonst: Alle `document_structured_data` Einträge mit `property_id` laden, nach `doc_category` filtern (z.B. `grundbuchauszug`)
   - Falls kein extrahiertes Dokument vorhanden: `sot-storage-extractor` on-demand triggern für die property storage_nodes
3. **Schritt 2 — Felder mappen:**
   - Grundbuch-Felder → `properties`-Tabelle (land_register_court, land_register_sheet, parcel_number, etc.)
   - Nur Felder überschreiben die NULL sind ODER wo das Dokument neuer ist
4. **Schritt 3 — Preview + Confirm:**
   - Armstrong zeigt dem User eine Vorschau: "Ich habe folgende Daten gefunden: Amtsgericht: X, Grundbuchblatt: Y, ..."
   - User bestätigt → UPDATE auf properties

#### 3. Properties-Tabelle — Prüfen ob Grundbuch-Spalten existieren

Prüfen ob `properties` bereits Spalten hat für:
- `land_register_court` (Amtsgericht)
- `land_register_sheet` (Grundbuchblatt)  
- `land_register_district` (Grundbuchbezirk)
- `parcel_number` (Flurstück)

Falls fehlend: DB-Migration erstellen.

#### 4. Frontend — Context-aware Trigger

Im Property-Dossier (oder im Datenraum) einen "Frag Armstrong"-Button ergänzen, der den Prompt vorbefüllt:

```
"Lies den Grundbuchauszug aus dem Datenraum von [Property Name] und übertrage die Daten in die Immobilienakte"
```

Nutzt den bestehenden `ArmstrongAskButton` mit vorbefülltem Prompt.

---

### Betroffene Dateien

| Datei | Aktion |
|---|---|
| `src/manifests/armstrongManifest.ts` | Neue Aktion `ARM.MOD04.ENRICH_FROM_STORAGE` |
| `supabase/functions/sot-armstrong-advisor/index.ts` | Handler-Case implementieren |
| DB-Migration (falls nötig) | Grundbuch-Spalten in `properties` |
| Property-Dossier UI (MOD-04, frozen) | ArmstrongAskButton — braucht UNFREEZE MOD-04 |

### Voraussetzung

- **MOD-04 muss unfrozen werden** für den ArmstrongAskButton im Dossier
- Alternativ: User nutzt den Armstrong-Chat direkt und sagt "Lies den Grundbuchauszug für Parkweg 17 aus und fülle die Akte"

Soll ich mit der Implementierung starten?

