

# Billing System — Aktueller Status & Fortschritt

## Uebersicht: Was ist ERLEDIGT vs. OFFEN

| # | Schritt aus dem Plan | Status | Details |
|---|---|---|---|
| 1 | billingConstants.ts vervollstaendigen | **OFFEN** | Noch immer nur 12 Eintraege, Kategorie `ai` fehlt, 7 Services fehlen, `getServicePrice()` fehlt |
| 2 | Verbrauchshistorie in AbrechnungTab | **OFFEN** | AbrechnungTab zeigt nur Saldo (eine Zahl) + Rechnungsliste. Kein `credit_ledger`-Abruf, keine Einzelposten, kein Monatsvergleich |
| 3 | CreditBalanceWidget fuer Dashboard | **OFFEN** | Datei existiert nicht, nicht in systemWidgets registriert |
| 4 | Low-Balance-Warning | **OFFEN** | Kein Code vorhanden — weder Backend noch Frontend |
| 5 | Fehlende Credit-Deduktionen | **OFFEN** | `sot-mail-ai-assist`: kein Deduct. `sot-content-engine`: 402-Placeholder ohne echten Deduct. `sot-tenancy-lifecycle`: gar kein Credit-Code |

**Ergebnis: 0 von 5 Schritten umgesetzt.** Der genehmigte Plan wurde noch nicht implementiert.

---

## Was bereits VORHER existierte (unveraendert)

**Backend (funktionsfaehig):**
- DB-Tabellen: `tenant_credit_balance`, `credit_ledger`, `armstrong_billing_events`, `billing_usage`
- RPC-Funktionen: `rpc_credit_preflight`, `rpc_credit_deduct`, `rpc_credit_topup`
- Edge Functions: `sot-credit-preflight`, `sot-credit-checkout` (Stripe), `sot-credit-webhook`
- 8 Edge Functions mit funktionierender Credit-Deduktion (inbound, storage-extract, nk-beleg, invoice-parse, etc.)

**Frontend (funktionsfaehig):**
- `AbrechnungTab`: Plan-Anzeige, Saldo, Rechnungsliste, TopUp-Button
- `CreditTopUpDialog`: 3 Pakete via Stripe Checkout
- Zone 1 Admin: Billing-Uebersicht + Cost-Monitor

---

## Implementierungsplan (jetzt ausfuehren)

### Schritt 1: billingConstants.ts erweitern
- Neue Kategorie `ai` hinzufuegen
- 7 fehlende Services eintragen (mail_ai_assist, content_engine, tlc_summary, weg_parse, finance_prepare, ki_browser, discovery)
- Hilfsfunktion `getServicePrice(code: string)` hinzufuegen

### Schritt 2: Verbrauchshistorie in AbrechnungTab
- Neuer Query: `credit_ledger` laden (letzte 90 Tage, kind='debit')
- Kategorie-Zusammenfassung: Credits pro ref_type gruppiert (Balken oder Badges)
- Einzelposten-Tabelle: Datum, Service-Label (via billingConstants Mapping), Credits, ref_id
- Monatsvergleich: aktueller vs. vorheriger Monat

### Schritt 3: CreditBalanceWidget
- Neue Datei `src/components/dashboard/widgets/CreditBalanceWidget.tsx`
- Kompakt: Saldo-Zahl + 7-Tage-Trend + TopUp-Link + Low-Balance-Warnung
- In `systemWidgets.ts` registrieren

### Schritt 4: Low-Balance-Warning
- Im Frontend: nach jedem `credit_ledger`-Fetch pruefen ob balance < 10
- Toast-Warnung mit direktem TopUp-Link
- Spaeter optional: Backend-seitiges Flag in `sot-credit-preflight`

### Schritt 5: Credit-Deduktionen nachrüsten (3 Edge Functions)
- `sot-mail-ai-assist`: Preflight + Deduct (1 Credit) vor LLM-Call
- `sot-content-engine`: Echten Preflight + Deduct (2 Credits) statt 402-Placeholder
- `sot-tenancy-lifecycle`: Preflight + Deduct (1 Credit) vor AI-Summary

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/config/billingConstants.ts` | Kategorie `ai`, 7 neue Services, `getServicePrice()` |
| `src/pages/portal/stammdaten/AbrechnungTab.tsx` | Verbrauchshistorie-Sektion mit credit_ledger |
| `src/components/dashboard/widgets/CreditBalanceWidget.tsx` | NEU |
| `src/config/systemWidgets.ts` | Widget-Registrierung |
| `supabase/functions/sot-mail-ai-assist/index.ts` | Credit-Preflight + Deduct |
| `supabase/functions/sot-content-engine/index.ts` | Credit-Preflight + Deduct |
| `supabase/functions/sot-tenancy-lifecycle/index.ts` | Credit-Preflight + Deduct |

### Reihenfolge
Schritt 1 zuerst (SSOT-Config), dann Schritt 2+3 parallel (Frontend), dann Schritt 4 (Warning), dann Schritt 5 (Edge Functions).

