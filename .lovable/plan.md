

# Billing in Zone 1 — Wo wird was geführt?

## Ist-Zustand: 3 separate Stellen, keine davon vollstaendig

### 1. OrganizationDetail.tsx — Tab "Credits & Billing" (Zeile 533-561)
- **Route:** `/admin/organizations/:id` → Tab 4
- **Status:** PLATZHALTER. Zeigt nur "Noch nicht verfuegbar" mit Dash-Symbolen
- **Liest:** NICHTS aus der Datenbank. Kein Query auf `tenant_credit_balance` oder `credit_ledger`
- **Fazit:** Der richtige Ort fuer Tenant-spezifisches Billing, aber komplett leer

### 2. ArmstrongBilling.tsx
- **Route:** `/admin/armstrong/billing`
- **Status:** Funktioniert, zeigt `armstrong_billing_events` (letzte 100 Events)
- **Scope:** Plattform-weit, NICHT pro Tenant. Zeigt alle KI-Aktionen aller Tenants
- **Fehlt:** Kein Filter nach Tenant, keine Rechnungen, keine Receipts

### 3. PlatformCostMonitor.tsx
- **Route:** `/admin/armstrong/costs`
- **Status:** Funktioniert. Zeigt echte API-Kosten vs. Credit-Einnahmen, Margen-Kalkulator
- **Scope:** Plattform-weit, rein operativ (Kostenanalyse fuer uns als Betreiber)

## Was existiert in der Datenbank, wird aber NICHT angezeigt

| Tabelle | Existiert | In Zone 1 sichtbar? |
|---------|-----------|---------------------|
| `tenant_credit_balance` | Ja | NEIN — OrganizationDetail zeigt nur Platzhalter |
| `credit_ledger` | Ja | NEIN — nirgends in Zone 1 abgefragt |
| `invoices` | Ja | NEIN — nirgends in Zone 1 abgefragt |
| `subscriptions` | Ja | NEIN — nirgends in Zone 1 abgefragt |
| `plans` | Ja | NEIN — nirgends in Zone 1 abgefragt |
| `armstrong_billing_events` | Ja | JA — in ArmstrongBilling.tsx |

## Was fehlt komplett

1. **Kein Tenant-Billing-Tab:** OrganizationDetail hat den Tab, aber 0 Daten. Kein Saldo, keine Transaktionen, keine Rechnungen
2. **Keine Rechnungsuebersicht:** Die `invoices`-Tabelle existiert, wird aber nirgends in Zone 1 angezeigt
3. **Keine Subscription-Verwaltung:** `subscriptions` + `plans` existieren, aber keine UI
4. **Kein Receipt/Beleg-Download:** Kein PDF-Export fuer Rechnungen
5. **Kein manuelles Credit-TopUp durch Admin:** Admin kann einem Tenant keine Credits gutschreiben

## Implementierungsplan

### Schritt 1: OrganizationDetail Billing-Tab aktivieren
Den Platzhalter (Zeile 533-561) ersetzen durch echte Daten:
- `tenant_credit_balance` Query: Saldo, Reserved, Lifetime Purchased/Consumed
- `credit_ledger` Query: Letzte 50 Transaktionen (credit + debit)
- `invoices` Query: Alle Rechnungen dieses Tenants
- Admin-Action: "Credits gutschreiben" Button (ruft `rpc_credit_topup` auf)

### Schritt 2: Rechnungs-Sektion im gleichen Tab
- Rechnungsliste aus `invoices` WHERE tenant_id = :id
- Status-Badges (draft, sent, paid, overdue)
- Betrag, Datum, Stripe-Link (falls vorhanden)

### Schritt 3: Subscription-Info
- Aktiver Plan aus `subscriptions` JOIN `plans`
- Plan-Name, Laufzeit, naechste Verlaengerung

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/admin/OrganizationDetail.tsx` | Billing-Tab: Platzhalter → echte Queries + UI (Saldo, Ledger, Invoices, Subscriptions, Admin-TopUp) |

Keine neuen Dateien, keine neuen Routen, keine neuen Menues. Alles im bestehenden Tab 4 der OrganizationDetail-Seite.

