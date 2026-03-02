

# IS24 Integration — Architekturplan

## Kernprinzip: Reseller-Modell via Zone 1 Backbone

Der interne Verkaufs-/Vermietungsprozess (Z2) ist **strikt getrennt** von der IS24-Publikation. Der User "bucht" die Anzeige, Zone 1 fuehrt sie aus und rechnet per Credits ab.

```text
Z2 (User)                    Zone 1 (Backbone)              IS24 Sandbox
    │                              │                              │
    │  "IS24 buchen" (2 Cr)       │                              │
    │  ────────────────────►      │                              │
    │  (listing_id + channel)     │                              │
    │                              │  OAuth 1.0a signed POST     │
    │                              │  ─────────────────────────► │
    │                              │  ApartmentBuy/Rent etc.     │
    │                              │                              │
    │                              │  ◄── 201 Created (is24_id)  │
    │                              │                              │
    │  ◄── status: published       │                              │
    │  (listing_publications)     │                              │
```

## Phase 1: Edge Function `sot-is24-gateway`

Neue Edge Function mit:
- **OAuth 1.0a HMAC-SHA1** Signing (2-legged fuer Sandbox)
- Secrets: `IS24_CONSUMER_KEY`, `IS24_CONSUMER_SECRET` (Sandbox-Werte aus deiner Nachricht)
- Sandbox-URL: `https://rest.sandbox-immobilienscout24.de/restapi/api`
- Actions: `create_listing`, `update_listing`, `deactivate_listing`, `get_listing`
- **Credit-Preflight**: 2 Credits pro Publish-Aktion
- Objekttyp-Mapping: `listings` → ApartmentBuy/HouseBuy, `rental_listings` → ApartmentRent/HouseRent
- Ergebnis: `is24_id` wird in `listing_publications` / `rental_publications` gespeichert

## Phase 2: Verkauf (MOD-06 / VerkaufsauftragTab)

In `VerkaufsauftragTab.tsx`:
- `immoscout24.comingSoon: true` → **entfernen**
- Neuer Flow beim Aktivieren: Credit-Check → `sot-is24-gateway` invoke → `listing_publications` mit channel `scout24` + `is24_id`
- `ExposeDetail.tsx`: "Demnachst"-Badge ersetzen durch Live-Status aus `listing_publications`

## Phase 3: Vermietung (MOD-04 / TenancyTab)

Neue TLC-Sektion **"Vermietungsinserat"** in Kategorie 2 (Vertrag/Vermietung):
- UI-Kachel zeigt: Kaltmiete, Warmmiete, Verfuegbar ab, Haustiere, Beschreibung (aus `rental_listings`)
- Button "Inserat erstellen" → schreibt in `rental_listings`
- Button "Auf IS24 buchen (2 Credits)" → ruft `sot-is24-gateway` mit `action: create_listing`, Typ `ApartmentRent`
- Status-Anzeige aus `rental_publications` (draft/active/deactivated)
- Neue TLC-Komponente: `src/components/portfolio/tlc/TLCRentalListingSection.tsx`

## Phase 4: Secrets anlegen

Die Sandbox-Credentials aus deiner Nachricht als Secrets speichern:
- `IS24_CONSUMER_KEY` = `SystemofatownKey`
- `IS24_CONSUMER_SECRET` = `kwYQNcbcK8Vszbyk` (Sandbox Secret)
- `IS24_SANDBOX_USER` = `is24_tuv_156013787_38653@is24test.com`
- `IS24_SANDBOX_PASSWORD` = `00ada297-3aa4-4de4-aa99-f4a7324ef4abPp`

## Umsetzungsreihenfolge

| Schritt | Was | Dateien |
|---------|-----|---------|
| 1 | Secrets anlegen | 4 Secrets via Tool |
| 2 | `sot-is24-gateway` Edge Function | `supabase/functions/sot-is24-gateway/index.ts` |
| 3 | VerkaufsauftragTab: comingSoon entfernen, IS24-Flow | `src/components/portfolio/VerkaufsauftragTab.tsx` |
| 4 | ExposeDetail: Live-Status statt Placeholder | `src/pages/portal/verkauf/ExposeDetail.tsx` |
| 5 | TLCRentalListingSection: Neue TLC-Kachel | `src/components/portfolio/tlc/TLCRentalListingSection.tsx` |
| 6 | TenancyTab: Sektion einbinden | `src/components/portfolio/TenancyTab.tsx` |
| 7 | Sandbox E2E-Test | Edge Function testen via curl |

