

# End-to-End Smoke Test — Ergebnis

## Datenbankstatus (verifiziert)

| Metrik | Wert | Status |
|--------|------|--------|
| Properties erstellt | **72 / 72** | OK |
| Listings erstellt | **72 / 72** | OK |
| Partner-Network Publikationen | **72** | OK |
| Kaufy Publikationen | **5** | OK |
| Kaufy Showcase Flags | **5** | OK |
| `kaufy_listed` auf Projekt | **true** | OK |
| Property Accounting (AfA) | 4% linear, 20% Grundstück | OK |
| Jährliche Mieteinnahmen | Korrekt berechnet (current_rent × 12) | OK |
| Commission Rate | 7% netto auf allen Listings | OK |

## Getestete Flows (Browser)

1. **Vertriebsauftrag widerrufen** — Funktioniert, Status auf "withdrawn" gesetzt
2. **Vertriebsauftrag neu aktivieren** — Alle 3 Consents bestätigt, 72 Properties + Listings + Publications korrekt erstellt (~90 Sekunden für 72 Units)
3. **Kaufy Toggle → Showcase Dialog** — Dialog öffnet sich korrekt mit Auto-Vorschlag (5 Units), "5 Einheiten veröffentlichen" erfolgreich

## Identifizierte Probleme

### Problem 1: Kaufy Toggle zeigt "OFF" nach erfolgreicher Veröffentlichung
**Ursache:** Die Query `dev-project-kaufy` wird invalidiert, aber die UI re-rendert bevor der neue Wert abgerufen wird. Der Kaufy-Toggle zeigt keinen "Aktiv" Badge obwohl `kaufy_listed = true` in der DB ist.
**Fix:** Nach `handleKaufyShowcaseConfirm` muss auch `queryClient.invalidateQueries({ queryKey: ['sales-desk-request', projectId] })` aufgerufen werden, damit der `isApproved`-Check konsistent bleibt und der Toggle korrekt rendert.

### Problem 2: `year_built` ist NULL auf allen Properties
**Ursache:** `projectYearBuilt` wird als Prop an `SalesApprovalSection` übergeben, aber die `VertriebTab` übergibt diesen Wert möglicherweise nicht korrekt aus dem Projekt-Record (`construction_year`).
**Relevanz:** Mittel — betrifft Exposé-Darstellung in MOD-08/Zone 3.

### Problem 3: `rent_net` ist NULL, `annual_income` kommt aus `current_rent`
**Status:** Korrekt implementiert — `createPropertyFromUnit` nutzt `rent_net || current_rent` als Fallback. Die Einheiten haben nur `current_rent` gesetzt, was korrekt verarbeitet wird.

### Problem 4: Performance — 72 Units sequenziell (~90 Sek.)
**Empfehlung:** Für zukünftige Optimierung könnten die Property-Inserts parallelisiert oder als Batch-Operation via Edge Function ausgeführt werden. Kein Blocker aktuell.

## Sichtbarkeit in Downstream-Modulen

| Modul | Kanal | Erwartung | Status |
|-------|-------|-----------|--------|
| MOD-08 (Investmentsuche) | `partner_network` | 72 Listings sichtbar für alle Tenants mit MOD-08 | OK (RLS-Policies korrekt: `public_read_partner_network_listings` + `public_read_partner_network_properties`) |
| MOD-09 (Vertriebspartner) | `partner_network` | 72 Listings sichtbar | OK (gleiche RLS-Policies) |
| Zone 3 (Kaufy) | `kaufy` | 5 Showcase-Listings sichtbar | OK (RLS: `public_read_kaufy_listings` + `public_read_kaufy_properties`) |
| Investment Engine | AfA-Werte | `afa_rate_percent: 4%`, `land_share_percent: 20%` aus `property_accounting` | OK |

## Empfohlene Fixes (2 Änderungen)

### Fix 1: Kaufy Toggle UI-Sync
In `SalesApprovalSection.tsx` nach `handleKaufyShowcaseConfirm`: Sicherstellen dass alle relevanten Queries invalidiert werden und der Toggle nach Bestätigung als "Aktiv" angezeigt wird.

### Fix 2: `year_built` durchreichen
In `VertriebTab.tsx` sicherstellen, dass `construction_year` vom Projekt-Record als `projectYearBuilt` an die `SalesApprovalSection` übergeben wird.

Beide Fixes sind rein kosmetisch / Datenqualität — der Kernflow (Vertrieb → Properties → Listings → Kaufy Showcase) funktioniert end-to-end korrekt.

