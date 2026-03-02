

# Billing in Zone 1 — ERLEDIGT

## Umsetzung abgeschlossen

### OrganizationDetail.tsx — Tab "Credits & Billing"
- **Route:** `/admin/organizations/:id` → Tab 4
- **Status:** ✅ IMPLEMENTIERT
- **Queries:** `tenant_credit_balance`, `credit_ledger` (50), `invoices`, `subscriptions` JOIN `plans`
- **Admin-Action:** "Credits manuell gutschreiben" via `rpc_credit_topup`
- **Komponente:** `src/components/armstrong/AdminBillingTab.tsx` (Zone 1)

### Was angezeigt wird
1. **Saldo-Karte:** balance_credits, reserved
2. **Lifetime-Karte:** lifetime_purchased, lifetime_consumed
3. **Abo/Plan-Karte:** Aktiver Plan, Laufzeit, Kündigungsstatus
4. **Transaktions-Tabelle:** Letzte 50 credit_ledger Einträge mit Service-Labels
5. **Rechnungs-Tabelle:** invoices mit Status-Badges, Beträge, Bezahldatum
6. **Admin TopUp Dialog:** Manuelles Gutschreiben mit Betrag + Begründung
