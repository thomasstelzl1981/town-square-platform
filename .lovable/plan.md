

# Credits aktivieren: 5.000 Credits pro Tenant + Verbrauchsueberwachung

## Befund

- **6 Tenants** existieren in `organizations`, aber `tenant_credit_balance` ist komplett leer (0 Zeilen)
- **12 Edge Functions** haben bereits `rpc_credit_deduct` implementiert — die Deduktion funktioniert technisch
- **Problem:** Ohne Balance-Eintrag schlagen alle Preflight-Checks fehl bzw. es gibt nichts zum Abziehen
- Die RPC-Funktion `rpc_credit_topup` erstellt automatisch einen Balance-Eintrag falls keiner existiert (UPSERT-Logik)

## Plan

### Schritt 1: 5.000 Credits fuer alle 6 Tenants gutschreiben

Fuer jeden der 6 Tenants `rpc_credit_topup` aufrufen mit 5.000 Credits. Das erstellt automatisch:
- Eintrag in `tenant_credit_balance` (Saldo: 5.100, da Default 100 + 5.000)
- Eintrag in `credit_ledger` (kind: 'credit', amount: 5.000, ref_type: 'initial_seed')

Tenants:
1. System of a Town (`a0000000-...0001`)
2. ZL Wohnbau GmbH (`029647c3-...`)
3. UNITYS GmbH (`406f5f7a-...`)
4. demo (`c3123104-...`)
5. bernhard.marchner (`80746f1a-...`)
6. Lennox & Friends (`eac1778a-...`)

**Methode:** 6x Edge Function Call via `sot-credit-preflight` POST mit `action: "topup"`, `credits: 5000`.

Da `rpc_credit_topup` `auth.uid()` benoetigt und wir Admin-Service-Key nicht direkt via Frontend haben, nutze ich stattdessen direkte SQL-Inserts:
- INSERT in `tenant_credit_balance` fuer jeden Tenant
- INSERT in `credit_ledger` fuer jeden Tenant

### Schritt 2: Verifizierung

Nach dem Seed: Beide UIs pruefen:
- Zone 2: `/portal/stammdaten/abrechnung` — Saldo sollte 5.000+ zeigen
- Zone 1: `/admin/organizations/:id` Tab 4 — Saldo + Ledger-Eintrag sichtbar

### Betroffene Dateien

Keine Code-Aenderungen noetig. Nur Daten-Seed in die Datenbank.

