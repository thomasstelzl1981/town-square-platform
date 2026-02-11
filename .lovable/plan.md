

# Fix: Kaufy-Publikation aktivieren und alte Listings bereinigen

## Problem

Das aktive Listing `204283ff` (Blochmannstr. 31, Leipzig) hat keine Kaufy-Publikation. Zwei alte, zurueckgezogene Listings (`ed4d1e46`, `76f21038`) existieren noch als Datenmüll.

## Loesung (eine DB-Migration)

**Schritt 1 — Alte Listings und deren Publikationen loeschen:**
```sql
DELETE FROM listing_publications WHERE listing_id IN (
  'ed4d1e46-...', '76f21038-...'
);
DELETE FROM listings WHERE id IN (
  'ed4d1e46-...', '76f21038-...'
);
```

**Schritt 2 — Kaufy-Publikation fuer aktives Listing erstellen:**
```sql
INSERT INTO listing_publications (listing_id, tenant_id, channel, status, published_at)
VALUES (
  '204283ff-c3ad-4860-8819-39953e0f3597',
  'a0000000-0000-4000-a000-000000000001',
  'kaufy',
  'active',
  now()
) ON CONFLICT (listing_id, channel)
  DO UPDATE SET status = 'active', published_at = now(), removed_at = NULL;
```

## Ergebnis

- Nur noch **ein** Listing fuer DEMO-001 (das aktive `204283ff`)
- Dieses Listing hat dann **zwei** aktive Publikationen: `partner_network` + `kaufy`
- Die Kaufy-Website zeigt die Wohnung korrekt an

## Dateiaenderungen

| Datei | Aenderung |
|---|---|
| DB-Migration | DELETE alte Listings + INSERT Kaufy-Publikation |

Keine Code-Aenderungen noetig.

