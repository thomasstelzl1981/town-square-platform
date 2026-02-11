# Data Provenance Rules (DPR) v1.0

## DPR-01: Pflichtfelder fuer abgeleitete Daten

Jeder Record, der aus einem Dokument extrahiert oder von einer externen Quelle abgeleitet wurde, MUSS folgende Felder haben:

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| `source_document_id` | UUID FK | JA | Referenz auf Quelldokument |
| `extracted_at` | timestamptz | JA | Zeitpunkt der Extraktion |
| `confidence` | float (0-1) | JA | Konfidenz-Score |
| `needs_review` | boolean | JA | Manueller Review erforderlich |
| `extractor_version` | text | NEIN | Version des Extraktors |

Bereits implementiert in: `extractions`, `document_chunks` (teilweise), `types/immobilienakte.ts` (CONFIDENCE_GATES).

## DPR-02: Keine autoritativen Daten ohne Source

Wenn `source_document_id` auf ein nicht existierendes Dokument zeigt (Blob oder Record geloescht), DARF der extrahierte Wert NICHT als autoritativ gelten. UI muss `needs_review = true` erzwingen.

## DPR-03: UI-Kennzeichnung

Extrahierte Werte muessen im UI visuell unterscheidbar sein:
- `confidence >= 0.90` → Auto-akzeptiert (gruener Indikator)
- `0.70 <= confidence < 0.90` → Needs Review (gelber Indikator)
- `confidence < 0.70` → Unassigned/Unsicher (roter Indikator)

Definiert in `CONFIDENCE_GATES` (`src/types/immobilienakte.ts`).

## Orphan-Check

Die Funktion `check_data_orphans(p_tenant_id)` prueft:
1. `extractions` ohne zugehoeriges `documents`-Record
2. `document_chunks` ohne zugehoeriges `documents`-Record
3. `document_links` ohne zugehoeriges `documents`-Record

Aufrufbar via `supabase.rpc('check_data_orphans', { p_tenant_id })`.
