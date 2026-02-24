# Contract: Project Intake

**Version:** 2.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Z1 → Z2 (via Armstrong oder direkter Aufruf)

## Trigger

Armstrong Action `ARM.MOD13.CREATE_DEV_PROJECT` oder direkter Edge-Function-Aufruf.

## Modes

| Mode | Beschreibung |
|------|-------------|
| `analyze` | Sequenzielle KI-Analyse: Exposé (gemini-2.5-pro) → Kontext → Preisliste (gemini-2.5-flash) |
| `create` | Projekt erstellen, Einheiten bulk-insert, DMS-Baum seeden, Dateien als storage_nodes registrieren |

## Payload-Schema

### Mode: analyze

```json
{
  "mode": "analyze",
  "storagePaths": {
    "expose": "string (storage path, optional)",
    "pricelist": "string (storage path, optional)"
  }
}
```

### Mode: create

```json
{
  "mode": "create",
  "storagePaths": {
    "expose": "string (optional)",
    "pricelist": "string (optional)"
  },
  "reviewedData": {
    "projectName": "string",
    "address": "string",
    "city": "string",
    "postalCode": "string",
    "unitsCount": "number",
    "totalArea": "number",
    "priceRange": "string",
    "description": "string (optional)",
    "projectType": "neubau | aufteilung",
    "constructionYear": "number (optional)",
    "modernizationStatus": "string (optional)",
    "wegCount": "number (optional)",
    "wegDetails": [{ "name": "string", "unitsCount": "number", "addressRange": "string" }],
    "developer": "string (optional)",
    "extractedUnits": [{
      "unitNumber": "string",
      "type": "string",
      "area": "number",
      "rooms": "number",
      "floor": "string",
      "price": "number",
      "currentRent": "number",
      "hausgeld": "number",
      "instandhaltung": "number",
      "nettoRendite": "number",
      "weg": "string",
      "mietfaktor": "number"
    }],
    "columnMapping": [{ "original_column": "string", "mapped_to": "string" }]
  },
  "autoCreateContext": "boolean (optional, default false)"
}
```

## Response-Schema

### Mode: analyze

```json
{
  "extractedData": {
    "projectName": "string",
    "city": "string",
    "projectType": "neubau | aufteilung",
    "wegCount": "number",
    "wegDetails": [],
    "extractedUnits": [],
    "columnMapping": []
  }
}
```

### Mode: create

```json
{
  "projectId": "UUID",
  "projectCode": "string",
  "unitsCreated": "number",
  "foldersCreated": "number"
}
```

## KI-Modelle

| Stufe | Modell | max_tokens |
|-------|--------|-----------|
| Exposé-Extraktion | `google/gemini-2.5-pro` | 4000 |
| Preislisten-Extraktion | `google/gemini-2.5-flash` | 4000 |

## Tool-Calling

| Tool | Stufe | Felder |
|------|-------|--------|
| `extract_project_data` | Exposé | projectName, city, postalCode, address, unitsCount, totalArea, priceRange, description, projectType, constructionYear, modernizationStatus, wegCount, wegDetails, developer, extractedUnits |
| `extract_units` | Preisliste | units[unitNumber, type, area, rooms, floor, price, currentRent, hausgeld, instandhaltung, nettoRendite, weg, mietfaktor], column_mapping |

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `project_id` | Primärschlüssel in `dev_projects` (nach Erstellung) |
| `tenant_id` | Mandanten-Zuordnung (aus Profil) |
| `developer_context_id` | Verkäufer-Gesellschaft (auto-create wenn `autoCreateContext=true`) |

## SoT nach Übergabe

Z2 MOD-13 (`dev_projects`, `dev_project_units`, `storage_nodes`).

## DMS-Baum (bei Create)

```
MOD_13/{project_code}/
├── 01_expose/           ← Exposé-PDF wird hier als storage_node registriert
├── 02_preisliste/       ← Preislisten-Datei wird hier registriert
├── 03_bilder_marketing/
├── 04_kalkulation_exports/
├── 05_reservierungen/
├── 06_vertraege/
├── 99_sonstiges/
└── Einheiten/
    └── {unit_number}/
        ├── 01_grundriss/
        ├── 02_bilder/
        ├── 03_verkaufsunterlagen/
        ├── 04_vertraege_reservierung/
        └── 99_sonstiges/
```

## Fehlerfälle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Datei zu groß (>20MB) | Übersprungen, Warnung im Log |
| AI-Extraction-Fehler | Partielle Ergebnisse zurück, Fallback auf Content-Parsing |
| Auth-Fehler | 401, nur authentifizierte User mit Tenant |
| Kein Tenant | 400, "No tenant selected" |
| Tool-Calling fehlgeschlagen | Fallback auf JSON-Content-Extraktion |

## Code-Fundstelle

- `supabase/functions/sot-project-intake/index.ts` (Edge Function)
- `src/pages/portal/projekte/ProjekteDashboard.tsx` (Review UI)
- `src/components/projekte/CreatePropertyFromUnits.tsx` (Immobilienakten)
- `dev_projects`, `dev_project_units`, `storage_nodes` Tabellen
