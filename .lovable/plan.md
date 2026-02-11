
# Fix: Verkaufsauftrag im Sales Desk und in Stammdaten/Vertraege sichtbar machen

## Problem

Bei Aktivierung des Verkaufsauftrags in MOD-04 passieren zwei Dinge NICHT:

1. **Stammdaten/Vertraege** (`/portal/stammdaten/vertraege`): Die Query filtert nach `sales_mandate_consent_id IS NOT NULL` auf der `listings`-Tabelle. Aber der Aktivierungscode in `VerkaufsauftragTab.tsx` schreibt die Consent-ID des `SALES_MANDATE_V2` nie zurueck auf das Listing. Deshalb erscheint der Verkaufsauftrag nie in der Vertraegsliste.

2. **Sales Desk** (`/admin/sales-desk`): Die `VeroeffentlichungenTab` zeigt zwar alle aktiven Listings mit Channel-Toggles, aber es gibt keine dedizierte Ansicht fuer die **Vertriebsauftraege als Vertraege** (wer hat wann aktiviert, Provision, Status).

## Loesung

### Fix 1: `sales_mandate_consent_id` beim Aktivieren setzen (P0)

**Datei:** `src/components/portfolio/VerkaufsauftragTab.tsx`

In der Consent-Schleife (Zeile 277-297) wird der `SALES_MANDATE_V2`-Consent eingefuegt. Danach muss die ID des eingefuegten Consents auf das Listing geschrieben werden:

```text
// Aenderung in der Consent-Schleife:
// Bei SALES_MANDATE_V2: Insert mit .select('id').single()
// Danach: listings.update({ sales_mandate_consent_id: consent.id })
```

Konkret:
- Den Insert fuer `SALES_MANDATE_V2` mit `.select('id').single()` ausfuehren
- Die zurueckgegebene Consent-ID auf `listings.sales_mandate_consent_id` schreiben
- Damit findet `VertraegeTab` den Vertrag ueber seinen bestehenden Filter

### Fix 2: Sales Desk — Vertriebsauftraege-Karte im Dashboard (P1)

**Datei:** `src/pages/admin/desks/SalesDesk.tsx`

Im `SalesDeskDashboard` eine neue Karte "Aktive Vertriebsauftraege (Immobilien)" ergaenzen, die alle Listings mit `sales_mandate_consent_id IS NOT NULL` und `status = 'active'` zeigt:

| Spalte | Quelle |
|--------|--------|
| Objekt | listing.property.address, city |
| Eigentuemer | listing.tenant.name |
| Provision | listing.commission_rate |
| Aktiviert am | listing.created_at |
| Status | listing.status (active/reserved/withdrawn) |

Das ist eine reine Anzeige-Tabelle (Read-Only) — der Kill-Switch bleibt wie bisher beim Projekt-Bereich und den Toggles in der Veroefflichungen-Tabelle.

### Fix 3: Stammdaten/Vertraege — Link zum Objekt (P2, klein)

**Datei:** `src/pages/portal/stammdaten/VertraegeTab.tsx`

Der Link bei Verkaufsmandaten zeigt aktuell auf `/portal/verkauf/objekte`. Besser waere ein direkter Link zum konkreten Objekt: `/portal/immobilien/{property_id}?tab=verkaufsauftrag`. Dafuer muss die Query `property_id` mit-selektieren (ist schon via `properties` Join verfuegbar).

## Zusammenfassung der Aenderungen

| Datei | Aenderung | Prioritaet |
|-------|-----------|------------|
| `VerkaufsauftragTab.tsx` | Consent-ID des SALES_MANDATE_V2 auf Listing schreiben | P0 |
| `SalesDesk.tsx` | Neue Karte "Aktive Vertriebsauftraege" mit Listing-Tabelle | P1 |
| `VertraegeTab.tsx` | Link zum konkreten Objekt statt generischer Verkaufsseite | P2 |

## Warum das bisher nicht funktioniert hat

Der Code in `VerkaufsauftragTab.tsx` erstellt die Consents korrekt in `user_consents`, aber die Rueckreferenz (`sales_mandate_consent_id`) auf dem Listing wird nie gesetzt. Die `VertraegeTab` filtert genau nach dieser Referenz — deshalb ist die Liste leer. Im Sales Desk fehlt schlicht die Darstellung der Einzelimmobilien-Vertriebsauftraege als Vertrags-Uebersicht.
