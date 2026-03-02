

# SLC-Prozessketten-Audit: Vollständige Prüfung

## Prüfumfang

Der gesamte Sales Lifecycle von MOD-04/MOD-13 (Mandat) über Zone 1 (Sales Desk) → MOD-08/MOD-09 (Zone 2) → Zone 3 (Kaufy/Landingpage), einschließlich Reservierungs- und Provisionsflow.

---

## A. PROZESS-LÜCKEN (Kritisch)

### A1. 7 von 11 SLC-Phasen haben KEINEN UI-Trigger

Die `SLC_EVENT_PHASE_MAP` definiert 11 phasenrelevante Events. Davon sind nur 4 tatsächlich in Hooks/UI verdrahtet:

| Event | Phase-Transition | Verdrahtet? | Wo? |
|---|---|---|---|
| `mandate.activated` | → mandate_active | **NEIN** | Kein Trigger |
| `channel.published` | → published | JA | `useSalesDeskListings` |
| `deal.inquiry_received` | → inquiry | **NEIN** | Kein Trigger |
| `deal.reserved` | → reserved | JA | `useSalesReservations` |
| `deal.contract_drafted` | → contract_draft | **NEIN** | Kein Trigger |
| `deal.notary_scheduled` | → notary_scheduled | JA | `useSalesReservations.updateStatus` |
| `deal.notary_completed` | → notary_completed | JA | `useSalesReservations.updateStatus` |
| `deal.handover_completed` | → handover | **NEIN** | Kein Trigger |
| `deal.platform_share_settled` | → settlement | JA (approve) | `useSalesSettlement` |
| `case.closed_won` | → closed_won | **NEIN** | Kein Trigger |
| `case.closed_lost` | → closed_lost | **NEIN** | Kein Trigger |

**Konsequenz:** Ein Fall kann nie die Phasen `inquiry`, `contract_draft`, `handover` oder `closed_won/lost` erreichen — der SLC ist in der Mitte gebrochen.

### A2. `SalesApprovalSection` erzeugt keinen SLC-Case

Die `activateVertriebsauftrag()` Funktion (MOD-13 VertriebTab) erstellt Listings + Publications, ruft aber weder `findOrCreateCase()` noch `mandate.activated` auf. Das bedeutet:
- Kein `sales_case` wird angelegt
- Kein `mandate_active` Event wird geloggt
- Der SLC beginnt erst beim ersten `channel.published` Event über den Sales Desk (Zone 1), nicht beim Vertriebsauftrag selbst

### A3. Reservierungs-Status-Updates (MOD-13 VertriebTab) umgehen SLC

In `VertriebTab.tsx` Zeile 57-61 wird `updateReservation.mutateAsync()` statt `updateStatus.mutateAsync()` aufgerufen. `updateReservation` ist ein generischer Update ohne SLC-Event-Recording. Statusänderungen (confirmed → notary_scheduled → completed) aus dem VertriebTab erzeugen daher **keine SLC-Events**.

### A4. VorgaengeTab (MOD-06) ist komplett vom SLC abgekoppelt

`VorgaengeTab.tsx` liest zwar aus `sales_reservations`, aber:
- Nutzt eigene Status-Konfiguration (`pending_owner`, `pending_buyer`) die nicht im SLC existiert
- Keine Aktions-Buttons für Statusänderungen
- `sale_transactions` Tabelle existiert parallel zum SLC-Modell — **Dual-System**
- Kein SLC-Event-Recording

---

## B. DATENFLUSS-BRÜCHE

### B1. MOD-13 → Zone 1: Einseitige Verbindung

- **MOD-13 → Zone 1:** `SalesApprovalSection` erstellt `sales_desk_requests` + Listings, aber keine `sales_cases`
- **Zone 1 → MOD-13:** `SalesDeskDashboard` liest `sales_desk_requests` und kann deaktivieren
- **Lücke:** Zone 1 kann Listings verwalten, aber den SLC-Status nicht aktiv steuern (keine Phase-Advance-Buttons im Monitor)

### B2. Zone 1 → MOD-08/MOD-09: Passive Verbindung

- **MOD-08 (Investments):** `InvestmentExposePage` und `MandatTab` lesen Listings, aber erzeugen keine `deal.inquiry_received` Events
- **MOD-09 (Vertriebspartner):** `KatalogTab` zeigt `listing_publications` mit Channel `partner_network`, aber Beratungsaktionen erzeugen keine SLC-Events
- **Keine Rückmeldung:** Wenn ein Partner eine Anfrage stellt oder einen Kunden berät, wird dies nicht im SLC reflektiert

### B3. Zone 3 → SLC: Keine Verbindung

- `Kaufy2026Home` zeigt Listings, `Kaufy2026Expose` zeigt das Exposé
- `KaufyFinanceRequestSheet` erstellt Finanzierungsanfragen
- **Kein Inquiry-Event:** Kontaktformulare/Finanzierungsanfragen auf Zone 3 erzeugen kein `deal.inquiry_received`
- Die Projekt-Landingpage (`ProjectLandingExpose`) hat denselben Bruch

---

## C. UI/UX-PROBLEME

### C1. SLC Monitor (Zone 1) — Nur Lesend

- Zeigt Fälle, Drift, Reservierungen an
- **Keine Aktionsmöglichkeiten:** Kein Button zum Phasen-Advance, kein Close-Case, kein Assign-Contact
- Admin kann Stuck-Cases nur sehen, nicht bearbeiten

