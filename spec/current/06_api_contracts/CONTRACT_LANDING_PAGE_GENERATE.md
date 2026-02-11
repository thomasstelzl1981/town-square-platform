# Contract: Landing Page Generate

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Z2 → Z3

## Trigger

User erstellt/aktualisiert Landing Page in MOD-13.

## Payload-Schema

```json
{
  "project_id": "UUID",
  "tenant_id": "UUID",
  "page_data": "object"
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `page_id` | Landing-Page-ID |
| `project_id` | Projekt-Referenz |
| `tenant_id` | Organisation |

## SoT nach Uebergabe

Z3 (`landing_pages` Tabelle, oeffentlich sichtbar).

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| AI-Generierung fehlgeschlagen | 500, partielle Ergebnisse |
| Expiry-Check | Via `check-landing-page-expiry` |

## Consumer

Z3 konsumiert via `/website/projekt/:slug` (read-only).

## Code-Fundstelle

- `supabase/functions/sot-generate-landing-page/index.ts`
- `landing_pages` Tabelle
