# Contract: Project Intake

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Z1 → Z2 (via Armstrong oder direkter Aufruf)

## Trigger

Armstrong Action `ARM.MOD13.CREATE_DEV_PROJECT` oder direkter Edge-Function-Aufruf.

## Payload-Schema

```json
{
  "mode": "analyze | create",
  "tenant_id": "UUID",
  "expose_file": "base64 | storage_path (optional)",
  "pricelist_file": "base64 | storage_path (optional)",
  "project_data": {
    "name": "string",
    "address": "string",
    "units_count": "number"
  }
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `project_id` | Primaerschluessel in `dev_projects` (nach Erstellung) |
| `tenant_id` | Mandanten-Zuordnung |

## SoT nach Uebergabe

Z2 MOD-13 (`dev_projects`, `storage_nodes`).

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Datei zu gross (>10MB) | 400 Bad Request |
| AI-Extraction-Fehler | Partielle Ergebnisse zurueck, `extraction_status = partial` |
| Auth-Fehler | 401, nur Admin/Manager darf aufrufen |

## Code-Fundstelle

- `supabase/functions/sot-project-intake/` (Edge Function)
- `dev_projects`, `storage_nodes` Tabellen
