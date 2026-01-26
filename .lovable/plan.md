

# Fix: RLS Infinite Recursion

## Problem

Die RLS-Policies verursachen eine zirkuläre Abhängigkeit:
- `organizations` SELECT Policy fragt `memberships` ab
- `memberships` SELECT Policy (`membership_select_org_admin`) fragt ebenfalls `memberships` ab
- Die `is_platform_admin()` Funktion fragt auch `memberships` ab

**Ergebnis:** `infinite recursion detected in policy for relation "memberships"`

---

## Ursache

PostgreSQL evaluiert bei PERMISSIVE Policies **alle** Policies mit OR. Wenn ein User die `organizations` Tabelle abfragt:

```text
organizations.org_select_member
    └─> SELECT FROM memberships (triggert RLS)
            ├─> membership_select_self     ✓ (user_id = auth.uid())
            ├─> membership_select_org_admin ✗ (SELECT FROM memberships → REKURSION)
            └─> membership_select_platform_admin ✗ (is_platform_admin() → SELECT FROM memberships → REKURSION)
```

---

## Lösung

Die rekursiven Policies müssen die `memberships`-Tabelle **ohne RLS** abfragen. Dazu erstellen wir eine `SECURITY DEFINER` Hilfsfunktion, die RLS umgeht.

### Migration

```sql
-- 1. Sichere Hilfsfunktion zum Abrufen der User-Memberships (umgeht RLS)
CREATE OR REPLACE FUNCTION public.get_user_memberships(p_user_id uuid)
RETURNS TABLE(tenant_id uuid, role membership_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.tenant_id, m.role
  FROM public.memberships m
  WHERE m.user_id = p_user_id
$$;

-- 2. is_platform_admin() aktualisieren (nutzt neue Funktion)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_user_memberships(auth.uid())
    WHERE role = 'platform_admin'
  )
$$;

-- 3. Rekursive memberships Policies ersetzen
DROP POLICY IF EXISTS membership_select_org_admin ON memberships;
DROP POLICY IF EXISTS membership_select_platform_admin ON memberships;

CREATE POLICY membership_select_org_admin ON memberships
  FOR SELECT
  USING (
    -- User kann alle Memberships seiner eigenen Orgs sehen (als org_admin)
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid()) um
      WHERE um.tenant_id = memberships.tenant_id
        AND um.role = 'org_admin'
    )
    -- ODER Child-Orgs (über Hierarchie)
    OR EXISTS (
      SELECT 1 
      FROM public.get_user_memberships(auth.uid()) um
      JOIN organizations my_org ON um.tenant_id = my_org.id
      JOIN organizations target_org ON target_org.id = memberships.tenant_id
      WHERE um.role = 'org_admin'
        AND target_org.materialized_path LIKE my_org.materialized_path || '%'
        AND target_org.id <> my_org.id
        AND NOT target_org.parent_access_blocked
    )
  );

CREATE POLICY membership_select_platform_admin ON memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );

-- 4. Organizations Policy aktualisieren (nutzt neue Funktion)
DROP POLICY IF EXISTS org_select_member ON organizations;
DROP POLICY IF EXISTS org_select_platform_admin ON organizations;

CREATE POLICY org_select_member ON organizations
  FOR SELECT
  USING (
    -- Direkte Membership
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid()) um
      WHERE um.tenant_id = organizations.id
    )
    -- ODER via Delegation
    OR (
      NOT parent_access_blocked
      AND EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN org_delegations d ON d.delegate_org_id = um.tenant_id
        WHERE d.target_org_id = organizations.id
          AND d.status = 'active'
          AND (d.expires_at IS NULL OR d.expires_at > now())
      )
    )
    -- ODER Child-Org (org_admin sieht Children)
    OR (
      NOT parent_access_blocked
      AND EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN organizations parent_org ON um.tenant_id = parent_org.id
        WHERE um.role = 'org_admin'
          AND organizations.materialized_path LIKE parent_org.materialized_path || '%'
          AND organizations.id <> parent_org.id
      )
    )
  );

CREATE POLICY org_select_platform_admin ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );

-- 5. Auch INSERT/UPDATE/DELETE Policies auf memberships aktualisieren
DROP POLICY IF EXISTS membership_insert_org_admin ON memberships;
DROP POLICY IF EXISTS membership_insert_platform_admin ON memberships;
DROP POLICY IF EXISTS membership_update_org_admin ON memberships;
DROP POLICY IF EXISTS membership_update_platform_admin ON memberships;
DROP POLICY IF EXISTS membership_delete_org_admin ON memberships;
DROP POLICY IF EXISTS membership_delete_platform_admin ON memberships;

-- INSERT für org_admin
CREATE POLICY membership_insert_org_admin ON memberships
  FOR INSERT
  WITH CHECK (
    role <> 'platform_admin'
    AND (
      EXISTS (
        SELECT 1 FROM public.get_user_memberships(auth.uid()) um
        WHERE um.tenant_id = memberships.tenant_id
          AND um.role = 'org_admin'
      )
      OR EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN organizations my_org ON um.tenant_id = my_org.id
        JOIN organizations target_org ON target_org.id = memberships.tenant_id
        WHERE um.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id <> my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

CREATE POLICY membership_insert_platform_admin ON memberships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );

-- UPDATE für org_admin
CREATE POLICY membership_update_org_admin ON memberships
  FOR UPDATE
  USING (
    role <> 'platform_admin'
    AND (
      EXISTS (
        SELECT 1 FROM public.get_user_memberships(auth.uid()) um
        WHERE um.tenant_id = memberships.tenant_id
          AND um.role = 'org_admin'
      )
      OR EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN organizations my_org ON um.tenant_id = my_org.id
        JOIN organizations target_org ON target_org.id = memberships.tenant_id
        WHERE um.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id <> my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

CREATE POLICY membership_update_platform_admin ON memberships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );

-- DELETE für org_admin
CREATE POLICY membership_delete_org_admin ON memberships
  FOR DELETE
  USING (
    role <> 'platform_admin'
    AND (
      EXISTS (
        SELECT 1 FROM public.get_user_memberships(auth.uid()) um
        WHERE um.tenant_id = memberships.tenant_id
          AND um.role = 'org_admin'
      )
      OR EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN organizations my_org ON um.tenant_id = my_org.id
        JOIN organizations target_org ON target_org.id = memberships.tenant_id
        WHERE um.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id <> my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

CREATE POLICY membership_delete_platform_admin ON memberships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );
```

---

## Technische Details

| Komponente | Vorher | Nachher |
|------------|--------|---------|
| `is_platform_admin()` | Direkter Query auf `memberships` | Nutzt `get_user_memberships()` |
| `get_user_memberships()` | - | Neue SECURITY DEFINER Funktion |
| `membership_select_*` | Rekursiver Self-Query | Query via Hilfsfunktion |
| `org_select_*` | Triggert rekursive Membership-Policies | Nutzt Hilfsfunktion |

**Warum SECURITY DEFINER?**
- Die Funktion läuft mit den Rechten des Erstellers (Superuser)
- Umgeht RLS auf der `memberships` Tabelle
- Verhindert die Rekursion

**Sicherheit bleibt gewahrt:**
- Die Funktion gibt nur Daten für den übergebenen `p_user_id` zurück
- Wird immer mit `auth.uid()` aufgerufen
- Der User kann nur seine eigenen Memberships sehen

---

## Nach dem Fix

1. Login unter `/auth` funktioniert
2. Weiterleitung zu `/portal` zeigt das Dashboard
3. Die Organisation wird korrekt geladen und angezeigt