### C2. VertriebTab (MOD-13) — Status-Inkonsistenz

- Zeile 192-194: Status-Workflow (pending → confirmed → notary_scheduled → completed) via Dropdown-Menü
- Ruft aber `updateReservation` statt `updateStatus` auf → keine SLC-Events
- Partner-Performance-Tabelle hardcoded 3% Provision statt aus der Reservierung/Settlement

### C3. SettlementsTab (Zone 1) — Keine Erstellmöglichkeit

- `useCreateSettlement` existiert als Hook, wird aber **nirgends in der UI aufgerufen**
- `SettlementsTab` zeigt nur bestehende Settlements und den "Freigeben"-Button
- Es fehlt ein "Neue Abrechnung erstellen"-Dialog

### C4. Dual-System VorgaengeTab

- `sale_transactions` Tabelle existiert parallel zu `sales_reservations` + `sales_settlements`
- Unterschiedliche Status-Modelle (pending/notarized/bnl_received vs. SLC-Phasen)
- Verwirrend für den Nutzer: zwei verschiedene Orte für denselben Prozess

---

## D. TECHNISCHE SCHWÄCHEN

### D1. Doppelte SLC-Event-Logik

`recordSLCEvent()` ist dreifach implementiert:
1. `useSLCEventRecorder.ts` — zentraler Hook (sollte SSOT sein)
2. `useSalesReservations.ts` Zeile 129-163 — eigene Inline-Kopie
3. `useSalesSettlement.ts` Zeile 133-163 — eigene Inline-Kopie

Alle drei implementieren dasselbe Muster (phase lookup → event insert → phase advance). Sollte konsolidiert werden auf `useSLCEventRecorder`.

### D2. `findOrCreateCase` Schwäche

- `assetId` wird als `listingId` übergeben (Zeile 115 in `useSalesDeskListings`), obwohl `asset_id` die Unit-ID sein sollte
- `userId` wird als leerer String übergeben (`userId: ''`)
- Keine Property/Project-ID-Auflösung

### D3. Channel Drift ohne Hashberechnung

- `expected_hash` und `last_synced_hash` Spalten existieren in `listing_publications`
- Aber nirgends im Code wird ein Hash berechnet oder gesetzt
- `useChannelDrift` wird immer `driftedCount = 0` liefern, da alle Hashes `null` sind

---

## E. PLAN — Behebung in 5 Phasen

### Phase 1: SLC-Event-Konsolidierung
- Inline `recordSLCEvent` aus `useSalesReservations` und `useSalesSettlement` entfernen
- Stattdessen `useSLCEventRecorder.recordEvent()` importieren und nutzen
- `findOrCreateCase` korrigieren (korrekte `assetId`, `userId`)

### Phase 2: Fehlende Phase-Trigger nachrüsten
- `SalesApprovalSection.activateVertriebsauftrag()` → `findOrCreateCase()` + `mandate.activated` Event
- `VertriebTab` → `updateStatus` statt `updateReservation` aufrufen
- Zone 3 Kontaktformulare → `deal.inquiry_received` Event (via Edge Function oder direkten Insert)
- SLC Monitor → Aktions-Buttons für `deal.contract_drafted`, `deal.handover_completed`, `case.closed_won/lost`

### Phase 3: Settlement-Erstellung in UI
- "Neue Abrechnung"-Dialog im `SettlementsTab` oder im SLC Monitor
- Automatischer Vorschlag wenn Case Phase `notary_completed` erreicht
- Partner-Provision aus tatsächlicher `commission_rate` statt hardcoded 3%

### Phase 4: MOD-06 VorgaengeTab Konsolidierung
- `sale_transactions` Tabelle evaluieren: migrieren zu `sales_settlements` oder als View auf `sales_reservations` + `sales_settlements`
- Status-Modell vereinheitlichen

### Phase 5: Channel-Drift aktivieren
- Hash-Berechnung bei Listing-Erstellung/Update (z.B. MD5 über price+title+description)
- `expected_hash` bei jedem Listing-Update setzen
- `last_synced_hash` bei erfolgreicher Channel-Synchronisation setzen

---

## Zusammenfassung

| Bereich | Status | Hauptproblem |
|---|---|---|
| Engine (ENG-SLC) | ✅ Vollständig | Spec + Engine sind korrekt |
| DB-Schema | ✅ Vorhanden | Tabellen korrekt angelegt |
| MOD-13 → Zone 1 | ⚠️ Teilweise | Kein SLC-Case bei Aktivierung |
| Zone 1 Monitor | ⚠️ Read-Only | Keine Aktionsmöglichkeiten |
| MOD-08/09 ← SLC | ❌ Nicht verbunden | Keine Inquiry-Events |
| Zone 3 → SLC | ❌ Nicht verbunden | Keine Events von Websites |
| Reservierungsflow | ⚠️ Teilweise | VertriebTab umgeht SLC |
| Provisionsflow | ⚠️ Teilweise | Keine UI zum Erstellen |
| Event-Recording | ⚠️ Dreifach-Duplikat | Konsolidierung nötig |
| Channel Drift | ❌ Tot | Keine Hashes berechnet |

**Der SLC-Backbone funktioniert technisch, aber nur 4 von 11 Phasen-Transitionen sind tatsächlich in der UI verdrahtet. Der Prozess ist in der Mitte gebrochen.**

