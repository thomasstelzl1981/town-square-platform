

## Diagnose: Seed scheitert an RLS — Admin hat keine Membership im Demo-Tenant

### Ursache (Root Cause)

Der Seed wird aus Zone 1 Admin durch den Platform-Admin (`thomas.stelzl`) ausgeloest. Die Seed-Engine fuegt Daten mit `tenant_id = c3123104-...` (Demo Tenant) ein. Aber die RLS-Architektur verlangt, dass **beide** Policy-Typen passen:

```text
RESTRICTIVE (tenant_isolation_restrictive):
  tenant_id = get_user_tenant_id() OR is_platform_admin()
  → ✅ PASS (is_platform_admin = true)

PERMISSIVE (INSERT policy):
  tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid())
  → ❌ FAIL — Admin hat nur Membership in a0000000 (Golden Tenant)
     Er hat KEINE Membership in c3123104 (Demo Tenant)
```

PostgreSQL erfordert: mindestens 1 PERMISSIVE = true **UND** alle RESTRICTIVE = true. Die Restrictive passt, aber keine Permissive passt.

Betroffen: **Alle 28 Tabellen** (contacts, properties, bank_transactions, etc.) — deswegen sind alle Counts 0.

### Loesung

**Ein SQL-Befehl** — eine Membership fuer den Platform-Admin im Demo-Tenant anlegen:

```sql
INSERT INTO memberships (user_id, tenant_id, role)
VALUES (
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'c3123104-e2ec-47ca-9f0a-616808557ece',
  'platform_admin'
);
```

Danach muss der Seed erneut in Zone 1 Admin ausgeloest werden ("Alle aktivieren").

### Alternative (robuster, langfristig)

Die PERMISSIVE INSERT-Policies auf allen Seed-relevanten Tabellen um eine Platform-Admin-Ausnahme erweitern:

```sql
-- Beispiel fuer test_data_registry:
CREATE POLICY "Platform admin can insert any tenant"
  ON test_data_registry FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()));
```

Das waere sauberer, betrifft aber 28+ Tabellen. Die Membership-Loesung ist schneller und reicht fuer den Seed-Zweck.

### Empfehlung

**Schritt 1 (sofort):** Membership einfuegen (1 SQL-Befehl)
**Schritt 2:** Seed erneut ausfuehren in Zone 1 Admin
**Schritt 3:** DB-Counts verifizieren

