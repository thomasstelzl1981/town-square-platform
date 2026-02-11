# Contract: Listing Publish

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10

---

## Direction

Z2 → Z3

## Trigger

User publiziert Inserat aus MOD-06 (Verkaufsauftrag-Aktivierung oder manuelle Kanalfreigabe).

## Payload-Schema

```json
{
  "property_id": "UUID",
  "listing_id": "UUID",
  "tenant_id": "UUID",
  "title": "string",
  "asking_price": "number",
  "channels": ["partner_network", "kaufy"]
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `listing_id` | Primaerschluessel in `listings` |
| `property_id` | Zugehoeriges Objekt |
| `tenant_id` | Mandanten-Zuordnung |

## SoT nach Uebergabe

Z3 (oeffentlich sichtbar auf Kaufy und/oder Partner-Netzwerk).

## Consumer

Z3 konsumiert via `/website/kaufy/**` (read-only, kein eigener Write).  
Die Daten werden direkt aus `listings` + `listing_publications` gelesen — keine Replikation.

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Pflichtfelder fehlen (Titel, Preis) | 400 Error, Validierung im Frontend |
| Doppeltes aktives Listing | 409 Conflict |
| Auth-Fehler | 401, Redirect zu /auth |

## Code-Fundstelle

- `supabase/functions/sot-listing-publish/` (Edge Function)
- `listings`, `listing_publications` Tabellen
- Golden Path MOD-04, Phase `publish`
