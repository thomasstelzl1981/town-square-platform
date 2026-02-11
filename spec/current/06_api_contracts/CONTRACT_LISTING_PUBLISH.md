# Contract: Listing Publish (Submit)

**Version:** 2.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10  
**Backbone-Konform:** Ja (Z2 → Z1)

---

## Direction

Z2 → Z1 (Submit/Request an Zone 1 Governance)

**WICHTIG:** Dies ist der erste Teil des Backbone-Flows. Die Verteilung an Downstream-Consumer (Z2/Z3) erfolgt durch [CONTRACT_LISTING_DISTRIBUTE](CONTRACT_LISTING_DISTRIBUTE.md).

## Ablauf (Backbone-Flow)

```
Z2 (Owner-Tenant)                Zone 1 (Governance)              Z2/Z3 (Consumer)
      │                                │                                │
      │  1. Publish Request            │                                │
      │  ─────────────────────────►    │                                │
      │  (listing + consent)           │                                │
      │                                │  2. Sales Desk Entry           │
      │                                │  (Review / Auto-Approve)       │
      │                                │                                │
      │                                │  3. Distribution               │
      │                                │  ──────────────────────────►   │
      │                                │  (CONTRACT_LISTING_DISTRIBUTE) │
      │                                │                                │
```

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

Z1 (Governance-Owner). Zone 1 entscheidet ueber Freigabe und Distribution.  
Z2/Z3 sind Consumer der Distribution (siehe CONTRACT_LISTING_DISTRIBUTE).

## Consumer

Z1 Sales Desk konsumiert den Submit-Request und steuert die Weiterverteilung.  
Direkte Z2→Z3 Kommunikation findet NICHT statt.

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Pflichtfelder fehlen (Titel, Preis) | 400 Error, Validierung im Frontend |
| Doppeltes aktives Listing | 409 Conflict |
| Auth-Fehler | 401, Redirect zu /auth |

## Camunda-Ready

| Feld | Wert |
|------|------|
| `task_kind` | `service_task` |
| `camunda_key` | `MOD04_STEP_06B_LISTING_DISTRIBUTE_Z1` |
| `correlation_keys` | `tenant_id`, `property_id`, `listing_id` |

## Code-Fundstelle

- `supabase/functions/sot-listing-publish/` (Edge Function)
- `listings`, `listing_publications` Tabellen
- Golden Path MOD-04, Phase 6 (`sales_desk_visibility`) + Phase 6b (`listing_distribution_z1`)
