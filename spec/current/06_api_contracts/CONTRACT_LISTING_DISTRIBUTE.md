# Contract: Listing Distribute

**Version:** 1.0  
**Status:** Dokumentiert  
**ZBC-Regel:** ZBC-R10  
**Backbone-Konform:** Ja (Z1 → Z2/Z3)

---

## Direction

Z1 → Z2/Z3 (Distribution an Downstream-Consumer)

**Voraussetzung:** Listing wurde via [CONTRACT_LISTING_PUBLISH](CONTRACT_LISTING_PUBLISH.md) an Zone 1 uebermittelt (Z2 → Z1).

## Trigger

Zone 1 Sales Desk gibt Listing frei (Auto-Approve oder manuelles Review).

## Payload-Schema

```json
{
  "listing_id": "UUID",
  "property_id": "UUID",
  "tenant_id": "UUID",
  "channels": ["partner_network", "kaufy"],
  "status": "active",
  "distribution_action": "activate | pause | withdraw"
}
```

## IDs / Correlation

| ID | Beschreibung |
|----|-------------|
| `listing_id` | Primaerschluessel in `listings` |
| `property_id` | Zugehoeriges Objekt |
| `tenant_id` | Mandanten-Zuordnung |

## SoT nach Uebergabe

Z1 bleibt Governance-Owner des Listing-Status.  
Consumer lesen Daten aus `listings` + `listing_publications` (read-only Projection).

## Consumer

| Consumer | Modul | Zugriff |
|----------|-------|---------|
| Partner-Katalog | MOD-09 | `listing_publications` WHERE channel = 'partner_network' AND status = 'active' |
| Investment-Suche | MOD-08 | `listings` WHERE status = 'active' (via v_public_listings) |
| Kaufy Website | Zone 3 | `listing_publications` WHERE channel = 'kaufy' AND status = 'active' |
| Sales Desk | Zone 1 | `listings` + `listing_publications` (Governance-Ansicht) |

## Fehlerfaelle / Retry

| Fehler | Behandlung |
|--------|-----------|
| Listing nicht gefunden | 404, idempotent |
| Publication-Channel ungueltig | 400, Validierung |
| Auth-Fehler | 401 |

Distribution ist idempotent — wiederholtes Ausfuehren erzeugt keine Duplikate.

## Camunda-Ready

| Feld | Wert |
|------|------|
| `task_kind` | `service_task` |
| `camunda_key` | `MOD04_STEP_06B_LISTING_DISTRIBUTE_Z1` |
| `correlation_keys` | `tenant_id`, `property_id`, `listing_id` |

## Code-Fundstelle

- `listings`, `listing_publications` Tabellen
- Golden Path MOD-04, Phase 6b (`listing_distribution_z1`)
- Consumer-Routes: `/portal/vertrieb/katalog` (MOD-09), `/portal/investments/suche` (MOD-08), `/website/kaufy/**` (Zone 3)
